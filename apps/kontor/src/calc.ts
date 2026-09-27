// Auswertung: aus Buchungen werden Summen, Segmente und Reihen. Eine Stelle,
// damit Uebersicht, Statistik und Kategoriedetail nie unterschiedlich rechnen.

import { COLOR_OTHER, COLOR_TRANSFER, ID_OTHER, ID_TRANSFER } from './data'
import {
  MONTHS_SHORT,
  addDays,
  dateKey,
  inRange,
  parseKey,
  periodRange,
  shiftPeriod,
  todayKey,
} from './util'
import type { Account, Category, CategoryKind, Entry, PeriodKind, Range, Segment } from './types'

type AccById = Record<string, Account>
type CatById = Record<string, Category>
type RangeLike = Pick<Range, 'from' | 'to'>

export interface Flow {
  exp: number
  inc: number
  bucket: string | null
}

// Wie eine Buchung in die Statistik eingeht.
//
// Umbuchungen sind normalerweise neutral. Verlaesst das Geld aber die
// Gesamtbalance - von einem gezaehlten auf ein nicht gezaehltes Konto -, dann
// fehlt es dort genauso wie eine Ausgabe. Es bekommt trotzdem ein eigenes
// Segment und wird nie einer Ausgabenkategorie zugeschlagen.
export function entryFlow(entry: Entry, accById: AccById, countBoundary: boolean): Flow {
  const a = entry.amountCent
  if (entry.type === 'expense') return { exp: a, inc: 0, bucket: entry.categoryId }
  if (entry.type === 'income') return { exp: 0, inc: a, bucket: entry.categoryId }
  if (entry.type === 'transfer' && countBoundary) {
    const from = accById[entry.accountId]
    const to = entry.toAccountId ? accById[entry.toAccountId] : undefined
    if (from?.includeInTotal && to && !to.includeInTotal) {
      return { exp: a, inc: 0, bucket: ID_TRANSFER }
    }
    if (from && !from.includeInTotal && to?.includeInTotal) {
      return { exp: 0, inc: a, bucket: ID_TRANSFER }
    }
  }
  return { exp: 0, inc: 0, bucket: null }
}

export function entriesInRange(entries: Entry[], range: RangeLike) {
  return entries.filter((e) => inRange(e.date, range))
}

export function totalsInRange(entries: Entry[], range: RangeLike, accById: AccById, countBoundary: boolean) {
  let inc = 0
  let exp = 0
  let count = 0
  let biggest: Entry | null = null
  for (const e of entries) {
    if (!inRange(e.date, range)) continue
    if (e.type !== 'adjustment') count += 1
    const f = entryFlow(e, accById, countBoundary)
    inc += f.inc
    exp += f.exp
    if (f.exp > 0 && (!biggest || f.exp > biggest.amountCent)) {
      biggest = { ...e, amountCent: f.exp }
    }
  }
  return { inc, exp, diff: inc - exp, count, biggest }
}

// Segmente fuer den Donut. Ab mehr als maxSegments Posten wandert der
// Schwanz nach "Sonstiges" - sonst besteht der Ring aus Haarlinien. Die
// Grenze liegt hoeher als die Zahl der Beschriftungen: welche Segmente ein
// Icon bekommen, entscheidet der Donut selbst nach Platz (siehe charts.tsx).
// So sieht man die Verteilung, ohne dass ein dicker Sammelposten sie
// verdeckt.
export function breakdown({
  entries,
  range,
  kind,
  catById,
  accById,
  countBoundary,
  maxSegments = 10,
}: {
  entries: Entry[]
  range: RangeLike
  kind: CategoryKind
  catById: CatById
  accById: AccById
  countBoundary: boolean
  maxSegments?: number
}) {
  const sums = new Map<string, number>()
  let total = 0
  for (const e of entries) {
    if (!inRange(e.date, range)) continue
    const f = entryFlow(e, accById, countBoundary)
    const value = kind === 'expense' ? f.exp : f.inc
    if (!value || !f.bucket) continue
    sums.set(f.bucket, (sums.get(f.bucket) ?? 0) + value)
    total += value
  }

  const all: Omit<Segment, 'share'>[] = [...sums.entries()]
    .map(([id, value]) => {
      if (id === ID_TRANSFER) {
        return { id, name: 'Umbuchung', color: COLOR_TRANSFER, icon: 'transfer', value }
      }
      const cat = catById[id]
      return {
        id,
        name: cat?.name ?? 'Gelöscht',
        color: cat?.color ?? COLOR_OTHER,
        icon: cat?.icon ?? 'dots',
        value,
      }
    })
    .sort((a, b) => b.value - a.value)

  let segments = all
  if (all.length > maxSegments) {
    const head = all.slice(0, maxSegments - 1)
    const tail = all.slice(maxSegments - 1)
    segments = [
      ...head,
      {
        id: ID_OTHER,
        name: 'Sonstiges',
        color: COLOR_OTHER,
        icon: 'dots',
        value: tail.reduce((s, x) => s + x.value, 0),
        members: tail.map((x) => x.id),
      },
    ]
  }

  return {
    total,
    segments: segments.map((s): Segment => ({ ...s, share: total ? s.value / total : 0 })),
    all,
  }
}

export interface SeriesPoint {
  key: string
  label: string
  full: string
  exp: number
  inc: number
}

// Balkenreihe passend zum Zeitraum: Monat und Woche pro Tag, Jahr und Gesamt
// pro Monat. Ein Tag hat genau einen Balken.
export function seriesForPeriod({
  entries,
  kind,
  range,
  accById,
  countBoundary,
  firstKey,
}: {
  entries: Entry[]
  kind: PeriodKind
  range: RangeLike
  accById: AccById
  countBoundary: boolean
  firstKey: string | null
}) {
  const perMonth = kind === 'year' || kind === 'all'
  const map = new Map<string, Omit<SeriesPoint, 'key'>>()

  const from = range.from ?? firstKey ?? todayKey()
  const to = range.to ?? todayKey()

  if (perMonth) {
    const start = parseKey(from)
    const end = parseKey(to)
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      map.set(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`, {
        label: MONTHS_SHORT[cur.getMonth()],
        full: `${MONTHS_SHORT[cur.getMonth()]} ${cur.getFullYear()}`,
        exp: 0,
        inc: 0,
      })
      cur.setMonth(cur.getMonth() + 1)
    }
  } else {
    let key = from
    while (key <= to) {
      map.set(key, { label: String(parseKey(key).getDate()), full: key, exp: 0, inc: 0 })
      key = addDays(key, 1)
    }
  }

  for (const e of entries) {
    if (!inRange(e.date, range)) continue
    const slot = perMonth ? e.date.slice(0, 7) : e.date
    const bucket = map.get(slot)
    if (!bucket) continue
    const f = entryFlow(e, accById, countBoundary)
    bucket.exp += f.exp
    bucket.inc += f.inc
  }

  const points: SeriesPoint[] = [...map.entries()].map(([key, v]) => ({ key, ...v }))
  return { points, perMonth }
}

// Die letzten n Zeitraeume derselben Art - fuer den Verlauf im Kategoriedetail.
export function categoryHistory({
  entries,
  categoryId,
  kind,
  anchor,
  weekStart,
  count = 6,
  accById,
  countBoundary,
}: {
  entries: Entry[]
  categoryId: string
  kind: PeriodKind
  anchor: string
  weekStart: number
  count?: number
  accById: AccById
  countBoundary: boolean
}) {
  const out: { label: string; value: number }[] = []
  let cursor = anchor
  for (let i = 0; i < count; i += 1) {
    const range = periodRange(kind === 'all' ? 'month' : kind, cursor, weekStart)
    let value = 0
    for (const e of entries) {
      if (!inRange(e.date, range)) continue
      const f = entryFlow(e, accById, countBoundary)
      if (f.bucket !== categoryId) continue
      value += f.exp + f.inc
    }
    out.unshift({ label: shortLabel(kind, range), value })
    cursor = shiftPeriod(kind === 'all' ? 'month' : kind, cursor, -1, weekStart)
  }
  return out
}

function shortLabel(kind: PeriodKind, range: RangeLike) {
  const d = parseKey(range.from ?? todayKey())
  if (kind === 'day') return String(d.getDate())
  if (kind === 'week') return `${d.getDate()}.${d.getMonth() + 1}.`
  if (kind === 'year') return String(d.getFullYear())
  return MONTHS_SHORT[d.getMonth()]
}

// Tage im Zeitraum ohne einzige Ausgabe - aber nur bis heute, sonst zaehlt der
// halbe Monat, der noch kommt, als Erfolg.
export function spendFreeDays(
  entries: Entry[],
  range: RangeLike,
  accById: AccById,
  countBoundary: boolean,
  firstKey: string | null,
) {
  const from = range.from ?? firstKey
  if (!from) return { free: 0, total: 0 }
  const today = todayKey()
  const to = range.to && range.to < today ? range.to : today
  if (to < from) return { free: 0, total: 0 }

  const spent = new Set<string>()
  for (const e of entries) {
    if (e.date < from || e.date > to) continue
    if (entryFlow(e, accById, countBoundary).exp > 0) spent.add(e.date)
  }

  let total = 0
  let key = from
  while (key <= to) {
    total += 1
    key = addDays(key, 1)
  }
  return { free: total - spent.size, total }
}

// Hochrechnung: Tempo bis heute auf den ganzen Zeitraum. Nur sinnvoll, solange
// der Zeitraum laeuft.
export function projection(exp: number, range: RangeLike, firstKey: string | null) {
  const today = todayKey()
  const from = range.from ?? firstKey
  if (!from || !range.to || range.to <= today) return null
  const daysSoFar = Math.max(1, Math.round((parseKey(today).getTime() - parseKey(from).getTime()) / 86400000) + 1)
  const daysTotal = Math.round((parseKey(range.to).getTime() - parseKey(from).getTime()) / 86400000) + 1
  if (daysSoFar >= daysTotal) return null
  return Math.round((exp / daysSoFar) * daysTotal)
}

// Budgets sind Monatsbudgets. In jedem anderen Zeitraum ist der Vergleich
// schief, darum zeigt die App sie nur im Monat.
export function budgetUsage(
  entries: Entry[],
  range: RangeLike,
  categoryId: string,
  accById: AccById,
  countBoundary: boolean,
) {
  let used = 0
  for (const e of entries) {
    if (!inRange(e.date, range)) continue
    const f = entryFlow(e, accById, countBoundary)
    if (f.bucket === categoryId) used += f.exp
  }
  return used
}

export function monthRangeOf(key: string) {
  const d = parseKey(key)
  return {
    from: dateKey(new Date(d.getFullYear(), d.getMonth(), 1)),
    to: dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0)),
  }
}
