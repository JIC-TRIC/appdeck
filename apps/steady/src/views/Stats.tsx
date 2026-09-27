import { useMemo, useRef, useState, type TouchEvent } from 'react'
import { bestRunIn, dayScores, inLife, isArchived, perfectDays, quoteIn, share, statesBetween, weekdayQuotes } from '../calc'
import { QuoteChart, ShareBars, type QuoteBar } from '../charts'
import { IconFlame, IconLeft, IconRight } from '../icons'
import { Card, Screen, Segmented, hue } from '../ui'
import { colorOf } from '../data'
import { updateSettings } from '../store'
import {
  MONTHS,
  WEEKDAYS_LONG,
  WEEKDAYS_SHORT,
  addDays,
  daysBetween,
  formatPercent,
  isoWeek,
  minKey,
  monthShort,
  mondayOf,
  parseKey,
  rangeLabel,
  weekdayIndex,
} from '../util'
import type { Habit, StatsKind, ViewProps } from '../types'

const KINDS: { id: StatsKind; label: string }[] = [
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'year', label: 'Jahr' },
]

function rangeFor(kind: StatsKind, anchor: string) {
  const d = parseKey(anchor)
  if (kind === 'week') {
    const from = mondayOf(anchor)
    const to = addDays(from, 6)
    return { from, to, label: `KW ${isoWeek(from)}`, sub: rangeLabel(from, to) }
  }
  if (kind === 'month') {
    const from = `${anchor.slice(0, 7)}-01`
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    return { from, to: `${anchor.slice(0, 7)}-${String(last).padStart(2, '0')}`, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`, sub: '' }
  }
  const y = d.getFullYear()
  return { from: `${y}-01-01`, to: `${y}-12-31`, label: String(y), sub: '' }
}

function shift(kind: StatsKind, anchor: string, dir: number) {
  if (kind === 'week') return addDays(anchor, 7 * dir)
  const d = parseKey(anchor)
  const m = kind === 'month' ? new Date(d.getFullYear(), d.getMonth() + dir, 1) : new Date(d.getFullYear() + dir, 0, 1)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-01`
}

function Stats({ ctx }: ViewProps) {
  const { habits, log, today, settings, back, push, refresh } = ctx
  const [kind, setKindState] = useState<StatsKind>(settings.statsKind)
  const [anchor, setAnchor] = useState(today)
  const range = rangeFor(kind, anchor)
  const end = minKey(range.to, today)
  const earliest = habits.reduce((min, h) => (h.start < min ? h.start : min), today)

  // Die gewaehlte Art ueberlebt den Neustart - eine Arbeitsweise, keine
  // Einstellung (wie Kontors Zeitraum).
  const setKind = (k: StatsKind) => {
    setKindState(k)
    setAnchor(today)
    updateSettings({ statsKind: k })
    refresh()
  }

  const s = useMemo(() => {
    // Wer im Zeitraum gelebt hat - archivierte zaehlen fuer die Zeit mit, in
    // der sie liefen.
    const considered = habits.filter(
      (h) =>
        quoteIn(h, log, range.from, range.to, today).due > 0 ||
        (!isArchived(h) && inLife(h, today) && today >= range.from && today <= range.to),
    )
    const scores = dayScores(considered, log, range.from, range.to, today)
    const scoreBy = new Map(scores.map((x) => [x.day, x]))
    const quotes = considered
      .map((h) => ({ h, q: quoteIn(h, log, range.from, range.to, today) }))
      .filter((x) => x.q.due > 0)
    const total = quotes.reduce((acc, x) => ({ met: acc.met + x.q.met, due: acc.due + x.q.due }), { met: 0, due: 0 })
    // Heute zaehlt bei den perfekten Tagen nur, wenn schon alles erledigt ist.
    const perfect = perfectDays(scores.filter((x) => x.day < today || x.met === x.due))

    let best: { h: Habit; n: number } | null = null
    if (end >= range.from) {
      const days = daysBetween(range.from, end)
      for (const h of considered) {
        const n = bestRunIn(statesBetween(h, log[h.id], range.from, end, today), days)
        if (n > 0 && (!best || n > best.n)) best = { h, n }
      }
    }

    let bars: QuoteBar[]
    if (kind === 'year') {
      bars = []
      for (let m = mondayOf(range.from); m <= range.to; m = addDays(m, 7)) {
        const week = daysBetween(m, addDays(m, 6)).filter((d) => d >= range.from && d <= range.to && d < today)
        const t = week.reduce((acc, d) => {
          const x = scoreBy.get(d)
          return x ? { met: acc.met + x.met, due: acc.due + x.due } : acc
        }, { met: 0, due: 0 })
        const firstOfQuarter = daysBetween(m, addDays(m, 6)).find(
          (d) => d >= range.from && d <= range.to && /-(01|04|07|10)-01$/.test(d),
        )
        bars.push({
          key: m,
          share: m > today ? null : t.due ? t.met / t.due : null,
          perfect: t.due > 0 && t.met === t.due,
          // Die laufende Woche umrandet: sie ist noch nicht fertig.
          today: today >= m && today <= addDays(m, 6),
          label: firstOfQuarter ? monthShort(parseKey(firstOfQuarter).getMonth()) : undefined,
        })
      }
    } else {
      bars = daysBetween(range.from, range.to).map((d, i) => {
        const x = scoreBy.get(d)
        const label = kind === 'week' ? WEEKDAYS_SHORT[weekdayIndex(d)] : i % 7 === 0 ? `${parseKey(d).getDate()}.` : undefined
        if (d > today || !x || !x.due) return { key: d, share: null, label }
        return { key: d, share: x.met / x.due, perfect: d < today && x.met === x.due, today: d === today, label }
      })
    }

    const weekdays = kind === 'week' ? null : weekdayQuotes(scores.filter((x) => x.day < today))
    let weakest: number | null = null
    if (weekdays && weekdays.every((w) => w !== null)) {
      weekdays.forEach((w, i) => {
        if (weakest === null || (w as number) < (weekdays[weakest] as number)) weakest = i
      })
    }

    return {
      considered,
      quotes: quotes.sort((a, b) => (share(b.q) ?? 0) - (share(a.q) ?? 0) || a.h.order - b.h.order),
      total,
      perfect,
      best,
      bars,
      weekdays,
      weakest: weakest as number | null,
    }
  }, [habits, log, today, range.from, range.to, end, kind])

  const canPrev = range.from > earliest
  const canNext = range.to < today

  // Wischen blaettert wie die Pfeile.
  const touch = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t) return
    const dx = e.changedTouches[0].clientX - t.x
    const dy = e.changedTouches[0].clientY - t.y
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return
    if (dx > 0 && canPrev) setAnchor(shift(kind, anchor, -1))
    if (dx < 0 && canNext) setAnchor(shift(kind, anchor, 1))
  }

  const totalShare = share(s.total)

  return (
    <Screen title="Statistik" onBack={back} className="s-stats">
      <div className="s-stats-body" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        <Segmented options={KINDS} value={kind} onChange={setKind} />
        <div className="s-period">
          <button type="button" className="s-ib plain" disabled={!canPrev} onClick={() => setAnchor(shift(kind, anchor, -1))} aria-label="Zeitraum zurück">
            <IconLeft />
          </button>
          <div className="s-period-mid">
            <b>{range.label}</b>
            {range.sub ? <small>{range.sub}</small> : null}
          </div>
          <button type="button" className="s-ib plain" disabled={!canNext} onClick={() => setAnchor(shift(kind, anchor, 1))} aria-label="Zeitraum vor">
            <IconRight />
          </button>
        </div>

        {!s.considered.length ? (
          <p className="s-note center">In diesem Zeitraum gab es noch keine Gewohnheit.</p>
        ) : (
          <>
            <div className="s-kpis">
              <div className="s-kpi">
                <b>{totalShare === null ? '–' : formatPercent(totalShare)}</b>
                <small>erfüllt</small>
              </div>
              <div className="s-kpi">
                <b>{s.perfect.perfect}</b>
                <small>
                  {s.perfect.perfect === 1 ? 'perfekter Tag' : 'perfekte Tage'} von {s.perfect.days}
                </small>
              </div>
              <div className="s-kpi">
                <b>
                  {s.best ? <IconFlame /> : null}
                  {s.best ? s.best.n : '–'}
                </b>
                <small>
                  längste Serie
                  {s.best ? (
                    <>
                      {' · '}
                      <span style={{ color: colorOf(s.best.h.color) }}>{s.best.h.name}</span>
                    </>
                  ) : null}
                </small>
              </div>
            </div>

            <Card title="Tagesquote" aside={<span className="s-legend-perfect">■ perfekt</span>}>
              <QuoteChart bars={s.bars} />
            </Card>

            <Card title="Gewohnheiten">
              <div className="s-rank">
                {s.quotes.map(({ h, q }) => (
                  <button key={h.id} type="button" className="s-rk" style={hue(h)} onClick={() => push({ name: 'detail', habitId: h.id })}>
                    <b>{h.name}</b>
                    <span className="tr">
                      <i style={{ width: `${(share(q) ?? 0) * 100}%` }} />
                    </span>
                    <em>{share(q) === null ? '–' : formatPercent(share(q)!)}</em>
                  </button>
                ))}
              </div>
            </Card>

            {s.weekdays ? (
              <Card title="Wochentage">
                <ShareBars
                  items={WEEKDAYS_SHORT.map((label, i) => ({ label, share: s.weekdays![i], hi: i === s.weakest }))}
                  height={72}
                  neutral
                />
                {s.weakest !== null ? (
                  <p className="s-cap">
                    <b>{WEEKDAYS_LONG[s.weakest]}</b> ist dein schwächster Tag ({formatPercent(s.weekdays[s.weakest]!)}).
                  </p>
                ) : null}
              </Card>
            ) : null}
          </>
        )}
      </div>
    </Screen>
  )
}

export default Stats
