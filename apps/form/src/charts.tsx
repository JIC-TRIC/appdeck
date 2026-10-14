// Selbst gezeichnet, keine Chart-Library (wie Kontor und Steady). Farben
// kommen ueber CSS-Klassen, damit die Tokens aus Form.css gelten.

import { useRef, type PointerEvent } from 'react'
import { skala } from './calc'
import { diffDays, formatKurz, formatZahl } from './util'
import type { Punkt, Wert } from './types'

// ---------- Verlauf eines Werts oder einer Uebung ----------

// Waagerecht nach Zeit, nicht nach Anzahl: zwei Messungen in einer Woche und
// dann einen Monat Pause sehen auch so aus. Der juengste Punkt ist orange,
// das Ziel eine gestrichelte Linie (Uebungen haben keins).
//
// Mit onAuswahl laesst sich ein Punkt antippen oder mit dem Finger ueber den
// Verlauf ziehen - gewaehlt ist der naechste Punkt, mit einer senkrechten
// Linie. Die Zahl dazu zeigt die Seite. Ein zweiter Tipp auf denselben Punkt
// hebt die Auswahl auf.
//
// Mit trend (Werte, die oft gemessen werden) ist der Schnitt die kraeftige
// Linie, die einzelnen Messungen stehen leiser dahinter.
export function Verlauf({
  wert,
  punkte,
  heute,
  trend,
  auswahl = null,
  onAuswahl,
}: {
  wert: Pick<Wert, 'name' | 'ziel'>
  punkte: Punkt[]
  heute: string
  /** Trend zu denselben Tagen wie punkte (calc.ts, trend) */
  trend?: Punkt[]
  /** Index des gewaehlten Punkts in `punkte` */
  auswahl?: number | null
  onAuswahl?: (i: number | null) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const druck = useRef<{ vorher: number | null; erster: number; bewegt: boolean } | null>(null)
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
  const linie = (reihe: Punkt[]) => reihe.map((p, i) => `${i ? 'L' : 'M'}${x(p.tag).toFixed(1)} ${y(p.zahl).toFixed(1)}`).join(' ')
  const pfad = linie(punkte)
  const mitTrend = !!trend && trend.length > 1
  const ende = punkte[punkte.length - 1]
  const zielY = wert.ziel === null ? null : y(wert.ziel)
  const gewaehlt = auswahl !== null ? punkte[auswahl] : undefined

  // Der Punkt, der dem Finger waagerecht am naechsten liegt.
  const naechster = (clientX: number) => {
    const r = svgRef.current?.getBoundingClientRect()
    if (!r || !r.width) return 0
    const vx = ((clientX - r.left) / r.width) * W
    let best = 0
    punkte.forEach((p, i) => {
      if (Math.abs(x(p.tag) - vx) < Math.abs(x(punkte[best].tag) - vx)) best = i
    })
    return best
  }

  const fingerProps = onAuswahl
    ? {
        onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
          if (!punkte.length) return
          const i = naechster(e.clientX)
          druck.current = { vorher: auswahl, erster: i, bewegt: false }
          e.currentTarget.setPointerCapture(e.pointerId)
          onAuswahl(i)
        },
        onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
          const d = druck.current
          if (!d) return
          const i = naechster(e.clientX)
          if (i !== d.erster) d.bewegt = true
          onAuswahl(i)
        },
        onPointerUp: () => {
          const d = druck.current
          druck.current = null
          if (d && !d.bewegt && d.vorher === d.erster) onAuswahl(null)
        },
        onPointerCancel: () => {
          druck.current = null
        },
      }
    : {}

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      className={`f-chart${onAuswahl ? ' waehlbar' : ''}${mitTrend ? ' mit-trend' : ''}`}
      role="img"
      aria-label={`Verlauf ${wert.name}, ${punkte.length} Messungen${mitTrend ? ', mit Trend' : ''}`}
      {...fingerProps}
    >
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
      {mitTrend && trend ? <path d={linie(trend)} className="trend" /> : null}
      {punkte.length <= 60
        ? punkte.slice(0, -1).map((p) => <circle key={p.tag} cx={x(p.tag)} cy={y(p.zahl)} r={2.8} className="punkt" />)
        : null}
      {ende ? <circle cx={x(ende.tag)} cy={y(ende.zahl)} r={5.5} className="letzter" /> : null}
      {gewaehlt ? (
        <g>
          <line x1={x(gewaehlt.tag)} x2={x(gewaehlt.tag)} y1={T - 6} y2={H - B} className="auswahl" />
          <circle cx={x(gewaehlt.tag)} cy={y(gewaehlt.zahl)} r={6} className="gewaehlt" />
        </g>
      ) : null}
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

// ---------- Trainings pro Woche ----------

// Ein Balken pro Woche, die laufende rechts und in Kreide. Leere Wochen sind
// ein flacher Strich - Luecken sieht man, ohne dass sie schreien. Mit
// Wochenziel steht es als gestrichelte orange Linie darueber (wie das Ziel
// eines Werts), und jede Woche, die es erreicht hat, ist orange.
export function Wochen({
  wochen,
  ziel = null,
  label,
}: {
  wochen: { montag: string; wert: number }[]
  ziel?: number | null
  label: string
}) {
  const W = 340
  const H = 64
  const T = 6
  const GAP = 6
  const n = wochen.length
  const bw = (W - GAP * (n - 1)) / n
  const hoch = Math.max(ziel ?? 0, ...wochen.map((w) => w.wert)) || 1
  const y = (v: number) => H - ((H - T) * v) / hoch
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="f-wochen" role="img" aria-label={`${label}, letzte ${n} Wochen`}>
      {wochen.map((w, i) => {
        const h = w.wert ? Math.max(4, H - y(w.wert)) : 2
        const art = ziel !== null && w.wert >= ziel ? 'erreicht' : i === n - 1 ? 'jetzt' : w.wert ? 'woche' : 'leer'
        return <rect key={w.montag} x={i * (bw + GAP)} y={H - h} width={bw} height={h} rx={Math.min(4, bw / 2)} className={art} />
      })}
      {ziel !== null ? <line x1={0} x2={W} y1={y(ziel)} y2={y(ziel)} className="ziel" /> : null}
    </svg>
  )
}
