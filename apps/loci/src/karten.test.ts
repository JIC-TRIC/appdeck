import { describe, expect, it } from 'vitest'
import { KARTE, KARTEN, bestzeiten, lege, loesche, mische, naechsterFreierPlatz, wertung, type Antworten } from './karten'
import type { Versuch } from './types'

describe('Deck', () => {
  it('52 verschiedene Karten mit den Namen der Bilddateien', () => {
    expect(KARTEN).toHaveLength(52)
    expect(new Set(KARTEN.map((k) => k.id)).size).toBe(52)
    expect(KARTE['herz-k'].name).toBe('Herz König')
    expect(KARTE['pik-ass'].wert.kurz).toBe('A')
    expect(KARTE['karo-10'].farbe.rot).toBe(true)
  })

  it('Mischen ergibt eine Umordnung derselben Karten', () => {
    const ids = KARTEN.map((k) => k.id)
    const gemischt = mische(ids)
    expect(gemischt).toHaveLength(52)
    expect([...gemischt].sort()).toEqual([...ids].sort())
    expect(ids[0]).toBe('pik-ass')
  })

  it('Mischen mit festem Zufall', () => {
    expect(mische([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1])
    expect(mische([1, 2, 3, 4], (n) => n - 1)).toEqual([1, 2, 3, 4])
  })
})

describe('Wiedergeben', () => {
  const leer = (n: number): Antworten => Array(n).fill(null)

  it('naechste freie Stelle ringsum', () => {
    expect(naechsterFreierPlatz(['a', null, 'c', null], 2)).toBe(3)
    expect(naechsterFreierPlatz(['a', null, 'c', 'd'], 2)).toBe(1)
    expect(naechsterFreierPlatz(['a', 'b'], 0)).toBe(2)
  })

  it('legen fuellt die aktive Stelle und springt zur naechsten freien', () => {
    let s = { antworten: leer(3), aktiv: 0 }
    s = lege(s, 'pik-ass')
    expect(s).toEqual({ antworten: ['pik-ass', null, null], aktiv: 1 })
    s = lege({ ...s, aktiv: 2 }, 'herz-2')
    expect(s).toEqual({ antworten: ['pik-ass', null, 'herz-2'], aktiv: 1 })
    s = lege(s, 'herz-3')
    expect(s.aktiv).toBe(3)
    expect(lege(s, 'herz-4')).toEqual(s)
  })

  it('eine belegte Stelle wird ersetzt, doppelte Karten sind erlaubt', () => {
    const s = lege({ antworten: ['pik-ass', 'herz-2', null], aktiv: 0 }, 'herz-2')
    expect(s).toEqual({ antworten: ['herz-2', 'herz-2', null], aktiv: 2 })
  })

  it('⌫ leert erst die aktive Stelle, wenn sie belegt ist', () => {
    expect(loesche({ antworten: ['a', 'b', null], aktiv: 1 })).toEqual({ antworten: ['a', null, null], aktiv: 1 })
  })

  it('⌫ leert sonst die letzte belegte Stelle davor', () => {
    expect(loesche({ antworten: ['a', null, 'c', null], aktiv: 3 })).toEqual({ antworten: ['a', null, null, null], aktiv: 2 })
    expect(loesche({ antworten: ['a', 'b'], aktiv: 2 })).toEqual({ antworten: ['a', null], aktiv: 1 })
  })

  it('⌫ ohne belegte Stelle davor aendert nichts', () => {
    const s = { antworten: [null, 'b'], aktiv: 0 }
    expect(loesche(s)).toEqual(s)
  })
})

describe('Wertung', () => {
  const deck = ['a', 'b', 'c', 'd', 'e']

  it('fehlerfrei', () => {
    expect(wertung(deck, [...deck])).toEqual({ n: 5, bisFehler: 5, richtig: 5 })
  })

  it('bis zum ersten Fehler und alle Treffer', () => {
    expect(wertung(deck, ['a', 'b', 'd', 'c', 'e'])).toEqual({ n: 5, bisFehler: 2, richtig: 3 })
  })

  it('eine leere Stelle beendet die Reihe', () => {
    expect(wertung(deck, ['a', null, 'c', 'd', 'e'])).toEqual({ n: 5, bisFehler: 1, richtig: 4 })
  })

  it('doppelt gelegt ist hoechstens einmal richtig', () => {
    expect(wertung(deck, ['b', 'b', 'b', 'b', 'b'])).toEqual({ n: 5, bisFehler: 0, richtig: 1 })
  })

  it('Bestzeiten nur fehlerfrei, je Deckgroesse', () => {
    const v = (n: number, richtig: number, merk: number): Versuch => ({ zeit: 0, n, bisFehler: richtig, richtig, merk, wieder: 0, takt: null })
    expect(bestzeiten([v(10, 10, 50000), v(10, 9, 30000), v(10, 10, 48000), v(52, 51, 300000)])).toEqual({
      10: 48000,
      20: null,
      26: null,
      52: null,
    })
  })
})
