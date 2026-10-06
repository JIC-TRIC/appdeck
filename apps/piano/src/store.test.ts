import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addPiece,
  createSetlist,
  deletePiece,
  deleteSession,
  findDuplicate,
  getPieces,
  getSessions,
  getSettings,
  getSetlists,
  getUebung,
  recordSession,
  saveUebung,
  setArchived,
  updateSetlist,
} from './store'
import { DEFAULT_PROGRESS } from './model'

class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  get length() {
    return this.data.size
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v))
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  clear() {
    this.data.clear()
  }
}

let storage: MemoryStorage
let clock = 1_700_000_000_000

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('window', {})
  // Date.now() liefert die ID - jede Anlage bekommt eine eigene.
  vi.spyOn(Date, 'now').mockImplementation(() => (clock += 1000))
})

const neu = (title: string, youtubeUrl = '') => addPiece({ title, artist: '', youtubeUrl, progress: DEFAULT_PROGRESS })

describe('Einstellungen', () => {
  it('uebernimmt den YouTube-Schalter der alten App', () => {
    expect(getSettings().videoMode).toBe('youtube')
    storage.setItem('piano:settings', JSON.stringify({ showExternalYouTubeButton: false, colorScheme: 'ivory' }))
    expect(getSettings()).toMatchObject({ videoMode: 'app', dailyGoalMinutes: 30, dayStart: 3, colorScheme: 'ivory' })
    storage.setItem('piano:settings', JSON.stringify({ showExternalYouTubeButton: false, videoMode: 'youtube' }))
    expect(getSettings().videoMode).toBe('youtube')
  })
})

describe('Stücke', () => {
  it('legt an, erkennt dasselbe Video und fuellt das Vorschaubild', () => {
    const a = neu(' Clair de Lune ', 'https://youtu.be/CvFH_6DNRCY?si=abc')
    expect(a.title).toBe('Clair de Lune')
    expect(a.thumbnail).toBe('https://img.youtube.com/vi/CvFH_6DNRCY/mqdefault.jpg')
    expect(findDuplicate('https://www.youtube.com/watch?v=CvFH_6DNRCY&t=10')?.id).toBe(a.id)
    expect(findDuplicate('https://www.youtube.com/watch?v=CvFH_6DNRCY', a.id)).toBeUndefined()
    expect(findDuplicate('')).toBeUndefined()
  })

  it('nimmt die Schwierigkeit beim Anlegen mit, unabhaengig vom Lernstand', () => {
    expect(neu('Ohne').difficulty).toBe('Unknown')
    const a = addPiece({ title: 'Fantaisie-Impromptu', artist: '', youtubeUrl: '', progress: DEFAULT_PROGRESS, difficulty: 'Ultrahard' })
    expect(getPieces().find((p) => p.id === a.id)).toMatchObject({ difficulty: 'Ultrahard', progress: DEFAULT_PROGRESS })
  })

  it('loescht mit Sitzungen und Setlist-Platz - und nimmt es wieder zurueck', () => {
    const a = neu('A')
    const b = neu('B')
    recordSession(a.id, 600)
    const list = createSetlist('Konzert')
    updateSetlist(list.id, { pieceIds: [b.id, a.id] })

    const undo = deletePiece(a.id)
    expect(getPieces().map((p) => p.id)).toEqual([b.id])
    expect(getSessions()[a.id]).toBeUndefined()
    expect(getSetlists()[0].pieceIds).toEqual([b.id])

    undo()
    expect(getPieces().map((p) => p.id)).toEqual([a.id, b.id])
    expect(getSessions()[a.id]).toHaveLength(1)
    expect(getSetlists()[0].pieceIds).toEqual([b.id, a.id])
  })
})

describe('Archiv', () => {
  it('archiviert, holt zurueck und nimmt es mit Rueckgaengig wieder zurueck', () => {
    const a = neu('A')
    recordSession(a.id, 120)
    const undo = setArchived(a.id, true)
    expect(getPieces()[0].archivedAt).toEqual(expect.any(String))
    expect(getSessions()[a.id]).toHaveLength(1)
    undo()
    expect(getPieces()[0].archivedAt).toBeNull()
    setArchived(a.id, true)
    setArchived(a.id, false)
    expect(getPieces()[0].archivedAt).toBeNull()
  })
})

describe('Sitzungen', () => {
  it('speichert erst ab 30 Sekunden, setzt aber immer "zuletzt geübt"', () => {
    const a = neu('A')
    expect(recordSession(a.id, 29, '2026-10-04T10:00:00.000Z')).toBe(false)
    expect(getSessions()[a.id]).toBeUndefined()
    expect(getPieces()[0].lastPracticed).toBe('2026-10-04T10:00:00.000Z')
    expect(recordSession(a.id, 30.4, '2026-10-04T11:00:00.000Z')).toBe(true)
    expect(getSessions()[a.id]).toEqual([{ timestamp: '2026-10-04T11:00:00.000Z', duration: 30 }])
  })

  it('loescht eine Sitzung und stellt sie an derselben Stelle wieder her', () => {
    const a = neu('A')
    recordSession(a.id, 60, 't1')
    recordSession(a.id, 120, 't2')
    const second = getSessions()[a.id][1]
    const undo = deleteSession(a.id, second)
    expect(getSessions()[a.id].map((s) => s.timestamp)).toEqual(['t1'])
    undo()
    expect(getSessions()[a.id].map((s) => s.timestamp)).toEqual(['t1', 't2'])
  })
})

describe('Laufende Sitzung', () => {
  it('ueberlebt einen Neustart und ist nicht Teil der Daten', () => {
    saveUebung({ pieceId: 'a', queue: ['b'], startedAt: 5, pausedMs: 0, pausedAt: null })
    expect(getUebung()).toEqual({ pieceId: 'a', queue: ['b'], startedAt: 5, pausedMs: 0, pausedAt: null })
    expect(storage.getItem('piano:uebung')).not.toBeNull()
    saveUebung(null)
    expect(getUebung()).toBeNull()
  })
})
