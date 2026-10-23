// Bausteine, die auf mehreren Seiten und in den Blaettern gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'
import { IconKalender } from './icons'
import { teile } from './liste'
import { faelligText, plusTage } from './tage'

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) eine Ebene ueber apps/.
export function zumLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

/** Knoepfe am Schnellfeld: ein Tipp darauf nimmt dem Textfeld nicht den Fokus - die Tastatur bleibt stehen. */
export const fokusBleibt = (e: { preventDefault: () => void }) => e.preventDefault()

/** Farbe eines Ordners als CSS-Variable --o (Punkte, Kreise, Reiter). */
export const mitFarbe = (wert: string) => ({ '--o': wert }) as CSSProperties

/** Text mit hervorgehobenen Treffern der Suche. */
export function Markiert({ text, q }: { text: string; q: string }) {
  return (
    <>
      {teile(text, q).map((s, i) => (s.treffer ? <mark key={i}>{s.text}</mark> : <span key={i}>{s.text}</span>))}
    </>
  )
}

/**
 * Heute, Morgen, Datum … (und im Todo Ohne) als Chips. Ein Tipp auf den
 * gewaehlten nimmt ihn wieder heraus. Datum oeffnet den Kalender des Telefons
 * ueber ein unsichtbares Datumsfeld.
 */
export function DatumChips({
  wert,
  heute,
  onWahl,
  ohne,
  halten,
}: {
  wert: string | null
  heute: string
  onWahl: (tag: string | null) => void
  ohne?: boolean
  /** Fokus im Schnellfeld halten (nicht fuer das Datumsfeld selbst) */
  halten?: boolean
}) {
  const morgen = plusTage(heute, 1)
  const anderer = wert !== null && wert !== heute && wert !== morgen
  const chip = (tag: string, text: string) => (
    <button
      type="button"
      className={`t-chip${wert === tag ? ' sel' : ''}`}
      aria-pressed={wert === tag}
      onMouseDown={halten ? fokusBleibt : undefined}
      onClick={() => onWahl(wert === tag ? null : tag)}
    >
      {text}
    </button>
  )
  return (
    <>
      {chip(heute, 'Heute')}
      {chip(morgen, 'Morgen')}
      <label className={`t-chip t-datum${anderer ? ' sel' : ''}`}>
        <IconKalender />
        {anderer && wert ? faelligText(wert, heute) : 'Datum'}
        <input type="date" value={wert ?? ''} onChange={(e) => onWahl(e.target.value || null)} aria-label="Fällig am" />
      </label>
      {ohne ? (
        <button type="button" className={`t-chip${wert === null ? ' sel' : ''}`} aria-pressed={wert === null} onClick={() => onWahl(null)}>
          Ohne
        </button>
      ) : null}
    </>
  )
}

// Blatt von unten - Ionics Sheet-Modal wie in Kontor, Loci und Form.
// Wegwischen, Antippen des Grundes und die Animation bringt Ionic mit, die
// Hoehe richtet sich nach dem Inhalt. onClose laeuft erst, wenn es ganz zu
// ist; als Funktion bekommt der Inhalt "schliessen" mit, um es selbst zuzumachen.
export function Blatt({
  label,
  onClose,
  onPresent,
  children,
}: {
  label: string
  onClose: () => void
  /** sobald das Blatt ganz oben steht (z. B. Textfelder neu messen) */
  onPresent?: () => void
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
      className="t-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={label}
      onDidPresent={onPresent}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="t-sheet ion-content-scroll-host">{typeof children === 'function' ? children(schliessen) : children}</div>
    </IonModal>
  )
}

/** Kopf eines Blatts: links ein leiser Knopf, Mitte Titel, rechts der Hauptknopf. */
export function BlattKopf({ links, titel, unter, rechts }: { links?: ReactNode; titel?: string; unter?: string; rechts?: ReactNode }) {
  return (
    <div className="t-bs-kopf">
      <span className="l">{links}</span>
      <span className="m">
        {titel ? <b>{titel}</b> : null}
        {unter ? <small>{unter}</small> : null}
      </span>
      <span className="r">{rechts}</span>
    </div>
  )
}
