// Kartendeck: Karten, Mischen, Stellen belegen, Wertung. Reine Rechnung -
// die Bilder haengt bilder.ts an, damit die Tests ohne Vite auskommen.

import type { Versuch } from './types'

export interface Farbe {
  id: 'pik' | 'herz' | 'kreuz' | 'karo'
  name: string
  /** U+FE0E: als Schrift zeichnen, nicht als Emoji */
  symbol: string
  rot: boolean
}

export interface Wert {
  id: string
  /** so wie auf der Karte und der Taste */
  kurz: string
  /** vorgelesen und in Listen */
  name: string
}

export const FARBEN: Farbe[] = [
  { id: 'pik', name: 'Pik', symbol: '♠︎', rot: false },
  { id: 'herz', name: 'Herz', symbol: '♥︎', rot: true },
  { id: 'kreuz', name: 'Kreuz', symbol: '♣︎', rot: false },
  { id: 'karo', name: 'Karo', symbol: '♦︎', rot: true },
]

export const WERTE: Wert[] = [
  { id: 'ass', kurz: 'A', name: 'Ass' },
  ...['2', '3', '4', '5', '6', '7', '8', '9', '10'].map((w) => ({ id: w, kurz: w, name: w })),
  { id: 'j', kurz: 'J', name: 'Bube' },
  { id: 'q', kurz: 'Q', name: 'Dame' },
  { id: 'k', kurz: 'K', name: 'König' },
]

export interface Karte {
  /** wie die Bilddatei: herz-k, pik-ass, karo-10 */
  id: string
  farbe: Farbe
  wert: Wert
  name: string
}

export const kartenId = (farbe: string, wert: string) => `${farbe}-${wert}`

export const KARTEN: Karte[] = FARBEN.flatMap((farbe) =>
  WERTE.map((wert) => ({ id: kartenId(farbe.id, wert.id), farbe, wert, name: `${farbe.name} ${wert.name}` })),
)

export const KARTE: Record<string, Karte> = Object.fromEntries(KARTEN.map((k) => [k.id, k]))

export const ANZAHLEN = [10, 20, 26, 52] as const
export const TAKT_MIN = 0.5
export const TAKT_MAX = 10
export const TAKT_SCHRITT = 0.5

/** Gleich verteilte Zahl von 0 bis n - 1 aus crypto. */
export function sichererZufall(n: number): number {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] % n
}

/** Fisher-Yates. */
export function mische<T>(liste: readonly T[], zufall: (n: number) => number = sichererZufall): T[] {
  const a = [...liste]
  for (let i = a.length - 1; i > 0; i--) {
    const j = zufall(i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ---------- Wiedergeben ----------

/** Gelegte Karten-IDs pro Stelle, null = leer. */
export type Antworten = (string | null)[]

export interface Stand {
  antworten: Antworten
  /** aktive Stelle; = Anzahl der Stellen, wenn alles belegt ist */
  aktiv: number
}

/** Naechste leere Stelle ab `ab`, ringsum. Keine mehr frei: die Anzahl der Stellen. */
export function naechsterFreierPlatz(antworten: Antworten, ab: number): number {
  const n = antworten.length
  for (let s = 0; s < n; s++) {
    const i = (ab + s) % n
    if (!antworten[i]) return i
  }
  return n
}

/** Karte an die aktive Stelle legen (eine belegte wird ersetzt), dann zur naechsten freien. */
export function lege({ antworten, aktiv }: Stand, id: string): Stand {
  if (aktiv >= antworten.length) return { antworten, aktiv }
  const neu = [...antworten]
  neu[aktiv] = id
  return { antworten: neu, aktiv: naechsterFreierPlatz(neu, aktiv + 1) }
}

/**
 * ⌫: die aktive Stelle leeren, wenn sie belegt ist - sonst die letzte belegte
 * Stelle davor leeren und aktiv machen.
 */
export function loesche({ antworten, aktiv }: Stand): Stand {
  if (aktiv < antworten.length && antworten[aktiv]) {
    const neu = [...antworten]
    neu[aktiv] = null
    return { antworten: neu, aktiv }
  }
  for (let i = Math.min(aktiv, antworten.length) - 1; i >= 0; i--) {
    if (antworten[i]) {
      const neu = [...antworten]
      neu[i] = null
      return { antworten: neu, aktiv: i }
    }
  }
  return { antworten, aktiv }
}

// ---------- Wertung ----------

export interface Wertung {
  n: number
  /** Stellen von vorn, bis eine falsch oder leer ist */
  bisFehler: number
  /** alle Treffer */
  richtig: number
}

export function wertung(deck: string[], antworten: Antworten): Wertung {
  const n = deck.length
  let bisFehler = 0
  while (bisFehler < n && antworten[bisFehler] === deck[bisFehler]) bisFehler++
  return { n, bisFehler, richtig: deck.filter((id, i) => antworten[i] === id).length }
}

/** Kuerzeste Merkzeit fehlerfreier Versuche je Deckgroesse. */
export function bestzeiten(versuche: Versuch[]): Record<number, number | null> {
  const best: Record<number, number | null> = Object.fromEntries(ANZAHLEN.map((n) => [n, null]))
  for (const v of versuche) {
    if (v.richtig !== v.n) continue
    const b = best[v.n]
    if (b === null || b === undefined || v.merk < b) best[v.n] = v.merk
  }
  return best
}
