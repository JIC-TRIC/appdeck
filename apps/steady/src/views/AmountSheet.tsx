import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { messwert, progress, ruleAt } from '../calc'
import { IconBackspace, IconClose } from '../icons'
import { Sheet, hue } from '../ui'
import { applyKey, formatDayLong, formatValue, relativeDay, textToValue, valueToText, type PadKey } from '../util'
import { NICHT_GESCHAFFT, type ViewProps } from '../types'

// So lange bleibt eine Taste mindestens hervorgehoben - ein schneller Tipp
// dauert oft nur 50 ms, ohne Mindestdauer saehe man nichts (wie Kontor).
const MIN_GEDRUECKT_MS = 140

function drueck(e: PointerEvent<HTMLButtonElement>) {
  e.currentTarget.classList.add('pressed')
  e.currentTarget.dataset.seit = String(performance.now())
}

function loslassen(e: PointerEvent<HTMLButtonElement>) {
  const el = e.currentTarget
  if (!el.classList.contains('pressed')) return
  const gehalten = performance.now() - Number(el.dataset.seit ?? 0)
  window.setTimeout(() => el.classList.remove('pressed'), Math.max(0, MIN_GEDRUECKT_MS - gehalten))
}

const tastenProps = { onPointerDown: drueck, onPointerUp: loslassen, onPointerCancel: loslassen, onPointerLeave: loslassen }

const KEYS: PadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back']

// Tageswert eintragen. Eingetragen wird die Tagessumme - sie ersetzt den
// alten Wert, statt ihn zu erhoehen (konzept.md, Ansicht 2).
function AmountSheet({ ctx, view }: ViewProps) {
  const { byId, log, today, back, enter } = ctx
  const habit = view.habitId ? byId[view.habitId] : undefined
  const day = view.day ?? today
  const before = habit ? log[habit.id]?.[day] : undefined
  const warNein = before === NICHT_GESCHAFFT
  const [z, setZ] = useState({ text: valueToText(messwert(before)), n: 0, wackelt: false })

  // Gewohnheit weg (geloescht, Import): Blatt gar nicht erst zeigen.
  useEffect(() => {
    if (!habit) back()
  }, [habit, back])

  const zuRef = useRef<() => void>(() => {})
  const textRef = useRef(z.text)
  textRef.current = z.text

  const press = (key: PadKey) => {
    setZ((cur) => {
      const next = applyKey(cur.text, key)
      if (next === cur.text && key !== 'back') return { ...cur, n: cur.n + 1, wackelt: true }
      return { text: next, n: cur.n + 1, wackelt: false }
    })
  }

  const save = () => {
    if (!habit) return
    const v = textToValue(textRef.current)
    // Unveraendert: keine Meldung, kein "eingetragen" fuer nichts. Steht
    // "nicht geschafft" drin und wurde nichts getippt, bleibt es dabei.
    if (v !== (before ?? null) && !(v === null && before === NICHT_GESCHAFFT)) enter(habit, day, v)
    zuRef.current()
  }

  const clear = () => {
    if (!habit) return
    if (before !== undefined) enter(habit, day, null)
    zuRef.current()
  }

  // Ohne Zahl: der Tag war nicht geschafft (und nicht bloss vergessen).
  const nein = () => {
    if (!habit) return
    if (before !== NICHT_GESCHAFFT) enter(habit, day, NICHT_GESCHAFFT)
    zuRef.current()
  }

  // Am Rechner auch mit der Tastatur.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key as PadKey)
      else if (e.key === ',' || e.key === '.') press(',')
      else if (e.key === 'Backspace') press('back')
      else if (e.key === 'Enter') save()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!habit) return null

  const value = textToValue(z.text)
  const g = ruleAt(habit.goal, day)
  const p = progress(habit, value ?? undefined, day)
  const unit = habit.unit
  let goalText = ''
  if (g) {
    const ziel = `${formatValue(g.target)} ${unit}`.trim()
    if (g.dir === 'min') {
      goalText = value === null ? `Ziel mindestens ${ziel}` : p.met ? `Ziel mindestens ${ziel} · erreicht` : `Ziel mindestens ${ziel} · noch ${formatValue(p.rest)} ${unit}`
    } else {
      goalText =
        value === null
          ? `Ziel höchstens ${ziel}`
          : p.over
            ? `Ziel höchstens ${ziel} · ${formatValue(value - g.target)} ${unit} drüber`
            : `Ziel höchstens ${ziel} · noch ${formatValue(p.rest)} ${unit} Luft`
    }
  }
  // Als nicht geschafft eingetragen und noch nichts getippt: das steht vorn.
  if (warNein && value === null) goalText = goalText ? `Nicht geschafft · ${goalText}` : 'Nicht geschafft'
  const wann = relativeDay(day, today)
  const datum = wann === 'Heute' || wann === 'Gestern' ? `${wann} · ${formatDayLong(day)}` : wann

  return (
    <Sheet label={`${habit.name} eintragen`} onClose={back}>
      {(zu) => {
        zuRef.current = zu
        return (
          <div className="s-amount" style={hue(habit)}>
            <div className="s-sh-head">
              <div>
                <b>{habit.name}</b>
                <small>{datum}</small>
              </div>
              <div className="s-sh-head-r">
                <button type="button" className={`s-nein${warNein ? ' on' : ''}`} onClick={nein} aria-pressed={warNein}>
                  Nicht geschafft
                </button>
                <button type="button" className="s-ib small" onClick={zu} aria-label="Schließen">
                  <IconClose />
                </button>
              </div>
            </div>
            <div className={`s-amt${z.text ? '' : ' empty'}`}>
              <span className={`num${z.n === 0 ? '' : z.wackelt ? ' wackelt' : ' tickt'}`} key={z.n}>
                {z.text || '0'}
              </span>
              {unit ? <span className="un">{unit}</span> : null}
            </div>
            {goalText ? <div className="s-goal">{goalText}</div> : null}
            <div className="s-prog">
              <i style={{ width: `${(p.over ? 1 : p.share) * 100}%` }} className={p.over ? 'over' : ''} />
            </div>
            <div className="s-pad" role="group" aria-label="Ziffernfeld">
              {KEYS.map((k) => (
                <button
                  key={k}
                  type="button"
                  className="s-key"
                  onClick={() => press(k)}
                  aria-label={k === 'back' ? 'Letzte Stelle löschen' : k === ',' ? 'Komma' : undefined}
                  {...tastenProps}
                >
                  {k === 'back' ? <IconBackspace /> : k}
                </button>
              ))}
            </div>
            <div className="s-acts">
              <button type="button" className="s-btn" onClick={clear}>
                Leeren
              </button>
              <button type="button" className="s-btn hab" onClick={save}>
                Sichern
              </button>
            </div>
          </div>
        )
      }}
    </Sheet>
  )
}

export default AmountSheet
