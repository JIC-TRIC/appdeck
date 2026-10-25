// Datenmodell von Tick. Regeln und Gruende: konzept.md.

/** Ein Todo. Ohne Ordner (null) liegt es im Eingang. */
export interface Todo {
  id: string
  /** Eine Zeile, getrimmt, nie leer. */
  titel: string
  /** Beliebig viele Zeilen, darf leer sein. */
  notiz: string
  /** id eines Ordners oder null = Eingang */
  ordner: string | null
  /** Tag ohne Uhrzeit, 'YYYY-MM-DD' */
  faellig: string | null
  /** Reihenfolge innerhalb des Ordners, kleiner = weiter oben */
  rang: number
  /** Zeitpunkt des Anlegens (ms) */
  angelegt: number
  /** Zeitpunkt des Abhakens (ms), null = offen */
  erledigt: number | null
}

export interface Ordner {
  id: string
  /** Eindeutig (Gross/klein egal), hoechstens NAME_MAX Zeichen */
  name: string
  /** Index in FARBEN (farben.ts) */
  farbe: number
  /** Reihenfolge der Karten und der Abschnitte in „Alle“ */
  rang: number
}

/** Was gerade im Schnellfeld steht - uebersteht das Schliessen der App. */
export interface Entwurf {
  titel: string
  ordner: string | null
  faellig: string | null
}

/** Die zuletzt offene Seite: 'start' (alle Ordner), 'alle', 'eingang' oder die id eines Ordners. */
export type Seite = string

/** Eine Seite ueber der Startseite: Alle, der Eingang oder ein Ordner. */
export type View = { name: 'liste'; ansicht: string }
