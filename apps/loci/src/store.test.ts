import { describe, expect, it } from 'vitest'
import { STANDARD, normalisiereEinstellungen, normalisiereVersuche, normalisiereWochentag } from './store'

describe('Einstellungen lesen', () => {
  it('nichts gespeichert: Standard', () => {
    expect(normalisiereEinstellungen(null)).toEqual(STANDARD)
    expect(normalisiereEinstellungen('Unsinn')).toEqual(STANDARD)
  })

  it('gueltige Werte bleiben', () => {
    const e = {
      reiter: 'karten',
      uhr: false,
      zeitraum: { id: 'eigen', von: 1750, bis: 1850 },
      deck: { anzahl: 20, taktAn: true, takt: 2.5 },
      anleitungGesehen: true,
    }
    expect(normalisiereEinstellungen(e)).toEqual(e)
  })

  it('ungueltige Werte fallen auf den Standard zurueck', () => {
    const e = normalisiereEinstellungen({
      reiter: 'statistik',
      uhr: 'ja',
      zeitraum: { id: 'eigen', von: 1900, bis: 1800 },
      deck: { anzahl: 30, taktAn: 'ja', takt: 0.2 },
    })
    expect(e).toEqual(STANDARD)
  })

  it('Takt auf halbe Sekunden', () => {
    expect(normalisiereEinstellungen({ deck: { takt: 2.3 } }).deck.takt).toBe(2.5)
  })
})

describe('Statistik lesen', () => {
  it('Wochentag: kaputte Eintraege fallen weg', () => {
    const w = normalisiereWochentag({
      gesamt: { anzahl: 3, richtig: 2, mitTipp: 0, zeitRichtig: 9000, best: 4000 },
      letzte: [{ d: '1987-03-14', a: 6, r: true, z: 5000, t: 0 }, { d: 'gestern', a: 1, r: true, z: 1, t: 0 }, null],
    })
    expect(w.gesamt.best).toBe(4000)
    expect(w.letzte).toHaveLength(1)
    expect(normalisiereWochentag(undefined)).toEqual({
      gesamt: { anzahl: 0, richtig: 0, mitTipp: 0, zeitRichtig: 0, best: null },
      letzte: [],
    })
  })

  it('Kartendeck: nur gueltige Versuche', () => {
    const ok = { zeit: 1, n: 52, bisFehler: 31, richtig: 47, merk: 372000, wieder: 280000, takt: 3 }
    expect(normalisiereVersuche([ok, { ...ok, n: 30 }, { ...ok, takt: 'schnell' }, 'x'])).toEqual([ok])
    expect(normalisiereVersuche({})).toEqual([])
  })
})
