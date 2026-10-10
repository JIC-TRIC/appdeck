// Bausteine, die in mehreren Ansichten gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'
import { IconCheck, IconFlame, IconLeft } from './icons'
import { messwert, progress, ruleAt } from './calc'
import { colorOf } from './data'
import { addDays, formatValue, formatValueShort, mondayOf } from './util'
import { NICHT_GESCHAFFT, type DayState, type Habit } from './types'

// Farbe einer Gewohnheit als CSS-Variable --h: alle Punkte, Kaesten und
// Namen darunter faerben sich damit.
export const hue = (h: Habit | string): CSSProperties =>
  ({ '--h': colorOf(typeof h === 'string' ? h : h.color) }) as CSSProperties

// Unterseite: Kopfzeile plus scrollender Inhalt. Links Zurueck oder ein
// Textknopf ("Abbrechen"), rechts optional eine Aktion.
export function Screen({
  title,
  color,
  onBack,
  left,
  right,
  children,
  className = '',
}: {
  title: ReactNode
  color?: string
  onBack?: () => void
  left?: ReactNode
  right?: ReactNode
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={`s-screen ${className}`}>
      <header className="s-nav">
        <div className="s-nav-l">
          {left ??
            (onBack ? (
              <button type="button" className="s-back" onClick={onBack} aria-label="Zurück">
                <IconLeft />
              </button>
            ) : null)}
        </div>
        <div className="s-nav-mid" style={color ? { color } : undefined}>
          {title}
        </div>
        <div className="s-nav-r">{right}</div>
      </header>
      <div className="s-body">{children}</div>
    </div>
  )
}

export function TextButton({
  children,
  onClick,
  strong,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  strong?: boolean
  disabled?: boolean
}) {
  return (
    <button type="button" className={`s-textbtn${strong ? ' strong' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

// Blatt von unten - Ionics Sheet-Modal, wie bei Kontor. Wegwischen,
// Antippen des Grundes und die Animationen bringt Ionic mit. onClose laeuft
// erst, wenn das Blatt ganz zu ist; als Funktion bekommt der Inhalt
// "schliessen" mit, um es selbst zuzumachen (mit Animation).
export function Sheet({
  label,
  onClose,
  children,
}: {
  label: string
  onClose: () => void
  children: ReactNode | ((schliessen: () => void) => ReactNode)
}) {
  const [open, setOpen] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const schliessen = useCallback(() => setOpen(false), [])

  return (
    <IonModal
      isOpen={open}
      className="s-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={label}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="s-sheet ion-content-scroll-host">{typeof children === 'function' ? children(schliessen) : children}</div>
    </IonModal>
  )
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  disabled?: boolean
}) {
  return (
    <div className={`s-seg${disabled ? ' locked' : ''}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.id)}
          type="button"
          role="radio"
          aria-checked={o.id === value}
          className={o.id === value ? 'on' : ''}
          disabled={disabled}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Ein Tag im Raster: Punkt (erledigt), Ring (Ruhetag), Kreuz (nicht
// geschafft), leerer Kasten (verpasst, aber nichts eingetragen - vielleicht
// nur vergessen), winziger Punkt (noch nicht begonnen). Ein Ruhetag bleibt
// ein Ring, auch wenn er als nicht geschafft eingetragen ist: ein Kreuz gibt
// es nur, wo die Serie bricht. Mit "menge" steht statt Punkt und Kreuz die
// eingetragene Zahl - in der Farbe, wenn sie das Ziel erreicht. Verfehlt sie
// das Ziel an einem Ruhetag, steht sie in einem Ring wie der Ruhetag: die
// Serie haelt.
const CELL: Record<DayState, string> = {
  done: 'd',
  rest: 'r',
  miss: 'x',
  off: 'n',
  open: 'o',
  future: 'f',
}

export function Dot({
  state,
  eintrag,
  menge,
  pop,
}: {
  state: DayState
  eintrag?: number
  menge?: boolean
  pop?: boolean
}) {
  const wert = messwert(eintrag)
  if (menge && wert !== undefined && (state === 'done' || state === 'rest' || state === 'miss')) {
    const text = formatValueShort(wert)
    // Vier Ziffern ("2850") werden enger gesetzt, sonst laufen die Spalten ineinander.
    const lang = text.replace(',', '').length >= 4 ? ' lang' : ''
    const art = state === 'done' ? ' ok' : state === 'rest' ? ' ruhe' : ''
    return (
      <span className={`s-c z${lang}${art}${pop ? ' pop' : ''}`}>
        <b>{text}</b>
      </span>
    )
  }
  const nein = eintrag === NICHT_GESCHAFFT
  let cls = CELL[state]
  if (state === 'miss' && eintrag === undefined) cls = 'l'
  else if (state === 'open' && nein) cls = 'x'
  return (
    <span className={`s-c ${cls}${pop ? ' pop' : ''}`}>
      <i />
    </span>
  )
}

// Der breite Kasten rechts im Raster: heute (oder der juengste Tag im
// Fenster) mit Haken bzw. Tageswert. Bei Mengen zeigt ein Balken am unteren
// Rand, wie weit es noch zum Ziel ist. "frei": heute ist noch ein Ruhetag
// uebrig - der ganze Kasten bekommt einen Rand in der Farbe, solange nichts
// erledigt ist (bis 10.10.2026 ein kleiner Ring darin). Ein vergangener
// Ruhetag im zurueckgeblaetterten Fenster sieht genauso aus. Heute faellig
// sieht aus wie jeder offene Tag: grauer Rand, heute zu machen.
export function DayBox({
  habit,
  state,
  value: eintrag,
  day,
  frei,
  pop,
}: {
  habit: Habit
  state: DayState
  value: number | undefined
  day: string
  frei?: boolean
  pop?: boolean
}) {
  const cls = pop ? ' pop' : ''
  if (state === 'off') return <span className="s-t off"><i /></span>
  const value = messwert(eintrag)
  if (state === 'done') {
    return habit.kind === 'check' ? (
      <span className={`s-t done${cls}`}>
        <IconCheck />
      </span>
    ) : (
      <span className={`s-t met${cls}`}>{formatValue(value ?? 0)}</span>
    )
  }
  // Darf leer bleiben: heute frei oder ein vergangener Ruhetag.
  const ruhe = state === 'rest' || frei ? ' ruhe' : ''
  if (value === undefined) {
    // Nicht geschafft: Kreuz im Kasten - aber nur heute. Am vergangenen
    // Ruhetag gibt es kein Kreuz, ein Kreuz zeigt nur, wo die Serie bricht.
    // Sonst leer, bei Mengen mit der Einheit.
    const nein = eintrag === NICHT_GESCHAFFT && state !== 'rest'
    return (
      <span className={`s-t${ruhe}${nein ? ' nein' : ''}${ruhe || nein ? cls : ''}`}>
        {nein ? <i /> : habit.kind === 'amount' ? <span className="u">{habit.unit || '–'}</span> : null}
      </span>
    )
  }
  // Menge eingetragen, Ziel (noch) nicht erreicht. Heute mit Balken, sonst
  // - oder ueber "hoechstens" - still und grau. Heute frei oder am Ruhetag
  // (vergangener Tag im zurueckgeblaetterten Fenster) mit Rand in der Farbe:
  // die Serie haelt.
  const p = progress(habit, value, day)
  const still = p.over || state !== 'open'
  return (
    <span className={`s-t${still ? ' over' : ''}${ruhe}${cls}`}>
      {formatValue(value)}
      {!still ? <i className="bar" style={{ width: `${p.share * 100}%` }} /> : null}
    </span>
  )
}

// Serie neben dem Namen im Raster. Ohne Serie steht dort nichts.
export function Streak({ n, tick }: { n: number; tick?: boolean }) {
  if (!n) return null
  return (
    <span className="s-st" aria-label={`Serie ${n} Tage`}>
      <IconFlame />
      <span className={tick ? 'tick' : undefined} key={tick ? n : undefined}>{n}</span>
    </span>
  )
}

export function Card({ title, aside, children, className = '' }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`s-card ${className}`}>
      {title ? (
        <h2 className="s-card-h">
          {title}
          {aside ? <span className="s-card-aside">{aside}</span> : null}
        </h2>
      ) : null}
      {children}
    </section>
  )
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="s-label">{children}</div>
}

// Regel in Kurzform fuer die Zeile im Raster - leer bei "taeglich abhaken".
// Das Ziel zuerst und der Rhythmus knapp: wird es unter dem Namen eng, faellt
// hinten der Rhythmus ab, nicht das Ziel.
export function ruleShort(h: Habit, day: string) {
  const perWeek = ruleAt(h.rhythm, addDays(mondayOf(day), 6))?.perWeek ?? 7
  const parts: string[] = []
  const g = h.kind === 'amount' ? ruleAt(h.goal, day) : undefined
  if (g) parts.push(`${g.dir === 'min' ? '≥' : '≤'} ${formatValue(g.target)} ${h.unit}`.trim())
  if (perWeek < 7) parts.push(`${perWeek}×/Wo.`)
  return parts.join(' · ')
}

// Ausgeschrieben fuer die Detailansicht: "Täglich · mindestens 150 g".
export function ruleLong(h: Habit, day: string) {
  const perWeek = ruleAt(h.rhythm, addDays(mondayOf(day), 6))?.perWeek ?? 7
  const parts = [perWeek < 7 ? `${perWeek}× pro Woche` : 'Täglich']
  const g = h.kind === 'amount' ? ruleAt(h.goal, day) : undefined
  if (g) parts.push(`${g.dir === 'min' ? 'mindestens' : 'höchstens'} ${formatValue(g.target)} ${h.unit}`.trim())
  return parts.join(' · ')
}
