// Die Regeln von Steady: Tagesstatus, Ruhetage, Serie, Quoten.
//
// Gespeichert ist nur, was eingetragen wurde (ein Haken oder ein Tageswert).
// Alles hier wird daraus berechnet - wer nachtraegt, bekommt automatisch die
// richtigen Ruhetage und die richtige Serie. Reine Funktionen ohne Speicher-
// oder DOM-Zugriff, darum vollstaendig testbar (calc.test.ts).

import type { DayState, Habit, HabitLog, Log } from './types'
import { addDays, daysBetween, diffDays, maxKey, minKey, mondayOf, weekdayIndex } from './util'

// ---------- Regeln einer Gewohnheit ----------

// Die Regel, die an einem Tag gilt: die juengste mit from <= day. Tage vor
// der ersten Regel (etwa nach einem vorverlegten Beginn) bekommen die erste.
export function ruleAt<T extends { from: string }>(rules: T[], day: string): T | undefined {
  let found: T | undefined
  for (const r of rules) {
    if (r.from <= day) found = r
    else break
  }
  return found ?? rules[0]
}

// Der Rhythmus einer Woche. Eine Regel, deren Beginn in die Woche faellt,
// gilt fuer die ganze Woche - Rhythmuswechsel wirken ab Montag.
export function perWeekFor(h: Habit, monday: string) {
  return ruleAt(h.rhythm, addDays(monday, 6))?.perWeek ?? 7
}

export function isWeekly(h: Habit, day: string) {
  return perWeekFor(h, mondayOf(day)) < 7
}

export function isArchived(h: Habit) {
  const last = h.inactive[h.inactive.length - 1]
  return !!last && last.to === null
}

// Lebt die Gewohnheit an diesem Tag? Nicht vor dem Beginn und nicht in einem
// archivierten Zeitraum.
export function inLife(h: Habit, day: string) {
  if (day < h.start) return false
  return !h.inactive.some((r) => day >= r.from && (r.to === null || day <= r.to))
}

// Erfuellt ein Tageswert das Ziel? Abhaken: jeder Wert. Menge: je nach
// mindestens/hoechstens. Kein Wert ist nie erledigt - auch nicht bei
// "hoechstens", sonst waere Nichts-Eintragen der einfachste Erfolg.
export function meets(h: Habit, value: number | undefined, day: string) {
  if (value === undefined) return false
  if (h.kind === 'check') return true
  const g = ruleAt(h.goal, day)
  if (!g) return true
  return g.dir === 'min' ? value >= g.target : value <= g.target
}

// ---------- Eine Woche ----------

export interface WeekInfo {
  monday: string
  states: DayState[] // Mo..So
  perWeek: number
  target: number // Ziel dieser Woche, in der ersten Woche anteilig
  restBudget: number // Ruhetage dieser Woche
  restUsed: number // verbrauchte Tage aus dem Kontingent (auch die ohne Serie)
  done: number
  missed: number
  reached: boolean // Wochenziel erreicht
  due: boolean // heute noetig, damit das Kontingent reicht (nur, wenn heute in der Woche liegt)
  restLeft: number // Tage aus dem Kontingent, die ab heute noch frei sind
  streakAlive: boolean // laeuft vor heute eine Serie? Ohne sie gibt es keine Ruhetage
}

// Kern der App. Beispiel Gym 3x pro Woche: 4 Ruhetage. Jeder vergangene Tag
// ohne Eintrag verbraucht der Reihe nach (Mo -> So) einen Tag aus dem
// Kontingent; ist es aufgebraucht, ist jeder weitere leere Tag verpasst.
//
// Ein Ruhetag setzt eine laufende Serie fort, er kann keine beginnen: nur wenn
// der Tag davor zaehlt (erledigt oder Ruhetag), wird ein freier Tag zum
// Ruhetag, sonst ist er verpasst - verbraucht aber trotzdem seinen Platz im
// Kontingent, damit ein einzelnes Training nicht die Woche rettet. Sonst saehe
// "Laufen 2x pro Woche" auch ohne einen einzigen Lauf nach 5 von 7 aus.
//
// Heute verbraucht nichts, solange heute laeuft. Taeglich ist derselbe Fall
// mit 0 Ruhetagen.
function computeWeek(h: Habit, hlog: HabitLog | undefined, monday: string, today: string, carried: boolean): WeekInfo {
  const perWeek = perWeekFor(h, monday)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const alive = days.map((d) => inLife(h, d))
  const active = alive.filter(Boolean).length
  // Beginnt die Gewohnheit mitten in der Woche (oder endet ein archivierter
  // Zeitraum), gilt das Ziel anteilig: Gym ab Donnerstag -> 4 Tage, Ziel 2.
  const target = active === 7 ? perWeek : Math.round((perWeek * active) / 7)
  const restBudget = active - target

  let restUsed = 0
  let done = 0
  let missed = 0
  let due = false
  let serie = carried
  let streakAlive = carried
  const states = days.map((d, i): DayState => {
    if (d === today) streakAlive = serie
    if (!alive[i]) {
      serie = false
      return 'off'
    }
    if (d > today) return 'future'
    if (meets(h, hlog?.[d], d)) {
      done += 1
      serie = true
      return 'done'
    }
    if (d === today) {
      due = restUsed >= restBudget
      return 'open'
    }
    if (restUsed < restBudget) {
      restUsed += 1
      if (serie) return 'rest'
      missed += 1
      return 'miss'
    }
    missed += 1
    serie = false
    return 'miss'
  })

  // Freie Tage ab heute - nie mehr, als die Woche noch Tage hat.
  const remaining = days.filter((d, i) => alive[i] && d >= today).length
  const restLeft = Math.max(0, Math.min(restBudget - restUsed, remaining))

  return { monday, states, perWeek, target, restBudget, restUsed, done, missed, reached: done >= target, due, restLeft, streakAlive }
}

// Jede Woche braucht den Stand vom Sonntag davor (laeuft eine Serie?), also
// wird vom Beginn an vorwaerts gerechnet. Die Wochen werden pro Gewohnheit,
// Eintraegen und Tag gemerkt - nach jeder Aenderung liest die App alles neu
// aus dem Speicher, damit sind es neue Objekte und der Merkzettel verfaellt.
const WOCHEN = new WeakMap<Habit, WeakMap<object, Map<string, Map<string, WeekInfo>>>>()
const OHNE_EINTRAEGE = {}

function merkzettel(h: Habit, hlog: HabitLog | undefined, today: string) {
  let proLog = WOCHEN.get(h)
  if (!proLog) WOCHEN.set(h, (proLog = new WeakMap()))
  const key = hlog ?? OHNE_EINTRAEGE
  let proTag = proLog.get(key)
  if (!proTag) proLog.set(key, (proTag = new Map()))
  let wochen = proTag.get(today)
  if (!wochen) proTag.set(today, (wochen = new Map()))
  return wochen
}

export function evaluateWeek(h: Habit, hlog: HabitLog | undefined, monday: string, today: string): WeekInfo {
  const memo = merkzettel(h, hlog, today)
  const hit = memo.get(monday)
  if (hit) return hit
  const first = mondayOf(h.start)
  if (monday <= first) {
    const w = computeWeek(h, hlog, monday, today, false)
    memo.set(monday, w)
    return w
  }
  // Von der letzten schon gerechneten Woche (oder dem Beginn) vorwaerts.
  let back = addDays(monday, -7)
  while (back > first && !memo.has(back)) back = addDays(back, -7)
  let prev = memo.get(back)
  let m = prev ? addDays(back, 7) : first
  for (; m <= monday; m = addDays(m, 7)) {
    const w = computeWeek(h, hlog, m, today, prev ? prev.states[6] === 'done' || prev.states[6] === 'rest' : false)
    memo.set(m, w)
    prev = w
  }
  return prev!
}

export function weekOf(h: Habit, log: Log, day: string, today: string) {
  return evaluateWeek(h, log[h.id], mondayOf(day), today)
}

// Heute noetig, obwohl x-mal pro Woche: keine Ruhetage mehr frei. Nur dann
// bekommt der Heute-Kasten den Rand in der Gewohnheitsfarbe.
export function isDueWeekly(h: Habit, log: Log, today: string) {
  const w = weekOf(h, log, today, today)
  return w.perWeek < 7 && w.due
}

// Zustaende fuer jeden Tag von from bis to. Gerechnet wird wochenweise, weil
// ein Ruhetag vom Rest seiner Woche abhaengt.
export function statesBetween(
  h: Habit,
  hlog: HabitLog | undefined,
  from: string,
  to: string,
  today: string,
): Record<string, DayState> {
  const out: Record<string, DayState> = {}
  if (to < from) return out
  for (let m = mondayOf(from); m <= to; m = addDays(m, 7)) {
    const w = evaluateWeek(h, hlog, m, today)
    for (let i = 0; i < 7; i += 1) {
      const d = addDays(m, i)
      if (d >= from && d <= to) out[d] = w.states[i]
    }
  }
  return out
}

export function stateOn(h: Habit, log: Log, day: string, today: string) {
  return weekOf(h, log, day, today).states[weekdayIndex(day)]
}

const counts = (s: DayState | undefined) => s === 'done' || s === 'rest'

// ---------- Serie ----------

// Tage in Folge mit erledigt oder Ruhetag. Ein offenes Heute bricht nichts
// und zaehlt nicht; ist heute erledigt, zaehlt es mit. Verpasst und inaktiv
// (auch ein archivierter Zeitraum) brechen die Serie.
export function streaks(h: Habit, hlog: HabitLog | undefined, today: string) {
  if (h.start > today) return { current: 0, best: 0 }
  const states = statesBetween(h, hlog, h.start, today, today)
  let run = 0
  let best = 0
  for (const d of daysBetween(h.start, today)) {
    const s = states[d]
    if (counts(s)) {
      run += 1
      if (run > best) best = run
    } else if (s !== 'open') {
      run = 0
    }
  }
  return { current: run, best }
}

// Laengste Folge innerhalb eines Zeitraums (fuer die Statistik).
export function bestRunIn(states: Record<string, DayState>, days: string[]) {
  let run = 0
  let best = 0
  for (const d of days) {
    const s = states[d]
    if (counts(s)) {
      run += 1
      if (run > best) best = run
    } else if (s !== 'open' && s !== 'future') {
      run = 0
    }
  }
  return best
}

// ---------- Quoten ----------

// Erfuellt / faellig. Offen, inaktiv und Zukunft zaehlen nicht - ein offenes
// Heute drueckt die Quote nicht.
export function tally(states: Iterable<DayState | undefined>) {
  let met = 0
  let due = 0
  for (const s of states) {
    if (s === 'done' || s === 'rest') {
      met += 1
      due += 1
    } else if (s === 'miss') {
      due += 1
    }
  }
  return { met, due }
}

export function share(t: { met: number; due: number }) {
  return t.due ? t.met / t.due : null
}

// Quote einer Gewohnheit in einem Zeitraum.
export function quoteIn(h: Habit, log: Log, from: string, to: string, today: string) {
  const end = minKey(to, today)
  const start = maxKey(from, h.start)
  if (end < start) return { met: 0, due: 0 }
  return tally(Object.values(statesBetween(h, log[h.id], start, end, today)))
}

// Geschaffte Wochen (nur x-mal pro Woche): abgeschlossene Wochen seit Beginn,
// in denen das Wochenziel erreicht wurde. Die laufende Woche zaehlt noch nicht.
export function weeksDone(h: Habit, log: Log, today: string) {
  let done = 0
  let total = 0
  const thisWeek = mondayOf(today)
  for (let m = mondayOf(h.start); m < thisWeek; m = addDays(m, 7)) {
    const w = evaluateWeek(h, log[h.id], m, today)
    if (w.states.every((s) => s === 'off')) continue
    total += 1
    if (w.reached) done += 1
  }
  return { done, total }
}

// ---------- Heute ----------

// Tageszaehler "3 von 6 erledigt": zaehlt, was heute faellig ist. Taeglich
// immer; x-mal pro Woche nur, wenn heute keine Ruhetage mehr uebrig sind
// oder es schon erledigt ist.
export function todayCount(habits: Habit[], log: Log, today: string) {
  let done = 0
  let due = 0
  for (const h of habits) {
    if (isArchived(h) || !inLife(h, today)) continue
    const w = weekOf(h, log, today, today)
    const s = w.states[weekdayIndex(today)]
    if (s === 'done') {
      done += 1
      due += 1
    } else if (w.perWeek === 7 || w.due) {
      due += 1
    }
  }
  return { done, due }
}

// ---------- Statistik ueber alle Gewohnheiten ----------

export interface DayScore {
  day: string
  met: number
  due: number
}

// Pro Tag: wie viele Gewohnheiten erfuellt, wie viele faellig. Heute zaehlt
// nur, was schon erledigt oder heute noetig ist (wie der Tageszaehler).
export function dayScores(habits: Habit[], log: Log, from: string, to: string, today: string): DayScore[] {
  const end = minKey(to, today)
  if (end < from) return []
  const perHabit = habits.map((h) => statesBetween(h, log[h.id], from, end, today))
  const heute = end === today ? todayCount(habits, log, today) : null
  return daysBetween(from, end).map((day) => {
    if (day === today && heute) return { day, met: heute.done, due: heute.due }
    const t = tally(perHabit.map((st) => st[day]))
    return { day, ...t }
  })
}

// Perfekter Tag: alle an dem Tag aktiven Gewohnheiten erfuellt. Heute nur,
// wenn schon alles Faellige erledigt ist.
export function perfectDays(scores: DayScore[]) {
  const counted = scores.filter((s) => s.due > 0)
  return { perfect: counted.filter((s) => s.met === s.due).length, days: counted.length }
}

// Quote je Wochentag (0 = Montag).
export function weekdayQuotes(scores: DayScore[]) {
  const acc = Array.from({ length: 7 }, () => ({ met: 0, due: 0 }))
  for (const s of scores) {
    const a = acc[weekdayIndex(s.day)]
    a.met += s.met
    a.due += s.due
  }
  return acc.map(share)
}

// ---------- Mengen ----------

export interface AmountPoint {
  day: string
  value: number | undefined
  met: boolean
}

export function amountSeries(h: Habit, log: Log, from: string, to: string): AmountPoint[] {
  const hlog = log[h.id]
  return daysBetween(from, to).map((day) => ({ day, value: hlog?.[day], met: meets(h, hlog?.[day], day) }))
}

// Wie weit ist ein Tageswert vom Ziel? Fuer den Balken im Heute-Kasten und
// den Satz unter der Zahl.
export function progress(h: Habit, value: number | undefined, day: string) {
  const g = ruleAt(h.goal, day)
  if (!g || value === undefined) return { share: 0, rest: g?.target ?? 0, over: false, met: false }
  const met = meets(h, value, day)
  if (g.dir === 'min') {
    return { share: g.target ? Math.min(1, value / g.target) : 1, rest: Math.max(0, g.target - value), over: false, met }
  }
  return { share: g.target ? Math.min(1, value / g.target) : 1, rest: Math.max(0, g.target - value), over: value > g.target, met }
}

// Wie viele Tage liegt der Beginn zurueck (fuer "seit" und die Heatmap).
export function ageInDays(h: Habit, today: string) {
  return Math.max(0, diffDays(h.start, today))
}
