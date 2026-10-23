// Tage ohne Uhrzeit ('YYYY-MM-DD', lokale Zeit) und wie Tick sie anzeigt.
// Regeln: konzept.md unter „Fällig“. Getestet in tage.test.ts.

const MONATE = ['Jan', 'Feb', 'März', 'Apr', 'Mai', 'Juni', 'Juli', 'Aug', 'Sept', 'Okt', 'Nov', 'Dez']
const MONATE_LANG = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
const TAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']
const TAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

const zwei = (n: number) => String(n).padStart(2, '0')

export const tagVon = (d: Date) => `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`

export function zuDatum(tag: string): Date {
  const [y, m, d] = tag.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const istTag = (x: unknown): x is string =>
  typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && tagVon(zuDatum(x)) === x

export const heuteTag = (jetzt = new Date()) => tagVon(jetzt)

export function plusTage(tag: string, n: number): string {
  const d = zuDatum(tag)
  d.setDate(d.getDate() + n)
  return tagVon(d)
}

/** Ganze Tage von `von` bis `bis` (negativ = davor). Ueber UTC, damit die Zeitumstellung nicht stoert. */
export function abstand(von: string, bis: string): number {
  const utc = (t: string) => {
    const [y, m, d] = t.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((utc(bis) - utc(von)) / 86_400_000)
}

const kurz = (d: Date, mitJahr: boolean) => `${d.getDate()}. ${MONATE[d.getMonth()]}${mitJahr ? ` ${d.getFullYear()}` : ''}`
const anderesJahr = (tag: string, heute: string) => tag.slice(0, 4) !== heute.slice(0, 4)

export type Faellig = 'ueber' | 'heute' | 'spaeter'

export function faelligArt(tag: string, heute: string): Faellig {
  const n = abstand(heute, tag)
  return n < 0 ? 'ueber' : n === 0 ? 'heute' : 'spaeter'
}

/** heute, morgen, Mi, 10. Nov – überfällig: gestern, seit Mo, seit 2. Okt. */
export function faelligText(tag: string, heute: string): string {
  const n = abstand(heute, tag)
  const d = zuDatum(tag)
  if (n === 0) return 'heute'
  if (n === 1) return 'morgen'
  if (n === -1) return 'gestern'
  if (n > 1 && n <= 6) return TAGE[d.getDay()]
  if (n < -1 && n >= -6) return `seit ${TAGE[d.getDay()]}`
  const k = kurz(d, anderesJahr(tag, heute))
  return n < 0 ? `seit ${k}` : k
}

/** Samstag, 24. Oktober (mit Jahr, wenn es nicht dieses ist) */
export function tagLang(tag: string, heute: string): string {
  const d = zuDatum(tag)
  const jahr = anderesJahr(tag, heute) ? ` ${d.getFullYear()}` : ''
  return `${TAGE_LANG[d.getDay()]}, ${d.getDate()}. ${MONATE_LANG[d.getMonth()]}${jahr}`
}

/** Ueberschrift fuer Erledigtes: Heute, Gestern, Mittwoch, 21. Okt */
export function erledigtTitel(ms: number, heute: string): string {
  const tag = tagVon(new Date(ms))
  const n = abstand(tag, heute)
  if (n === 0) return 'Heute'
  if (n === 1) return 'Gestern'
  const d = zuDatum(tag)
  return `${TAGE_LANG[d.getDay()]}, ${kurz(d, anderesJahr(tag, heute))}`
}

/** Kurz in einer Zeile: heute, gestern, 2. Okt */
export function wannKurz(ms: number, heute: string): string {
  const tag = tagVon(new Date(ms))
  const n = abstand(tag, heute)
  if (n === 0) return 'heute'
  if (n === 1) return 'gestern'
  return kurz(zuDatum(tag), anderesJahr(tag, heute))
}

/** Angelegt heute um 14:20 · Angelegt am Montag, 19. Oktober */
export function angelegtText(ms: number, heute: string): string {
  const d = new Date(ms)
  const tag = tagVon(d)
  const n = abstand(tag, heute)
  const uhr = `${d.getHours()}:${zwei(d.getMinutes())}`
  if (n === 0) return `Angelegt heute um ${uhr}`
  if (n === 1) return `Angelegt gestern um ${uhr}`
  return `Angelegt am ${tagLang(tag, heute)}`
}
