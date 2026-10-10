// Bausteine, die auf mehreren Seiten gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'
import { IconLeft, IconMinus, IconPlus } from './icons'
import { urteil } from './calc'
import { formatDiff, mitEinheit } from './util'
import type { AppBereich, Wert } from './types'

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

/** Werte oder Training - in der Kopfleiste der beiden Startseiten. */
export function Umschalter({ wert, onWahl }: { wert: AppBereich; onWahl: (b: AppBereich) => void }) {
  return (
    <div className="f-seg f-seg-bar" role="radiogroup" aria-label="Bereich">
      {(['werte', 'training'] as const).map((b) => (
        <button
          key={b}
          type="button"
          role="radio"
          aria-checked={b === wert}
          className={b === wert ? 'an' : ''}
          onClick={() => onWahl(b)}
        >
          {b === 'werte' ? 'Werte' : 'Training'}
        </button>
      ))}
    </div>
  )
}

/** Minus, Zahl, Plus - fuer Pause, Saetze und Wdh-Bereich. */
export function Stepper({
  text,
  onMinus,
  onPlus,
  label,
  minusAus,
  plusAus,
}: {
  text: string
  onMinus: () => void
  onPlus: () => void
  label: string
  minusAus?: boolean
  plusAus?: boolean
}) {
  return (
    <span className="f-stepper">
      <button type="button" className="f-rund" onClick={onMinus} disabled={minusAus} aria-label={`${label} weniger`}>
        <IconMinus />
      </button>
      <b aria-live="polite">{text}</b>
      <button type="button" className="f-rund" onClick={onPlus} disabled={plusAus} aria-label={`${label} mehr`}>
        <IconPlus />
      </button>
    </span>
  )
}

// Blatt von unten - Ionics Sheet-Modal wie in Kontor und Loci. Wegwischen,
// Antippen des Grundes und die Animation bringt Ionic mit, die Hoehe richtet
// sich nach dem Inhalt. onClose laeuft erst, wenn es ganz zu ist; als
// Funktion bekommt der Inhalt "schliessen" mit, um es selbst zuzumachen.
export function Blatt({
  label,
  onClose,
  children,
}: {
  label: string
  onClose: () => void
  children: ReactNode | ((schliessen: () => void) => ReactNode)
}) {
  const [offen, setOffen] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const schliessen = useCallback(() => setOffen(false), [])

  return (
    <IonModal
      isOpen={offen}
      className="f-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={label}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="f-sheet ion-content-scroll-host">{typeof children === 'function' ? children(schliessen) : children}</div>
    </IonModal>
  )
}

// Ganze Seite von unten (Uebung hinzufuegen): eigene Kopfleiste, scrollt
// selbst. Zu geht es ueber die Knoepfe in der Kopfleiste.
export function Vollbild({
  label,
  onClose,
  children,
}: {
  label: string
  onClose: () => void
  children: (schliessen: () => void) => ReactNode
}) {
  const [offen, setOffen] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const schliessen = useCallback(() => setOffen(false), [])

  return (
    <IonModal isOpen={offen} className="f-voll-modal" aria-label={label} onDidDismiss={() => onCloseRef.current()}>
      <div className="ion-page f-voll">{children(schliessen)}</div>
    </IonModal>
  )
}
