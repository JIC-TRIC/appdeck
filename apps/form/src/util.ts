// Datum und Zahlen - beides wird ueberall gebraucht und muss genau eine
// Wahrheit haben (wie in Steady).

// ---------- Datum ----------

// Tage sind lokal ('YYYY-MM-DD'), nie UTC: mit toISOString() rutschen abends
// erfasste Tage in den Vortag.
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const istTag = (x: unknown): x is string =>
  typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && dateKey(parseKey(x)) === x

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

// Gleicher Tag im Monat n Monate vorher/nachher - am Monatsende der letzte
// Tag des Zielmonats (31. Mai minus 3 Monate = 28./29. Februar).
export function addMonths(key: string, n: number) {
  const d = parseKey(key)
  const ziel = new Date(d.getFullYear(), d.getMonth() + n, 1)
  const letzter = new Date(ziel.getFullYear(), ziel.getMonth() + 1, 0).getDate()
  ziel.setDate(Math.min(d.getDate(), letzter))
  return dateKey(ziel)
}

// Tage von a nach b (b - a). Mittags gerechnet, damit die Zeitumstellung
// nicht um eine Stunde danebenliegt.
export function diffDays(a: string, b: string) {
  const da = parseKey(a)
  const db = parseKey(b)
  da.setHours(12)
  db.setHours(12)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

const WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const WOCHENTAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const MONATE_KURZ = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

// '1. Okt', in einem anderen Jahr als heute '1. Okt 2025'
export function formatKurz(key: string, heute: string) {
  const d = parseKey(key)
  const jahr = key.slice(0, 4) === heute.slice(0, 4) ? '' : ` ${d.getFullYear()}`
  return `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}${jahr}`
}

// 'Mi 1. Okt' (in einem anderen Jahr mit Jahreszahl)
export function formatTag(key: string, heute: string) {
  return `${WOCHENTAGE[parseKey(key).getDay()]} ${formatKurz(key, heute)}`
}

// 'Mittwoch, 8. Oktober'
export function formatTagLang(key: string) {
  const d = parseKey(key)
  return `${WOCHENTAGE_LANG[d.getDay()]}, ${d.getDate()}. ${MONATE[d.getMonth()]}`
}

// Wie lange eine Messung her ist: 'heute', 'gestern', 'vor 3 Tagen' - ab
// zwei Wochen das Datum, das ist dann aussagekraeftiger.
export function wieLange(key: string, heute: string) {
  const n = diffDays(key, heute)
  if (n <= 0) return 'heute'
  if (n === 1) return 'gestern'
  if (n < 14) return `vor ${n} Tagen`
  return formatKurz(key, heute)
}

// 'Heute', 'Gestern' oder 'Mi 1. Okt'
export function relativTag(key: string, heute: string) {
  if (key === heute) return 'Heute'
  if (key === addDays(heute, -1)) return 'Gestern'
  return formatTag(key, heute)
}

// ---------- Zahlen ----------

/** Zwei Nachkommastellen genuegen fuer alles, was man am Koerper misst. */
export const rund = (v: number) => Math.round(v * 100) / 100

// '82,4', '82,45', '82' - deutsches Komma, ohne Tausenderpunkt und ohne
// Nullen am Ende.
export function formatZahl(v: number) {
  const r = rund(v)
  return (Object.is(r, -0) ? 0 : r).toFixed(2).replace(/\.?0+$/, '').replace('.', ',').replace('-', '−')
}

// '+1,2', '−0,6', '±0' - fuer Veraenderungen.
export function formatDiff(v: number) {
  const r = rund(v)
  if (r === 0) return '±0'
  return r > 0 ? `+${formatZahl(r)}` : formatZahl(r)
}

// Zahl mit Einheit, ohne Leerzeichen-Waise bei leerer Einheit.
export const mitEinheit = (text: string, einheit: string) => (einheit ? `${text} ${einheit}` : text)

// Zahl aus einem Eingabefeld ('82,4', '82.4', '1.234,5'). Punkt als
// Tausender nur, wenn danach drei Ziffern kommen - sonst ist er ein Komma.
// null bei leerem Feld oder keiner Zahl.
export function parseZahl(text: string): number | null {
  const t = text.trim().replace(/\s/g, '').replace('−', '-')
  if (!t) return null
  const normal = /^[-+]?\d{1,3}(\.\d{3})+(,\d+)?$/.test(t) ? t.replace(/\./g, '').replace(',', '.') : t.replace(',', '.')
  if (!/^[-+]?(\d+\.?\d*|\.\d+)$/.test(normal)) return null
  const n = Number(normal)
  return Number.isFinite(n) ? rund(n) : null
}
