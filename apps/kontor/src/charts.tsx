// Selbst gezeichnete Diagramme. Eine Chart-Library waere fuer drei Formen
// mehr Gewicht als die halbe App.

import { Glyph, GlyphPath, IconRight } from './icons'
import { Money } from './ui'
import { formatCent, splitCent, todayKey } from './util'
import { MASKE, useDiskret } from './diskret'
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
  /** Buchungen im Zeitraum - der Knopf in der Mitte fuehrt zu ihnen. */
  count: number
  /** Einnahmen minus Ausgaben im Zeitraum. */
  diff: number
  /** Worauf sich die Differenz bezieht: "im September", "in KW 40". */
  zeitraum: string
  onSelect?: (seg: Segment) => void
  onPick?: (seg: Segment | null) => void
  /** Tipp in die Mitte, solange keine Kategorie gewaehlt ist. */
  onCenter?: () => void
  /** Monatsbudget der Kategorie, wenn es im Zeitraum etwas bedeutet. */
  budgetOf?: (id: string) => number | null
  picked: string | null
  kind: CategoryKind
}

function Donut({ segments, total, count, diff, zeitraum, onSelect, onPick, onCenter, budgetOf, picked, kind }: DonutProps) {
  // Ohne Auswahl steht in der Mitte das Ergebnis der beiden Kacheln darueber:
  // was uebrig bleibt. Ein Tipp fuehrt zu den Buchungen des Zeitraums - der
  // Knopf darunter sagt das. Frueher standen hier Einnahmen und Ausgaben ohne
  // Beschriftung, danach nur die Zahl der Buchungen, die nicht zum Ring passte.
  const Mitte = onCenter ? 'button' : 'div'
  const mitteProps = onCenter
    ? { type: 'button' as const, className: 'k-donut-center as-button all', onClick: onCenter, 'aria-label': 'Alle Buchungen im Zeitraum' }
    : { className: 'k-donut-center' }
  // Im Minus steht der Betrag ohne Vorzeichen, die Zeile darunter sagt es.
  const uebrig = (
    <>
      <span className={`k-donut-diff${diff > 0 ? ' inc' : diff < 0 ? ' exp' : ''}`}>
        <Money cent={Math.abs(diff)} sign={diff > 0 ? 'plus' : 'none'} /> <span className="k-cur">€</span>
      </span>
      <span className="k-donut-diff-l">
        {diff < 0 ? 'Minus' : 'übrig'} {zeitraum}
      </span>
      {onCenter ? (
        <span className="k-donut-pick-more">
          {count} {count === 1 ? 'Buchung' : 'Buchungen'} <IconRight />
        </span>
      ) : null}
    </>
  )

  if (!total) {
    return (
      <div className="k-donut">
        <svg viewBox={`0 0 ${W} ${H}`} className="k-donut-svg">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--line)" strokeWidth={STROKE} />
        </svg>
        <Mitte {...mitteProps}>
          {count ? (
            uebrig
          ) : (
            <span className="k-donut-empty">
              {kind === 'expense' ? 'Keine Ausgaben' : 'Keine Einnahmen'}
              <span>in diesem Zeitraum</span>
            </span>
          )}
        </Mitte>
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
  const budget = gewaehlt ? budgetOf?.(gewaehlt.id) ?? null : null
  const budgetPct = budget ? Math.round((gewaehlt!.value / budget) * 100) : null

  return (
    <div className={`k-donut${gewaehlt ? ' picked' : ''}`}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="k-donut-svg"
        // Tipp auf freie Flaeche neben dem Ring hebt die Auswahl auf.
        onClick={(e) => {
          if (e.target === e.currentTarget && gewaehlt) onPick?.(null)
        }}
      >
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
        // Gewaehlte Kategorie: in der Mitte steht ihr Betrag und, im Monat,
        // wie weit das Budget reicht. Der Knopf "Details" sagt, dass ein
        // zweiter Tipp weiterfuehrt - vorher musste man das wissen.
        <button type="button" className="k-donut-center as-button" onClick={() => onSelect?.(gewaehlt)}>
          <span className="k-donut-pick-ic" style={{ color: gewaehlt.color }}>
            <Glyph name={gewaehlt.icon} />
          </span>
          <span className="k-donut-pick-name">{gewaehlt.name}</span>
          <span className="k-donut-pick-sum">
            <Money cent={gewaehlt.value} /> <span className="k-cur">€</span>
          </span>
          {budgetPct !== null ? (
            <span className={`k-donut-pick-note${budgetPct > 100 ? ' over' : ''}`}>{budgetPct} % vom Budget</span>
          ) : (
            <span className="k-donut-pick-note">
              {Math.round(gewaehlt.share * 100)} % der {kind === 'expense' ? 'Ausgaben' : 'Einnahmen'}
            </span>
          )}
          <span className="k-donut-pick-more">
            Details <IconRight />
          </span>
        </button>
      ) : (
        <Mitte {...mitteProps}>{uebrig}</Mitte>
      )}
    </div>
  )
}

// ---------- Balken ----------

// Ausgaben pro Tag oder Monat. Einnahmen kommen bewusst nicht als Balken
// daneben: ein Gehalt ist ein Vielfaches eines Wocheneinkaufs, auf einer
// gemeinsamen Achse waeren alle Ausgabenbalken unsichtbar.
//
// Aus demselben Grund wird ein Ausreisser gekappt: steht der hoechste Balken
// mehr als doppelt so hoch wie der zweithoechste (typisch: der Tag mit der
// Miete), endet die Skala knapp ueber dem zweithoechsten. Der Ausreisser
// ragt mit einer Bruchkante darueber hinaus und traegt seinen Wert - sonst
// waeren alle anderen Tage nur Striche.
//
// "avg" zeichnet den Durchschnitt als gestrichelte Linie ein.
const KAPPEN_AB = 2
const KOPF_PX = 18

function Bars({ points, height = 112, avg }: { points: SeriesPoint[]; height?: number; avg?: number | null }) {
  // Beim Verbergen bleiben die Balken, nur die Zahlen fallen weg.
  const verborgen = useDiskret().an
  const today = todayKey()
  const werte = points.map((p) => p.exp).filter((v) => v > 0).sort((a, b) => b - a)
  const kappen = werte.length > 1 && werte[0] > werte[1] * KAPPEN_AB
  const skala = kappen ? werte[1] * 1.1 : werte[0] ?? 0
  const avgY = avg && skala && avg <= skala ? Math.round((avg / skala) * height) : null

  return (
    <div className="k-bars" style={{ height: height + (kappen ? KOPF_PX : 0) }}>
      {points.map((p, i) => {
        const isFuture = p.key.length === 10 ? p.key > today : p.key > today.slice(0, 7)
        const isToday = p.key === today || (p.key.length === 7 && p.key === today.slice(0, 7))
        if (!p.exp) {
          return <span key={p.key} className={`k-bar-stub${isFuture ? ' future' : ''}`} />
        }
        const title = verborgen ? p.full : `${p.full}: ${splitCent(p.exp).int},${splitCent(p.exp).frac} €`
        if (p.exp > skala) {
          return (
            <span key={p.key} className="k-bar-col" title={title}>
              <span className={`k-bar-cap${i > points.length / 2 ? ' rechts' : ''}`}>
                {verborgen ? MASKE : Math.round(p.exp / 100).toLocaleString('de-DE')} €
              </span>
              <span className={`k-bar gekappt${isToday ? ' now' : ''}`} style={{ height: height + 4 }} />
            </span>
          )
        }
        return (
          <span
            key={p.key}
            className={`k-bar${isToday ? ' now' : ''}`}
            style={{ height: Math.max(2, Math.round((p.exp / skala) * height)) }}
            title={title}
          />
        )
      })}
      {avgY !== null ? (
        <>
          <i className="k-bars-avg" style={{ bottom: avgY }} />
          <span className="k-bars-avg-l" style={{ bottom: avgY + 3 }}>Ø {verborgen ? MASKE : formatCent(avg!)}</span>
        </>
      ) : null}
    </div>
  )
}

// Beschriftete Balken mit Wert darueber - fuer kurze Reihen (Kategorieverlauf,
// Wochentage). Farbig ist nur ein Balken: standardmaessig der letzte (der
// aktuelle Zeitraum), sonst der mit "highlight" angegebene; -1 = keiner.
function LabelledBars({
  points,
  color,
  height = 96,
  highlight,
}: {
  points: { label: string; value: number }[]
  color: string
  height?: number
  highlight?: number
}) {
  const verborgen = useDiskret().an
  const max = points.reduce((m, p) => Math.max(m, p.value), 0)
  const farbig = highlight ?? points.length - 1
  return (
    <div className="k-lbars">
      {points.map((p, i) => (
        <div className="k-lbar-col" key={`${p.label}-${i}`}>
          <span className="k-lbar-val">{verborgen ? MASKE : Math.round(p.value / 100)}</span>
          <span
            className="k-lbar"
            style={{
              height: Math.max(2, max ? Math.round((p.value / max) * height) : 0),
              background: i === farbig ? color : 'color-mix(in srgb, var(--line) 70%, #fff)',
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
