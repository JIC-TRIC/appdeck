import { beforeEach, describe, expect, it } from 'vitest'
import {
  aendere,
  anlegen,
  erledigteLoeschen,
  getEntwurf,
  getOrdner,
  getSeite,
  getTodos,
  loesche,
  naechsteFarbe,
  normalisiereEntwurf,
  normalisiereOrdner,
  normalisiereTodos,
  ordnerAendern,
  ordnerAnlegen,
  ordnerLoeschen,
  ordnerSortieren,
  pruefeName,
  setzeErledigt,
  sortiere,
  speichereEntwurf,
  speichereSeite,
  stelleWiederHer,
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

const neu = (titel: string, ordner: string | null = null, faellig: string | null = null) => anlegen({ titel, ordner, faellig })!

describe('Todos lesen', () => {
  it('verwirft Kaputtes und doppelte ids', () => {
    const t = normalisiereTodos([
      { id: 'a', titel: '  Zahnarzt   anrufen ', angelegt: 5, rang: 2, faellig: '2026-10-23', erledigt: null },
      { id: 'a', titel: 'doppelt', angelegt: 5 },
      { id: 'b', titel: '   ', angelegt: 5 },
      { id: 'c', titel: 'ohne Zeit' },
      { id: 'd', titel: 'Rest', angelegt: 7, faellig: '23.10.2026', ordner: '', erledigt: 'gestern', rang: 'x', notiz: '  Notiz \n' },
      'Unsinn',
    ])
    expect(t).toEqual([
      { id: 'a', titel: 'Zahnarzt anrufen', notiz: '', ordner: null, faellig: '2026-10-23', rang: 2, angelegt: 5, erledigt: null },
      { id: 'd', titel: 'Rest', notiz: 'Notiz', ordner: null, faellig: null, rang: 4, angelegt: 7, erledigt: null },
    ])
    expect(normalisiereTodos({ nicht: 'liste' })).toEqual([])
  })
})

describe('Anlegen und ändern', () => {
  it('legt ans Ende seines Ordners, unbekannte Ordner in den Eingang', () => {
    const o = ordnerAnlegen('Einkauf')!
    const a = neu('Haferflocken', o.id)
    const b = neu('Kaffeebohnen', o.id)
    const c = neu('Reifenwechsel', 'gibts-nicht')
    expect([a.rang, b.rang]).toEqual([0, 1])
    expect(c.ordner).toBeNull()
    expect(anlegen({ titel: '  ', ordner: null, faellig: null })).toBeNull()
    expect(getTodos()).toHaveLength(3)
  })

  it('setzt beim Verschieben ans Ende und behaelt den alten Titel, wenn der neue leer ist', () => {
    const zu = ordnerAnlegen('Zuhause')!
    neu('Fenster putzen', zu.id)
    const t = neu('Heizung')
    aendere(t.id, { ordner: zu.id, titel: '   ', notiz: 'Schlüssel in der Kiste', faellig: '2026-10-24' })
    const x = getTodos().find((y) => y.id === t.id)!
    expect(x).toMatchObject({ ordner: zu.id, rang: 1, titel: 'Heizung', notiz: 'Schlüssel in der Kiste', faellig: '2026-10-24' })
    aendere(t.id, { faellig: null })
    expect(getTodos().find((y) => y.id === t.id)!.faellig).toBeNull()
  })

  it('hakt ab, nimmt zurueck und behaelt dabei den Platz', () => {
    const a = neu('a')
    const b = neu('b')
    setzeErledigt([a.id, b.id], true, 9_000)
    expect(getTodos().map((t) => t.erledigt)).toEqual([9_000, 9_000])
    setzeErledigt([a.id], false)
    expect(getTodos().find((t) => t.id === a.id)).toMatchObject({ erledigt: null, rang: 0 })
  })

  it('loescht und stellt wieder her', () => {
    const a = neu('a')
    neu('b')
    const weg = loesche(a.id)!
    expect(getTodos().map((t) => t.titel)).toEqual(['b'])
    stelleWiederHer(weg)
    stelleWiederHer(weg)
    expect(getTodos().map((t) => t.titel).sort()).toEqual(['a', 'b'])
    expect(loesche('gibts-nicht')).toBeNull()
  })

  it('sortiert die offenen Todos eines Ordners neu', () => {
    const a = neu('a')
    const b = neu('b')
    const c = neu('c')
    sortiere([c.id, a.id, b.id])
    const rang = Object.fromEntries(getTodos().map((t) => [t.titel, t.rang]))
    expect(rang).toEqual({ c: 0, a: 1, b: 2 })
  })

  it('loescht nur das Erledigte der Ansicht', () => {
    const pr = ordnerAnlegen('Projekte')!
    const a = neu('a', pr.id)
    const b = neu('b')
    neu('c', pr.id)
    setzeErledigt([a.id, b.id], true)
    expect(erledigteLoeschen(pr.id)).toBe(1)
    expect(getTodos().map((t) => t.titel).sort()).toEqual(['b', 'c'])
    expect(erledigteLoeschen('alle')).toBe(1)
    expect(getTodos().map((t) => t.titel)).toEqual(['c'])
  })
})

describe('Ordner', () => {
  it('liest nur gueltige Ordner mit eindeutigem Namen', () => {
    expect(
      normalisiereOrdner([
        { id: 'b', name: 'Zuhause', farbe: 3, rang: 1 },
        { id: 'a', name: '  Projekte ', farbe: 99, rang: 0 },
        { id: 'c', name: 'zuhause', farbe: 1, rang: 2 },
        { id: 'alle', name: 'Alle', farbe: 1, rang: 3 },
        { id: 'd', name: '', farbe: 1 },
      ]),
    ).toEqual([
      { id: 'a', name: 'Projekte', farbe: 1, rang: 0 },
      { id: 'b', name: 'Zuhause', farbe: 3, rang: 1 },
    ])
  })

  it('prueft Namen und vergibt die naechste freie Farbe', () => {
    const a = ordnerAnlegen('Projekte')!
    expect(a.farbe).toBe(0)
    expect(ordnerAnlegen('Zuhause', 3)!.farbe).toBe(3)
    expect(naechsteFarbe(getOrdner())).toBe(1)
    expect(pruefeName(' projekte ', getOrdner())).toBe('„projekte“ gibt es schon.')
    expect(pruefeName('Projekte', getOrdner(), a.id)).toBeNull()
    expect(pruefeName('Eingang', getOrdner())).toBe('„Eingang“ gibt es schon als Karte.')
    expect(pruefeName('   ', getOrdner())).toBe('Der Ordner braucht einen Namen.')
    expect(ordnerAnlegen('PROJEKTE')).toBeNull()
  })

  it('aendert, sortiert und loescht', () => {
    const a = ordnerAnlegen('Projekte')!
    const b = ordnerAnlegen('Zuhause')!
    expect(ordnerAendern(a.id, 'Zuhause', 4)).toBe(false)
    expect(ordnerAendern(a.id, 'Arbeit', 4)).toBe(true)
    ordnerSortieren([b.id, a.id])
    expect(getOrdner().map((o) => [o.name, o.farbe])).toEqual([
      ['Zuhause', 1],
      ['Arbeit', 4],
    ])
  })

  it('schiebt beim Loeschen die offenen Todos ans Ende des Eingangs, Erledigtes geht mit', () => {
    const pa = ordnerAnlegen('Papierkram')!
    neu('Reifenwechsel')
    const kfz = neu('Kfz kündigen', pa.id)
    const nk = neu('Nebenkosten', pa.id)
    const alt = neu('Steuer 2024', pa.id)
    setzeErledigt([alt.id], true)
    sortiere([nk.id, kfz.id])
    ordnerLoeschen(pa.id, false)
    expect(getOrdner()).toEqual([])
    expect(getTodos().map((t) => [t.titel, t.ordner, t.rang])).toEqual([
      ['Reifenwechsel', null, 0],
      ['Kfz kündigen', null, 2],
      ['Nebenkosten', null, 1],
    ])
  })

  it('loescht auf Wunsch mit allen Todos', () => {
    const pa = ordnerAnlegen('Papierkram')!
    neu('Kfz kündigen', pa.id)
    neu('Reifenwechsel')
    ordnerLoeschen(pa.id, true)
    expect(getTodos().map((t) => t.titel)).toEqual(['Reifenwechsel'])
  })
})

describe('Entwurf und Seite', () => {
  it('uebersteht das Schliessen und verwirft Kaputtes', () => {
    speichereEntwurf({ titel: 'Spülm', ordner: 'ei', faellig: '2026-10-24' })
    expect(getEntwurf()).toEqual({ titel: 'Spülm', ordner: 'ei', faellig: '2026-10-24' })
    expect(normalisiereEntwurf({ titel: 3, ordner: '', faellig: 'morgen' })).toEqual({ titel: '', ordner: null, faellig: null })
    expect(getSeite()).toBe('start')
    localStorage.setItem('tick:reiter', JSON.stringify('alle'))
    speichereSeite('ei')
    expect(getSeite()).toBe('ei')
    // der alte Schluessel aus der Zeit mit Reitern geht dabei weg
    expect(localStorage.getItem('tick:reiter')).toBeNull()
  })
})
