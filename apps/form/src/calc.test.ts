import { describe, expect, it } from 'vitest'
import { imBereich, reihe, schritt, skala, stand, trend, trendStand, urteil, vorher, zielPrognose, zielStand } from './calc'
import { addDays } from './util'
import type { Wert } from './types'

const wert = (teil: Partial<Wert>): Wert => ({
  id: 'w',
  name: 'Gewicht',
  einheit: 'kg',
  richtung: 'weniger',
  ziel: null,
  erstellt: 1,
  ...teil,
})

describe('reihe und stand', () => {
  const log = { w: { '2026-10-05': 82.1, '2026-09-01': 84, '2026-10-01': 82.8 } }

  it('sortiert aelteste zuerst', () => {
    expect(reihe(log, 'w').map((p) => p.tag)).toEqual(['2026-09-01', '2026-10-01', '2026-10-05'])
    expect(reihe(log, 'fehlt')).toEqual([])
  })

  it('kennt ersten, letzten und vorletzten Eintrag', () => {
    const s = stand(reihe(log, 'w'))
    expect(s.erster?.zahl).toBe(84)
    expect(s.davor?.zahl).toBe(82.8)
    expect(s.letzter?.zahl).toBe(82.1)
    expect(s.anzahl).toBe(3)
  })

  it('ohne Eintraege ist alles leer', () => {
    expect(stand([])).toEqual({ letzter: undefined, davor: undefined, erster: undefined, anzahl: 0 })
  })

  it('vorher: der letzte Eintrag vor einem Tag', () => {
    const p = reihe(log, 'w')
    expect(vorher(p, '2026-10-05')?.zahl).toBe(82.8)
    expect(vorher(p, '2026-10-06')?.zahl).toBe(82.1)
    expect(vorher(p, '2026-09-01')).toBeUndefined()
  })
})

describe('urteil', () => {
  it('mehr ist besser', () => {
    expect(urteil('mehr', 0.5)).toBe('gut')
    expect(urteil('mehr', -0.5)).toBe('schlecht')
  })

  it('weniger ist besser', () => {
    expect(urteil('weniger', -0.5)).toBe('gut')
    expect(urteil('weniger', 0.5)).toBe('schlecht')
  })

  it('egal und keine Veraenderung sind neutral', () => {
    expect(urteil('egal', 3)).toBe('gleich')
    expect(urteil('mehr', 0)).toBe('gleich')
    expect(urteil('weniger', 0.001)).toBe('gleich')
  })
})

describe('zielStand', () => {
  it('ohne Ziel nichts', () => {
    expect(zielStand(wert({ ziel: null }), 80)).toBeNull()
  })

  it('weniger: erreicht bis zum Zielwert', () => {
    expect(zielStand(wert({ ziel: 80 }), 82.4)).toEqual({ erreicht: false, rest: 2.4 })
    expect(zielStand(wert({ ziel: 80 }), 80)).toEqual({ erreicht: true, rest: 0 })
    expect(zielStand(wert({ ziel: 80 }), 79.5)).toEqual({ erreicht: true, rest: 0 })
  })

  it('mehr: erreicht ab dem Zielwert', () => {
    expect(zielStand(wert({ richtung: 'mehr', ziel: 40 }), 37.5)).toEqual({ erreicht: false, rest: 2.5 })
    expect(zielStand(wert({ richtung: 'mehr', ziel: 40 }), 41)).toEqual({ erreicht: true, rest: 0 })
  })

  it('egal: Abstand in beide Richtungen, erreicht nur genau', () => {
    expect(zielStand(wert({ richtung: 'egal', ziel: 15 }), 16.2)).toEqual({ erreicht: false, rest: 1.2 })
    expect(zielStand(wert({ richtung: 'egal', ziel: 15 }), 14)).toEqual({ erreicht: false, rest: 1 })
    expect(zielStand(wert({ richtung: 'egal', ziel: 15 }), 15)).toEqual({ erreicht: true, rest: 0 })
  })
})

describe('imBereich', () => {
  const p = [
    { tag: '2025-09-01', zahl: 1 },
    { tag: '2026-06-01', zahl: 2 },
    { tag: '2026-07-08', zahl: 3 },
    { tag: '2026-10-01', zahl: 4 },
  ]

  it('3 Monate, 1 Jahr, alles', () => {
    expect(imBereich(p, '3m', '2026-10-08').map((x) => x.zahl)).toEqual([3, 4])
    expect(imBereich(p, '1j', '2026-10-08').map((x) => x.zahl)).toEqual([2, 3, 4])
    expect(imBereich(p, 'alles', '2026-10-08')).toHaveLength(4)
  })
})

describe('Achse', () => {
  it('schritt: 1, 2, 2,5, 5 mal Zehnerpotenz', () => {
    expect(schritt(2.4, 3)).toBe(1)
    expect(schritt(12, 3)).toBe(5)
    expect(schritt(0.6, 3)).toBe(0.2)
    expect(schritt(0, 3)).toBe(1)
  })

  it('skala umfasst Punkte und Ziel, auf schoene Zahlen', () => {
    const s = skala([82.4, 83.1, 81.9], 80)
    expect(s.min).toBeLessThanOrEqual(80)
    expect(s.max).toBeGreaterThanOrEqual(83.1)
    expect(s.ticks[0]).toBe(s.min)
    expect(s.ticks[s.ticks.length - 1]).toBe(s.max)
  })

  it('ein einzelner Wert bekommt trotzdem eine Spanne', () => {
    const s = skala([38])
    expect(s.min).toBeLessThan(38)
    expect(s.max).toBeGreaterThan(38)
  })

  it('geht bei positiven Werten nicht unter null', () => {
    expect(skala([0.2, 3]).min).toBe(0)
  })
})

describe('Trend', () => {
  it('Schnitt der Messungen aus den 7 Tagen bis zum Messtag', () => {
    const p = [
      { tag: '2026-10-01', zahl: 80 },
      { tag: '2026-10-03', zahl: 82 },
      { tag: '2026-10-08', zahl: 84 },
    ]
    // Am 8. zaehlt der 1. nicht mehr mit (7 Tage davor)
    expect(trend(p).map((x) => x.zahl)).toEqual([80, 81, 83])
  })

  // 28 Tage taeglich, jeden Tag 0,1 kg weniger
  const taeglich = Array.from({ length: 28 }, (_, i) => ({ tag: addDays('2026-09-16', i), zahl: Math.round((85 - i * 0.1) * 10) / 10 }))

  it('Tempo pro Woche aus den letzten 4 Wochen', () => {
    const t = trendStand(taeglich)!
    expect(t.proWoche).toBeCloseTo(-0.7)
    expect(t.jetzt).toBe(82.6)
  })

  it('erst ab etwa zwei Messungen pro Woche', () => {
    expect(trendStand(taeglich.filter((_, i) => i % 4 === 0))).toBeNull()
    expect(trendStand([])).toBeNull()
  })

  it('Prognose: wann das Ziel bei diesem Tempo erreicht ist', () => {
    const t = trendStand(taeglich)!
    const letzter = taeglich[taeglich.length - 1].tag
    expect(zielPrognose(wert({ ziel: 80 }), t, letzter)).toBe(addDays(letzter, 26))
  })

  it('keine Prognose ohne Ziel, wenn es weggeht, schon erreicht oder zu weit weg ist', () => {
    const t = trendStand(taeglich)!
    const letzter = taeglich[taeglich.length - 1].tag
    expect(zielPrognose(wert({}), t, letzter)).toBeNull()
    expect(zielPrognose(wert({ richtung: 'mehr', ziel: 90 }), t, letzter)).toBeNull()
    expect(zielPrognose(wert({ ziel: 83 }), t, letzter)).toBeNull()
    expect(zielPrognose(wert({ ziel: 5 }), t, letzter)).toBeNull()
  })
})
