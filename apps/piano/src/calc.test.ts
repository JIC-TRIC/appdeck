import { describe, expect, it } from 'vitest'
import {
  calendar,
  currentStreak,
  dayTotals,
  generatePlaylist,
  heatLevel,
  historyDays,
  longestStreak,
  seededRandom,
  sortPieces,
  todaysPlaylist,
  weekDays,
} from './calc'
import { DEFAULT_PROGRESS } from './model'
import type { Piece, Sessions } from './types'
import { dayOf } from './util'

// Ortszeit-Zeitstempel: new Date(y, m, d, h, min) - so wie eine Sitzung am
// iPhone entsteht, unabhaengig von der Zeitzone der Testmaschine.
const at = (y: number, m: number, d: number, h = 18, min = 0) => new Date(y, m - 1, d, h, min).toISOString()

const piece = (id: string, extra: Partial<Piece> = {}): Piece => ({
  id,
  title: id,
  artist: '',
  youtubeUrl: '',
  difficulty: 'Unknown',
  progress: DEFAULT_PROGRESS,
  lastPracticed: null,
  ...extra,
})

describe('Tageswechsel', () => {
  it('rechnet in Ortszeit und zaehlt bis 3 Uhr zum Vortag', () => {
    expect(dayOf(at(2026, 10, 4, 1, 30), 3)).toBe('2026-10-03')
    expect(dayOf(at(2026, 10, 4, 3, 0), 3)).toBe('2026-10-04')
    expect(dayOf(at(2026, 10, 4, 0, 10), 0)).toBe('2026-10-04')
    expect(dayOf(at(2026, 10, 4, 23, 59), 3)).toBe('2026-10-04')
  })

  it('verteilt Sitzungen auf logische Tage', () => {
    const sessions: Sessions = {
      a: [{ timestamp: at(2026, 10, 4, 1, 0), duration: 600 }, { timestamp: at(2026, 10, 4, 18), duration: 300 }],
      b: [{ timestamp: at(2026, 10, 3, 20), duration: 120 }],
    }
    const totals = dayTotals(sessions, 3)
    expect(totals.get('2026-10-03')).toBe(720)
    expect(totals.get('2026-10-04')).toBe(300)
    expect(dayTotals(sessions, 3, 'a').get('2026-10-03')).toBe(600)
  })
})

describe('Woche und Serie', () => {
  const totals = new Map([
    ['2026-09-28', 100],
    ['2026-09-29', 100],
    ['2026-09-30', 100],
    ['2026-10-02', 100],
    ['2026-10-03', 100],
  ])

  it('zeigt Montag bis Sonntag der aktuellen Woche', () => {
    const w = weekDays(totals, '2026-10-01')
    expect(w.map((d) => d.label)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'])
    expect(w[0].day).toBe('2026-09-28')
    // 1. Oktober 2026 ist ein Donnerstag
    expect(w[3].isToday).toBe(true)
    expect(w[4].future).toBe(true)
    expect(w[2].future).toBe(false)
  })

  it('bricht die Serie nicht, solange heute noch nicht geuebt wurde', () => {
    expect(currentStreak(totals, '2026-10-04')).toBe(2)
    expect(currentStreak(totals, '2026-10-03')).toBe(2)
    expect(currentStreak(totals, '2026-10-05')).toBe(0)
  })

  it('kennt den Rekord', () => {
    expect(longestStreak(totals)).toBe(3)
    expect(longestStreak(new Map())).toBe(0)
  })
})

describe('Kalender', () => {
  it('endet mit der aktuellen Woche, heute ist markiert', () => {
    const { columns, labels } = calendar(new Map([['2026-10-04', 3000]]), '2026-10-04')
    expect(columns).toHaveLength(17)
    const last = columns[16]
    expect(last[0].day).toBe('2026-09-28')
    expect(last[6]).toMatchObject({ day: '2026-10-04', isToday: true, level: 4 })
    expect(columns[0][0].day).toBe('2026-06-08')
    // Okt beginnt in der letzten Spalte, Sep zwei davor faellt nicht weg (Abstand 3)
    expect(labels.map((l) => l.label)).toEqual(['Jun', 'Jul', 'Aug', 'Sep', 'Okt'])
  })

  it('stuft nach Minuten', () => {
    expect([0, 1, 600, 601, 1500, 2700, 2701].map(heatLevel)).toEqual([0, 1, 1, 2, 2, 3, 4])
  })
})

describe('Tagesliste', () => {
  const now = new Date(2026, 9, 4, 12).getTime()
  const pieces = ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => piece(id))

  it('ist mit gleichem Startwert gleich und fuellt das Tagesziel', () => {
    const one = generatePlaylist(pieces, {}, 20261004, 30 * 60, now)
    const two = generatePlaylist(pieces, {}, 20261004, 30 * 60, now)
    expect(one).toEqual(two)
    // ohne Sitzungen 5 min pro Stueck → 6 Stuecke fuer 30 min
    expect(one).toHaveLength(6)
    expect(generatePlaylist(pieces, {}, 20261004, 10 * 60, now)).toHaveLength(2)
  })

  it('bleibt leer ohne Stuecke - frueher die Endlosschleife', () => {
    expect(generatePlaylist([], {}, 1, 1800, now)).toEqual([])
  })

  it('nimmt die gespeicherte Liste von heute, sonst eine neue', () => {
    const stored = { date: '2026-10-04', seed: 1, pieceIds: ['b', 'x'] }
    const kept = todaysPlaylist(stored, pieces, {}, '2026-10-04', 1800, now)
    expect(kept.playlist.pieceIds).toEqual(['b'])
    expect(kept.fresh).toBe(true) // geloeschtes Stueck raus → neu speichern
    expect(todaysPlaylist({ ...stored, pieceIds: ['b'] }, pieces, {}, '2026-10-04', 1800, now).fresh).toBe(false)
    const fresh = todaysPlaylist({ ...stored, date: '2026-10-03' }, pieces, {}, '2026-10-04', 1800, now)
    expect(fresh.fresh).toBe(true)
    expect(fresh.playlist.seed).toBe(20261004)
  })

  it('kommt mit riesigen Startwerten (Date.now) zurecht', () => {
    const rnd = seededRandom(Date.now())
    const values = Array.from({ length: 50 }, rnd)
    expect(values.every((v) => v >= 0 && v < 1)).toBe(true)
    expect(new Set(values).size).toBeGreaterThan(45)
  })
})

describe('Sortierung', () => {
  const now = new Date(2026, 9, 4, 12).getTime()
  const pieces = [
    piece('alt', { title: 'Zebra', createdAt: '2026-01-01T00:00:00Z', lastPracticed: at(2026, 9, 1) }),
    piece('neu', { title: 'Adagio', createdAt: '2026-09-01T00:00:00Z', lastPracticed: at(2026, 10, 3) }),
    piece('nie', { title: 'Étude', createdAt: '2026-05-01T00:00:00Z' }),
  ]
  const sessions: Sessions = {
    alt: [{ timestamp: at(2026, 6, 1), duration: 7200 }],
    neu: [{ timestamp: at(2026, 10, 3), duration: 900 }],
  }
  const ids = (by: Parameters<typeof sortPieces>[2]['by'], reverse = false) =>
    sortPieces(pieces, sessions, { by, reverse }, now).map((p) => p.id)

  it('sortiert wie die alte App', () => {
    expect(ids('trending')).toEqual(['neu', 'alt', 'nie'])
    expect(ids('practiceTime')).toEqual(['alt', 'neu', 'nie'])
    expect(ids('lastPracticed')).toEqual(['neu', 'alt', 'nie'])
    expect(ids('default')).toEqual(['neu', 'nie', 'alt'])
    expect(ids('title')).toEqual(['neu', 'nie', 'alt'])
    expect(ids('title', true)).toEqual(['alt', 'nie', 'neu'])
  })
})

describe('Verlauf', () => {
  it('gruppiert nach logischem Tag, neueste zuerst', () => {
    const sessions: Sessions = {
      a: [{ timestamp: at(2026, 10, 4, 1, 0), duration: 60 }, { timestamp: at(2026, 10, 4, 17), duration: 600 }],
      b: [{ timestamp: at(2026, 10, 3, 21), duration: 300 }],
    }
    const days = historyDays(sessions, 3)
    expect(days.map((d) => [d.day, d.seconds, d.items.length])).toEqual([
      ['2026-10-04', 600, 1],
      ['2026-10-03', 360, 2],
    ])
    expect(historyDays(sessions, 3, 'b')).toHaveLength(1)
  })
})
