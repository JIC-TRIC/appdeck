// Datenmodell und die Typen, die zwischen den Ansichten wandern.

// Betraege sind immer ganze Cent und positiv - das Vorzeichen steckt im Typ.
// Ausnahme 'adjustment': eine Korrektur kann in beide Richtungen gehen und
// traegt ihr Vorzeichen selbst.
export type EntryType = 'expense' | 'income' | 'transfer' | 'adjustment'
export type CategoryKind = 'expense' | 'income'
export type PeriodKind = 'day' | 'week' | 'month' | 'year' | 'all'

export interface Account {
  id: string
  name: string
  balanceCent: number
  includeInTotal: boolean
  color: string
  archived: boolean
  order: number
}

export interface Category {
  id: string
  name: string
  kind: CategoryKind
  icon: string
  color: string
  budgetCent: number | null
  archived: boolean
  order: number
}

export interface Entry {
  id: string
  type: EntryType
  amountCent: number
  date: string // 'YYYY-MM-DD', lokal
  categoryId: string | null
  accountId: string
  toAccountId: string | null
  note: string
  createdAt: string
  updatedAt: string
}

export interface LastUsed {
  accountId?: string
  expense?: { categoryId: string | null }
  income?: { categoryId: string | null }
}

export interface Settings {
  weekStart: number // 1 = Montag, 0 = Sonntag
  lastPeriod: PeriodKind
  countBoundaryTransfers: boolean
  onboarded: boolean
  lastUsed?: LastUsed
  /** Aus der Zeit, als der Startzeitraum eine Einstellung war. */
  defaultPeriod?: PeriodKind
}

export interface Period {
  kind: PeriodKind
  anchor: string
}

export interface Range {
  from: string | null
  to: string | null
  label: string
  sub: string
}

// Ein Donut-Segment: eine Kategorie oder ein Sammelposten.
export interface Segment {
  id: string
  name: string
  color: string
  icon: string
  value: number
  share: number
  members?: string[]
}

export type ViewName =
  | 'entries'
  | 'entry'
  | 'transfer'
  | 'categoryDetail'
  | 'categories'
  | 'categoryForm'
  | 'accounts'
  | 'accountDetail'
  | 'accountForm'
  | 'stats'
  | 'settings'
  | 'about'
  | 'period'
  | 'menu'
  | 'balance'

// Ein Eintrag im Ansichtsstapel. Welche Felder gesetzt sind, haengt von der
// Ansicht ab - bewusst ein flaches Objekt, so wie es in die History wandert.
export interface View {
  name: ViewName
  sheet?: boolean
  type?: EntryType
  entryId?: string
  segment?: Segment
  kind?: CategoryKind
  categoryId?: string
  accountId?: string
}

export interface KontorCtx {
  settings: Settings
  accounts: Account[]
  categories: Category[]
  entries: Entry[]
  accById: Record<string, Account>
  catById: Record<string, Category>
  firstKey: string | null
  ready: boolean
  period: Period
  setPeriod: (next: Period | ((cur: Period) => Period)) => void
  push: (view: View) => void
  replace: (view: View) => void
  back: () => void
  refresh: () => void
  onExit: () => void
  /** Kurze Meldung unten; mit undo bekommt sie einen Knopf "Rückgängig". */
  notify: (message: string, undo?: () => void) => void
  /** Buchung löschen - mit "Rückgängig" in der Meldung danach. */
  removeEntry: (entry: Entry) => void
}

export interface ViewProps {
  ctx: KontorCtx
  view: View
}
