import { Fragment, useState } from 'react'
import { IconLoeschTaste, IconX } from '../icons'
import {
  FELDER,
  alsUhr,
  ausUhrZiffern,
  inMetern,
  scheiben,
  streckeName,
  uhrZiffern,
  vollstaendig,
  type Feld,
  type Zahlen,
} from '../trainingCalc'
import { Blatt } from '../ui'
import { formatZahl, parseZahl, rund } from '../util'
import type { Erfassung, StreckenEinheit } from '../types'

// Eigenes Tastenfeld statt der iOS-Tastatur: groessere Tasten und
// +- der Gewichtsschritt der Uebung (bzw. +-1 Wdh, +-5 s, +-100 m, +-1 Stockwerk) auf einen Tipp. Bei
// Langhantel-Uebungen steht darunter, welche Scheiben pro Seite drauf muessen. Jeder Tastendruck wird sofort
// gesichert - wer das Blatt wegwischt, verliert nichts. "Abhaken" nimmt fuer
// leere Felder das Graue (das letzte Mal).
//
// Zeiten tippt man wie an der Mikrowelle ('2830' ist 28:30, trainingCalc.ts),
// Strecken in der Einheit der Uebung: km mit Komma, m, Stockwerke, Stufen
// oder Runden als ganze Zahl.

export type { Feld }

/** Wie ein Feld fuer Vorlesen und Meldungen heisst - die Strecke nach ihrer Einheit ('Stockwerke'). */
export const feldName = (f: Feld, einheit: StreckenEinheit) =>
  f === 'm' ? streckeName(einheit) : { kg: 'kg', wdh: 'Wdh', sek: 'Zeit' }[f]
const fehlt = (f: Feld, einheit: StreckenEinheit) =>
  f === 'kg' ? 'Erst das Gewicht eintragen' : `Erst die ${feldName(f, einheit)} eintragen`
/** Zwischen den Feldern: 82,5 × 8, aber 5 km in 26:30. */
export const trenner = (erf: Erfassung) => (erf === 'strecke' ? 'in' : '×')
const TASTEN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0']

/** Die Zahl als Text zum Weitertippen - Zeiten als Ziffern ('130'), Strecken in km oder als ganze Zahl. */
function alsText(f: Feld, v: number | null, einheit: StreckenEinheit): string {
  if (v === null) return ''
  if (f === 'kg') return formatZahl(v)
  if (f === 'sek') return uhrZiffern(v)
  if (f === 'm' && einheit === 'km') return formatZahl(v / 1000)
  return String(v)
}

function alsZahl(f: Feld, text: string, einheit: StreckenEinheit): number | null {
  if (f === 'sek') return ausUhrZiffern(text)
  const z = parseZahl(text)
  if (z === null || z < 0) return null
  if (f === 'kg') return rund(z)
  return Math.round(f === 'm' && einheit === 'km' ? z * 1000 : z)
}

/** -/+ in der Einheit, in der gespeichert wird (kg, Wdh, s, m, Stueck). */
function schrittFuer(f: Feld, erf: Erfassung, einheit: StreckenEinheit, kgSchritt: number) {
  if (f === 'kg') return kgSchritt
  if (f === 'wdh') return 1
  if (f === 'sek') return erf === 'strecke' ? 60 : 5
  return einheit === 'km' ? 100 : einheit === 'm' || einheit === 'stufen' ? 10 : 1
}

function schrittText(f: Feld, s: number, einheit: StreckenEinheit) {
  if (f === 'sek') return s < 60 ? `${s} s` : `${s / 60} min`
  if (f === 'm' && einheit === 'km') return `${formatZahl(s / 1000)} km`
  if (f === 'm' && einheit === 'm') return `${s} m`
  return formatZahl(s)
}

/** So steht der Text im Feld: Zeiten mit Doppelpunkt. */
const anzeige = (f: Feld, text: string) => (f === 'sek' ? alsUhr(text) : text)

const zahlenAus = (t: Record<Feld, string>, einheit: StreckenEinheit): Zahlen => ({
  kg: alsZahl('kg', t.kg, einheit),
  wdh: alsZahl('wdh', t.wdh, einheit),
  sek: alsZahl('sek', t.sek, einheit),
  m: alsZahl('m', t.m, einheit),
})

export function Tastenfeld({
  titel,
  untertitel,
  erf,
  einheit,
  start,
  werte,
  platzhalter,
  info,
  schritt: kgSchritt,
  stange,
  erledigt,
  melde,
  onFeld,
  onAendern,
  onAbhaken,
  onClose,
}: {
  titel: string
  untertitel: string
  erf: Erfassung
  einheit: StreckenEinheit
  start: Feld
  werte: Zahlen
  platzhalter: Zahlen | null
  /** "Zuletzt bei Push: 30 × 9" */
  info: string | null
  /** Gewichtsschritt der Uebung (kg) */
  schritt: number
  /** Stange fuer den Scheibenrechner, null = keine Langhantel */
  stange: number | null
  erledigt: boolean
  melde: (text: string) => void
  onFeld: (f: Feld) => void
  onAendern: (z: Zahlen) => void
  onAbhaken: (z: Zahlen) => void
  onClose: () => void
}) {
  const [feld, setFeld] = useState<Feld>(start)
  const [texte, setTexte] = useState<Record<Feld, string>>(() => ({
    kg: alsText('kg', werte.kg, einheit),
    wdh: alsText('wdh', werte.wdh, einheit),
    sek: alsText('sek', werte.sek, einheit),
    m: alsText('m', werte.m, einheit),
  }))
  // Der erste Tastendruck in einem Feld ersetzt, was drinsteht.
  const [frisch, setFrisch] = useState(true)

  const setze = (text: string, nochFrisch = false) => {
    const neu = { ...texte, [feld]: text }
    setTexte(neu)
    setFrisch(nochFrisch)
    onAendern(zahlenAus(neu, einheit))
  }

  const mitKomma = feld === 'kg' || (feld === 'm' && einheit === 'km')

  const taste = (k: string) => {
    const alt = frisch ? '' : texte[feld]
    if (k === ',') {
      if (mitKomma && !alt.includes(',')) setze(`${alt || '0'},`)
      return
    }
    const neu = alt === '0' ? k : alt + k
    const komma = neu.indexOf(',')
    // Zeiten bis 99:59:59 - sechs Ziffern, sonst fuenf.
    if (neu.replace(',', '').length > (feld === 'sek' ? 6 : 5) || (komma >= 0 && neu.length - komma - 1 > 2)) return
    setze(neu)
  }

  const s = schrittFuer(feld, erf, einheit, kgSchritt)

  const schritt = (vz: 1 | -1) => {
    const basis = alsZahl(feld, texte[feld], einheit) ?? platzhalter?.[feld] ?? 0
    setze(alsText(feld, Math.max(0, rund(basis + vz * s)), einheit), true)
  }

  const wechsle = (f: Feld) => {
    setFeld(f)
    setFrisch(true)
    onFeld(f)
  }

  const abhaken = (schliessen: () => void) => {
    const z = zahlenAus(texte, einheit)
    const voll: Zahlen = {
      kg: z.kg ?? platzhalter?.kg ?? null,
      wdh: z.wdh ?? platzhalter?.wdh ?? null,
      sek: z.sek ?? platzhalter?.sek ?? null,
      m: z.m ?? platzhalter?.m ?? null,
    }
    if (!vollstaendig(voll, erf)) {
      const leer = FELDER[erf].find((f) => voll[f] === null) ?? feld
      wechsle(leer)
      melde(fehlt(leer, einheit))
      return
    }
    onAbhaken(voll)
    schliessen()
  }

  // Scheiben pro Seite fuer das Gewicht, das gerade gilt (getippt oder grau).
  const kg = alsZahl('kg', texte.kg, einheit) ?? platzhalter?.kg ?? null
  let scheibenText = ''
  if (stange !== null && erf === 'gewicht' && kg !== null) {
    const pro = scheiben(kg, stange)
    scheibenText =
      pro === null
        ? kg < stange
          ? `Leichter als die Stange (${formatZahl(stange)} kg)`
          : 'Geht mit den Scheiben nicht genau auf'
        : pro.length
          ? `Je Seite ${pro.map(formatZahl).join(' · ')}`
          : 'Nur die Stange'
  }

  return (
    <Blatt label={`${titel}, ${untertitel}`} onClose={onClose}>
      {(schliessen) => (
        <>
          <div className="f-sheet-kopf">
            <div>
              <b>{titel}</b>
              <small>{untertitel}</small>
            </div>
            <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
              <IconX />
            </button>
          </div>

          <div className={`f-wahl${FELDER[erf].length === 1 ? ' einzeln' : ''}`}>
            {FELDER[erf].map((f, i) => {
              const grau = platzhalter?.[f] ?? null
              return (
                <Fragment key={f}>
                  {i ? <span className="f-mal">{trenner(erf)}</span> : null}
                  <button
                    type="button"
                    className={`f-wahl-box${f === feld ? ' an' : ''}`}
                    onClick={() => wechsle(f)}
                    aria-pressed={f === feld}
                  >
                    <small>{f === 'm' && inMetern(einheit) ? einheit : feldName(f, einheit)}</small>
                    <b className={texte[f] ? '' : 'ph'}>
                      {texte[f] ? anzeige(f, texte[f]) : grau !== null ? anzeige(f, alsText(f, grau, einheit)) : '–'}
                    </b>
                  </button>
                </Fragment>
              )
            })}
          </div>
          {info || scheibenText ? (
            <p className="f-wahl-info">
              {info}
              {info && scheibenText ? <br /> : null}
              {scheibenText ? <span className="f-scheiben">{scheibenText}</span> : null}
            </p>
          ) : null}

          <div className="f-schnell">
            <button type="button" onClick={() => schritt(-1)}>
              −{schrittText(feld, s, einheit)}
            </button>
            <button type="button" onClick={() => schritt(1)}>
              +{schrittText(feld, s, einheit)}
            </button>
          </div>

          <div className="f-pad">
            {TASTEN.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => taste(k)}
                disabled={k === ',' && !mitKomma}
                className={k === ',' && !mitKomma ? 'aus' : ''}
              >
                {k}
              </button>
            ))}
            <button type="button" onClick={() => setze(frisch ? '' : texte[feld].slice(0, -1))} aria-label="Löschen">
              <IconLoeschTaste />
            </button>
          </div>

          <button type="button" className="f-haupt" onClick={() => (erledigt ? schliessen() : abhaken(schliessen))}>
            {erledigt ? 'Fertig' : 'Abhaken'}
          </button>
        </>
      )}
    </Blatt>
  )
}
