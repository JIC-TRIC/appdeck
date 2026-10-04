// Zaehlen fuer den Wochentag: Runde, Gesamt und Schwaechen. Reine Rechnung,
// gespeichert wird in store.ts.

import { MONATE, istSchaltjahr } from './wochentag'
import type { Aufgabe, WtGesamt } from './types'

/** So viele Aufgaben bleiben einzeln gespeichert (Verlauf und Schwaechen). */
export const LETZTE_MAX = 200

export const LEER: WtGesamt = { anzahl: 0, richtig: 0, mitTipp: 0, zeitRichtig: 0, best: null }

/** Richtig zaehlt nur, was ohne Tipp stimmt. */
export const zaehltRichtig = (a: Aufgabe) => a.r && a.t === 0

export function addiere(g: WtGesamt, a: Aufgabe): WtGesamt {
  const richtig = zaehltRichtig(a)
  return {
    anzahl: g.anzahl + 1,
    richtig: g.richtig + (richtig ? 1 : 0),
    mitTipp: g.mitTipp + (a.t > 0 ? 1 : 0),
    zeitRichtig: g.zeitRichtig + (richtig ? a.z : 0),
    best: richtig ? (g.best === null ? a.z : Math.min(g.best, a.z)) : g.best,
  }
}

export const zaehle = (aufgaben: Aufgabe[]) => aufgaben.reduce(addiere, LEER)

/** Prozent richtig, null ohne Aufgaben. */
export const quote = (g: WtGesamt) => (g.anzahl ? Math.round((100 * g.richtig) / g.anzahl) : null)

/** Durchschnittszeit der richtigen in ms, null ohne richtige. */
export const schnitt = (g: WtGesamt) => (g.richtig ? g.zeitRichtig / g.richtig : null)

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

/**
 * Wo liegt man oft daneben? Aus den letzten 200 Aufgaben: jeder Monat, jedes
 * Jahrhundert und "Schaltjahr, Januar und Februar". Eine Gruppe zaehlt ab
 * `min` Aufgaben; gezeigt werden hoechstens `max`, die schlechter sind als der
 * eigene Schnitt, die schlechteste zuerst. Mit Tipp zaehlt wie falsch.
 * Unter `ab` Aufgaben gibt es noch nichts (null).
 */
export function schwaechen(letzte: Aufgabe[], { ab = 20, min = 5, max = 3 } = {}): Schwaechen | null {
  const liste = letzte.slice(-LETZTE_MAX)
  if (liste.length < ab) return null

  const gruppen = new Map<string, Gruppe>()
  const zaehlen = (key: string, name: string, falsch: boolean) => {
    const g = gruppen.get(key) ?? { name, falsch: 0, anzahl: 0 }
    g.anzahl++
    if (falsch) g.falsch++
    gruppen.set(key, g)
  }

  let fehler = 0
  for (const a of liste) {
    const j = Number(a.d.slice(0, 4))
    const m = Number(a.d.slice(5, 7))
    const falsch = !zaehltRichtig(a)
    if (falsch) fehler++
    zaehlen(`m${m}`, MONATE[m - 1], falsch)
    const jhd = Math.floor(j / 100)
    zaehlen(`c${jhd}`, `${jhd}00er`, falsch)
    if (istSchaltjahr(j) && m <= 2) zaehlen('schalt', 'Schaltjahr, Januar und Februar', falsch)
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
