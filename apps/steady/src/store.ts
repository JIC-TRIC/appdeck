// Speicher. Wie jede App im Launcher: ein localStorage-Schluessel pro Liste
// mit dem Praefix der App-ID - so erfasst das Backup im Launcher Steady
// automatisch mit.

import { ruleAt } from './calc'
import { ENTWURF_KEY } from './entwurf'
import { PALETTE } from './data'
import { addDays, maxKey, mondayOf } from './util'
import type { GoalDir, Habit, HabitKind, Log, Settings } from './types'

export const APP_ID = 'steady'
const PREFIX = `${APP_ID}:`
const KEY_HABITS = 'habits'
const KEY_LOG = 'log'
const KEY_SETTINGS = 'settings'
const KEYS = [KEY_HABITS, KEY_LOG, KEY_SETTINGS]

export const DEFAULT_SETTINGS: Settings = {
  // Bis 3 Uhr nachts gilt noch der Vortag.
  dayStart: 3,
  statsKind: 'month',
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function uid() {
  return `h_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function now() {
  return new Date().toISOString()
}

// ---------- Speicher ----------

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

// ---------- Lesen ----------

export function getHabits(): Habit[] {
  const raw = read(KEY_HABITS)
  return Array.isArray(raw) ? (raw as Habit[]) : []
}

export function getLog(): Log {
  const raw = read(KEY_LOG)
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Log) : {}
}

export function getSettings(): Settings {
  const raw = read(KEY_SETTINGS) as Partial<Settings> | null
  return { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) }
}

export function updateSettings(patch: Partial<Settings>) {
  const next = { ...getSettings(), ...patch }
  write(KEY_SETTINGS, next)
  return next
}

export function hasEntries(habitId: string) {
  return Object.keys(getLog()[habitId] ?? {}).length > 0
}

// ---------- Gewohnheiten ----------

// Was das Formular liefert. Rhythmus und Ziel sind hier einfache Werte - wie
// sie zu Regeln mit Gueltigkeitsdatum werden, entscheidet der Speicher.
export interface HabitInput {
  name: string
  color: string
  kind: HabitKind
  unit: string
  perWeek: number // 7 = taeglich
  target: number
  dir: GoalDir
  start: string
}

function saveHabits(list: Habit[]) {
  write(KEY_HABITS, list)
}

function nextOrder(list: Habit[]) {
  return list.reduce((max, h) => Math.max(max, h.order + 1), 0)
}

// Eine neue Gewohnheit aus dem Formular - ohne sie zu speichern (die
// Vorschau im Formular braucht dasselbe).
export function buildHabit(input: HabitInput, id: string, order: number): Habit {
  const t = now()
  return {
    id,
    name: input.name.trim(),
    color: input.color,
    kind: input.kind,
    unit: input.kind === 'amount' ? input.unit.trim() : '',
    rhythm: [{ from: input.start, perWeek: input.perWeek }],
    goal: input.kind === 'amount' ? [{ from: input.start, target: input.target, dir: input.dir }] : [],
    start: input.start,
    inactive: [],
    order,
    createdAt: t,
    updatedAt: t,
  }
}

export function addHabit(input: HabitInput): Habit {
  const list = getHabits()
  const habit = buildHabit(input, uid(), nextOrder(list))
  saveHabits([...list, habit])
  return habit
}

// Eine Regel ab "from" setzen: spaetere und gleichzeitige fallen weg, die
// neue kommt ans Ende. Stimmt sie mit der bis dahin geltenden ueberein, bleibt
// alles, wie es ist.
function setRule<T extends { from: string }>(rules: T[], rule: T, same: (a: T, b: T) => boolean): T[] {
  const kept = rules.filter((r) => r.from < rule.from)
  const before = kept[kept.length - 1]
  if (before && same(before, rule)) return kept
  return [...kept, rule]
}

// Aendern. Mit Eintraegen bleibt die Geschichte stehen: ein neuer Rhythmus
// gilt ab Montag der laufenden Woche, ein neues Mengenziel ab heute. Ohne
// Eintraege gibt es keine Geschichte, die eine alte Regel braeuchte - dann
// wird einfach neu aufgesetzt, und auch die Messart darf wechseln.
export function updateHabit(id: string, input: HabitInput, today: string) {
  const list = getHabits()
  const i = list.findIndex((h) => h.id === id)
  if (i < 0) return
  list[i] = nextHabit(list[i], input, today, hasEntries(id))
  saveHabits(list)
}

// Die geaenderte Fassung einer Gewohnheit, ohne zu speichern.
export function nextHabit(old: Habit, input: HabitInput, today: string, withEntries: boolean): Habit {
  const kind = withEntries ? old.kind : input.kind
  const next: Habit = {
    ...old,
    name: input.name.trim(),
    color: input.color,
    kind,
    unit: kind === 'amount' ? input.unit.trim() : '',
    start: input.start,
    updatedAt: now(),
  }

  if (!withEntries) {
    next.rhythm = [{ from: input.start, perWeek: input.perWeek }]
    next.goal = kind === 'amount' ? [{ from: input.start, target: input.target, dir: input.dir }] : []
  } else {
    const weekFrom = maxKey(mondayOf(today), input.start)
    if (ruleAt(old.rhythm, addDays(mondayOf(today), 6))?.perWeek !== input.perWeek) {
      next.rhythm = setRule(old.rhythm, { from: weekFrom, perWeek: input.perWeek }, (a, b) => a.perWeek === b.perWeek)
    }
    if (kind === 'amount') {
      const cur = ruleAt(old.goal, today)
      if (!cur || cur.target !== input.target || cur.dir !== input.dir) {
        next.goal = setRule(
          old.goal,
          { from: maxKey(today, input.start), target: input.target, dir: input.dir },
          (a, b) => a.target === b.target && a.dir === b.dir,
        )
      }
    }
  }
  return next
}

// Archivieren gilt ab morgen: was heute schon abgehakt ist, zaehlt noch.
export function archiveHabit(id: string, today: string) {
  const list = getHabits()
  const h = list.find((x) => x.id === id)
  if (!h || h.inactive.some((r) => r.to === null)) return
  h.inactive = [...h.inactive, { from: addDays(today, 1), to: null }]
  h.updatedAt = now()
  saveHabits(list)
}

// Wiederherstellen: der archivierte Zeitraum endet gestern, heute lebt die
// Gewohnheit wieder - mit neuer Serie, weil dazwischen inaktive Tage liegen.
// Am selben Tag archiviert und zurueckgeholt bleibt keine Luecke.
// Aus dem Archiv kommt sie unten ins Raster; beim Zuruecknehmen des
// Archivierens (toEnd = false) bleibt sie, wo sie war.
export function restoreHabit(id: string, today: string, toEnd = true) {
  const list = getHabits()
  const h = list.find((x) => x.id === id)
  if (!h) return
  const last = h.inactive[h.inactive.length - 1]
  if (!last || last.to !== null) return
  const to = addDays(today, -1)
  h.inactive = to < last.from ? h.inactive.slice(0, -1) : [...h.inactive.slice(0, -1), { from: last.from, to }]
  if (toEnd) h.order = nextOrder(list)
  h.updatedAt = now()
  saveHabits(list)
}

export function deleteHabit(id: string) {
  saveHabits(getHabits().filter((h) => h.id !== id))
  const log = getLog()
  if (log[id]) {
    delete log[id]
    write(KEY_LOG, log)
  }
}

export function reorderHabits(ids: string[]) {
  const list = getHabits()
  const pos = new Map(ids.map((id, i) => [id, i]))
  for (const h of list) {
    const p = pos.get(h.id)
    if (p !== undefined) h.order = p
  }
  saveHabits(list)
}

// ---------- Eintraege ----------

// Ein Wert pro Gewohnheit und Tag; null entfernt ihn.
export function setValue(habitId: string, day: string, value: number | null) {
  const log = getLog()
  const hlog = { ...(log[habitId] ?? {}) }
  if (value === null) delete hlog[day]
  else hlog[day] = value
  if (Object.keys(hlog).length) log[habitId] = hlog
  else delete log[habitId]
  write(KEY_LOG, log)
}

export function getValue(habitId: string, day: string) {
  return getLog()[habitId]?.[day]
}

// ---------- Export / Import ----------

export function exportSnapshot() {
  return {
    app: 'steady',
    version: 1,
    exportedAt: now(),
    habits: getHabits(),
    log: getLog(),
    settings: getSettings(),
  }
}

const COLORS = new Set<string>(PALETTE.map((p) => p.id))

// Eine Gewohnheit aus einer Datei pruefen und fehlende Felder auffuellen.
// Was nicht stimmt, laesst den ganzen Import scheitern - lieber eine klare
// Meldung als ein halb kaputter Bestand.
function checkHabit(raw: unknown, i: number): Habit {
  const h = raw as Partial<Habit> | null
  const fail = (what: string) => {
    throw new Error(`Gewohnheit ${i + 1}: ${what}`)
  }
  if (!h || typeof h !== 'object') fail('kein Objekt')
  if (typeof h!.id !== 'string' || !h!.id) fail('ohne ID')
  if (typeof h!.name !== 'string' || !h!.name.trim()) fail('ohne Namen')
  if (h!.kind !== 'check' && h!.kind !== 'amount') fail('unbekannte Messart')
  if (typeof h!.start !== 'string' || !DATE_RE.test(h!.start)) fail('ohne gültigen Beginn')
  const rhythm = Array.isArray(h!.rhythm) ? h!.rhythm : []
  if (!rhythm.length || rhythm.some((r) => !DATE_RE.test(r?.from) || !(r.perWeek >= 1 && r.perWeek <= 7))) {
    fail('ungültiger Rhythmus')
  }
  const goal = Array.isArray(h!.goal) ? h!.goal : []
  if (h!.kind === 'amount' && (!goal.length || goal.some((g) => !DATE_RE.test(g?.from) || typeof g.target !== 'number' || (g.dir !== 'min' && g.dir !== 'max')))) {
    fail('ungültiges Ziel')
  }
  const inactive = Array.isArray(h!.inactive) ? h!.inactive : []
  return {
    id: h!.id!,
    name: h!.name!.trim(),
    color: COLORS.has(h!.color ?? '') ? h!.color! : PALETTE[i % PALETTE.length].id,
    kind: h!.kind!,
    unit: typeof h!.unit === 'string' ? h!.unit : '',
    rhythm: [...rhythm].sort((a, b) => a.from.localeCompare(b.from)),
    goal: h!.kind === 'amount' ? [...goal].sort((a, b) => a.from.localeCompare(b.from)) : [],
    start: h!.start!,
    inactive: inactive.filter((r) => r && DATE_RE.test(r.from) && (r.to === null || DATE_RE.test(r.to))),
    order: typeof h!.order === 'number' ? h!.order : i,
    createdAt: typeof h!.createdAt === 'string' ? h!.createdAt : now(),
    updatedAt: typeof h!.updatedAt === 'string' ? h!.updatedAt : now(),
  }
}

function checkLog(raw: unknown, ids: Set<string>): Log {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Einträge fehlen')
  const out: Log = {}
  for (const [id, days] of Object.entries(raw as Record<string, unknown>)) {
    if (!ids.has(id) || !days || typeof days !== 'object') continue
    const clean: Record<string, number> = {}
    for (const [d, v] of Object.entries(days as Record<string, unknown>)) {
      if (DATE_RE.test(d) && typeof v === 'number' && Number.isFinite(v)) clean[d] = v
    }
    if (Object.keys(clean).length) out[id] = clean
  }
  return out
}

// Alles oder nichts: scheitert ein Schluessel (Speicher voll), wird der
// vorherige Stand zurueckgeschrieben - wie bei Kontor.
export function importSnapshot(data: unknown) {
  if (!data || typeof data !== 'object') throw new Error('Ungültige Datei')
  const d = data as Record<string, unknown>
  if (!Array.isArray(d.habits)) throw new Error('Datei enthält keine Steady-Daten')
  const habits = d.habits.map(checkHabit)
  const log = checkLog(d.log ?? {}, new Set(habits.map((h) => h.id)))
  const s = d.settings && typeof d.settings === 'object' ? (d.settings as Partial<Settings>) : {}
  const settings: Settings = {
    dayStart: typeof s.dayStart === 'number' && s.dayStart >= 0 && s.dayStart <= 6 ? s.dayStart : DEFAULT_SETTINGS.dayStart,
    statsKind: s.statsKind === 'week' || s.statsKind === 'year' ? s.statsKind : 'month',
  }
  const next: Record<string, unknown> = { [KEY_HABITS]: habits, [KEY_LOG]: log, [KEY_SETTINGS]: settings }

  const before = new Map(KEYS.map((k) => [k, localStorage.getItem(PREFIX + k)]))
  const written: string[] = []
  try {
    for (const k of KEYS) {
      localStorage.setItem(PREFIX + k, JSON.stringify(next[k]))
      written.push(k)
    }
  } catch {
    for (const k of written) localStorage.removeItem(PREFIX + k)
    for (const k of written) {
      const old = before.get(k)
      if (old !== null && old !== undefined) localStorage.setItem(PREFIX + k, old)
    }
    throw new Error('Nicht genug Speicherplatz – es wurde nichts geändert')
  }
  try {
    localStorage.removeItem(ENTWURF_KEY)
  } catch {
    // egal
  }
}

export async function importFile(file: File) {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Die Datei ist keine JSON-Datei')
  }
  importSnapshot(data)
}

export function clearAll() {
  try {
    for (const k of KEYS) localStorage.removeItem(PREFIX + k)
    localStorage.removeItem(ENTWURF_KEY)
  } catch {
    // nichts zu tun
  }
}
