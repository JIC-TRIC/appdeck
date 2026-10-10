import { describe, expect, it } from 'vitest'
import {
  abschliessen,
  abweichung,
  alleRekorde,
  besser,
  besterSatz,
  effektiv,
  epley,
  formatDauer,
  formatStoppuhr,
  formatTausend,
  kurzSaetze,
  letzterHaken,
  platzhalter,
  rekordeIn,
  statistik,
  vorgabe,
  vorlageAus,
} from './trainingCalc'
import type { Satz, Training, Uebung } from './types'

const s = (kg: number | null, wdh: number | null, fertig: number | null = 1): Satz => ({ kg, wdh, sek: null, fertig })
const leer = (): Satz => s(null, null, null)

const uebung = (id: string, erfassung: Uebung['erfassung'] = 'gewicht'): Uebung => ({
  id,
  name: id,
  erfassung,
  pause: 120,
  notiz: '',
  archiviert: false,
  erstellt: 0,
})
const byId = { bank: uebung('bank'), face: uebung('face'), dips: uebung('dips', 'wdh') }

const tr = (id: string, vorlage: string | null, start: number, uebungen: Training['uebungen']): Training => ({
  id,
  vorlage,
  name: id,
  start,
  ende: start + 10,
  uebungen,
})

describe('vorgabe', () => {
  const trainings = [
    tr('push1', 'push', 100, [{ uebung: 'bank', saetze: [s(80, 8), s(80, 7)] }]),
    tr('pull1', 'pull', 200, [{ uebung: 'face', saetze: [s(20, 15)] }, { uebung: 'bank', saetze: [s(60, 12)] }]),
  ]

  it('nimmt das letzte Mal aus derselben Vorlage', () => {
    expect(vorgabe(trainings, 'bank', 'push', 300)?.training.id).toBe('push1')
  })

  it('sonst das letzte Mal ueberhaupt', () => {
    expect(vorgabe(trainings, 'face', 'push', 300)?.training.id).toBe('pull1')
    expect(vorgabe(trainings, 'bank', null, 300)?.training.id).toBe('pull1')
  })

  it('nur Trainings davor, nie das eigene', () => {
    expect(vorgabe(trainings, 'bank', 'push', 100)).toBeNull()
    expect(vorgabe(trainings, 'bank', 'pull', 300, 'pull1')?.training.id).toBe('push1')
  })
})

describe('platzhalter', () => {
  const ref = [s(30, 10), s(30, 9)]

  it('derselbe Satz vom letzten Mal', () => {
    expect(platzhalter(ref, [leer(), leer()], 1)).toEqual({ kg: 30, wdh: 9, sek: null })
  })

  it('hat das letzte Mal weniger Saetze, gilt der Satz davor', () => {
    expect(platzhalter(ref, [leer(), s(32.5, null, null), leer()], 2)).toEqual({ kg: 32.5, wdh: 9, sek: null })
  })

  it('ohne letztes Mal nichts, bis etwas getippt ist', () => {
    expect(platzhalter(null, [leer()], 0)).toBeNull()
    expect(effektiv(null, [s(40, null, null), leer()], 1)).toEqual({ kg: 40, wdh: null, sek: null })
  })
})

describe('besser', () => {
  it('mehr Gewicht oder bei gleichem Gewicht mehr Wdh', () => {
    expect(besser(s(82.5, 8), s(80, 8), 'gewicht')).toEqual({ kg: true, wdh: false, sek: false })
    expect(besser(s(80, 9), s(80, 8), 'gewicht')).toEqual({ kg: false, wdh: true, sek: false })
    expect(besser(s(77.5, 10), s(80, 8), 'gewicht')).toEqual({ kg: false, wdh: false, sek: false })
    expect(besser(s(80, 8), null, 'gewicht').kg).toBe(false)
  })
})

describe('Rekorde', () => {
  const vorher = [
    tr('a', 'push', 100, [{ uebung: 'bank', saetze: [s(85, 5), s(80, 8)] }]),
    tr('b', 'push', 200, [{ uebung: 'bank', saetze: [s(80, 8)] }]),
  ]

  it('schwerer ist ein Gewichts-, sonst ein 1RM-Rekord - jeweils nur einmal', () => {
    const heute = tr('c', 'push', 300, [{ uebung: 'bank', saetze: [s(82.5, 8), s(82.5, 8), s(87.5, 2)] }])
    const r = rekordeIn(heute, vorher, byId)
    expect(r.map((x) => [x.si, x.art])).toEqual([
      [0, '1rm'],
      [2, 'gewicht'],
    ])
  })

  it('das erste Mal ist kein Rekord', () => {
    expect(rekordeIn(vorher[0], [], byId)).toEqual([])
    expect(alleRekorde(vorher, byId).get('a')).toEqual([])
  })

  it('offene Saetze zaehlen nicht', () => {
    const heute = tr('c', 'push', 300, [{ uebung: 'bank', saetze: [s(100, 5, null)] }])
    expect(rekordeIn(heute, vorher, byId)).toEqual([])
  })

  it('epley', () => {
    expect(epley(100, 1)).toBe(100)
    expect(epley(82.5, 8)).toBe(104.5)
  })
})

describe('Training', () => {
  it('letzter Haken und Statistik', () => {
    const t = tr('t', null, 0, [
      { uebung: 'bank', saetze: [s(80, 8, 50), s(80, 8, 120), s(80, 8, null)] },
      { uebung: 'dips', saetze: [s(null, 10, 90)] },
    ])
    expect(letzterHaken(t)).toEqual({ zeit: 120, uebung: 'bank' })
    expect(statistik(t, byId)).toMatchObject({ saetze: 3, volumen: 1280, dauer: 10 })
  })

  it('abschliessen verwirft oder hakt Offenes ab', () => {
    const vorher = [tr('a', 'push', 100, [{ uebung: 'bank', saetze: [s(80, 8), s(80, 7)] }])]
    const t: Training = { ...tr('t', 'push', 200, [{ uebung: 'bank', saetze: [s(80, 8, 210), leer()] }, { uebung: 'face', saetze: [leer()] }]), ende: null }
    const weg = abschliessen(t, 300, 'verwerfen', byId, vorher)
    expect(weg.uebungen.map((u) => u.saetze.length)).toEqual([1])
    const ab = abschliessen(t, 300, 'abhaken', byId, vorher)
    expect(ab.uebungen[0].saetze[1]).toEqual({ kg: 80, wdh: 7, sek: null, fertig: 300 })
    expect(ab.uebungen).toHaveLength(1)
    expect(ab.ende).toBe(300)
  })
})

describe('Vorlage', () => {
  const v = {
    id: 'push',
    name: 'Push',
    rang: 0,
    uebungen: [
      { uebung: 'bank', saetze: 2, von: 5, bis: 8 },
      { uebung: 'dips', saetze: 3, von: null, bis: null },
    ],
  }

  it('abweichung: fehlt, neu, Satzzahl', () => {
    const gleich = tr('t', 'push', 0, [
      { uebung: 'bank', saetze: [s(80, 8), s(80, 8)] },
      { uebung: 'dips', saetze: [s(null, 10), s(null, 9), s(null, 8)] },
    ])
    expect(abweichung(gleich, v)).toBeNull()
    const anders = tr('t', 'push', 0, [
      { uebung: 'bank', saetze: [s(80, 8), s(80, 8), s(80, 6)] },
      { uebung: 'face', saetze: [s(20, 15)] },
    ])
    expect(abweichung(anders, v)).toEqual({ fehlt: ['dips'], neu: ['face'], anders: true })
  })

  it('vorlageAus behaelt Wdh-Bereiche', () => {
    const t = tr('t', 'push', 0, [
      { uebung: 'face', saetze: [s(20, 15)] },
      { uebung: 'bank', saetze: [s(80, 8), s(80, 8), s(80, 6)] },
    ])
    expect(vorlageAus(t, v.uebungen)).toEqual([
      { uebung: 'face', saetze: 1, von: null, bis: null },
      { uebung: 'bank', saetze: 3, von: 5, bis: 8 },
    ])
  })
})

describe('Text', () => {
  it('Dauer, Stoppuhr, Tausender', () => {
    expect(formatDauer(58 * 60000)).toBe('58 min')
    expect(formatDauer(64 * 60000)).toBe('1:04 h')
    expect(formatStoppuhr(84)).toBe('1:24')
    expect(formatStoppuhr(3723)).toBe('1:02:03')
    expect(formatTausend(5587.5)).toBe('5.588')
  })

  it('kurzSaetze fasst gleiches Gewicht zusammen', () => {
    expect(kurzSaetze([s(82.5, 8), s(82.5, 8), s(82.5, 7)], 'gewicht')).toBe('82,5 × 8 · 8 · 7')
    expect(kurzSaetze([s(80, 8), s(82.5, 6)], 'gewicht')).toBe('80 × 8 · 82,5 × 6')
    expect(kurzSaetze([s(null, 12), s(null, 10)], 'wdh')).toBe('12 · 10')
  })

  it('besterSatz', () => {
    expect(besterSatz([s(80, 8), s(85, 5), s(85, 6)], 'gewicht')).toEqual(s(85, 6))
  })
})
