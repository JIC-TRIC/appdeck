// Datenmodell von Form. Regeln und Gruende: konzept.md.

/** Was bei einem Wert besser ist - danach faerbt sich jede Veraenderung. */
export type Richtung = 'mehr' | 'weniger' | 'egal'

/** Etwas, das verfolgt wird: Gewicht, Bizeps, Taille ... */
export interface Wert {
  id: string
  /** Eine Zeile, getrimmt, hoechstens NAME_MAX Zeichen. */
  name: string
  /** Frei: 'kg', 'cm', '%' oder leer. */
  einheit: string
  richtung: Richtung
  /** Zielwert in der Einheit des Werts, null = kein Ziel. */
  ziel: number | null
  /** Zeitpunkt des Anlegens (ms) - bestimmt die Reihenfolge. */
  erstellt: number
}

/**
 * Eintraege: pro Wert pro Tag hoechstens eine Zahl. Ein zweites Messen am
 * selben Tag ersetzt die erste. Alles andere (Veraenderung, Ziel, Verlauf)
 * wird daraus berechnet und nie gespeichert.
 */
export type WertLog = Record<string, number> // Tag 'YYYY-MM-DD' -> Zahl
export type Log = Record<string, WertLog> // Wert-id -> Eintraege

/** Ein Punkt im Verlauf. */
export interface Punkt {
  tag: string
  zahl: number
}

/** Zeitraum im Verlauf eines Werts. */
export type Bereich = '3m' | '1j' | 'alles'

/** Seiten ueber der Uebersicht. */
export type View =
  | { name: 'wert'; id: string }
  | { name: 'messen'; tag: string }
  | { name: 'wertForm'; id?: string }

export interface FormCtx {
  werte: Wert[]
  log: Log
  byId: Record<string, Wert>
  heute: string
  push: (view: View) => void
  back: () => void
  toRoot: () => void
  /** Nach jeder Aenderung alles neu aus dem Speicher lesen. */
  refresh: () => void
  /** Kurze Meldung oben. */
  melde: (text: string) => void
}
