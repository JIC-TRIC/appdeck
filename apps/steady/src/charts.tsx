// Selbst gezeichnet, keine Chart-Library (wie Kontor). Farben kommen ueber
// CSS-Klassen, damit die Tokens aus Steady.css gelten.

import { useLayoutEffect, useRef } from 'react'
import { messwert, ruleAt, type AmountPoint } from './calc'
import { WEEKDAYS_SHORT, addDays, formatValue, monthShort, parseKey, weekdayIndex } from './util'
import { NICHT_GESCHAFFT, type DayState, type Habit, type HabitLog } from './types'

const CODE: Record<DayState, string> = { done: 'd', rest: 'r', miss: 'x', open: 'o', off: 'n', future: 'f' }

// ---------- Monatskalender ----------

// Abhaken: Kreise mit Tageszahl. Menge: Kaestchen mit dem Tageswert. Ein Tipp
// traegt nach - der Weg fuer alles, was aelter ist als das Raster. Verpasst
// ohne Eintrag steht nur umrandet da (vielleicht vergessen), "nicht geschafft"
// gefuellt grau bzw. mit Kreuz.
export function MonthCalendar({
  habit,
  first,
  states,
  values,
  onDay,
}: {
  habit: Habit
  first: string // erster Tag des Monats
  states: Record<string, DayState>
  values: HabitLog | undefined
  onDay?: (day: string, state: DayState) => void
}) {
  const d0 = parseKey(first)
  const count = new Date(d0.getFullYear(), d0.getMonth() + 1, 0).getDate()
  const lead = weekdayIndex(first)
  const days = Array.from({ length: count }, (_, i) => addDays(first, i))
  const amount = habit.kind === 'amount'

  return (
    <div className="s-cal">
      {WEEKDAYS_SHORT.map((w) => (
        <span key={w} className="s-cal-h">{w}</span>
      ))}
      {Array.from({ length: lead }, (_, i) => (
        <span key={`l${i}`} />
      ))}
      {days.map((d) => {
        const s = states[d] ?? 'off'
        const tappable = !!onDay && s !== 'off' && s !== 'future'
        const eintrag = values?.[d]
        const v = messwert(eintrag)
        // Am Ruhetag kein Kreuz, auch wenn "nicht geschafft" eingetragen ist.
        const nein = eintrag === NICHT_GESCHAFFT && s !== 'rest'
        const extra = s === 'miss' && eintrag === undefined ? ' leer' : nein ? ' nein' : ''
        const n = parseKey(d).getDate()
        return (
          <button
            key={d}
            type="button"
            className={`${amount ? 's-mc' : 's-cd'} ${CODE[s]}${extra}`}
            disabled={!tappable}
            onClick={tappable ? () => onDay!(d, s) : undefined}
          >
            {amount ? (
              <>
                <small>{n}</small>
                {v !== undefined ? formatValue(v) : nein ? '×' : ''}
              </>
            ) : (
              n
            )}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Heatmap ----------

// Seit Beginn, hoechstens 53 Wochen. Spalte = Woche, Zeile = Wochentag.
// Auf dem Handy breiter als der Schirm: dann scrollt sie quer und steht am
// Anfang ganz rechts, bei der laufenden Woche.
export function Heatmap({ from, to, states }: { from: string; to: string; states: Record<string, DayState> }) {
  const weeks: string[] = []
  for (let m = from; m <= to; m = addDays(m, 7)) weeks.push(m)
  const scroller = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = scroller.current
    if (el) el.scrollLeft = el.scrollWidth
  }, [from, to])

  return (
    <div className="s-hm-scroll" ref={scroller}>
      <div className="s-hm" style={{ gridTemplateColumns: `18px repeat(${weeks.length}, 11px)` }}>
        <span />
        {weeks.map((m, i) => {
          // Beschriftet wird die Woche, in der ein Monat beginnt - und die
          // erste Spalte, damit man weiss, wo die Heatmap anfaengt (solange
          // nicht gleich daneben schon ein Monat steht).
          const firstOf = (w: string) => Array.from({ length: 7 }, (_, j) => addDays(w, j)).find((d) => d.endsWith('-01'))
          const first = firstOf(m) ?? (i === 0 && !(weeks[1] && firstOf(weeks[1])) ? m : undefined)
          return (
            <span key={`m${m}`} className="s-hm-m">
              {first ? monthShort(parseKey(first).getMonth()) : ''}
            </span>
          )
        })}
        {Array.from({ length: 7 }, (_, row) => [
          <span key={`w${row}`} className="s-hm-wd">
            {row % 2 === 0 ? WEEKDAYS_SHORT[row] : ''}
          </span>,
          ...weeks.map((m) => {
            const d = addDays(m, row)
            return <i key={d} className={CODE[states[d] ?? 'off']} />
          }),
        ])}
      </div>
    </div>
  )
}

// ---------- Werteverlauf (Mengen) ----------

function niceMax(v: number) {
  if (v <= 0) return 1
  const exp = 10 ** Math.floor(Math.log10(v))
  for (const f of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (f * exp >= v) return f * exp
  return 10 * exp
}

// Balken pro Tag mit gestrichelter Ziellinie. Erfuellte Tage voll gefaerbt,
// verfehlte blass, heute nur umrandet (der Tag laeuft noch).
export function AmountChart({ habit, points, today }: { habit: Habit; points: AmountPoint[]; today: string }) {
  const W = 326
  const H = 158
  const top = 10
  const bottom = 20
  const left = 34
  const g = ruleAt(habit.goal, today)
  const peak = Math.max(g?.target ?? 0, ...points.map((p) => p.value ?? 0))
  const max = niceMax(peak * 1.1)
  const ph = H - top - bottom
  const band = (W - left) / points.length
  const bw = Math.min(8, band * 0.64)
  const y = (v: number) => top + ph * (1 - v / max)
  const ticks = [0, max / 2, max]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="s-chart" role="img" aria-label={`${habit.name} pro Tag, letzte ${points.length} Tage`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={left} x2={W} y1={y(t)} y2={y(t)} className="grid" />
          {g && Math.abs(y(t) - y(g.target)) < 16 ? null : (
            <text x={left - 7} y={y(t) + 3.5} textAnchor="end" className="lbl">
              {formatValue(t)}
            </text>
          )}
        </g>
      ))}
      {points.map((p, i) => {
        if (p.value === undefined || p.value <= 0) return null
        const x = left + i * band + (band - bw) / 2
        const h = Math.max(1.5, ph * Math.min(p.value, max) / max)
        if (p.day === today && !p.met) {
          return <rect key={p.day} x={x + 0.75} y={y(Math.min(p.value, max)) + 0.75} width={bw - 1.5} height={Math.max(0.5, h - 1.5)} rx={2} className="bar today" />
        }
        return <rect key={p.day} x={x} y={y(Math.min(p.value, max))} width={bw} height={h} rx={2} className={`bar${p.met ? '' : ' weak'}`} />
      })}
      {g ? (
        <g>
          <line x1={left} x2={W} y1={y(g.target)} y2={y(g.target)} className="goal" />
          <text x={left - 7} y={y(g.target) + 3.5} textAnchor="end" className="lbl strong">
            {formatValue(g.target)}
          </text>
        </g>
      ) : null}
      {points.map((p, i) =>
        i % 7 === 0 ? (
          <text key={`x${p.day}`} x={left + i * band + band / 2} y={H - 5} textAnchor="middle" className="lbl">
            {parseKey(p.day).getDate()}.
          </text>
        ) : null,
      )}
    </svg>
  )
}

// ---------- Tagesquote (Statistik) ----------

export interface QuoteBar {
  key: string
  share: number | null // null = keine Daten / Zukunft
  perfect?: boolean
  today?: boolean
  label?: string
}

// Ein Balken pro Tag (bei Jahr: pro Woche). Perfekte Tage in Bernstein,
// heute gestrichelt, kommende Tage als Stummel.
export function QuoteChart({ bars }: { bars: QuoteBar[] }) {
  const W = 326
  const H = 132
  const top = 10
  const bottom = 20
  const pw = W - 36
  const ph = H - top - bottom
  const band = pw / Math.max(1, bars.length)
  const bw = Math.max(2, Math.min(8, band * 0.64))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="s-chart" role="img" aria-label="Anteil erfüllter Gewohnheiten">
      {[1, 0.5].map((f) => {
        const yy = top + ph * (1 - f)
        return (
          <g key={f}>
            <line x1={0} x2={pw} y1={yy} y2={yy} className="grid" />
            <text x={W} y={yy + 3.5} textAnchor="end" className="lbl">
              {f * 100} %
            </text>
          </g>
        )
      })}
      {bars.map((b, i) => {
        const x = i * band + (band - bw) / 2
        if (b.share === null) {
          return <rect key={b.key} x={x} y={top + ph - 2} width={bw} height={2} rx={1} className="stub" />
        }
        const h = Math.max(2, ph * b.share)
        if (b.today) {
          return <rect key={b.key} x={x + 0.75} y={top + ph - h + 0.75} width={bw - 1.5} height={Math.max(0.5, h - 1.5)} rx={2} className="qbar today" />
        }
        return <rect key={b.key} x={x} y={top + ph - h} width={bw} height={h} rx={2} className={`qbar${b.perfect ? ' perfect' : ''}`} />
      })}
      {bars.map((b, i) => {
        if (!b.label) return null
        // Am Rand nicht mittig, sonst wird die Beschriftung abgeschnitten.
        const x = i * band + band / 2
        const anchor = x < 12 ? 'start' : x > pw - 12 ? 'end' : 'middle'
        return (
          <text key={`x${b.key}`} x={anchor === 'start' ? 0 : x} y={H - 5} textAnchor={anchor} className="lbl">
            {b.label}
          </text>
        )
      })}
    </svg>
  )
}

// ---------- Senkrechte Quotenbalken (Monate, Wochentage) ----------

export function ShareBars({
  items,
  height = 70,
  neutral,
}: {
  items: { label: string; share: number | null; hi?: boolean }[]
  height?: number
  neutral?: boolean
}) {
  return (
    <div className={`s-vbars${neutral ? ' neutral' : ''}`} style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
      {items.map((it) => (
        <div key={it.label} className={it.hi ? 'hi' : undefined}>
          <em>{it.share === null ? '–' : `${Math.round(it.share * 100)} %`}</em>
          <i style={{ height: it.share === null ? 2 : Math.max(2, Math.round(height * it.share)) }} />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  )
}
