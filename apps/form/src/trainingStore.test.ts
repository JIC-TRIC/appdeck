import { beforeEach, describe, expect, it } from 'vitest'
import {
  getEinstellungen,
  getLaufend,
  getPausenKorrektur,
  getTrainings,
  getUebungen,
  getVorlagen,
  loescheUebung,
  normalisiereTrainings,
  normalisiereUebungen,
  normalisiereVorlagen,
  ordneVorlagen,
  pauseSauber,
  setzeEinstellungen,
  setzeLaufend,
  setzePausenKorrektur,
  setzeUebung,
  speichereTraining,
  speichereUebung,
  speichereVorlage,
  starteTraining,
} from './trainingStore'

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

describe('normalisiereUebungen', () => {
  it('verwirft Kaputtes und fuellt Fehlendes auf', () => {
    const u = normalisiereUebungen([
      { id: 'a', name: '  Bank   drücken ', erfassung: 'quatsch', pause: 97 },
      { id: 'a', name: 'Doppelt' },
      { id: 'b', name: '' },
      'Quatsch',
    ])
    expect(u).toHaveLength(1)
    expect(u[0]).toMatchObject({
      name: 'Bank drücken',
      erfassung: 'gewicht',
      pause: 90,
      notiz: '',
      schritt: 2.5,
      stange: null,
      archiviert: false,
    })
  })
})

describe('Einstellungen', () => {
  it('ohne Eintrag: Ton aus, Bildschirm an, kein Wochenziel', () => {
    expect(getEinstellungen()).toEqual({ ton: false, wach: true, wochenziel: null })
    setzeEinstellungen({ ton: true, wach: false, wochenziel: 3 })
    expect(getEinstellungen()).toEqual({ ton: true, wach: false, wochenziel: 3 })
  })

  it('Pause von Hand: nur mit Haken und Sekunden', () => {
    expect(getPausenKorrektur()).toBeNull()
    setzePausenKorrektur({ haken: 1000, sek: 135 })
    expect(getPausenKorrektur()).toEqual({ haken: 1000, sek: 135 })
    localStorage.setItem('form:pause', JSON.stringify({ sek: 30 }))
    expect(getPausenKorrektur()).toBeNull()
  })

  it('nehmen als Wochenziel nur 1 bis 7', () => {
    localStorage.setItem('form:einstellungen', JSON.stringify({ wochenziel: 12 }))
    expect(getEinstellungen().wochenziel).toBe(7)
    localStorage.setItem('form:einstellungen', JSON.stringify({ wochenziel: 0 }))
    expect(getEinstellungen().wochenziel).toBeNull()
    localStorage.setItem('form:einstellungen', JSON.stringify({ wochenziel: 'drei' }))
    expect(getEinstellungen().wochenziel).toBeNull()
  })
})

describe('pauseSauber', () => {
  it('rundet auf 15 Sekunden zwischen 0:15 und 10:00', () => {
    expect(pauseSauber(97)).toBe(90)
    expect(pauseSauber(0)).toBe(15)
    expect(pauseSauber(9999)).toBe(600)
  })
})

describe('Vorlagen', () => {
  it('normalisiert Saetze und Wdh-Bereich', () => {
    const v = normalisiereVorlagen([
      { id: 'p', name: 'Push', rang: 1, uebungen: [{ uebung: 'a', saetze: 99, von: 12, bis: 8 }, { saetze: 3 }] },
      { id: 'l', name: 'Pull', rang: 0, uebungen: [{ uebung: 'b' }] },
    ])
    expect(v.map((x) => x.id)).toEqual(['l', 'p'])
    expect(v[1].uebungen).toEqual([{ uebung: 'a', saetze: 20, aufwaermen: 0, von: 8, bis: 12 }])
    expect(v[0].uebungen[0]).toEqual({ uebung: 'b', saetze: 3, aufwaermen: 0, von: null, bis: null })
  })

  it('neue Vorlagen kommen ans Ende, die Reihenfolge laesst sich aendern', () => {
    const a = speichereVorlage({ name: 'Push', uebungen: [] })!
    const b = speichereVorlage({ name: 'Pull', uebungen: [] })!
    expect(getVorlagen().map((v) => v.name)).toEqual(['Push', 'Pull'])
    ordneVorlagen([b.id, a.id])
    expect(getVorlagen().map((v) => v.name)).toEqual(['Pull', 'Push'])
  })
})

describe('Trainings', () => {
  it('nur beendete, sortiert nach Start, kaputte Saetze werden leer', () => {
    const t = normalisiereTrainings([
      { id: 'b', start: 200, ende: 300, uebungen: [{ uebung: 'x', saetze: [{ kg: 80, wdh: 8.4, fertig: 250 }, { kg: -1, wdh: 'acht' }] }] },
      { id: 'a', start: 100, ende: 150, name: 'Push', vorlage: 'p', uebungen: [] },
      { id: 'c', start: 400, ende: null },
      { id: 'd', start: 0, ende: 10 },
    ])
    expect(t.map((x) => x.id)).toEqual(['a', 'b'])
    expect(t[1].name).toBe('Training')
    expect(t[1].uebungen[0].saetze).toEqual([
      { kg: 80, wdh: 8, sek: null, fertig: 250, aufwaermen: false },
      { kg: null, wdh: null, sek: null, fertig: null, aufwaermen: false },
    ])
    expect(t[0].notiz).toBe('')
  })

  it('"nicht als Vorgabe" bleibt nur, wenn es an ist', () => {
    const [t] = normalisiereTrainings([
      {
        id: 'a',
        start: 100,
        ende: 200,
        uebungen: [
          { uebung: 'x', saetze: [], keineVorgabe: true },
          { uebung: 'y', saetze: [], keineVorgabe: 'ja' },
          { uebung: 'z', saetze: [], keineVorgabe: false },
        ],
      },
    ])
    expect(t.uebungen[0].keineVorgabe).toBe(true)
    expect('keineVorgabe' in t.uebungen[1]).toBe(false)
    expect('keineVorgabe' in t.uebungen[2]).toBe(false)
  })

  it('starteTraining legt Saetze aus der Vorlage an (Aufwaermen zuerst) und sichert sofort', () => {
    const v = speichereVorlage({ name: 'Push', uebungen: [{ uebung: 'a', saetze: 3, aufwaermen: 1, von: 8, bis: 12 }] })!
    const t = starteTraining(v, 1000)
    expect(t.uebungen[0].saetze.map((s) => s.aufwaermen)).toEqual([true, false, false, false])
    expect(getLaufend()).toEqual(t)
    setzeLaufend(null)
    expect(getLaufend()).toBeNull()
  })

  it('speichereTraining ersetzt dieselbe id', () => {
    speichereTraining({ id: 't', vorlage: null, name: 'A', start: 10, ende: 20, uebungen: [], notiz: '' })
    speichereTraining({ id: 't', vorlage: null, name: 'B', start: 10, ende: 20, uebungen: [], notiz: '' })
    expect(getTrainings().map((t) => t.name)).toEqual(['B'])
  })
})

describe('loescheUebung', () => {
  it('nur nie trainierte, auch aus den Vorlagen', () => {
    const a = speichereUebung({ name: 'A', erfassung: 'gewicht', pause: 120, notiz: '' })!
    const b = speichereUebung({ name: 'B', erfassung: 'wdh', pause: 60, notiz: '' })!
    speichereVorlage({ name: 'V', uebungen: [{ uebung: a.id, saetze: 3, aufwaermen: 0, von: null, bis: null }] })
    speichereTraining({
      id: 't',
      vorlage: null,
      name: 'T',
      start: 10,
      ende: 20,
      uebungen: [{ uebung: b.id, saetze: [{ kg: null, wdh: 10, sek: null, fertig: 15, aufwaermen: false }] }],
      notiz: '',
    })
    expect(loescheUebung(b.id)).toBe(false)
    expect(loescheUebung(a.id)).toBe(true)
    expect(getUebungen().map((u) => u.name)).toEqual(['B'])
    expect(getVorlagen()[0].uebungen).toEqual([])
  })
})

describe('Notiz einer Uebung', () => {
  it('behaelt Zeilen, raeumt Leerzeichen und leere Zeilen weg', () => {
    const u = speichereUebung({ name: 'Beinpresse', erfassung: 'gewicht', pause: 120, notiz: '  Sitz   Stufe 4 \n\n\n Lehne 2  ' })!
    expect(u.notiz).toBe('Sitz Stufe 4\nLehne 2')
    setzeUebung(u.id, { notiz: 'Füße  schulterbreit\r\nnicht durchdrücken' })
    expect(getUebungen()[0]).toMatchObject({ notiz: 'Füße schulterbreit\nnicht durchdrücken', pause: 120 })
    setzeUebung(u.id, { notiz: 'x'.repeat(300) })
    expect(getUebungen()[0].notiz).toHaveLength(200)
  })
})
