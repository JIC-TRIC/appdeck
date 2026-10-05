// Zaehlen fuer Wochentag und Rechnen: Runde, Gesamt und Schwaechen. Reine
// Rechnung, gespeichert wird in store.ts.

import { STUFEN } from './rechnen'
import { MONATE, istSchaltjahr } from './wochentag'
import type { Aufgabe, Ergebnis, Gesamt, RechenAufgabe } from './types'

/** So viele Aufgaben bleiben einzeln gespeichert (Schwaechen). */
export const LETZTE_MAX = 200

export const LEER: Gesamt = { anzahl: 0, richtig: 0, mitTipp: 0, zeitRichtig: 0, best: null }

/** Richtig zaehlt nur, was ohne Tipp stimmt. */
export const zaehltRichtig = (a: Ergebnis) => a.r && a.t === 0

export function addiere(g: Gesamt, a: Ergebnis): Gesamt {
  const richtig = zaehltRichtig(a)
  return {
    anzahl: g.anzahl + 1,
    richtig: g.richtig + (richtig ? 1 : 0),
    mitTipp: g.mitTipp + (a.t > 0 ? 1 : 0),
    zeitRichtig: g.zeitRichtig + (richtig ? a.z : 0),
    best: richtig ? (g.best === null ? a.z : Math.min(g.best, a.z)) : g.best,
  }
}

export const zaehle = (aufgaben: Ergebnis[]) => aufgaben.reduce(addiere, LEER)

/** Prozent richtig, null ohne Aufgaben. */
export const quote = (g: Gesamt) => (g.anzahl ? Math.round((100 * g.richtig) / g.anzahl) : null)

/** Durchschnittszeit der richtigen in ms, null ohne richtige. */
export const schnitt = (g: Gesamt) => (g.richtig ? g.zeitRichtig / g.richtig : null)

// ---------- Schwaechen ----------

export interface Gruppe {
  name: string
  falsch: number
  anzahl: number
}

export interface Schwaechen {
  /** Anteil falsch (oder mit Tipp) ueber alle betrachteten Aufgaben, 0-1 */
  schnitt: number
  gruppen: Gruppe[]
}

export interface SchwaechenOptionen {
  ab?: number
  min?: number
  max?: number
}

/**
 * Wo liegt man oft daneben? Aus den letzten 200 Aufgaben, aufgeteilt in Gruppen
 * (eine Aufgabe kann in mehreren stecken). Eine Gruppe zaehlt ab `min`
 * Aufgaben; gezeigt werden hoechstens `max`, die schlechter sind als der eigene
 * Schnitt, die schlechteste zuerst. Mit Tipp zaehlt wie falsch. Unter `ab`
 * Aufgaben gibt es noch nichts (null).
 */
export function schwaechenNach<A extends Ergebnis>(
  letzte: A[],
  gruppenVon: (a: A) => [key: string, name: string][],
  { ab = 20, min = 5, max = 3 }: SchwaechenOptionen = {},
): Schwaechen | null {
  const liste = letzte.slice(-LETZTE_MAX)
  if (liste.length < ab) return null

  const gruppen = new Map<string, Gruppe>()
  let fehler = 0
  for (const a of liste) {
    const falsch = !zaehltRichtig(a)
    if (falsch) fehler++
    for (const [key, name] of gruppenVon(a)) {
      const g = gruppen.get(key) ?? { name, falsch: 0, anzahl: 0 }
      g.anzahl++
      if (falsch) g.falsch++
      gruppen.set(key, g)
    }
  }

  const schnittQuote = fehler / liste.length
  const anteil = (g: Gruppe) => g.falsch / g.anzahl
  return {
    schnitt: schnittQuote,
    gruppen: [...gruppen.values()]
      .filter((g) => g.anzahl >= min && anteil(g) > schnittQuote)
      .sort((a, b) => anteil(b) - anteil(a) || b.anzahl - a.anzahl)
      .slice(0, max),
  }
}

/** Wochentag: jeder Monat, jedes Jahrhundert und "Schaltjahr, Januar und Februar". */
function wochentagGruppen(a: Aufgabe): [string, string][] {
  const j = Number(a.d.slice(0, 4))
  const m = Number(a.d.slice(5, 7))
  const jhd = Math.floor(j / 100)
  const g: [string, string][] = [
    [`m${m}`, MONATE[m - 1]],
    [`c${jhd}`, `${jhd}00er`],
  ]
  if (istSchaltjahr(j) && m <= 2) g.push(['schalt', 'Schaltjahr, Januar und Februar'])
  return g
}

/** Rechnen: die Stufe und jede Ziffer von 2 bis 9, die in einem Faktor vorkommt. */
function rechenGruppen(a: RechenAufgabe): [string, string][] {
  const stufe = STUFEN.find((s) => s.x === String(a.x).length && s.y === String(a.y).length)
  const g: [string, string][] = stufe ? [[`s${stufe.id}`, `Stufe ${stufe.name}`]] : []
  for (const z of new Set(`${a.x}${a.y}`)) if (z >= '2') g.push([`z${z}`, `mit einer ${z}`])
  return g
}

export const schwaechen = (letzte: Aufgabe[], o?: SchwaechenOptionen) => schwaechenNach(letzte, wochentagGruppen, o)
export const schwaechenRechnen = (letzte: RechenAufgabe[], o?: SchwaechenOptionen) => schwaechenNach(letzte, rechenGruppen, o)
