import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  NOTE_ANFANGSSALDO,
  type CategoryTemplate,
} from './data'
import { todayKey } from './util'
import { ENTWURF_KEY } from './entwurf'
import type { Account, Category, CategoryKind, Entry, EntryType, Settings } from './types'

// Gespeichert wird wie in jeder App im Launcher: ein localStorage-Schluessel
// pro Liste, mit dem Praefix der App-ID. So erfasst das Backup im Launcher
// Kontor automatisch mit.
export const APP_ID = 'kontor'
const PREFIX = `${APP_ID}:`
const KEY_ACCOUNTS = 'accounts'
const KEY_CATEGORIES = 'categories'
const KEY_ENTRIES = 'entries'
const KEY_SETTINGS = 'settings'
const KEYS = [KEY_ACCOUNTS, KEY_CATEGORIES, KEY_ENTRIES, KEY_SETTINGS]

// Vorher lebte Kontor in k-deploy und lag dort als ein Block unter diesem
// Schluessel. Gleicher Ursprung (jic-tric.github.io), also sichtbar, wenn
// die Daten im selben Browser liegen - oder per Launcher-Backup herkommen.
const LEGACY_KEY = 'k-deploy:proj:kontor'

const DEFAULT_SETTINGS: Settings = {
  weekStart: 1, // 1 = Montag
  // Die zuletzt gewaehlte Zeitraumart. Keine Einstellung, sondern ein
  // Gedaechtnis: wer im Monat arbeitet, startet im Monat.
  lastPeriod: 'month',
  // Umbuchung auf ein Konto ausserhalb der Gesamtbalance: standardmaessig
  // neutral. Wer sein Depot per Umbuchung fuettert, will das nicht jeden
  // Monat als groesste Ausgabe im Donut sehen - Sparen ist kein Ausgeben.
  // Wer die andere Sicht will, schaltet es in den Einstellungen an.
  countBoundaryTransfers: false,
  onboarded: false,
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

function now() {
  return new Date().toISOString()
}

// ---------- Speicher ----------

function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

function readList<T>(key: string): T[] {
  const raw = read(key)
  return Array.isArray(raw) ? (raw as T[]) : []
}

function writeList<T>(key: string, list: T[]) {
  write(key, list)
}

// Einmalig die Daten aus k-deploy uebernehmen - nur solange Kontor hier noch
// gar nichts gespeichert hat. Der alte Block bleibt liegen, bis "Alle Daten
// loeschen" ihn mitnimmt.
function migrateLegacy() {
  try {
    if (KEYS.some((k) => localStorage.getItem(PREFIX + k) !== null)) return
    const raw = localStorage.getItem(LEGACY_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as Record<string, unknown>
    for (const k of KEYS) {
      if (data[k] !== undefined && data[k] !== null) write(k, data[k])
    }
  } catch {
    // Kaputter Altbestand: dann eben Erststart.
  }
}
migrateLegacy()

// ---------- Einstellungen ----------

export function getSettings(): Settings {
  const raw = read(KEY_SETTINGS) as Partial<Settings> | null
  const s: Settings = { ...DEFAULT_SETTINGS, ...(raw && typeof raw === 'object' ? raw : {}) }
  // Aus der Zeit, als der Startzeitraum eine Einstellung war.
  if (!raw?.lastPeriod && raw?.defaultPeriod) s.lastPeriod = raw.defaultPeriod
  return s
}

export function updateSettings(patch: Partial<Settings>) {
  const next = { ...getSettings(), ...patch }
  write(KEY_SETTINGS, next)
  return next
}

// ---------- Kategorien ----------

export function getCategories() {
  return readList<Category>(KEY_CATEGORIES)
}

// Nur was im Formular auftauchen soll: nicht archiviert, passender Typ.
export function activeCategories(kind: CategoryKind) {
  return getCategories()
    .filter((c) => !c.archived && c.kind === kind)
    .sort((a, b) => a.order - b.order)
}

export function addCategory({
  name,
  kind,
  icon,
  color,
  budgetCent = null,
}: {
  name: string
  kind: CategoryKind
  icon: string
  color: string
  budgetCent?: number | null
}) {
  const list = getCategories()
  const cat: Category = {
    id: uid('c'),
    name: name.trim(),
    kind,
    icon,
    color,
    budgetCent,
    archived: false,
    order: list.length,
  }
  writeList(KEY_CATEGORIES, [...list, cat])
  return cat
}

export function updateCategory(id: string, patch: Partial<Category>) {
  writeList(
    KEY_CATEGORIES,
    getCategories().map((c) => (c.id === id ? { ...c, ...patch } : c)),
  )
}

// Kategorien werden nie geloescht, nur archiviert - sonst haengen alte
// Buchungen an einer ID, die es nicht mehr gibt.
export function archiveCategory(id: string, archived = true) {
  updateCategory(id, { archived })
}

// ---------- Konten ----------

export function getAccounts() {
  return readList<Account>(KEY_ACCOUNTS)
}

export function activeAccounts() {
  return getAccounts()
    .filter((a) => !a.archived)
    .sort((a, b) => a.order - b.order)
}

export function accountMap() {
  const map: Record<string, Account> = {}
  for (const a of getAccounts()) map[a.id] = a
  return map
}

// Der Anfangssaldo wird als Buchung protokolliert, nicht als stiller Startwert
// am Konto. Nur so sind gespeicherter Saldo und Summe der Buchungen von Anfang
// an deckungsgleich - und die Abweichungswarnung im Kontodetail bedeutet
// wirklich, dass etwas nicht stimmt.
export function addAccount({
  name,
  balanceCent = 0,
  includeInTotal = true,
  color,
  date,
}: {
  name: string
  balanceCent?: number
  includeInTotal?: boolean
  color: string
  date?: string
}) {
  const list = getAccounts()
  const acc: Account = {
    id: uid('a'),
    name: name.trim(),
    balanceCent: 0,
    includeInTotal,
    color,
    archived: false,
    order: list.length,
  }
  writeList(KEY_ACCOUNTS, [...list, acc])
  if (balanceCent !== 0) {
    addEntry({
      type: 'adjustment',
      amountCent: balanceCent,
      date: date ?? todayKey(),
      accountId: acc.id,
      note: NOTE_ANFANGSSALDO,
    })
  }
  return { ...acc, balanceCent }
}

export function updateAccount(id: string, patch: Partial<Account>) {
  writeList(
    KEY_ACCOUNTS,
    getAccounts().map((a) => (a.id === id ? { ...a, ...patch } : a)),
  )
}

export function archiveAccount(id: string, archived = true) {
  updateAccount(id, { archived })
}

// Gesamtbalance: nur Konten mit includeInTotal. Der Saldo steht am Konto und
// wird nicht aus der Historie summiert - so bleibt er unabhaengig davon
// bearbeitbar, und alte Buchungen aufzuraeumen veraendert ihn nicht.
export function totalBalance(accounts = getAccounts()) {
  return accounts
    .filter((a) => !a.archived && a.includeInTotal)
    .reduce((sum, a) => sum + a.balanceCent, 0)
}

// ---------- Buchungen ----------

export function getEntries() {
  return readList<Entry>(KEY_ENTRIES)
}

// Neueste zuerst; bei gleichem Datum zaehlt die Erfassungszeit.
export function sortedEntries(entries = getEntries()) {
  return [...entries].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1
    return (a.createdAt ?? '') < (b.createdAt ?? '') ? 1 : -1
  })
}

export function firstEntryDate(entries = getEntries()) {
  if (!entries.length) return null
  return entries.reduce((min, e) => (e.date < min ? e.date : min), entries[0].date)
}

type Delta = [accountId: string | null, cent: number]

// Was eine Buchung an den Kontosalden aendert. Betraege sind positiv, das
// Vorzeichen steckt im Typ - ausser bei 'adjustment': eine Korrektur kann in
// beide Richtungen gehen und traegt ihr Vorzeichen selbst.
function balanceDeltas(entry: Pick<Entry, 'type' | 'amountCent' | 'accountId' | 'toAccountId'>): Delta[] {
  const a = entry.amountCent
  switch (entry.type) {
    case 'expense':
      return [[entry.accountId, -a]]
    case 'income':
      return [[entry.accountId, a]]
    case 'transfer':
      return [
        [entry.accountId, -a],
        [entry.toAccountId, a],
      ]
    case 'adjustment':
      return [[entry.accountId, a]]
    default:
      return []
  }
}

function applyDeltas(deltas: Delta[], factor = 1) {
  if (!deltas.length) return
  const accounts = getAccounts()
  const byId: Record<string, number> = {}
  for (const [id, delta] of deltas) {
    if (id) byId[id] = (byId[id] ?? 0) + delta * factor
  }
  writeList(
    KEY_ACCOUNTS,
    accounts.map((acc) =>
      byId[acc.id] ? { ...acc, balanceCent: acc.balanceCent + byId[acc.id] } : acc,
    ),
  )
}

export interface EntryInput {
  type: EntryType
  amountCent: number
  date?: string
  categoryId?: string | null
  accountId: string
  toAccountId?: string | null
  note?: string
}

export function addEntry(data: EntryInput) {
  const entry: Entry = {
    id: uid('e'),
    type: data.type,
    amountCent: data.amountCent,
    date: data.date ?? todayKey(),
    categoryId: data.categoryId ?? null,
    accountId: data.accountId,
    toAccountId: data.toAccountId ?? null,
    note: (data.note ?? '').trim(),
    createdAt: now(),
    updatedAt: now(),
  }
  writeList(KEY_ENTRIES, [...getEntries(), entry])
  applyDeltas(balanceDeltas(entry))
  return entry
}

export function updateEntry(id: string, patch: Partial<Entry>) {
  const entries = getEntries()
  const old = entries.find((e) => e.id === id)
  if (!old) return null
  const next: Entry = { ...old, ...patch, updatedAt: now() }
  // Erst die alte Wirkung zuruecknehmen, dann die neue anwenden - sonst
  // stimmen die Salden nach einem Konto- oder Typwechsel nicht mehr.
  applyDeltas(balanceDeltas(old), -1)
  applyDeltas(balanceDeltas(next))
  writeList(KEY_ENTRIES, entries.map((e) => (e.id === id ? next : e)))
  return next
}

export function deleteEntry(id: string) {
  const entries = getEntries()
  const old = entries.find((e) => e.id === id)
  if (!old) return
  applyDeltas(balanceDeltas(old), -1)
  writeList(KEY_ENTRIES, entries.filter((e) => e.id !== id))
}

// Eine geloeschte Buchung unveraendert zuruecklegen - fuer "Rueckgaengig".
// Gleiche ID, gleiche Erfassungszeit, und die Salden bekommen ihre Wirkung
// zurueck. Liegt sie schon wieder da (doppelt getippt), passiert nichts.
export function restoreEntry(entry: Entry) {
  const entries = getEntries()
  if (entries.some((e) => e.id === entry.id)) return
  writeList(KEY_ENTRIES, [...entries, entry])
  applyDeltas(balanceDeltas(entry))
}

// Saldo von Hand setzen. Die Differenz wird als Korrektur protokolliert, damit
// spaeter nachvollziehbar bleibt, dass und wann eingegriffen wurde.
export function setAccountBalance(accountId: string, targetCent: number, date = todayKey()) {
  const acc = getAccounts().find((a) => a.id === accountId)
  if (!acc) return null
  const diff = targetCent - acc.balanceCent
  if (diff === 0) return null
  return addEntry({
    type: 'adjustment',
    amountCent: diff,
    date,
    accountId,
    note: 'Saldokorrektur',
  })
}

// Wirkung einer einzelnen Buchung auf ein bestimmtes Konto.
export function accountDelta(entry: Entry, accountId: string) {
  let sum = 0
  for (const [id, delta] of balanceDeltas(entry)) {
    if (id === accountId) sum += delta
  }
  return sum
}

// Summe der Buchungen eines Kontos - nur fuer den Abweichungshinweis im
// Kontodetail. Sie ist bewusst nicht die Quelle des Saldos.
export function balanceFromEntries(accountId: string, entries = getEntries()) {
  return entries.reduce((sum, e) => sum + accountDelta(e, accountId), 0)
}

// Saldo aus den Buchungen neu setzen - nur auf ausdruecklichen Wunsch im
// Kontodetail, nie automatisch.
export function recalcAccountBalance(accountId: string) {
  updateAccount(accountId, { balanceCent: balanceFromEntries(accountId) })
}

// ---------- Erststart, Export, Import ----------

export function seedCategories() {
  if (getCategories().length) return
  const list: Category[] = []
  DEFAULT_EXPENSE_CATEGORIES.forEach((c, i) =>
    list.push({ id: uid('c'), ...c, kind: 'expense', budgetCent: null, archived: false, order: i }),
  )
  DEFAULT_INCOME_CATEGORIES.forEach((c, i) =>
    list.push({ id: uid('c'), ...c, kind: 'income', budgetCent: null, archived: false, order: i }),
  )
  writeList(KEY_CATEGORIES, list)
}

// Legt die Standardkategorien nach, die es noch nicht gibt - verglichen ueber
// den Namen. Vorhandene bleiben unberuehrt, auch archivierte. Damit kommt eine
// geaenderte Voreinstellung auch in einen Bestand, ohne ihn zu loeschen.
export function addMissingDefaultCategories() {
  const list = getCategories()
  const vorhanden = new Set(list.map((c) => `${c.kind}:${c.name.trim().toLowerCase()}`))
  const naechsteOrder = (kind: CategoryKind) =>
    list.filter((c) => c.kind === kind).reduce((max, c) => Math.max(max, c.order + 1), 0)

  const neu: Category[] = []
  const nachtragen = (vorlagen: CategoryTemplate[], kind: CategoryKind) => {
    let order = naechsteOrder(kind)
    for (const v of vorlagen) {
      if (vorhanden.has(`${kind}:${v.name.toLowerCase()}`)) continue
      neu.push({ id: uid('c'), ...v, kind, budgetCent: null, archived: false, order })
      order += 1
    }
  }
  nachtragen(DEFAULT_EXPENSE_CATEGORIES, 'expense')
  nachtragen(DEFAULT_INCOME_CATEGORIES, 'income')

  if (neu.length) writeList(KEY_CATEGORIES, [...list, ...neu])
  return neu.length
}

// Wie viele Standardkategorien fehlen - fuer die Beschriftung des Knopfs.
export function missingDefaultCategoryCount() {
  const vorhanden = new Set(
    getCategories().map((c) => `${c.kind}:${c.name.trim().toLowerCase()}`),
  )
  const fehlt = (vorlagen: CategoryTemplate[], kind: CategoryKind) =>
    vorlagen.filter((v) => !vorhanden.has(`${kind}:${v.name.toLowerCase()}`)).length
  return fehlt(DEFAULT_EXPENSE_CATEGORIES, 'expense') + fehlt(DEFAULT_INCOME_CATEGORIES, 'income')
}

export function isOnboarded() {
  return getSettings().onboarded && getAccounts().length > 0
}

// Gleiches Format wie in k-deploy - alte Exportdateien lassen sich also
// weiterhin importieren.
export function exportSnapshot() {
  const snapshot: Record<string, unknown> = {
    app: 'kontor',
    version: 1,
    exportedAt: now(),
  }
  for (const k of KEYS) {
    const value = read(k)
    if (value !== null) snapshot[k] = value
  }
  return snapshot
}

// Alles oder nichts: in k-deploy lag Kontor in einem einzigen Schluessel, ein
// Import war also automatisch atomar. Jetzt sind es vier - scheitert einer
// (Speicher voll), wird der vorherige Stand zurueckgeschrieben und der Fehler
// geht an den Aufrufer, statt still einen halb ersetzten Bestand zu hinterlassen.
export function importSnapshot(data: unknown) {
  if (!data || typeof data !== 'object') throw new Error('Ungültige Datei')
  const { accounts, categories, entries, settings } = data as Record<string, unknown>
  if (!Array.isArray(accounts) || !Array.isArray(categories) || !Array.isArray(entries)) {
    throw new Error('Datei enthält keine Kontor-Daten')
  }
  const next: Record<string, unknown> = {
    [KEY_ACCOUNTS]: accounts,
    [KEY_CATEGORIES]: categories,
    [KEY_ENTRIES]: entries,
    [KEY_SETTINGS]: {
      ...DEFAULT_SETTINGS,
      ...(settings && typeof settings === 'object' ? settings : {}),
      onboarded: true,
    },
  }

  const before = new Map(KEYS.map((k) => [k, localStorage.getItem(PREFIX + k)]))
  const written: string[] = []
  try {
    for (const k of KEYS) {
      localStorage.setItem(PREFIX + k, JSON.stringify(next[k]))
      written.push(k)
    }
  } catch {
    // Nur zuruecknehmen, was schon geschrieben war - der gescheiterte und alle
    // spaeteren Schluessel sind unberuehrt. Erst entfernen, dann den alten
    // Stand setzen: das ist genau der Zustand von vorher, und der passte.
    for (const k of written) localStorage.removeItem(PREFIX + k)
    for (const k of written) {
      const old = before.get(k)
      if (old !== null && old !== undefined) localStorage.setItem(PREFIX + k, old)
    }
    throw new Error('Nicht genug Speicherplatz – es wurde nichts geändert')
  }
  // Entwuerfe gehoeren zum alten Bestand.
  try {
    localStorage.removeItem(ENTWURF_KEY)
  } catch {
    // egal
  }
}

// Eine gewaehlte Exportdatei einlesen und importieren. Erststart und
// Einstellungen benutzen dieselbe Stelle, damit beide gleich pruefen.
export async function importFile(file: File) {
  let data: unknown
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Die Datei ist keine JSON-Datei')
  }
  importSnapshot(data)
}

export function clearAll() {
  try {
    for (const k of KEYS) localStorage.removeItem(PREFIX + k)
    // Sonst holt die Uebernahme beim naechsten Start die alten Daten zurueck.
    localStorage.removeItem(LEGACY_KEY)
    // Entwuerfe verweisen auf Konten und Kategorien, die es dann nicht mehr gibt.
    localStorage.removeItem(ENTWURF_KEY)
  } catch {
    // nichts zu tun
  }
}
