/*
 * Speicher von Punch: ein localStorage-Schluessel pro Bereich mit dem Praefix
 * der App-ID, so erfasst das Launcher-Backup alles. Gelesenes wird geprueft
 * und notfalls verworfen (normalisiere* - getestet in store.test.ts).
 *
 *   punch:bereiche  Bereich[]   Reihenfolge = Knoepfe, darin die Taetigkeiten
 *   punch:bloecke   Block[]     nach start sortiert
 *   punch:laeuft    Laeuft      nur solange ein Timer laeuft
 *
 * Der laufende Block liegt getrennt: nur er aendert sich beim Starten, die
 * grosse Liste wird erst beim Stoppen geschrieben.
 */
import { FARBEN } from './farben'
import { KURZ_MS, pruefeBlock, pruefeStart, type Fehler } from './zeit'
import type { Bereich, Block, Laeuft, Taetigkeit } from './types'

export const APP_ID = 'punch'
export const NAME_MAX = 30
export const NOTIZ_MAX = 200

function lies(key: string): unknown {
  try {
    const raw = localStorage.getItem(`${APP_ID}:${key}`)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function roh(key: string): string | null {
  try {
    return localStorage.getItem(`${APP_ID}:${key}`)
  } catch {
    return null
  }
}

function schreibeRoh(key: string, raw: string | null) {
  try {
    if (raw === null) localStorage.removeItem(`${APP_ID}:${key}`)
    else localStorage.setItem(`${APP_ID}:${key}`, raw)
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

const schreibe = (key: string, value: unknown) => schreibeRoh(key, value === null ? null : JSON.stringify(value))

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
const zeit = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0

/** Eine Zeile ohne doppelte Leerzeichen. */
const zeile = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max)
export const saubererName = (s: string) => zeile(s, NAME_MAX)
export const saubereNotiz = (s: string) => zeile(s, NOTIZ_MAX)

// Kurze ids statt UUIDs: ein Block steht tausendfach im Speicher, und alle Apps
// teilen sich 5 MB (ROADMAP, IndexedDB). Zeit plus Zufall reicht auf einem Geraet.
let zuletztId = ''
const neueId = () => {
  let id = ''
  do id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  while (id === zuletztId)
  zuletztId = id
  return id
}

const gleich = (a: string, b: string) => a.toLocaleLowerCase('de') === b.toLocaleLowerCase('de')

// ---------- Lesen ----------

export function normalisiereBereiche(raw: unknown): Bereich[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Bereich[] = []
  for (const x of raw) {
    const b = obj(x)
    const name = typeof b.name === 'string' ? saubererName(b.name) : ''
    if (typeof b.id !== 'string' || !b.id || ids.has(b.id) || !name || out.some((o) => gleich(o.name, name))) continue
    ids.add(b.id)
    const tids = new Set<string>()
    const taetigkeiten: Taetigkeit[] = []
    for (const y of Array.isArray(b.taetigkeiten) ? b.taetigkeiten : []) {
      const t = obj(y)
      const tname = typeof t.name === 'string' ? saubererName(t.name) : ''
      if (typeof t.id !== 'string' || !t.id || tids.has(t.id) || !tname || taetigkeiten.some((o) => gleich(o.name, tname))) continue
      tids.add(t.id)
      taetigkeiten.push({ id: t.id, name: tname, archiviert: t.archiviert === true, zuletzt: zeit(t.zuletzt) ? t.zuletzt : null })
    }
    const f = b.farbe
    out.push({
      id: b.id,
      name,
      farbe: typeof f === 'number' && Number.isInteger(f) && f >= 0 && f < FARBEN.length ? f : 0,
      archiviert: b.archiviert === true,
      taetigkeiten,
    })
  }
  return out
}

export function normalisiereBloecke(raw: unknown): Block[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Block[] = []
  for (const x of raw) {
    const b = obj(x)
    if (typeof b.id !== 'string' || !b.id || ids.has(b.id) || typeof b.bereich !== 'string' || !b.bereich) continue
    if (!zeit(b.start) || !zeit(b.ende) || b.ende <= b.start) continue
    ids.add(b.id)
    out.push({
      id: b.id,
      bereich: b.bereich,
      taetigkeit: typeof b.taetigkeit === 'string' && b.taetigkeit ? b.taetigkeit : null,
      notiz: typeof b.notiz === 'string' ? saubereNotiz(b.notiz) : '',
      start: b.start,
      ende: b.ende,
    })
  }
  return out.sort((a, b) => a.start - b.start)
}

export function normalisiereLaeuft(raw: unknown): Laeuft | null {
  const l = obj(raw)
  if (typeof l.bereich !== 'string' || !l.bereich || !zeit(l.start)) return null
  return {
    bereich: l.bereich,
    taetigkeit: typeof l.taetigkeit === 'string' && l.taetigkeit ? l.taetigkeit : null,
    notiz: typeof l.notiz === 'string' ? saubereNotiz(l.notiz) : '',
    start: l.start,
  }
}

export const getBereiche = () => normalisiereBereiche(lies('bereiche'))
export const getBloecke = () => normalisiereBloecke(lies('bloecke'))
export const getLaeuft = () => normalisiereLaeuft(lies('laeuft'))

const setBloecke = (b: Block[]) => schreibe('bloecke', [...b].sort((x, y) => x.start - y.start))

// ---------- Rueckgaengig ----------

/** Stand von Bloecken und Timer, um eine Aktion zurueckzunehmen (Toast „Rückgängig“). */
export interface Schnappschuss {
  bloecke: string | null
  laeuft: string | null
}

export const schnappschuss = (): Schnappschuss => ({ bloecke: roh('bloecke'), laeuft: roh('laeuft') })

export function stelleHer(s: Schnappschuss) {
  schreibeRoh('bloecke', s.bloecke)
  schreibeRoh('laeuft', s.laeuft)
}

// ---------- Timer ----------

function merkeZuletzt(bereich: string, taetigkeit: string | null, jetzt: number) {
  if (!taetigkeit) return
  schreibe(
    'bereiche',
    getBereiche().map((b) => (b.id !== bereich ? b : { ...b, taetigkeiten: b.taetigkeiten.map((t) => (t.id === taetigkeit ? { ...t, zuletzt: jetzt } : t)) })),
  )
}

/** Beendet den laufenden Block. Unter einer Minute wird nichts gespeichert (null). */
function beende(l: Laeuft, jetzt: number): Block | null {
  schreibe('laeuft', null)
  if (jetzt - l.start < KURZ_MS) return null
  const block: Block = { id: neueId(), ...l, ende: jetzt }
  setBloecke([...getBloecke(), block])
  return block
}

export interface Gestoppt {
  /** was lief */
  war: Laeuft
  /** der gespeicherte Block, null = unter einer Minute, verworfen */
  block: Block | null
}

/** Startet einen Bereich. Laeuft schon einer, endet er in derselben Sekunde. */
export function starte(bereich: string, taetigkeit: string | null, jetzt = Date.now()): Gestoppt | null {
  const l = getLaeuft()
  const gestoppt = l ? { war: l, block: beende(l, jetzt) } : null
  schreibe('laeuft', { bereich, taetigkeit, notiz: '', start: jetzt } satisfies Laeuft)
  merkeZuletzt(bereich, taetigkeit, jetzt)
  return gestoppt
}

export function stoppe(jetzt = Date.now()): Gestoppt | null {
  const l = getLaeuft()
  return l ? { war: l, block: beende(l, jetzt) } : null
}

// ---------- Bloecke ----------

export interface Eingabe {
  bereich: string
  taetigkeit: string | null
  notiz: string
  start: number
  ende: number
}

/** Sichert einen neuen (id null) oder geaenderten Block. Zurueck kommt der Fehler, sonst null. */
export function speichereBlock(e: Eingabe, id: string | null, jetzt = Date.now()): Fehler | null {
  const bloecke = getBloecke()
  if (!getBereiche().some((b) => b.id === e.bereich)) return { art: 'text', text: 'Bereich fehlt' }
  const f = pruefeBlock(bloecke, getLaeuft(), e.start, e.ende, id, jetzt)
  if (f) return f
  const block: Block = { id: id ?? neueId(), bereich: e.bereich, taetigkeit: e.taetigkeit, notiz: saubereNotiz(e.notiz), start: e.start, ende: e.ende }
  setBloecke(id ? bloecke.map((b) => (b.id === id ? block : b)) : [...bloecke, block])
  merkeZuletzt(e.bereich, e.taetigkeit, jetzt)
  return null
}

/** Aendert den laufenden Block: Bereich, Taetigkeit, Notiz oder seinen Start. */
export function aendereLaeuft(e: Omit<Eingabe, 'ende'>, jetzt = Date.now()): Fehler | null {
  if (!getLaeuft()) return { art: 'text', text: 'Es läuft nichts mehr' }
  if (!getBereiche().some((b) => b.id === e.bereich)) return { art: 'text', text: 'Bereich fehlt' }
  const f = pruefeStart(getBloecke(), e.start, jetzt)
  if (f) return f
  schreibe('laeuft', { bereich: e.bereich, taetigkeit: e.taetigkeit, notiz: saubereNotiz(e.notiz), start: e.start } satisfies Laeuft)
  merkeZuletzt(e.bereich, e.taetigkeit, jetzt)
  return null
}

export function loescheBlock(id: string) {
  setBloecke(getBloecke().filter((b) => b.id !== id))
}

/** Bereiche und Taetigkeiten, auf die ein Block oder der Timer zeigt - die lassen sich nur archivieren. */
export function belegt(): { bereiche: Set<string>; taetigkeiten: Set<string> } {
  const bereiche = new Set<string>()
  const taetigkeiten = new Set<string>()
  const l = getLaeuft()
  for (const b of l ? [...getBloecke(), l] : getBloecke()) {
    bereiche.add(b.bereich)
    if (b.taetigkeit) taetigkeiten.add(b.taetigkeit)
  }
  return { bereiche, taetigkeiten }
}

// ---------- Bereiche ----------

/** Fehlertext fuer einen Namen, sonst null. */
export function pruefeName(name: string, andere: { id: string; name: string }[], ohne: string | null): string | null {
  const n = saubererName(name)
  if (!n) return 'Name fehlt'
  if (andere.some((o) => o.id !== ohne && gleich(o.name, n))) return 'Gibt es schon'
  return null
}

/** Die erste Farbe, die noch kein Bereich hat. */
export function naechsteFarbe(bereiche: Bereich[]): number {
  const frei = FARBEN.findIndex((_, i) => !bereiche.some((b) => b.farbe === i))
  return frei < 0 ? bereiche.length % FARBEN.length : frei
}

export function bereichAnlegen(name: string, farbe: number): Bereich | null {
  const alle = getBereiche()
  if (pruefeName(name, alle, null)) return null
  const b: Bereich = { id: neueId(), name: saubererName(name), farbe, archiviert: false, taetigkeiten: [] }
  // Neue vor die archivierten, ans Ende der aktiven.
  schreibe('bereiche', [...alle.filter((x) => !x.archiviert), b, ...alle.filter((x) => x.archiviert)])
  return b
}

export function bereichAendern(id: string, a: { name?: string; farbe?: number; archiviert?: boolean }): boolean {
  const alle = getBereiche()
  if (a.name !== undefined && pruefeName(a.name, alle, id)) return false
  schreibe(
    'bereiche',
    alle.map((b) =>
      b.id !== id
        ? b
        : {
            ...b,
            name: a.name !== undefined ? saubererName(a.name) : b.name,
            farbe: a.farbe ?? b.farbe,
            archiviert: a.archiviert ?? b.archiviert,
          },
    ),
  )
  return true
}

/** Nur ein Bereich ohne Bloecke laesst sich loeschen, sonst archivieren. */
export function bereichLoeschen(id: string): boolean {
  if (belegt().bereiche.has(id)) return false
  schreibe('bereiche', getBereiche().filter((b) => b.id !== id))
  return true
}

/** Neue Reihenfolge der aktiven Bereiche; archivierte bleiben dahinter. */
export function bereicheSortieren(ids: string[]) {
  const alle = getBereiche()
  const rang = new Map(ids.map((id, i) => [id, i]))
  const aktiv = alle.filter((b) => !b.archiviert).sort((a, b) => (rang.get(a.id) ?? 1e9) - (rang.get(b.id) ?? 1e9))
  schreibe('bereiche', [...aktiv, ...alle.filter((b) => b.archiviert)])
}

// ---------- Taetigkeiten ----------

const aendereTaetigkeiten = (bereich: string, fn: (t: Taetigkeit[]) => Taetigkeit[]) =>
  schreibe(
    'bereiche',
    getBereiche().map((b) => (b.id === bereich ? { ...b, taetigkeiten: fn(b.taetigkeiten) } : b)),
  )

/** Legt eine Taetigkeit an. Gibt es den Namen schon (auch archiviert), kommt diese zurueck - wieder aktiv. */
export function taetigkeitAnlegen(bereich: string, name: string): string | null {
  const b = getBereiche().find((x) => x.id === bereich)
  const n = saubererName(name)
  if (!b || !n) return null
  const da = b.taetigkeiten.find((t) => gleich(t.name, n))
  if (da) {
    if (da.archiviert) aendereTaetigkeiten(bereich, (ts) => ts.map((t) => (t.id === da.id ? { ...t, archiviert: false } : t)))
    return da.id
  }
  const t: Taetigkeit = { id: neueId(), name: n, archiviert: false, zuletzt: null }
  aendereTaetigkeiten(bereich, (ts) => [...ts, t])
  return t.id
}

export function taetigkeitAendern(bereich: string, id: string, a: { name?: string; archiviert?: boolean }): boolean {
  const b = getBereiche().find((x) => x.id === bereich)
  if (!b) return false
  if (a.name !== undefined && pruefeName(a.name, b.taetigkeiten, id)) return false
  aendereTaetigkeiten(bereich, (ts) =>
    ts.map((t) => (t.id !== id ? t : { ...t, name: a.name !== undefined ? saubererName(a.name) : t.name, archiviert: a.archiviert ?? t.archiviert })),
  )
  return true
}

export function taetigkeitLoeschen(bereich: string, id: string): boolean {
  if (belegt().taetigkeiten.has(id)) return false
  aendereTaetigkeiten(bereich, (ts) => ts.filter((t) => t.id !== id))
  return true
}

/** Fuer die Auswahl: aktive Taetigkeiten, zuletzt genutzte zuerst. */
export const auswahl = (b: Bereich) =>
  b.taetigkeiten.filter((t) => !t.archiviert).sort((x, y) => (y.zuletzt ?? 0) - (x.zuletzt ?? 0) || b.taetigkeiten.indexOf(x) - b.taetigkeiten.indexOf(y))
