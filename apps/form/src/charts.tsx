// Selbst gezeichnet, keine Chart-Library (wie Kontor und Steady). Farben
// kommen ueber CSS-Klassen, damit die Tokens aus Form.css gelten.

import { skala } from './calc'
import { diffDays, formatKurz, formatZahl } from './util'
import type { Punkt, Wert } from './types'

// ---------- Verlauf eines Werts ----------

// Waagerecht nach Zeit, nicht nach Anzahl: zwei Messungen in einer Woche und
// dann einen Monat Pause sehen auch so aus. Der juengste Punkt ist orange,
// das Ziel eine gestrichelte Linie.
export function Verlauf({ wert, punkte, heute }: { wert: Wert; punkte: Punkt[]; heute: string }) {
  const W = 340
  const H = 196
  const L = 40
  const R = 12
  const T = 14
  const B = 26
  const pw = W - L - R
  const ph = H - T - B
  const s = skala(
    punkte.map((p) => p.zahl),
    wert.ziel,
  )
  const erster = punkte[0]?.tag
  const letzter = punkte[punkte.length - 1]?.tag
  const spanne = erster && letzter ? diffDays(erster, letzter) : 0
  const x = (tag: string) => (spanne ? L + (pw * diffDays(erster, tag)) / spanne : L + pw / 2)
  const y = (v: number) => T + ph * (1 - (v - s.min) / (s.max - s.min || 1))
  const pfad = punkte.map((p, i) => `${i ? 'L' : 'M'}${x(p.tag).toFixed(1)} ${y(p.zahl).toFixed(1)}`).join(' ')
  const ende = punkte[punkte.length - 1]
  const zielY = wert.ziel === null ? null : y(wert.ziel)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="f-chart" role="img" aria-label={`Verlauf ${wert.name}, ${punkte.length} Messungen`}>
      {s.ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} className="grid" />
          {zielY !== null && Math.abs(y(t) - zielY) < 13 ? null : (
            <text x={L - 8} y={y(t) + 4} textAnchor="end" className="lbl">
              {formatZahl(t)}
            </text>
          )}
        </g>
      ))}
      {zielY !== null && wert.ziel !== null ? (
        <g>
          <line x1={L} x2={W - R} y1={zielY} y2={zielY} className="ziel" />
          <text x={L - 8} y={zielY + 4} textAnchor="end" className="lbl stark">
            {formatZahl(wert.ziel)}
          </text>
        </g>
      ) : null}
      {punkte.length > 1 ? <path d={pfad} className="linie" /> : null}
      {punkte.length <= 60
        ? punkte.slice(0, -1).map((p) => <circle key={p.tag} cx={x(p.tag)} cy={y(p.zahl)} r={2.8} className="punkt" />)
        : null}
      {ende ? <circle cx={x(ende.tag)} cy={y(ende.zahl)} r={5.5} className="letzter" /> : null}
      {erster ? (
        <text x={spanne ? L : L + pw / 2} y={H - 6} textAnchor={spanne ? 'start' : 'middle'} className="lbl">
          {formatKurz(erster, heute)}
        </text>
      ) : null}
      {letzter && spanne ? (
        <text x={W - R} y={H - 6} textAnchor="end" className="lbl">
          {formatKurz(letzter, heute)}
        </text>
      ) : null}
    </svg>
  )
}

// ---------- Mini-Verlauf auf der Uebersicht ----------

// Die letzten Messungen in gleichen Abstaenden - hier zaehlt nur, wohin es geht.
export function Linie({ punkte }: { punkte: Punkt[] }) {
  const W = 92
  const H = 34
  const P = 4
  const letzte = punkte.slice(-12)
  if (!letzte.length) return null
  const zahlen = letzte.map((p) => p.zahl)
  const lo = Math.min(...zahlen)
  const hi = Math.max(...zahlen)
  const x = (i: number) => (letzte.length > 1 ? P + ((W - 2 * P) * i) / (letzte.length - 1) : W / 2)
  const y = (v: number) => (hi > lo ? P + (H - 2 * P) * (1 - (v - lo) / (hi - lo)) : H / 2)
  const pfad = letzte.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.zahl).toFixed(1)}`).join(' ')
  const n = letzte.length - 1

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="f-linie" aria-hidden="true">
      {n > 0 ? <path d={pfad} className="linie" /> : null}
      <circle cx={x(n)} cy={y(letzte[n].zahl)} r={3.6} className="letzter" />
    </svg>
  )
}
