import { describe, expect, it } from 'vitest'
import {
  alleAbschnitte,
  ausschnitt,
  erledigteIn,
  findeHash,
  hashVorschlaege,
  imOrdner,
  nachTagen,
  ohneHash,
  ordnerIds,
  plakette,
  suche,
  teile,
  zaehle,
} from './liste'
import type { Ordner, Todo } from './types'

const HEUTE = '2026-10-23'

const ordner: Ordner[] = [
  { id: 'pr', name: 'Projekte', farbe: 5, rang: 0 },
  { id: 'zu', name: 'Zuhause', farbe: 3, rang: 1 },
  { id: 'ge', name: 'Geschenke', farbe: 8, rang: 2 },
]

let n = 0
const todo = (titel: string, x: Partial<Todo> = {}): Todo => ({
  id: `t${++n}`,
  titel,
  notiz: '',
  ordner: null,
  faellig: null,
  rang: n,
  angelegt: 1_000 + n,
  erledigt: null,
  ...x,
})

describe('Ansichten', () => {
  const backup = todo('Backup sichern', { ordner: 'pr', faellig: '2026-10-22', rang: 1 })
  const mock = todo('Mockups ansehen', { ordner: 'pr', faellig: HEUTE, rang: 0 })
  const zahn = todo('Zahnarzt anrufen', { faellig: HEUTE })
  const reifen = todo('Reifenwechsel buchen')
  const kontor = todo('Kontor: Rückblick', { ordner: 'pr', rang: 2 })
  const heiz = todo('Heizung entlüften', { ordner: 'zu', faellig: '2026-10-24' })
  const weg = todo('Altglas', { ordner: 'zu', erledigt: 5_000 })
  const verwaist = todo('Aus gelöschtem Ordner', { ordner: 'futsch' })
  const alle = [backup, mock, zahn, reifen, kontor, heiz, weg, verwaist]

  it('zeigt einen Ordner in seiner Reihenfolge, ohne Erledigtes', () => {
    expect(imOrdner(alle, 'pr', ordnerIds(ordner)).map((t) => t.titel)).toEqual(['Mockups ansehen', 'Backup sichern', 'Kontor: Rückblick'])
    expect(imOrdner(alle, 'zu', ordnerIds(ordner))).toEqual([heiz])
  })

  it('legt Todos aus geloeschten Ordnern in den Eingang', () => {
    expect(imOrdner(alle, null, ordnerIds(ordner))).toEqual([zahn, reifen, verwaist])
  })

  it('stellt in „Alle“ das Faellige oben hin und nicht noch einmal darunter', () => {
    const { faellig, abschnitte } = alleAbschnitte(alle, ordner, HEUTE)
    // aeltestes Datum zuerst, am selben Tag der Eingang vor den Ordnern
    expect(faellig.map((t) => t.titel)).toEqual(['Backup sichern', 'Zahnarzt anrufen', 'Mockups ansehen'])
    expect(abschnitte.map((a) => [a.ordner, a.todos.map((t) => t.titel)])).toEqual([
      [null, ['Reifenwechsel buchen', 'Aus gelöschtem Ordner']],
      ['pr', ['Kontor: Rückblick']],
      ['zu', ['Heizung entlüften']],
    ])
  })

  it('zaehlt je Ordner und was faellig ist', () => {
    const z = zaehle(alle, ordner, HEUTE)
    expect(z.alle).toBe(7)
    expect(z.eingang).toBe(3)
    expect(z.je.get('pr')).toBe(3)
    expect(z.je.get('ge')).toBe(0)
    expect(z.faellig).toBe(3)
    expect(z.faelligEingang).toBe(1)
    expect(z.faelligJe.get('pr')).toBe(2)
    expect(z.faelligJe.get('zu')).toBe(0)
    expect(plakette(alle, HEUTE)).toBe(3)
  })

  it('gruppiert Erledigtes nach Tagen, neueste zuerst', () => {
    const a = todo('a', { erledigt: 300, ordner: 'pr' })
    const b = todo('b', { erledigt: 200, ordner: 'pr' })
    const c = todo('c', { erledigt: 100 })
    const liste = erledigteIn([c, a, b], 'alle', ordnerIds(ordner))
    expect(liste).toEqual([a, b, c])
    expect(erledigteIn([c, a, b], 'pr', ordnerIds(ordner))).toEqual([a, b])
    expect(nachTagen(liste, (ms) => (ms > 150 ? 'Heute' : 'Gestern')).map((g) => [g.titel, g.todos.length])).toEqual([
      ['Heute', 2],
      ['Gestern', 1],
    ])
  })
})

describe('Suche', () => {
  const heiz = todo('Heizung entlüften', { ordner: 'zu' })
  const nk = todo('Nebenkosten prüfen', { notiz: 'Die Heizkosten mit dem Zählerstand vom Januar vergleichen.' })
  const luefter = todo('Heizlüfter zurückschicken', { erledigt: 9_000 })

  it('findet in Titel und Notiz, Gross/klein egal', () => {
    const r = suche([nk, heiz, luefter], 'HEIZ')
    expect(r.offen).toEqual([heiz, nk])
    expect(r.erledigt).toEqual([luefter])
    expect(suche([heiz], '  ').offen).toEqual([])
  })

  it('teilt den Text zum Hervorheben', () => {
    expect(teile('Heizung und Heizkosten', 'heiz')).toEqual([
      { text: 'Heiz', treffer: true },
      { text: 'ung und ', treffer: false },
      { text: 'Heiz', treffer: true },
      { text: 'kosten', treffer: false },
    ])
    expect(teile('a.b', '.')).toEqual([
      { text: 'a', treffer: false },
      { text: '.', treffer: true },
      { text: 'b', treffer: false },
    ])
  })

  it('schneidet die Notiz rund um den Treffer aus', () => {
    const lang = 'Erst den Zähler ablesen und aufschreiben, dann die Heizkosten mit dem Stand vom Januar vergleichen und notieren.'
    const a = ausschnitt(lang, 'heiz', 20)
    expect(a.startsWith('… ')).toBe(true)
    expect(a).toContain('Heizkosten')
    expect(ausschnitt('Kurz: Heizkosten', 'heiz')).toBe('Kurz: Heizkosten')
  })
})

describe('# im Titel', () => {
  it('findet das #wort nur am Ende', () => {
    expect(findeHash('Gutschein für Jonas #ge')).toEqual({ start: 20, suche: 'ge' })
    expect(findeHash('#')).toEqual({ start: 0, suche: '' })
    expect(findeHash('Mail an #ge schreiben')).toBeNull()
    expect(findeHash('Kanal#ge')).toBeNull()
  })

  it('schlaegt passende Ordner vor, Anfaenge zuerst', () => {
    const mehr = [...ordner, { id: 'eg', name: 'Wege', farbe: 0, rang: 3 }]
    expect(hashVorschlaege(mehr, 'ge').map((o) => o.name)).toEqual(['Geschenke', 'Wege'])
    expect(hashVorschlaege(mehr, '').length).toBe(4)
  })

  it('nimmt das #wort aus dem Titel', () => {
    const t = 'Gutschein für Jonas #ge'
    expect(ohneHash(t, findeHash(t)!)).toBe('Gutschein für Jonas')
  })
})
