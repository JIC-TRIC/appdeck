/*
 * Speicher der Piano-App. Wie jede App im Launcher ein localStorage-Schluessel
 * pro Liste mit dem Praefix der App-ID - so erfasst das Launcher-Backup alles,
 * und nichts kollidiert mit anderen Apps. Die Daten selbst liest und aendert
 * store.ts ueber readKey/writeKey.
 *
 * Vorher lebte die App im eigenen Repo piano-practice-tracker und speicherte
 * ohne Praefix (pianoPieces, practiceSessions, ...). Diese Namen bleiben das
 * Format der Exportdatei: alte Exporte lassen sich hier importieren und
 * umgekehrt.
 */
import { VERSION } from './version'

export const APP_ID = 'piano'
const PREFIX = `${APP_ID}:`

// Schluessel hier (piano:<name>) → Name in der alten App und in der Exportdatei
const LEGACY = {
  pieces: 'pianoPieces',
  sessions: 'practiceSessions',
  settings: 'pianoSettings',
  playlist: 'sessionPlaylist',
  setlists: 'pianoSetlists',
} as const

export type Key = keyof typeof LEGACY
const KEYS = Object.keys(LEGACY) as Key[]

/** Zu schreibende Werte, schon als JSON-Text - genau so, wie sie im Speicher liegen. */
export type Values = Partial<Record<Key, string>>

// Alles oder nichts: scheitert ein Schluessel (Speicher voll), kommt der
// vorherige Stand zurueck, statt dass ein halb ersetzter Bestand liegen bleibt.
function writeAll(values: Values) {
  const keys = KEYS.filter((k) => values[k] !== undefined)
  const before = new Map(keys.map((k) => [k, localStorage.getItem(PREFIX + k)]))
  const written: Key[] = []
  try {
    for (const k of keys) {
      localStorage.setItem(PREFIX + k, values[k]!)
      written.push(k)
    }
  } catch {
    // Erst entfernen (macht Platz), dann den alten Stand zurueckschreiben.
    for (const k of written) localStorage.removeItem(PREFIX + k)
    for (const k of written) {
      const old = before.get(k)
      if (old !== null && old !== undefined) localStorage.setItem(PREFIX + k, old)
    }
    throw new Error('Not enough storage space – nothing was changed.')
  }
}

// Einmalig die Daten der alten App uebernehmen - nur solange hier noch nichts
// gespeichert ist. Sie liegen im selben Speicher, wenn die alte App im selben
// Browser lief (gleiche Adresse jic-tric.github.io) oder ein Launcher-Backup
// von ihr eingespielt wurde. Die Texte werden unveraendert kopiert. Die alten
// Schluessel bleiben liegen: laeuft die alte App noch in Safari, arbeitet sie
// weiter mit ihnen.
export function migrateLegacy() {
  try {
    if (KEYS.some((k) => localStorage.getItem(PREFIX + k) !== null)) return false
    const values: Values = {}
    for (const k of KEYS) {
      const raw = localStorage.getItem(LEGACY[k])
      if (raw !== null) values[k] = raw
    }
    if (Object.keys(values).length === 0) return false
    writeAll(values)
    return true
  } catch {
    // Dann eben Erststart - die Daten lassen sich noch per Import holen.
    return false
  }
}

function read(key: Key, fallback: unknown): unknown {
  const raw = localStorage.getItem(PREFIX + key)
  if (raw === null) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/** Einen Datenschluessel lesen - leer oder kaputt ergibt den Ersatzwert. */
export function readKey<T>(key: Key, fallback: T): T {
  return read(key, fallback) as T
}

export function writeKey(key: Key, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

// Die laufende Sitzung hat einen eigenen Schluessel ausserhalb von KEYS: sie
// gehoert nicht in die Exportdatei und wird beim Import verworfen.
const UEBUNG_KEY = `${PREFIX}uebung`

export function readUebung(): unknown {
  try {
    const raw = localStorage.getItem(UEBUNG_KEY)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

export function writeUebung(value: unknown) {
  try {
    if (value === null) localStorage.removeItem(UEBUNG_KEY)
    else localStorage.setItem(UEBUNG_KEY, JSON.stringify(value))
  } catch {
    // Ohne gesicherte Sitzung laeuft die Uhr trotzdem - nur ein Neustart verliert sie.
  }
}

/** Belegter Speicher aller piano:-Schluessel in Bytes (2 pro Zeichen, wie der Launcher). */
export function storageBytes() {
  let bytes = 0
  for (let i = 0; i < localStorage.length; i += 1) {
    const k = localStorage.key(i)
    if (k?.startsWith(PREFIX)) bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2
  }
  return bytes
}

// Gleiches Format wie der Export der alten App, dazu Setlists und die
// laufende Playlist, die dort fehlten.
export function exportSnapshot() {
  return {
    pianoPieces: read('pieces', []),
    practiceSessions: read('sessions', {}),
    pianoSettings: read('settings', {}),
    pianoSetlists: read('setlists', []),
    sessionPlaylist: read('playlist', null),
    exportDate: new Date().toISOString(),
    version: VERSION,
  }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

/**
 * Liest eine Exportdatei (alte App oder diese) oder ein appdeck-Backup und
 * liefert die Werte fuer restoreBackup(). Wirft bei allem anderen.
 * Nur was in der Datei steht, wird ersetzt - ein alter Export ohne Setlists
 * laesst die vorhandenen Setlists also stehen (wie in der alten App).
 */
export function readBackup(text: string): Values {
  const obj: unknown = JSON.parse(text)
  if (!isObject(obj)) throw new Error('Invalid backup file format')

  let fields: Record<string, unknown> = obj
  if (obj.format === 'appdeck-backup') {
    // Abbild eines ganzen Speichers, Werte als Text. Aus dem Launcher liegen
    // die Daten unter piano:..., aus der alten App (backup.js) unter den alten
    // Namen. Nie gemischt: sonst kaemen neue Stuecke mit veralteten Setlists.
    const data = isObject(obj.data) ? obj.data : {}
    const prefixed = KEYS.some((k) => typeof data[PREFIX + k] === 'string')
    fields = {}
    for (const k of KEYS) {
      const raw = data[prefixed ? PREFIX + k : LEGACY[k]]
      if (typeof raw === 'string') fields[LEGACY[k]] = JSON.parse(raw)
    }
  }

  if (!Array.isArray(fields.pianoPieces) || !isObject(fields.practiceSessions)) {
    throw new Error('Invalid backup file format')
  }
  const values: Values = {}
  for (const k of KEYS) {
    const v = fields[LEGACY[k]]
    if (v !== undefined) values[k] = JSON.stringify(v)
  }
  return values
}

/** Schreibt, was readBackup() geliefert hat. Eine laufende Sitzung gehoert zum alten Stand. */
export function restoreBackup(values: Values) {
  writeAll(values)
  writeUebung(null)
}

/** Wie viele Stuecke und Sitzungen ein Backup enthaelt - fuer die Rueckfrage. */
export function backupSummary(values: Values) {
  try {
    const pieces = values.pieces ? (JSON.parse(values.pieces) as unknown[]) : []
    const sessions = values.sessions ? (JSON.parse(values.sessions) as Record<string, unknown[]>) : {}
    const sessionCount = Object.values(sessions).reduce((n, l) => n + (Array.isArray(l) ? l.length : 0), 0)
    return { pieces: Array.isArray(pieces) ? pieces.length : 0, sessions: sessionCount }
  } catch {
    return { pieces: 0, sessions: 0 }
  }
}
