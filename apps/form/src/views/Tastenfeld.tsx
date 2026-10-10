import { Fragment, useState } from 'react'
import { IconLoeschTaste, IconX } from '../icons'
import { scheiben, vollstaendig, type Zahlen } from '../trainingCalc'
import { Blatt } from '../ui'
import { formatZahl, parseZahl, rund } from '../util'
import type { Erfassung } from '../types'

// Eigenes Tastenfeld statt der iOS-Tastatur: groessere Tasten und
// +- der Gewichtsschritt der Uebung (bzw. +-1 Wdh, +-5 s) auf einen Tipp. Bei
// Langhantel-Uebungen steht darunter, welche Scheiben pro Seite drauf muessen. Jeder Tastendruck wird sofort
// gesichert - wer das Blatt wegwischt, verliert nichts. "Abhaken" nimmt fuer
// leere Felder das Graue (das letzte Mal).

export type Feld = 'kg' | 'wdh' | 'sek'

export const FELDER: Record<Erfassung, Feld[]> = { gewicht: ['kg', 'wdh'], wdh: ['wdh'], zeit: ['sek'] }
export const FELDNAME: Record<Feld, string> = { kg: 'kg', wdh: 'Wdh', sek: 'Sek' }
const SCHRITT: Record<Exclude<Feld, 'kg'>, number> = { wdh: 1, sek: 5 }
const TASTEN = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0']

const alsText = (f: Feld, v: number | null) => (v === null ? '' : f === 'kg' ? formatZahl(v) : String(v))

function alsZahl(f: Feld, text: string): number | null {
  const z = parseZahl(text)
  if (z === null || z < 0) return null
  return f === 'kg' ? rund(z) : Math.round(z)
}

const zahlenAus = (t: Record<Feld, string>): Zahlen => ({
  kg: alsZahl('kg', t.kg),
  wdh: alsZahl('wdh', t.wdh),
  sek: alsZahl('sek', t.sek),
})

export function Tastenfeld({
  titel,
  untertitel,
  erf,
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
    kg: alsText('kg', werte.kg),
    wdh: alsText('wdh', werte.wdh),
    sek: alsText('sek', werte.sek),
  }))
  // Der erste Tastendruck in einem Feld ersetzt, was drinsteht.
  const [frisch, setFrisch] = useState(true)

  const setze = (text: string, nochFrisch = false) => {
    const neu = { ...texte, [feld]: text }
    setTexte(neu)
    setFrisch(nochFrisch)
    onAendern(zahlenAus(neu))
  }

  const taste = (k: string) => {
    const alt = frisch ? '' : texte[feld]
    if (k === ',') {
      if (feld === 'kg' && !alt.includes(',')) setze(`${alt || '0'},`)
      return
    }
    const neu = alt === '0' ? k : alt + k
    const komma = neu.indexOf(',')
    if (neu.replace(',', '').length > 5 || (komma >= 0 && neu.length - komma - 1 > 2)) return
    setze(neu)
  }

  const s = feld === 'kg' ? kgSchritt : SCHRITT[feld]

  const schritt = (vz: 1 | -1) => {
    const basis = alsZahl(feld, texte[feld]) ?? platzhalter?.[feld] ?? 0
    setze(alsText(feld, Math.max(0, rund(basis + vz * s))), true)
  }

  const wechsle = (f: Feld) => {
    setFeld(f)
    setFrisch(true)
    onFeld(f)
  }

  const abhaken = (schliessen: () => void) => {
    const z = zahlenAus(texte)
    const voll: Zahlen = {
      kg: z.kg ?? platzhalter?.kg ?? null,
      wdh: z.wdh ?? platzhalter?.wdh ?? null,
      sek: z.sek ?? platzhalter?.sek ?? null,
    }
    if (!vollstaendig(voll, erf)) {
      const fehlt = FELDER[erf].find((f) => voll[f] === null) ?? feld
      wechsle(fehlt)
      melde(fehlt === 'kg' ? 'Erst das Gewicht eintragen' : fehlt === 'wdh' ? 'Erst die Wdh eintragen' : 'Erst die Zeit eintragen')
      return
    }
    onAbhaken(voll)
    schliessen()
  }

  const schrittText = feld === 'sek' ? `${s} s` : formatZahl(s)

  // Scheiben pro Seite fuer das Gewicht, das gerade gilt (getippt oder grau).
  const kg = alsZahl('kg', texte.kg) ?? platzhalter?.kg ?? null
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
                  {i ? <span className="f-mal">×</span> : null}
                  <button
                    type="button"
                    className={`f-wahl-box${f === feld ? ' an' : ''}`}
                    onClick={() => wechsle(f)}
                    aria-pressed={f === feld}
                  >
                    <small>{FELDNAME[f]}</small>
                    <b className={texte[f] ? '' : 'ph'}>{texte[f] || (grau !== null ? alsText(f, grau) : '–')}</b>
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
              −{schrittText}
            </button>
            <button type="button" onClick={() => schritt(1)}>
              +{schrittText}
            </button>
          </div>

          <div className="f-pad">
            {TASTEN.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => taste(k)}
                disabled={k === ',' && feld !== 'kg'}
                className={k === ',' && feld !== 'kg' ? 'aus' : ''}
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
