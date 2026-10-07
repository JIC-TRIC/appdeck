// Konstanten zum Aufsagen: nur die Ziffern, keine Merkhilfen (konzept.md,
// Datenschutz). Mathematische mit 1000 Nachkommastellen (konstanten-ziffern.ts),
// physikalische mit ihren wenigen festgelegten oder gemessenen Stellen.

import { ZIFFERN } from './konstanten-ziffern'
import type { KVersuch } from './types'

export interface Konstante {
  id: string
  symbol: string
  name: string
  gruppe: 'mathe' | 'physik'
  /** steht fest vor den Ziffern, z. B. "π = 3," */
  vor: string
  /** die Ziffern, die man aufsagt */
  ziffern: string
  /** Komma nach so vielen getippten Ziffern (nur Physik, z. B. 6,626…) */
  komma?: number
  /** Zehnerpotenz hinter den Ziffern (Physik), z. B. '−34' fuer · 10^−34 */
  exponent?: string
  /** Einheit hinter den Ziffern (Physik) */
  einheit?: string
  info: string
}

export const KONSTANTEN: Konstante[] = [
  { id: 'pi', symbol: 'π', name: 'Kreiszahl', gruppe: 'mathe', vor: 'π = 3,', ziffern: ZIFFERN.pi, info: 'Kreisumfang durch Durchmesser' },
  { id: 'e', symbol: 'e', name: 'Eulersche Zahl', gruppe: 'mathe', vor: 'e = 2,', ziffern: ZIFFERN.e, info: 'Basis des natürlichen Logarithmus' },
  { id: 'phi', symbol: 'φ', name: 'Goldener Schnitt', gruppe: 'mathe', vor: 'φ = 1,', ziffern: ZIFFERN.phi, info: '(1 + √5) / 2' },
  { id: 'wurzel2', symbol: '√2', name: 'Wurzel aus 2', gruppe: 'mathe', vor: '√2 = 1,', ziffern: ZIFFERN.wurzel2, info: 'Diagonale im Einheitsquadrat' },
  { id: 'wurzel3', symbol: '√3', name: 'Wurzel aus 3', gruppe: 'mathe', vor: '√3 = 1,', ziffern: ZIFFERN.wurzel3, info: 'Raumdiagonale im Einheitswürfel' },
  { id: 'ln2', symbol: 'ln 2', name: 'Logarithmus von 2', gruppe: 'mathe', vor: 'ln 2 = 0,', ziffern: ZIFFERN.ln2, info: 'natürlicher Logarithmus' },
  { id: 'c', symbol: 'c', name: 'Lichtgeschwindigkeit', gruppe: 'physik', vor: 'c = ', ziffern: '299792458', einheit: 'm/s', info: 'exakt festgelegt' },
  { id: 'h', symbol: 'h', name: 'Planck-Konstante', gruppe: 'physik', vor: 'h = ', ziffern: '662607015', komma: 1, exponent: '−34', einheit: 'J·s', info: 'exakt festgelegt (seit 2019)' },
  { id: 'ladung', symbol: 'e', name: 'Elementarladung', gruppe: 'physik', vor: 'e = ', ziffern: '1602176634', komma: 1, exponent: '−19', einheit: 'C', info: 'exakt festgelegt (seit 2019)' },
  { id: 'g', symbol: 'G', name: 'Gravitationskonstante', gruppe: 'physik', vor: 'G = ', ziffern: '667430', komma: 1, exponent: '−11', einheit: 'm³/(kg·s²)', info: 'gemessen (CODATA)' },
  { id: 'nullpunkt', symbol: '0 K', name: 'Absoluter Nullpunkt', gruppe: 'physik', vor: '0 K = −', ziffern: '27315', komma: 3, einheit: '°C', info: 'exakt festgelegt' },
]

export const KONSTANTE: Record<string, Konstante> = Object.fromEntries(KONSTANTEN.map((k) => [k.id, k]))

/** Getippte Ziffern mit Komma an der richtigen Stelle (Physik), sonst unveraendert. */
export function mitKomma(k: Konstante, getippt: string) {
  if (!k.komma || getippt.length <= k.komma) return getippt
  return `${getippt.slice(0, k.komma)},${getippt.slice(k.komma)}`
}

/** Lange Konstanten (Mathematik, 1000 Stellen): Zehnerzeilen, keine Gesamtzahl in der Liste. */
export const istLang = (k: Konstante) => k.ziffern.length > 20

export interface KFehler {
  /** Stelle, 0-basiert */
  stelle: number
  ist: string
  soll: string
}

/** Getippte Ziffern pruefen: richtige Stellen bis zum ersten Fehler (zaehlt fuer
 *  den Rekord) und alle falschen Stellen - nach einem Fehler wird weitergetippt. */
export function pruefe(k: Konstante, getippt: string) {
  const fehler: KFehler[] = []
  for (let i = 0; i < getippt.length; i++) {
    if (getippt[i] !== k.ziffern[i]) fehler.push({ stelle: i, ist: getippt[i], soll: k.ziffern[i] })
  }
  return { bisFehler: fehler.length ? fehler[0].stelle : getippt.length, fehler }
}

/** Die naechsten Ziffern ab einer Stelle - nach dem Aufhoeren: "so geht es weiter". */
export const weiter = (k: Konstante, ab: number, anzahl = 20) => k.ziffern.slice(ab, ab + anzahl)

/** Bester Versuch je Konstante (Stellen bis zum ersten Fehler). */
export function rekorde(versuche: KVersuch[]): Record<string, number> {
  const r: Record<string, number> = {}
  for (const v of versuche) r[v.k] = Math.max(r[v.k] ?? 0, v.stellen)
  return r
}
