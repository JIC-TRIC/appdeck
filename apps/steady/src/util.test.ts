import { describe, expect, it } from 'vitest'
import {
  addDays,
  applyKey,
  diffDays,
  formatValue,
  isoWeek,
  logicalToday,
  mondayOf,
  parseNumber,
  rangeLabel,
  textToValue,
} from './util'

describe('Datum', () => {
  it('rechnet Tage ueber die Zeitumstellung', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
  })

  it('findet Montag und Kalenderwoche', () => {
    expect(mondayOf('2026-09-30')).toBe('2026-09-28')
    expect(mondayOf('2026-09-28')).toBe('2026-09-28')
    expect(mondayOf('2026-10-04')).toBe('2026-09-28')
    expect(isoWeek('2026-09-30')).toBe(40)
    expect(isoWeek('2027-01-01')).toBe(53)
  })

  it('haelt bis zum Tageswechsel den Vortag', () => {
    expect(logicalToday(new Date(2026, 8, 30, 1, 30), 3)).toBe('2026-09-29')
    expect(logicalToday(new Date(2026, 8, 30, 3, 0), 3)).toBe('2026-09-30')
    expect(logicalToday(new Date(2026, 8, 30, 0, 10), 0)).toBe('2026-09-30')
    expect(logicalToday(new Date(2026, 9, 1, 2, 0), 3)).toBe('2026-09-30')
  })

  it('beschriftet Bereiche', () => {
    expect(rangeLabel('2026-09-17', '2026-09-23')).toBe('17.–23. September')
    expect(rangeLabel('2026-09-28', '2026-10-04')).toBe('28. Sep – 4. Okt')
    expect(rangeLabel('2026-12-29', '2027-01-04')).toBe('29. Dez 2026 – 4. Jan 2027')
  })
})

describe('Zahlen', () => {
  it('formatiert Tageswerte mit hoechstens einer Stelle', () => {
    expect(formatValue(148)).toBe('148')
    expect(formatValue(5.25)).toBe('5,3')
    expect(formatValue(2750)).toBe('2750')
  })

  it('tippt mit einer Nachkommastelle und sechs Stellen', () => {
    let t = ''
    for (const k of ['0', '5', ',', '2', '9'] as const) t = applyKey(t, k)
    expect(t).toBe('5,2')
    expect(applyKey('123456', '7')).toBe('123456')
    expect(applyKey('', ',')).toBe('0,')
    expect(applyKey('5,2', 'back')).toBe('5,')
    expect(textToValue('5,')).toBe(5)
    expect(textToValue('')).toBe(null)
  })

  it('liest Formularzahlen', () => {
    expect(parseNumber('150')).toBe(150)
    expect(parseNumber('5,5')).toBe(5.5)
    expect(parseNumber('2.800')).toBe(2800)
    expect(parseNumber('2.5')).toBe(2.5)
    expect(parseNumber('abc')).toBe(null)
  })
})
