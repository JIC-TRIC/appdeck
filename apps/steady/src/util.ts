// Datum und Zahlen - beides wird ueberall gebraucht und muss genau eine
// Wahrheit haben.

// ---------- Datum ----------

// Datumsschluessel sind lokal ('YYYY-MM-DD'), nie UTC: mit toISOString()
// rutschen abends erfasste Tage in den Vortag.
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

// Ueber das Datum gerechnet, nicht ueber Millisekunden: an der
// Sommerzeitumstellung hat ein Tag 23 oder 25 Stunden.
export function addDays(key: string, n: number) {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

// Tage von a nach b (b - a). Mittags gerechnet, damit die Zeitumstellung
// nicht um eine Stunde danebenliegt und abgerundet wird.
export function diffDays(a: string, b: string) {
  const da = parseKey(a)
  const db = parseKey(b)
  da.setHours(12)
  db.setHours(12)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

// 0 = Montag … 6 = Sonntag. Die Woche beginnt in Steady immer montags.
export function weekdayIndex(key: string) {
  return (parseKey(key).getDay() + 6) % 7
}

export function mondayOf(key: string) {
  return addDays(key, -weekdayIndex(key))
}

// Der "logische" Tag: bis zum Tageswechsel (Standard 3 Uhr) gilt noch der
// Vortag. Wer um 1:30 Uhr "Lesen" abhakt, meint den Abend davor.
export function logicalToday(now = new Date(), dayStart = 3) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - dayStart, now.getMinutes())
  return dateKey(d)
}

// ISO-Kalenderwoche (die Woche mit dem ersten Donnerstag ist KW 1).
export function isoWeek(key: string) {
  const thursday = parseKey(addDays(mondayOf(key), 3))
  const jan1 = new Date(thursday.getFullYear(), 0, 1)
  return Math.floor(diffDays(dateKey(jan1), dateKey(thursday)) / 7) + 1
}

export function minKey(a: string, b: string) {
  return a < b ? a : b
}

export function maxKey(a: string, b: string) {
  return a > b ? a : b
}

// Alle Tage von from bis to (beide eingeschlossen).
export function daysBetween(from: string, to: string) {
  const out: string[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d)
  return out
}

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function monthShort(m: number) {
  return MONTHS_SHORT[m]
}

// 'Mittwoch, 30. September'
export function formatDayLong(key: string) {
  const d = parseKey(key)
  return `${WEEKDAYS_LONG[weekdayIndex(key)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

// 'So, 27. September' - fuer schmale Handys, wo der lange Name nicht passt.
export function formatDayMedium(key: string) {
  const d = parseKey(key)
  return `${WEEKDAYS_SHORT[weekdayIndex(key)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

// 'Di 22.9.'
export function formatDayShort(key: string) {
  const d = parseKey(key)
  return `${WEEKDAYS_SHORT[weekdayIndex(key)]} ${d.getDate()}.${d.getMonth() + 1}.`
}

// '4. Mai 2026'
export function formatDate(key: string) {
  const d = parseKey(key)
  return `${d.getDate()}. ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

// '12. Mai 2026' mit kurzem Monat: '12. Mai', im anderen Jahr mit Jahreszahl.
export function formatDateShort(key: string, withYear = true) {
  const d = parseKey(key)
  return `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}${withYear ? ` ${d.getFullYear()}` : ''}`
}

// 'Heute', 'Gestern' oder 'Dienstag, 22. September'
export function relativeDay(key: string, today: string) {
  if (key === today) return 'Heute'
  if (key === addDays(today, -1)) return 'Gestern'
  return formatDayLong(key)
}

// Bereich im Raster: '17.–23. September', '28. Sep – 4. Okt', ueber den
// Jahreswechsel mit Jahreszahl.
export function rangeLabel(from: string, to: string) {
  const a = parseKey(from)
  const b = parseKey(to)
  if (a.getFullYear() !== b.getFullYear()) {
    return `${a.getDate()}. ${MONTHS_SHORT[a.getMonth()]} ${a.getFullYear()} – ${b.getDate()}. ${MONTHS_SHORT[b.getMonth()]} ${b.getFullYear()}`
  }
  if (a.getMonth() !== b.getMonth()) {
    return `${a.getDate()}. ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()}. ${MONTHS_SHORT[b.getMonth()]}`
  }
  return `${a.getDate()}.–${b.getDate()}. ${MONTHS[b.getMonth()]}`
}

// ---------- Zahlen ----------

// Tageswerte mit hoechstens einer Nachkommastelle, deutsches Komma, ohne
// Tausenderpunkt in kleinen Zahlen ("2750", nicht "2.750" - im schmalen
// Heute-Kasten zaehlt jede Stelle).
export function formatValue(v: number) {
  const r = Math.round(v * 10) / 10
  return Number.isInteger(r) ? String(r) : r.toFixed(1).replace('.', ',')
}

// Fuer die schmalen Spalten im Raster (28 px): hoechstens vier Zeichen. Ab
// 100 ohne Nachkommastelle, ab 10 000 in Tausend ('12k').
export function formatValueShort(v: number) {
  const r = Math.round(v)
  if (r >= 10000) return `${Math.round(v / 1000)}k`
  if (v >= 100) return String(r)
  return formatValue(v)
}

export function formatPercent(share: number) {
  return `${Math.round(share * 100)} %`
}

export type PadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | 'back'

const MAX_INT_DIGITS = 6

// Ziffernfeld: was ein Tastendruck aus dem Text macht. Eine Nachkommastelle,
// hoechstens sechs Stellen davor. Eine Taste, die nichts bewirkt, gibt den
// Text unveraendert zurueck - die Anzeige wackelt dann.
export function applyKey(text: string, key: PadKey) {
  if (key === 'back') return text.slice(0, -1)
  if (key === ',') {
    if (text.includes(',')) return text
    return text === '' ? '0,' : `${text},`
  }
  const [int, frac] = text.split(',')
  if (frac !== undefined) return frac.length >= 1 ? text : text + key
  if (int.length >= MAX_INT_DIGITS) return text
  if (text === '0') return key
  return text + key
}

// '5,' (Komma getippt, Stelle fehlt noch) ist 5.
export function textToValue(text: string): number | null {
  if (!text) return null
  const n = Number(text.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 10) / 10 : null
}

export function valueToText(v: number | undefined) {
  return v === undefined ? '' : formatValue(v)
}

// Zahl aus einem Formularfeld ('150', '5,5', '2.800'). Punkt als Tausender
// nur, wenn danach drei Ziffern kommen - sonst ist er ein Komma.
export function parseNumber(text: string): number | null {
  const t = text.trim().replace(/\s/g, '')
  if (!t) return null
  const normal = /^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.')
  const n = Number(normal)
  return Number.isFinite(n) ? n : null
}
