// Bausteine, die in mehreren Ansichten gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'
import { IconLeft, IconRight } from './icons'
import { padToCent, splitCent } from './util'
import type { Range } from './types'

// Kopfzeile plus Inhalt. Der Abstand oben haelt die Statusleiste des Handys
// frei - dort zeichnet das System selbst.
export function Screen({
  title,
  sub,
  onBack,
  right,
  children,
  wide,
}: {
  title: ReactNode
  sub?: ReactNode
  onBack?: () => void
  right?: ReactNode
  children?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="k-screen">
      <header className="k-head">
        {onBack ? (
          <button type="button" className="k-ic" onClick={onBack} aria-label="Zurück">
            <IconLeft />
          </button>
        ) : (
          <span className="k-ic-space" />
        )}
        <div className="k-head-mid">
          {typeof title === 'string' ? <div className="k-head-title">{title}</div> : title}
          {sub ? <div className="k-head-sub">{sub}</div> : null}
        </div>
        {right ?? <span className="k-ic-space" />}
      </header>
      <div className={`k-body${wide ? ' wide' : ''}`}>{children}</div>
    </div>
  )
}

// Zeitraum-Zeile: Pfeile links und rechts, dazwischen der Zeitraum als Knopf,
// der die Auswahl oeffnet. Uebersicht und Statistik teilen sie sich - der
// Zeitraum ist derselbe, also soll er auch gleich aussehen und gleich gehen.
//
// "right" haengt einen Knopf an den rechten Rand, ohne den Zeitraum aus der
// Mitte zu schieben - die Uebersicht braucht keine eigene Kopfzeile mehr,
// seit dort nur noch das Menue stand.
export function PeriodBar({
  range,
  gesamt,
  onPrev,
  onNext,
  onOpen,
  dir = 0,
  right,
}: {
  range: Range
  gesamt: boolean
  onPrev: () => void
  onNext: () => void
  onOpen: () => void
  dir?: number
  right?: ReactNode
}) {
  return (
    <div className="k-period">
      <button type="button" className="k-ic" onClick={onPrev} aria-label="Zeitraum zurück" disabled={gesamt}>
        <IconLeft />
      </button>
      <button
        type="button"
        className="k-period-btn"
        key={`p-${range.label}`}
        data-dir={dir}
        onClick={onOpen}
      >
        <span className="k-period-label">{range.label}</span>
        <span className="k-period-sub">{range.sub}</span>
      </button>
      <button type="button" className="k-ic" onClick={onNext} aria-label="Zeitraum vor" disabled={gesamt}>
        <IconRight />
      </button>
      {right ? <div className="k-period-right">{right}</div> : null}
    </div>
  )
}

export function IconButton({
  label,
  onClick,
  children,
  tone,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  tone?: string
}) {
  return (
    <button
      type="button"
      className={`k-ic${tone ? ` ${tone}` : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {children}
    </button>
  )
}

// Blatt von unten - Ionics Sheet-Modal. Wegwischen nach unten, Antippen des
// Grundes, Escape und die Animationen bringt Ionic mit; Kontor liefert nur
// den Inhalt und das Aussehen (ion-modal.k-sheet-modal in Kontor.css). Die
// Hoehe richtet sich nach dem Inhalt.
//
// onClose laeuft erst, wenn das Blatt ganz zu ist - egal wie es geschlossen
// wurde. Als Funktion bekommt der Inhalt "schliessen" mit, um es selbst
// zuzumachen (mit Animation).
export function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode | ((schliessen: () => void) => ReactNode)
}) {
  // Offen, solange die Ansicht im Stapel liegt. Schliesst der Inhalt es
  // selbst, blendet Ionic es aus und meldet sich danach ueber onDidDismiss.
  const [open, setOpen] = useState(true)
  // Immer die aktuelle Fassung von onClose aufrufen, auch wenn IonModal noch
  // den Handler vom ersten Rendern haelt.
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const schliessen = useCallback(() => setOpen(false), [])

  return (
    <IonModal
      isOpen={open}
      className="k-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={typeof title === 'string' ? title : undefined}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="k-sheet">
        {title ? (
          <div className="k-sheet-head">
            <div className="k-sheet-title">{title}</div>
            {subtitle ? <div className="k-sheet-sub">{subtitle}</div> : null}
          </div>
        ) : null}
        {typeof children === 'function' ? children(schliessen) : children}
      </div>
    </IonModal>
  )
}

export type MoneySign = 'auto' | 'minus' | 'plus' | 'none'

// Betrag mit kleinerem Cent-Teil.
export function Money({ cent, sign = 'none', className = '' }: { cent: number; sign?: MoneySign; className?: string }) {
  const { neg, int, frac } = splitCent(cent)
  let prefix = ''
  if (sign === 'minus') prefix = '−'
  else if (sign === 'plus') prefix = '+'
  else if (sign === 'auto') prefix = neg ? '−' : '+'
  else if (neg) prefix = '−'
  return (
    <span className={`k-money ${className}`}>
      {prefix}
      {int}
      <span className="k-money-frac">,{frac}</span>
    </span>
  )
}

// Der Betrag ueber einem Ziffernfeld (Zustand aus useBetrag). Bei jeder
// Eingabe tickt er kurz - der Schluessel wechselt, die Animation laeuft neu
// an; eine Taste, die nichts bewirkt, laesst ihn wackeln. Leer steht er blass
// da, wie ein Platzhalter, nicht wie ein echter Betrag von null.
export function Amount({
  text,
  signal,
  sign = 'none',
  variant,
  color,
  caret = false,
}: {
  text: string
  signal: { n: number; wackelt: boolean }
  sign?: MoneySign
  variant?: 'small' | 'sheet'
  color?: string
  caret?: boolean
}) {
  return (
    <div
      className={`k-amount${variant ? ` ${variant}` : ''}${text ? '' : ' empty'}`}
      style={color ? { color } : undefined}
    >
      <span
        className={`k-amount-val${signal.n === 0 ? '' : signal.wackelt ? ' wackelt' : ' tickt'}`}
        key={signal.n}
      >
        <Money cent={padToCent(text)} sign={sign} />
        <span className="k-amount-cur">€</span>
      </span>
      {caret ? <span className="k-caret" style={{ background: color ?? 'var(--ink)' }} /> : null}
    </div>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`k-toggle${on ? ' on' : ''}`}
      onClick={() => onChange(!on)}
    >
      <span className="k-toggle-knob" />
    </button>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  tone,
}: {
  options: { id: T; label: string }[]
  value: T
  onChange: (id: T) => void
  tone?: string
}) {
  return (
    <div className="k-seg">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className={`k-seg-item${o.id === value ? ' on' : ''}`}
          style={o.id === value && tone ? { color: tone } : undefined}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  if (onClick) {
    return (
      <button type="button" className={`k-card as-button ${className}`} onClick={onClick}>
        {children}
      </button>
    )
  }
  return <div className={`k-card ${className}`}>{children}</div>
}

export function Label({ children }: { children: ReactNode }) {
  return <div className="k-label">{children}</div>
}

export function Empty({ title, hint, action }: { title: ReactNode; hint?: ReactNode; action?: ReactNode }) {
  return (
    <div className="k-empty">
      <div className="k-empty-title">{title}</div>
      {hint ? <div className="k-empty-hint">{hint}</div> : null}
      {action}
    </div>
  )
}
