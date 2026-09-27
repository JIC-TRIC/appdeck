import { beforeEach, describe, expect, it, vi } from 'vitest'

// localStorage im Speicher. failOn laesst das Schreiben eines Schluessels
// scheitern wie bei vollem Speicher.
class MemoryStorage implements Storage {
  private data = new Map<string, string>()
  failOn: string | null = null
  get length() {
    return this.data.size
  }
  key(i: number) {
    return [...this.data.keys()][i] ?? null
  }
  getItem(k: string) {
    return this.data.get(k) ?? null
  }
  setItem(k: string, v: string) {
    if (k === this.failOn) throw new Error('QuotaExceededError')
    this.data.set(k, String(v))
  }
  removeItem(k: string) {
    this.data.delete(k)
  }
  clear() {
    this.data.clear()
  }
}

let storage: MemoryStorage
let S: typeof import('./kontorStore')

// Jeder Test mit leerem Speicher und frisch geladenem Modul - die Uebernahme
// aus k-deploy laeuft beim Laden.
async function load() {
  vi.resetModules()
  S = await import('./kontorStore')
}

beforeEach(async () => {
  storage = new MemoryStorage()
  vi.stubGlobal('localStorage', storage)
  vi.stubGlobal('window', {})
  await load()
})

const balance = (id: string) => S.getAccounts().find((a) => a.id === id)!.balanceCent

// Der gespeicherte Saldo muss immer zur Summe der Buchungen passen - sonst
// zeigt das Kontodetail eine Abweichung, obwohl niemand eingegriffen hat.
function expectConsistent() {
  for (const a of S.getAccounts()) {
    expect(a.balanceCent, a.name).toBe(S.balanceFromEntries(a.id))
  }
}

describe('Salden', () => {
  it('folgen jeder Buchung, jeder Änderung und jedem Löschen', () => {
    const giro = S.addAccount({ name: 'Giro', color: '#000', balanceCent: 10000 })
    const bar = S.addAccount({ name: 'Bar', color: '#000' })
    expect(balance(giro.id)).toBe(10000) // Anfangssaldo als Buchung

    const einkauf = S.addEntry({ type: 'expense', amountCent: 2500, accountId: giro.id, categoryId: 'c' })
    S.addEntry({ type: 'income', amountCent: 1000, accountId: giro.id, categoryId: 'g' })
    const automat = S.addEntry({ type: 'transfer', amountCent: 3000, accountId: giro.id, toAccountId: bar.id })
    expect([balance(giro.id), balance(bar.id)]).toEqual([5500, 3000])

    // Betrag aendern, Konto wechseln, Typ wechseln
    S.updateEntry(automat.id, { amountCent: 2000 })
    expect([balance(giro.id), balance(bar.id)]).toEqual([6500, 2000])
    S.updateEntry(einkauf.id, { accountId: bar.id })
    expect([balance(giro.id), balance(bar.id)]).toEqual([9000, -500])
    S.updateEntry(einkauf.id, { type: 'income' })
    expect(balance(bar.id)).toBe(4500)

    S.deleteEntry(automat.id)
    expect([balance(giro.id), balance(bar.id)]).toEqual([11000, 2500])
    expectConsistent()
  })

  it('Rückgängig legt eine gelöschte Buchung samt Saldowirkung zurück - auch doppelt getippt nur einmal', () => {
    const giro = S.addAccount({ name: 'Giro', color: '#000', balanceCent: 10000 })
    const e = S.addEntry({ type: 'expense', amountCent: 2500, accountId: giro.id, categoryId: 'c' })
    S.deleteEntry(e.id)
    expect(balance(giro.id)).toBe(10000)

    S.restoreEntry(e)
    S.restoreEntry(e)
    expect(S.getEntries().filter((x) => x.id === e.id)).toHaveLength(1)
    expect(balance(giro.id)).toBe(7500)
    expectConsistent()
  })

  it('Saldokorrektur protokolliert nur die Differenz', () => {
    const giro = S.addAccount({ name: 'Giro', color: '#000', balanceCent: 10000 })
    const k = S.setAccountBalance(giro.id, 12345)
    expect(k).toMatchObject({ type: 'adjustment', amountCent: 2345, note: 'Saldokorrektur' })
    expect(balance(giro.id)).toBe(12345)
    expect(S.setAccountBalance(giro.id, 12345)).toBeNull()
    expectConsistent()
  })
})

describe('Export und Import', () => {
  function seed() {
    S.seedCategories()
    const giro = S.addAccount({ name: 'Giro', color: '#000', balanceCent: 10000 })
    S.addEntry({ type: 'expense', amountCent: 999, accountId: giro.id, categoryId: S.getCategories()[0].id })
    S.updateSettings({ onboarded: true, countBoundaryTransfers: true })
  }

  it('ein Export lässt sich unverändert wieder importieren', () => {
    seed()
    const before = { accounts: S.getAccounts(), entries: S.getEntries(), categories: S.getCategories() }
    const file = JSON.parse(JSON.stringify(S.exportSnapshot()))
    expect(file).toMatchObject({ app: 'kontor', version: 1 })

    S.clearAll()
    expect(S.getAccounts()).toEqual([])
    S.importSnapshot(file)
    expect({ accounts: S.getAccounts(), entries: S.getEntries(), categories: S.getCategories() }).toEqual(before)
    expect(S.getSettings()).toMatchObject({ onboarded: true, countBoundaryTransfers: true })
  })

  it('lehnt Dateien ohne Kontor-Daten ab und lässt den Bestand stehen', () => {
    seed()
    expect(() => S.importSnapshot({ app: 'kontor', entries: [] })).toThrow('keine Kontor-Daten')
    expect(S.getAccounts()).toHaveLength(1)
  })

  it('alles oder nichts: scheitert ein Schreiben, bleibt der alte Stand komplett', () => {
    seed()
    const before = { accounts: S.getAccounts(), entries: S.getEntries(), settings: S.getSettings() }
    storage.failOn = 'kontor:entries'
    expect(() =>
      S.importSnapshot({ accounts: [{ id: 'neu', name: 'Neu' }], categories: [], entries: [], settings: {} }),
    ).toThrow('nichts geändert')
    storage.failOn = null
    expect({ accounts: S.getAccounts(), entries: S.getEntries(), settings: S.getSettings() }).toEqual(before)
  })

  it('ältere Exporte (Konten mit Kontoart, defaultPeriod) funktionieren', () => {
    S.importSnapshot({
      app: 'kontor',
      version: 1,
      settings: { weekStart: 0, countBoundaryTransfers: true },
      accounts: [{ id: 'a', name: 'Giro', kind: 'checking', balanceCent: 500, includeInTotal: true, color: '#000', archived: false, order: 0 }],
      categories: [],
      entries: [],
    })
    expect(S.isOnboarded()).toBe(true)
    expect(S.getSettings()).toMatchObject({ weekStart: 0, countBoundaryTransfers: true })
    expect(S.totalBalance()).toBe(500)
  })
})

describe('Übernahme aus k-deploy', () => {
  const legacy = {
    settings: { onboarded: true, weekStart: 1 },
    accounts: [{ id: 'a', name: 'Alt', balanceCent: 700, includeInTotal: true, color: '#000', archived: false, order: 0 }],
    categories: [],
    entries: [],
  }

  it('holt beim ersten Start die Daten aus dem alten Schlüssel', async () => {
    storage.setItem('k-deploy:proj:kontor', JSON.stringify(legacy))
    await load()
    expect(S.getAccounts().map((a) => a.name)).toEqual(['Alt'])
    expect(S.isOnboarded()).toBe(true)
  })

  it('überschreibt nie, was Kontor hier schon gespeichert hat', async () => {
    storage.setItem('kontor:accounts', JSON.stringify([{ ...legacy.accounts[0], name: 'Neu' }]))
    storage.setItem('k-deploy:proj:kontor', JSON.stringify(legacy))
    await load()
    expect(S.getAccounts().map((a) => a.name)).toEqual(['Neu'])
  })

  it('„Alle Daten löschen“ nimmt den alten Schlüssel mit, sonst käme er beim nächsten Start zurück', async () => {
    storage.setItem('k-deploy:proj:kontor', JSON.stringify(legacy))
    await load()
    S.clearAll()
    await load()
    expect(S.getAccounts()).toEqual([])
    expect(storage.getItem('k-deploy:proj:kontor')).toBeNull()
  })
})
