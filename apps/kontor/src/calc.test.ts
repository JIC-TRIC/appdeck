import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  breakdown,
  byUsage,
  categoryUsage,
  entryFlow,
  projection,
  spendFreeDays,
  totalsInRange,
  wealthSeries,
  weekdayProfile,
} from './calc'
import { ID_OTHER, ID_TRANSFER } from './data'
import { periodRange } from './util'
import type { Account, Category, Entry } from './types'

const account = (id: string, includeInTotal = true): Account => ({
  id,
  name: id,
  balanceCent: 0,
  includeInTotal,
  color: '#000000',
  archived: false,
  order: 0,
})

// Girokonto zaehlt zur Gesamtbalance, das Depot nicht.
const accById = { giro: account('giro'), depot: account('depot', false), bar: account('bar') }

let n = 0
const entry = (e: Partial<Entry> & Pick<Entry, 'type' | 'amountCent' | 'date'>): Entry => ({
  id: `e${n++}`,
  categoryId: null,
  accountId: 'giro',
  toAccountId: null,
  note: '',
  createdAt: '',
  updatedAt: '',
  ...e,
})

const ALLE = { from: null, to: null }

describe('entryFlow – wie eine Buchung in die Statistik eingeht', () => {
  it('Ausgabe und Einnahme landen in ihrer Kategorie', () => {
    expect(entryFlow(entry({ type: 'expense', amountCent: 500, date: '2026-09-01', categoryId: 'c' }), accById, false))
      .toEqual({ exp: 500, inc: 0, bucket: 'c' })
    expect(entryFlow(entry({ type: 'income', amountCent: 900, date: '2026-09-01', categoryId: 'g' }), accById, false))
      .toEqual({ exp: 0, inc: 900, bucket: 'g' })
  })

  it('Umbuchung ins Depot ist standardmäßig neutral …', () => {
    const t = entry({ type: 'transfer', amountCent: 10000, date: '2026-09-01', toAccountId: 'depot' })
    expect(entryFlow(t, accById, false)).toEqual({ exp: 0, inc: 0, bucket: null })
  })

  it('… und zählt mit der Einstellung als Ausgabe, zurück als Einnahme', () => {
    const hin = entry({ type: 'transfer', amountCent: 10000, date: '2026-09-01', toAccountId: 'depot' })
    const zurueck = entry({ type: 'transfer', amountCent: 4000, date: '2026-09-02', accountId: 'depot', toAccountId: 'giro' })
    expect(entryFlow(hin, accById, true)).toEqual({ exp: 10000, inc: 0, bucket: ID_TRANSFER })
    expect(entryFlow(zurueck, accById, true)).toEqual({ exp: 0, inc: 4000, bucket: ID_TRANSFER })
  })

  it('Umbuchung zwischen zwei gezählten Konten bleibt immer neutral', () => {
    const t = entry({ type: 'transfer', amountCent: 2000, date: '2026-09-01', toAccountId: 'bar' })
    expect(entryFlow(t, accById, true)).toEqual({ exp: 0, inc: 0, bucket: null })
  })

  it('Saldokorrekturen tauchen in keiner Statistik auf', () => {
    const k = entry({ type: 'adjustment', amountCent: -3000, date: '2026-09-01' })
    expect(entryFlow(k, accById, true)).toEqual({ exp: 0, inc: 0, bucket: null })
  })
})

describe('totalsInRange', () => {
  it('summiert nur den Zeitraum und zählt Korrekturen nicht als Buchung', () => {
    const entries = [
      entry({ type: 'income', amountCent: 250000, date: '2026-09-01', categoryId: 'g' }),
      entry({ type: 'expense', amountCent: 4350, date: '2026-09-04', categoryId: 'l' }),
      entry({ type: 'expense', amountCent: 9900, date: '2026-08-31', categoryId: 'l' }),
      entry({ type: 'adjustment', amountCent: 50000, date: '2026-09-01' }),
    ]
    const t = totalsInRange(entries, periodRange('month', '2026-09-15'), accById, false)
    expect(t).toMatchObject({ inc: 250000, exp: 4350, diff: 245650, count: 2 })
    expect(t.biggest?.amountCent).toBe(4350)
  })
})

describe('breakdown – Segmente für den Donut', () => {
  const cats: Record<string, Category> = {}
  const entries: Entry[] = []
  // 12 Kategorien mit 1200, 1100, … 100 Cent
  for (let i = 0; i < 12; i += 1) {
    const id = `c${i}`
    cats[id] = { id, name: id, kind: 'expense', icon: 'dots', color: '#000', budgetCent: null, archived: false, order: i }
    entries.push(entry({ type: 'expense', amountCent: (12 - i) * 100, date: '2026-09-10', categoryId: id }))
  }
  const bd = breakdown({ entries, range: ALLE, kind: 'expense', catById: cats, accById, countBoundary: false })

  it('bündelt ab zehn Segmenten den Schwanz unter „Sonstiges“', () => {
    expect(bd.segments).toHaveLength(10)
    const rest = bd.segments[9]
    expect(rest.id).toBe(ID_OTHER)
    expect(rest.members).toEqual(['c9', 'c10', 'c11'])
    expect(rest.value).toBe(300 + 200 + 100)
  })

  it('sortiert absteigend und die Anteile ergeben zusammen 100 %', () => {
    expect(bd.total).toBe(7800)
    expect(bd.segments[0].id).toBe('c0')
    const sum = bd.segments.reduce((s, x) => s + x.share, 0)
    expect(sum).toBeCloseTo(1, 10)
  })
})

describe('Auswertungen, die vom heutigen Tag abhängen', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 10, 12)) // Donnerstag, 10.9.2026
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('ausgabenfreie Tage zählen nur bis heute', () => {
    const entries = [
      entry({ type: 'expense', amountCent: 100, date: '2026-09-02', categoryId: 'c' }),
      entry({ type: 'expense', amountCent: 100, date: '2026-09-05', categoryId: 'c' }),
      entry({ type: 'expense', amountCent: 100, date: '2026-09-05', categoryId: 'c' }),
      // geplant, liegt in der Zukunft - zaehlt noch nicht
      entry({ type: 'expense', amountCent: 100, date: '2026-09-20', categoryId: 'c' }),
    ]
    expect(spendFreeDays(entries, periodRange('month', '2026-09-10'), accById, false, null)).toEqual({ free: 8, total: 10 })
  })

  it('Hochrechnung: Tempo bis heute auf den ganzen Monat, abgelaufene Zeiträume ohne', () => {
    expect(projection(30000, periodRange('month', '2026-09-10'), null)).toBe(90000)
    expect(projection(30000, periodRange('month', '2026-08-10'), null)).toBeNull()
  })
})

describe('Kategorien nach Gebrauch', () => {
  const cat = (id: string, order: number): Category => ({
    id, name: id, kind: 'expense', icon: 'dots', color: '#000', budgetCent: null, archived: false, order,
  })
  const cats = [cat('wohnen', 0), cat('lebensmittel', 1), cat('essen', 2), cat('reisen', 3)]
  const entries = [
    ...[1, 2, 3].map((d) => entry({ type: 'expense', amountCent: 100, date: `2026-09-0${d}`, categoryId: 'lebensmittel' })),
    entry({ type: 'expense', amountCent: 100, date: '2026-09-04', categoryId: 'essen' }),
    // alt - zaehlt nicht mehr
    ...[1, 2, 3, 4, 5].map((d) => entry({ type: 'expense', amountCent: 100, date: `2026-01-0${d}`, categoryId: 'reisen' })),
  ]

  it('häufigste zuerst, nur im Zeitfenster; der Rest behält seine Reihenfolge', () => {
    const usage = categoryUsage(entries, '2026-06-01')
    expect(byUsage(cats, usage).map((c) => c.id)).toEqual(['lebensmittel', 'essen', 'wohnen', 'reisen'])
  })
})

describe('Auswertungen über den Monat September 2026', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 8, 30, 12))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('Wochentage: der typische Tag, einzelne große Posten verzerren nicht', () => {
    const entries = [
      // Miete am Dienstag, 1.9. - einmalig pro Monat
      entry({ type: 'expense', amountCent: 85000, date: '2026-09-01', categoryId: 'wohnen' }),
      // Wocheneinkauf jeden Samstag
      ...['05', '12', '19', '26'].map((d) => entry({ type: 'expense', amountCent: 3000, date: `2026-09-${d}`, categoryId: 'l' })),
    ]
    const profil = weekdayProfile(entries, periodRange('month', '2026-09-15'), accById, false, null, 1)!
    expect(profil.map((t) => t.label)).toEqual(['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'])
    const tag = (l: string) => profil.find((t) => t.label === l)!
    expect(tag('Di')).toMatchObject({ value: 0, days: 5 })
    expect(tag('Sa')).toMatchObject({ value: 3000, days: 4 })
  })

  it('Woche kann am Sonntag beginnen', () => {
    const profil = weekdayProfile([], periodRange('month', '2026-09-15'), accById, false, null, 0)!
    expect(profil[0].label).toBe('So')
  })

  it('Vermögen: über alle Konten, Umbuchungen neutral, Korrekturen zählen', () => {
    const accounts = [{ ...account('giro'), balanceCent: 10000 }, { ...account('depot', false), balanceCent: 50000 }]
    const entries = [
      entry({ type: 'income', amountCent: 2000, date: '2026-09-10', categoryId: 'g' }),
      entry({ type: 'transfer', amountCent: 1000, date: '2026-09-15', toAccountId: 'depot' }),
      entry({ type: 'expense', amountCent: 500, date: '2026-09-20', categoryId: 'c' }),
      entry({ type: 'adjustment', amountCent: 3000, date: '2026-09-25', accountId: 'depot' }),
    ]
    const w = wealthSeries(entries, accounts, periodRange('month', '2026-09-15'), null)!
    // heute 60.000; vor dem Monat fehlten +2000 -500 +3000
    expect([w.start, w.end]).toEqual([55500, 60000])
    expect(w.points[0].label).toBe('2026-08-31')
    expect(w.points[w.points.length - 1].label).toBe('2026-09-30')
    expect(w.points.find((p) => p.label === '2026-09-15')?.value).toBe(57500)
  })

  it('Vermögen und Wochentage beginnen erst mit der ersten Buchung, Anfangssalden sind kein Zuwachs', () => {
    const accounts = [{ ...account('giro'), balanceCent: 9500 }]
    const entries = [
      entry({ type: 'adjustment', amountCent: 10000, date: '2026-06-01', note: 'Anfangssaldo' }),
      entry({ type: 'expense', amountCent: 500, date: '2026-06-06', categoryId: 'c' }), // Samstag
    ]
    const jahr = periodRange('year', '2026-09-15')
    const w = wealthSeries(entries, accounts, jahr, '2026-06-01')!
    expect(w.points[0].label).toBe('2026-05-31')
    // Startstand ist der Anfangssaldo, nicht null - veraendert hat sich nur die Ausgabe
    expect([w.start, w.end]).toEqual([10000, 9500])

    const profil = weekdayProfile(entries, jahr, accById, false, '2026-06-01', 1)!
    // Januar bis Mai zaehlen nicht als "nichts ausgegeben"
    expect(profil.find((t) => t.label === 'Sa')!.days).toBe(17)
  })
})
