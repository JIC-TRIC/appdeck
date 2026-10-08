import { beforeEach, describe, expect, it } from 'vitest'
import { getLog, getWerte, loescheWert, normalisiereLog, normalisiereWerte, setzeMessung, speichereWert } from './store'

// localStorage gibt es in der Node-Testumgebung nicht - ein einfacher Ersatz.
class Speicher {
  private m = new Map<string, string>()
  getItem(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null
  }
  setItem(k: string, v: string) {
    this.m.set(k, String(v))
  }
  removeItem(k: string) {
    this.m.delete(k)
  }
  clear() {
    this.m.clear()
  }
}

beforeEach(() => {
  ;(globalThis as { localStorage?: unknown }).localStorage = new Speicher()
})

describe('normalisiereWerte', () => {
  it('verwirft Kaputtes und Doppeltes, sortiert nach Anlegen', () => {
    const raw = [
      { id: 'b', name: '  Bizeps   rechts ', einheit: 'cm', richtung: 'mehr', ziel: 40, erstellt: 20 },
      { id: 'a', name: 'Gewicht', einheit: 'kg', richtung: 'weniger', ziel: null, erstellt: 10 },
      { id: 'a', name: 'Doppelt', erstellt: 30 },
      { id: 'c', name: '   ', erstellt: 40 },
      { name: 'ohne id' },
      'Quatsch',
    ]
    const w = normalisiereWerte(raw)
    expect(w.map((x) => x.id)).toEqual(['a', 'b'])
    expect(w[1].name).toBe('Bizeps rechts')
  })

  it('fuellt Fehlendes sinnvoll auf', () => {
    const [w] = normalisiereWerte([{ id: 'x', name: 'Taille', richtung: 'seitwaerts', ziel: 'viel' }])
    expect(w).toEqual({ id: 'x', name: 'Taille', einheit: '', richtung: 'egal', ziel: null, erstellt: 0 })
  })

  it('kein Array: leer', () => {
    expect(normalisiereWerte(null)).toEqual([])
    expect(normalisiereWerte({})).toEqual([])
  })
})

describe('normalisiereLog', () => {
  it('nur echte Tage mit endlichen Zahlen', () => {
    const log = normalisiereLog({
      a: { '2026-10-08': 82.456, '2026-02-30': 1, gestern: 2, '2026-10-07': 'viel', '2026-10-06': null },
      b: { '2026-10-08': Infinity },
      c: 'Quatsch',
    })
    expect(log).toEqual({ a: { '2026-10-08': 82.46 } })
  })
})

describe('Werte anlegen, aendern, loeschen', () => {
  it('legt an und haengt hinten an', () => {
    speichereWert({ name: 'Gewicht', einheit: 'kg', richtung: 'weniger', ziel: 80 }, undefined, 10)
    speichereWert({ name: 'Bizeps', einheit: 'cm', richtung: 'mehr', ziel: null }, undefined, 20)
    expect(getWerte().map((w) => w.name)).toEqual(['Gewicht', 'Bizeps'])
  })

  it('ohne Namen nichts', () => {
    expect(speichereWert({ name: '  ', einheit: 'kg', richtung: 'egal', ziel: null })).toBeNull()
    expect(getWerte()).toEqual([])
  })

  it('aendern behaelt id, Anlegezeit und Platz', () => {
    const a = speichereWert({ name: 'Gewicht', einheit: 'kg', richtung: 'weniger', ziel: 80 }, undefined, 10)!
    speichereWert({ name: 'Bizeps', einheit: 'cm', richtung: 'mehr', ziel: null }, undefined, 20)
    speichereWert({ name: 'Körpergewicht', einheit: 'kg', richtung: 'weniger', ziel: 78.5 }, a.id, 99)
    const w = getWerte()
    expect(w.map((x) => x.name)).toEqual(['Körpergewicht', 'Bizeps'])
    expect(w[0]).toMatchObject({ id: a.id, erstellt: 10, ziel: 78.5 })
  })

  it('loeschen nimmt die Eintraege mit', () => {
    const a = speichereWert({ name: 'Gewicht', einheit: 'kg', richtung: 'weniger', ziel: null }, undefined, 10)!
    const b = speichereWert({ name: 'Bizeps', einheit: 'cm', richtung: 'mehr', ziel: null }, undefined, 20)!
    setzeMessung('2026-10-08', { [a.id]: 82, [b.id]: 38 })
    loescheWert(a.id)
    expect(getWerte().map((w) => w.id)).toEqual([b.id])
    expect(getLog()).toEqual({ [b.id]: { '2026-10-08': 38 } })
  })
})

describe('setzeMessung', () => {
  it('traegt ein, ersetzt und entfernt - und zaehlt nur echte Aenderungen', () => {
    expect(setzeMessung('2026-10-08', { a: 82.4, b: 38 })).toBe(2)
    expect(setzeMessung('2026-10-08', { a: 82.4, b: 38.5 })).toBe(1)
    expect(getLog()).toEqual({ a: { '2026-10-08': 82.4 }, b: { '2026-10-08': 38.5 } })
    expect(setzeMessung('2026-10-08', { a: null })).toBe(1)
    expect(getLog()).toEqual({ b: { '2026-10-08': 38.5 } })
  })

  it('null ohne Eintrag aendert nichts', () => {
    expect(setzeMessung('2026-10-08', { a: null })).toBe(0)
    expect(getLog()).toEqual({})
  })

  it('andere Tage bleiben unberuehrt', () => {
    setzeMessung('2026-10-01', { a: 83 })
    setzeMessung('2026-10-08', { a: 82 })
    expect(getLog()).toEqual({ a: { '2026-10-01': 83, '2026-10-08': 82 } })
  })
})
