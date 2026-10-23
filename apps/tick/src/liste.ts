// Was in welcher Ansicht steht und in welcher Reihenfolge - reine Funktionen
// ueber den gespeicherten Listen, getestet in liste.test.ts. Regeln: konzept.md.

import type { Ordner, Todo } from './types'

/** Der Ordner, in dem ein Todo steht: null = Eingang (auch, wenn sein Ordner geloescht ist). */
export const ordnerVon = (t: Todo, ids: ReadonlySet<string>) => (t.ordner !== null && ids.has(t.ordner) ? t.ordner : null)

export const ordnerIds = (ordner: Ordner[]) => new Set(ordner.map((o) => o.id))

export const istOffen = (t: Todo) => t.erledigt === null

/** Heute faellig oder ueberfaellig. */
export const istFaellig = (t: Todo, heute: string) => istOffen(t) && t.faellig !== null && t.faellig <= heute

/** Reihenfolge innerhalb eines Ordners. */
export const nachRang = (a: Todo, b: Todo) => a.rang - b.rang || a.angelegt - b.angelegt

/** Offene Todos eines Ordners (null = Eingang) in ihrer Reihenfolge. */
export function imOrdner(todos: Todo[], ordner: string | null, ids: ReadonlySet<string>): Todo[] {
  return todos.filter((t) => istOffen(t) && ordnerVon(t, ids) === ordner).sort(nachRang)
}

export interface Abschnitt {
  ordner: string | null
  todos: Todo[]
}

/**
 * „Alle“: oben das Faellige aus allen Ordnern (aeltestes Datum zuerst), darunter
 * ein Abschnitt pro Ordner, der Eingang zuerst. Was oben steht, steht nicht noch
 * einmal im Abschnitt, leere Abschnitte fehlen.
 */
export function alleAbschnitte(todos: Todo[], ordner: Ordner[], heute: string): { faellig: Todo[]; abschnitte: Abschnitt[] } {
  const ids = ordnerIds(ordner)
  const lage = new Map<string | null, number>([[null, -1], ...ordner.map((o, i) => [o.id, i] as const)])
  const pos = (t: Todo) => lage.get(ordnerVon(t, ids)) ?? -1
  const faellig = todos
    .filter((t) => istFaellig(t, heute))
    .sort((a, b) => a.faellig!.localeCompare(b.faellig!) || pos(a) - pos(b) || nachRang(a, b))
  const oben = new Set(faellig.map((t) => t.id))
  const abschnitte = [null, ...ordner.map((o) => o.id)]
    .map((k) => ({ ordner: k, todos: imOrdner(todos, k, ids).filter((t) => !oben.has(t.id)) }))
    .filter((a) => a.todos.length > 0)
  return { faellig, abschnitte }
}

/** Erledigtes einer Ansicht ('alle' oder ein Ordner, null = Eingang), neueste zuerst. */
export function erledigteIn(todos: Todo[], ansicht: string | null, ids: ReadonlySet<string>): Todo[] {
  return todos
    .filter((t) => t.erledigt !== null && (ansicht === 'alle' || ordnerVon(t, ids) === ansicht))
    .sort((a, b) => b.erledigt! - a.erledigt!)
}

/** Nach Tagen gruppieren - die Liste kommt schon sortiert, Gleiches steht hintereinander. */
export function nachTagen(todos: Todo[], titel: (ms: number) => string): { titel: string; todos: Todo[] }[] {
  const out: { titel: string; todos: Todo[] }[] = []
  for (const t of todos) {
    const k = titel(t.erledigt ?? t.angelegt)
    if (out.length && out[out.length - 1].titel === k) out[out.length - 1].todos.push(t)
    else out.push({ titel: k, todos: [t] })
  }
  return out
}

export interface Zaehlung {
  alle: number
  eingang: number
  je: Map<string, number>
  /** heute faellig oder ueberfaellig - insgesamt, im Eingang, je Ordner */
  faellig: number
  faelligEingang: number
  faelligJe: Map<string, number>
}

/** Offene Todos je Reiter, dazu wie viele heute faellig oder ueberfaellig sind. */
export function zaehle(todos: Todo[], ordner: Ordner[], heute: string): Zaehlung {
  const ids = ordnerIds(ordner)
  const je = new Map(ordner.map((o) => [o.id, 0]))
  const faelligJe = new Map(ordner.map((o) => [o.id, 0]))
  let alle = 0
  let eingang = 0
  let faellig = 0
  let faelligEingang = 0
  for (const t of todos) {
    if (!istOffen(t)) continue
    alle++
    const f = istFaellig(t, heute)
    if (f) faellig++
    const o = ordnerVon(t, ids)
    if (o === null) {
      eingang++
      if (f) faelligEingang++
    } else {
      je.set(o, (je.get(o) ?? 0) + 1)
      if (f) faelligJe.set(o, (faelligJe.get(o) ?? 0) + 1)
    }
  }
  return { alle, eingang, je, faellig, faelligEingang, faelligJe }
}

/** Zahl fuer die Plakette an der Kachel - dieselbe Rechnung steht in apps.js (tickBadge). */
export const plakette = (todos: Todo[], heute: string) => todos.filter((t) => istFaellig(t, heute)).length

// ---------- Suche ----------

const maske = (q: string) => q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const muster = (q: string) => new RegExp(maske(q.trim()), 'giu')

/** Text in Stuecke mit und ohne Treffer, zum Hervorheben. */
export function teile(text: string, q: string): { text: string; treffer: boolean }[] {
  if (!q.trim()) return [{ text, treffer: false }]
  const out: { text: string; treffer: boolean }[] = []
  let ab = 0
  for (const m of text.matchAll(muster(q))) {
    if (m.index > ab) out.push({ text: text.slice(ab, m.index), treffer: false })
    out.push({ text: m[0], treffer: true })
    ab = m.index + m[0].length
  }
  if (ab < text.length) out.push({ text: text.slice(ab), treffer: false })
  return out
}

export const enthaelt = (text: string, q: string) => q.trim() !== '' && muster(q).test(text)

/** Sucht in Titel und Notiz. Treffer im Titel zuerst, sonst neueste zuerst. */
export function suche(todos: Todo[], q: string): { offen: Todo[]; erledigt: Todo[] } {
  if (!q.trim()) return { offen: [], erledigt: [] }
  const treffer = todos.filter((t) => enthaelt(t.titel, q) || enthaelt(t.notiz, q))
  const imTitel = (t: Todo) => (enthaelt(t.titel, q) ? 0 : 1)
  return {
    offen: treffer.filter(istOffen).sort((a, b) => imTitel(a) - imTitel(b) || b.angelegt - a.angelegt),
    erledigt: treffer.filter((t) => !istOffen(t)).sort((a, b) => imTitel(a) - imTitel(b) || b.erledigt! - a.erledigt!),
  }
}

/** Ein Stueck Notiz rund um den ersten Treffer, an Wortgrenzen, mit „…“ wo gekuerzt. */
export function ausschnitt(text: string, q: string, breite = 32): string {
  const flach = text.replace(/\s+/g, ' ').trim()
  const m = muster(q).exec(flach)
  if (!m) return flach.slice(0, breite * 2)
  let von = Math.max(0, m.index - breite)
  let bis = Math.min(flach.length, m.index + m[0].length + breite * 2)
  if (von > 0) {
    const leer = flach.indexOf(' ', von)
    von = leer >= 0 && leer < m.index ? leer + 1 : von
  }
  if (bis < flach.length) {
    const leer = flach.lastIndexOf(' ', bis)
    bis = leer > m.index + m[0].length ? leer : bis
  }
  return `${von > 0 ? '… ' : ''}${flach.slice(von, bis)}${bis < flach.length ? ' …' : ''}`
}

// ---------- # im Titel ----------

export interface Hash {
  /** Stelle des # im Titel */
  start: number
  /** Was hinter dem # steht */
  suche: string
}

/** Ein #wort ganz am Ende des Titels (dort, wo man gerade tippt). */
export function findeHash(titel: string): Hash | null {
  const m = /(^|\s)#([^\s#]*)$/u.exec(titel)
  return m ? { start: m.index + m[1].length, suche: m[2] } : null
}

/** Passende Ordner, die mit dem Getippten beginnen zuerst, hoechstens vier. */
export function hashVorschlaege(ordner: Ordner[], suche: string, max = 4): Ordner[] {
  const q = suche.toLocaleLowerCase('de')
  const name = (o: Ordner) => o.name.toLocaleLowerCase('de')
  return ordner
    .filter((o) => name(o).includes(q))
    .sort((a, b) => Number(name(b).startsWith(q)) - Number(name(a).startsWith(q)))
    .slice(0, max)
}

/** Titel ohne das #wort am Ende. */
export const ohneHash = (titel: string, h: Hash) => titel.slice(0, h.start).trimEnd()
