import { describe, expect, it } from 'vitest'
import {
  ausIso,
  bausteine,
  diesesJahr,
  hinweis,
  istSchaltjahr,
  jahre,
  kalenderWochentag,
  loese,
  pruefeEigenen,
  zeitraumName,
  zufallsdatum,
} from './wochentag'
import type { Datum } from './types'

const tag = (j: number, m: number, t: number): Datum => ({ j, m, t })

function* tage(von: number, bis: number, schritt = 1) {
  const ende = Date.UTC(bis, 11, 31)
  for (let ms = Date.UTC(von, 0, 1); ms <= ende; ms += schritt * 864e5) {
    const d = new Date(ms)
    yield tag(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
  }
}

describe('Methode gegen den Kalender', () => {
  it('stimmt fuer jeden Tag von 1583 bis 2400', () => {
    let falsch = 0
    for (const d of tage(1583, 2400)) if (loese(d).ergebnis !== kalenderWochentag(d)) falsch++
    expect(falsch).toBe(0)
  })

  it('stimmt fuer Stichproben bis 9999', () => {
    let falsch = 0
    for (const d of tage(2401, 9999, 97)) if (loese(d).ergebnis !== kalenderWochentag(d)) falsch++
    expect(falsch).toBe(0)
  })
})

describe('Schaltjahr', () => {
  it('folgt dem gregorianischen Kalender', () => {
    expect([1600, 2000, 2024, 1964].map(istSchaltjahr)).toEqual([true, true, true, true])
    expect([1700, 1800, 1900, 2100, 2026].map(istSchaltjahr)).toEqual([false, false, false, false, false])
  })
})

describe('Rechenweg', () => {
  it('17. Februar 1964: mit Abkuerzung und Schaltjahr-Korrektur', () => {
    const l = loese(tag(1964, 2, 17))
    expect(l.ergebnis).toBe(1)
    expect(l.schritte).toEqual([
      { text: 'Tag', wert: '17' },
      { text: 'Monat Februar', wert: '3' },
      { text: 'Jahr 64: 64 + 16 = 80', klein: 'Abkürzung: 64 − 56 = 8 → 8 + 2 = 10 → 3', wert: '3' },
      { text: 'Jahrhundert 19xx', wert: '0' },
      { text: 'Schaltjahr-Korrektur', klein: '1964 ist Schaltjahr, Februar', wert: '−1' },
    ])
    expect(l.summe).toEqual({ text: '17 + 3 + 3 + 0 − 1 = 22', klein: '22 mod 7 = 1', wert: 'Montag' })
  })

  it('14. März 1987: Samstag', () => {
    const l = loese(tag(1987, 3, 14))
    expect(l.schritte[2].klein).toBe('Abkürzung: 87 − 84 = 3 → 3 + 0 = 3')
    expect(l.schritte[4]).toEqual({ text: 'Schaltjahr-Korrektur', klein: '1987 ist kein Schaltjahr', wert: '–' })
    expect(l.summe).toEqual({ text: '14 + 3 + 3 + 0 = 20', klein: '20 mod 7 = 6', wert: 'Samstag' })
  })

  it('29. Februar 2024: Donnerstag', () => {
    expect(loese(tag(2024, 2, 29)).summe.wert).toBe('Donnerstag')
  })

  it('Jahre unter 28 ohne Abkuerzung, Schaltjahr ab Maerz ohne Korrektur', () => {
    const l = loese(tag(2024, 7, 1))
    expect(l.schritte[2]).toEqual({ text: 'Jahr 24: 24 + 6 = 30', klein: undefined, wert: '2' })
    expect(l.schritte[4].wert).toBe('–')
    expect(l.schritte[4].klein).toBe('2024 ist Schaltjahr, gilt aber nur für Jan/Feb')
  })

  it('volle Jahrhunderte', () => {
    expect(loese(tag(2000, 1, 1)).schritte[2].text).toBe('Jahr 00: 0 + 0 = 0')
    expect(loese(tag(1900, 1, 1)).schritte[4].klein).toBe('1900 ist kein Schaltjahr')
    expect(loese(tag(1600, 2, 1)).schritte[4].wert).toBe('−1')
  })
})

describe('Hinweise bei typischen Fehlern', () => {
  it('Korrektur vergessen: Jan/Feb im Schaltjahr, einen Tag zu spaet', () => {
    expect(hinweis(tag(1964, 2, 17), 2, 1)?.kurz).toBe('Schaltjahr-Korrektur vergessen?')
    expect(hinweis(tag(2024, 1, 7), 1, 0)?.kurz).toBe('Schaltjahr-Korrektur vergessen?')
  })

  it('Korrektur zu viel: ab Maerz im Schaltjahr, einen Tag zu frueh', () => {
    expect(hinweis(tag(2024, 3, 1), 4, 5)?.text).toBe('Die Schaltjahr-Korrektur gilt nur für Januar und Februar.')
    expect(hinweis(tag(2024, 3, 1), 6, 0)).not.toBeNull()
  })

  it('sonst kein Hinweis', () => {
    expect(hinweis(tag(1987, 3, 14), 5, 6)).toBeNull()
    expect(hinweis(tag(1964, 2, 17), 3, 1)).toBeNull()
    expect(hinweis(tag(2024, 3, 1), 6, 5)).toBeNull()
  })
})

describe('Tipp', () => {
  it('24. September 2041 wie in den Mockups', () => {
    expect(bausteine(tag(2041, 9, 24))).toEqual([
      { name: 'Tag', rechnung: '24 − 21', wert: '3' },
      { name: 'Monat', rechnung: 'September', wert: '5' },
      { name: 'Jahr', rechnung: '41 − 28 = 13 → 13 + 3 = 16 → 2', wert: '2' },
      { name: 'Jahrhundert', rechnung: '20xx', wert: '6' },
      { name: 'Schaltjahr', rechnung: 'kein Schaltjahr', wert: '0' },
    ])
  })

  it('die Bausteine ergeben zusammen den Wochentag', () => {
    for (const d of tage(1583, 2400, 13)) {
      const summe = bausteine(d).reduce((s, b) => s + Number(b.wert.replace('−', '-')), 0)
      expect(((summe % 7) + 7) % 7).toBe(kalenderWochentag(d))
    }
  })

  it('kleine Tage ohne Abzug, Jahre unter 28 mit mod 7', () => {
    const b = bausteine(tag(2024, 2, 3))
    expect(b[0]).toEqual({ name: 'Tag', rechnung: '3', wert: '3' })
    expect(b[2]).toEqual({ name: 'Jahr', rechnung: '24 + 6 = 30 → 2', wert: '2' })
    expect(b[4]).toEqual({ name: 'Schaltjahr', rechnung: 'Schaltjahr, Februar', wert: '−1' })
  })
})

describe('Zeitraum', () => {
  it('feste Zeitraeume, dieses Jahr und eigener', () => {
    expect(jahre({ id: '1900', von: 1, bis: 1 })).toEqual({ von: 1900, bis: 2099 })
    expect(jahre({ id: '1600', von: 1, bis: 1 })).toEqual({ von: 1600, bis: 2399 })
    expect(jahre({ id: 'jahr', von: 1900, bis: 2099 }, 2026)).toEqual({ von: 2026, bis: 2026 })
    expect(jahre({ id: 'eigen', von: 1750, bis: 1850 })).toEqual({ von: 1750, bis: 1850 })
    expect(zeitraumName({ id: 'jahr', von: 0, bis: 0 }, 2026)).toBe('2026')
    expect(zeitraumName({ id: 'eigen', von: 1750, bis: 1850 })).toBe('1750–1850')
  })

  it('prueft eigene Zeitraeume', () => {
    expect(pruefeEigenen(1750, 1850)).toBeNull()
    expect(pruefeEigenen(1583, 1583)).toBeNull()
    expect(pruefeEigenen(1582, 1850)).not.toBeNull()
    expect(pruefeEigenen(1900, 1800)).not.toBeNull()
    expect(pruefeEigenen(1900.5, 2000)).not.toBeNull()
    expect(pruefeEigenen(1900, 10000)).not.toBeNull()
  })

  it('Zufallsdatum bleibt im Zeitraum und wiederholt sich nicht direkt', () => {
    for (let i = 0; i < 500; i++) {
      const d = zufallsdatum({ von: 1750, bis: 1850 })
      expect(d.j).toBeGreaterThanOrEqual(1750)
      expect(d.j).toBeLessThanOrEqual(1850)
      expect(ausIso(`${d.j}-${String(d.m).padStart(2, '0')}-${String(d.t).padStart(2, '0')}`)).toEqual(d)
    }
    const werte = [0, 0, 0.5]
    const zufall = () => werte.shift()!
    const vorher = zufallsdatum({ von: 2026, bis: 2026 }, null, () => 0)
    expect(vorher).toEqual(tag(2026, 1, 1))
    expect(zufallsdatum({ von: 2026, bis: 2026 }, vorher, zufall)).not.toEqual(vorher)
  })

  it('erster und letzter Tag sind erreichbar', () => {
    expect(zufallsdatum({ von: 1583, bis: 1583 }, null, () => 0)).toEqual(tag(1583, 1, 1))
    expect(zufallsdatum({ von: 9999, bis: 9999 }, null, () => 0.999999)).toEqual(tag(9999, 12, 31))
  })

  it('dieses Jahr: Tag + Monat + Rest', () => {
    expect(diesesJahr(2026)).toEqual({ jahr: 4, jhd: 6, summe: 10, rest: 3, schalt: false })
    expect(diesesJahr(2028).schalt).toBe(true)
  })
})

describe('ausIso', () => {
  it('nur echte Tage ab 1583', () => {
    expect(ausIso('1987-03-14')).toEqual(tag(1987, 3, 14))
    expect(ausIso('2024-02-29')).toEqual(tag(2024, 2, 29))
    expect(ausIso('2023-02-29')).toBeNull()
    expect(ausIso('1582-12-31')).toBeNull()
    expect(ausIso('')).toBeNull()
  })
})
