import { useState } from 'react'
import { Blatt, BlattKopf, Rechenweg } from '../ui'
import { rechenweg, ueberkreuz, zerlegen } from '../rechnen'
import type { Methode } from '../types'

// Spickzettel hinter "?": beide Rechenwege an einem Beispiel, plus Ausprobieren.

const BEISPIEL_ZERLEGEN = zerlegen(47, 86)
const BEISPIEL_KREUZ = ueberkreuz(47, 86)

// Welche Ziffernpaare bei 3 × 3 in welche Spalte gehoeren (abc × def).
const SPALTEN_3X3 = [
  ['Einer', 'c·f'],
  ['Zehner', 'b·f + c·e'],
  ['Hunderter', 'a·f + b·e + c·d'],
  ['Tausender', 'a·e + b·d'],
  ['Zehntausender', 'a·d'],
]

export default function RechnenAnleitung({ methode, onClose }: { methode: Methode; onClose: () => void }) {
  const [x, setX] = useState('347')
  const [y, setY] = useState('86')
  const [weg, setWeg] = useState<Methode>(methode)
  const nx = Number(x)
  const ny = Number(y)
  const ok = Number.isInteger(nx) && Number.isInteger(ny) && nx >= 2 && ny >= 2 && nx <= 999 && ny <= 999
  // Der laengere Faktor kommt nach vorn - so rechnet auch die Uebung.
  const [a, b] = String(nx).length >= String(ny).length ? [nx, ny] : [ny, nx]

  return (
    <Blatt label="Anleitung Rechnen" gross onClose={onClose}>
      {(zu) => (
        <div className="l-anleitung">
          <BlattKopf titel="So rechnest du" onClose={zu} gross />
          <p className="l-text2">
            Zwei Wege zum selben Ergebnis. Unter dem Stufen-Knopf wählst du, welcher in Tipps und Rechenweg erscheint.
          </p>

          <h2>Zerlegen</h2>
          <p>
            Einen Faktor in seine Stellen zerlegen, jede Stelle einzeln malnehmen, zusammenzählen. Von links nach rechts, so
            wie man die Zahl spricht.
          </p>
          <div className="l-formel">
            <p>47 × 86 = 47 × 80 + 47 × 6</p>
            <p>= 3760 + 282 = 4042</p>
          </div>
          <Rechenweg l={BEISPIEL_ZERLEGEN} />
          <div className="l-kasten">
            <strong>Mal einen Zehner:</strong> erst mit der Ziffer malnehmen, dann eine Null dran. 47 × 80 = 47 × 8 = 376 →
            3760. Bei einstelligen Aufgaben (347 × 6) zerlegst du die große Zahl: 1800 + 240 + 42.
          </div>

          <h2>Überkreuz</h2>
          <p>
            Spalte für Spalte von rechts, wie beim schriftlichen Rechnen, aber ohne Zwischenzeilen. In jede Spalte gehören
            alle Ziffernpaare, deren Stellen zusammen passen.
          </p>
          <div className="l-schema" aria-hidden="true">
            <span>  4 7</span>
            <span>× 8 6</span>
          </div>
          <Rechenweg l={BEISPIEL_KREUZ} />
          <p className="l-text2">
            Das Ergebnis entsteht von hinten: 2, dann 4, dann 40 → 4042. Darum tippst du bei Überkreuz von rechts ein.
          </p>
          <h3 className="l-blatt-h3">Bei 3 × 3 (abc × def)</h3>
          <div className="l-rechenweg">
            {SPALTEN_3X3.map(([s, p]) => (
              <div className="l-zeile" key={s}>
                <div>
                  <span>{s}</span>
                </div>
                <b>{p}</b>
              </div>
            ))}
          </div>
          <p className="l-text2">1, 2, 3, 2, 1 Paare – die mittlere Spalte ist die schwerste.</p>

          <h2>Im Kopf behalten</h2>
          <ul className="l-schritte punkte">
            <li>Teilergebnisse leise mitsprechen, das hilft mehr als sie sich vorzustellen.</li>
            <li>Beim Zerlegen das größte Teilprodukt zuerst, dann nur noch dazuzählen.</li>
            <li>Erst richtig, dann schnell: Am Anfang sind 20 bis 30 Sekunden für 2 × 2 normal.</li>
          </ul>

          <h2>Ausprobieren</h2>
          <div className="l-probier-felder">
            <label className="l-feld">
              Zahl
              <input type="number" inputMode="numeric" value={x} onChange={(e) => setX(e.target.value)} />
            </label>
            <span className="l-mal">×</span>
            <label className="l-feld">
              Zahl
              <input type="number" inputMode="numeric" value={y} onChange={(e) => setY(e.target.value)} />
            </label>
          </div>
          <div className="l-seg klein" role="radiogroup" aria-label="Rechenweg">
            {(['zerlegen', 'ueberkreuz'] as const).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={weg === m} className={weg === m ? 'an' : ''} onClick={() => setWeg(m)}>
                {m === 'zerlegen' ? 'Zerlegen' : 'Überkreuz'}
              </button>
            ))}
          </div>
          <div className="l-card l-probe" aria-live="polite">
            {ok ? (
              <>
                <h3>
                  {a} × {b} = {a * b}
                </h3>
                <Rechenweg l={rechenweg(a, b, weg)} />
              </>
            ) : (
              <p className="l-text2">Bitte zwei Zahlen von 2 bis 999 eingeben.</p>
            )}
          </div>
        </div>
      )}
    </Blatt>
  )
}
