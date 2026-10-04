// Alles, was aus den Sitzungen berechnet wird - nichts davon wird gespeichert.
// Tage sind immer logische Tage (Tageswechsel, siehe util.dayOf).

import { STATUS_RANK, difficultyInfo, statusOf } from './model'
import type { Piece, Playlist, Session, Sessions, Settings } from './types'
import { MONTHS_SHORT, WEEKDAYS_SHORT, addDays, dayOf, diffDays, mondayOf, parseKey } from './util'

const DAY_MS = 86_400_000

export function sessionsOf(sessions: Sessions, id: string): Session[] {
  const list = sessions[id]
  return Array.isArray(list) ? list : []
}

// ---------- Summen ----------

/** Sekunden pro logischem Tag, ueber alle Stuecke (oder nur eins). */
export function dayTotals(sessions: Sessions, dayStart: number, pieceId?: string) {
  const totals = new Map<string, number>()
  for (const [id, list] of Object.entries(sessions)) {
    if (pieceId && id !== pieceId) continue
    if (!Array.isArray(list)) continue
    for (const s of list) {
      if (!s?.timestamp) continue
      const day = dayOf(s.timestamp, dayStart)
      totals.set(day, (totals.get(day) ?? 0) + (s.duration || 0))
    }
  }
  return totals
}

export function totalSeconds(sessions: Sessions) {
  let sum = 0
  for (const list of Object.values(sessions)) if (Array.isArray(list)) for (const s of list) sum += s?.duration || 0
  return sum
}

export function sessionCount(sessions: Sessions) {
  let n = 0
  for (const list of Object.values(sessions)) if (Array.isArray(list)) n += list.length
  return n
}

export function pieceTotal(sessions: Sessions, id: string) {
  return sessionsOf(sessions, id).reduce((sum, s) => sum + (s.duration || 0), 0)
}

/** Geschaetzte Dauer einer Sitzung: Ø des Stuecks, ohne Sitzungen 5 Minuten. */
export function avgSessionOf(sessions: Sessions, id: string) {
  const list = sessionsOf(sessions, id)
  if (!list.length) return 5 * 60
  return pieceTotal(sessions, id) / list.length
}

export function practicedOn(sessions: Sessions, id: string, day: string, dayStart: number) {
  return sessionsOf(sessions, id).some((s) => s?.timestamp && dayOf(s.timestamp, dayStart) === day)
}

export function lastSessionsOf(sessions: Sessions, id: string, n: number) {
  return [...sessionsOf(sessions, id)].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, n)
}

// ---------- Woche, Serie, Kalender ----------

export interface WeekDay {
  day: string
  label: string
  seconds: number
  isToday: boolean
  future: boolean
}

/** Montag bis Sonntag der Woche von heute. */
export function weekDays(totals: Map<string, number>, today: string): WeekDay[] {
  const monday = mondayOf(today)
  return WEEKDAYS_SHORT.map((label, i) => {
    const day = addDays(monday, i)
    return { day, label, seconds: totals.get(day) ?? 0, isToday: day === today, future: day > today }
  })
}

// Tage am Stueck mit mindestens einer Sitzung, bis heute oder gestern: wer
// heute noch nicht geuebt hat, verliert die Serie nicht schon morgens.
export function currentStreak(totals: Map<string, number>, today: string) {
  let day = totals.has(today) ? today : addDays(today, -1)
  let n = 0
  while (totals.has(day)) {
    n += 1
    day = addDays(day, -1)
  }
  return n
}

export function longestStreak(totals: Map<string, number>) {
  const days = [...totals.keys()].sort()
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1
    if (run > best) best = run
    prev = d
  }
  return best
}

/** Stufe im Kalender: 0 nichts, 1 bis 10 min, 2 bis 25, 3 bis 45, 4 darueber */
export function heatLevel(seconds: number) {
  if (seconds <= 0) return 0
  if (seconds <= 600) return 1
  if (seconds <= 1500) return 2
  if (seconds <= 2700) return 3
  return 4
}

export interface CalendarCell {
  day: string
  level: number
  future: boolean
  isToday: boolean
}

// Die letzten Wochen als Spalten (Mo oben, So unten), die aktuelle ganz
// rechts - so steht heute immer im Bild. Monatsnamen ueber der Woche, in der
// der Monat beginnt; zu dicht aufeinander faellt der fruehere weg.
export function calendar(totals: Map<string, number>, today: string, weeks = 17) {
  const start = addDays(mondayOf(today), -(weeks - 1) * 7)
  const columns: CalendarCell[][] = []
  const labels: { index: number; label: string }[] = []
  for (let w = 0; w < weeks; w += 1) {
    const col: CalendarCell[] = []
    for (let d = 0; d < 7; d += 1) {
      const day = addDays(start, w * 7 + d)
      col.push({ day, level: heatLevel(totals.get(day) ?? 0), future: day > today, isToday: day === today })
    }
    columns.push(col)
    const firstOfMonth = col.find((c) => c.day.endsWith('-01'))
    if (w === 0 || firstOfMonth) {
      const month = parseKey((firstOfMonth ?? col[0]).day).getMonth()
      const last = labels[labels.length - 1]
      if (last && w - last.index < 3) labels.pop()
      labels.push({ index: w, label: MONTHS_SHORT[month] })
    }
  }
  return { columns, labels }
}

// ---------- Sortierung ----------

/** Wie in der alten App: jede Sitzung zaehlt, juengere deutlich mehr (nach 30 Tagen noch ein Zehntel). */
export function trendingScore(sessions: Sessions, id: string, now: number) {
  let score = 0
  for (const s of sessionsOf(sessions, id)) {
    const daysAgo = Math.floor((now - new Date(s.timestamp).getTime()) / DAY_MS)
    score += (s.duration || 0) * 10 * Math.exp(-daysAgo / 13)
  }
  return score
}

// Fester Zufall fuer Tagesliste und Sortierung "Zufall" (Park-Miller wie
// bisher). Der Startwert wird in den gueltigen Bereich gebracht - mit
// Date.now() direkt verloere die Multiplikation an Genauigkeit.
export function seededRandom(seed: number) {
  let s = Math.floor(Math.abs(seed)) % 2147483647
  if (s <= 0) s += 2147483646
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export function sortPieces(pieces: Piece[], sessions: Sessions, sort: Settings['sort'], now: number, seed = 1) {
  const list = [...pieces]
  const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0)
  switch (sort.by) {
    case 'random': {
      const rnd = seededRandom(seed)
      const keyed = list.map((p) => ({ p, k: rnd() }))
      keyed.sort((a, b) => a.k - b.k)
      return keyed.map((x) => x.p)
    }
    case 'lastPracticed':
      list.sort((a, b) => time(b.lastPracticed) - time(a.lastPracticed))
      break
    case 'practiceTime':
      list.sort((a, b) => pieceTotal(sessions, b.id) - pieceTotal(sessions, a.id))
      break
    case 'progress':
      list.sort((a, b) => STATUS_RANK[statusOf(a.progress)] - STATUS_RANK[statusOf(b.progress)])
      break
    case 'difficulty':
      list.sort((a, b) => difficultyInfo(a.difficulty).rank - difficultyInfo(b.difficulty).rank)
      break
    case 'title':
      list.sort((a, b) => a.title.localeCompare(b.title, 'de'))
      break
    case 'default':
      list.sort((a, b) => time(b.createdAt) - time(a.createdAt))
      break
    default: {
      const score = new Map(list.map((p) => [p.id, trendingScore(sessions, p.id, now)]))
      list.sort((a, b) => (score.get(b.id) ?? 0) - (score.get(a.id) ?? 0))
    }
  }
  return sort.reverse ? list.reverse() : list
}

// ---------- Tagesliste ----------

const STATUS_BONUS = { not_started: 15, hands: 12, together: 8, learned: 5, memorizing: 3, mastered: 2 }

/** Startwert eines Tages: 2026-10-04 → 20261004 (wie bisher). */
export function seedOf(day: string) {
  return Number(day.replace(/-/g, ''))
}

// Unveraendert aus der alten App, nur fuellt die Liste jetzt das Tagesziel
// statt fest 30 Minuten: Punkte fuer lange nicht geuebt, Trend, Lernstand und
// etwas Zufall; dann der Reihe nach, bis die geschaetzte Zeit reicht.
export function generatePlaylist(pieces: Piece[], sessions: Sessions, seed: number, targetSeconds: number, now: number) {
  if (!pieces.length) return []
  const rnd = seededRandom(seed)
  const scored = pieces.map((piece) => {
    const status = statusOf(piece.progress)
    const days = piece.lastPracticed ? Math.floor((now - new Date(piece.lastPracticed).getTime()) / DAY_MS) : 999
    const neglect = Math.min(days * 2, 60)
    const trend = Math.min(trendingScore(sessions, piece.id, now) / 500, 30)
    const jitter = rnd() * 20
    return {
      piece,
      score: neglect + trend + STATUS_BONUS[status] + jitter,
      avg: avgSessionOf(sessions, piece.id),
      difficulty: difficultyInfo(piece.difficulty).rank,
      status,
    }
  })
  scored.sort((a, b) => b.score - a.score)

  const picked: typeof scored = []
  let total = 0
  const usedDifficulties = new Set<number>()
  const usedStatuses = new Set<string>()
  for (const item of scored) {
    if (total >= targetSeconds) break
    // Etwas Abwechslung: neue Schwierigkeit oder neuer Lernstand bekommt einen Schub.
    item.score += (usedDifficulties.has(item.difficulty) ? 0 : 5) + (usedStatuses.has(item.status) ? 0 : 5)
    picked.push(item)
    total += item.avg
    usedDifficulties.add(item.difficulty)
    usedStatuses.add(item.status)
  }
  picked.sort((a, b) => b.score - a.score)
  return picked.map((x) => x.piece.id)
}

/**
 * Die Tagesliste fuer heute: die gespeicherte, wenn sie von heute ist und noch
 * Stuecke hat, sonst eine neue. `fresh` heisst: noch nicht gespeichert.
 */
export function todaysPlaylist(
  stored: Playlist | null,
  pieces: Piece[],
  sessions: Sessions,
  today: string,
  targetSeconds: number,
  now: number,
): { playlist: Playlist; fresh: boolean } {
  const exists = new Set(pieces.map((p) => p.id))
  if (stored && stored.date === today && Array.isArray(stored.pieceIds)) {
    const ids = stored.pieceIds.filter((id) => exists.has(id))
    if (ids.length) return { playlist: { ...stored, pieceIds: ids }, fresh: ids.length !== stored.pieceIds.length }
  }
  const seed = seedOf(today)
  return { playlist: { date: today, seed, pieceIds: generatePlaylist(pieces, sessions, seed, targetSeconds, now) }, fresh: true }
}

// ---------- Verlauf ----------

export interface HistoryItem {
  pieceId: string
  session: Session
}

export interface HistoryDay {
  day: string
  seconds: number
  items: HistoryItem[]
}

/** Alle Sitzungen nach logischem Tag, neueste zuerst. */
export function historyDays(sessions: Sessions, dayStart: number, pieceId?: string): HistoryDay[] {
  const items: HistoryItem[] = []
  for (const [id, list] of Object.entries(sessions)) {
    if (pieceId && id !== pieceId) continue
    if (!Array.isArray(list)) continue
    for (const s of list) if (s?.timestamp) items.push({ pieceId: id, session: s })
  }
  items.sort((a, b) => b.session.timestamp.localeCompare(a.session.timestamp))
  const days: HistoryDay[] = []
  for (const item of items) {
    const day = dayOf(item.session.timestamp, dayStart)
    let group = days[days.length - 1]
    if (!group || group.day !== day) {
      group = { day, seconds: 0, items: [] }
      days.push(group)
    }
    group.items.push(item)
    group.seconds += item.session.duration || 0
  }
  return days
}

/** Die meistgeuebten Stuecke (nur mit Zeit). */
export function topPieces(pieces: Piece[], sessions: Sessions, n: number) {
  return pieces
    .map((p) => ({ piece: p, seconds: pieceTotal(sessions, p.id) }))
    .filter((x) => x.seconds > 0)
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, n)
}
