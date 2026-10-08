import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { reihe, vorher } from '../calc'
import { IconLeft, IconRight } from '../icons'
import { setzeMessung } from '../store'
import { Diff, Seite, TextKnopf } from '../ui'
import { addDays, formatTag, formatTagLang, formatZahl, mitEinheit, parseZahl, relativTag } from '../util'
import type { FormCtx, Log, Wert } from '../types'

// Ein Blatt pro Messtag: alle Werte untereinander, man fuellt aus, was man
// heute gemessen hat - leere Felder bleiben leer. Steht fuer den Tag schon
// etwas drin, ist es vorausgefuellt; ein geleertes Feld entfernt den Eintrag.
// Mit den Pfeilen oben laesst sich ein anderer Tag waehlen (nachtragen).

const texteAm = (werte: Wert[], log: Log, tag: string): Record<string, string> =>
  Object.fromEntries(werte.map((w) => [w.id, log[w.id]?.[tag] !== undefined ? formatZahl(log[w.id][tag]) : '']))

function Messen({ ctx, start }: { ctx: FormCtx; start: string }) {
  const { werte, log, heute, back, refresh, melde } = ctx
  const [tag, setTag] = useState(start)
  const [texte, setTexte] = useState(() => texteAm(werte, log, start))
  // Was schon angetippt wurde, bleibt beim Tageswechsel stehen - wer merkt,
  // dass er gestern gemessen hat, muss nicht alles neu tippen.
  const [angefasst, setAngefasst] = useState<ReadonlySet<string>>(() => new Set())
  const felder = useRef<(HTMLInputElement | null)[]>([])

  const wechsle = (neu: string) => {
    const frisch = texteAm(werte, log, neu)
    setTexte((t) => Object.fromEntries(werte.map((w) => [w.id, angefasst.has(w.id) ? (t[w.id] ?? '') : frisch[w.id]])))
    setTag(neu)
  }

  const tippe = (id: string, text: string) => {
    setTexte((t) => ({ ...t, [id]: text }))
    setAngefasst((s) => (s.has(id) ? s : new Set(s).add(id)))
  }

  // Enter springt ins naechste Feld, im letzten geht die Tastatur zu.
  const weiter = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const naechstes = felder.current[i + 1]
    if (naechstes) naechstes.focus()
    else e.currentTarget.blur()
  }

  const sichern = () => {
    const zahlen: Record<string, number | null> = {}
    for (const w of werte) {
      const text = texte[w.id] ?? ''
      if (!text.trim()) {
        zahlen[w.id] = null
        continue
      }
      const z = parseZahl(text)
      if (z === null) {
        melde(`„${w.name}“ ist keine Zahl.`)
        return
      }
      zahlen[w.id] = z
    }
    const n = setzeMessung(tag, zahlen)
    refresh()
    back()
    if (n) melde(`${n} ${n === 1 ? 'Wert' : 'Werte'} gespeichert${tag === heute ? '' : ` · ${formatTag(tag, heute)}`}`)
  }

  const wann = relativTag(tag, heute)

  return (
    <Seite
      links={<TextKnopf onClick={back}>Abbrechen</TextKnopf>}
      titel="Messen"
      rechts={
        <TextKnopf onClick={sichern} stark>
          Sichern
        </TextKnopf>
      }
    >
      <div className="f-tag">
        <button type="button" className="f-rund" onClick={() => wechsle(addDays(tag, -1))} aria-label="Tag davor">
          <IconLeft />
        </button>
        <div className="f-tag-mitte">
          <b>{wann}</b>
          {wann === 'Heute' || wann === 'Gestern' ? <small>{formatTagLang(tag)}</small> : null}
        </div>
        <button
          type="button"
          className="f-rund"
          onClick={() => wechsle(addDays(tag, 1))}
          disabled={tag >= heute}
          aria-label="Tag danach"
        >
          <IconRight />
        </button>
      </div>

      <div className="f-gruppe">
        {werte.map((w, i) => {
          const text = texte[w.id] ?? ''
          const z = parseZahl(text)
          const davor = vorher(reihe(log, w.id), tag)
          let hinweis: ReactNode = davor
            ? `zuletzt ${mitEinheit(formatZahl(davor.zahl), w.einheit)} · ${formatTag(davor.tag, heute)}`
            : 'erste Messung'
          if (text.trim() && z === null) hinweis = <span className="f-fehler">keine Zahl</span>
          else if (z !== null && davor) {
            hinweis = (
              <>
                <Diff wert={w} diff={z - davor.zahl} /> seit {formatTag(davor.tag, heute)}
              </>
            )
          }
          return (
            <label key={w.id} className="f-mess">
              <span className="f-mess-l">
                <b>{w.name}</b>
                <small>{hinweis}</small>
              </span>
              <span className="f-mess-r">
                <input
                  ref={(el) => {
                    felder.current[i] = el
                  }}
                  type="text"
                  inputMode="decimal"
                  enterKeyHint={i < werte.length - 1 ? 'next' : 'done'}
                  autoComplete="off"
                  placeholder={davor ? formatZahl(davor.zahl) : '–'}
                  value={text}
                  onChange={(e) => tippe(w.id, e.target.value)}
                  onKeyDown={weiter(i)}
                  aria-label={w.einheit ? `${w.name} in ${w.einheit}` : w.name}
                />
                {w.einheit ? <em>{w.einheit}</em> : null}
              </span>
            </label>
          )
        })}
      </div>
      <p className="f-note f-note-unter">
        Leere Felder bleiben leer. Pro Tag zählt eine Messung – nochmal messen ersetzt sie.
      </p>
    </Seite>
  )
}

export default Messen
