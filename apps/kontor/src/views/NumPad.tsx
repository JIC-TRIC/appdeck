import { useState, type CSSProperties, type PointerEvent } from 'react'
import { IconBackspace, IconCheck } from '../icons'
import { applyKey, centToPad, textToCent, type PadKey } from '../util'

// Eigenes Ziffernfeld statt der Systemtastatur: die deckt auf dem Handy den
// halben Bildschirm ab und zoomt beim Fokus. Die Tasten sind Buttons, keine
// Inputs. Ein Komma gibt es nicht: der Betrag wird in Cent getippt (util.ts).

// Text und Rueckmeldung eines Betrags, den ein Ziffernfeld fuellt. Jeder
// Tastendruck zaehlt "signal.n" hoch; "wackelt" sagt, ob der letzte nichts
// bewirkt hat (Null am Anfang, zu viele Stellen) - der Betrag wackelt
// dann kurz, statt stumm zu bleiben. Nur der letzte Druck zaehlt.
export interface BetragSignal {
  n: number
  wackelt: boolean
}

export function useBetrag(start = '') {
  // Entwuerfe von vor der Cent-Eingabe stehen noch mit Komma im Speicher.
  const [zustand, setZustand] = useState(() => ({
    text: start.includes(',') ? centToPad(textToCent(start)) : start,
    n: 0,
    wackelt: false,
  }))
  return {
    text: zustand.text,
    signal: { n: zustand.n, wackelt: zustand.wackelt } as BetragSignal,
    setText: (text: string) => setZustand((z) => ({ text, n: z.n + 1, wackelt: false })),
    ablehnen: () => setZustand((z) => ({ ...z, n: z.n + 1, wackelt: true })),
  }
}

// So lange bleibt eine Taste mindestens hervorgehoben. Ein schneller Tipp
// dauert oft nur 50 ms - ohne Mindestdauer sieht man davon nichts.
const MIN_GEDRUECKT_MS = 140

// Hervorhebung direkt am Element statt ueber React-Zustand: sie muss im selben
// Moment erscheinen, in dem der Finger aufsetzt, auch wenn React gerade rendert.
function drueck(e: PointerEvent<HTMLButtonElement>) {
  const el = e.currentTarget
  el.classList.add('pressed')
  el.dataset.seit = String(performance.now())
}

function loslassen(e: PointerEvent<HTMLButtonElement>) {
  const el = e.currentTarget
  if (!el.classList.contains('pressed')) return
  const gehalten = performance.now() - Number(el.dataset.seit ?? 0)
  window.setTimeout(() => el.classList.remove('pressed'), Math.max(0, MIN_GEDRUECKT_MS - gehalten))
}

const tastenProps = { onPointerDown: drueck, onPointerUp: loslassen, onPointerCancel: loslassen, onPointerLeave: loslassen }

function NumPad({
  text,
  onText,
  onSubmit,
  onReject,
  accent,
  submitLabel = 'Speichern',
}: {
  text: string
  onText: (text: string) => void
  onSubmit: () => void
  /** Taste gedrueckt, die am Betrag nichts aendert. */
  onReject?: () => void
  accent: string
  submitLabel?: string
}) {
  const press = (key: PadKey) => () => {
    const next = applyKey(text, key)
    if (next === text && key !== 'back' && key !== 'clear') onReject?.()
    else onText(next)
  }
  const digit = (d: PadKey) => (
    <button key={d} type="button" className="k-key" onClick={press(d)} {...tastenProps}>
      {d}
    </button>
  )

  return (
    // --k-accent: die gedrueckte Taste leuchtet in der Farbe der Buchungsart.
    <div className="k-pad" role="group" aria-label="Ziffernfeld" style={{ '--k-accent': accent } as CSSProperties}>
      {(['7', '8', '9'] as const).map(digit)}
      <button type="button" className="k-key aux" onClick={press('back')} aria-label="Letzte Stelle löschen" {...tastenProps}>
        <IconBackspace />
      </button>

      {(['4', '5', '6'] as const).map(digit)}
      <button type="button" className="k-key aux small" onClick={press('clear')} aria-label="Betrag löschen" {...tastenProps}>
        C
      </button>

      {(['1', '2', '3'] as const).map(digit)}
      <button
        type="button"
        className="k-key save"
        style={{ background: accent, borderColor: accent }}
        onClick={onSubmit}
        aria-label={submitLabel}
        {...tastenProps}
      >
        <IconCheck />
      </button>

      <button type="button" className="k-key wide" onClick={press('0')} {...tastenProps}>0</button>
      <button type="button" className="k-key small" onClick={press('00')} {...tastenProps}>00</button>
    </div>
  )
}

export default NumPad
