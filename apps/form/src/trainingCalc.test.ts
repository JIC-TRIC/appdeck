import { describe, expect, it } from 'vitest'
import {
  KENNZAHLEN,
  alsUhr,
  ausUhrZiffern,
  formatSatz,
  formatStrecke,
  kennwert,
  kmh,
  nurNoetige,
  uhrZiffern,
  vollstaendig,
  abschliessen,
  dieseWoche,
  leistung,
  meilensteine,
  naechsterSatz,
  nummerVon,
  pauseStand,
  soSchwerWie,
  vergleichMitLetztem,
  wochenWerte,
  zumTeilen,
  alsCsv,
  bestwerteJeWdh,
  gewichtJeWdh,
  endeFuer,
  formatSek,
  gleicherSatz,
  haeufigste,
  letzteRekorde,
  naechsteVorlage,
  scheiben,
  serie,
  steigerung,
  voriges,
  abweichung,
  alleRekorde,
  besser,
  besterE1rmSatz,
  besterSatz,
  bestesE1rm,
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

const s = (kg: number | null, wdh: number | null, fertig: number | null = 1): Satz => ({
  kg,
  wdh,
  sek: null,
  m: null,
  fertig,
  aufwaermen: false,
})
const auf = (kg: number | null, wdh: number | null, fertig: number | null = 1): Satz => ({ ...s(kg, wdh, fertig), aufwaermen: true })
const leer = (): Satz => s(null, null, null)

const uebung = (id: string, erfassung: Uebung['erfassung'] = 'gewicht'): Uebung => ({
  id,
  name: id,
  erfassung,
  pause: 120,
  notiz: '',
  schritt: 2.5,
  stange: null,
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
  notiz: '',
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

  it('ueberspringt ein Mal "nicht als Vorgabe" und sagt es dazu', () => {
    const schwach = tr('push2', 'push', 300, [{ uebung: 'bank', saetze: [s(70, 5)], keineVorgabe: true }])
    const v = vorgabe([...trainings, schwach], 'bank', 'push', 400)
    expect(v?.training.id).toBe('push1')
    expect(v?.ausgelassen).toBe(true)
    expect(vorgabe(trainings, 'bank', 'push', 400)?.ausgelassen).toBe(false)
  })

  it('ist die Vorlage nur ausgelassen, gilt das letzte Mal ueberhaupt - sonst gar nichts', () => {
    const schwach = tr('push1', 'push', 100, [{ uebung: 'bank', saetze: [s(80, 8)], keineVorgabe: true }])
    const pull = tr('pull1', 'pull', 200, [{ uebung: 'bank', saetze: [s(60, 12)] }])
    expect(vorgabe([schwach, pull], 'bank', 'push', 300)?.training.id).toBe('pull1')
    expect(vorgabe([schwach], 'bank', 'push', 300)).toBeNull()
  })
})

describe('platzhalter', () => {
  const ref = [s(30, 10), s(30, 9)]

  it('derselbe Satz vom letzten Mal', () => {
    expect(platzhalter(ref, [leer(), leer()], 1)).toEqual({ kg: 30, wdh: 9, sek: null, m: null })
  })

  it('hat das letzte Mal weniger Saetze, gilt der Satz davor', () => {
    expect(platzhalter(ref, [leer(), s(32.5, null, null), leer()], 2)).toEqual({ kg: 32.5, wdh: 9, sek: null, m: null })
  })

  it('ohne letztes Mal nichts, bis etwas getippt ist', () => {
    expect(platzhalter(null, [leer()], 0)).toBeNull()
    expect(effektiv(null, [s(40, null, null), leer()], 1)).toEqual({ kg: 40, wdh: null, sek: null, m: null })
  })
})

describe('besser', () => {
  it('mehr Gewicht oder bei gleichem Gewicht mehr Wdh', () => {
    expect(besser(s(82.5, 8), s(80, 8), 'gewicht')).toEqual({ kg: true, wdh: false, sek: false, m: false })
    expect(besser(s(80, 9), s(80, 8), 'gewicht')).toEqual({ kg: false, wdh: true, sek: false, m: false })
    expect(besser(s(77.5, 10), s(80, 8), 'gewicht')).toEqual({ kg: false, wdh: false, sek: false, m: false })
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
    expect(ab.uebungen[0].saetze[1]).toEqual({ kg: 80, wdh: 7, sek: null, m: null, fertig: 300, aufwaermen: false })
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
      { uebung: 'bank', saetze: 2, aufwaermen: 0, von: 5, bis: 8 },
      { uebung: 'dips', saetze: 3, aufwaermen: 0, von: null, bis: null },
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
      { uebung: 'face', saetze: 1, aufwaermen: 0, von: null, bis: null },
      { uebung: 'bank', saetze: 3, aufwaermen: 0, von: 5, bis: 8 },
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

  it('besterE1rmSatz und bestesE1rm: der Satz mit dem hoechsten geschaetzten 1RM', () => {
    // 80 x 10 -> 106,67, 90 x 5 -> 105, 100 x 1 -> 100
    expect(besterE1rmSatz([s(90, 5), s(80, 10), s(100, 1), s(null, 12)])).toEqual(s(80, 10))
    expect(bestesE1rm([s(90, 5), s(80, 10)])).toBe(106.67)
    expect(besterE1rmSatz([s(null, 12)])).toBeNull()
    expect(bestesE1rm([])).toBe(0)
  })

  it('besterSatz', () => {
    expect(besterSatz([s(80, 8), s(85, 5), s(85, 6)], 'gewicht')).toEqual(s(85, 6))
  })
})

describe('Aufwaermsaetze', () => {
  it('grau kommt vom passenden Satz gleicher Art', () => {
    const ref = [auf(40, 10), s(80, 8), s(80, 7)]
    const heute = [auf(null, null, null), leer(), leer()]
    expect(platzhalter(ref, heute, 0)).toEqual({ kg: 40, wdh: 10, sek: null, m: null })
    expect(platzhalter(ref, heute, 2)).toEqual({ kg: 80, wdh: 7, sek: null, m: null })
    expect(gleicherSatz(ref, heute, 1)).toEqual(s(80, 8))
  })

  it('zaehlen nicht fuer Rekorde und Volumen', () => {
    const vorher = [tr('a', 'push', 100, [{ uebung: 'bank', saetze: [s(80, 8)] }])]
    const heute = tr('b', 'push', 200, [{ uebung: 'bank', saetze: [auf(100, 5), s(80, 8)] }])
    expect(rekordeIn(heute, vorher, byId)).toEqual([])
    expect(statistik(heute, byId)).toMatchObject({ saetze: 1, volumen: 640 })
  })

  it('kommen als eigene Zahl in die Vorlage', () => {
    const t = tr('t', 'push', 0, [{ uebung: 'bank', saetze: [auf(40, 10), s(80, 8), s(80, 8)] }])
    expect(vorlageAus(t)[0]).toMatchObject({ saetze: 2, aufwaermen: 1 })
  })
})

describe('steigerung', () => {
  it('alle Arbeitssaetze oben im Bereich: naechstes Gewicht, Wdh vom unteren Ende', () => {
    const ref = [auf(40, 10), s(80, 8), s(80, 8)]
    const plus = steigerung(ref, { von: 5, bis: 8 }, 'gewicht', 2.5)
    expect(plus).toEqual({ kg: 2.5, wdh: 5 })
    expect(platzhalter(ref, [auf(null, null, null), leer()], 1, plus)).toEqual({ kg: 82.5, wdh: 5, sek: null, m: null })
    expect(platzhalter(ref, [auf(null, null, null), leer()], 0, plus)).toEqual({ kg: 40, wdh: 10, sek: null, m: null })
  })

  it('sonst kein Vorschlag', () => {
    expect(steigerung([s(80, 8), s(80, 7)], { von: 5, bis: 8 }, 'gewicht', 2.5)).toBeNull()
    expect(steigerung([s(80, 8)], { von: 5, bis: null }, 'gewicht', 2.5)).toBeNull()
    expect(steigerung([s(null, 12)], { von: 8, bis: 12 }, 'wdh', 2.5)).toBeNull()
  })
})

describe('Hilfen', () => {
  it('scheiben pro Seite', () => {
    expect(scheiben(87.5, 20)).toEqual([25, 5, 2.5, 1.25])
    expect(scheiben(20, 20)).toEqual([])
    expect(scheiben(21, 20)).toBeNull()
    expect(scheiben(15, 20)).toBeNull()
  })

  it('wochenWerte zaehlt Trainings von Montag bis Sonntag', () => {
    // Sa 10.10.2026: diese Woche beginnt Mo 5.10.
    const am = (tag: string) => tr(tag, null, new Date(`${tag}T18:00:00`).getTime(), [])
    const w = wochenWerte([am('2026-09-14'), am('2026-09-28'), am('2026-10-04'), am('2026-10-05'), am('2026-10-10')], '2026-10-10', 'anzahl', byId, 3)
    expect(w).toEqual([
      { montag: '2026-09-21', wert: 0 },
      { montag: '2026-09-28', wert: 2 },
      { montag: '2026-10-05', wert: 2 },
    ])
  })

  it('bestwerteJeWdh laesst Abgedecktes weg', () => {
    expect(bestwerteJeWdh([s(90, 1), s(85, 5), s(82.5, 8), s(82.5, 6), auf(100, 10)])).toEqual([
      { wdh: 1, kg: 90 },
      { wdh: 5, kg: 85 },
      { wdh: 8, kg: 82.5 },
    ])
  })

  it('gewichtJeWdh: Epley rueckwaerts, abgerundet auf den Gewichtsschritt', () => {
    // 80 x 8 = 1RM 101,33 - fuer 8 Wdh wieder genau 80, nicht 77,5
    expect(gewichtJeWdh(s(80, 8), 2.5).map((x) => x.kg)).toEqual([100, 90, 85, 80, 75, 70])
    expect(gewichtJeWdh(s(100, 1), 5).map((x) => x.kg)).toEqual([100, 90, 85, 75, 75, 70])
    expect(gewichtJeWdh(s(80, 8), 1.25, [1, 12])).toEqual([
      { wdh: 1, kg: 101.25 },
      { wdh: 12, kg: 71.25 },
    ])
  })

  it('naechsteVorlage: die am laengsten nicht trainierte, erst ab zweien', () => {
    const v = (id: string) => ({ id, name: id, uebungen: [], rang: 0 })
    const ts = [tr('1', 'push', 100, []), tr('2', 'pull', 200, []), tr('3', 'push', 300, [])]
    expect(naechsteVorlage([v('push'), v('pull'), v('neu')], ts)).toBe('pull')
    expect(naechsteVorlage([v('push'), v('neu')], ts)).toBeNull()
  })

  it('endeFuer: vergessenes Training endet beim letzten Haken', () => {
    const t: Training = { ...tr('t', null, 0, [{ uebung: 'bank', saetze: [s(80, 8, 600000)] }]), ende: null }
    expect(endeFuer(t, 900000)).toBe(900000)
    expect(endeFuer(t, 600000 + 7200000)).toBe(600000)
  })

  it('voriges Training derselben Vorlage', () => {
    const ts = [tr('a', 'push', 100, []), tr('b', 'pull', 200, []), tr('c', 'push', 300, [])]
    expect(voriges(ts, ts[2])?.id).toBe('a')
    expect(voriges(ts, ts[1])).toBeNull()
  })

  it('formatSek und CSV', () => {
    expect(formatSek(45)).toBe('45 s')
    expect(formatSek(90)).toBe('1:30')
    const start = new Date('2026-10-10T17:40:00').getTime()
    const t = tr('t', 'push', start, [{ uebung: 'bank', saetze: [auf(40, 10), s(82.5, 8), s(82.5, null, null)] }])
    expect(alsCsv([{ ...t, name: 'Push; schwer' }], byId).split('\r\n')).toEqual([
      'Datum;Beginn;Training;Übung;Satz;kg;Wdh;Sekunden;Meter',
      '2026-10-10;17:40;"Push; schwer";bank;A;40;10;;',
      '2026-10-10;17:40;"Push; schwer";bank;1;82,5;8;;',
      '',
    ])
  })
})

describe('Statistik', () => {
  const am = (tag: string, uebungen: Training['uebungen'] = []) => tr(tag, null, new Date(`${tag}T18:00:00`).getTime(), uebungen)

  it('serie zaehlt Wochen in Folge, die laufende erst mit Training', () => {
    // Sa 10.10.2026, Wochen ab Mo 21.9., 28.9., 5.10. - die Woche ab 14.9. fehlt.
    const ts = [am('2026-09-07'), am('2026-09-22'), am('2026-09-30'), am('2026-10-04')]
    expect(serie(ts, '2026-10-10')).toBe(2)
    expect(serie([...ts, am('2026-10-06')], '2026-10-10')).toBe(3)
    expect(serie(ts, '2026-10-12')).toBe(0)
    expect(serie([], '2026-10-10')).toBe(0)
  })

  it('letzteRekorde: neueste zuerst, pro Training und Uebung der letzte', () => {
    const ts = [
      am('2026-10-01', [{ uebung: 'bank', saetze: [s(80, 8)] }, { uebung: 'dips', saetze: [s(null, 10)] }]),
      am('2026-10-03', [{ uebung: 'bank', saetze: [s(82.5, 8), s(85, 6)] }]),
      am('2026-10-05', [{ uebung: 'dips', saetze: [s(null, 12)] }, { uebung: 'bank', saetze: [s(80, 8)] }]),
    ]
    expect(letzteRekorde(ts, byId).map((x) => [x.training.id, x.rekord.uebung, x.rekord.si, x.rekord.art])).toEqual([
      ['2026-10-05', 'dips', 0, 'wdh'],
      ['2026-10-03', 'bank', 1, 'gewicht'],
    ])
    expect(letzteRekorde(ts, byId, 1)).toHaveLength(1)
  })

  it('haeufigste: Trainings pro Uebung, bei Gleichstand die juengste zuerst', () => {
    const ts = [
      am('2026-10-01', [{ uebung: 'bank', saetze: [s(80, 8)] }, { uebung: 'bank', saetze: [s(80, 8)] }]),
      am('2026-10-03', [{ uebung: 'face', saetze: [s(20, 12)] }, { uebung: 'bank', saetze: [s(80, 8)] }]),
      am('2026-10-05', [{ uebung: 'dips', saetze: [s(null, 10)] }]),
    ]
    expect(haeufigste(ts)).toEqual([
      { uebung: 'bank', anzahl: 2 },
      { uebung: 'dips', anzahl: 1 },
      { uebung: 'face', anzahl: 1 },
    ])
    expect(haeufigste(ts, 1)).toEqual([{ uebung: 'bank', anzahl: 2 }])
  })
})

describe('Im laufenden Training', () => {
  it('pauseStand: gegen die Pause der Uebung des letzten Hakens, Korrektur nur fuer diesen Haken', () => {
    const t = tr('t', null, 0, [{ uebung: 'bank', saetze: [s(80, 8, 10_000), s(80, 8, null)] }])
    expect(pauseStand(t, byId, 70_000)).toMatchObject({ sek: 60, marke: 120, rest: 60, um: false, ende: 130_000, uebung: 'bank' })
    expect(pauseStand(t, byId, 140_000)?.um).toBe(true)
    expect(pauseStand(t, byId, 70_000, 120, { haken: 10_000, sek: 45 })).toMatchObject({ rest: 0, um: true })
    expect(pauseStand(t, byId, 70_000, 120, { haken: 9_000, sek: 45 })?.marke).toBe(120)
    expect(pauseStand(tr('x', null, 0, [{ uebung: 'bank', saetze: [leer()] }]), byId, 1)).toBeNull()
  })

  it('naechsterSatz: der erste offene in der Reihenfolge der Uebungen', () => {
    const t = tr('t', null, 0, [
      { uebung: 'bank', saetze: [s(80, 8), s(80, 8)] },
      { uebung: 'face', saetze: [s(20, 12), leer(), leer()] },
    ])
    expect(naechsterSatz(t)).toEqual({ ui: 1, si: 1 })
    expect(naechsterSatz(tr('t', null, 0, [{ uebung: 'bank', saetze: [s(80, 8)] }]))).toBeNull()
  })

  it('vergleichMitLetztem: erst wenn alles abgehakt ist, ohne Aufwaermsaetze', () => {
    const ref = [auf(40, 10), s(80, 8), s(80, 8)]
    expect(vergleichMitLetztem([auf(40, 10), s(82.5, 8), s(82.5, 8)], ref, 'gewicht')).toBe(3)
    expect(vergleichMitLetztem([s(82.5, 8), leer()], ref, 'gewicht')).toBeNull()
    expect(vergleichMitLetztem([s(80, 8)], null, 'gewicht')).toBeNull()
    expect(vergleichMitLetztem([s(null, 12)], [s(null, 10)], 'wdh')).toBe(20)
    expect(leistung([s(80, 8), auf(40, 10), s(80, 8, null)], 'gewicht')).toBe(640)
  })
})

describe('Woche und Fertig', () => {
  const am = (tag: string, uebungen: Training['uebungen'] = [], min = 60) => {
    const start = new Date(`${tag}T18:00:00`).getTime()
    return { ...tr(tag, null, start, uebungen), ende: start + min * 60000 }
  }

  it('wochenWerte: Anzahl, Volumen oder Minuten je Woche', () => {
    const ts = [
      am('2026-09-29', [{ uebung: 'bank', saetze: [s(100, 5)] }], 50),
      am('2026-10-06', [{ uebung: 'bank', saetze: [s(80, 10)] }], 40),
      am('2026-10-08', [{ uebung: 'bank', saetze: [s(80, 5)] }], 30),
    ]
    expect(wochenWerte(ts, '2026-10-10', 'anzahl', byId, 2)).toEqual([
      { montag: '2026-09-28', wert: 1 },
      { montag: '2026-10-05', wert: 2 },
    ])
    expect(wochenWerte(ts, '2026-10-10', 'volumen', byId, 2).map((w) => w.wert)).toEqual([500, 1200])
    expect(wochenWerte(ts, '2026-10-10', 'dauer', byId, 2).map((w) => w.wert)).toEqual([50, 70])
  })

  it('dieseWoche: Montag bis Sonntag mit Trainings pro Tag', () => {
    const w = dieseWoche([am('2026-10-04'), am('2026-10-06'), am('2026-10-06'), am('2026-10-09')], '2026-10-10')
    expect(w.map((x) => x.tag)).toEqual(['2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11'])
    expect(w.map((x) => x.anzahl)).toEqual([0, 2, 0, 0, 1, 0, 0])
  })

  it('meilensteine: runde Nummer und Volumenmarke, nur wenn dieses Training sie erreicht', () => {
    const ts = Array.from({ length: 10 }, (_, i) =>
      am(`2026-09-${String(10 + i).padStart(2, '0')}`, [{ uebung: 'bank', saetze: [s(100, 10)] }]),
    )
    expect(nummerVon(ts, ts[9])).toBe(10)
    expect(meilensteine(ts, ts[9], byId)).toEqual(['10. Training', '10 t bewegt'])
    expect(meilensteine(ts, ts[8], byId)).toEqual([])
  })

  it('soSchwerWie: das Schwerste, das das Volumen noch uebertrifft', () => {
    expect(soSchwerWie(100)).toBeNull()
    expect(soSchwerWie(5200)).toBe('ein Elefant')
    expect(soSchwerWie(9450)).toBe('ein T-Rex')
  })

  it('zumTeilen: Kopfzeile, Uebungen ohne Aufwaermen, Rekorde', () => {
    const t = am('2026-10-10', [{ uebung: 'bank', saetze: [auf(40, 10), s(80, 8), s(80, 7)] }], 58)
    const text = zumTeilen(t, byId, [{ uebung: 'bank', ui: 0, si: 1, art: 'gewicht', satz: s(80, 8) }], '2026-10-10')
    // Der Name des Trainings ist hier sein Tag (tr setzt name = id).
    expect(text).toBe('2026-10-10 – heute\n58 min · 2 Sätze · 1.200 kg\n\nbank: 80 × 8 · 7\n\nRekorde: bank 80 × 8')
  })
})

describe('Strecke, Zeit und Gewicht', () => {
  // Strecke in Metern, Zeit in Sekunden.
  const lauf = (m: number | null, sek: number | null, fertig: number | null = 1): Satz => ({ ...s(null, null, fertig), m, sek })
  const mitKg = (kg: number | null, sek: number | null, m: number | null): Satz => ({ ...s(kg, null), sek, m })
  const ids = { band: uebung('band', 'strecke'), plank: uebung('plank', 'gewichtZeit'), farmer: uebung('farmer', 'gewichtStrecke') }

  it('jede Erfassung braucht ihre Zahlen, der Rest wird leer', () => {
    expect(vollstaendig(lauf(5000, null), 'strecke')).toBe(false)
    expect(vollstaendig(lauf(5000, 1590), 'strecke')).toBe(true)
    expect(vollstaendig(mitKg(10, 60, null), 'gewichtZeit')).toBe(true)
    expect(vollstaendig(mitKg(10, 60, null), 'gewichtStrecke')).toBe(false)
    expect(nurNoetige({ kg: 20, wdh: 8, sek: 60, m: 40 }, 'gewichtStrecke')).toEqual({ kg: 20, wdh: null, sek: null, m: 40 })
    expect(nurNoetige({ kg: 20, wdh: 8, sek: 60, m: 40 }, 'strecke')).toEqual({ kg: null, wdh: null, sek: 60, m: 40 })
  })

  it('orange: weiter, oder fuer mindestens dieselbe Strecke schneller', () => {
    expect(besser(lauf(5500, 1800), lauf(5000, 1590), 'strecke')).toMatchObject({ m: true, sek: false })
    expect(besser(lauf(5000, 1560), lauf(5000, 1590), 'strecke')).toMatchObject({ m: false, sek: true })
    expect(besser(lauf(4000, 1200), lauf(5000, 1590), 'strecke')).toMatchObject({ m: false, sek: false })
  })

  it('orange mit Gewicht: schwerer, oder bei mindestens gleichem Gewicht laenger bzw. weiter', () => {
    expect(besser(mitKg(12.5, 45, null), mitKg(10, 60, null), 'gewichtZeit')).toMatchObject({ kg: true, sek: false })
    expect(besser(mitKg(10, 70, null), mitKg(10, 60, null), 'gewichtZeit')).toMatchObject({ kg: false, sek: true })
    expect(besser(mitKg(8, 90, null), mitKg(10, 60, null), 'gewichtZeit')).toMatchObject({ kg: false, sek: false })
    expect(besser(mitKg(24, null, 50), mitKg(24, null, 40), 'gewichtStrecke')).toMatchObject({ kg: false, m: true })
  })

  it('Rekord: weiteste Strecke, sonst schnellstes Tempo', () => {
    const vorher = [tr('a', null, 100, [{ uebung: 'band', saetze: [lauf(5000, 1590)] }])]
    const weiter = tr('b', null, 200, [{ uebung: 'band', saetze: [lauf(6000, 2100)] }])
    const schneller = tr('b', null, 200, [{ uebung: 'band', saetze: [lauf(5000, 1500)] }])
    const langsamer = tr('b', null, 200, [{ uebung: 'band', saetze: [lauf(4000, 1500)] }])
    expect(rekordeIn(weiter, vorher, ids).map((r) => r.art)).toEqual(['strecke'])
    expect(rekordeIn(schneller, vorher, ids).map((r) => r.art)).toEqual(['tempo'])
    expect(rekordeIn(langsamer, vorher, ids)).toEqual([])
  })

  it('Rekord mit Gewicht: schwerer, sonst laenger bzw. weiter', () => {
    const vorher = [
      tr('a', null, 100, [
        { uebung: 'plank', saetze: [mitKg(10, 60, null)] },
        { uebung: 'farmer', saetze: [mitKg(24, null, 40)] },
      ]),
    ]
    const heute = tr('b', null, 200, [
      { uebung: 'plank', saetze: [mitKg(10, 75, null), mitKg(15, 30, null)] },
      { uebung: 'farmer', saetze: [mitKg(24, null, 50)] },
    ])
    expect(rekordeIn(heute, vorher, ids).map((r) => [r.uebung, r.art])).toEqual([
      ['plank', 'zeit'],
      ['plank', 'gewicht'],
      ['farmer', 'strecke'],
    ])
  })

  it('bester Satz, Leistung und Kennzahlen', () => {
    const saetze = [lauf(5000, 1590), lauf(5000, 1500), lauf(3000, 840)]
    expect(besterSatz(saetze, 'strecke')).toBe(saetze[1])
    expect(besterSatz([mitKg(10, 90, null), mitKg(12.5, 45, null)], 'gewichtZeit')?.kg).toBe(12.5)
    expect(leistung(saetze, 'strecke')).toBe(13000)
    expect(leistung([mitKg(24, null, 40), mitKg(24, null, 30)], 'gewichtStrecke')).toBe(1680)
    expect(kmh(lauf(5000, 1500))).toBe(12)
    expect(kennwert(saetze, 'tempo', 'strecke')).toBe(12.9)
    expect(kennwert(saetze, 'strecke', 'strecke')).toBe(5000)
    expect(KENNZAHLEN.strecke).toEqual(['strecke', 'tempo'])
  })

  it('Vergleich mit dem letzten Mal: weiter, bei gleicher Strecke schneller', () => {
    expect(vergleichMitLetztem([lauf(6000, 2100)], [lauf(5000, 1590)], 'strecke')).toBe(20)
    expect(vergleichMitLetztem([lauf(5000, 1545)], [lauf(5000, 1590)], 'strecke')).toBe(3)
    expect(vergleichMitLetztem([mitKg(10, 60, null)], [mitKg(10, 50, null)], 'gewichtZeit')).toBe(20)
  })

  it('als Text', () => {
    expect(formatStrecke(400)).toBe('400 m')
    expect(formatStrecke(5250)).toBe('5,25 km')
    expect(formatSatz(lauf(5000, 1590), 'strecke')).toBe('5 km in 26:30')
    expect(formatSatz(mitKg(10, 45, null), 'gewichtZeit')).toBe('10 kg × 45 s')
    expect(formatSatz(mitKg(24, null, 40), 'gewichtStrecke')).toBe('24 kg × 40 m')
    expect(kurzSaetze([mitKg(10, 60, null), mitKg(10, 45, null)], 'gewichtZeit')).toBe('10 kg × 1:00 · 45 s')
    expect(kurzSaetze([lauf(400, 80), lauf(400, 78)], 'strecke')).toBe('400 m in 1:20 · 400 m in 1:18')
  })

  it('Zeiten tippt man wie an der Mikrowelle', () => {
    expect(uhrZiffern(90)).toBe('130')
    expect(uhrZiffern(1710)).toBe('2830')
    expect(uhrZiffern(3900)).toBe('10500')
    expect(uhrZiffern(45)).toBe('45')
    expect(ausUhrZiffern('2830')).toBe(1710)
    expect(ausUhrZiffern('90')).toBe(90)
    expect(ausUhrZiffern('10500')).toBe(3900)
    expect(ausUhrZiffern('')).toBeNull()
    expect(alsUhr('5')).toBe('0:05')
    expect(alsUhr('130')).toBe('1:30')
    expect(alsUhr('2830')).toBe('28:30')
    expect(alsUhr('10500')).toBe('1:05:00')
    expect(alsUhr('')).toBe('')
  })
})
