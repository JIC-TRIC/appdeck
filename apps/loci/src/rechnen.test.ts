import { describe, expect, it } from 'vitest'
import { STUFEN, hinweisRechnen, maxStellen, ueberkreuz, zerlegen, zufallsaufgabe } from './rechnen'

describe('Aufgaben', () => {
  it('jede Stufe liefert Zahlen mit den richtigen Stellen, ohne Null am Ende', () => {
    for (const s of STUFEN) {
      for (let i = 0; i < 300; i++) {
        const { x, y } = zufallsaufgabe(s.id)
        expect(String(x)).toHaveLength(s.x)
        expect(String(y)).toHaveLength(s.y)
        expect(x % 10).not.toBe(0)
        expect(y % 10).not.toBe(0)
        if (s.y === 1) expect(y).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('nie zweimal dieselbe hintereinander', () => {
    const werte = [0, 0, 0, 0, 0.5, 0.5]
    const zufall = () => werte.shift() ?? 0.7
    const erste = zufallsaufgabe('2x1', null, () => 0)
    expect(zufallsaufgabe('2x1', erste, zufall)).not.toEqual(erste)
  })

  it('Ergebnis hat hoechstens so viele Stellen wie beide Faktoren zusammen', () => {
    expect(maxStellen(99, 99)).toBe(4)
    expect(String(99 * 99).length).toBeLessThanOrEqual(4)
  })
})

describe('Zerlegen', () => {
  it('47 × 86 wie in der Anleitung', () => {
    expect(zerlegen(47, 86)).toEqual({
      schritte: [
        { text: '47 × 80', klein: '47 × 8 = 376, eine Null dran', wert: '3760' },
        { text: '47 × 6', klein: undefined, wert: '282' },
      ],
      summe: { text: '3760 + 282', wert: '4042' },
    })
  })

  it('einstellig: die grosse Zahl nach Stellen, Nullen fallen weg', () => {
    expect(zerlegen(307, 6).schritte.map((s) => s.text)).toEqual(['300 × 6', '7 × 6'])
    expect(zerlegen(47, 6).summe).toEqual({ text: '240 + 42', wert: '282' })
  })

  it('drei Stellen: zwei Nullen', () => {
    expect(zerlegen(347, 286).schritte[0]).toEqual({ text: '347 × 200', klein: '347 × 2 = 694, zwei Nullen dran', wert: '69400' })
  })

  it('die Teilprodukte ergeben immer das Ergebnis', () => {
    for (const s of STUFEN) {
      for (let i = 0; i < 200; i++) {
        const { x, y } = zufallsaufgabe(s.id)
        const w = zerlegen(x, y)
        expect(w.schritte.reduce((sum, z) => sum + Number(z.wert), 0)).toBe(x * y)
        expect(w.summe.wert).toBe(String(x * y))
      }
    }
  })
})

describe('Ueberkreuz', () => {
  it('47 × 86 wie in der Anleitung', () => {
    expect(ueberkreuz(47, 86).schritte).toEqual([
      { text: 'Einer: 7·6 = 42', klein: 'schreibe 2, merke 4', wert: '2' },
      { text: 'Zehner: 4·6 + 7·8 = 80', klein: '+ 4 = 84 → schreibe 4, merke 8', wert: '4' },
      { text: 'Hunderter: 4·8 = 32', klein: '+ 8 = 40 → schreibe 40', wert: '40' },
    ])
  })

  it('3 × 3 hat fuenf Spalten mit 1, 2, 3, 2, 1 Paaren', () => {
    const w = ueberkreuz(347, 286)
    expect(w.schritte.map((s) => s.text.split('+').length)).toEqual([1, 2, 3, 2, 1])
    expect(w.schritte[2].text).toBe('Hunderter: 3·6 + 4·8 + 7·2 = 64')
  })

  it('von unten nach oben gelesen ergibt sich immer das Ergebnis', () => {
    for (const s of STUFEN) {
      for (let i = 0; i < 300; i++) {
        const { x, y } = zufallsaufgabe(s.id)
        const w = ueberkreuz(x, y)
        expect(w.schritte.map((z) => z.wert).reverse().join('')).toBe(String(x * y))
      }
    }
  })
})

describe('Hinweise', () => {
  it('eine Stelle um 1 daneben', () => {
    expect(hinweisRechnen(4042, 4142)).toEqual({ kurz: 'Übertrag vergessen?', text: 'Nur die Hunderterstelle ist um 1 daneben.' })
    expect(hinweisRechnen(4042, 4041)?.text).toBe('Nur die Einerstelle ist um 1 daneben.')
  })

  it('rueckwaerts eingetippt', () => {
    expect(hinweisRechnen(4042, 2404)?.kurz).toBe('Ziffern verdreht?')
  })

  it('sonst nichts', () => {
    expect(hinweisRechnen(4042, 4342)).toBeNull()
    expect(hinweisRechnen(4042, 404)).toBeNull()
    expect(hinweisRechnen(4042, 4152)).toBeNull()
    expect(hinweisRechnen(1111, 1111)).toBeNull()
  })
})
