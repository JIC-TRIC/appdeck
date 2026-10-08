import { Blatt, BlattKopf, Schalter } from '../ui'
import { METHODEN, STUFEN } from '../rechnen'
import type { Einstellungen } from '../types'

// Stufe, Rechenweg und Uhr. Jede Wahl gilt sofort; eine neue Stufe bringt eine neue Aufgabe.
export default function StufeBlatt({
  einst,
  aendere,
  onClose,
}: {
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
  onClose: () => void
}) {
  const r = einst.rechnen
  return (
    <Blatt label="Stufe" onClose={onClose}>
      {(zu) => (
        <div className="l-sheet-pad">
          <BlattKopf titel="Stufe" onClose={zu} />
          <div role="radiogroup" aria-label="Stufe" className="l-radios">
            {STUFEN.map((s) => {
              const an = r.stufe === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={an}
                  className={`l-radio kurz${an ? ' an' : ''}`}
                  onClick={() => aendere({ rechnen: { ...r, stufe: s.id } })}
                >
                  <span className="l-radio-punkt" />
                  <span className="l-radio-text">
                    <span className="l-num">{s.name}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <h3 className="l-blatt-h3">Rechenweg</h3>
          <div className="l-seg" role="radiogroup" aria-label="Rechenweg">
            {METHODEN.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={r.methode === m.id}
                className={r.methode === m.id ? 'an' : ''}
                onClick={() => aendere({ rechnen: { ...r, methode: m.id } })}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="l-zeile-schalter">
            <span className="l-zs-titel">Uhr anzeigen</span>
            <Schalter an={einst.uhr} label="Uhr anzeigen" onChange={(uhr) => aendere({ uhr })} />
          </div>
        </div>
      )}
    </Blatt>
  )
}
