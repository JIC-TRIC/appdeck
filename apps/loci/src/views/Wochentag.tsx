import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconBulb, IconClock, IconDown } from '../icons'
import { AppsKnopf, Bestaetigen, Laufuhr, Rechenweg, useStoppuhr } from '../ui'
import { quote, schnitt, schwaechen, zaehle } from '../statistik'
import { getWochentag, speichereAufgabe, wochentagZuruecksetzen } from '../store'
import { sekunden, sekundenZahl } from '../util'
import {
  WOCHENTAGE,
  bausteine,
  datumIso,
  datumKurz,
  datumLang,
  hinweis,
  jahre,
  loese,
  zeitraumName,
  zufallsdatum,
} from '../wochentag'
import type { Aufgabe, Datum, Einstellungen, WtGesamt } from '../types'
import Anleitung from './Anleitung'
import ZeitraumBlatt from './Zeitraum'

// Montag bis Sonntag; die kleine Zahl ist das Ergebnis der Formel.
const KNOEPFE = [1, 2, 3, 4, 5, 6, 0]

const prozent = (g: WtGesamt) => {
  const q = quote(g)
  return q === null ? '–' : `${q} %`
}
const zeitOderStrich = (ms: number | null) => (ms === null ? '–' : sekunden(ms))

export default function Wochentag({
  aktiv,
  einst,
  aendere,
}: {
  aktiv: boolean
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
}) {
  const [aufgabe, setAufgabe] = useState<Datum>(() => zufallsdatum(jahre(einst.zeitraum)))
  const [nummer, setNummer] = useState(1)
  const [tipps, setTipps] = useState(0)
  const [antwort, setAntwort] = useState<{ gewaehlt: number; zeit: number } | null>(null)
  // Beim allerersten Start liegt die Anleitung schon offen.
  const [blatt, setBlatt] = useState<'anleitung' | 'zeitraum' | null>(() => (aktiv && !einst.anleitungGesehen ? 'anleitung' : null))
  const [daten, setDaten] = useState(getWochentag)
  // Diese Runde: seit dem Start der App.
  const [runde, setRunde] = useState<Aufgabe[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  // Die Uhr steht, solange ein Blatt offen ist, der andere Reiter gezeigt wird
  // oder die Aufgabe beantwortet ist.
  const pausiert = !aktiv || blatt !== null || antwort !== null
  const { zeit: uhrZeit, neu: uhrNeu } = useStoppuhr(pausiert)
  const l = useMemo(() => loese(aufgabe), [aufgabe])

  const nachOben = () => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const neueAufgabe = () => {
    setAufgabe(zufallsdatum(jahre(einst.zeitraum), aufgabe))
    setNummer((n) => n + 1)
    setTipps(0)
    setAntwort(null)
    uhrNeu(!aktiv || blatt !== null)
    nachOben()
  }

  // Neuer Zeitraum: sofort ein neues Datum, die offene Aufgabe verfaellt.
  const zeitraumKey = `${einst.zeitraum.id}:${einst.zeitraum.von}:${einst.zeitraum.bis}`
  const letzterZeitraum = useRef(zeitraumKey)
  useEffect(() => {
    if (letzterZeitraum.current === zeitraumKey) return
    letzterZeitraum.current = zeitraumKey
    neueAufgabe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zeitraumKey])

  const antworte = (gewaehlt: number) => {
    if (antwort) return
    const zeit = Math.round(uhrZeit())
    const eintrag: Aufgabe = { d: datumIso(aufgabe), a: gewaehlt, r: gewaehlt === l.ergebnis, z: zeit, t: tipps }
    setAntwort({ gewaehlt, zeit })
    setRunde((x) => [...x, eintrag])
    setDaten(speichereAufgabe(eintrag))
    nachOben()
  }

  // Tasten am Rechner wie im Original: 1-6 = Mo-Sa, 0 oder 7 = So, danach Enter/Leertaste.
  useEffect(() => {
    if (!aktiv || blatt) return
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      const ziel = ev.target
      if (ziel instanceof HTMLInputElement || ziel instanceof HTMLTextAreaElement) return
      if (ziel instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (!antwort && /^[0-7]$/.test(ev.key)) {
        ev.preventDefault()
        antworte(Number(ev.key) % 7)
      } else if (antwort && (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault()
        neueAufgabe()
      }
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  const angezeigt = useCallback(() => (antwort ? antwort.zeit : uhrZeit()), [antwort, uhrZeit])

  const richtig = antwort ? antwort.gewaehlt === l.ergebnis : false
  const tipp = antwort && !richtig ? hinweis(aufgabe, antwort.gewaehlt, l.ergebnis) : null
  const rundeG = zaehle(runde)
  const sw = schwaechen(daten.letzte)

  return (
    <div className="l-screen" hidden={!aktiv}>
      <header className="l-head">
        <AppsKnopf />
        <div className="l-head-r">
          <button type="button" className="l-pill-knopf" aria-label="Zeitraum wählen" onClick={() => setBlatt('zeitraum')}>
            <span className="l-pill">
              {zeitraumName(einst.zeitraum)}
              <IconDown />
            </span>
          </button>
          <button type="button" className="l-hilfe" aria-label="Anleitung" onClick={() => setBlatt('anleitung')}>
            <span>?</span>
          </button>
        </div>
      </header>

      <div className="l-body" ref={bodyRef}>
        <main className={`l-card l-aufgabe${antwort ? ' kompakt' : ''}`}>
          <div className="l-meta">
            <span>Aufgabe {nummer}</span>
            {tipps > 0 ? <span className="l-badge">Mit Tipp</span> : null}
            {einst.uhr ? (
              <span className="l-uhr">
                <IconClock />
                <Laufuhr zeit={angezeigt} laeuft={!pausiert} format={sekunden} />
              </span>
            ) : (
              <span />
            )}
          </div>
          <div className="l-frage">
            {antwort ? null : <p className="l-frage-text">Welcher Wochentag ist der</p>}
            <h1 className="l-datum">{datumLang(aufgabe)}</h1>
            <p className="l-datum-num">{datumKurz(aufgabe)}</p>
          </div>

          {!antwort && tipps === 0 ? (
            <div className="l-mitte">
              <button type="button" className="l-tipp-knopf" onClick={() => setTipps(1)}>
                <IconBulb />
                Tipp
              </button>
            </div>
          ) : null}

          {!antwort && tipps > 0 ? (
            <div className="l-tipps">
              {bausteine(aufgabe).map((b, i) => (
                <div key={b.name} className={`l-baustein${i < tipps ? ' offen' : ''}`}>
                  <span className="nr">{i + 1}</span>
                  <span className="was">
                    {b.name}
                    {i < tipps ? <small>{b.rechnung}</small> : null}
                  </span>
                  {i < tipps ? <b>{b.wert}</b> : <i aria-label="noch verdeckt">?</i>}
                </div>
              ))}
              {tipps < 5 ? (
                <button type="button" className="l-tipp-weiter" onClick={() => setTipps((t) => Math.min(5, t + 1))}>
                  <IconBulb />
                  Nächster Tipp · {tipps + 1} von 5
                </button>
              ) : null}
            </div>
          ) : null}
        </main>

        <div className="l-tage" role="group" aria-label="Wochentag wählen">
          {KNOEPFE.map((n) => {
            const zustand = !antwort ? '' : n === l.ergebnis ? ' richtig' : n === antwort.gewaehlt ? ' falsch' : ' blass'
            return (
              <button
                key={n}
                type="button"
                className={`l-tag${zustand}`}
                aria-label={WOCHENTAGE[n]}
                disabled={!!antwort}
                onClick={() => antworte(n)}
              >
                <b>{WOCHENTAGE[n].slice(0, 2)}</b>
                <small>{n}</small>
              </button>
            )
          })}
        </div>

        {!antwort && tipps > 0 ? <p className="l-note l-center">Mit Tipp zählt die Aufgabe nicht als richtig.</p> : null}

        {antwort ? (
          <section className="l-loesung" aria-live="polite">
            <div className="l-urteil">
              <h2 className={richtig ? (tipps ? 'tip' : 'gut') : 'schlecht'}>
                {richtig ? (tipps ? 'Richtig mit Tipp' : 'Richtig') : 'Leider falsch'}: {WOCHENTAGE[l.ergebnis]}
              </h2>
              {einst.uhr ? <span className="l-num">{sekunden(antwort.zeit)}</span> : null}
            </div>
            {!richtig ? (
              <p className="l-deine">
                Deine Antwort: {WOCHENTAGE[antwort.gewaehlt]} ({antwort.gewaehlt})
              </p>
            ) : null}
            {tipp ? (
              <p className="l-hinweis">
                <strong>{tipp.kurz}</strong> {tipp.text}
              </p>
            ) : null}
            <Rechenweg l={l} />
          </section>
        ) : null}

        <section className="l-sec">
          <div className="l-sec-kopf">
            <h2 className="l-h2">Diese Runde</h2>
            <span className="l-num l-s2">
              {rundeG.anzahl
                ? `${rundeG.richtig} von ${rundeG.anzahl} richtig${schnitt(rundeG) !== null ? ` · Ø ${sekunden(schnitt(rundeG)!)}` : ''}`
                : 'noch keine Aufgabe'}
            </span>
          </div>
          {runde.length ? (
            <div className="l-punkte" aria-label="Letzte Ergebnisse">
              {runde.slice(-12).map((a, i) => (
                <span
                  key={`${runde.length}:${i}`}
                  className={`l-punkt ${a.t ? 'tip' : a.r ? 'gut' : 'schlecht'}`}
                  title={a.d}
                >
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
                ['Aufgaben', String(rundeG.anzahl), String(daten.gesamt.anzahl)],
                ['Richtig', prozent(rundeG), prozent(daten.gesamt)],
                ['Ø Zeit (richtige)', zeitOderStrich(schnitt(rundeG)), zeitOderStrich(schnitt(daten.gesamt))],
                ['Bestzeit', zeitOderStrich(rundeG.best), zeitOderStrich(daten.gesamt.best)],
                ['Mit Tipp', String(rundeG.mitTipp), String(daten.gesamt.mitTipp)],
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
            <p className="l-note">
              Ab 20 Aufgaben siehst du hier, wo du oft danebenliegst. Noch {20 - daten.letzte.length}.
            </p>
          ) : (
            <>
              <p className="l-note">
                Aus den letzten {Math.min(daten.letzte.length, 200)} Aufgaben, mit Tipp zählt wie falsch. Der Strich ist dein
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

        {daten.gesamt.anzahl || runde.length ? (
          <Bestaetigen
            label="Statistik zurücksetzen"
            frage="Wirklich zurücksetzen? Nochmal tippen"
            onConfirm={() => {
              setDaten(wochentagZuruecksetzen())
              setRunde([])
            }}
          />
        ) : null}
      </div>

      {antwort ? (
        <div className="l-foot">
          <button type="button" className="l-btn" onClick={neueAufgabe}>
            Nächstes Datum
          </button>
        </div>
      ) : null}

      {blatt === 'anleitung' ? (
        <Anleitung
          onClose={() => {
            setBlatt(null)
            if (!einst.anleitungGesehen) aendere({ anleitungGesehen: true })
          }}
        />
      ) : null}
      {blatt === 'zeitraum' ? <ZeitraumBlatt einst={einst} aendere={aendere} onClose={() => setBlatt(null)} /> : null}
    </div>
  )
}
