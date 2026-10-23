/*
 * Speicher von Tick: ein localStorage-Schluessel pro Bereich mit dem Praefix
 * der App-ID, so erfasst das Launcher-Backup alles. Gelesenes wird geprueft
 * und notfalls verworfen (normalisiere* - getestet in store.test.ts).
 *
 *   tick:todos     Todo[]                       alle Todos, offen und erledigt
 *   tick:ordner    Ordner[]                     nach rang
 *   tick:entwurf   { titel, ordner, faellig }   was gerade im Schnellfeld steht
 *   tick:reiter    'alle' | 'eingang' | id      der zuletzt offene Reiter
 *
 * Die Plakette im Launcher liest tick:todos selbst (tickBadge in apps.js).
 */
import { FARBEN } from './farben'
import { imOrdner, ordnerIds, ordnerVon } from './liste'
import { istTag } from './tage'
import type { Entwurf, Ordner, Reiter, Todo } from './types'

export const APP_ID = 'tick'
export const TITEL_MAX = 200
export const NOTIZ_MAX = 2000
export const NAME_MAX = 24

function lies(key: string): unknown {
  try {
    const raw = localStorage.getItem(`${APP_ID}:${key}`)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function schreibe(key: string, value: unknown) {
  try {
    localStorage.setItem(`${APP_ID}:${key}`, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
const zeit = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0
const zahl = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)

/** Eine Zeile ohne doppelte Leerzeichen. */
const zeile = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max)
export const saubererTitel = (s: string) => zeile(s, TITEL_MAX)
export const saubererName = (s: string) => zeile(s, NAME_MAX)

const neueId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

// ---------- Todos ----------

/** Nur gueltige Todos, jede id einmal. Die Reihenfolge im Speicher ist egal (rang zaehlt). */
export function normalisiereTodos(raw: unknown): Todo[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Todo[] = []
  raw.forEach((x, i) => {
    const t = obj(x)
    if (typeof t.id !== 'string' || !t.id || ids.has(t.id) || !zeit(t.angelegt)) return
    const titel = typeof t.titel === 'string' ? saubererTitel(t.titel) : ''
    if (!titel) return
    ids.add(t.id)
    out.push({
      id: t.id,
      titel,
      notiz: typeof t.notiz === 'string' ? t.notiz.trim().slice(0, NOTIZ_MAX) : '',
      ordner: typeof t.ordner === 'string' && t.ordner ? t.ordner : null,
      faellig: istTag(t.faellig) ? t.faellig : null,
      rang: zahl(t.rang) ? t.rang : i,
      angelegt: t.angelegt,
      erledigt: zeit(t.erledigt) ? t.erledigt : null,
    })
  })
  return out
}

export const getTodos = () => normalisiereTodos(lies('todos'))

const aendereTodos = (fn: (todos: Todo[]) => Todo[]) => schreibe('todos', fn(getTodos()))

/** Rang fuer ein neues Todo am Ende des Ordners. */
export const rangAmEnde = (todos: Todo[], ordner: string | null) =>
  todos.reduce((max, t) => (t.ordner === ordner ? Math.max(max, t.rang) : max), -1) + 1

/** Legt ein Todo ans Ende seines Ordners. null, wenn der Titel leer ist. */
export function anlegen(e: Entwurf, jetzt = Date.now()): Todo | null {
  const titel = saubererTitel(e.titel)
  if (!titel) return null
  const todos = getTodos()
  const ordner = e.ordner !== null && ordnerIds(getOrdner()).has(e.ordner) ? e.ordner : null
  const todo: Todo = {
    id: neueId(),
    titel,
    notiz: '',
    ordner,
    faellig: istTag(e.faellig) ? e.faellig : null,
    rang: rangAmEnde(todos, ordner),
    angelegt: jetzt,
    erledigt: null,
  }
  schreibe('todos', [...todos, todo])
  return todo
}

/** Abhaken oder wieder offen. Wieder offen behaelt den Rang, also den alten Platz. */
export function setzeErledigt(ids: string[], an: boolean, jetzt = Date.now()) {
  const welche = new Set(ids)
  aendereTodos((todos) => todos.map((t) => (welche.has(t.id) ? { ...t, erledigt: an ? (t.erledigt ?? jetzt) : null } : t)))
}

export type Aenderung = Partial<Pick<Todo, 'titel' | 'notiz' | 'ordner' | 'faellig'>>

/** Aendert ein Todo. Ein leerer Titel bleibt beim alten, ein neuer Ordner setzt ans Ende. */
export function aendere(id: string, a: Aenderung) {
  aendereTodos((todos) =>
    todos.map((t) => {
      if (t.id !== id) return t
      const neu = { ...t }
      if (a.titel !== undefined && saubererTitel(a.titel)) neu.titel = saubererTitel(a.titel)
      if (a.notiz !== undefined) neu.notiz = a.notiz.slice(0, NOTIZ_MAX)
      if (a.faellig !== undefined) neu.faellig = istTag(a.faellig) ? a.faellig : null
      if (a.ordner !== undefined && a.ordner !== t.ordner) {
        neu.ordner = a.ordner
        neu.rang = rangAmEnde(todos, a.ordner)
      }
      return neu
    }),
  )
}

/** Loescht ein Todo und gibt es zurueck (fuer „Rückgängig“). */
export function loesche(id: string): Todo | null {
  const todos = getTodos()
  const weg = todos.find((t) => t.id === id) ?? null
  if (weg) schreibe('todos', todos.filter((t) => t.id !== id))
  return weg
}

export function stelleWiederHer(todo: Todo) {
  aendereTodos((todos) => (todos.some((t) => t.id === todo.id) ? todos : [...todos, todo]))
}

/** Neue Reihenfolge der offenen Todos eines Ordners - die ids von oben nach unten. */
export function sortiere(ids: string[]) {
  const lage = new Map(ids.map((id, i) => [id, i]))
  aendereTodos((todos) => todos.map((t) => (lage.has(t.id) ? { ...t, rang: lage.get(t.id)! } : t)))
}

/** Loescht das Erledigte einer Ansicht ('alle' oder ein Ordner, null = Eingang). */
export function erledigteLoeschen(ansicht: string | null): number {
  const ids = ordnerIds(getOrdner())
  const todos = getTodos()
  const weg = (t: Todo) => t.erledigt !== null && (ansicht === 'alle' || ordnerVon(t, ids) === ansicht)
  const bleibt = todos.filter((t) => !weg(t))
  schreibe('todos', bleibt)
  return todos.length - bleibt.length
}

// ---------- Ordner ----------

/** Nur gueltige Ordner, id und Name (Gross/klein egal) je einmal, nach rang. */
export function normalisiereOrdner(raw: unknown): Ordner[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const namen = new Set<string>()
  const out: Ordner[] = []
  raw.forEach((x, i) => {
    const o = obj(x)
    if (typeof o.id !== 'string' || !o.id || o.id === 'alle' || o.id === 'eingang' || ids.has(o.id)) return
    const name = typeof o.name === 'string' ? saubererName(o.name) : ''
    const klein = name.toLocaleLowerCase('de')
    if (!name || namen.has(klein)) return
    ids.add(o.id)
    namen.add(klein)
    const f = o.farbe
    out.push({
      id: o.id,
      name,
      farbe: typeof f === 'number' && Number.isInteger(f) && f >= 0 && f < FARBEN.length ? f : out.length % FARBEN.length,
      rang: zahl(o.rang) ? o.rang : i,
    })
  })
  return out.sort((a, b) => a.rang - b.rang)
}

export const getOrdner = () => normalisiereOrdner(lies('ordner'))

/** Warum ein Name nicht geht - oder null. */
export function pruefeName(name: string, ordner: Ordner[], selbst?: string): string | null {
  const n = saubererName(name)
  const klein = n.toLocaleLowerCase('de')
  if (!n) return 'Der Ordner braucht einen Namen.'
  if (klein === 'alle' || klein === 'eingang') return `„${n}“ steht schon als Reiter oben.`
  if (ordner.some((o) => o.id !== selbst && o.name.toLocaleLowerCase('de') === klein)) return `„${n}“ gibt es schon.`
  return null
}

/** Die erste Farbe, die noch kein Ordner hat. */
export function naechsteFarbe(ordner: Ordner[]): number {
  const belegt = new Set(ordner.map((o) => o.farbe))
  for (let i = 0; i < FARBEN.length; i++) if (!belegt.has(i)) return i
  return ordner.length % FARBEN.length
}

export function ordnerAnlegen(name: string, farbe?: number): Ordner | null {
  const ordner = getOrdner()
  if (pruefeName(name, ordner)) return null
  const neu: Ordner = {
    id: neueId(),
    name: saubererName(name),
    farbe: farbe ?? naechsteFarbe(ordner),
    rang: ordner.reduce((max, o) => Math.max(max, o.rang), -1) + 1,
  }
  schreibe('ordner', [...ordner, neu])
  return neu
}

export function ordnerAendern(id: string, name: string, farbe: number): boolean {
  const ordner = getOrdner()
  if (pruefeName(name, ordner, id)) return false
  schreibe('ordner', ordner.map((o) => (o.id === id ? { ...o, name: saubererName(name), farbe } : o)))
  return true
}

/**
 * Loescht einen Ordner. Seine offenen Todos kommen ans Ende des Eingangs - oder
 * gehen mit (mitTodos). Erledigte gehen immer mit.
 */
export function ordnerLoeschen(id: string, mitTodos: boolean) {
  const ordner = getOrdner()
  const todos = getTodos()
  const offene = imOrdner(todos, id, ordnerIds(ordner))
  let rang = rangAmEnde(todos, null)
  const neuerRang = new Map(offene.map((t) => [t.id, rang++]))
  schreibe('ordner', ordner.filter((o) => o.id !== id))
  schreibe(
    'todos',
    todos.flatMap((t) => {
      if (t.ordner !== id) return [t]
      if (mitTodos || !neuerRang.has(t.id)) return []
      return [{ ...t, ordner: null, rang: neuerRang.get(t.id)! }]
    }),
  )
}

/** Neue Reihenfolge der Ordner - die ids von oben nach unten. */
export function ordnerSortieren(ids: string[]) {
  const lage = new Map(ids.map((id, i) => [id, i]))
  schreibe('ordner', getOrdner().map((o) => (lage.has(o.id) ? { ...o, rang: lage.get(o.id)! } : o)))
}

// ---------- Entwurf und Reiter ----------

export function normalisiereEntwurf(raw: unknown): Entwurf {
  const r = obj(raw)
  return {
    titel: typeof r.titel === 'string' ? r.titel.slice(0, TITEL_MAX) : '',
    ordner: typeof r.ordner === 'string' && r.ordner ? r.ordner : null,
    faellig: istTag(r.faellig) ? r.faellig : null,
  }
}

export const getEntwurf = () => normalisiereEntwurf(lies('entwurf'))
export const speichereEntwurf = (e: Entwurf) => schreibe('entwurf', e)

export const normalisiereReiter = (raw: unknown): Reiter => (typeof raw === 'string' && raw ? raw : 'alle')
export const getReiter = () => normalisiereReiter(lies('reiter'))
export const speichereReiter = (r: Reiter) => schreibe('reiter', r)
