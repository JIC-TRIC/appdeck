// Geld und Datum - beides liegt hier, weil beides ueberall gebraucht wird und
// beides genau eine Wahrheit haben muss.

import type { PeriodKind, Range } from './types'

// ---------- Geld ----------

// Alle Betraege sind ganze Cent. Float-Addition erzeugt sonst Cent-Differenzen
// in den Summen ("0,1 + 0,2").

// Euro-Teil und Cent-Teil getrennt, damit die Anzeige den Cent kleiner setzen
// kann. Das Vorzeichen entscheidet der Aufrufer.
export function splitCent(cent: number) {
  const neg = cent < 0
  const abs = Math.abs(Math.round(cent))
  return {
    neg,
    int: Math.floor(abs / 100).toLocaleString('de-DE'),
    frac: String(abs % 100).padStart(2, '0'),
  }
}

// '1.234,56' - ohne Waehrung und ohne Vorzeichen.
export function formatCent(cent: number) {
  const { int, frac } = splitCent(cent)
  return `${int},${frac}`
}

// Mit Minuszeichen, wenn negativ. Typografisches Minus, kein Bindestrich.
export function formatSigned(cent: number) {
  return (cent < 0 ? '−' : '') + formatCent(cent)
}

// Mit Vorzeichen in beide Richtungen - fuer Differenzen und Korrekturen.
export function formatDelta(cent: number) {
  if (cent === 0) return formatCent(0)
  return (cent < 0 ? '−' : '+') + formatCent(cent)
}

export function formatEuro(cent: number) {
  return `${formatSigned(cent)} €`
}

// Eingabetext des Ziffernfelds ('24', '24,9', '24,90') in Cent.
export function textToCent(text: string) {
  if (!text) return 0
  const [euro, cents = ''] = String(text).split(',')
  const e = Number(euro.replace(/\D/g, '')) || 0
  const c = Number((cents + '00').slice(0, 2)) || 0
  return e * 100 + c
}

// Cent zurueck in Eingabetext - fuer "Buchung bearbeiten".
export function centToText(cent: number) {
  const abs = Math.abs(Math.round(cent))
  const frac = abs % 100
  const int = Math.floor(abs / 100)
  return frac === 0 ? String(int) : `${int},${String(frac).padStart(2, '0')}`
}

export type PadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | '00' | 'back' | 'clear'

// Ziffernfeld-Logik: was ein Tastendruck aus dem aktuellen Text macht.
export function applyKey(text: string, key: PadKey) {
  if (key === 'back') return text.slice(0, -1)
  if (key === 'clear') return ''
  if (key === ',') {
    if (text.includes(',')) return text
    return text === '' ? '0,' : text + ','
  }
  if (key === '00') {
    if (!text.includes(',')) return text === '' ? '0,00' : text + ',00'
    return text
  }
  // Nach dem Komma sind nur zwei Stellen erlaubt.
  const [, cents] = text.split(',')
  if (cents !== undefined && cents.length >= 2) return text
  if (text === '0') return key
  return text + key
}

// ---------- Datum ----------

// Datumsschluessel sind lokal ('YYYY-MM-DD'), nie UTC: mit toISOString()
// rutschen abends erfasste Buchungen in den Vortag.
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(key: string, n: number) {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

export function todayKey() {
  return dateKey()
}

const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
const WEEKDAYS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

export { MONTHS, MONTHS_SHORT, WEEKDAYS }

// '12.09.2026'
export function formatDate(key: string) {
  const [y, m, d] = key.split('-')
  return `${d}.${m}.${y}`
}

// '12.09.' - fuer Listen, in denen das Jahr aus dem Zeitraum hervorgeht.
export function formatDayShort(key: string) {
  const [, m, d] = key.split('-')
  return `${d}.${m}.`
}

// 'Heute · 12. September' / 'Donnerstag · 10. September'
export function formatDayHeading(key: string) {
  const today = todayKey()
  const d = parseKey(key)
  const long = `${d.getDate()}. ${MONTHS[d.getMonth()]}`
  if (key === today) return `Heute · ${long}`
  if (key === addDays(today, -1)) return `Gestern · ${long}`
  return `${WEEKDAYS[d.getDay()]} · ${long}`
}

// ---------- Zeitraeume ----------

export const PERIODS: { id: PeriodKind; label: string }[] = [
  { id: 'day', label: 'Tag' },
  { id: 'week', label: 'Woche' },
  { id: 'month', label: 'Monat' },
  { id: 'year', label: 'Jahr' },
  { id: 'all', label: 'Gesamt' },
]

// Wochenanfang zu einem Datum. weekStart: 1 = Montag, 0 = Sonntag.
function startOfWeek(key: string, weekStart: number) {
  const d = parseKey(key)
  const diff = (d.getDay() - weekStart + 7) % 7
  return addDays(key, -diff)
}

// Ein Zeitraum ist ein geschlossenes Intervall aus Datumsschluesseln plus
// Beschriftung. 'all' hat kein from - das faengt jeder Filter als null ab.
export function periodRange(
  kind: PeriodKind,
  anchor: string,
  weekStart = 1,
  firstKey: string | null = null,
): Range {
  const d = parseKey(anchor)
  if (kind === 'day') {
    return { from: anchor, to: anchor, label: formatDate(anchor), sub: WEEKDAYS[d.getDay()] }
  }
  if (kind === 'week') {
    const from = startOfWeek(anchor, weekStart)
    const to = addDays(from, 6)
    return {
      from,
      to,
      label: `${formatDayShort(from)} – ${formatDayShort(to)}`,
      sub: `Kalenderwoche ${isoWeek(from)}`,
    }
  }
  if (kind === 'month') {
    const from = dateKey(new Date(d.getFullYear(), d.getMonth(), 1))
    const to = dateKey(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    return {
      from,
      to,
      label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`,
      sub: `${formatDayShort(from)} – ${formatDayShort(to)}`,
    }
  }
  if (kind === 'year') {
    return {
      from: `${d.getFullYear()}-01-01`,
      to: `${d.getFullYear()}-12-31`,
      label: String(d.getFullYear()),
      sub: 'Januar – Dezember',
    }
  }
  return {
    from: null,
    to: null,
    label: 'Gesamt',
    sub: firstKey ? `seit ${formatDate(firstKey)}` : 'alle Buchungen',
  }
}

function isoWeek(key: string) {
  const d = parseKey(key)
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = new Date(target.getFullYear(), 0, 4)
  const firstDayNr = (firstThursday.getDay() + 6) % 7
  firstThursday.setDate(firstThursday.getDate() - firstDayNr + 3)
  return 1 + Math.round((target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000))
}

// Einen Zeitraum vor oder zurueck. Gibt den neuen Anker zurueck.
export function shiftPeriod(kind: PeriodKind, anchor: string, dir: number, weekStart = 1) {
  const d = parseKey(anchor)
  if (kind === 'day') return addDays(anchor, dir)
  if (kind === 'week') return addDays(startOfWeek(anchor, weekStart), dir * 7)
  if (kind === 'month') return dateKey(new Date(d.getFullYear(), d.getMonth() + dir, 1))
  if (kind === 'year') return dateKey(new Date(d.getFullYear() + dir, d.getMonth(), 1))
  return anchor
}

// Der Zeitraum davor, gleich lang - fuer den Vergleich in der Statistik.
export function previousRange(kind: PeriodKind, anchor: string, weekStart = 1) {
  if (kind === 'all') return null
  return periodRange(kind, shiftPeriod(kind, anchor, -1, weekStart), weekStart)
}

export function inRange(key: string, range: Pick<Range, 'from' | 'to'> | null) {
  if (!range || range.from === null) return true
  return key >= range.from && key <= (range.to as string)
}

// Anzahl Tage im Zeitraum - Basis fuer Durchschnitt und Hochrechnung.
export function daysInRange(range: Pick<Range, 'from' | 'to'>, firstKey: string | null) {
  const from = range.from ?? firstKey
  const to = range.to ?? todayKey()
  if (!from) return 1
  return Math.max(1, Math.round((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000) + 1)
}
