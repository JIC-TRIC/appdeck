import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ENTWURF_KEY,
  MAX_ALTER_MS,
  entwurfAendern,
  entwurfKey,
  entwurfLesen,
  entwurfLoeschen,
  entwurfSchreiben,
  stapelLesen,
  stapelSchreiben,
} from './entwurf'

class MemoryStorage {
  data = new Map<string, string>()
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    this.data.set(k, String(v))
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
}

let storage: MemoryStorage
beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 27, 12))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('Entwürfe', () => {
  it('neue Ausgabe und neue Einnahme haben getrennte Entwürfe, Bearbeiten den der Buchung', () => {
    expect(entwurfKey({ name: 'entry', type: 'expense' })).toBe('entry:neu:expense')
    expect(entwurfKey({ name: 'entry', type: 'income' })).toBe('entry:neu:income')
    expect(entwurfKey({ name: 'entry', entryId: 'e1' })).toBe('entry:e1')
    expect(entwurfKey({ name: 'balance', accountId: 'a1', sheet: true })).toBe('balance:a1')
  })

  it('ueberlebt einen Neustart, verfaellt aber nach ein paar Stunden', () => {
    entwurfSchreiben('entry:neu:expense', { text: '12,5' })
    expect(entwurfLesen('entry:neu:expense')).toEqual({ text: '12,5' })
    vi.setSystemTime(Date.now() + MAX_ALTER_MS + 1)
    expect(entwurfLesen('entry:neu:expense')).toBeNull()
  })

  it('laesst sich von aussen ergaenzen - etwa um die neu angelegte Kategorie', () => {
    entwurfSchreiben('entry:neu:expense', { text: '12,5', categoryId: 'alt' })
    entwurfAendern('entry:neu:expense', { categoryId: 'neu' })
    expect(entwurfLesen('entry:neu:expense')).toEqual({ text: '12,5', categoryId: 'neu' })
  })

  it('hinterlaesst nach dem Loeschen des letzten Entwurfs nichts im Speicher', () => {
    entwurfSchreiben('entry:neu:expense', { text: '1' })
    entwurfLoeschen('entry:neu:expense')
    expect(storage.getItem(ENTWURF_KEY)).toBeNull()
  })
})

describe('Ansichtsstapel', () => {
  it('merkt sich Seiten und das Saldo-Blatt, aber nicht Menue und Zeitraum-Auswahl', () => {
    stapelSchreiben([
      { name: 'accounts' },
      { name: 'accountDetail', accountId: 'a1' },
      { name: 'balance', accountId: 'a1', sheet: true },
    ])
    expect(stapelLesen().map((v) => v.name)).toEqual(['accounts', 'accountDetail', 'balance'])
    stapelSchreiben([{ name: 'menu', sheet: true }])
    expect(stapelLesen()).toEqual([])
  })

  it('verfaellt wie die Formulare', () => {
    stapelSchreiben([{ name: 'stats' }])
    vi.setSystemTime(Date.now() + MAX_ALTER_MS + 1)
    expect(stapelLesen()).toEqual([])
  })
})
