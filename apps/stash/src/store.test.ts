import { beforeEach, describe, expect, it } from 'vitest'
import {
  ablegen,
  getEntwurf,
  getGeleert,
  getNotizen,
  getTitel,
  leeren,
  normalisiereEntwurf,
  normalisiereGeleert,
  normalisiereNotizen,
  normalisiereTitel,
  speichereEntwurf,
  zurueckholen,
} from './store'

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

describe('normalisiereNotizen', () => {
  it('verwirft Kaputtes und Doppeltes, sortiert aelteste zuerst', () => {
    const raw = [
      { id: 'b', titel: 'B', text: 'zwei', erstellt: 2000 },
      { id: 'a', titel: '  A  ', text: '  eins \n', erstellt: 1000 },
      { id: 'b', titel: 'doppelt', text: 'x', erstellt: 3000 },
      { id: 'c', titel: '', text: '   ', erstellt: 4000 },
      { id: 'd', titel: 'ohne Zeit', text: 'x' },
      { titel: 'ohne id', text: 'x', erstellt: 5000 },
      'Unsinn',
      null,
    ]
    expect(normalisiereNotizen(raw)).toEqual([
      { id: 'a', titel: 'A', text: 'eins', erstellt: 1000 },
      { id: 'b', titel: 'B', text: 'zwei', erstellt: 2000 },
    ])
  })

  it('kein Array: leer', () => {
    expect(normalisiereNotizen({ id: 'a' })).toEqual([])
    expect(normalisiereNotizen(null)).toEqual([])
  })
})

describe('normalisiereTitel', () => {
  it('nur Text, ohne Doppelte (der vordere gewinnt), hoechstens sechs', () => {
    expect(normalisiereTitel(['Kontor', 'kontor', 3, '', ' Einkauf ', 'a', 'b', 'c', 'd', 'e'])).toEqual([
      'Kontor',
      'Einkauf',
      'a',
      'b',
      'c',
      'd',
    ])
    expect(normalisiereTitel('Kontor')).toEqual([])
  })
})

describe('normalisiereEntwurf und normalisiereGeleert', () => {
  it('Entwurf: fehlende Felder sind leer', () => {
    expect(normalisiereEntwurf({ titel: 'X', text: 5 })).toEqual({ titel: 'X', text: '' })
    expect(normalisiereEntwurf(null)).toEqual({ titel: '', text: '' })
  })

  it('Geleert: nur mit Zeitpunkt und mindestens einer gueltigen Notiz', () => {
    const notiz = { id: 'a', titel: 'A', text: '', erstellt: 1 }
    expect(normalisiereGeleert({ am: 5, notizen: [notiz] })).toEqual({ am: 5, notizen: [notiz] })
    expect(normalisiereGeleert({ am: 5, notizen: [] })).toBeNull()
    expect(normalisiereGeleert({ notizen: [notiz] })).toBeNull()
  })
})

describe('ablegen', () => {
  it('legt ab, merkt den Titel und leert den Entwurf', () => {
    speichereEntwurf({ titel: ' Kontor ', text: 'CSV-Export' })
    expect(getEntwurf()).toEqual({ titel: ' Kontor ', text: 'CSV-Export' })

    const n = ablegen(getEntwurf(), 1000)
    expect(n).toMatchObject({ titel: 'Kontor', text: 'CSV-Export', erstellt: 1000 })
    expect(getNotizen()).toHaveLength(1)
    expect(getTitel()).toEqual(['Kontor'])
    expect(getEntwurf()).toEqual({ titel: '', text: '' })
  })

  it('nichts drin: legt nichts ab', () => {
    expect(ablegen({ titel: '  ', text: '\n ' }, 1000)).toBeNull()
    expect(getNotizen()).toEqual([])
  })

  it('ohne Titel: kein neuer Vorschlag', () => {
    ablegen({ titel: '', text: 'Nur Text' }, 1000)
    expect(getTitel()).toEqual([])
  })

  it('jede Notiz bekommt eine eigene id', () => {
    ablegen({ titel: 'A', text: '' }, 1000)
    ablegen({ titel: 'A', text: '' }, 1000)
    const [a, b] = getNotizen()
    expect(a.id).not.toBe(b.id)
  })
})

describe('leeren und zurueckholen', () => {
  it('leeren merkt sich den Stapel, zurueckholen legt ihn zu den neuen', () => {
    ablegen({ titel: 'A', text: 'eins' }, 1000)
    ablegen({ titel: 'B', text: 'zwei' }, 2000)
    leeren(3000)
    expect(getNotizen()).toEqual([])
    expect(getGeleert()?.am).toBe(3000)
    expect(getGeleert()?.notizen.map((n) => n.titel)).toEqual(['A', 'B'])

    ablegen({ titel: 'C', text: 'drei' }, 4000)
    zurueckholen()
    expect(getNotizen().map((n) => n.titel)).toEqual(['A', 'B', 'C'])
    expect(getGeleert()).toBeNull()
  })

  it('leerer Stapel: leeren ueberschreibt den letzten geleerten nicht', () => {
    ablegen({ titel: 'A', text: '' }, 1000)
    leeren(2000)
    leeren(3000)
    expect(getGeleert()?.am).toBe(2000)
  })

  it('erneutes Leeren ersetzt den alten geleerten Stapel', () => {
    ablegen({ titel: 'A', text: '' }, 1000)
    leeren(2000)
    ablegen({ titel: 'B', text: '' }, 3000)
    leeren(4000)
    expect(getGeleert()?.notizen.map((n) => n.titel)).toEqual(['B'])
  })
})
