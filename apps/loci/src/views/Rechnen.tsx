import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IconBulb, IconClock, IconDown } from '../icons'
import { AppsKnopf, Laufuhr, Rechenweg, Ziffernblock, useStoppuhr } from '../ui'
import { hinweisRechnen, maxStellen, rechenweg, stufeName, zufallsaufgabe } from '../rechnen'
import { schwaechenRechnen } from '../statistik'
import { getRechnen, rechnenZuruecksetzen, speichereRechenAufgabe } from '../store'
import { sekunden } from '../util'
import type { Einstellungen, RechenAufgabe } from '../types'
import RechnenAnleitung from './RechnenAnleitung'
import StufeBlatt from './Stufe'
import UebungsStatistik from './UebungsStatistik'

// Multiplizieren: Aufgabe, Antwort ueber den Ziffernblock, danach immer der
// Rechenweg. Aufbau wie beim Wochentag (Uhr, Tipp, Statistik, Schwaechen).
export default function Rechnen({
  aktiv,
  einst,
  aendere,
}: {
  aktiv: boolean
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
}) {
  const { stufe, methode } = einst.rechnen
  const [aufgabe, setAufgabe] = useState(() => zufallsaufgabe(stufe))
  const [nummer, setNummer] = useState(1)
  const [eingabe, setEingabe] = useState('')
  const [tipps, setTipps] = useState(0)
  const [antwort, setAntwort] = useState<{ wert: number; zeit: number } | null>(null)
  const [blatt, setBlatt] = useState<'anleitung' | 'stufe' | null>(null)
  const [daten, setDaten] = useState(getRechnen)
  const [runde, setRunde] = useState<RechenAufgabe[]>([])
  const bodyRef = useRef<HTMLDivElement>(null)

  // Beim ersten Besuch des Reiters liegt die Anleitung offen.
  useEffect(() => {
    if (aktiv && !einst.anleitungRechnen) setBlatt('anleitung')
  }, [aktiv, einst.anleitungRechnen])

  const pausiert = !aktiv || blatt !== null || antwort !== null
  const { zeit: uhrZeit, neu: uhrNeu } = useStoppuhr(pausiert)
  const weg = useMemo(() => rechenweg(aufgabe.x, aufgabe.y, methode), [aufgabe, methode])
  const ergebnis = aufgabe.x * aufgabe.y
  const vonRechts = methode === 'ueberkreuz'

  const nachOben = () => bodyRef.current?.scrollTo({ top: 0, behavior: 'smooth' })

  const neueAufgabe = () => {
    setAufgabe(zufallsaufgabe(stufe, aufgabe))
    setNummer((n) => n + 1)
    setEingabe('')
    setTipps(0)
    setAntwort(null)
    uhrNeu(!aktiv || blatt !== null)
    nachOben()
  }

  // Neue Stufe: sofort eine neue Aufgabe, die offene verfaellt.
  const letzteStufe = useRef(stufe)
  useEffect(() => {
    if (letzteStufe.current === stufe) return
    letzteStufe.current = stufe
    neueAufgabe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stufe])

  // Ueberkreuz liefert die Ziffern von hinten - dann waechst die Zahl nach links.
  const tippe = (z: string) => {
    if (antwort || eingabe.length >= maxStellen(aufgabe.x, aufgabe.y)) return
    setEingabe((e) => (vonRechts ? z + e : e + z))
  }
  const loesche = () => setEingabe((e) => (vonRechts ? e.slice(1) : e.slice(0, -1)))

  const pruefe = () => {
    if (antwort || !eingabe) return
    const zeit = Math.round(uhrZeit())
    const wert = Number(eingabe)
    const eintrag: RechenAufgabe = { x: aufgabe.x, y: aufgabe.y, a: wert, r: wert === ergebnis, z: zeit, t: tipps }
    setAntwort({ wert, zeit })
    setRunde((x) => [...x, eintrag])
    setDaten(speichereRechenAufgabe(eintrag))
    nachOben()
  }

  // Tasten am Rechner: Ziffern, ⌫, Enter (pruefen bzw. naechste Aufgabe).
  useEffect(() => {
    if (!aktiv || blatt) return
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      const ziel = ev.target
      if (ziel instanceof HTMLInputElement) return
      if (ziel instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (!antwort && /^\d$/.test(ev.key)) tippe(ev.key)
      else if (!antwort && ev.key === 'Backspace') loesche()
      else if (ev.key === 'Enter') {
        if (antwort) neueAufgabe()
        else pruefe()
      } else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  const angezeigt = useCallback(() => (antwort ? antwort.zeit : uhrZeit()), [antwort, uhrZeit])
  const richtig = antwort ? antwort.wert === ergebnis : false
  const tipp = antwort && !richtig ? hinweisRechnen(ergebnis, antwort.wert) : null

  return (
    <div className="l-screen" hidden={!aktiv}>
      <header className="l-head">
        <AppsKnopf />
        <div className="l-head-r">
          <button type="button" className="l-pill-knopf" aria-label="Stufe und Rechenweg wählen" onClick={() => setBlatt('stufe')}>
            <span className="l-pill">
              {stufeName(stufe)}
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
            <h1 className="l-datum">
              {aufgabe.x} × {aufgabe.y}
            </h1>
            {antwort ? null : (
              <p className={`l-eingabe${eingabe ? '' : ' leer'}${vonRechts ? ' rechts' : ''}`} aria-live="polite">
                <span>=</span>
                <b>{eingabe || '?'}</b>
              </p>
            )}
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
              {weg.schritte.map((s, i) => (
                <div key={s.text} className={`l-baustein${i < tipps ? ' offen' : ''}`}>
                  <span className="nr">{i + 1}</span>
                  <span className="was">
                    {i < tipps ? s.text : methode === 'zerlegen' ? 'Teilprodukt' : 'Spalte'}
                    {i < tipps && s.klein ? <small>{s.klein}</small> : null}
                  </span>
                  {i < tipps ? <b>{s.wert}</b> : <i aria-label="noch verdeckt">?</i>}
                </div>
              ))}
              {tipps < weg.schritte.length ? (
                <button type="button" className="l-tipp-weiter" onClick={() => setTipps((t) => Math.min(weg.schritte.length, t + 1))}>
                  <IconBulb />
                  Nächster Tipp · {tipps + 1} von {weg.schritte.length}
                </button>
              ) : null}
            </div>
          ) : null}
        </main>

        {!antwort ? (
          <div className="l-rechnen-tasten">
            <Ziffernblock onZiffer={tippe} onLoeschen={loesche} onOk={pruefe} okBereit={eingabe.length > 0} />
            <p className="l-note l-center">
              {vonRechts ? 'Überkreuz: Ziffern von rechts eintippen.' : 'Zerlegen: Ziffern von links eintippen.'}
              {tipps > 0 ? ' Mit Tipp zählt die Aufgabe nicht als richtig.' : ''}
            </p>
          </div>
        ) : (
          <section className="l-loesung" aria-live="polite">
            <div className="l-urteil">
              <h2 className={richtig ? (tipps ? 'tip' : 'gut') : 'schlecht'}>
                {richtig ? (tipps ? 'Richtig mit Tipp' : 'Richtig') : 'Leider falsch'}: {ergebnis}
              </h2>
              {einst.uhr ? <span className="l-num">{sekunden(antwort.zeit)}</span> : null}
            </div>
            {!richtig ? <p className="l-deine">Deine Antwort: {antwort.wert}</p> : null}
            {tipp ? (
              <p className="l-hinweis">
                <strong>{tipp.kurz}</strong> {tipp.text}
              </p>
            ) : null}
            <Rechenweg l={weg} />
          </section>
        )}

        <UebungsStatistik
          runde={runde}
          gesamt={daten.gesamt}
          letzteAnzahl={daten.letzte.length}
          sw={schwaechenRechnen(daten.letzte)}
          onReset={() => {
            setDaten(rechnenZuruecksetzen())
            setRunde([])
          }}
        />
      </div>

      {antwort ? (
        <div className="l-foot">
          <button type="button" className="l-btn" onClick={neueAufgabe}>
            Nächste Aufgabe
          </button>
        </div>
      ) : null}

      {blatt === 'anleitung' ? (
        <RechnenAnleitung
          methode={methode}
          onClose={() => {
            setBlatt(null)
            if (!einst.anleitungRechnen) aendere({ anleitungRechnen: true })
          }}
        />
      ) : null}
      {blatt === 'stufe' ? <StufeBlatt einst={einst} aendere={aendere} onClose={() => setBlatt(null)} /> : null}
    </div>
  )
}
