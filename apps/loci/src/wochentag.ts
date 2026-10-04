// Wochentag im Kopf, Schluesselzahlen-Methode:
//   (Tag + Monatszahl + Jahreszahl + Jahrhundertzahl - Schaltjahr-Korrektur) mod 7
// Reine Rechnung ohne Oberflaeche. wochentag.test.ts prueft sie gegen den Kalender.

import type { Datum, Zeitraum, ZeitraumId } from './types'

export const WOCHENTAGE = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']
export const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
export const MONATSZAHL = [0, 3, 3, 6, 1, 4, 6, 2, 5, 0, 3, 5]

// 1583 ist das erste volle Jahr im gregorianischen Kalender.
export const FRUEHESTES_JAHR = 1583
export const SPAETESTES_JAHR = 9999

export const mod7 = (n: number) => ((n % 7) + 7) % 7
export const istSchaltjahr = (j: number) => (j % 4 === 0 && j % 100 !== 0) || j % 400 === 0
export const jahrhundertzahl = (j: number) => 2 * (3 - (Math.floor(j / 100) % 4))
export const jahreszahl = (j: number) => {
  const yy = j % 100
  return mod7(yy + Math.floor(yy / 4))
}

export const zwei = (n: number) => String(n).padStart(2, '0')
export const datumLang = (d: Datum) => `${d.t}. ${MONATE[d.m - 1]} ${d.j}`
export const datumKurz = (d: Datum) => `${zwei(d.t)}.${zwei(d.m)}.${d.j}`
export const datumIso = (d: Datum) => `${d.j}-${zwei(d.m)}-${zwei(d.t)}`

/** "1987-03-14" → Datum, nur echte Tage von 1583 bis 9999. */
export function ausIso(s: string): Datum | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return null
  const d = { j: Number(m[1]), m: Number(m[2]), t: Number(m[3]) }
  if (d.j < FRUEHESTES_JAHR || d.m < 1 || d.m > 12 || d.t < 1) return null
  const k = new Date(Date.UTC(d.j, d.m - 1, d.t))
  return k.getUTCMonth() === d.m - 1 && k.getUTCDate() === d.t ? d : null
}

/** Der Wochentag laut Kalender (0 = Sonntag) - nur zum Pruefen der Methode. */
export const kalenderWochentag = (d: Datum) => new Date(Date.UTC(d.j, d.m - 1, d.t)).getUTCDay()

// ---------- Rechenweg ----------

export interface Zeile {
  text: string
  klein?: string
  wert: string
}

export interface Loesung {
  ergebnis: number
  schritte: Zeile[]
  summe: Zeile
}

const mod7Pfeil = (n: number) => (n >= 7 ? ` → ${mod7(n)}` : '')

// Ab 28 darf man vom zweistelligen Jahr 28, 56 oder 84 abziehen: 28 Jahre
// verschieben den Wochentag um 28 + 7 = 35 Tage, also um nichts.
function jahrRechnung(yy: number): { lang: string; abkuerzung: string | null } {
  const viertel = Math.floor(yy / 4)
  const lang = `${yy} + ${viertel} = ${yy + viertel}`
  if (yy < 28) return { lang, abkuerzung: null }
  const rest = yy % 28
  const restRoh = rest + Math.floor(rest / 4)
  return {
    lang,
    abkuerzung: `${yy} − ${yy - rest} = ${rest} → ${rest} + ${Math.floor(rest / 4)} = ${restRoh}${mod7Pfeil(restRoh)}`,
  }
}

function schaltText(d: Datum) {
  if (!istSchaltjahr(d.j)) return `${d.j} ist kein Schaltjahr`
  return d.m <= 2 ? `${d.j} ist Schaltjahr, ${MONATE[d.m - 1]}` : `${d.j} ist Schaltjahr, gilt aber nur für Jan/Feb`
}

export function loese(d: Datum): Loesung {
  const yy = d.j % 100
  const monat = MONATSZAHL[d.m - 1]
  const jahr = jahreszahl(d.j)
  const jhd = jahrhundertzahl(d.j)
  const korrektur = istSchaltjahr(d.j) && d.m <= 2 ? -1 : 0
  const summe = d.t + monat + jahr + jhd + korrektur
  const ergebnis = mod7(summe)
  const { lang, abkuerzung } = jahrRechnung(yy)

  return {
    ergebnis,
    schritte: [
      { text: 'Tag', wert: String(d.t) },
      { text: `Monat ${MONATE[d.m - 1]}`, wert: String(monat) },
      { text: `Jahr ${zwei(yy)}: ${lang}`, klein: abkuerzung ? `Abkürzung: ${abkuerzung}` : undefined, wert: String(jahr) },
      { text: `Jahrhundert ${Math.floor(d.j / 100)}xx`, wert: String(jhd) },
      { text: 'Schaltjahr-Korrektur', klein: schaltText(d), wert: korrektur ? '−1' : '–' },
    ],
    summe: {
      text: `${d.t} + ${monat} + ${jahr} + ${jhd}${korrektur ? ' − 1' : ''} = ${summe}`,
      klein: `${summe} mod 7 = ${ergebnis}`,
      wert: WOCHENTAGE[ergebnis],
    },
  }
}

// ---------- Hinweise bei typischen Fehlern ----------

export interface Hinweis {
  kurz: string
  text: string
}

/** Nur fuer falsche Antworten: steckt wahrscheinlich ein Schaltjahr-Fehler dahinter? */
export function hinweis(d: Datum, gewaehlt: number, richtig: number): Hinweis | null {
  if (!istSchaltjahr(d.j)) return null
  if (d.m <= 2 && gewaehlt === mod7(richtig + 1)) {
    return { kurz: 'Schaltjahr-Korrektur vergessen?', text: 'Im Januar und Februar eines Schaltjahres 1 abziehen.' }
  }
  if (d.m > 2 && gewaehlt === mod7(richtig - 1)) {
    return { kurz: 'Zu viel abgezogen?', text: 'Die Schaltjahr-Korrektur gilt nur für Januar und Februar.' }
  }
  return null
}

// ---------- Tipp: Baustein fuer Baustein ----------

export interface Baustein {
  name: string
  rechnung: string
  wert: string
}

export function bausteine(d: Datum): Baustein[] {
  const yy = d.j % 100
  const rest = d.t % 7
  const { lang, abkuerzung } = jahrRechnung(yy)
  const schalt = istSchaltjahr(d.j)
  return [
    { name: 'Tag', rechnung: d.t >= 7 ? `${d.t} − ${d.t - rest}` : String(d.t), wert: String(rest) },
    { name: 'Monat', rechnung: MONATE[d.m - 1], wert: String(MONATSZAHL[d.m - 1]) },
    { name: 'Jahr', rechnung: abkuerzung ?? `${lang}${mod7Pfeil(yy + Math.floor(yy / 4))}`, wert: String(jahreszahl(d.j)) },
    { name: 'Jahrhundert', rechnung: `${Math.floor(d.j / 100)}xx`, wert: String(jahrhundertzahl(d.j)) },
    {
      name: 'Schaltjahr',
      rechnung: !schalt ? 'kein Schaltjahr' : d.m <= 2 ? `Schaltjahr, ${MONATE[d.m - 1]}` : 'Schaltjahr, erst ab März',
      wert: schalt && d.m <= 2 ? '−1' : '0',
    },
  ]
}

// ---------- Zeitraum ----------

export const ZEITRAEUME: { id: ZeitraumId; name: string; von?: number; bis?: number }[] = [
  { id: 'jahr', name: 'Dieses Jahr' },
  { id: '1900', name: '1900–2099', von: 1900, bis: 2099 },
  { id: '1600', name: '1600–2399', von: 1600, bis: 2399 },
  { id: 'eigen', name: 'Eigener' },
]

/** Die Jahre, aus denen die Daten kommen. "Dieses Jahr" ist immer das aktuelle. */
export function jahre(z: Zeitraum, jetzt = new Date().getFullYear()): { von: number; bis: number } {
  if (z.id === 'jahr') return { von: jetzt, bis: jetzt }
  if (z.id === 'eigen') return { von: z.von, bis: z.bis }
  const v = ZEITRAEUME.find((x) => x.id === z.id)!
  return { von: v.von!, bis: v.bis! }
}

export function zeitraumName(z: Zeitraum, jetzt = new Date().getFullYear()) {
  const { von, bis } = jahre(z, jetzt)
  return von === bis ? String(von) : `${von}–${bis}`
}

/** Fehlertext fuer einen eigenen Zeitraum, null wenn er passt. */
export function pruefeEigenen(von: number, bis: number): string | null {
  const ok = (n: number) => Number.isInteger(n) && n >= FRUEHESTES_JAHR && n <= SPAETESTES_JAHR
  if (!ok(von) || !ok(bis)) return `Bitte Jahre von ${FRUEHESTES_JAHR} bis ${SPAETESTES_JAHR}.`
  if (von > bis) return '„Von“ darf nicht nach „bis“ liegen.'
  return null
}

/** Zufaelliger Tag im Zeitraum, gleich verteilt ueber alle Tage, nie zweimal derselbe hintereinander. */
export function zufallsdatum(z: { von: number; bis: number }, vorher: Datum | null = null, zufall = Math.random): Datum {
  const start = Date.UTC(z.von, 0, 1)
  const tage = Math.round((Date.UTC(z.bis, 11, 31) - start) / 864e5) + 1
  let d: Datum
  do {
    const k = new Date(start + Math.floor(zufall() * tage) * 864e5)
    d = { t: k.getUTCDate(), m: k.getUTCMonth() + 1, j: k.getUTCFullYear() }
  } while (vorher && d.t === vorher.t && d.m === vorher.m && d.j === vorher.j)
  return d
}

/** Fuer "Dieses Jahr": Jahres- und Jahrhundertzahl stehen fest, man rechnet nur Tag + Monat + rest. */
export function diesesJahr(j: number) {
  const jahr = jahreszahl(j)
  const jhd = jahrhundertzahl(j)
  return { jahr, jhd, summe: jahr + jhd, rest: mod7(jahr + jhd), schalt: istSchaltjahr(j) }
}
