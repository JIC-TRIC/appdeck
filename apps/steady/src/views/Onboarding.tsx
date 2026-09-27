import { useRef, useState, type CSSProperties } from 'react'
import { colorOf } from '../data'
import { importFile } from '../store'
import type { SteadyCtx } from '../types'

// Angedeutetes Raster: drei Zeilen, ein paar Punkte und Ringe.
const GHOST: [string, string][][] = [
  [['f', 'coral'], ['r', 'coral'], ['f', 'coral'], ['r', 'coral'], ['', ''], ['', ''], ['', '']],
  [['f', 'sky'], ['f', 'sky'], ['f', 'sky'], ['', ''], ['', ''], ['', ''], ['', '']],
  [['f', 'green'], ['', ''], ['f', 'green'], ['f', 'green'], ['', ''], ['', ''], ['', '']],
]

// Erststart: nur Wortmarke, angedeutetes Raster und ein Knopf. Keine
// Vorlagen, kein Erklaertext - die App erklaert sich beim ersten Abhaken.
function Onboarding({ ctx }: { ctx: SteadyCtx }) {
  const { push, refresh } = ctx
  const fileRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="s-onb">
      <div className="s-onb-mid">
        <div className="s-wordmark">steady</div>
        <div className="s-ghost" aria-hidden="true">
          {GHOST.map((row, i) => (
            <div key={i}>
              {row.map(([k, c], j) => (
                <i key={j} className={k} style={c ? ({ '--c': colorOf(c) } as CSSProperties) : undefined} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="s-onb-bot">
        <button type="button" className="s-btn pri block" onClick={() => push({ name: 'habitForm' })}>
          Erste Gewohnheit anlegen
        </button>
        <button type="button" className="s-link" onClick={() => fileRef.current?.click()}>
          Aus Exportdatei wiederherstellen
        </button>
        {error ? <p className="s-status error">{error}</p> : null}
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            e.target.value = ''
            if (!f) return
            try {
              await importFile(f)
              refresh()
            } catch (err) {
              setError(`Import fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`)
            }
          }}
        />
      </div>
    </div>
  )
}

export default Onboarding
