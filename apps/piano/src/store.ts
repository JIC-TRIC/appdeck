// Lesen und Aendern der Daten. Die Ansichten rufen nach jeder Aenderung
// ctx.refresh(), Piano.tsx liest dann alles neu - bei dieser Datenmenge
// einfacher als eine zweite Wahrheit im Speicher (wie Kontor und Steady).

import { migratePiece, normalizeFilter, normalizeProgress } from './model'
import { readKey, readUebung, writeKey, writeUebung } from './storage'
import type { Difficulty, Piece, Playlist, Progress, Session, Sessions, Settings, Setlist, Uebung } from './types'
import { extractVideoId, thumbnailUrl } from './util'

export const DEFAULT_SETTINGS: Settings = {
  dailyGoalMinutes: 30,
  videoMode: 'youtube',
  dayStart: 3,
  sort: { by: 'trending', reverse: false },
  filter: { difficulty: [], status: [] },
}

// ---------- Lesen ----------

export function getPieces(): Piece[] {
  const raw = readKey<unknown>('pieces', [])
  return Array.isArray(raw) ? raw.map(migratePiece).filter((p) => p.id) : []
}

export function getSessions(): Sessions {
  const raw = readKey<unknown>('sessions', {})
  return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Sessions) : {}
}

export function getSettings(): Settings {
  const raw = readKey<Record<string, unknown> | null>('settings', null)
  const r = raw && typeof raw === 'object' ? raw : {}
  const s: Settings = { ...DEFAULT_SETTINGS, ...r }
  // Aus der alten App: "External YouTube Button" an (Standard) hiess, das
  // Video in der YouTube-App zu oeffnen.
  if (r.videoMode !== 'app' && r.videoMode !== 'youtube') {
    s.videoMode = r.showExternalYouTubeButton === false ? 'app' : 'youtube'
  }
  if (typeof s.dailyGoalMinutes !== 'number' || s.dailyGoalMinutes < 5) s.dailyGoalMinutes = 30
  if (typeof s.dayStart !== 'number' || s.dayStart < 0 || s.dayStart > 6) s.dayStart = 3
  if (!s.sort || typeof s.sort !== 'object') s.sort = DEFAULT_SETTINGS.sort
  s.filter = normalizeFilter(r.filter)
  return s
}

export function getSetlists(): Setlist[] {
  const raw = readKey<unknown>('setlists', [])
  if (!Array.isArray(raw)) return []
  return raw
    .filter((s): s is Setlist => !!s && typeof s === 'object' && 'id' in s)
    .map((s) => ({ ...s, title: String(s.title ?? ''), pieceIds: Array.isArray(s.pieceIds) ? s.pieceIds : [] }))
}

export function getPlaylist(): Playlist | null {
  const raw = readKey<Playlist | null>('playlist', null)
  return raw && typeof raw === 'object' && typeof raw.date === 'string' ? raw : null
}

export function getUebung(): Uebung | null {
  const raw = readUebung() as Uebung | null
  return raw && typeof raw === 'object' && typeof raw.pieceId === 'string' && typeof raw.startedAt === 'number'
    ? { ...raw, queue: Array.isArray(raw.queue) ? raw.queue : [], pausedMs: raw.pausedMs || 0, pausedAt: raw.pausedAt ?? null }
    : null
}

// ---------- Schreiben ----------

export function updateSettings(patch: Partial<Settings>) {
  writeKey('settings', { ...getSettings(), ...patch })
}

export function savePlaylist(p: Playlist) {
  writeKey('playlist', p)
}

export function saveUebung(u: Uebung | null) {
  writeUebung(u)
}

function savePieces(list: Piece[]) {
  writeKey('pieces', list)
}

function saveSessions(s: Sessions) {
  writeKey('sessions', s)
}

function saveSetlists(list: Setlist[]) {
  writeKey('setlists', list)
}

// ---------- Stuecke ----------

/** Dasselbe Video schon vorhanden? (ein anderes Stueck mit gleicher Video-ID) */
export function findDuplicate(url: string, excludeId?: string) {
  const id = extractVideoId(url)
  if (!id) return undefined
  return getPieces().find((p) => p.id !== excludeId && extractVideoId(p.youtubeUrl) === id)
}

export function addPiece(data: {
  title: string
  artist: string
  youtubeUrl: string
  progress: Progress
  difficulty?: Difficulty
}) {
  const piece: Piece = {
    id: Date.now().toString(),
    title: data.title.trim(),
    artist: data.artist.trim(),
    youtubeUrl: data.youtubeUrl.trim(),
    thumbnail: thumbnailUrl(data.youtubeUrl),
    difficulty: data.difficulty ?? 'Unknown',
    progress: normalizeProgress(data.progress),
    lastPracticed: null,
    createdAt: new Date().toISOString(),
    practiceTime: 0,
  }
  savePieces([...getPieces(), piece])
  return piece
}

export function updatePiece(id: string, patch: Partial<Piece>) {
  const next = { ...patch }
  if (patch.youtubeUrl !== undefined) next.thumbnail = thumbnailUrl(patch.youtubeUrl)
  if (patch.progress) next.progress = normalizeProgress(patch.progress)
  savePieces(getPieces().map((p) => (p.id === id ? { ...p, ...next } : p)))
}

/**
 * Archiviert ein Stueck oder holt es zurueck. Es faellt aus Tagesliste und
 * Uebersicht; Sitzungen, Setlists und Statistik bleiben. Gibt das Zuruecknehmen zurueck.
 */
export function setArchived(id: string, archived: boolean) {
  const before = getPieces().find((p) => p.id === id)?.archivedAt ?? null
  updatePiece(id, { archivedAt: archived ? new Date().toISOString() : null })
  return () => updatePiece(id, { archivedAt: before })
}

/**
 * Loescht ein Stueck mit seinen Sitzungen und nimmt es aus allen Setlists.
 * Gibt zurueck, was zum Zuruecknehmen noetig ist.
 */
export function deletePiece(id: string) {
  const pieces = getPieces()
  const index = pieces.findIndex((p) => p.id === id)
  if (index < 0) return () => {}
  const piece = pieces[index]
  const sessions = getSessions()
  const ownSessions = sessions[id]
  const setlists = getSetlists()
  const positions = setlists.map((s) => ({ id: s.id, at: s.pieceIds.indexOf(id) })).filter((x) => x.at >= 0)

  savePieces(pieces.filter((p) => p.id !== id))
  const rest = { ...sessions }
  delete rest[id]
  saveSessions(rest)
  saveSetlists(setlists.map((s) => ({ ...s, pieceIds: s.pieceIds.filter((x) => x !== id) })))

  return () => {
    const now = getPieces()
    if (now.some((p) => p.id === id)) return
    now.splice(Math.min(index, now.length), 0, piece)
    savePieces(now)
    if (ownSessions) saveSessions({ ...getSessions(), [id]: ownSessions })
    saveSetlists(
      getSetlists().map((s) => {
        const pos = positions.find((x) => x.id === s.id)
        if (!pos || s.pieceIds.includes(id)) return s
        const ids = [...s.pieceIds]
        ids.splice(Math.min(pos.at, ids.length), 0, id)
        return { ...s, pieceIds: ids }
      }),
    )
  }
}

// ---------- Sitzungen ----------

/** Ab dieser Dauer wird eine Sitzung gespeichert (wie bisher). */
export const MIN_SESSION_SECONDS = 30

// Speichert eine Sitzung und setzt "zuletzt geuebt". Kuerzer als 30 s: nur
// "zuletzt geuebt" (so hat es die alte App auch gehalten).
export function recordSession(pieceId: string, seconds: number, endIso = new Date().toISOString()) {
  const s = Math.round(seconds)
  if (s >= MIN_SESSION_SECONDS) {
    const sessions = getSessions()
    const list = Array.isArray(sessions[pieceId]) ? sessions[pieceId] : []
    saveSessions({ ...sessions, [pieceId]: [...list, { timestamp: endIso, duration: s }] })
  }
  if (s > 0) updatePiece(pieceId, { lastPracticed: endIso })
  return s >= MIN_SESSION_SECONDS
}

export function deleteSession(pieceId: string, session: Session) {
  const sessions = getSessions()
  const list = Array.isArray(sessions[pieceId]) ? sessions[pieceId] : []
  const index = list.findIndex((s) => s.timestamp === session.timestamp && s.duration === session.duration)
  if (index < 0) return () => {}
  saveSessions({ ...sessions, [pieceId]: list.filter((_, i) => i !== index) })
  return () => {
    const now = getSessions()
    const cur = Array.isArray(now[pieceId]) ? [...now[pieceId]] : []
    cur.splice(Math.min(index, cur.length), 0, session)
    saveSessions({ ...now, [pieceId]: cur })
  }
}

// ---------- Setlists ----------

export function createSetlist(title: string) {
  const setlist: Setlist = { id: Date.now().toString(), title: title.trim(), pieceIds: [] }
  saveSetlists([...getSetlists(), setlist])
  return setlist
}

export function updateSetlist(id: string, patch: Partial<Setlist>) {
  saveSetlists(getSetlists().map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

export function deleteSetlist(id: string) {
  const list = getSetlists()
  const index = list.findIndex((s) => s.id === id)
  if (index < 0) return () => {}
  const setlist = list[index]
  saveSetlists(list.filter((s) => s.id !== id))
  return () => {
    const now = getSetlists()
    if (now.some((s) => s.id === id)) return
    now.splice(Math.min(index, now.length), 0, setlist)
    saveSetlists(now)
  }
}
