import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportSnapshot, migrateLegacy, readBackup, restoreBackup } from './storage'

// localStorage im Speicher. failOn laesst das Schreiben eines Schluessels
// scheitern wie bei vollem Speicher.
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  failOn: string | null = null
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
    if (k === this.failOn) throw new Error('QuotaExceededError')
    this.data.set(k, String(v))
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  clear() {
    this.data.clear()
  }
  dump() {
    return Object.fromEntries(this.data)
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
})

// So sah der Speicher der alten App piano-practice-tracker aus.
const pieces = [
  {
    id: '1730000000000',
    title: 'Clair de Lune',
    artist: 'Debussy',
    youtubeUrl: 'https://youtu.be/abc',
    difficulty: 'Hard',
    progress: { rightHand: 2, leftHand: 1, together: 0, dynamics: false, memorized: 0 },
    lastPracticed: '2026-09-30T18:00:00.000Z',
    createdAt: '2026-08-01T10:00:00.000Z',
  },
]
const sessions = { '1730000000000': [{ timestamp: '2026-09-30T18:00:00.000Z', duration: 600 }] }
const settings = { showExternalYouTubeButton: false, favoritePiecesCount: 5, colorScheme: 'ivory' }
const setlists = [{ id: 's1', name: 'Konzert', pieceIds: ['1730000000000'] }]
const playlist = { pieceIds: ['1730000000000'], currentIndex: 0 }

const legacyStorage = {
  pianoPieces: JSON.stringify(pieces),
  practiceSessions: JSON.stringify(sessions),
  pianoSettings: JSON.stringify(settings),
  pianoSetlists: JSON.stringify(setlists),
  sessionPlaylist: JSON.stringify(playlist),
}

function fillLegacy() {
  for (const [k, v] of Object.entries(legacyStorage)) storage.setItem(k, v)
}

const piano = (key: string) => JSON.parse(storage.getItem(`piano:${key}`) ?? 'null')

describe('Übernahme aus der alten App', () => {
  it('kopiert beim ersten Start alle fünf Schlüssel unverändert', () => {
    fillLegacy()
    expect(migrateLegacy()).toBe(true)
    expect(storage.getItem('piano:pieces')).toBe(legacyStorage.pianoPieces)
    expect(storage.getItem('piano:sessions')).toBe(legacyStorage.practiceSessions)
    expect(storage.getItem('piano:settings')).toBe(legacyStorage.pianoSettings)
    expect(storage.getItem('piano:setlists')).toBe(legacyStorage.pianoSetlists)
    expect(storage.getItem('piano:playlist')).toBe(legacyStorage.sessionPlaylist)
  })

  it('lässt die alten Schlüssel liegen – die alte App in Safari arbeitet weiter', () => {
    fillLegacy()
    migrateLegacy()
    expect(storage.getItem('pianoPieces')).toBe(legacyStorage.pianoPieces)
  })

  it('überschreibt nie, was hier schon gespeichert ist', () => {
    storage.setItem('piano:pieces', '[]')
    fillLegacy()
    expect(migrateLegacy()).toBe(false)
    expect(piano('pieces')).toEqual([])
    expect(storage.getItem('piano:sessions')).toBeNull()
  })

  it('tut ohne alte Daten nichts', () => {
    expect(migrateLegacy()).toBe(false)
    expect(storage.length).toBe(0)
  })

  it('übernimmt bei vollem Speicher nichts halb', () => {
    fillLegacy()
    storage.failOn = 'piano:setlists'
    expect(migrateLegacy()).toBe(false)
    expect(Object.keys(storage.dump()).filter((k) => k.startsWith('piano:'))).toEqual([])
  })
})

describe('Import', () => {
  it('liest den Export der alten App (ohne Setlists) und lässt vorhandene Setlists stehen', () => {
    storage.setItem('piano:setlists', JSON.stringify(setlists))
    const oldExport = {
      pianoPieces: pieces,
      practiceSessions: sessions,
      pianoSettings: settings,
      exportDate: '2026-10-01T12:00:00.000Z',
      version: '1.4.7',
    }
    restoreBackup(readBackup(JSON.stringify(oldExport)))
    expect(piano('pieces')).toEqual(pieces)
    expect(piano('sessions')).toEqual(sessions)
    expect(piano('settings')).toEqual(settings)
    expect(piano('setlists')).toEqual(setlists)
  })

  it('liest ein appdeck-Backup aus der alten App (backup.js, alte Schlüssel)', () => {
    const backup = { format: 'appdeck-backup', version: 1, data: { ...legacyStorage, other: 'x' } }
    restoreBackup(readBackup(JSON.stringify(backup)))
    expect(piano('pieces')).toEqual(pieces)
    expect(piano('setlists')).toEqual(setlists)
    expect(piano('playlist')).toEqual(playlist)
    expect(storage.getItem('other')).toBeNull()
  })

  it('nimmt aus einem Launcher-Backup nur die piano:-Schlüssel, auch wenn alte daneben liegen', () => {
    const backup = {
      format: 'appdeck-backup',
      version: 1,
      data: { ...legacyStorage, 'piano:pieces': '[]', 'piano:sessions': '{}' },
    }
    restoreBackup(readBackup(JSON.stringify(backup)))
    expect(piano('pieces')).toEqual([])
    expect(piano('sessions')).toEqual({})
    expect(storage.getItem('piano:setlists')).toBeNull()
  })

  it('lehnt alles andere ab', () => {
    expect(() => readBackup('kein json')).toThrow()
    expect(() => readBackup('[]')).toThrow()
    expect(() => readBackup(JSON.stringify({ app: 'kontor', accounts: [] }))).toThrow()
    expect(() => readBackup(JSON.stringify({ pianoPieces: {}, practiceSessions: {} }))).toThrow()
    expect(() => readBackup(JSON.stringify({ format: 'appdeck-backup', data: { 'kontor:accounts': '[]' } }))).toThrow()
  })

  it('ändert bei vollem Speicher nichts', () => {
    storage.setItem('piano:pieces', '[]')
    const values = readBackup(JSON.stringify({ pianoPieces: pieces, practiceSessions: sessions }))
    storage.failOn = 'piano:sessions'
    expect(() => restoreBackup(values)).toThrow()
    expect(piano('pieces')).toEqual([])
    expect(storage.getItem('piano:sessions')).toBeNull()
  })
})

describe('Export', () => {
  it('hat das Format der alten App plus Setlists und Playlist und lässt sich wieder einlesen', () => {
    fillLegacy()
    migrateLegacy()
    const snapshot = exportSnapshot()
    expect(snapshot).toMatchObject({
      pianoPieces: pieces,
      practiceSessions: sessions,
      pianoSettings: settings,
      pianoSetlists: setlists,
      sessionPlaylist: playlist,
      version: '1.4.7',
    })

    const before = storage.dump()
    storage.clear()
    restoreBackup(readBackup(JSON.stringify(snapshot)))
    for (const key of ['pieces', 'sessions', 'settings', 'setlists', 'playlist']) {
      expect(JSON.parse(storage.getItem(`piano:${key}`)!)).toEqual(JSON.parse(before[`piano:${key}`]))
    }
  })

  it('liefert bei leerem Speicher dieselben Standardwerte wie die alte App', () => {
    expect(exportSnapshot()).toMatchObject({ pianoPieces: [], practiceSessions: {}, pianoSettings: {} })
  })
})
