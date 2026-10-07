import { describe, expect, it } from 'vitest'
import {
  anzahl,
  imStapelZuTitel,
  istGewaehlt,
  kopierText,
  merkeTitel,
  passendeTitel,
  TITEL_MAX,
  wann,
  zeitpunkt,
} from './text'
import type { Notiz } from './types'

// Ortszeit, wie auf dem iPhone
const ms = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime()
const JETZT = ms(2026, 10, 5, 18, 0) // Montag

describe('zeitpunkt', () => {
  it('ohne Jahr im laufenden Jahr, mit fuehrenden Nullen nur bei der Uhrzeit', () => {
    expect(zeitpunkt(ms(2026, 10, 5, 14, 32), JETZT)).toBe('5.10. 14:32')
    expect(zeitpunkt(ms(2026, 3, 1, 9, 5), JETZT)).toBe('1.3. 09:05')
  })

  it('mit Jahr, wenn es ein anderes ist', () => {
    expect(zeitpunkt(ms(2025, 12, 31, 23, 59), JETZT)).toBe('31.12.2025 23:59')
  })
})

describe('wann', () => {
  it('heute und gestern', () => {
    expect(wann(ms(2026, 10, 5, 0, 1), JETZT)).toBe('heute 00:01')
    expect(wann(ms(2026, 10, 4, 9, 5), JETZT)).toBe('gestern 09:05')
  })

  it('in der letzten Woche nur der Wochentag, danach mit Datum', () => {
    expect(wann(ms(2026, 10, 2, 18, 5), JETZT)).toBe('Fr 18:05')
    expect(wann(ms(2026, 9, 29, 8, 0), JETZT)).toBe('Di 08:00')
    expect(wann(ms(2026, 9, 28, 8, 0), JETZT)).toBe('Mo 28.9. 08:00')
  })
})

describe('anzahl', () => {
  it('Einzahl und Mehrzahl', () => {
    expect(anzahl(1)).toBe('1 Notiz')
    expect(anzahl(0)).toBe('0 Notizen')
    expect(anzahl(3)).toBe('3 Notizen')
  })
})

describe('kopierText', () => {
  const n = (titel: string, text: string, erstellt: number): Notiz => ({ id: String(erstellt), titel, text, erstellt })

  it('Titel fett mit Zeit, darunter die Notiz, eine Leerzeile dazwischen', () => {
    const text = kopierText(
      [
        n('Kontor', 'Baue einen CSV-Export.\nSpalten wie im Konto.', ms(2026, 10, 5, 14, 32)),
        n('Einkauf', 'Milch, Eier', ms(2026, 10, 5, 18, 5)),
      ],
      JETZT,
    )
    expect(text).toBe('*Kontor* · 5.10. 14:32\nBaue einen CSV-Export.\nSpalten wie im Konto.\n\n*Einkauf* · 5.10. 18:05\nMilch, Eier')
  })

  it('ohne Titel nur die Zeit (kursiv), ohne Text nur die Kopfzeile', () => {
    const text = kopierText([n('', 'Nur ein Gedanke', ms(2026, 10, 4, 7, 0)), n('Anrufen', '', ms(2026, 10, 4, 8, 0))], JETZT)
    expect(text).toBe('_4.10. 07:00_\nNur ein Gedanke\n\n*Anrufen* · 4.10. 08:00')
  })

  it('leerer Stapel ist leerer Text', () => {
    expect(kopierText([], JETZT)).toBe('')
  })
})

describe('Titel-Vorschlaege', () => {
  it('merkeTitel holt nach vorn, ohne Doppelte (Gross/klein egal), neue Schreibweise gewinnt', () => {
    expect(merkeTitel(['Kontor', 'Einkauf'], 'einkauf')).toEqual(['einkauf', 'Kontor'])
    expect(merkeTitel(['Kontor'], '  appdeck   Launcher ')).toEqual(['appdeck Launcher', 'Kontor'])
  })

  it('merkeTitel behaelt hoechstens TITEL_MAX', () => {
    let liste: string[] = []
    for (let i = 0; i < TITEL_MAX + 3; i += 1) liste = merkeTitel(liste, `T${i}`)
    expect(liste).toHaveLength(TITEL_MAX)
    expect(liste[0]).toBe(`T${TITEL_MAX + 2}`)
  })

  it('merkeTitel ignoriert leere Titel', () => {
    expect(merkeTitel(['A'], '   ')).toEqual(['A'])
  })

  it('passendeTitel filtert nach dem Getippten, leer zeigt alle', () => {
    const liste = ['Kontor', 'appdeck', 'Einkauf']
    expect(passendeTitel(liste, '')).toEqual(liste)
    expect(passendeTitel(liste, 'ko')).toEqual(['Kontor'])
    expect(passendeTitel(liste, 'e')).toEqual(['appdeck', 'Einkauf'])
    expect(passendeTitel(liste, 'xyz')).toEqual([])
  })

  it('istGewaehlt vergleicht ohne Gross/klein und Leerzeichen am Rand', () => {
    expect(istGewaehlt('Kontor', ' kontor ')).toBe(true)
    expect(istGewaehlt('Kontor', 'Kont')).toBe(false)
  })
})

describe('imStapelZuTitel', () => {
  const n = (id: string, titel: string, text = 'x'): Notiz => ({ id, titel, text, erstellt: Number(id) })
  const stapel = [n('1', 'Kontor'), n('2', 'Piano'), n('3', 'kontor', 'zweite'), n('4', ''), n('5', 'Kontor Ideen')]

  it('findet genau diesen Titel, Gross/klein und Leerzeichen egal, aelteste zuerst', () => {
    expect(imStapelZuTitel(stapel, '  KONTOR ').map((x) => x.id)).toEqual(['1', '3'])
  })

  it('findet nichts bei leerem Titel oder nur halb getipptem', () => {
    expect(imStapelZuTitel(stapel, '')).toEqual([])
    expect(imStapelZuTitel(stapel, 'Kon')).toEqual([])
  })
})
