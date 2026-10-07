// Betraege verbergen (Diskret-Modus) - Regeln in konzept.md, "Beträge verbergen".
//
// Alles, was zusammengerechnet ist (Summen, Salden, Budgets, Durchschnitte),
// steht als •••• da. Einzelne Buchungen erst ab einer Grenze: ein Kaffee
// verraet nichts, das Gehalt schon.

import { createContext, useContext } from 'react'
import type { Settings } from './types'

export const MASKE = '••••'

export interface Diskret {
  an: boolean
  /** Einzelbuchungen ab hier verbergen (Cent). null = nie, 0 = alle */
  abCent: number | null
}

/** Standard fuer "Einzelbuchungen verbergen ab": 100 € */
export const DISKRET_AB_STANDARD = 10000

export const DISKRET_GRENZEN: { cent: number | null; label: string }[] = [
  { cent: null, label: 'Nie' },
  { cent: 5000, label: '50 €' },
  { cent: 10000, label: '100 €' },
  { cent: 25000, label: '250 €' },
  { cent: 0, label: 'Alle' },
]

export function diskretAus(settings: Pick<Settings, 'diskret' | 'diskretAbCent'>): Diskret {
  const ab = settings.diskretAbCent
  return {
    an: settings.diskret === true,
    abCent: ab === null ? null : typeof ab === 'number' && ab >= 0 ? ab : DISKRET_AB_STANDARD,
  }
}

/** Wird dieser Betrag verdeckt? Summen immer, Einzelbuchungen erst ab der Grenze. */
export function verdeckt(d: Diskret, cent: number, einzel = false) {
  if (!d.an) return false
  if (!einzel) return true
  return d.abCent !== null && Math.abs(cent) >= d.abCent
}

/** Fuer Text ausserhalb von <Money>: der Betrag oder die Maske. */
export function betragOderMaske(d: Diskret, cent: number, text: string, einzel = false) {
  return verdeckt(d, cent, einzel) ? MASKE : text
}

export const DiskretContext = createContext<Diskret>({ an: false, abCent: DISKRET_AB_STANDARD })

export const useDiskret = () => useContext(DiskretContext)
