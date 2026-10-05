import { describe, expect, it } from 'vitest'
import { LEER, addiere, quote, schnitt, schwaechen, schwaechenRechnen, zaehle } from './statistik'
import type { Aufgabe, RechenAufgabe } from './types'

const a = (d: string, r: boolean, z = 5000, t = 0): Aufgabe => ({ d, a: 1, r, z, t })

describe('Zaehlen', () => {
  it('richtig, falsch und mit Tipp', () => {
    const g = zaehle([a('1987-03-14', true, 6000), a('1987-03-15', false, 9000), a('1987-03-16', true, 3000, 2), a('1987-03-17', true, 4000)])
    expect(g).toEqual({ anzahl: 4, richtig: 2, mitTipp: 1, zeitRichtig: 10000, best: 4000 })
    expect(quote(g)).toBe(50)
    expect(schnitt(g)).toBe(5000)
  })

  it('mit Tipp zaehlt nicht fuer Bestzeit und Schnitt', () => {
    const g = addiere(LEER, a('2000-01-01', true, 1000, 1))
    expect(g.best).toBeNull()
    expect(schnitt(g)).toBeNull()
    expect(quote(g)).toBe(0)
  })

  it('leer', () => {
    expect(quote(LEER)).toBeNull()
    expect(schnitt(LEER)).toBeNull()
  })
})

describe('Schwaechen', () => {
  // 20 Aufgaben: Februar 1964 (Schaltjahr) 4 von 5 falsch, sonst alles richtig.
  const basis = [
    ...Array.from({ length: 5 }, (_, i) => a(`1964-02-${String(i + 1).padStart(2, '0')}`, i === 0)),
    ...Array.from({ length: 15 }, (_, i) => a(`1987-${String((i % 10) + 3).padStart(2, '0')}-10`, true)),
  ]

  it('erst ab 20 Aufgaben', () => {
    expect(schwaechen(basis.slice(0, 19))).toBeNull()
    expect(schwaechen(basis)).not.toBeNull()
  })

  it('Gruppen ueber dem Schnitt, die schlechteste zuerst', () => {
    const s = schwaechen(basis)!
    expect(s.schnitt).toBeCloseTo(4 / 20)
    expect(s.gruppen.map((g) => g.name)).toEqual(['Februar', 'Schaltjahr, Januar und Februar'])
    expect(s.gruppen[0]).toEqual({ name: 'Februar', falsch: 4, anzahl: 5 })
  })

  it('Gruppen unter 5 Aufgaben zaehlen nicht, hoechstens 3', () => {
    const viele = [
      ...basis,
      ...Array.from({ length: 4 }, () => a('1650-07-01', false)),
      ...Array.from({ length: 5 }, () => a('1750-07-01', false)),
      ...Array.from({ length: 5 }, () => a('1850-07-01', false)),
    ]
    const s = schwaechen(viele)!
    expect(s.gruppen).toHaveLength(3)
    expect(s.gruppen.some((g) => g.name === '1600er')).toBe(false)
  })

  it('mit Tipp zaehlt wie falsch', () => {
    const tipps = basis.map((x, i) => (i < 5 ? { ...x, r: true, t: 1 } : x))
    expect(schwaechen(tipps)!.gruppen[0]).toEqual({ name: 'Februar', falsch: 5, anzahl: 5 })
  })

  it('ohne Fehler keine Schwaechen', () => {
    expect(schwaechen(basis.map((x) => ({ ...x, r: true })))!.gruppen).toEqual([])
  })

  it('nur die letzten 200', () => {
    const alt = Array.from({ length: 50 }, () => a('1700-01-01', false))
    const neu = Array.from({ length: 200 }, () => a('2000-06-01', true))
    expect(schwaechen([...alt, ...neu])!.schnitt).toBe(0)
  })
})

describe('Schwaechen beim Rechnen', () => {
  const r = (x: number, y: number, richtig: boolean): RechenAufgabe => ({ x, y, a: richtig ? x * y : 0, r: richtig, z: 5000, t: 0 })

  it('nach Stufe und nach Ziffern', () => {
    // 2 × 2 mit einer 7 geht oft schief, 2 × 1 ohne 7 klappt.
    const liste = [
      ...Array.from({ length: 6 }, (_, i) => r(47, 23, i === 0)),
      ...Array.from({ length: 14 }, () => r(32, 4, true)),
    ]
    const s = schwaechenRechnen(liste)!
    expect(s.schnitt).toBeCloseTo(5 / 20)
    expect(s.gruppen[0]).toEqual({ name: 'Stufe 2 × 2', falsch: 5, anzahl: 6 })
    expect(s.gruppen.some((g) => g.name === 'mit einer 7')).toBe(true)
    expect(s.gruppen.some((g) => g.name === 'Stufe 2 × 1')).toBe(false)
  })

  it('eine Ziffer zaehlt pro Aufgabe nur einmal', () => {
    const liste = Array.from({ length: 20 }, (_, i) => r(77, 7, i < 10))
    const s = schwaechenRechnen(liste, { max: 10 })!
    expect(s.gruppen).toEqual([])
    expect(s.schnitt).toBe(0.5)
  })
})
