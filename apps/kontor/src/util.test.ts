import { describe, expect, it } from 'vitest'
import {
  addDays,
  applyKey,
  centToPad,
  centToText,
  dateKey,
  formatCent,
  padToCent,
  periodRange,
  shiftPeriod,
  splitCent,
  textToCent,
  type PadKey,
} from './util'

describe('Geld', () => {
  it('rechnet den Eingabetext in ganze Cent um', () => {
    expect(textToCent('')).toBe(0)
    expect(textToCent('24')).toBe(2400)
    expect(textToCent('24,9')).toBe(2490)
    expect(textToCent('24,90')).toBe(2490)
    expect(textToCent('0,05')).toBe(5)
    expect(textToCent('1234,56')).toBe(123456)
  })

  it('centToText ist die Umkehrung von textToCent', () => {
    for (const cent of [0, 5, 90, 2400, 2490, 123456]) {
      expect(textToCent(centToText(cent))).toBe(cent)
    }
    expect(centToText(2400)).toBe('24')
    expect(centToText(2490)).toBe('24,90')
  })

  it('formatiert deutsch, Vorzeichen entscheidet der Aufrufer', () => {
    expect(formatCent(123456)).toBe('1.234,56')
    expect(formatCent(-5)).toBe('0,05')
    expect(splitCent(-123456)).toEqual({ neg: true, int: '1.234', frac: '56' })
  })

  it('Ziffernfeld: getippt wird in Cent, ohne Komma', () => {
    let text = ''
    for (const key of ['1', '6', '9'] as PadKey[]) text = applyKey(text, key)
    expect(padToCent(text)).toBe(169)
    expect(padToCent(applyKey('2', '00') + '0')).toBe(2000)
    expect(padToCent('')).toBe(0)
    expect(centToPad(2490)).toBe('2490')
    expect(centToPad(-5)).toBe('5')
  })

  it('Ziffernfeld: keine Null am Anfang, höchstens neun Stellen', () => {
    expect(applyKey('', '0')).toBe('')
    expect(applyKey('', '00')).toBe('')
    expect(applyKey('0', '5')).toBe('5')
    expect(applyKey('7', '00')).toBe('700')
    expect(applyKey('12345678', '00')).toBe('12345678')
    expect(applyKey('12345678', '9')).toBe('123456789')
    expect(applyKey('125', 'back')).toBe('12')
    expect(applyKey('125', 'clear')).toBe('')
  })
})

describe('Datum', () => {
  it('Datumsschlüssel sind lokal, nicht UTC - abends gebucht bleibt am selben Tag', () => {
    expect(dateKey(new Date(2026, 8, 27, 23, 30))).toBe('2026-09-27')
  })

  it('addDays über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('Zeiträume', () => {
  it('Monat umfasst den ganzen Kalendermonat', () => {
    const r = periodRange('month', '2026-02-14')
    expect([r.from, r.to, r.label]).toEqual(['2026-02-01', '2026-02-28', 'Februar 2026'])
  })

  it('Woche beginnt je nach Einstellung am Montag oder Sonntag', () => {
    // 2026-09-27 ist ein Sonntag
    expect(periodRange('week', '2026-09-27', 1).from).toBe('2026-09-21')
    expect(periodRange('week', '2026-09-27', 0).from).toBe('2026-09-27')
    expect(periodRange('week', '2026-09-27', 1).to).toBe('2026-09-27')
  })

  it('Kalenderwoche nach ISO 8601, auch über den Jahreswechsel', () => {
    expect(periodRange('week', '2026-09-21', 1).sub).toBe('Kalenderwoche 39')
    // 2026 hat 53 Wochen, der 1.1.2027 gehoert noch zur KW 53
    expect(periodRange('week', '2027-01-01', 1).sub).toBe('Kalenderwoche 53')
  })

  it('Blättern über Monatsenden springt keinen Monat über', () => {
    expect(shiftPeriod('month', '2026-01-31', 1)).toBe('2026-02-01')
    expect(shiftPeriod('month', '2026-03-31', -1)).toBe('2026-02-01')
    expect(shiftPeriod('week', '2026-09-24', 1, 1)).toBe('2026-09-28')
  })

  it('Gesamt hat keine Grenzen', () => {
    const r = periodRange('all', '2026-09-27', 1, '2025-03-01')
    expect([r.from, r.to, r.sub]).toEqual([null, null, 'seit 01.03.2025'])
  })
})
