// Datenmodell von Form. Regeln und Gruende: konzept.md.

import type { PausenKorrektur } from './trainingCalc'

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

// ---------- Training ----------

/** Was pro Satz eingetragen wird: Gewicht und Wdh, nur Wdh oder eine Zeit. */
export type Erfassung = 'gewicht' | 'wdh' | 'zeit'

export interface Uebung {
  id: string
  name: string
  erfassung: Erfassung
  /** Pause in Sekunden - ab da wird die Zeit oben orange. */
  pause: number
  /** Steht im Training unter dem Namen ("Sitz Stufe 4"). */
  notiz: string
  /** Gewichtsschritt in kg - fuer +/- im Tastenfeld und den Vorschlag. */
  schritt: number
  /** Gewicht der Stange (kg) fuer den Scheibenrechner, null = keine Langhantel. */
  stange: number | null
  archiviert: boolean
  erstellt: number
}

export interface VorlagenUebung {
  uebung: string
  /** Arbeitssaetze */
  saetze: number
  /** Aufwaermsaetze davor */
  aufwaermen: number
  /** Wdh-Bereich, steht im Training neben dem Namen. null = keiner. */
  von: number | null
  bis: number | null
}

export interface Vorlage {
  id: string
  name: string
  uebungen: VorlagenUebung[]
  /** Reihenfolge auf der Startseite (aufsteigend). */
  rang: number
}

/**
 * Ein Satz. Leere Zahlen heissen: noch nichts getippt - dann gilt, was grau
 * dasteht (das letzte Mal). `fertig` ist die Uhrzeit des Hakens; daraus
 * rechnet sich die Pause.
 */
export interface Satz {
  kg: number | null
  wdh: number | null
  /** Bei Erfassung 'zeit' (Sekunden). */
  sek: number | null
  fertig: number | null
  /** Aufwaermsatz: zaehlt nicht fuer Rekorde, Volumen und Vorschlag. */
  aufwaermen: boolean
}

export interface TrainingsUebung {
  uebung: string
  saetze: Satz[]
}

export interface Training {
  id: string
  /** Vorlage, aus der es gestartet wurde - null = leeres Training. */
  vorlage: string | null
  /** Name beim Start (Vorlagenname oder "Training"). */
  name: string
  start: number
  /** null = laeuft noch */
  ende: number | null
  uebungen: TrainingsUebung[]
  notiz: string
}

/** Schalter im Menue des Trainings und das Wochenziel. */
export interface Einstellungen {
  /** Kurzer Ton, wenn die Pause der Uebung um ist (nur bei offener App). */
  ton: boolean
  /** Bildschirm bleibt an, solange ein Training laeuft. */
  wach: boolean
  /** Trainings pro Woche (1-7), null = kein Ziel. */
  wochenziel: number | null
}

/** Wo Form zuletzt war - danach oeffnet es den Tab Werte oder Training. */
export type AppBereich = 'werte' | 'training'

/** Die Tab-Leiste unten - immer da, auch waehrend eines Trainings. */
export type Tab = 'training' | 'kalender' | 'statistik' | 'uebungen' | 'werte'

/** Seiten ueber der Uebersicht. */
export type View =
  | { name: 'wert'; id: string }
  | { name: 'messen'; tag: string }
  | { name: 'wertForm'; id?: string }
  | { name: 'fertig'; id: string }
  | { name: 'training'; id: string }
  /** Ein beendetes Training aendern oder ein nachgetragenes fertig machen. */
  | { name: 'bearbeiten'; id: string }
  | { name: 'neu'; training: Training }
  /** Aus dem Kalender mit dem gewaehlten Tag, sonst gestern. */
  | { name: 'nachtragen'; tag?: string }
  | { name: 'uebung'; id: string }
  | { name: 'uebungForm'; id?: string }
  | { name: 'vorlagen' }
  | { name: 'vorlageForm'; id?: string }

export interface FormCtx {
  werte: Wert[]
  log: Log
  byId: Record<string, Wert>
  uebungen: Uebung[]
  uebungById: Record<string, Uebung>
  vorlagen: Vorlage[]
  /** Beendete Trainings, aelteste zuerst. */
  trainings: Training[]
  laufend: Training | null
  /** Die Pause nach dem letzten Haken, von Hand geaendert (+-15 s, Ueberspringen). */
  pausenKorrektur: PausenKorrektur | null
  einstellungen: Einstellungen
  /** Der aktive Tab und der Wechsel dorthin (zur Startseite des Tabs). */
  tab: Tab
  zeigeTab: (t: Tab) => void
  heute: string
  push: (view: View) => void
  /** Oberste Seite ersetzen (Nachtragen -> Training), zurueck geht dann eine weiter. */
  replace: (view: View) => void
  back: () => void
  toRoot: () => void
  /** Nach jeder Aenderung alles neu aus dem Speicher lesen. */
  refresh: () => void
  /** Kurze Meldung oben - 'rekord' in Orange und etwas laenger. */
  melde: (text: string, art?: 'rekord') => void
}
