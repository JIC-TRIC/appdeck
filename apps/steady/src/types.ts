// Datenmodell und die Typen, die zwischen den Ansichten wandern.
// Die Regeln dahinter stehen in konzept.md unter "Die Regeln".

export type HabitKind = 'check' | 'amount'
export type GoalDir = 'min' | 'max'

// Rhythmus ab einem Tag: 7 = taeglich, 1-6 = x-mal pro Kalenderwoche.
// "from" ist ein Montag - oder das Beginn-Datum, wenn die Gewohnheit mitten
// in der Woche anfaengt.
export interface RhythmRule {
  from: string
  perWeek: number
}

// Mengenziel ab einem Tag. Gilt ab dem Tag der Aenderung, nicht ab Montag -
// sonst wuerden Montag und Dienstag nachtraeglich verfehlt.
export interface GoalRule {
  from: string
  target: number
  dir: GoalDir
}

// Ein archivierter Zeitraum. to = null: gerade archiviert.
export interface InactiveRange {
  from: string
  to: string | null
}

export interface Habit {
  id: string
  name: string
  color: string // Palettenschluessel, siehe data.ts
  kind: HabitKind
  unit: string // nur bei amount, sonst ''
  rhythm: RhythmRule[] // aufsteigend nach from
  goal: GoalRule[] // nur bei amount, aufsteigend nach from
  start: string // 'YYYY-MM-DD'
  inactive: InactiveRange[]
  order: number
  createdAt: string
  updatedAt: string
}

// Eintraege: pro Gewohnheit pro Tag hoechstens ein Wert. 1 = abgehakt,
// NICHT_GESCHAFFT = ausdruecklich nicht geschafft, sonst der Tageswert. Kein
// Eintrag heisst: nichts eingetragen. Alles andere (Ruhetage, verpasst,
// Serien) wird daraus berechnet und nie gespeichert.
export type HabitLog = Record<string, number>
export type Log = Record<string, HabitLog>

// "Nicht geschafft", ausdruecklich eingetragen - im Unterschied zu einem Tag,
// an dem nur das Eintragen vergessen wurde. Rechnet ueberall wie kein Eintrag
// (verpasst bzw. Ruhetag), sieht im Raster aber anders aus. Mengen sind nie
// negativ, darum ist -1 frei.
export const NICHT_GESCHAFFT = -1

export type StatsKind = 'week' | 'month' | 'year'

export interface Settings {
  dayStart: number // Tageswechsel in Stunden, 0-6
  statsKind: StatsKind // zuletzt gewaehlte Art in der Statistik
}

// Zustand eines Tages fuer eine Gewohnheit.
//   done   erledigt (Haken oder Ziel erreicht)
//   rest   Ruhetag, vom Wochenkontingent gedeckt
//   miss   verpasst
//   open   heute, noch nicht erledigt
//   off    nicht aktiv (vor dem Beginn, archiviert)
//   future nach heute
export type DayState = 'done' | 'rest' | 'miss' | 'open' | 'off' | 'future'

export type ViewName =
  | 'detail'
  | 'habitForm'
  | 'stats'
  | 'archive'
  | 'reorder'
  | 'settings'
  | 'rules'
  | 'menu'
  | 'amount'
  | 'dayStart'

// Ein Eintrag im Ansichtsstapel - flach, so wie er in die History wandert.
export interface View {
  name: ViewName
  sheet?: boolean
  habitId?: string
  day?: string
}

export interface SteadyCtx {
  habits: Habit[]
  log: Log
  settings: Settings
  today: string
  byId: Record<string, Habit>
  push: (view: View) => void
  replace: (view: View) => void
  back: () => void
  refresh: () => void
  onExit: () => void
  /** Kurze Meldung unten; mit undo bekommt sie einen Knopf "Rückgängig". */
  notify: (message: string, undo?: () => void) => void
  /** Wert eines Tages setzen (null = entfernen), mit Meldung fuer vergangene Tage. */
  enter: (habit: Habit, day: string, value: number | null) => void
  /** Die letzte Eingabe - dort federt der Punkt und tickt die Serie. */
  lastChange: { habitId: string; day: string; n: number } | null
}

export interface ViewProps {
  ctx: SteadyCtx
  view: View
}
