import { beforeEach, describe, expect, it } from 'vitest'
import {
  aendereLaeuft,
  auswahl,
  belegt,
  bereichAendern,
  bereichAnlegen,
  bereichLoeschen,
  bereicheSortieren,
  getBereiche,
  getBloecke,
  getLaeuft,
  loescheBlock,
  naechsteFarbe,
  normalisiereBereiche,
  normalisiereBloecke,
  normalisiereLaeuft,
  pruefeName,
  schnappschuss,
  speichereBlock,
  starte,
  stelleHer,
  stoppe,
  taetigkeitAendern,
  taetigkeitAnlegen,
  taetigkeitLoeschen,
} from './store'
import { minuten, zeitpunkt } from './zeit'

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
const speicher = new Speicher()
Object.assign(globalThis, { localStorage: speicher })

const T = '2026-11-06'
const um = (hhmm: string, tag = T) => zeitpunkt(tag, minuten(hhmm)!)

beforeEach(() => speicher.clear())

describe('normalisieren', () => {
  it('verwirft Unbrauchbares bei Bereichen und Tätigkeiten', () => {
    const b = normalisiereBereiche([
      { id: 'a', name: '  Uni  ', farbe: 7, taetigkeiten: [{ id: 't', name: 'Statistik' }, { id: 't', name: 'doppelt' }, { id: 'u', name: 'statistik' }] },
      { id: 'a', name: 'doppelte id' },
      { id: 'b', name: 'UNI' },
      { id: 'c', name: '', farbe: 1 },
      { id: 'd', name: 'Job', farbe: 99, archiviert: true },
      'Unsinn',
    ])
    expect(b.map((x) => x.name)).toEqual(['Uni', 'Job'])
    expect(b[0].farbe).toBe(7)
    expect(b[0].taetigkeiten.map((t) => t.name)).toEqual(['Statistik'])
    expect(b[1]).toMatchObject({ farbe: 0, archiviert: true, taetigkeiten: [] })
    expect(normalisiereBereiche({})).toEqual([])
  })

  it('verwirft Blöcke ohne gültige Zeiten und sortiert nach Start', () => {
    const b = normalisiereBloecke([
      { id: 'x', bereich: 'a', start: 200, ende: 300 },
      { id: 'y', bereich: 'a', start: 100, ende: 150, taetigkeit: 't', notiz: '  hi  ' },
      { id: 'z', bereich: 'a', start: 300, ende: 300 },
      { id: 'x', bereich: 'a', start: 400, ende: 500 },
      { id: 'w', start: 1, ende: 2 },
    ])
    expect(b.map((x) => x.id)).toEqual(['y', 'x'])
    expect(b[0]).toMatchObject({ taetigkeit: 't', notiz: 'hi' })
    expect(b[1]).toMatchObject({ taetigkeit: null, notiz: '' })
  })

  it('liest den laufenden Block oder nichts', () => {
    expect(normalisiereLaeuft({ bereich: 'a', start: 5 })).toEqual({ bereich: 'a', taetigkeit: null, notiz: '', start: 5 })
    expect(normalisiereLaeuft({ bereich: 'a' })).toBeNull()
    expect(normalisiereLaeuft(null)).toBeNull()
  })
})

describe('Timer', () => {
  it('startet, wechselt in derselben Sekunde und stoppt', () => {
    const job = bereichAnlegen('Job', 5)!
    const uni = bereichAnlegen('Uni', 7)!
    expect(starte(job.id, null, um('08:00'))).toBeNull()
    const w = starte(uni.id, null, um('12:00'))
    expect(w?.war.bereich).toBe(job.id)
    expect(w?.block).toMatchObject({ bereich: job.id, start: um('08:00'), ende: um('12:00') })
    expect(getLaeuft()).toMatchObject({ bereich: uni.id, start: um('12:00') })
    const s = stoppe(um('13:30'))
    expect(s?.block).toMatchObject({ bereich: uni.id, start: um('12:00'), ende: um('13:30') })
    expect(getLaeuft()).toBeNull()
    expect(getBloecke()).toHaveLength(2)
    expect(stoppe(um('14:00'))).toBeNull()
  })

  it('verwirft Blöcke unter einer Minute', () => {
    const job = bereichAnlegen('Job', 5)!
    const uni = bereichAnlegen('Uni', 7)!
    starte(job.id, null, um('08:00'))
    const w = starte(uni.id, null, um('08:00') + 40_000)
    expect(w?.block).toBeNull()
    expect(getBloecke()).toHaveLength(0)
    expect(getLaeuft()?.bereich).toBe(uni.id)
  })

  it('merkt sich, welche Tätigkeit zuletzt lief', () => {
    const uni = bereichAnlegen('Uni', 7)!
    const mathe = taetigkeitAnlegen(uni.id, 'Mathe')!
    const stat = taetigkeitAnlegen(uni.id, 'Statistik')!
    expect(auswahl(getBereiche()[0]).map((t) => t.id)).toEqual([mathe, stat])
    starte(uni.id, stat, um('10:00'))
    expect(auswahl(getBereiche()[0]).map((t) => t.id)).toEqual([stat, mathe])
  })

  it('nimmt eine Aktion mit dem Schnappschuss zurück', () => {
    const job = bereichAnlegen('Job', 5)!
    starte(job.id, null, um('08:00'))
    const s = schnappschuss()
    stoppe(um('12:00'))
    expect(getLaeuft()).toBeNull()
    stelleHer(s)
    expect(getLaeuft()?.start).toBe(um('08:00'))
    expect(getBloecke()).toHaveLength(0)
  })

  it('ändert den laufenden Block, aber nicht vor das Ende eines anderen', () => {
    const job = bereichAnlegen('Job', 5)!
    const uni = bereichAnlegen('Uni', 7)!
    speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('12:00'), ende: um('18:20') }, null, um('21:00'))
    starte(uni.id, null, um('19:02'))
    expect(aendereLaeuft({ bereich: uni.id, taetigkeit: null, notiz: 'Blatt 4', start: um('18:10') }, um('19:20'))).toMatchObject({ art: 'konflikt' })
    expect(aendereLaeuft({ bereich: uni.id, taetigkeit: null, notiz: 'Blatt 4', start: um('18:45') }, um('19:20'))).toBeNull()
    expect(getLaeuft()).toMatchObject({ start: um('18:45'), notiz: 'Blatt 4' })
  })
})

describe('Blöcke', () => {
  it('trägt nach, ändert und löscht - ohne Überschneidung', () => {
    const job = bereichAnlegen('Job', 5)!
    const jetzt = um('22:00')
    expect(speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('08:00'), ende: um('12:00') }, null, jetzt)).toBeNull()
    expect(speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('11:00'), ende: um('13:00') }, null, jetzt)).toMatchObject({ art: 'konflikt' })
    expect(speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('12:00'), ende: um('13:00') }, null, jetzt)).toBeNull()
    expect(speichereBlock({ bereich: 'weg', taetigkeit: null, notiz: '', start: um('14:00'), ende: um('15:00') }, null, jetzt)).toEqual({ art: 'text', text: 'Bereich fehlt' })
    const [a, b] = getBloecke()
    // Den eigenen Block darf man ueber sich selbst schieben.
    expect(speichereBlock({ bereich: job.id, taetigkeit: null, notiz: 'x', start: um('07:30'), ende: um('11:30') }, a.id, jetzt)).toBeNull()
    expect(getBloecke()[0]).toMatchObject({ id: a.id, start: um('07:30'), notiz: 'x' })
    loescheBlock(b.id)
    expect(getBloecke().map((x) => x.id)).toEqual([a.id])
  })

  it('weiß, welche Bereiche und Tätigkeiten belegt sind', () => {
    const job = bereichAnlegen('Job', 5)!
    const uni = bereichAnlegen('Uni', 7)!
    const t = taetigkeitAnlegen(uni.id, 'Mathe')!
    speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('08:00'), ende: um('12:00') }, null, um('22:00'))
    starte(uni.id, t, um('13:00'))
    const b = belegt()
    expect([...b.bereiche].sort()).toEqual([job.id, uni.id].sort())
    expect([...b.taetigkeiten]).toEqual([t])
  })
})

describe('Bereiche und Tätigkeiten', () => {
  it('prüft Namen ohne Rücksicht auf Groß und klein', () => {
    const job = bereichAnlegen('Job', 5)!
    expect(pruefeName('  ', getBereiche(), null)).toBe('Name fehlt')
    expect(pruefeName('JOB', getBereiche(), null)).toBe('Gibt es schon')
    expect(pruefeName('JOB', getBereiche(), job.id)).toBeNull()
    expect(bereichAnlegen('job', 1)).toBeNull()
  })

  it('vergibt freie Farben', () => {
    bereichAnlegen('Job', 0)
    bereichAnlegen('Uni', 1)
    expect(naechsteFarbe(getBereiche())).toBe(2)
  })

  it('löscht nur leere Bereiche, sonst archivieren - neue kommen vor die archivierten', () => {
    const job = bereichAnlegen('Job', 5)!
    const uni = bereichAnlegen('Uni', 7)!
    speichereBlock({ bereich: job.id, taetigkeit: null, notiz: '', start: um('08:00'), ende: um('12:00') }, null, um('22:00'))
    expect(bereichLoeschen(job.id)).toBe(false)
    expect(bereichAendern(job.id, { archiviert: true })).toBe(true)
    expect(bereichLoeschen(uni.id)).toBe(true)
    const side = bereichAnlegen('Side Job', 1)!
    expect(getBereiche().map((b) => b.id)).toEqual([side.id, job.id])
  })

  it('sortiert die aktiven, archivierte bleiben dahinter', () => {
    const a = bereichAnlegen('A', 0)!
    const b = bereichAnlegen('B', 1)!
    const c = bereichAnlegen('C', 2)!
    bereichAendern(a.id, { archiviert: true })
    bereicheSortieren([c.id, b.id])
    expect(getBereiche().map((x) => x.name)).toEqual(['C', 'B', 'A'])
  })

  it('legt Tätigkeiten an, holt archivierte zurück, löscht nur unbenutzte', () => {
    const uni = bereichAnlegen('Uni', 7)!
    const m = taetigkeitAnlegen(uni.id, 'Mathe')!
    expect(taetigkeitAnlegen(uni.id, 'mathe')).toBe(m)
    taetigkeitAendern(uni.id, m, { archiviert: true })
    expect(taetigkeitAnlegen(uni.id, 'Mathe')).toBe(m)
    expect(getBereiche()[0].taetigkeiten[0].archiviert).toBe(false)
    const s = taetigkeitAnlegen(uni.id, 'Statistik')!
    expect(taetigkeitAendern(uni.id, s, { name: 'MATHE' })).toBe(false)
    expect(taetigkeitAendern(uni.id, s, { name: 'Stochastik' })).toBe(true)
    starte(uni.id, s, um('10:00'))
    expect(taetigkeitLoeschen(uni.id, s)).toBe(false)
    expect(taetigkeitLoeschen(uni.id, m)).toBe(true)
    expect(getBereiche()[0].taetigkeiten.map((t) => t.name)).toEqual(['Stochastik'])
  })
})
