/*
 * Speicher von Form: ein localStorage-Schluessel pro Bereich mit dem Praefix
 * der App-ID, so erfasst das Launcher-Backup alles. Gelesenes wird geprueft
 * und notfalls verworfen (normalisiere* - getestet in store.test.ts).
 *
 *   form:werte   Wert[]                         was verfolgt wird, in Anlege-Reihenfolge
 *   form:log     { [wertId]: { [tag]: zahl } }  die Eintraege
 */
import { istTag, rund } from './util'
import type { Log, Richtung, Wert, WertLog } from './types'

export const APP_ID = 'form'
export const NAME_MAX = 40
export const EINHEIT_MAX = 8

export function lies(key: string): unknown {
  try {
    const raw = localStorage.getItem(`${APP_ID}:${key}`)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function schreibe(key: string, value: unknown) {
  try {
    localStorage.setItem(`${APP_ID}:${key}`, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

export const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
export const zahl = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x)
const RICHTUNGEN: Richtung[] = ['mehr', 'weniger', 'egal']

/** Namen und Einheiten sind immer eine Zeile ohne doppelte Leerzeichen. */
export const sauber = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max).trim()

// ---------- Werte ----------

/** Nur gueltige Werte, jede id einmal, in Anlege-Reihenfolge. */
export function normalisiereWerte(raw: unknown): Wert[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Wert[] = []
  for (const x of raw) {
    const w = obj(x)
    if (typeof w.id !== 'string' || !w.id || ids.has(w.id)) continue
    const name = typeof w.name === 'string' ? sauber(w.name, NAME_MAX) : ''
    if (!name) continue
    ids.add(w.id)
    out.push({
      id: w.id,
      name,
      einheit: typeof w.einheit === 'string' ? sauber(w.einheit, EINHEIT_MAX) : '',
      richtung: RICHTUNGEN.includes(w.richtung as Richtung) ? (w.richtung as Richtung) : 'egal',
      ziel: zahl(w.ziel) ? rund(w.ziel) : null,
      erstellt: zahl(w.erstellt) && w.erstellt > 0 ? w.erstellt : 0,
    })
  }
  // Stabil sortiert: gleiche Zeitpunkte behalten ihre Reihenfolge.
  return out.sort((a, b) => a.erstellt - b.erstellt)
}

export const getWerte = () => normalisiereWerte(lies('werte'))

export const neueId = (jetzt: number) =>
  globalThis.crypto?.randomUUID?.() ?? `${jetzt.toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export interface WertEingabe {
  name: string
  einheit: string
  richtung: Richtung
  ziel: number | null
}

/** Legt einen Wert an (ohne id) oder aendert ihn. null, wenn der Name fehlt. */
export function speichereWert(eingabe: WertEingabe, id?: string, jetzt = Date.now()): Wert | null {
  const name = sauber(eingabe.name, NAME_MAX)
  if (!name) return null
  const werte = getWerte()
  const alt = id ? werte.find((w) => w.id === id) : undefined
  const wert: Wert = {
    id: alt?.id ?? neueId(jetzt),
    name,
    einheit: sauber(eingabe.einheit, EINHEIT_MAX),
    richtung: eingabe.richtung,
    ziel: eingabe.ziel === null ? null : rund(eingabe.ziel),
    erstellt: alt?.erstellt ?? jetzt,
  }
  schreibe('werte', alt ? werte.map((w) => (w.id === alt.id ? wert : w)) : [...werte, wert])
  return wert
}

/** Loescht einen Wert mit allen Eintraegen. */
export function loescheWert(id: string) {
  schreibe('werte', getWerte().filter((w) => w.id !== id))
  const log = getLog()
  if (log[id]) {
    delete log[id]
    schreibe('log', log)
  }
}

// ---------- Eintraege ----------

/** Nur gueltige Tage mit endlichen Zahlen; leere Werte fallen weg. */
export function normalisiereLog(raw: unknown): Log {
  const out: Log = {}
  for (const [id, eintraege] of Object.entries(obj(raw))) {
    const wl: WertLog = {}
    for (const [tag, z] of Object.entries(obj(eintraege))) {
      if (istTag(tag) && zahl(z)) wl[tag] = rund(z)
    }
    if (Object.keys(wl).length) out[id] = wl
  }
  return out
}

export const getLog = () => normalisiereLog(lies('log'))

/**
 * Traegt eine Messung ein: pro Wert eine Zahl oder null (Eintrag entfernen).
 * Werte, die nicht vorkommen, bleiben unberuehrt. Gibt zurueck, wie viele
 * Eintraege sich wirklich geaendert haben.
 */
export function setzeMessung(tag: string, zahlen: Record<string, number | null>): number {
  const log = getLog()
  let geaendert = 0
  for (const [id, z] of Object.entries(zahlen)) {
    const vorher = log[id]?.[tag]
    if (z === null) {
      if (vorher === undefined) continue
      delete log[id][tag]
      if (!Object.keys(log[id]).length) delete log[id]
    } else {
      const r = rund(z)
      if (vorher === r) continue
      log[id] = { ...log[id], [tag]: r }
    }
    geaendert += 1
  }
  if (geaendert) schreibe('log', log)
  return geaendert
}
