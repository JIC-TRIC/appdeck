// Bausteine, die in mehreren Ansichten gleich aussehen oder sich gleich verhalten muessen.

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { IonContent, IonModal } from '@ionic/react'
import { IconClose, IconLeft } from './icons'
import { KARTE } from './karten'
import type { Loesung } from './wochentag'

// ---------- Kopf ----------

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) eine Ebene ueber apps/.
function zumLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

export function AppsKnopf() {
  return (
    <button type="button" className="l-apps" onClick={zumLauncher}>
      <IconLeft />
      Apps
    </button>
  )
}

// ---------- Uhr ----------

/**
 * Stoppuhr mit Pausen, gerechnet mit Zeitstempeln (laeuft im Hintergrund weiter).
 * `pausiert` haelt sie an, `neu()` startet sie von vorn.
 */
export function useStoppuhr(pausiert: boolean) {
  const s = useRef({ start: Date.now(), pausen: 0, seit: pausiert ? Date.now() : (null as number | null) })

  useEffect(() => {
    const u = s.current
    if (pausiert && u.seit === null) u.seit = Date.now()
    if (!pausiert && u.seit !== null) {
      u.pausen += Date.now() - u.seit
      u.seit = null
    }
  }, [pausiert])

  const zeit = useCallback(() => {
    const u = s.current
    return (u.seit ?? Date.now()) - u.start - u.pausen
  }, [])

  const neu = useCallback((jetztPausiert: boolean) => {
    const jetzt = Date.now()
    s.current = { start: jetzt, pausen: 0, seit: jetztPausiert ? jetzt : null }
  }, [])

  return { zeit, neu }
}

/**
 * Laufende Anzeige einer Zeit. Schreibt selbst in den Text (einmal pro Bild),
 * statt bei jedem Bild die ganze Ansicht neu zu zeichnen.
 */
export function Laufuhr({ zeit, laeuft, format }: { zeit: () => number; laeuft: boolean; format: (ms: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null)
  useLayoutEffect(() => {
    let id = 0
    const male = () => {
      if (ref.current) ref.current.textContent = format(zeit())
      if (laeuft) id = requestAnimationFrame(male)
    }
    male()
    return () => cancelAnimationFrame(id)
  }, [zeit, laeuft, format])
  return <span ref={ref} className="l-num" />
}

// ---------- Blaetter ----------

// Blatt von unten - Ionics Sheet-Modal wie bei Piano. Wegwischen, Antippen des
// Grundes und die Animationen bringt Ionic mit. onClose laeuft erst, wenn das
// Blatt ganz zu ist; als Funktion bekommt der Inhalt "schliessen" mit.
// `gross`: fast volle Hoehe mit eigenem Scrollbereich (Anleitung).
export function Blatt({
  label,
  gross,
  onClose,
  children,
}: {
  label: string
  gross?: boolean
  onClose: () => void
  children: ReactNode | ((schliessen: () => void) => ReactNode)
}) {
  const [offen, setOffen] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const schliessen = useCallback(() => setOffen(false), [])
  const inhalt = typeof children === 'function' ? children(schliessen) : children

  return (
    <IonModal
      isOpen={offen}
      className={`l-sheet-modal${gross ? ' gross' : ''}`}
      breakpoints={gross ? [0, 0.94] : [0, 1]}
      initialBreakpoint={gross ? 0.94 : 1}
      aria-label={label}
      onDidDismiss={() => onCloseRef.current()}
    >
      {gross ? <IonContent className="l-sheet-content">{inhalt}</IonContent> : <div className="l-sheet">{inhalt}</div>}
    </IonModal>
  )
}

export function BlattKopf({ titel, onClose, gross }: { titel: string; onClose: () => void; gross?: boolean }) {
  return (
    <div className="l-sheet-head">
      {gross ? <h1 className="l-sheet-h1">{titel}</h1> : <h2 className="l-sheet-h2">{titel}</h2>}
      <button type="button" className="l-x" aria-label="Schließen" onClick={onClose}>
        <span>
          <IconClose />
        </span>
      </button>
    </div>
  )
}

// ---------- Bedienelemente ----------

export function Schalter({ an, label, onChange }: { an: boolean; label: string; onChange: (an: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={an} aria-label={label} className={`l-switch${an ? ' an' : ''}`} onClick={() => onChange(!an)}>
      <span />
    </button>
  )
}

/** Zweimal tippen statt Dialog (wie Kontor und Steady): erst scharf machen, dann bestaetigen. */
export function Bestaetigen({ label, frage, onConfirm }: { label: string; frage: string; onConfirm: () => void }) {
  const [scharf, setScharf] = useState(false)
  useEffect(() => {
    if (!scharf) return
    const id = window.setTimeout(() => setScharf(false), 4000)
    return () => window.clearTimeout(id)
  }, [scharf])
  return (
    <button
      type="button"
      className={`l-reset${scharf ? ' scharf' : ''}`}
      onClick={() => {
        if (!scharf) return setScharf(true)
        setScharf(false)
        onConfirm()
      }}
    >
      {scharf ? frage : label}
    </button>
  )
}

// ---------- Inhalte ----------

/** Der Rechenweg einer Wochentag-Aufgabe, Zeile fuer Zeile mit Summe. */
export function Rechenweg({ l }: { l: Loesung }) {
  return (
    <div className="l-rechenweg">
      {l.schritte.map((s) => (
        <div className="l-zeile" key={s.text}>
          <div>
            <span>{s.text}</span>
            {s.klein ? <small>{s.klein}</small> : null}
          </div>
          <b>{s.wert}</b>
        </div>
      ))}
      <div className="l-zeile summe">
        <div>
          <span>{l.summe.text}</span>
          <small>{l.summe.klein}</small>
        </div>
        <b>{l.summe.wert}</b>
      </div>
    </div>
  )
}

/** Kleine Spielkarte: Wert und Farbsymbol auf Elfenbein. */
export function Mini({ id, className = '' }: { id: string; className?: string }) {
  const k = KARTE[id]
  return (
    <span className={`l-mini${k.farbe.rot ? ' rot' : ''} ${className}`} role="img" aria-label={k.name}>
      <b>{k.wert.kurz}</b>
      <i>{k.farbe.symbol}</i>
    </span>
  )
}
