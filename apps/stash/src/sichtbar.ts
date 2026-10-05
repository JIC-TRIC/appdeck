/*
 * Der Teil des Bildschirms, der ueber der Tastatur sichtbar ist.
 *
 * iOS verkleinert bei offener Tastatur nicht die Seite, sondern schiebt nur
 * den sichtbaren Ausschnitt (visualViewport) darueber. Stash legt sich deshalb
 * genau auf diesen Ausschnitt: der Ablegen-Knopf steht direkt ueber der
 * Tastatur, und das Textfeld nimmt den Platz dazwischen.
 */
import { useEffect, useState, type CSSProperties } from 'react'

// Ab so viel fehlender Hoehe gilt die Tastatur als offen (und nicht etwa
// nur eine eingeblendete Leiste).
const TASTATUR_AB = 120

export interface Sichtbar {
  tastatur: boolean
  /** Lage der App: nur gesetzt, solange der Ausschnitt nicht der ganze Bildschirm ist. */
  style?: CSSProperties
}

function messen(): Sichtbar {
  const vv = window.visualViewport
  if (!vv) return { tastatur: false }
  const tastatur = window.innerHeight - vv.height > TASTATUR_AB
  if (!tastatur && vv.offsetTop < 1) return { tastatur }
  return { tastatur, style: { top: vv.offsetTop, height: vv.height, bottom: 'auto' } }
}

export function useSichtbar(): Sichtbar {
  const [s, setS] = useState(messen)

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    let id = 0
    const neu = () => {
      cancelAnimationFrame(id)
      id = requestAnimationFrame(() => setS(messen()))
    }
    vv.addEventListener('resize', neu)
    vv.addEventListener('scroll', neu)
    return () => {
      cancelAnimationFrame(id)
      vv.removeEventListener('resize', neu)
      vv.removeEventListener('scroll', neu)
    }
  }, [])

  return s
}
