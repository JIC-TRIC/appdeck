// Datenmodell von Punch. Regeln und Gruende: konzept.md.

/** Eine Taetigkeit innerhalb eines Bereichs, z. B. Uni → Statistik. */
export interface Taetigkeit {
  id: string
  /** Eindeutig im Bereich (Gross/klein egal), hoechstens NAME_MAX Zeichen */
  name: string
  archiviert: boolean
  /** Zuletzt gestartet oder gesichert (ms) - danach sortiert die Auswahl. */
  zuletzt: number | null
}

/** Ein Bereich wie Job, Uni oder Side Job. Die Reihenfolge der Liste ist die der Knoepfe. */
export interface Bereich {
  id: string
  /** Eindeutig (Gross/klein egal), hoechstens NAME_MAX Zeichen */
  name: string
  /** Index in FARBEN (farben.ts) */
  farbe: number
  archiviert: boolean
  taetigkeiten: Taetigkeit[]
}

/** Ein abgeschlossener Block. Zeiten in ms, ende > start. */
export interface Block {
  id: string
  bereich: string
  taetigkeit: string | null
  notiz: string
  start: number
  ende: number
}

/** Der laufende Block: gespeichert ist nur sein Start, die Dauer rechnet die App. */
export interface Laeuft {
  bereich: string
  taetigkeit: string | null
  notiz: string
  start: number
}

export type Art = 'woche' | 'monat' | 'jahr'

/** Ein Zeitraum der Statistik, beginnend an seinem ersten Tag 'YYYY-MM-DD'. */
export interface Periode {
  art: Art
  tag: string
}

/** Eine Seite ueber dem Tag (Startseite). */
export type View = { name: 'statistik'; periode: Periode } | { name: 'bereiche' } | { name: 'tag'; tag: string }
