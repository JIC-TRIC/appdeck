// Texte aus den Daten: Zeitangaben, der Text fuer die Zwischenablage und die
// Titel-Vorschlaege. Alles ohne Speicher, getestet in text.test.ts.

import type { Notiz } from './types'

/** So viele zuletzt benutzte Titel stehen als Vorschlag unter dem Feld. */
export const TITEL_MAX = 6

const zwei = (n: number) => String(n).padStart(2, '0')
const uhr = (d: Date) => `${zwei(d.getHours())}:${zwei(d.getMinutes())}`
const tagStart = (ms: number) => {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}
const WOCHENTAG = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']

/** „5.10. 14:32“, aus einem anderen Jahr „5.10.2025 14:32“ - fuer die Zwischenablage. */
export function zeitpunkt(ms: number, jetzt = Date.now()): string {
  const d = new Date(ms)
  const jahr = d.getFullYear() === new Date(jetzt).getFullYear() ? '' : String(d.getFullYear())
  return `${d.getDate()}.${d.getMonth() + 1}.${jahr} ${uhr(d)}`
}

/**
 * Fuer die Liste in der App: „heute 14:32“, „gestern 09:05“, in der letzten
 * Woche „Fr 18:05“, sonst „Fr 3.10. 18:05“.
 */
export function wann(ms: number, jetzt = Date.now()): string {
  const tage = Math.round((tagStart(jetzt) - tagStart(ms)) / 86_400_000)
  const d = new Date(ms)
  if (tage === 0) return `heute ${uhr(d)}`
  if (tage === 1) return `gestern ${uhr(d)}`
  if (tage > 1 && tage < 7) return `${WOCHENTAG[d.getDay()]} ${uhr(d)}`
  return `${WOCHENTAG[d.getDay()]} ${zeitpunkt(ms, jetzt)}`
}

export const anzahl = (n: number) => `${n} ${n === 1 ? 'Notiz' : 'Notizen'}`

/**
 * Der ganze Stapel als ein Text fuer WhatsApp: Titel fett (*…*), dahinter
 * Datum und Uhrzeit, darunter die Notiz. Ohne Titel steht nur die Zeit da,
 * kursiv (_…_). Aelteste zuerst, eine Leerzeile dazwischen.
 */
export function kopierText(notizen: Notiz[], jetzt = Date.now()): string {
  return notizen
    .map((n) => {
      const z = zeitpunkt(n.erstellt, jetzt)
      const kopf = n.titel ? `*${n.titel}* · ${z}` : `_${z}_`
      return n.text ? `${kopf}\n${n.text}` : kopf
    })
    .join('\n\n')
}

/** Titel nach vorn holen (ohne Doppelte, Gross/klein egal), hoechstens TITEL_MAX. */
export function merkeTitel(liste: string[], titel: string): string[] {
  const t = titel.replace(/\s+/g, ' ').trim()
  if (!t) return liste.slice(0, TITEL_MAX)
  const klein = t.toLowerCase()
  return [t, ...liste.filter((x) => x.toLowerCase() !== klein)].slice(0, TITEL_MAX)
}

/** Vorschlaege, die zum Getippten passen - bei leerem Feld alle. */
export function passendeTitel(liste: string[], eingabe: string): string[] {
  const q = eingabe.replace(/\s+/g, ' ').trim().toLowerCase()
  return q ? liste.filter((t) => t.toLowerCase().includes(q)) : liste
}

/** Steht genau dieser Vorschlag im Feld? (Gross/klein egal) */
export const istGewaehlt = (vorschlag: string, eingabe: string) =>
  vorschlag.toLowerCase() === eingabe.replace(/\s+/g, ' ').trim().toLowerCase()

/**
 * Was zu genau diesem Titel noch im Stapel liegt (Gross/klein egal), aelteste
 * zuerst - damit man beim zweiten Eintrag zum selben Thema nichts doppelt schreibt.
 */
export function imStapelZuTitel(notizen: Notiz[], eingabe: string): Notiz[] {
  const t = eingabe.replace(/\s+/g, ' ').trim().toLowerCase()
  return t ? notizen.filter((n) => n.titel.toLowerCase() === t) : []
}
