import { useState } from 'react'
import { imBereich } from '../calc'
import { Verlauf } from '../charts'
import { IconRight } from '../icons'
import {
  alleRekorde,
  besterE1rmSatz,
  besterSatz,
  bestesE1rm,
  bestwerteJeWdh,
  einheiten,
  formatSatz,
  gewichtJeWdh,
  formatSek,
  formatTausend,
  kennzahl,
  kurzSaetze,
  leistung,
} from '../trainingCalc'
import { Segment, Seite, TextKnopf, Zurueck } from '../ui'
import { dateKey, formatDiff, formatKurz, formatZahl, relativTag, wieLange } from '../util'
import { Zettel, useNotizAendern } from './Zettel'
import type { Bereich, Erfassung, FormCtx, Punkt, Satz } from '../types'

const BEREICHE: { id: Bereich; label: string }[] = [
  { id: '3m', label: '3 M' },
  { id: '1j', label: '1 J' },
  { id: 'alles', label: 'Alles' },
]

type Kennzahl = 'gewicht' | '1rm' | 'volumen'

const ARTEN: { id: Kennzahl; label: string }[] = [
  { id: 'gewicht', label: 'Gewicht' },
  { id: '1rm', label: '1RM' },
  { id: 'volumen', label: 'Volumen' },
]

const EINHEIT: Record<Erfassung, string> = { gewicht: 'kg', wdh: 'Wdh', zeit: 's' }

/** Wie die Zahl ueber dem Verlauf heisst. */
const KENNZAHL_TEXT: Record<Kennzahl, string> = { gewicht: 'Schwerster Satz', '1rm': 'Geschätztes 1RM', volumen: 'Volumen' }

// Eine Uebung ueber alle Vorlagen: gross der staerkste Satz aus dem letzten
// Training, Kacheln (seit Start, seit dem letzten Mal, Rekord), der Verlauf
// (schwerster Satz, geschaetztes 1RM oder Volumen), die Bestwerte je Wdh-Zahl,
// welches Gewicht fuer wie viele Wdh passt (aus dem 1RM des letzten Trainings,
// das als Vorgabe zaehlt) und darunter jedes Training. Aufwaermsaetze zaehlen
// nirgends mit.
//
// Ueber dem Verlauf steht die Zahl selbst - die juengste, oder die eines
// angetippten Trainings (Finger ueber den Verlauf ziehen geht auch) -, beim
// 1RM mit dem Satz, aus dem es geschaetzt ist. Rechts das Beste im Zeitraum
// und die Veraenderung seit seinem Anfang.
function UebungSeite({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { uebungById, trainings, heute, push, back, refresh } = ctx
  const [bereich, setBereich] = useState<Bereich>('alles')
  const [art, setArt] = useState<Kennzahl>('gewicht')
  // Angetippter Punkt im Verlauf (Index in den sichtbaren) - null = der juengste.
  const [auswahl, setAuswahl] = useState<number | null>(null)
  const notizAendern = useNotizAendern(refresh)
  const u = uebungById[id]
  if (!u) return <Seite links={<Zurueck label="Übungen" onClick={back} />}>{null}</Seite>

  const erf = u.erfassung
  const ein = einheiten(trainings, id)
  const tagVon = (ms: number) => dateKey(new Date(ms))
  const bestJe = ein.map((e) => besterSatz(e.saetze, erf))
  const zahl = (s: Satz | null) => (s ? kennzahl(s, erf) : 0)
  const letzte = ein[ein.length - 1]
  const best = bestJe[bestJe.length - 1]
  const rekord = besterSatz(ein.flatMap((e) => e.saetze), erf)
  const prIn = alleRekorde(trainings, uebungById)
  const bestwerte = bestwerteJeWdh(ein.flatMap((e) => e.saetze))
  // Gewicht je Wdh aus dem besten 1RM-Satz des letzten Trainings - ein Mal
  // "nicht als Vorgabe" (schwacher Tag) zaehlt auch hier nicht.
  const basisE = [...ein].reverse().find((e) => !e.training.uebungen.some((tu) => tu.uebung === id && tu.keineVorgabe))
  const basis = erf === 'gewicht' && basisE ? besterE1rmSatz(basisE.saetze) : null

  const kenn: Kennzahl = erf === 'gewicht' ? art : 'gewicht'
  const punkte: Punkt[] = ein.map((e, i) => ({
    tag: tagVon(e.training.start),
    zahl: kenn === 'gewicht' ? zahl(bestJe[i]) : kenn === '1rm' ? bestesE1rm(e.saetze) : leistung(e.saetze, erf),
  }))
  const sichtbar = imBereich(punkte, bereich, heute)
  // imBereich laesst nur die aeltesten weg - die sichtbaren sind das Ende der Reihe.
  const versatz = punkte.length - sichtbar.length
  const iZeige = auswahl !== null && auswahl < sichtbar.length ? auswahl : sichtbar.length - 1
  const zeigeP = sichtbar[iZeige]
  const zeigeE = ein[versatz + iZeige]
  const bestP = sichtbar.reduce<Punkt | null>((b, p) => (!b || p.zahl > b.zahl ? p : b), null)

  // Zahl und Einheit getrennt, damit die Zahl gross stehen kann.
  const teile = (v: number): [string, string] => {
    if (erf === 'zeit') return v < 60 ? [String(v), 's'] : [formatSek(v), 'min']
    if (erf === 'wdh') return [String(v), 'Wdh']
    // Das 1RM ist geschaetzt - eine Nachkommastelle genuegt.
    return [kenn === 'volumen' ? formatTausend(v) : formatZahl(kenn === '1rm' ? Math.round(v * 10) / 10 : v), 'kg']
  }
  const mitEinheit = (v: number) => teile(v).join(' ')
  const herkunft = () => {
    if (!zeigeE) return ''
    if (kenn === '1rm') {
      const s = besterE1rmSatz(zeigeE.saetze)
      return s ? `geschätzt aus ${formatSatz(s, erf)}` : ''
    }
    return kurzSaetze(zeigeE.saetze, erf)
  }
  const veraenderung = zeigeP && sichtbar.length > 1 ? zeigeP.zahl - sichtbar[0].zahl : null

  const diff = (a: number, b: number) => {
    const d = a - b
    return <em className={`f-diff${d > 0 ? ' gut' : ''}`}>{`${formatDiff(d)} ${EINHEIT[erf]}`}</em>
  }

  return (
    <Seite
      links={<Zurueck label="Zurück" onClick={back} />}
      rechts={<TextKnopf onClick={() => push({ name: 'uebungForm', id })}>Bearbeiten</TextKnopf>}
    >
      <header className="f-kopf">
        <h1 className="f-h1">{u.name}</h1>
      </header>
      {u.notiz ? <Zettel text={u.notiz} onClick={() => notizAendern(u)} /> : null}

      {letzte && best ? (
        <>
          <div className="f-stand">
            <span className="f-zahl gross">
              {erf === 'gewicht' ? (
                <>
                  <b>{formatZahl(best.kg ?? 0)}</b>
                  <small>kg × {best.wdh}</small>
                </>
              ) : (
                <>
                  <b>{erf === 'wdh' ? best.wdh : formatSek(best.sek ?? 0).replace(' s', '')}</b>
                  <small>{erf === 'wdh' ? 'Wdh' : (best.sek ?? 0) < 60 ? 's' : 'min'}</small>
                </>
              )}
            </span>
            <span className="f-stand-wann">{wieLange(tagVon(letzte.training.start), heute)}</span>
          </div>

          <div className="f-kacheln">
            <div className="f-kachel">
              <small>Seit Start</small>
              {ein.length > 1 ? diff(zahl(best), zahl(bestJe[0])) : <em className="f-diff">–</em>}
              <span>{formatKurz(tagVon(ein[0].training.start), heute)}</span>
            </div>
            <div className="f-kachel">
              <small>Seit letztem</small>
              {ein.length > 1 ? diff(zahl(best), zahl(bestJe[bestJe.length - 2])) : <em className="f-diff">–</em>}
              <span>{ein.length > 1 ? formatKurz(tagVon(ein[ein.length - 2].training.start), heute) : 'erstes Mal'}</span>
            </div>
            {rekord ? (
              <div className="f-kachel">
                <small>Rekord</small>
                <em className="f-diff">
                  {erf === 'gewicht' ? `${formatZahl(rekord.kg ?? 0)} kg` : erf === 'wdh' ? `${rekord.wdh} Wdh` : formatSek(rekord.sek ?? 0)}
                </em>
                <span>
                  {erf === 'gewicht' ? `× ${rekord.wdh} · ` : ''}
                  {formatKurz(tagVon(ein.find((e) => e.saetze.includes(rekord))?.training.start ?? 0), heute)}
                </span>
              </div>
            ) : null}
          </div>

          <section className="f-karte-flach">
            <div className={erf === 'gewicht' ? 'f-seg-doppel' : ''}>
              {erf === 'gewicht' ? (
                <Segment
                  label="Kennzahl"
                  optionen={ARTEN}
                  wert={art}
                  onWahl={(a) => {
                    setArt(a)
                    setAuswahl(null)
                  }}
                />
              ) : null}
              <Segment
                label="Zeitraum"
                optionen={BEREICHE}
                wert={bereich}
                onWahl={(b) => {
                  setBereich(b)
                  setAuswahl(null)
                }}
              />
            </div>
            {zeigeP ? (
              <div className="f-verlauf-kopf" aria-live="polite">
                <span className="f-verlauf-wert">
                  <small>
                    {erf === 'gewicht' ? KENNZAHL_TEXT[kenn] : erf === 'wdh' ? 'Meiste Wdh' : 'Längste Zeit'} ·{' '}
                    {relativTag(zeigeP.tag, heute)}
                  </small>
                  <b>
                    {teile(zeigeP.zahl)[0]}
                    <em> {teile(zeigeP.zahl)[1]}</em>
                  </b>
                  <small>{herkunft()}</small>
                </span>
                <span className="f-verlauf-neben">
                  {bestP ? (
                    <span>
                      <small>Bestes</small>
                      <b className={bestP === zeigeP ? 'f-gut' : ''}>{mitEinheit(bestP.zahl)}</b>
                    </span>
                  ) : null}
                  {veraenderung !== null ? (
                    <span>
                      <small>seit {formatKurz(sichtbar[0].tag, heute)}</small>
                      <b className={veraenderung > 0 ? 'f-gut' : ''}>
                        {veraenderung === 0 ? '±0' : `${veraenderung > 0 ? '+' : '−'}${mitEinheit(Math.abs(veraenderung))}`}
                      </b>
                    </span>
                  ) : null}
                </span>
              </div>
            ) : null}
            {sichtbar.length ? (
              <>
                <Verlauf wert={{ name: u.name, ziel: null }} punkte={sichtbar} heute={heute} auswahl={auswahl} onAuswahl={setAuswahl} />
                {sichtbar.length > 1 ? <p className="f-chart-hinweis">Antippen oder ziehen für einzelne Trainings</p> : null}
              </>
            ) : (
              <p className="f-note f-chart-leer">In diesem Zeitraum nicht trainiert.</p>
            )}
          </section>

          {erf === 'gewicht' && bestwerte.length > 1 ? (
            <>
              <h2 className="f-h2">Bestwerte</h2>
              <div className="f-bestwerte">
                {bestwerte.map((b) => (
                  <div key={b.wdh} className="f-bestwert">
                    <small>{b.wdh === 1 ? '1 Wdh' : `${b.wdh}+ Wdh`}</small>
                    <b>{formatZahl(b.kg)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : null}

          {basis && basisE ? (
            <>
              <h2 className="f-h2">Gewicht je Wdh</h2>
              <div className="f-bestwerte">
                {gewichtJeWdh(basis, u.schritt).map((g) => (
                  <div key={g.wdh} className="f-bestwert">
                    <small>{g.wdh} Wdh</small>
                    <b>{formatZahl(g.kg)}</b>
                  </div>
                ))}
              </div>
              <p className="f-note f-herkunft">
                Geschätzt aus {formatSatz(basis, erf)} ({relativTag(tagVon(basisE.training.start), heute)}), abgerundet auf{' '}
                {formatZahl(u.schritt)} kg.
              </p>
            </>
          ) : null}

          <h2 className="f-h2">Trainings</h2>
          <div className="f-gruppe">
            {[...ein].reverse().map((e) => {
              const pr = prIn.get(e.training.id)?.some((r) => r.uebung === id)
              const gleich = erf === 'gewicht' && e.saetze.every((s) => s.kg === e.saetze[0].kg)
              return (
                <button key={e.training.id} type="button" className="f-zeile" onClick={() => push({ name: 'training', id: e.training.id })}>
                  <span>{relativTag(tagVon(e.training.start), heute)}</span>
                  <span className="f-zeile-r">
                    {gleich ? (
                      <>
                        <span className={`f-sk${pr ? ' gut' : ''}`}>{formatZahl(e.saetze[0].kg ?? 0)} kg</span>
                        <span>{e.saetze.map((s) => s.wdh).join(' · ')}</span>
                      </>
                    ) : (
                      <span className={pr ? 'f-gut' : ''}>{kurzSaetze(e.saetze, erf)}</span>
                    )}
                    <IconRight />
                  </span>
                </button>
              )
            })}
          </div>
        </>
      ) : (
        <p className="f-leer-t f-leer-klein">Noch nicht trainiert.</p>
      )}
    </Seite>
  )
}

export default UebungSeite
