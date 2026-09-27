// Selbst gezeichnete Diagramme. Eine Chart-Library waere fuer drei Formen
// mehr Gewicht als die halbe App.

import { Glyph, GlyphPath } from './icons'
import { splitCent, todayKey } from './util'
import type { CategoryKind, Segment } from './types'
import type { SeriesPoint } from './calc'

// ---------- Donut ----------

// Ring und Beschriftung liegen im selben SVG-Koordinatensystem. Frueher hing
// die Beschriftung als HTML darueber und war in rem bemasst - auf einem
// schmalen Schirm schrumpfte der Ring, die Symbole aber nicht, und dann
// stimmte die Kollisionspruefung nicht mehr mit dem ueberein, was man sah:
// Beschriftungen fielen weg, obwohl reichlich Platz war.
const W = 390
const H = 320
const CX = 195
const CY = 160
const R = 92
const STROKE = 30

const C = 2 * Math.PI * R

// Freier Radius um den Ring (dessen Aussenkante liegt bei 107): kein Punkt
// einer Beschriftung darf naeher heran. Nicht der Mittelpunkt liegt also auf
// diesem Kreis, sondern die naechste Ecke oder Kante des Kaestchens - sonst
// steht ein breites Kaestchen links und rechts halb im Ring und ein schraeg
// stehendes mit der Ecke drin, waehrend flache oben und unten unnoetig weit
// weg stehen.
const LABEL_INNEN = 114
const RAND = 4
// Feine Trennung zwischen zwei Segmenten. Ohne sie laufen zwei aehnliche
// Farben ineinander.
const LUECKE = 2.6

// Ab hier wird eine Beschriftung klein gesetzt: ein Segment unter sechs
// Prozent traegt weniger Gewicht, und das kleinere Kaestchen findet oefter
// Platz, statt ganz wegzufallen.
const KLEIN_AB = 0.06
// So viele Beschriftungen vertraegt der Ring, bevor die kleinen weichen.
const SATT = 6

interface Arc extends Segment {
  start: number
  mid: number
}

interface Kasten {
  x0: number
  x1: number
  y0: number
  y1: number
}

function masse(share: number) {
  const klein = share < KLEIN_AB
  const ikon = klein ? 26 : 35
  const fs = klein ? 11 : 13.5
  const txt = `${Math.round(share * 100)} %`
  // Die Schrift hat keine feste Breite; 0.58em pro Zeichen liegt fuer
  // Ziffern, Leerzeichen und Prozentzeichen dicht genug daran.
  const pct = txt.length * fs * 0.58
  return { klein, ikon, fs, txt, pct, w: ikon + 4 + pct, h: ikon }
}

// Wie weit muss der Mittelpunkt eines Kaestchens vom Ringmittelpunkt weg,
// damit keine seiner Ecken naeher als "rin" liegt? Der Regelfall ist die
// Ecke: (d·ax − hw)² + (d·ay − hh)² = rin², aufgeloest nach d. Steht das
// Kaestchen fast gerade ueber oder neben der Mitte, trifft nicht die Ecke
// zuerst, sondern die Kante - dann gilt die einfache zweite Zeile.
function labelRadius(ax: number, ay: number, hw: number, hh: number) {
  const k = ax * hw + ay * hh
  const disk = k * k - (hw * hw + hh * hh - LABEL_INNEN * LABEL_INNEN)
  if (disk >= 0) {
    const d = k + Math.sqrt(disk)
    if (d * ax >= hw && d * ay >= hh) return d
  }
  return ax >= ay
    ? (LABEL_INNEN + hw) / Math.max(ax, 1e-6)
    : (LABEL_INNEN + hh) / Math.max(ay, 1e-6)
}

// Beschriftungen werden der Groesse nach vergeben: das groesste Segment
// zuerst, ein weiteres faellt weg, sobald sein Kaestchen ein schon gesetztes
// wirklich ueberschneidet. Geprueft werden die tatsaechlichen Kaestchen, nicht
// ein pauschaler Mindestabstand - der hat vorher auch dort ausgeblendet, wo
// reichlich Platz war.
function platzieren(arcs: Arc[]) {
  const gesetzt: (Arc & {
    m: ReturnType<typeof masse>
    x: number
    y: number
    hw: number
    hh: number
    kasten: Kasten
    dx: number
    dy: number
    links: boolean
  })[] = []
  for (const a of [...arcs].sort((x, y) => y.share - x.share)) {
    // Unter einem halben Prozent stuende "0 %" da, das sagt nichts.
    if (a.share < 0.005) continue
    // Kleine verschwinden erst, wenn der Ring schon gut beschriftet ist.
    if (gesetzt.length >= SATT && a.share < 0.03) continue

    const m = masse(a.share)
    const hw = m.w / 2
    const hh = m.h / 2
    const rad = a.mid * 2 * Math.PI
    const dx = Math.sin(rad)
    const dy = -Math.cos(rad)
    const d = labelRadius(Math.abs(dx), Math.abs(dy), hw, hh)
    let x = CX + dx * d
    let y = CY + dy * d
    // Am Bildrand rueckt das Kaestchen herein - lieber ein Prozentwert, der
    // eine Haaresbreite naeher am Ring steht, als einer, der abgeschnitten ist.
    x = Math.min(Math.max(x, RAND + hw), W - RAND - hw)
    y = Math.min(Math.max(y, RAND + hh), H - RAND - hh)

    const kasten = { x0: x - hw, x1: x + hw, y0: y - hh, y1: y + hh }
    const stoert = gesetzt.some(
      (b) =>
        kasten.x0 < b.kasten.x1 + 6 &&
        kasten.x1 + 6 > b.kasten.x0 &&
        kasten.y0 < b.kasten.y1 + 4 &&
        kasten.y1 + 4 > b.kasten.y0,
    )
    if (stoert) continue

    gesetzt.push({ ...a, m, x, y, hw, hh, kasten, dx, dy, links: x < CX })
  }
  return gesetzt
}

// Fuehrungsstriche gibt es keine mehr. Neben dem Ring bleiben rund zehn
// Einheiten Luft - fuer ein flach seitlich stehendes Kaestchen ist das der
// ganze Platz, den die viewBox hergibt. Ein Strich haette dort entweder unter
// dem Symbol gelegen oder ganz gefehlt, waehrend er oben und unten gut zu
// sehen war: ungleichmaessig und genau die Ueberlappung, die stoerte. Weil
// jede Beschriftung jetzt exakt auf der Mitte ihres Abschnitts sitzt, zeigt
// die Lage allein schon deutlich genug, wozu sie gehoert.

interface DonutProps {
  segments: Segment[]
  total: number
  incCent: number
  expCent: number
  onSelect?: (seg: Segment) => void
  onPick?: (seg: Segment) => void
  picked: string | null
  kind: CategoryKind
}

function Donut({ segments, total, incCent, expCent, onSelect, onPick, picked, kind }: DonutProps) {
  if (!total) {
    return (
      <div className="k-donut">
        <svg viewBox={`0 0 ${W} ${H}`} className="k-donut-svg">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--line)" strokeWidth={STROKE} />
        </svg>
        <div className="k-donut-center">
          <div className="k-donut-empty">
            {kind === 'expense' ? 'Keine Ausgaben' : 'Keine Einnahmen'}
            <span>in diesem Zeitraum</span>
          </div>
        </div>
      </div>
    )
  }

  // Anteile aufsummieren, daraus Bogenlaengen. So kann sich kein Segment
  // verrechnen, egal wie viele es sind.
  let acc = 0
  const arcs: Arc[] = segments.map((s) => {
    const start = acc
    acc += s.share
    return { ...s, start, mid: start + s.share / 2 }
  })

  const labelled = platzieren(arcs)
  const gewaehlt = picked ? arcs.find((a) => a.id === picked) : null
  const luecke = arcs.length > 1 ? LUECKE : 0

  return (
    <div className={`k-donut${gewaehlt ? ' picked' : ''}`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="k-donut-svg">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--line-soft)" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${CX} ${CY})`} fill="none" strokeWidth={STROKE} strokeLinecap="butt">
          {arcs.map((a) => {
            const bogen = Math.max(1, a.share * C - luecke)
            return (
              <circle
                key={a.id}
                className="k-arc"
                cx={CX}
                cy={CY}
                r={R}
                stroke={a.color}
                // Ist eine Kategorie gewaehlt, bleibt nur ihr Segment farbig.
                opacity={gewaehlt && gewaehlt.id !== a.id ? 0.16 : 1}
                strokeDasharray={`${bogen.toFixed(2)} ${(C - bogen).toFixed(2)}`}
                strokeDashoffset={(-(a.start * C + luecke / 2)).toFixed(2)}
                // Auch der Ring selbst ist antippbar, nicht nur die
                // Beschriftung - kleine Segmente bekommen keine und waeren
                // sonst unerreichbar.
                pointerEvents="stroke"
                style={{ cursor: 'pointer' }}
                onClick={() => onPick?.(a)}
                role="button"
                aria-label={`${a.name}, ${Math.round(a.share * 100)} Prozent`}
              />
            )
          })}
        </g>

        {labelled.map((a) => {
          const blass = gewaehlt && gewaehlt.id !== a.id
          // Symbol immer zum Ring hin, Prozentwert nach aussen: links vom
          // Ring stehen sie also andersherum als rechts davon. So liegt auf
          // beiden Seiten das Symbol an seinem Abschnitt an.
          const ix = a.links ? a.m.w - a.m.ikon : 0
          const tx = a.links ? a.m.pct : a.m.ikon + 4
          return (
            <g
              key={a.id}
              className="k-donut-tag"
              transform={`translate(${(a.x - a.hw).toFixed(1)} ${(a.y - a.hh).toFixed(1)})`}
              style={{ color: a.color, opacity: blass ? 0.3 : 1 }}
              onClick={() => onPick?.(a)}
              role="button"
              aria-label={`${a.name}, ${a.m.txt}`}
            >
              {/* Unsichtbare Flaeche: getippt wird auch knapp daneben. */}
              <rect x="-7" y="-7" width={a.m.w + 14} height={a.m.h + 14} fill="transparent" />
              <g
                transform={`translate(${ix.toFixed(1)} 0) scale(${(a.m.ikon / 24).toFixed(4)})`}
                fill="none"
                stroke="currentColor"
                strokeWidth={((a.m.klein ? 2 : 2.3) * 24) / a.m.ikon}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <GlyphPath name={a.icon} />
              </g>
              <text
                className={`k-donut-pct${gewaehlt && gewaehlt.id === a.id ? ' on' : ''}`}
                x={tx.toFixed(1)}
                y={a.m.h / 2}
                fontSize={a.m.fs}
                textAnchor={a.links ? 'end' : 'start'}
                dominantBaseline="central"
                fill="currentColor"
              >
                {a.m.txt}
              </text>
            </g>
          )
        })}
      </svg>

      {gewaehlt ? (
        // Gewaehlte Kategorie: in der Mitte steht ihr Betrag, nicht die
        // Gesamtsumme. Ein Tipp darauf oeffnet das Kategoriedetail.
        <button type="button" className="k-donut-center as-button" onClick={() => onSelect?.(gewaehlt)}>
          <span className="k-donut-pick-ic" style={{ color: gewaehlt.color }}>
            <Glyph name={gewaehlt.icon} />
          </span>
          <span className="k-donut-pick-name">{gewaehlt.name}</span>
          <span className="k-donut-pick-sum" style={{ color: gewaehlt.color }}>
            {kind === 'expense' ? '−' : ''}
            {splitCent(gewaehlt.value).int},{splitCent(gewaehlt.value).frac}
          </span>
          <span className="k-donut-cur">{Math.round(gewaehlt.share * 100)} % · EURO</span>
        </button>
      ) : (
        <div className="k-donut-center">
          <div className="k-donut-inc">{splitCent(incCent).int},{splitCent(incCent).frac}</div>
          <div className="k-donut-exp">−{splitCent(expCent).int},{splitCent(expCent).frac}</div>
          <div className="k-donut-cur">EURO</div>
        </div>
      )}
    </div>
  )
}

// ---------- Balken ----------

// Ausgaben pro Tag oder Monat. Einnahmen kommen bewusst nicht als Balken
// daneben: ein Gehalt ist ein Vielfaches eines Wocheneinkaufs, auf einer
// gemeinsamen Achse waeren alle Ausgabenbalken unsichtbar.
function Bars({ points, height = 96 }: { points: SeriesPoint[]; height?: number }) {
  const max = points.reduce((m, p) => Math.max(m, p.exp), 0)
  const today = todayKey()

  return (
    <div className="k-bars" style={{ height }}>
      {points.map((p) => {
        const isFuture = p.key.length === 10 ? p.key > today : p.key > today.slice(0, 7)
        const h = max ? Math.round((p.exp / max) * height) : 0
        const isToday = p.key === today || (p.key.length === 7 && p.key === today.slice(0, 7))
        if (!p.exp) {
          return <span key={p.key} className={`k-bar-stub${isFuture ? ' future' : ''}`} />
        }
        return (
          <span
            key={p.key}
            className={`k-bar${isToday ? ' now' : ''}`}
            style={{ height: Math.max(2, h) }}
            title={`${p.full}: ${splitCent(p.exp).int},${splitCent(p.exp).frac} €`}
          />
        )
      })}
    </div>
  )
}

// Beschriftete Balken mit Wert darueber - fuer kurze Reihen (Kategorieverlauf).
function LabelledBars({
  points,
  color,
  height = 96,
}: {
  points: { label: string; value: number }[]
  color: string
  height?: number
}) {
  const max = points.reduce((m, p) => Math.max(m, p.value), 0)
  return (
    <div className="k-lbars">
      {points.map((p, i) => (
        <div className="k-lbar-col" key={`${p.label}-${i}`}>
          <span className="k-lbar-val">{Math.round(p.value / 100)}</span>
          <span
            className="k-lbar"
            style={{
              height: Math.max(2, max ? Math.round((p.value / max) * height) : 0),
              background: i === points.length - 1 ? color : 'color-mix(in srgb, var(--line) 70%, #fff)',
            }}
          />
          <span className="k-lbar-lbl">{p.label}</span>
        </div>
      ))}
    </div>
  )
}

// ---------- Linie ----------

function Line({
  points,
  color = 'var(--neutral)',
  height = 84,
}: {
  points: { label: string; value: number }[]
  color?: string
  height?: number
}) {
  if (points.length < 2) return null
  const vals = points.map((p) => p.value)
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  const span = max - min || 1
  const w = 320
  const x = (i: number) => (i / (points.length - 1)) * w
  const y = (v: number) => height - 6 - ((v - min) / span) * (height - 14)
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="k-line" preserveAspectRatio="none">
      <path d={`${d} L${w} ${height} L0 ${height} Z`} fill={color} opacity=".07" stroke="none" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export { Donut, Bars, LabelledBars, Line }
