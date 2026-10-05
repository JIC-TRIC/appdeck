/*
 * Speicher von Stash: ein localStorage-Schluessel pro Bereich mit dem Praefix
 * der App-ID, so erfasst das Launcher-Backup alles. Gelesenes wird geprueft
 * und notfalls verworfen (normalisiere* - getestet in store.test.ts).
 *
 *   stash:notizen   Notiz[]          der Stapel, aelteste zuerst
 *   stash:entwurf   { titel, text }  was gerade im Formular steht
 *   stash:titel     string[]         zuletzt benutzte Titel, neuester zuerst
 *   stash:geleert   { am, notizen }  der zuletzt geleerte Stapel, bis zum naechsten Leeren
 */
import { merkeTitel, TITEL_MAX } from './text'
import type { Entwurf, Geleert, Notiz } from './types'

export const APP_ID = 'stash'

export const LEER: Entwurf = { titel: '', text: '' }

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

function entferne(key: string) {
  try {
    localStorage.removeItem(`${APP_ID}:${key}`)
  } catch {
    // nichts zu tun
  }
}

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
const zeit = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x > 0

/** Titel sind immer eine Zeile ohne doppelte Leerzeichen. */
export const saubererTitel = (s: string) => s.replace(/\s+/g, ' ').trim()

// ---------- Notizen ----------

/** Nur gueltige Notizen, jede id einmal, aelteste zuerst. */
export function normalisiereNotizen(raw: unknown): Notiz[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Notiz[] = []
  for (const x of raw) {
    const n = obj(x)
    if (typeof n.id !== 'string' || !n.id || ids.has(n.id) || !zeit(n.erstellt)) continue
    const titel = typeof n.titel === 'string' ? saubererTitel(n.titel) : ''
    const text = typeof n.text === 'string' ? n.text.trim() : ''
    if (!titel && !text) continue
    ids.add(n.id)
    out.push({ id: n.id, titel, text, erstellt: n.erstellt })
  }
  return out.sort((a, b) => a.erstellt - b.erstellt)
}

export const getNotizen = () => normalisiereNotizen(lies('notizen'))

const neueId = (jetzt: number) =>
  globalThis.crypto?.randomUUID?.() ?? `${jetzt.toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/**
 * Legt den Entwurf als Notiz auf den Stapel, merkt sich den Titel als
 * Vorschlag und leert das Formular. null, wenn nichts drinsteht.
 */
export function ablegen(entwurf: Entwurf, jetzt = Date.now()): Notiz | null {
  const titel = saubererTitel(entwurf.titel)
  const text = entwurf.text.trim()
  if (!titel && !text) return null
  const notiz: Notiz = { id: neueId(jetzt), titel, text, erstellt: jetzt }
  schreibe('notizen', [...getNotizen(), notiz])
  if (titel) schreibe('titel', merkeTitel(getTitel(), titel))
  entferne('entwurf')
  return notiz
}

// ---------- Leeren und zurueckholen ----------

export function normalisiereGeleert(raw: unknown): Geleert | null {
  const r = obj(raw)
  const notizen = normalisiereNotizen(r.notizen)
  return zeit(r.am) && notizen.length ? { am: r.am, notizen } : null
}

export const getGeleert = () => normalisiereGeleert(lies('geleert'))

/** Leert den Stapel. Der alte Stand bleibt bis zum naechsten Leeren zum Zurueckholen. */
export function leeren(jetzt = Date.now()) {
  const notizen = getNotizen()
  if (!notizen.length) return
  schreibe('geleert', { am: jetzt, notizen })
  schreibe('notizen', [])
}

/** Holt den zuletzt geleerten Stapel zurueck - zu dem, was seitdem dazukam. */
export function zurueckholen() {
  const g = getGeleert()
  if (!g) return
  schreibe('notizen', normalisiereNotizen([...g.notizen, ...getNotizen()]))
  entferne('geleert')
}

// ---------- Titel-Vorschlaege ----------

export function normalisiereTitel(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  let out: string[] = []
  // Von hinten nach vorn, damit der neueste (vorn) bei Doppelten gewinnt.
  for (const t of [...raw].reverse()) {
    if (typeof t === 'string' && saubererTitel(t)) out = merkeTitel(out, t)
  }
  return out.slice(0, TITEL_MAX)
}

export const getTitel = () => normalisiereTitel(lies('titel'))

// ---------- Entwurf ----------

export function normalisiereEntwurf(raw: unknown): Entwurf {
  const r = obj(raw)
  return {
    titel: typeof r.titel === 'string' ? r.titel : '',
    text: typeof r.text === 'string' ? r.text : '',
  }
}

export const getEntwurf = () => normalisiereEntwurf(lies('entwurf'))

export function speichereEntwurf(e: Entwurf) {
  if (e.titel || e.text) schreibe('entwurf', e)
  else entferne('entwurf')
}
