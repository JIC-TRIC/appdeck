import { describe, expect, it } from 'vitest'
import { abstand, angelegtText, erledigtTitel, faelligArt, faelligText, istTag, plusTage, tagLang, wannKurz } from './tage'

// Beispiel wie in den Mockups: Freitag, 23. Oktober 2026
const HEUTE = '2026-10-23'
const um = (tag: string, h = 12, m = 0) => {
  const [y, mo, d] = tag.split('-').map(Number)
  return new Date(y, mo - 1, d, h, m).getTime()
}

describe('Tage', () => {
  it('erkennt nur echte Tage', () => {
    expect(istTag('2026-10-23')).toBe(true)
    expect(istTag('2026-02-30')).toBe(false)
    expect(istTag('2026-1-5')).toBe(false)
    expect(istTag(20261023)).toBe(false)
    expect(istTag(null)).toBe(false)
  })

  it('rechnet ueber Monats- und Jahresgrenzen und die Zeitumstellung', () => {
    expect(plusTage(HEUTE, 1)).toBe('2026-10-24')
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01')
    expect(abstand('2026-10-24', '2026-10-26')).toBe(2) // Umstellung in der Nacht zum 25.
    expect(abstand(HEUTE, '2026-10-22')).toBe(-1)
  })
})

describe('Fällig', () => {
  it('zeigt die Tage wie im Konzept', () => {
    expect(faelligText('2026-10-02', HEUTE)).toBe('seit 2. Okt')
    expect(faelligText('2026-10-19', HEUTE)).toBe('seit Mo')
    expect(faelligText('2026-10-22', HEUTE)).toBe('gestern')
    expect(faelligText(HEUTE, HEUTE)).toBe('heute')
    expect(faelligText('2026-10-24', HEUTE)).toBe('morgen')
    expect(faelligText('2026-10-28', HEUTE)).toBe('Mi')
    expect(faelligText('2026-10-30', HEUTE)).toBe('30. Okt')
    expect(faelligText('2026-11-10', HEUTE)).toBe('10. Nov')
    expect(faelligText('2027-01-15', HEUTE)).toBe('15. Jan 2027')
    expect(faelligText('2025-12-20', HEUTE)).toBe('seit 20. Dez 2025')
  })

  it('unterscheidet ueberfaellig, heute und spaeter', () => {
    expect(faelligArt('2026-10-22', HEUTE)).toBe('ueber')
    expect(faelligArt(HEUTE, HEUTE)).toBe('heute')
    expect(faelligArt('2026-10-24', HEUTE)).toBe('spaeter')
  })

  it('schreibt den Tag aus', () => {
    expect(tagLang('2026-10-24', HEUTE)).toBe('Samstag, 24. Oktober')
    expect(tagLang('2027-01-15', HEUTE)).toBe('Freitag, 15. Januar 2027')
  })
})

describe('Erledigt und angelegt', () => {
  it('nennt Heute, Gestern, dann Wochentag und Datum', () => {
    expect(erledigtTitel(um(HEUTE), HEUTE)).toBe('Heute')
    expect(erledigtTitel(um('2026-10-22'), HEUTE)).toBe('Gestern')
    expect(erledigtTitel(um('2026-10-21'), HEUTE)).toBe('Mittwoch, 21. Okt')
    expect(wannKurz(um('2026-10-02'), HEUTE)).toBe('2. Okt')
  })

  it('sagt, wann ein Todo angelegt wurde', () => {
    expect(angelegtText(um(HEUTE, 14, 5), HEUTE)).toBe('Angelegt heute um 14:05')
    expect(angelegtText(um('2026-10-19'), HEUTE)).toBe('Angelegt am Montag, 19. Oktober')
  })
})
