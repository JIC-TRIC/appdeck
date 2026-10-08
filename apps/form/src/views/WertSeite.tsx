import { useState } from 'react'
import { imBereich, reihe, stand, zielStand } from '../calc'
import { Verlauf } from '../charts'
import { IconCheck, IconRight } from '../icons'
import { Diff, RICHTUNG_TEXT, Segment, Seite, TextKnopf, Zurueck } from '../ui'
import { formatKurz, formatTag, formatZahl, mitEinheit, wieLange } from '../util'
import type { Bereich, FormCtx } from '../types'

const BEREICHE: { id: Bereich; label: string }[] = [
  { id: '3m', label: '3 Monate' },
  { id: '1j', label: '1 Jahr' },
  { id: 'alles', label: 'Alles' },
]

// Ein Wert im Detail: Stand, Veraenderung seit Start und seit der letzten
// Messung, Ziel, Verlauf und alle Eintraege. Ein Tipp auf einen Eintrag
// oeffnet den Messtag dazu (aendern oder leeren).
function WertSeite({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { byId, log, heute, push, back } = ctx
  const [bereich, setBereich] = useState<Bereich>('alles')
  const wert = byId[id]
  // Gerade geloescht: die Seite gleitet noch hinaus.
  if (!wert) return <Seite links={<Zurueck label="Form" onClick={back} />}>{null}</Seite>

  const punkte = reihe(log, id)
  const s = stand(punkte)
  const z = s.letzter ? zielStand(wert, s.letzter.zahl) : null
  const sichtbar = imBereich(punkte, bereich, heute)
  const neueste = [...punkte].reverse()

  return (
    <Seite
      links={<Zurueck label="Form" onClick={back} />}
      rechts={<TextKnopf onClick={() => push({ name: 'wertForm', id })}>Bearbeiten</TextKnopf>}
    >
      <header className="f-kopf">
        <p className="f-kicker">{[wert.einheit, RICHTUNG_TEXT[wert.richtung]].filter(Boolean).join(' · ')}</p>
        <h1 className="f-h1">{wert.name}</h1>
      </header>

      {s.letzter ? (
        <>
          <div className="f-stand">
            <span className="f-zahl gross">
              <b>{formatZahl(s.letzter.zahl)}</b>
              {wert.einheit ? <small>{wert.einheit}</small> : null}
            </span>
            <span className="f-stand-wann">{wieLange(s.letzter.tag, heute)}</span>
          </div>

          <div className="f-kacheln">
            <div className="f-kachel">
              <small>Seit Start</small>
              {s.erster && s.anzahl > 1 ? <Diff wert={wert} diff={s.letzter.zahl - s.erster.zahl} /> : <em className="f-diff">–</em>}
              <span>{s.erster ? formatKurz(s.erster.tag, heute) : ''}</span>
            </div>
            <div className="f-kachel">
              <small>Seit letzter</small>
              {s.davor ? <Diff wert={wert} diff={s.letzter.zahl - s.davor.zahl} /> : <em className="f-diff">–</em>}
              <span>{s.davor ? formatKurz(s.davor.tag, heute) : 'erste Messung'}</span>
            </div>
            {z && wert.ziel !== null ? (
              <div className={`f-kachel${z.erreicht ? ' erreicht' : ''}`}>
                <small>Ziel</small>
                <em className="f-diff">{mitEinheit(formatZahl(wert.ziel), wert.einheit)}</em>
                <span>
                  {z.erreicht ? (
                    <>
                      <IconCheck />
                      erreicht
                    </>
                  ) : (
                    `noch ${mitEinheit(formatZahl(z.rest), wert.einheit)}`
                  )}
                </span>
              </div>
            ) : null}
          </div>

          <section className="f-karte-flach">
            <Segment label="Zeitraum" optionen={BEREICHE} wert={bereich} onWahl={setBereich} />
            {sichtbar.length ? (
              <Verlauf wert={wert} punkte={sichtbar} heute={heute} />
            ) : (
              <p className="f-note f-chart-leer">In diesem Zeitraum nichts gemessen.</p>
            )}
          </section>

          <h2 className="f-h2">Einträge</h2>
          <div className="f-gruppe">
            {neueste.map((p, i) => {
              const davor = neueste[i + 1]
              return (
                <button key={p.tag} type="button" className="f-zeile" onClick={() => push({ name: 'messen', tag: p.tag })}>
                  <span className="f-zeile-tag">{formatTag(p.tag, heute)}</span>
                  <span className="f-zeile-r">
                    {davor ? <Diff wert={wert} diff={p.zahl - davor.zahl} /> : null}
                    <b>{mitEinheit(formatZahl(p.zahl), wert.einheit)}</b>
                    <IconRight />
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <div className="f-leer">
          <p className="f-leer-t">Noch nichts eingetragen.</p>
          <p className="f-note">Sobald du misst, steht hier der Verlauf.</p>
          <button type="button" className="f-haupt" onClick={() => push({ name: 'messen', tag: heute })}>
            Jetzt messen
          </button>
        </div>
      )}
    </Seite>
  )
}

export default WertSeite
