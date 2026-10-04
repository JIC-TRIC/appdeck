import { useState } from 'react'
import { Blatt, BlattKopf, Rechenweg } from '../ui'
import { MONATE, MONATSZAHL, WOCHENTAGE, ausIso, datumLang, diesesJahr, jahrhundertzahl, loese, zwei } from '../wochentag'

// Der Spickzettel hinter "?": nur, was man addieren muss, plus Ausprobieren.
// Bewusst ohne Merkwoerter fuer die Monatszahlen (konzept.md, Datenschutz).

const ERGEBNIS = [1, 2, 3, 4, 5, 6, 0]
const JAHRHUNDERTE = [16, 17, 18, 19, 20, 21, 22, 23]

const BEISPIEL = [
  ['Tag 29 → 29 − 28', '1'],
  ['Monat Februar', '3'],
  ['Jahr 24 + 6 = 30 → 30 − 28', '2'],
  ['Jahrhundert 2000er', '6'],
  ['Schaltjahr, Februar', '−1'],
]

export default function Anleitung({ onClose }: { onClose: () => void }) {
  const heute = new Date()
  const jahr = heute.getFullYear()
  const [eingabe, setEingabe] = useState(`${jahr}-${zwei(heute.getMonth() + 1)}-${zwei(heute.getDate())}`)
  const datum = ausIso(eingabe)
  const dj = diesesJahr(jahr)

  return (
    <Blatt label="Anleitung Wochentag" gross onClose={onClose}>
      {(zu) => (
        <div className="l-anleitung">
          <BlattKopf titel="So rechnest du" onClose={zu} gross />

          <div className="l-formel">
            <p>Tag + Monat + Jahr + Jahrhundert</p>
            <p>− 1 im Jan/Feb eines Schaltjahres</p>
            <small>Dann mod 7: so oft 7 abziehen, bis 0 bis 6 übrig bleibt. Zwischendurch abziehen ist erlaubt.</small>
          </div>

          <h2>Ergebnis</h2>
          <div className="l-raster sieben">
            {ERGEBNIS.map((n) => (
              <div key={n} className="l-zelle">
                <b>{n}</b>
                <span>{WOCHENTAGE[n].slice(0, 2)}</span>
              </div>
            ))}
          </div>

          <h2>Monat</h2>
          <div className="l-raster drei">
            {MONATE.map((m, i) => (
              <div key={m} className="l-zelle quer">
                <span>{m.slice(0, 3)}</span>
                <b>{MONATSZAHL[i]}</b>
              </div>
            ))}
          </div>
          <p className="l-text2">
            Als Reihe in Vierteljahren: <strong className="l-num">033 · 614 · 625 · 035</strong>
          </p>

          <h2>Jahr</h2>
          <ol className="l-schritte">
            <li>
              Die letzten zwei Stellen: 1987 → <strong>87</strong>
            </li>
            <li>
              Ein Viertel davon dazu, Rest weglassen: 87 + 21 = <strong>108</strong>
            </li>
            <li>
              mod 7: 108 − 105 = <strong>3</strong>
            </li>
          </ol>
          <div className="l-kasten">
            <strong>Abkürzung:</strong> vorher 28, 56 oder 84 abziehen, das ändert nichts. 87 − 84 = 3 → 3 + 0 ={' '}
            <strong>3</strong>
          </div>

          <h2>Jahrhundert</h2>
          <div className="l-raster vier">
            {JAHRHUNDERTE.map((c) => (
              <div key={c} className={`l-zelle${c === 19 || c === 20 ? ' betont' : ''}`}>
                <span>{c}00er</span>
                <b>{jahrhundertzahl(c * 100)}</b>
              </div>
            ))}
          </div>
          <p className="l-text2">Muster 6 · 4 · 2 · 0, alle 400 Jahre von vorn. Für den Alltag reichen 1900er = 0 und 2000er = 6.</p>

          <h2>Schaltjahr</h2>
          <p>
            Nur im <strong>Januar und Februar</strong> eines Schaltjahres 1 abziehen, sonst nie.
          </p>
          <p className="l-text2">Schaltjahr: durch 4 teilbar. Volle Jahrhunderte nur, wenn durch 400 teilbar: 2000 ja, 1900 nein.</p>

          <div className="l-kasten flach">
            <p>
              <strong>Dieses Jahr: {jahr}</strong>
            </p>
            <p className="l-text2">
              Jahr {dj.jahr} + Jahrhundert {dj.jhd} = {dj.summe}
              {dj.summe >= 7 ? ` → ${dj.rest}` : ''}. Du rechnest nur{' '}
              <strong className="l-ink">Tag + Monat{dj.rest ? ` + ${dj.rest}` : ''}</strong>
              {dj.schalt ? ', im Januar und Februar noch − 1' : ''}.
            </p>
          </div>

          <h2>Beispiel: 29. Februar 2024</h2>
          <div className="l-rechenweg">
            {BEISPIEL.map(([a, w]) => (
              <div className="l-zeile" key={a}>
                <div>
                  <span>{a}</span>
                </div>
                <b>{w}</b>
              </div>
            ))}
            <div className="l-zeile summe">
              <div>
                <span>1 + 3 + 2 + 6 − 1 = 11 → 4</span>
              </div>
              <b className="l-akzent">Donnerstag</b>
            </div>
          </div>

          <h2>Ausprobieren</h2>
          <label className="l-feld">
            Datum ab 1583
            <input type="date" value={eingabe} min="1583-01-01" max="9999-12-31" onChange={(e) => setEingabe(e.target.value)} />
          </label>
          <div className="l-card l-probe" aria-live="polite">
            {datum ? (
              <>
                <h3>
                  {WOCHENTAGE[loese(datum).ergebnis]}, {datumLang(datum)}
                </h3>
                <Rechenweg l={loese(datum)} />
              </>
            ) : (
              <p className="l-text2">Bitte ein Datum ab dem Jahr 1583 eingeben.</p>
            )}
          </div>
        </div>
      )}
    </Blatt>
  )
}
