import { useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { reihe } from '../calc'
import { EINHEIT_MAX, NAME_MAX, loescheWert, sauber, speichereWert } from '../store'
import { Segment, Seite, TextKnopf } from '../ui'
import { formatZahl, parseZahl } from '../util'
import type { FormCtx, Richtung } from '../types'

const EINHEITEN = ['kg', 'cm', '%']

const RICHTUNGEN: { id: Richtung; label: string }[] = [
  { id: 'mehr', label: 'Mehr' },
  { id: 'weniger', label: 'Weniger' },
  { id: 'egal', label: 'Egal' },
]

// Wert anlegen oder bearbeiten: Name, Einheit, Richtung, Ziel. Beim
// Bearbeiten unten auch Loeschen - mit allen Eintraegen.
function WertForm({ ctx, id }: { ctx: FormCtx; id?: string }) {
  const { byId, log, back, toRoot, refresh, melde } = ctx
  const alt = id ? byId[id] : undefined
  const [name, setName] = useState(alt?.name ?? '')
  const [einheit, setEinheit] = useState(alt?.einheit ?? '')
  const [richtung, setRichtung] = useState<Richtung>(alt?.richtung ?? 'egal')
  const [zielText, setZielText] = useState(alt?.ziel != null ? formatZahl(alt.ziel) : '')
  const [frage] = useIonAlert()

  const ziel = parseZahl(zielText)
  const zielFalsch = zielText.trim() !== '' && ziel === null
  const kannSichern = sauber(name, NAME_MAX) !== '' && !zielFalsch

  const sichern = () => {
    if (!kannSichern) return
    const w = speichereWert({ name, einheit, richtung, ziel }, alt?.id)
    if (!w) return
    refresh()
    back()
    melde(alt ? 'Gespeichert' : `${w.name} angelegt`)
  }

  const loeschen = () => {
    if (!alt) return
    const n = reihe(log, alt.id).length
    frage({
      header: `${alt.name} löschen?`,
      message: n
        ? `${n === 1 ? 'Der Eintrag geht' : `Alle ${n} Einträge gehen`} mit. Das lässt sich nicht rückgängig machen.`
        : 'Das lässt sich nicht rückgängig machen.',
      cssClass: 'f-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            loescheWert(alt.id)
            refresh()
            toRoot()
            melde(`${alt.name} gelöscht`)
          },
        },
      ],
    })
  }

  return (
    <Seite
      links={<TextKnopf onClick={back}>Abbrechen</TextKnopf>}
      titel={alt ? 'Bearbeiten' : 'Neuer Wert'}
      rechts={
        <TextKnopf onClick={sichern} stark disabled={!kannSichern}>
          Sichern
        </TextKnopf>
      }
    >
      <div className="f-felder">
        <label className="f-feld">
          <span className="f-label">Name</span>
          <input
            type="text"
            value={name}
            maxLength={NAME_MAX}
            autoComplete="off"
            enterKeyHint="next"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div className="f-feld">
          <label className="f-label" htmlFor="f-einheit">
            Einheit
          </label>
          <input
            id="f-einheit"
            type="text"
            value={einheit}
            maxLength={EINHEIT_MAX}
            autoComplete="off"
            autoCapitalize="none"
            onChange={(e) => setEinheit(e.target.value)}
          />
          <div className="f-chips">
            {EINHEITEN.map((e) => (
              <button
                key={e}
                type="button"
                className={`f-chip${einheit.trim() === e ? ' an' : ''}`}
                aria-pressed={einheit.trim() === e}
                onClick={() => setEinheit(einheit.trim() === e ? '' : e)}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="f-feld">
          <span className="f-label">Was ist besser?</span>
          <Segment label="Was ist besser?" optionen={RICHTUNGEN} wert={richtung} onWahl={setRichtung} />
        </div>

        <label className="f-feld">
          <span className="f-label">Ziel</span>
          <span className="f-ziel-eingabe">
            <input
              type="text"
              inputMode="decimal"
              value={zielText}
              autoComplete="off"
              onChange={(e) => setZielText(e.target.value)}
            />
            {sauber(einheit, EINHEIT_MAX) ? <em>{sauber(einheit, EINHEIT_MAX)}</em> : null}
          </span>
          {zielFalsch ? <span className="f-note f-fehler">Das ist keine Zahl.</span> : null}
        </label>
      </div>

      {alt ? (
        <button type="button" className="f-loeschen" onClick={loeschen}>
          Wert löschen
        </button>
      ) : null}
    </Seite>
  )
}

export default WertForm
