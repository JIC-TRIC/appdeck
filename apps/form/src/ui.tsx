// Bausteine, die auf mehreren Seiten gleich aussehen muessen.

import type { ReactNode } from 'react'
import { IconLeft } from './icons'
import { urteil } from './calc'
import { formatDiff, mitEinheit } from './util'
import type { Wert } from './types'

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) eine Ebene ueber apps/.
export function zumLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

/** Seite: Kopfleiste (links, Mitte, rechts) und darunter der scrollende Inhalt. */
export function Seite({
  links,
  titel,
  rechts,
  unten,
  children,
}: {
  links?: ReactNode
  titel?: ReactNode
  rechts?: ReactNode
  /** Steht fest unter dem Inhalt (z. B. der Hauptknopf). */
  unten?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="f-screen">
      <header className="f-bar">
        <div className="f-bar-l">{links}</div>
        <div className="f-bar-mid">{titel}</div>
        <div className="f-bar-r">{rechts}</div>
      </header>
      <div className="f-body">{children}</div>
      {unten ? <div className="f-unten">{unten}</div> : null}
    </div>
  )
}

export function Zurueck({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="f-back" onClick={onClick}>
      <IconLeft />
      {label}
    </button>
  )
}

export function TextKnopf({
  children,
  onClick,
  stark,
  disabled,
}: {
  children: ReactNode
  onClick: () => void
  stark?: boolean
  disabled?: boolean
}) {
  return (
    <button type="button" className={`f-textbtn${stark ? ' stark' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}

export function Segment<T extends string>({
  optionen,
  wert,
  onWahl,
  label,
}: {
  optionen: { id: T; label: string }[]
  wert: T
  onWahl: (id: T) => void
  label: string
}) {
  return (
    <div className="f-seg" role="radiogroup" aria-label={label}>
      {optionen.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={o.id === wert}
          className={o.id === wert ? 'an' : ''}
          onClick={() => onWahl(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Veraenderung mit Vorzeichen und Einheit - orange, wenn sie in die gewuenschte Richtung geht. */
export function Diff({ wert, diff }: { wert: Wert; diff: number }) {
  return <em className={`f-diff ${urteil(wert.richtung, diff)}`}>{mitEinheit(formatDiff(diff), wert.einheit)}</em>
}

export const RICHTUNG_TEXT: Record<Wert['richtung'], string> = {
  mehr: 'Mehr ist besser',
  weniger: 'Weniger ist besser',
  egal: 'Ohne Richtung',
}
