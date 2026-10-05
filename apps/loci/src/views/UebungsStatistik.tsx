import { Bestaetigen } from '../ui'
import { LETZTE_MAX, quote, schnitt, zaehle, type Schwaechen } from '../statistik'
import { sekunden, sekundenZahl } from '../util'
import type { Ergebnis, Gesamt } from '../types'

// Unter der Aufgabe, gleich fuer Wochentag und Rechnen: Diese Runde, Tabelle,
// Schwaechen und Zuruecksetzen.

const prozent = (g: Gesamt) => {
  const q = quote(g)
  return q === null ? '–' : `${q} %`
}
const zeitOderStrich = (ms: number | null) => (ms === null ? '–' : sekunden(ms))

export default function UebungsStatistik({
  runde,
  gesamt,
  letzteAnzahl,
  sw,
  onReset,
}: {
  runde: Ergebnis[]
  gesamt: Gesamt
  /** wie viele Aufgaben einzeln gespeichert sind (fuer den Schwaechen-Hinweis) */
  letzteAnzahl: number
  sw: Schwaechen | null
  onReset: () => void
}) {
  const rundeG = zaehle(runde)
  const ds = schnitt(rundeG)

  return (
    <>
      <section className="l-sec">
        <div className="l-sec-kopf">
          <h2 className="l-h2">Diese Runde</h2>
          <span className="l-num l-s2">
            {rundeG.anzahl ? `${rundeG.richtig} von ${rundeG.anzahl} richtig${ds !== null ? ` · Ø ${sekunden(ds)}` : ''}` : 'noch keine Aufgabe'}
          </span>
        </div>
        {runde.length ? (
          <div className="l-punkte" aria-label="Letzte Ergebnisse">
            {runde.slice(-12).map((a, i) => (
              <span key={`${runde.length}:${i}`} className={`l-punkt ${a.t ? 'tip' : a.r ? 'gut' : 'schlecht'}`}>
                {a.t ? 'T' : a.r ? sekundenZahl(a.z) : '✗'}
              </span>
            ))}
          </div>
        ) : null}
      </section>

      <section className="l-sec">
        <h2 className="l-h2">Statistik</h2>
        <div className="l-tabelle">
          <div className="l-trow kopf">
            <span />
            <span>Diese Runde</span>
            <span>Gesamt</span>
          </div>
          {(
            [
              ['Aufgaben', String(rundeG.anzahl), String(gesamt.anzahl)],
              ['Richtig', prozent(rundeG), prozent(gesamt)],
              ['Ø Zeit (richtige)', zeitOderStrich(schnitt(rundeG)), zeitOderStrich(schnitt(gesamt))],
              ['Bestzeit', zeitOderStrich(rundeG.best), zeitOderStrich(gesamt.best)],
              ['Mit Tipp', String(rundeG.mitTipp), String(gesamt.mitTipp)],
            ] as const
          ).map(([name, a, b]) => (
            <div className="l-trow" key={name}>
              <span>{name}</span>
              <span>{a}</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="l-sec">
        <h2 className="l-h2">Schwächen</h2>
        {sw === null ? (
          <p className="l-note">Ab 20 Aufgaben siehst du hier, wo du oft danebenliegst. Noch {20 - letzteAnzahl}.</p>
        ) : (
          <>
            <p className="l-note">
              Aus den letzten {Math.min(letzteAnzahl, LETZTE_MAX)} Aufgaben, mit Tipp zählt wie falsch. Der Strich ist dein
              Schnitt: {Math.round(sw.schnitt * 100)} % falsch.
            </p>
            {sw.gruppen.length ? (
              <div className="l-schwaechen">
                {sw.gruppen.map((g) => (
                  <div className="l-schwaeche" key={g.name}>
                    <div className="l-schwaeche-kopf">
                      <span>{g.name}</span>
                      <span className="l-num l-s2">
                        {g.falsch} von {g.anzahl} falsch
                      </span>
                    </div>
                    <div className="l-balken">
                      <i style={{ width: `${(100 * g.falsch) / g.anzahl}%` }} />
                      <b style={{ left: `${sw.schnitt * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="l-note">Nichts Auffälliges: keine Gruppe liegt über deinem Schnitt.</p>
            )}
          </>
        )}
      </section>

      {gesamt.anzahl || runde.length ? (
        <Bestaetigen label="Statistik zurücksetzen" frage="Wirklich zurücksetzen? Nochmal tippen" onConfirm={onReset} />
      ) : null}
    </>
  )
}
