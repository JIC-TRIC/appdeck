import { useState } from 'react'
import { IconLeft, IconRight } from '../icons'
import { neueId } from '../store'
import { leererSatz } from '../trainingStore'
import { Seite, TextKnopf } from '../ui'
import { addDays, formatTagLang, parseKey, relativTag } from '../util'
import type { FormCtx, Training } from '../types'

// Ein vergessenes Training nachtragen: Tag (wie beim Messen, nicht in die
// Zukunft), Vorlage, Beginn und Dauer. "Weiter" fuehrt in dieselbe Ansicht
// wie das laufende Training, nur ohne Pause - die Vorlage fuellt die Uebungen
// vor, grau steht das letzte Mal davor.
function Nachtragen({ ctx }: { ctx: FormCtx }) {
  const { vorlagen, heute, back, replace, melde } = ctx
  const [tag, setTag] = useState(() => addDays(heute, -1))
  const [vorlageId, setVorlageId] = useState<string | null>(vorlagen[0]?.id ?? null)
  const [beginn, setBeginn] = useState('18:00')
  const [dauerText, setDauerText] = useState('60')

  const weiter = () => {
    const [h, m] = beginn.split(':').map(Number)
    const dauer = Math.round(Number(dauerText.replace(',', '.')))
    if (!Number.isFinite(h) || !Number.isFinite(m)) return melde('Beginn fehlt')
    if (!Number.isFinite(dauer) || dauer < 1 || dauer > 600) return melde('Dauer in Minuten, 1 bis 600')
    const d = parseKey(tag)
    d.setHours(h, m, 0, 0)
    const start = d.getTime()
    if (start > Date.now()) return melde('Der Beginn liegt in der Zukunft')
    const v = vorlagen.find((x) => x.id === vorlageId)
    const t: Training = {
      id: neueId(start),
      vorlage: v?.id ?? null,
      name: v?.name ?? 'Training',
      start,
      ende: start + dauer * 60000,
      uebungen: (v?.uebungen ?? []).map((x) => ({ uebung: x.uebung, saetze: Array.from({ length: x.saetze }, leererSatz) })),
    }
    replace({ name: 'neu', training: t })
  }

  const wann = relativTag(tag, heute)

  return (
    <Seite
      links={<TextKnopf onClick={back}>Abbrechen</TextKnopf>}
      titel="Nachtragen"
      rechts={
        <TextKnopf stark onClick={weiter}>
          Weiter
        </TextKnopf>
      }
    >
      <div className="f-tag">
        <button type="button" className="f-rund" onClick={() => setTag(addDays(tag, -1))} aria-label="Tag davor">
          <IconLeft />
        </button>
        <div className="f-tag-mitte">
          <b>{wann}</b>
          {wann === 'Heute' || wann === 'Gestern' ? <small>{formatTagLang(tag)}</small> : null}
        </div>
        <button
          type="button"
          className="f-rund"
          onClick={() => setTag(addDays(tag, 1))}
          disabled={tag >= heute}
          aria-label="Tag danach"
        >
          <IconRight />
        </button>
      </div>

      <div className="f-felder">
        <div className="f-feld">
          <span className="f-label">Vorlage</span>
          <div className="f-chips">
            {vorlagen.map((v) => (
              <button
                key={v.id}
                type="button"
                className={`f-chip${vorlageId === v.id ? ' an' : ''}`}
                aria-pressed={vorlageId === v.id}
                onClick={() => setVorlageId(v.id)}
              >
                {v.name}
              </button>
            ))}
            <button
              type="button"
              className={`f-chip${vorlageId === null ? ' an' : ''}`}
              aria-pressed={vorlageId === null}
              onClick={() => setVorlageId(null)}
            >
              Leer
            </button>
          </div>
        </div>
        <div className="f-zwei-felder">
          <label className="f-feld">
            <span className="f-label">Beginn</span>
            <input type="time" value={beginn} onChange={(e) => setBeginn(e.target.value)} />
          </label>
          <label className="f-feld">
            <span className="f-label">Dauer (min)</span>
            <input
              type="text"
              inputMode="numeric"
              value={dauerText}
              autoComplete="off"
              onChange={(e) => setDauerText(e.target.value)}
            />
          </label>
        </div>
      </div>
    </Seite>
  )
}

export default Nachtragen
