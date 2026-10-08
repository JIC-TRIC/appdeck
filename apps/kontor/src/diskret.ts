// Betraege verbergen (Diskret-Modus) - Regeln in konzept.md, "Beträge verbergen".
//
// Alles, was zusammengerechnet ist (Summen, Salden, Budgets, Durchschnitte),
// steht als •••• da. Einzelne Buchungen bleiben immer lesbar.

import { createContext, useContext } from 'react'
import type { Settings } from './types'

export const MASKE = '••••'

export interface Diskret {
  an: boolean
}

export function diskretAus(settings: Pick<Settings, 'diskret'>): Diskret {
  return { an: settings.diskret === true }
}

/** Wird dieser Betrag verdeckt? Summen ja, einzelne Buchungen nie. */
export function verdeckt(d: Diskret, einzel = false) {
  return d.an && !einzel
}

/** Fuer eine Summe ausserhalb von <Money>: der Betrag oder die Maske. */
export function betragOderMaske(d: Diskret, text: string) {
  return d.an ? MASKE : text
}

export const DiskretContext = createContext<Diskret>({ an: false })

export const useDiskret = () => useContext(DiskretContext)
