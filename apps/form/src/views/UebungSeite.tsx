import { useState } from 'react'
import { imBereich } from '../calc'
import { Verlauf } from '../charts'
import { IconRight } from '../icons'
import {
  KENNZAHLEN,
  alleRekorde,
  besterE1rmSatz,
  besterSatz,
  bestwerteJeWdh,
  einheiten,
  formatSatz,
  formatStoppuhr,
  gewichtJeWdh,
  formatSek,
  formatStrecke,
  formatTausend,
  kennwert,
  kurzSaetze,
  streckeTeile,
  type Kennzahl,
} from '../trainingCalc'
import { Segment, Seite, TextKnopf, Zurueck } from '../ui'
import { dateKey, formatKurz, formatZahl, relativTag, wieLange } from '../util'
import { Zettel, useNotizAendern } from './Zettel'
import type { Bereich, Erfassung, FormCtx, Punkt, Satz } from '../types'

const BEREICHE: { id: Bereich; label: string }[] = [
  { id: '3m', label: '3 M' },
  { id: '1j', label: '1 J' },
  { id: 'alles', label: 'Alles' },
]

const ART_LABEL: Record<Kennzahl, string> = {
  gewicht: 'Gewicht',
  '1rm': '1RM',
  volumen: 'Volumen',
  wdh: 'Wdh',
  zeit: 'Zeit',
  strecke: 'Strecke',
  tempo: 'Tempo',
}

/** Wie die Zahl ueber dem Verlauf heisst. */
const KENNZAHL_TEXT: Record<Kennzahl, string> = {
  gewicht: 'Schwerster Satz',
  '1rm': 'Geschätztes 1RM',
  volumen: 'Volumen',
  wdh: 'Meiste Wdh',
  zeit: 'Längste Zeit',
  strecke: 'Weiteste Strecke',
  tempo: 'Schnellstes Tempo',
}

/** Eine Zeit gross: '45' mit 's', ab einer Minute '1:30' mit 'min'. */
const zeitTeile = (sek: number): [string, string] => (sek < 60 ? [String(sek), 's'] : [formatStoppuhr(sek), 'min'])

/**
 * Ein Satz zum Grossschreiben: die erste Zahl, ihre Einheit und der Rest -
 * ['82,5', 'kg', '× 8'], ['5', 'km', 'in 26:30'], ['12', 'Wdh', ''].
 */
function satzTeile(s: Satz, erf: Erfassung): [string, string, string] {
  switch (erf) {
    case 'gewicht':
      return [formatZahl(s.kg ?? 0), 'kg', `× ${s.wdh ?? 0}`]
    case 'gewichtZeit':
      return [formatZahl(s.kg ?? 0), 'kg', `× ${formatSek(s.sek ?? 0)}`]
    case 'gewichtStrecke':
      return [formatZahl(s.kg ?? 0), 'kg', `× ${formatStrecke(s.m ?? 0)}`]
    case 'wdh':
      return [String(s.wdh ?? 0), 'Wdh', '']
    case 'zeit':
      return [...zeitTeile(s.sek ?? 0), '']
    case 'strecke':
      return [...streckeTeile(s.m ?? 0), `in ${formatSek(s.sek ?? 0)}`]
  }
}

// Eine Uebung ueber alle Vorlagen: gross der staerkste Satz aus dem letzten
// Training, Kacheln (seit Start und seit dem letzten Mal in der Kennzahl des
// Verlaufs, Rekord), der Verlauf
// (je nach Erfassung schwerster Satz, geschaetztes 1RM, Volumen, Wdh, Zeit,
// Strecke oder Tempo), die Bestwerte je Wdh-Zahl,
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
  const [art, setArt] = useState<Kennzahl | null>(null)
  // Angetippter Punkt im Verlauf (Index in den sichtbaren) - null = der juengste.
  const [auswahl, setAuswahl] = useState<number | null>(null)
  const notizAendern = useNotizAendern(refresh)
  const u = uebungById[id]
  if (!u) return <Seite links={<Zurueck label="Übungen" onClick={back} />}>{null}</Seite>

  const erf = u.erfassung
  const ein = einheiten(trainings, id)
  const tagVon = (ms: number) => dateKey(new Date(ms))
  const bestJe = ein.map((e) => besterSatz(e.saetze, erf))
  const letzte = ein[ein.length - 1]
  const best = bestJe[bestJe.length - 1]
  const rekord = besterSatz(ein.flatMap((e) => e.saetze), erf)
  const prIn = alleRekorde(trainings, uebungById)
  const bestwerte = bestwerteJeWdh(ein.flatMap((e) => e.saetze))
  // Gewicht je Wdh aus dem besten 1RM-Satz des letzten Trainings - ein Mal
  // "nicht als Vorgabe" (schwacher Tag) zaehlt auch hier nicht.
  const basisE = [...ein].reverse().find((e) => !e.training.uebungen.some((tu) => tu.uebung === id && tu.keineVorgabe))
  const basis = erf === 'gewicht' && basisE ? besterE1rmSatz(basisE.saetze) : null

  const arten = KENNZAHLEN[erf]
  const kenn: Kennzahl = art && arten.includes(art) ? art : arten[0]
  const punkte: Punkt[] = ein.map((e) => ({ tag: tagVon(e.training.start), zahl: kennwert(e.saetze, kenn, erf) }))
  const sichtbar = imBereich(punkte, bereich, heute)
  // imBereich laesst nur die aeltesten weg - die sichtbaren sind das Ende der Reihe.
  const versatz = punkte.length - sichtbar.length
  const iZeige = auswahl !== null && auswahl < sichtbar.length ? auswahl : sichtbar.length - 1
  const zeigeP = sichtbar[iZeige]
  const zeigeE = ein[versatz + iZeige]
  const bestP = sichtbar.reduce<Punkt | null>((b, p) => (!b || p.zahl > b.zahl ? p : b), null)

  // Zahl und Einheit getrennt, damit die Zahl gross stehen kann.
  const teile = (v: number): [string, string] => {
    switch (kenn) {
      case 'wdh':
        return [String(v), 'Wdh']
      case 'zeit':
        return zeitTeile(v)
      case 'strecke':
        return streckeTeile(v)
      case 'tempo':
        return [formatZahl(v), 'km/h']
      case 'volumen':
        return [formatTausend(v), 'kg']
      // Das 1RM ist geschaetzt - eine Nachkommastelle genuegt.
      case '1rm':
        return [formatZahl(Math.round(v * 10) / 10), 'kg']
      case 'gewicht':
        return [formatZahl(v), 'kg']
    }
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

  // Kachel: das juengste Training gegen ein frueheres, in der Kennzahl des Verlaufs.
  const diff = (b: Punkt) => {
    const d = punkte[punkte.length - 1].zahl - b.zahl
    const text = d === 0 ? `±0 ${teile(0)[1]}` : `${d > 0 ? '+' : '−'}${mitEinheit(Math.abs(d))}`
    return <em className={`f-diff${d > 0 ? ' gut' : ''}`}>{text}</em>
  }

  const stand = best ? satzTeile(best, erf) : null
  const rek = rekord ? satzTeile(rekord, erf) : null

  return (
    <Seite
      links={<Zurueck label="Zurück" onClick={back} />}
      rechts={<TextKnopf onClick={() => push({ name: 'uebungForm', id })}>Bearbeiten</TextKnopf>}
    >
      <header className="f-kopf">
        <h1 className="f-h1">{u.name}</h1>
      </header>
      {u.notiz ? <Zettel text={u.notiz} onClick={() => notizAendern(u)} /> : null}

      {letzte && stand ? (
        <>
          <div className="f-stand">
            <span className="f-zahl gross">
              <b>{stand[0]}</b>
              <small>{stand[2] ? `${stand[1]} ${stand[2]}` : stand[1]}</small>
            </span>
            <span className="f-stand-wann">{wieLange(tagVon(letzte.training.start), heute)}</span>
          </div>

          <div className="f-kacheln">
            <div className="f-kachel">
              <small>Seit Start</small>
              {ein.length > 1 ? diff(punkte[0]) : <em className="f-diff">–</em>}
              <span>{formatKurz(tagVon(ein[0].training.start), heute)}</span>
            </div>
            <div className="f-kachel">
              <small>Seit letztem</small>
              {ein.length > 1 ? diff(punkte[punkte.length - 2]) : <em className="f-diff">–</em>}
              <span>{ein.length > 1 ? formatKurz(tagVon(ein[ein.length - 2].training.start), heute) : 'erstes Mal'}</span>
            </div>
            {rekord && rek ? (
              <div className="f-kachel">
                <small>Rekord</small>
                <em className="f-diff">{erf === 'zeit' ? formatSek(rekord.sek ?? 0) : `${rek[0]} ${rek[1]}`}</em>
                <span>
                  {rek[2] ? `${rek[2]} · ` : ''}
                  {formatKurz(tagVon(ein.find((e) => e.saetze.includes(rekord))?.training.start ?? 0), heute)}
                </span>
              </div>
            ) : null}
          </div>

          <section className="f-karte-flach">
            <div className={arten.length > 1 ? 'f-seg-doppel' : ''}>
              {arten.length > 1 ? (
                <Segment
                  label="Kennzahl"
                  optionen={arten.map((a) => ({ id: a, label: ART_LABEL[a] }))}
                  wert={kenn}
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
                    {KENNZAHL_TEXT[kenn]} · {relativTag(zeigeP.tag, heute)}
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
