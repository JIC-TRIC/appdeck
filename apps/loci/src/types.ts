// Datenmodell von Loci. Regeln und Gruende: konzept.md.

export type Reiter = 'wochentag' | 'rechnen' | 'karten' | 'konstanten'

export type ZeitraumId = 'jahr' | '1900' | '1600' | 'eigen'

/** von/bis gelten nur bei "eigen" - die anderen Zeitraeume stehen fest (siehe ZEITRAEUME). */
export interface Zeitraum {
  id: ZeitraumId
  von: number
  bis: number
}

export type Deckgroesse = 10 | 20 | 26 | 52

/** Stellen der beiden Faktoren, der groessere zuerst. */
export type Stufe = '2x1' | '3x1' | '2x2' | '3x2' | '3x3'

/** Zerlegen: von links nach rechts in Teilprodukte. Ueberkreuz: Spalte fuer Spalte von rechts. */
export type Methode = 'zerlegen' | 'ueberkreuz'

export interface Einstellungen {
  reiter: Reiter
  /** Uhr anzeigen - gemessen wird immer. Gilt fuer alle Uebungen. */
  uhr: boolean
  zeitraum: Zeitraum
  /** takt in Sekunden; bleibt stehen, wenn der Taktgeber aus ist. */
  deck: { anzahl: Deckgroesse; taktAn: boolean; takt: number }
  rechnen: { stufe: Stufe; methode: Methode }
  /** Anleitung Wochentag schon einmal gesehen (oeffnet sich beim ersten Start) */
  anleitungGesehen: boolean
  /** Anleitung Rechnen schon einmal gesehen */
  anleitungRechnen: boolean
}

export interface Datum {
  t: number
  m: number
  j: number
}

/** Was jede beantwortete Aufgabe hat - darauf zaehlt statistik.ts. */
export interface Ergebnis {
  /** Antwort stimmt (auch mit Tipp) */
  r: boolean
  /** Zeit in ms */
  z: number
  /** Anzahl aufgedeckter Tipps */
  t: number
}

/** Eine beantwortete Wochentag-Aufgabe. */
export interface Aufgabe extends Ergebnis {
  /** Datum der Aufgabe, YYYY-MM-DD */
  d: string
  /** gewaehlte Antwort 0-6 (0 = Sonntag) */
  a: number
}

/** Eine beantwortete Malaufgabe x · y (x hat mindestens so viele Stellen wie y). */
export interface RechenAufgabe extends Ergebnis {
  x: number
  y: number
  /** eingetippte Antwort */
  a: number
}

export interface Gesamt {
  anzahl: number
  /** richtig und ohne Tipp */
  richtig: number
  mitTipp: number
  /** Summe der Zeiten der richtigen (fuer den Schnitt) */
  zeitRichtig: number
  best: number | null
}

export interface Uebungsdaten<A extends Ergebnis> {
  gesamt: Gesamt
  /** die letzten LETZTE_MAX Aufgaben, die neueste zuletzt */
  letzte: A[]
}

/** Ein abgegebener Kartendeck-Versuch. */
export interface Versuch {
  /** Ende, ms seit 1970 */
  zeit: number
  n: number
  bisFehler: number
  richtig: number
  merk: number
  wieder: number
  /** Sekunden, null = ohne Taktgeber */
  takt: number | null
}

/** Ein Durchgang Konstante aufsagen. */
export interface KVersuch {
  /** id der Konstante */
  k: string
  /** richtige Stellen bis zum ersten Fehler oder Aufhoeren */
  stellen: number
  /** Ende, ms seit 1970 */
  ende: number
  dauer: number
  /** mindestens ein Fehler (seit 07.10.2026 wird danach weitergetippt; vorher
   *  beendete der erste Fehler den Durchgang) */
  fehler: boolean
}
