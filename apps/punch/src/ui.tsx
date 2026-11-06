// Bausteine, die auf allen Seiten und in den Blaettern gleich aussehen muessen.

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { IonModal } from '@ionic/react'

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) eine Ebene ueber apps/.
export function zumLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

/** Farbe eines Bereichs als CSS-Variable --o (Quadrate, Balken). */
export const mitFarbe = (wert: string) => ({ '--o': wert }) as CSSProperties

// Haptik beim Starten und beim langen Druck, wie in Form und Tick: Android ueber
// Vibration, iPhone ab iOS 18 ueber einen umgelegten Schalter (nur aus einem Tipp heraus).
const ios = typeof navigator !== 'undefined' && /iP(hone|ad|od)/.test(navigator.userAgent)
export function haptik() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(12)
    return
  }
  if (!ios) return
  try {
    const label = document.createElement('label')
    label.ariaHidden = 'true'
    label.style.display = 'none'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    label.appendChild(input)
    document.head.appendChild(label)
    label.click()
    label.remove()
  } catch {
    /* ohne Haptik */
  }
}

// ---------- Icons (24er Raster, Strich aus Punch.css .p-i) ----------

function I({ children }: { children: ReactNode }) {
  return (
    <svg className="p-i" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconLinks = () => (
  <I>
    <path d="M15 4.5 7.5 12l7.5 7.5" />
  </I>
)
export const IconRechts = () => (
  <I>
    <path d="m9 4.5 7.5 7.5L9 19.5" />
  </I>
)
export const IconStatistik = () => (
  <I>
    <path d="M5 20v-7M12 20V5M19 20v-10" />
  </I>
)
export const IconBereiche = () => (
  <I>
    <rect x="3.5" y="4" width="17" height="6.5" rx="1" />
    <rect x="3.5" y="13.5" width="17" height="6.5" rx="1" />
  </I>
)
export const IconGriff = () => (
  <I>
    <path d="M5 8h14M5 12h14M5 16h14" />
  </I>
)
export const IconStopp = () => (
  <svg className="p-i voll" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="5" y="5" width="14" height="14" />
  </svg>
)

// ---------- Kopf ----------

export function Zurueck({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="p-zurueck" onClick={onClick}>
      <IconLinks />
      {label}
    </button>
  )
}

export function Kopf({ links, mitte, rechts }: { links?: ReactNode; mitte?: string; rechts?: ReactNode }) {
  return (
    <header className="p-kopf">
      <span className="l">{links}</span>
      <span className="m">{mitte}</span>
      <span className="r">{rechts}</span>
    </header>
  )
}

// ---------- Beleg ----------

// Abgerissene Kante unten: Zacken in Papierfarbe, gestreckt auf jede Breite.
const ZACKEN = (() => {
  let p = '0,0'
  for (let x = 0; x <= 340; x += 5) p += ` ${x},${(x / 5) % 2 ? 7 : 0}`
  return `${p} 340,0`
})()

/** Ein Kassenbon: weisses Papier, unten abgerissen. */
export function Bon({ children }: { children: ReactNode }) {
  return (
    <section className="p-bon">
      {children}
      <svg className="p-zacken" viewBox="0 0 340 7" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={ZACKEN} />
      </svg>
    </section>
  )
}

/** Gestrichelte Linie quer ueber den Bon. */
export const Strich = () => <div className="p-strich" />

// ---------- Blatt von unten ----------

// Ionics Sheet-Modal wie in Kontor, Tick und Form. Wegwischen, Antippen des
// Grundes und die Animation bringt Ionic mit, die Hoehe richtet sich nach dem
// Inhalt. onClose laeuft erst, wenn es ganz zu ist; als Funktion bekommt der
// Inhalt "schliessen" mit, um es selbst zuzumachen.
export function Blatt({ label, onClose, children }: { label: string; onClose: () => void; children: (schliessen: () => void) => ReactNode }) {
  const [offen, setOffen] = useState(true)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])
  const schliessen = useCallback(() => setOffen(false), [])

  return (
    <IonModal
      isOpen={offen}
      className="p-sheet-modal"
      breakpoints={[0, 1]}
      initialBreakpoint={1}
      aria-label={label}
      onDidDismiss={() => onCloseRef.current()}
    >
      <div className="p-sheet ion-content-scroll-host">{children(schliessen)}</div>
    </IonModal>
  )
}

/** Kopf eines Blatts: links Abbrechen, Mitte Titel, rechts der Hauptknopf. */
export function BlattKopf({ titel, onAbbrechen, rechts, onRechts, aus }: { titel: string; onAbbrechen: () => void; rechts: string; onRechts: () => void; aus?: boolean }) {
  return (
    <div className="p-bs-kopf">
      <button type="button" className="l" onClick={onAbbrechen}>
        Abbrechen
      </button>
      <b>{titel}</b>
      <button type="button" className="r" onClick={onRechts} disabled={aus}>
        {rechts}
      </button>
    </div>
  )
}

/** Ein Feld im Blatt: kleine Beschriftung, darunter der Inhalt. */
export function Feld({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <div className="p-feld">
      <span className="p-l">{titel}</span>
      {children}
    </div>
  )
}
