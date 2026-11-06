import { describe, expect, it } from 'vitest'
import {
  endeDavor,
  endeNach,
  hm,
  hms,
  istTag,
  konflikt,
  kw,
  LAEUFT,
  minuten,
  montag,
  periodeEnde,
  periodeTitel,
  periodeVon,
  plusTage,
  postenAm,
  pruefeBlock,
  pruefeStart,
  startDanach,
  summe,
  tagEnde,
  tagStart,
  vergleich,
  verschiebe,
  zeilen,
  zeitpunkt,
} from './zeit'
import type { Block, Laeuft } from './types'

// Alle Zeitpunkte ueber zeitpunkt() in Ortszeit - so laufen die Tests in jeder Zeitzone.
const um = (tag: string, hhmm: string) => zeitpunkt(tag, minuten(hhmm)!)
const H = 3_600_000
const block = (id: string, bereich: string, tag: string, von: string, bis: string, taetigkeit: string | null = null): Block => {
  const start = um(tag, von)
  return { id, bereich, taetigkeit, notiz: '', start, ende: endeNach(start, minuten(bis)!) }
}

describe('Tage', () => {
  it('rechnet Tage über Monats- und Jahresgrenzen', () => {
    expect(plusTage('2026-10-31', 1)).toBe('2026-11-01')
    expect(plusTage('2026-12-31', 1)).toBe('2027-01-01')
    expect(plusTage('2026-03-01', -1)).toBe('2026-02-28')
  })

  it('prüft Tage', () => {
    expect(istTag('2026-11-06')).toBe(true)
    expect(istTag('2026-02-30')).toBe(false)
    expect(istTag('6.11.2026')).toBe(false)
    expect(istTag(null)).toBe(false)
  })

  it('kennt die Zeitumstellung, falls die Zeitzone eine hat', () => {
    const dauer = tagEnde('2026-10-25') - tagStart('2026-10-25')
    const umgestellt = new Date(2026, 9, 25).getTimezoneOffset() !== new Date(2026, 9, 26).getTimezoneOffset()
    expect(dauer).toBe(umgestellt ? 25 * H : 24 * H)
  })

  it('liest Uhrzeiten', () => {
    expect(minuten('18:30')).toBe(18 * 60 + 30)
    expect(minuten('7:05')).toBe(425)
    expect(minuten('24:00')).toBeNull()
    expect(minuten('')).toBeNull()
  })

  it('legt Bis vor Von auf den nächsten Tag', () => {
    const start = um('2026-11-04', '22:15')
    expect(endeNach(start, minuten('23:00')!)).toBe(um('2026-11-04', '23:00'))
    expect(endeNach(start, minuten('01:40')!)).toBe(um('2026-11-05', '01:40'))
    expect(endeNach(start, minuten('22:15')!)).toBe(um('2026-11-05', '22:15'))
  })
})

describe('Anzeige', () => {
  it('rundet Dauer auf volle Minuten ab', () => {
    expect(hm(8 * H)).toBe('8:00')
    expect(hm(59_999)).toBe('0:00')
    expect(hm(-5)).toBe('0:00')
    expect(hm(51 * H + 27 * 60_000 + 59_000)).toBe('51:27')
  })

  it('zeigt den laufenden Block mit Sekunden', () => {
    expect(hms(H + 12 * 60_000 + 37_000)).toBe('1:12:37')
  })

  it('bildet Summen erst aus Sekunden, dann wird abgerundet', () => {
    const t = '2026-11-06'
    const drei = ['09:00', '10:00', '11:00'].map((v, i) => {
      const start = um(t, v)
      return { id: `b${i}`, bereich: 'uni', taetigkeit: null, notiz: '', start, ende: start + 20 * 60_000 + 40_000 }
    })
    const s = summe(drei, null, tagStart(t), tagEnde(t), um(t, '20:00'))
    expect(hm(s.tot)).toBe('1:02')
  })
})

describe('Ein Tag', () => {
  const mi = '2026-11-04'
  const bloecke = [
    block('a', 'job', mi, '08:05', '12:00', 'dev'),
    block('b', 'proj', mi, '22:15', '01:40'),
  ]

  it('teilt einen Block um Mitternacht', () => {
    const jetzt = um('2026-11-06', '12:00')
    const p = postenAm(bloecke, null, mi, jetzt)
    expect(p.map((x) => hm(x.dauer))).toEqual(['3:55', '1:45'])
    expect(p[1].weiter).toBe(true)
    expect(p[1].bis).toBe(tagEnde(mi))
    const d = postenAm(bloecke, null, '2026-11-05', jetzt)
    expect(d).toHaveLength(1)
    expect(hm(d[0].dauer)).toBe('1:40')
    expect(d[0].von).toBe(tagStart('2026-11-05'))
  })

  it('zählt den laufenden Block bis jetzt, auch über Mitternacht', () => {
    const l: Laeuft = { bereich: 'uni', taetigkeit: null, notiz: '', start: um('2026-11-05', '23:30') }
    const jetzt = um('2026-11-06', '00:45')
    expect(postenAm([], l, '2026-11-05', jetzt).map((x) => hm(x.dauer))).toEqual(['0:30'])
    const heute = postenAm([], l, '2026-11-06', jetzt)
    expect(heute[0].id).toBeNull()
    expect(hm(heute[0].dauer)).toBe('0:45')
    // Am Tag darauf steht er noch nicht.
    expect(postenAm([], l, '2026-11-07', jetzt)).toHaveLength(0)
  })

  it('summiert je Bereich und Tätigkeit', () => {
    const s = summe(bloecke, null, tagStart(mi), tagEnde(mi), um('2026-11-06', '12:00'))
    expect(hm(s.tot)).toBe('5:40')
    expect(hm(s.je.get('job')!)).toBe('3:55')
    expect(s.taet.get('job')!.get('dev')).toBe(s.je.get('job'))
    expect(s.taet.get('proj')!.get(null)).toBe(s.je.get('proj'))
  })
})

describe('Zeiträume', () => {
  it('kennt Montage und Kalenderwochen', () => {
    expect(montag('2026-11-06')).toBe('2026-11-02')
    expect(montag('2026-11-08')).toBe('2026-11-02')
    expect(montag('2026-11-02')).toBe('2026-11-02')
    expect(kw('2026-11-06')).toBe(45)
    expect(kw('2026-01-01')).toBe(1)
    expect(kw('2027-01-01')).toBe(53)
    expect(kw('2027-01-04')).toBe(1)
  })

  it('blättert Wochen, Monate und Jahre', () => {
    expect(periodeVon('woche', '2026-11-06')).toEqual({ art: 'woche', tag: '2026-11-02' })
    expect(periodeVon('monat', '2026-11-06')).toEqual({ art: 'monat', tag: '2026-11-01' })
    expect(periodeVon('jahr', '2026-11-06')).toEqual({ art: 'jahr', tag: '2026-01-01' })
    expect(verschiebe({ art: 'monat', tag: '2026-01-01' }, -1).tag).toBe('2025-12-01')
    expect(periodeEnde({ art: 'monat', tag: '2026-12-01' })).toBe('2027-01-01')
    expect(periodeEnde({ art: 'woche', tag: '2026-11-02' })).toBe('2026-11-09')
  })

  it('beschriftet Zeiträume', () => {
    expect(periodeTitel({ art: 'woche', tag: '2026-11-02' })).toBe('KW 45 · 02.–08.11.')
    expect(periodeTitel({ art: 'woche', tag: '2026-10-26' })).toBe('KW 44 · 26.10.–01.11.')
    expect(periodeTitel({ art: 'monat', tag: '2026-03-01' })).toBe('MÄRZ 2026')
    expect(periodeTitel({ art: 'jahr', tag: '2026-01-01' })).toBe('2026')
  })

  it('macht Zeilen: Tage, Wochen im Monat (beschnitten), Monate', () => {
    const w = zeilen({ art: 'woche', tag: '2026-11-02' }, '2026-11-06')
    expect(w.map((z) => z.label)).toEqual(['MO 02.11.', 'DI 03.11.', 'MI 04.11.', 'DO 05.11.', 'FR 06.11.', 'SA 07.11.', 'SO 08.11.'])
    expect(w.map((z) => z.zukunft)).toEqual([false, false, false, false, false, true, true])
    const m = zeilen({ art: 'monat', tag: '2026-11-01' }, '2026-11-06')
    expect(m.map((z) => z.label)).toEqual(['KW 44', 'KW 45', 'KW 46', 'KW 47', 'KW 48', 'KW 49'])
    expect(m[0].von).toBe('2026-11-01')
    expect(m[0].bis).toBe('2026-11-02')
    expect(m[5].bis).toBe('2026-12-01')
    expect(m[0].ziel).toEqual({ art: 'periode', periode: { art: 'woche', tag: '2026-10-26' } })
    const j = zeilen({ art: 'jahr', tag: '2026-01-01' }, '2026-11-06')
    expect(j).toHaveLength(12)
    expect(j[10].label).toBe('NOV')
    expect(j[11].zukunft).toBe(true)
  })

  it('vergleicht mit dem gleichen Stück davor', () => {
    const bloecke = [
      block('v1', 'job', '2026-10-26', '08:00', '16:00'),
      block('v2', 'job', '2026-10-30', '08:00', '16:00'),
      block('j1', 'job', '2026-11-02', '08:00', '18:00'),
    ]
    // Montag 20:00: von der Vorwoche zaehlt nur Montag bis 20:00.
    const p = { art: 'woche' as const, tag: '2026-11-02' }
    expect(vergleich(bloecke, null, p, um('2026-11-02', '20:00'))).toBe(2 * H)
    // Abgeschlossene Woche gegen die ganze davor.
    expect(vergleich(bloecke, null, p, um('2026-11-10', '12:00'))).toBe(-6 * H)
    // Ohne Eintraege davor kein Vergleich.
    expect(vergleich(bloecke, null, { art: 'woche', tag: '2026-10-26' }, um('2026-11-02', '20:00'))).toBeNull()
  })
})

describe('Prüfen', () => {
  const t = '2026-11-06'
  const bloecke = [block('job', 'job', t, '12:41', '17:05'), block('side', 'side', t, '17:50', '18:20')]
  const jetzt = um(t, '22:00')

  it('findet Überschneidungen, aber nicht Bloecke, die genau aneinanderstoßen', () => {
    expect(konflikt(bloecke, null, um(t, '16:50'), um(t, '18:20'), 'side')?.start).toBe(um(t, '12:41'))
    expect(konflikt(bloecke, null, um(t, '17:05'), um(t, '17:50'), null)).toBeNull()
  })

  it('der laufende Block reicht bis in die Zukunft', () => {
    const l: Laeuft = { bereich: 'uni', taetigkeit: null, notiz: '', start: um(t, '19:02') }
    expect(konflikt(bloecke, l, um(t, '19:30'), um(t, '19:45'), null)).toBe(l)
    expect(konflikt(bloecke, l, um(t, '18:30'), um(t, '19:02'), null)).toBeNull()
    expect(konflikt(bloecke, l, um(t, '19:30'), um(t, '19:45'), LAEUFT)).toBeNull()
  })

  it('prüft Länge, Zukunft und Überschneidung', () => {
    expect(pruefeBlock(bloecke, null, um(t, '20:00'), um(t, '20:00') + 30_000, null, jetzt)).toEqual({ art: 'text', text: 'Kürzer als eine Minute' })
    expect(pruefeBlock(bloecke, null, um(t, '21:00'), um(t, '23:00'), null, jetzt)).toEqual({ art: 'text', text: 'Liegt in der Zukunft' })
    expect(pruefeBlock(bloecke, null, um(t, '16:00'), um(t, '17:00'), null, jetzt)).toMatchObject({ art: 'konflikt' })
    expect(pruefeBlock(bloecke, null, um(t, '20:00'), um(t, '21:00'), null, jetzt)).toBeNull()
  })

  it('der laufende Block darf nicht vor dem Ende eines anderen beginnen', () => {
    expect(pruefeStart(bloecke, um(t, '18:10'), jetzt)).toMatchObject({ art: 'konflikt' })
    expect(pruefeStart(bloecke, um(t, '18:20'), jetzt)).toBeNull()
    expect(pruefeStart(bloecke, um(t, '22:30'), jetzt)).toEqual({ art: 'text', text: 'Liegt in der Zukunft' })
  })

  it('schlägt Anschluss und nächsten Beginn vor', () => {
    expect(endeDavor(bloecke, um(t, '16:50'), 'side')).toBe(um(t, '17:05'))
    expect(endeDavor(bloecke, um(t, '19:00'), null)).toBe(um(t, '18:20'))
    expect(endeDavor(bloecke, um(t, '08:00'), null)).toBeNull()
    expect(startDanach(bloecke, null, um(t, '17:05'), null)).toBe(um(t, '17:50'))
    expect(startDanach(bloecke, null, um(t, '18:00'), 'side')).toBeNull()
  })
})
