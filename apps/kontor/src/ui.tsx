// Bausteine, die in mehreren Ansichten gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { IconLeft, IconRight } from './icons'
import { splitCent } from './util'
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

// Blatt von unten. Schliesst beim Antippen des Grundes, mit Escape - und indem
// man es nach unten wegwischt. Letzteres erwartet jeder, der ein Handy in der
// Hand haelt; ohne das wirkt das Blatt festgeklebt.
const SHEET_ZU = 110 // ab dieser Zugstrecke in px schliesst es
const SHEET_DAUER = 200

export function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  // Als Funktion bekommt der Inhalt "schliessen" mit - dann laeuft die
  // Ausblende-Animation, bevor onClose das Blatt entfernt.
  children: ReactNode | ((schliessen: () => void) => ReactNode)
}) {
  const [zug, setZug] = useState(0)
  const [schliesst, setSchliesst] = useState(false)
  const start = useRef<number | null>(null)
  const blatt = useRef<HTMLDivElement>(null)

  const schliessen = useCallback(() => {
    setSchliesst(true)
    window.setTimeout(onClose, SHEET_DAUER)
  }, [onClose])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') schliessen()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [schliessen])

  const onTouchStart = (e: TouchEvent) => {
    // Steht der Inhalt nicht ganz oben, gehoert die Geste dem Scrollen.
    if (blatt.current && blatt.current.scrollTop > 0) return
    start.current = e.touches[0].clientY
  }

  const onTouchMove = (e: TouchEvent) => {
    if (start.current === null) return
    const d = e.touches[0].clientY - start.current
    // Nach oben gibt es nichts zu ziehen, nur ein bisschen Nachgiebigkeit.
    setZug(d > 0 ? d : d / 4)
  }

  const onTouchEnd = () => {
    if (start.current === null) return
    start.current = null
    if (zug > SHEET_ZU) schliessen()
    else setZug(0)
  }

  return (
    <div className={`k-sheet-wrap${schliesst ? ' closing' : ''}`}>
      <div className="k-scrim" onClick={schliessen} />
      <div
        className={`k-sheet${zug ? ' dragging' : ''}`}
        ref={blatt}
        role="dialog"
        aria-label={typeof title === 'string' ? title : undefined}
        style={zug ? { transform: `translateY(${Math.max(0, zug)}px)` } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="k-sheet-grab" />
        {title ? (
          <div className="k-sheet-head">
            <div className="k-sheet-title">{title}</div>
            {subtitle ? <div className="k-sheet-sub">{subtitle}</div> : null}
          </div>
        ) : null}
        {typeof children === 'function' ? children(schliessen) : children}
      </div>
    </div>
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
