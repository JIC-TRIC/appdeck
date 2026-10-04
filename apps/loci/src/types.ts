// Datenmodell von Loci. Regeln und Gruende: konzept.md.

export type Reiter = 'wochentag' | 'karten'

export type ZeitraumId = 'jahr' | '1900' | '1600' | 'eigen'

/** von/bis gelten nur bei "eigen" - die anderen Zeitraeume stehen fest (siehe ZEITRAEUME). */
export interface Zeitraum {
  id: ZeitraumId
  von: number
  bis: number
}

export type Deckgroesse = 10 | 20 | 26 | 52

export interface Einstellungen {
  reiter: Reiter
  /** Uhr anzeigen - gemessen wird immer. Gilt fuer beide Uebungen. */
  uhr: boolean
  zeitraum: Zeitraum
  /** takt in Sekunden; bleibt stehen, wenn der Taktgeber aus ist. */
  deck: { anzahl: Deckgroesse; taktAn: boolean; takt: number }
  anleitungGesehen: boolean
}

export interface Datum {
  t: number
  m: number
  j: number
}

/** Eine beantwortete Wochentag-Aufgabe. */
export interface Aufgabe {
  /** Datum der Aufgabe, YYYY-MM-DD */
  d: string
  /** gewaehlte Antwort 0-6 (0 = Sonntag) */
  a: number
  /** Antwort stimmt (auch mit Tipp) */
  r: boolean
  /** Zeit in ms */
  z: number
  /** Anzahl aufgedeckter Tipps */
  t: number
}

export interface WtGesamt {
  anzahl: number
  /** richtig und ohne Tipp */
  richtig: number
  mitTipp: number
  /** Summe der Zeiten der richtigen (fuer den Schnitt) */
  zeitRichtig: number
  best: number | null
}

export interface WtDaten {
  gesamt: WtGesamt
  /** die letzten LETZTE_MAX Aufgaben, die neueste zuletzt */
  letzte: Aufgabe[]
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
