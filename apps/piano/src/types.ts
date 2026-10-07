// Datenformen. Die gespeicherten (Piece, Session, Setlist, Playlist, Settings)
// sind dieselben wie in der alten App piano-practice-tracker - nur ergaenzt,
// nie umbenannt, damit alte Exporte weiter passen.

export type Difficulty = 'Unknown' | 'Free' | 'Easy' | 'Medium' | 'Hard' | 'Ultrahard'

/** 0 = noch nicht, 1 = langsam (bzw. Noten im Kopf), 2 = im Tempo (bzw. ganz) */
export type Level = 0 | 1 | 2

export interface Progress {
  rightHand: Level
  leftHand: Level
  together: Level
  dynamics: boolean
  memorized: Level
}

export interface Piece {
  id: string
  title: string
  artist: string
  youtubeUrl: string
  thumbnail?: string | null
  difficulty: Difficulty
  progress: Progress
  notes?: string
  /** Archiviert seit (ISO) - faellt aus Tagesliste und Uebersicht, Sitzungen bleiben */
  archivedAt?: string | null
  lastPracticed: string | null
  createdAt?: string
  /** Altlast der alten App, immer 0 - die Zeit steckt in den Sitzungen */
  practiceTime?: number
}

export interface Session {
  /** Ende der Sitzung (ISO) */
  timestamp: string
  /** Sekunden */
  duration: number
}

export type Sessions = Record<string, Session[]>

export type SortBy =
  | 'trending'
  | 'lastPracticed'
  | 'practiceTime'
  | 'progress'
  | 'difficulty'
  | 'title'
  | 'default'
  | 'random'

/** Filter in Stuecke: in einer Gruppe reicht eins, beide Gruppen muessen passen. Leer = alles. */
export interface PieceFilter {
  difficulty: Difficulty[]
  status: Status[]
}

export interface Settings {
  dailyGoalMinutes: number
  videoMode: 'app' | 'youtube'
  /** Tageswechsel in Stunden, 0-6 */
  dayStart: number
  sort: { by: SortBy; reverse: boolean }
  filter: PieceFilter
  /** Felder der alten App (showExternalYouTubeButton, colorScheme, …) bleiben stehen */
  [legacy: string]: unknown
}

export interface Setlist {
  id: string
  title: string
  pieceIds: string[]
}

export interface Playlist {
  /** logischer Tag 'YYYY-MM-DD' */
  date: string
  pieceIds: string[]
  seed: number
  /** Heute weggewischt ("heute nicht") - kommt heute nicht wieder */
  skipped?: string[]
}

/** Laufende Sitzung - ueberlebt, wenn iOS die App im Hintergrund beendet. */
export interface Uebung {
  pieceId: string
  /** Stuecke, die danach dran sind (Tagesliste, Setlist) */
  queue: string[]
  startedAt: number
  /** bisher pausierte Millisekunden */
  pausedMs: number
  /** seit wann pausiert, sonst null */
  pausedAt: number | null
}

export type Status = 'not_started' | 'hands' | 'together' | 'learned' | 'memorizing' | 'mastered'

export type Tab = 'heute' | 'stuecke' | 'statistik'

export type ViewName = 'stueck' | 'verlauf' | 'setlists' | 'setlist' | 'einstellungen'

export interface View {
  name: ViewName
  pieceId?: string
  setlistId?: string
}

export interface PianoCtx {
  /** alle Stuecke, auch archivierte */
  pieces: Piece[]
  /** nur die nicht archivierten */
  active: Piece[]
  byId: Record<string, Piece>
  sessions: Sessions
  settings: Settings
  setlists: Setlist[]
  /** logischer Tag 'YYYY-MM-DD' */
  today: string
  now: number
  tab: Tab
  /** Titel der Seite darunter - fuer den Zurueck-Knopf */
  backLabel: string
  push: (view: View) => void
  back: () => void
  refresh: () => void
  notify: (message: string, undo?: () => void) => void
  /** Uebt das erste Stueck, die restlichen danach der Reihe nach */
  startUebung: (pieceIds: string[]) => void
  /** Blatt "Neues Stueck" bzw. "Bearbeiten" */
  openForm: (pieceId?: string) => void
  /** Datei waehlen und als Backup einspielen (mit Rueckfrage) */
  importBackup: () => void
  onExit: () => void
}

export interface ViewProps {
  ctx: PianoCtx
  view: View
}
