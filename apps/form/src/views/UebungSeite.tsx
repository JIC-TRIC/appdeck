import { useState } from 'react'
import { imBereich } from '../calc'
import { Verlauf } from '../charts'
import { IconRight } from '../icons'
import { alleRekorde, besterSatz, bestesE1rm, bestwerteJeWdh, einheiten, formatSek, kennzahl, kurzSaetze } from '../trainingCalc'
import { Segment, Seite, TextKnopf, Zurueck } from '../ui'
import { dateKey, formatDiff, formatKurz, formatZahl, relativTag, wieLange } from '../util'
import type { Bereich, Erfassung, FormCtx, Punkt, Satz } from '../types'

const BEREICHE: { id: Bereich; label: string }[] = [
  { id: '3m', label: '3 M' },
  { id: '1j', label: '1 J' },
  { id: 'alles', label: 'Alles' },
]

const ARTEN: { id: 'gewicht' | '1rm'; label: string }[] = [
  { id: 'gewicht', label: 'Gewicht' },
  { id: '1rm', label: '1RM' },
]

const EINHEIT: Record<Erfassung, string> = { gewicht: 'kg', wdh: 'Wdh', zeit: 's' }

// Eine Uebung ueber alle Vorlagen: gross der staerkste Satz aus dem letzten
// Training, Kacheln (seit Start, seit dem letzten Mal, Rekord), der Verlauf
// (schwerster Satz oder geschaetztes 1RM), die Bestwerte je Wdh-Zahl und
// darunter jedes Training. Aufwaermsaetze zaehlen nirgends mit.
function UebungSeite({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { uebungById, trainings, heute, push, back } = ctx
  const [bereich, setBereich] = useState<Bereich>('alles')
  const [art, setArt] = useState<'gewicht' | '1rm'>('gewicht')
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

  const punkte: Punkt[] = ein.map((e, i) => ({
    tag: tagVon(e.training.start),
    zahl: erf === 'gewicht' && art === '1rm' ? bestesE1rm(e.saetze) : zahl(bestJe[i]),
  }))
  const sichtbar = imBereich(punkte, bereich, heute)

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
      {u.notiz ? <p className="f-notiz">{u.notiz}</p> : null}

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
              {erf === 'gewicht' ? <Segment label="Kennzahl" optionen={ARTEN} wert={art} onWahl={setArt} /> : null}
              <Segment label="Zeitraum" optionen={BEREICHE} wert={bereich} onWahl={setBereich} />
            </div>
            {sichtbar.length ? (
              <Verlauf wert={{ name: u.name, ziel: null }} punkte={sichtbar} heute={heute} />
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
