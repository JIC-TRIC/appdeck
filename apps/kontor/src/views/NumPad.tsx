import { IconBackspace, IconCheck } from '../icons'
import { applyKey, type PadKey } from '../util'

// Eigenes Ziffernfeld statt der Systemtastatur: die deckt auf dem Handy den
// halben Bildschirm ab, zoomt beim Fokus und bietet kein Komma, auf das man
// sich verlassen kann. Die Tasten sind Buttons, keine Inputs.

function NumPad({
  text,
  onText,
  onSubmit,
  accent,
  submitLabel = 'Speichern',
}: {
  text: string
  onText: (text: string) => void
  onSubmit: () => void
  accent: string
  submitLabel?: string
}) {
  const press = (key: PadKey) => () => onText(applyKey(text, key))
  const digit = (d: PadKey) => (
    <button key={d} type="button" className="k-key" onClick={press(d)}>
      {d}
    </button>
  )

  return (
    <div className="k-pad" role="group" aria-label="Ziffernfeld">
      {(['7', '8', '9'] as const).map(digit)}
      <button type="button" className="k-key aux" onClick={press('back')} aria-label="Letzte Stelle löschen">
        <IconBackspace />
      </button>

      {(['4', '5', '6'] as const).map(digit)}
      <button type="button" className="k-key aux small" onClick={press('clear')} aria-label="Betrag löschen">
        C
      </button>

      {(['1', '2', '3'] as const).map(digit)}
      <button
        type="button"
        className="k-key save"
        style={{ background: accent, borderColor: accent }}
        onClick={onSubmit}
        aria-label={submitLabel}
      >
        <IconCheck />
      </button>

      <button type="button" className="k-key" onClick={press(',')}>,</button>
      {digit('0')}
      <button type="button" className="k-key small" onClick={press('00')}>00</button>
    </div>
  )
}

export default NumPad
