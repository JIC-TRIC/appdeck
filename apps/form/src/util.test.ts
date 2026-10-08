import { describe, expect, it } from 'vitest'
import { addMonths, diffDays, formatDiff, formatTag, formatZahl, istTag, parseZahl, relativTag, wieLange } from './util'

describe('formatZahl', () => {
  it('setzt ein Komma und laesst Nullen am Ende weg', () => {
    expect(formatZahl(82.4)).toBe('82,4')
    expect(formatZahl(82.45)).toBe('82,45')
    expect(formatZahl(82)).toBe('82')
    expect(formatZahl(100)).toBe('100')
    expect(formatZahl(10.5)).toBe('10,5')
    expect(formatZahl(0)).toBe('0')
  })

  it('rundet auf zwei Stellen und zeigt kein -0', () => {
    expect(formatZahl(82.456)).toBe('82,46')
    expect(formatZahl(-0.001)).toBe('0')
    expect(formatZahl(-1.5)).toBe('−1,5')
  })
})

describe('formatDiff', () => {
  it('mit Vorzeichen, ±0 bei keiner Veraenderung', () => {
    expect(formatDiff(1.2)).toBe('+1,2')
    expect(formatDiff(-0.6)).toBe('−0,6')
    expect(formatDiff(0)).toBe('±0')
    expect(formatDiff(0.001)).toBe('±0')
  })
})

describe('parseZahl', () => {
  it('versteht Komma und Punkt', () => {
    expect(parseZahl('82,4')).toBe(82.4)
    expect(parseZahl('82.4')).toBe(82.4)
    expect(parseZahl(' 82 ')).toBe(82)
    expect(parseZahl('82,')).toBe(82)
    expect(parseZahl(',5')).toBe(0.5)
  })

  it('Punkt mit drei Ziffern danach ist ein Tausenderpunkt', () => {
    expect(parseZahl('1.234,5')).toBe(1234.5)
    expect(parseZahl('2.500')).toBe(2500)
  })

  it('rundet auf zwei Stellen', () => {
    expect(parseZahl('82,456')).toBe(82.46)
  })

  it('null bei leerem Feld oder keiner Zahl', () => {
    expect(parseZahl('')).toBeNull()
    expect(parseZahl('   ')).toBeNull()
    expect(parseZahl('abc')).toBeNull()
    expect(parseZahl('8,2,1')).toBeNull()
    expect(parseZahl('-')).toBeNull()
  })
})

describe('Datum', () => {
  it('istTag prueft Form und Kalender', () => {
    expect(istTag('2026-10-08')).toBe(true)
    expect(istTag('2026-02-30')).toBe(false)
    expect(istTag('2026-1-8')).toBe(false)
    expect(istTag(20261008)).toBe(false)
  })

  it('addMonths bleibt am Monatsende im Zielmonat', () => {
    expect(addMonths('2026-10-08', -3)).toBe('2026-07-08')
    expect(addMonths('2026-05-31', -3)).toBe('2026-02-28')
    expect(addMonths('2028-05-31', -3)).toBe('2028-02-29')
    expect(addMonths('2026-01-15', -12)).toBe('2025-01-15')
  })

  it('diffDays ueber die Zeitumstellung', () => {
    expect(diffDays('2026-03-28', '2026-03-30')).toBe(2)
    expect(diffDays('2026-10-24', '2026-10-26')).toBe(2)
  })

  it('wieLange: heute, gestern, Tage, dann Datum', () => {
    expect(wieLange('2026-10-08', '2026-10-08')).toBe('heute')
    expect(wieLange('2026-10-07', '2026-10-08')).toBe('gestern')
    expect(wieLange('2026-10-05', '2026-10-08')).toBe('vor 3 Tagen')
    expect(wieLange('2026-09-20', '2026-10-08')).toBe('20. Sep')
    expect(wieLange('2025-09-20', '2026-10-08')).toBe('20. Sep 2025')
  })

  it('formatTag und relativTag', () => {
    expect(formatTag('2026-10-01', '2026-10-08')).toBe('Do 1. Okt')
    expect(relativTag('2026-10-08', '2026-10-08')).toBe('Heute')
    expect(relativTag('2026-10-07', '2026-10-08')).toBe('Gestern')
    expect(relativTag('2026-10-01', '2026-10-08')).toBe('Do 1. Okt')
  })
})
