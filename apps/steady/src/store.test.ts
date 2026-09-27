import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isArchived, meets, streaks } from './calc'
import type { HabitInput } from './store'

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
}

let storage: MemoryStorage
let S: typeof import('./store')

beforeEach(async () => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('window', {})
  vi.resetModules()
  S = await import('./store')
})

const input = (patch: Partial<HabitInput> = {}): HabitInput => ({
  name: 'Gym',
  color: 'coral',
  kind: 'check',
  unit: '',
  perWeek: 3,
  target: 0,
  dir: 'min',
  start: '2026-09-01',
  ...patch,
})

const TODAY = '2026-09-30' // Mittwoch, KW 40 beginnt am 28.9.

describe('Gewohnheiten', () => {
  it('legt an und haengt neue unten an', () => {
    const a = S.addHabit(input())
    const b = S.addHabit(input({ name: 'Lesen', perWeek: 7 }))
    expect(b.order).toBeGreaterThan(a.order)
    expect(a.rhythm).toEqual([{ from: '2026-09-01', perWeek: 3 }])
    expect(a.goal).toEqual([])
  })

  it('setzt ohne Eintraege neu auf, auch mit anderer Messart', () => {
    const h = S.addHabit(input())
    S.updateHabit(h.id, input({ kind: 'amount', unit: 'g', target: 150, perWeek: 7 }), TODAY)
    const n = S.getHabits()[0]
    expect(n.kind).toBe('amount')
    expect(n.rhythm).toEqual([{ from: '2026-09-01', perWeek: 7 }])
    expect(n.goal).toEqual([{ from: '2026-09-01', target: 150, dir: 'min' }])
  })

  it('aendert mit Eintraegen den Rhythmus ab Montag und behaelt die Messart', () => {
    const h = S.addHabit(input())
    S.setValue(h.id, '2026-09-02', 1)
    S.updateHabit(h.id, input({ perWeek: 4, kind: 'amount' }), TODAY)
    const n = S.getHabits()[0]
    expect(n.kind).toBe('check')
    expect(n.rhythm).toEqual([
      { from: '2026-09-01', perWeek: 3 },
      { from: '2026-09-28', perWeek: 4 },
    ])
    // Zurueck auf 3x in derselben Woche: die Aenderung faellt wieder weg
    S.updateHabit(h.id, input({ perWeek: 3 }), TODAY)
    expect(S.getHabits()[0].rhythm).toEqual([{ from: '2026-09-01', perWeek: 3 }])
  })

  it('aendert mit Eintraegen das Mengenziel ab heute', () => {
    const h = S.addHabit(input({ kind: 'amount', unit: 'g', target: 150, perWeek: 7 }))
    S.setValue(h.id, '2026-09-29', 155)
    S.updateHabit(h.id, input({ kind: 'amount', unit: 'g', target: 160, perWeek: 7 }), TODAY)
    const n = S.getHabits()[0]
    expect(n.goal).toEqual([
      { from: '2026-09-01', target: 150, dir: 'min' },
      { from: TODAY, target: 160, dir: 'min' },
    ])
    expect(meets(n, 155, '2026-09-29')).toBe(true)
  })

  it('archiviert ab morgen und stellt mit neuer Serie wieder her', () => {
    const h = S.addHabit(input({ perWeek: 7 }))
    S.archiveHabit(h.id, '2026-09-10')
    expect(isArchived(S.getHabits()[0])).toBe(true)
    S.restoreHabit(h.id, TODAY)
    const n = S.getHabits()[0]
    expect(isArchived(n)).toBe(false)
    expect(n.inactive).toEqual([{ from: '2026-09-11', to: '2026-09-29' }])
  })

  it('hinterlaesst keine Luecke, wenn am selben Tag zurueckgeholt', () => {
    const h = S.addHabit(input())
    S.archiveHabit(h.id, TODAY)
    S.restoreHabit(h.id, TODAY)
    expect(S.getHabits()[0].inactive).toEqual([])
  })

  it('loescht eine Gewohnheit samt Eintraegen', () => {
    const h = S.addHabit(input())
    S.setValue(h.id, '2026-09-02', 1)
    S.deleteHabit(h.id)
    expect(S.getHabits()).toEqual([])
    expect(S.getLog()).toEqual({})
  })

  it('sortiert um', () => {
    const a = S.addHabit(input({ name: 'A' }))
    const b = S.addHabit(input({ name: 'B' }))
    S.reorderHabits([b.id, a.id])
    const byOrder = [...S.getHabits()].sort((x, y) => x.order - y.order)
    expect(byOrder.map((h) => h.name)).toEqual(['B', 'A'])
  })
})

describe('Eintraege', () => {
  it('setzt und entfernt Werte', () => {
    S.setValue('x', '2026-09-30', 148)
    expect(S.getValue('x', '2026-09-30')).toBe(148)
    S.setValue('x', '2026-09-30', null)
    expect(S.getLog()).toEqual({})
  })
})

describe('Export und Import', () => {
  it('liest die eigene Exportdatei wieder ein', () => {
    const h = S.addHabit(input())
    S.setValue(h.id, '2026-09-02', 1)
    S.updateSettings({ dayStart: 4 })
    const snap = JSON.parse(JSON.stringify(S.exportSnapshot()))
    S.clearAll()
    S.importSnapshot(snap)
    expect(S.getHabits()).toHaveLength(1)
    expect(S.getLog()[h.id]).toEqual({ '2026-09-02': 1 })
    expect(S.getSettings().dayStart).toBe(4)
  })

  it('lehnt kaputte Dateien mit klarer Meldung ab und aendert nichts', () => {
    S.addHabit(input())
    expect(() => S.importSnapshot({ habits: [{ id: 'a' }] })).toThrow(/Gewohnheit 1/)
    expect(() => S.importSnapshot({ foo: 1 })).toThrow(/keine Steady-Daten/)
    expect(S.getHabits()).toHaveLength(1)
  })

  it('nimmt bei vollem Speicher alles zurueck', () => {
    S.addHabit(input())
    const vorher = storage.getItem('steady:habits')
    storage.failOn = 'steady:settings'
    expect(() => S.importSnapshot({ habits: [], log: {} })).toThrow(/Speicherplatz/)
    expect(storage.getItem('steady:habits')).toBe(vorher)
  })

  it('passt zur Testdatei (testdaten/steady-beispiel.json)', async () => {
    const beispiel = (await import('../testdaten/steady-beispiel.json')).default
    S.importSnapshot(beispiel)
    const habits = S.getHabits()
    const log = S.getLog()
    expect(habits).toHaveLength(9)
    expect(habits.filter(isArchived).map((h) => h.name)).toEqual(['Kalt duschen', 'Meditation'])
    const creatin = habits.find((h) => h.id === 'creatin')!
    expect(streaks(creatin, log.creatin, '2026-09-27').current).toBe(41)
  })
})
