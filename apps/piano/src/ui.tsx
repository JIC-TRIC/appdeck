// Bausteine, die in mehreren Ansichten gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'
import { IconCheck, IconLeft } from './icons'
import { HAND_LEVELS, MEMO_LEVELS, difficultyInfo, stepCount, stepsOn, type Phase } from './model'
import type { Difficulty, Level, Piece, Progress } from './types'
import { hueOf, thumbnailUrl } from './util'

// ---------- Seiten ----------

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) einfach eine
// Ebene ueber apps/.
export function toLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

/**
 * Startseite eines Tabs: oben "‹ Apps" (ein Tipp zum Launcher, wie in Stash und
 * Loci) in derselben Leiste wie auf Unterseiten, darunter scrollt alles, auch
 * der grosse Titel.
 */
export function TabPage({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`p-screen ${className}`}>
      <header className="p-bar">
        <button type="button" className="p-back" onClick={toLauncher}>
          <IconLeft />
          <span>Apps</span>
        </button>
      </header>
      <div className="p-body">{children}</div>
    </div>
  )
}

/** Grosser Titel mit Zeile darueber und Knoepfen rechts. */
export function Heading({ kicker, title, right }: { kicker?: ReactNode; title: ReactNode; right?: ReactNode }) {
  return (
    <header className="p-head">
      <div className="p-head-l">
        {kicker ? <p className="p-lbl">{kicker}</p> : null}
        <h1 className="p-h1">{title}</h1>
      </div>
      {right ? <div className="p-head-r">{right}</div> : null}
    </header>
  )
}

/** Unterseite: Zurueck-Leiste (mit dem Titel der Seite darunter), Inhalt scrollt. */
export function Page({
  backLabel,
  onBack,
  right,
  children,
  className = '',
}: {
  backLabel: string
  onBack: () => void
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`p-screen ${className}`}>
      <header className="p-bar">
        <button type="button" className="p-back" onClick={onBack}>
          <IconLeft />
          <span>{backLabel}</span>
        </button>
        {right ? <div className="p-bar-r">{right}</div> : null}
      </header>
      <div className="p-body">{children}</div>
    </div>
  )
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="p-ib" aria-label={label} onClick={onClick}>
      {children}
    </button>
  )
}

// ---------- Blaetter ----------

// Blatt von unten - Ionics Sheet-Modal wie bei Kontor und Steady. Wegwischen,
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
      className="p-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={label}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="p-sheet">{typeof children === 'function' ? children(schliessen) : children}</div>
    </IonModal>
  )
}

/** Kopf eines Formular-Blatts: Abbrechen · Titel · Sichern */
export function SheetHead({
  title,
  onCancel,
  onDone,
  doneLabel = 'Sichern',
  doneDisabled,
}: {
  title: string
  onCancel: () => void
  onDone?: () => void
  doneLabel?: string
  doneDisabled?: boolean
}) {
  return (
    <div className="p-sheet-head">
      <button type="button" className="l" onClick={onCancel}>
        Abbrechen
      </button>
      <b>{title}</b>
      {onDone ? (
        <button type="button" className="r" onClick={onDone} disabled={doneDisabled}>
          {doneLabel}
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

export interface ListItem {
  key: string
  label: ReactNode
  sub?: ReactNode
  icon?: ReactNode
  checked?: boolean
  danger?: boolean
  disabled?: boolean
  /** Blatt bleibt offen (z. B. Mehrfachauswahl) */
  keepOpen?: boolean
  onPick: () => void
}

// Blatt mit einer Auswahlliste. Was gewaehlt wurde, laeuft erst, wenn das
// Blatt zu ist - so faehrt eine neue Seite nicht unter dem schliessenden Blatt los.
export function ListSheet({
  label,
  title,
  note,
  items,
  onClose,
  children,
}: {
  label: string
  title?: ReactNode
  note?: ReactNode
  items: ListItem[]
  onClose: () => void
  children?: ReactNode
}) {
  const after = useRef<(() => void) | null>(null)
  return (
    <Sheet
      label={label}
      onClose={() => {
        const f = after.current
        after.current = null
        onClose()
        f?.()
      }}
    >
      {(zu) => (
        <div className="p-sheet-pad">
          {title ? <div className="p-sheet-title">{title}</div> : null}
          {children}
          {items.length ? (
            <div className="p-list">
              {items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  className={`p-li${it.danger ? ' danger' : ''}`}
                  disabled={it.disabled}
                  onClick={() => {
                    if (it.keepOpen) it.onPick()
                    else {
                      after.current = it.onPick
                      zu()
                    }
                  }}
                >
                  {it.icon ? <span className="p-li-icon">{it.icon}</span> : null}
                  <span className="p-li-main">
                    <span className="p-li-label">{it.label}</span>
                    {it.sub ? <span className="p-li-sub">{it.sub}</span> : null}
                  </span>
                  {it.checked ? (
                    <span className="p-li-check">
                      <IconCheck />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}
          {note ? <p className="p-note">{note}</p> : null}
        </div>
      )}
    </Sheet>
  )
}

// ---------- Bedienelemente ----------

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  disabled,
  className = '',
}: {
  options: { id: T; label: string }[]
  value: T | null
  onChange: (id: T) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={`p-seg ${className}`} role="radiogroup" aria-label={label}>
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

// ---------- Stueck ----------

const KEY_GROUPS = [[0, 1, 2, 3], [4, 5], [6], [7, 8]]

/** Lernstand als kleine Klaviatur: 9 Tasten in vier Gruppen, Auswendig gestrichelt (freiwillig). */
export function Keys({ progress, wide }: { progress: Progress; wide?: boolean }) {
  const on = stepsOn(progress)
  return (
    <span className={`p-keys${wide ? ' wide' : ''}`} role="img" aria-label={`Lernstand ${stepCount(progress)} von 9`}>
      {KEY_GROUPS.map((g, gi) => (
        <span key={gi} className={`g${gi === 3 ? ' opt' : ''}`}>
          {g.map((i) => (
            <i key={i} className={on[i] ? 'on' : undefined} />
          ))}
        </span>
      ))}
    </span>
  )
}

/** Schwierigkeit als Balken (1 = sehr leicht … 5 = sehr schwer) */
export function DifficultyBars({ difficulty }: { difficulty: Difficulty }) {
  const bars = difficultyInfo(difficulty).bars
  return (
    <span className="p-lvl" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <i key={n} className={n <= bars ? 'on' : undefined} />
      ))}
    </span>
  )
}

// Vorschaubild von YouTube. Ohne Link, ohne Netz oder bei einem Fehler bleibt
// eine getoente Flaeche mit Tastenstreifen stehen (Farbton fest pro Stueck).
export function Thumb({
  piece,
  src: srcOverride,
  className = '',
  tag,
  children,
}: {
  piece?: Piece
  /** statt des Bilds des Stuecks, z. B. die Vorschau im Formular */
  src?: string | null
  className?: string
  tag?: string
  children?: ReactNode
}) {
  const src = srcOverride !== undefined ? srcOverride : piece ? piece.thumbnail || thumbnailUrl(piece.youtubeUrl) : null
  const [failed, setFailed] = useState<string | null>(null)
  return (
    <span className={`p-thumb ${className}`} style={{ '--h': hueOf(piece?.id ?? '') } as CSSProperties}>
      {src && failed !== src ? <img src={src} alt="" loading="lazy" onError={() => setFailed(src)} /> : null}
      {tag ? <span className="p-thumb-tag">{tag}</span> : null}
      {children}
    </span>
  )
}

/** Die Schalter einer Gruppe des Lernwegs - auf der Stueck-Seite und nach dem Ueben. */
export function PhaseControls({
  progress,
  phase,
  onChange,
}: {
  progress: Progress
  phase: Phase
  onChange: (next: Progress) => void
}) {
  const hand = HAND_LEVELS.map((label, id) => ({ id: id as Level, label }))
  if (phase === 'hands') {
    return (
      <div className="p-phase-rows">
        <div className="p-phase-row">
          <span className="p-phase-name">Rechts</span>
          <Segmented label="Rechte Hand" options={hand} value={progress.rightHand} onChange={(v) => onChange({ ...progress, rightHand: v })} />
        </div>
        <div className="p-phase-row">
          <span className="p-phase-name">Links</span>
          <Segmented label="Linke Hand" options={hand} value={progress.leftHand} onChange={(v) => onChange({ ...progress, leftHand: v })} />
        </div>
      </div>
    )
  }
  if (phase === 'together') {
    return <Segmented label="Hände zusammen" options={hand} value={progress.together} onChange={(v) => onChange({ ...progress, together: v })} />
  }
  if (phase === 'dynamics') {
    return (
      <Segmented
        label="Dynamik"
        options={[
          { id: 0, label: 'Noch nicht' },
          { id: 1, label: 'Erledigt' },
        ]}
        value={progress.dynamics ? 1 : 0}
        onChange={(v) => onChange({ ...progress, dynamics: v === 1 })}
      />
    )
  }
  return (
    <Segmented
      label="Auswendig"
      options={MEMO_LEVELS.map((label, id) => ({ id: id as Level, label }))}
      value={progress.memorized}
      onChange={(v) => onChange({ ...progress, memorized: v })}
    />
  )
}
