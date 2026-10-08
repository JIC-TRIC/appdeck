// Alles, was aus den Eintraegen berechnet wird: Verlauf, Veraenderung, Ziel,
// Achsen. Nichts davon wird gespeichert (konzept.md, "Die Regeln").

import { addMonths, rund } from './util'
import type { Bereich, Log, Punkt, Richtung, Wert } from './types'

/** Alle Eintraege eines Werts, aelteste zuerst. */
export function reihe(log: Log, id: string): Punkt[] {
  return Object.entries(log[id] ?? {})
    .map(([tag, zahl]) => ({ tag, zahl }))
    .sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0))
}

/** Der letzte Eintrag vor einem Tag (fuer "zuletzt" beim Messen). */
export function vorher(punkte: Punkt[], tag: string): Punkt | undefined {
  let treffer: Punkt | undefined
  for (const p of punkte) {
    if (p.tag >= tag) break
    treffer = p
  }
  return treffer
}

export type Urteil = 'gut' | 'schlecht' | 'gleich'

// Ob eine Veraenderung in die gewuenschte Richtung geht. Bei "egal" ist
// nichts gut oder schlecht - dann bleibt alles neutral.
export function urteil(richtung: Richtung, diff: number): Urteil {
  const d = rund(diff)
  if (d === 0 || richtung === 'egal') return 'gleich'
  return (d > 0) === (richtung === 'mehr') ? 'gut' : 'schlecht'
}

export interface ZielStand {
  erreicht: boolean
  /** Wie weit es noch ist (immer >= 0), in der Einheit des Werts. */
  rest: number
}

// Erreicht ist das Ziel bei "mehr" ab dem Zielwert, bei "weniger" bis zum
// Zielwert. Bei "egal" erst, wenn es genau stimmt - davor zaehlt der Abstand
// in beide Richtungen.
export function zielStand(wert: Wert, aktuell: number): ZielStand | null {
  if (wert.ziel === null) return null
  const ziel = wert.ziel
  if (wert.richtung === 'mehr') return { erreicht: aktuell >= ziel, rest: Math.max(0, rund(ziel - aktuell)) }
  if (wert.richtung === 'weniger') return { erreicht: aktuell <= ziel, rest: Math.max(0, rund(aktuell - ziel)) }
  const rest = Math.abs(rund(ziel - aktuell))
  return { erreicht: rest === 0, rest }
}

export interface Stand {
  /** Juengster Eintrag */
  letzter?: Punkt
  /** Der davor */
  davor?: Punkt
  /** Der erste ueberhaupt */
  erster?: Punkt
  anzahl: number
}

export function stand(punkte: Punkt[]): Stand {
  const n = punkte.length
  return { letzter: punkte[n - 1], davor: n > 1 ? punkte[n - 2] : undefined, erster: punkte[0], anzahl: n }
}

/** Erster Tag eines Zeitraums, null = alles. */
export function bereichAb(bereich: Bereich, heute: string): string | null {
  if (bereich === '3m') return addMonths(heute, -3)
  if (bereich === '1j') return addMonths(heute, -12)
  return null
}

export function imBereich(punkte: Punkt[], bereich: Bereich, heute: string): Punkt[] {
  const ab = bereichAb(bereich, heute)
  return ab ? punkte.filter((p) => p.tag >= ab) : punkte
}

// ---------- Achse ----------

// Schoene Schrittweite: 1, 2, 2,5 oder 5 mal einer Zehnerpotenz.
export function schritt(spanne: number, ziele = 4) {
  const roh = spanne / Math.max(1, ziele)
  if (!(roh > 0)) return 1
  const exp = 10 ** Math.floor(Math.log10(roh))
  for (const f of [1, 2, 2.5, 5, 10]) if (f * exp >= roh) return f * exp
  return 10 * exp
}

export interface Skala {
  min: number
  max: number
  ticks: number[]
}

// Die senkrechte Achse eines Verlaufs: umfasst alle Punkte und das Ziel, mit
// etwas Luft, auf schoene Zahlen gerundet. Liegt alles auf einer Zahl, gibt
// es trotzdem eine Spanne - sonst waere die Linie nicht zu sehen.
export function skala(zahlen: number[], ziel: number | null = null): Skala {
  const alle = ziel === null ? zahlen : [...zahlen, ziel]
  if (!alle.length) return { min: 0, max: 1, ticks: [0, 1] }
  let lo = Math.min(...alle)
  let hi = Math.max(...alle)
  if (hi - lo < 1e-9) {
    const luft = Math.max(1, Math.abs(hi) * 0.02)
    lo -= luft
    hi += luft
  } else {
    const luft = (hi - lo) * 0.12
    lo -= luft
    hi += luft
  }
  // Koerperwerte sind nicht negativ - die Achse dann auch nicht.
  if (Math.min(...alle) >= 0) lo = Math.max(0, lo)
  const s = schritt(hi - lo, 3)
  const min = Math.floor(lo / s) * s
  const max = Math.ceil(hi / s) * s
  const ticks: number[] = []
  for (let t = min; t <= max + s / 2; t += s) ticks.push(rund(t))
  return { min: rund(min), max: rund(max), ticks }
}
