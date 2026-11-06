// Zeitrechnung von Punch: Tage, Anteile, Summen, Zeitraeume, Pruefen.
// Reine Funktionen, getestet in zeit.test.ts. Regeln: konzept.md.
//
// Gespeichert sind nur Bloecke mit Start und Ende (ms). Alles hier wird daraus
// gerechnet: der Anteil eines Blocks an einem Tag (Mitternacht teilt), Summen
// je Bereich und Taetigkeit, Wochen, Monate, Jahre und der Vergleich.

import type { Art, Block, Laeuft, Periode } from './types'

export const MIN = 60_000
/** Kuerzer zaehlt ein Block nicht - das faengt Fehltipps ab. */
export const KURZ_MS = MIN
/** Steht fuer den laufenden Block, wo sonst die id eines Blocks steht. */
export const LAEUFT = 'laeuft'

export const pad = (n: number) => String(n).padStart(2, '0')

// ---------- Tage ('YYYY-MM-DD', Ortszeit) ----------

export function tagStart(tag: string): number {
  const [y, m, d] = tag.split('-').map(Number)
  return new Date(y, m - 1, d).getTime()
}

export function tagVon(ms: number): string {
  const d = new Date(ms)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function plusTage(tag: string, n: number): string {
  const [y, m, d] = tag.split('-').map(Number)
  return tagVon(new Date(y, m - 1, d + n).getTime())
}

export const istTag = (x: unknown): x is string =>
  typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && tagVon(tagStart(x)) === x

/** Ende eines Tages = Mitternacht des naechsten. Die Nacht der Zeitumstellung hat so 23 oder 25 h. */
export const tagEnde = (tag: string) => tagStart(plusTage(tag, 1))

/** Minuten seit Mitternacht zu einem Zeitpunkt. */
export const uhrMinuten = (ms: number) => {
  const d = new Date(ms)
  return d.getHours() * 60 + d.getMinutes()
}

/** Zeitpunkt aus Tag und Minuten seit Mitternacht. */
export function zeitpunkt(tag: string, minuten: number): number {
  const [y, m, d] = tag.split('-').map(Number)
  return new Date(y, m - 1, d, Math.floor(minuten / 60), minuten % 60).getTime()
}

/** 'HH:MM' → Minuten seit Mitternacht, sonst null. */
export function minuten(s: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(s)
  if (!m) return null
  const h = Number(m[1])
  const mi = Number(m[2])
  return h < 24 && mi < 60 ? h * 60 + mi : null
}

/** Das naechste Mal nach start, dass die Uhr diese Minuten zeigt - fuer Bis: frueher als Von heisst am naechsten Tag. */
export function endeNach(start: number, min: number): number {
  const t = tagVon(start)
  const am = zeitpunkt(t, min)
  return am > start ? am : zeitpunkt(plusTage(t, 1), min)
}

// ---------- Anzeige ----------

/** Dauer als h:mm, auf volle Minuten abgerundet. */
export function hm(ms: number): string {
  const m = Math.floor(Math.max(0, ms) / MIN)
  return `${Math.floor(m / 60)}:${pad(m % 60)}`
}

/** Dauer als h:mm:ss (der laufende Block). */
export function hms(ms: number): string {
  const s = Math.floor(Math.max(0, ms) / 1000)
  return `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`
}

/** Uhrzeit 'HH:MM'. */
export const uhr = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const WT = ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA']
export const MONATE = ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER']

export const wochentag = (tag: string) => WT[new Date(tagStart(tag)).getDay()]
/** '06.11.' */
export const datumKurz = (tag: string) => `${tag.slice(8)}.${tag.slice(5, 7)}.`
/** 'FR 06.11.2026' */
export const datumLang = (tag: string) => `${wochentag(tag)} ${datumKurz(tag)}${tag.slice(0, 4)}`

// ---------- Ein Tag ----------

/** Ein Block, wie er an einem Tag steht: von/bis auf den Tag beschnitten. id null = der laufende. */
export interface Posten {
  id: string | null
  bereich: string
  taetigkeit: string | null
  notiz: string
  von: number
  bis: number
  dauer: number
  /** geht ueber Mitternacht hinaus weiter (oder laeuft noch) */
  weiter: boolean
}

export function postenAm(bloecke: Block[], laeuft: Laeuft | null, tag: string, jetzt: number): Posten[] {
  const a = tagStart(tag)
  const b = tagEnde(tag)
  const out: Posten[] = []
  for (const x of bloecke) {
    const von = Math.max(x.start, a)
    const bis = Math.min(x.ende, b)
    if (bis > von) out.push({ id: x.id, bereich: x.bereich, taetigkeit: x.taetigkeit, notiz: x.notiz, von, bis, dauer: bis - von, weiter: x.ende > b })
  }
  if (laeuft && laeuft.start < b && jetzt >= a) {
    const von = Math.max(laeuft.start, a)
    const bis = Math.max(von, Math.min(jetzt, b))
    out.push({ id: null, bereich: laeuft.bereich, taetigkeit: laeuft.taetigkeit, notiz: laeuft.notiz, von, bis, dauer: bis - von, weiter: true })
  }
  return out.sort((p, q) => p.von - q.von)
}

// ---------- Summen ----------

export interface Summe {
  tot: number
  /** je Bereich */
  je: Map<string, number>
  /** je Bereich und Taetigkeit (null = ohne) */
  taet: Map<string, Map<string | null, number>>
}

/** Was in [von, bis) zusammenkommt. Der laufende Block zaehlt bis jetzt. */
export function summe(bloecke: Block[], laeuft: Laeuft | null, von: number, bis: number, jetzt: number): Summe {
  const s: Summe = { tot: 0, je: new Map(), taet: new Map() }
  const dazu = (bereich: string, taetigkeit: string | null, ms: number) => {
    if (ms <= 0) return
    s.tot += ms
    s.je.set(bereich, (s.je.get(bereich) ?? 0) + ms)
    let m = s.taet.get(bereich)
    if (!m) s.taet.set(bereich, (m = new Map()))
    m.set(taetigkeit, (m.get(taetigkeit) ?? 0) + ms)
  }
  for (const x of bloecke) dazu(x.bereich, x.taetigkeit, Math.min(x.ende, bis) - Math.max(x.start, von))
  if (laeuft) dazu(laeuft.bereich, laeuft.taetigkeit, Math.min(jetzt, bis) - Math.max(laeuft.start, von))
  return s
}

// ---------- Zeitraeume ----------

/** Montag der Woche (die Woche beginnt am Montag). */
export function montag(tag: string): string {
  return plusTage(tag, -((new Date(tagStart(tag)).getDay() + 6) % 7))
}

/** Kalenderwoche nach ISO 8601: die Woche mit dem Donnerstag zaehlt zu dessen Jahr. */
export function kw(tag: string): number {
  const mo = montag(tag)
  const jahr = plusTage(mo, 3).slice(0, 4)
  const erste = montag(`${jahr}-01-04`)
  return Math.round((tagStart(mo) - tagStart(erste)) / (7 * 86_400_000)) + 1
}

export function periodeVon(art: Art, tag: string): Periode {
  if (art === 'woche') return { art, tag: montag(tag) }
  if (art === 'monat') return { art, tag: `${tag.slice(0, 7)}-01` }
  return { art, tag: `${tag.slice(0, 4)}-01-01` }
}

export function verschiebe(p: Periode, n: number): Periode {
  const [y, m] = p.tag.split('-').map(Number)
  if (p.art === 'woche') return { art: p.art, tag: plusTage(p.tag, 7 * n) }
  if (p.art === 'monat') return { art: p.art, tag: tagVon(new Date(y, m - 1 + n, 1).getTime()) }
  return { art: p.art, tag: `${y + n}-01-01` }
}

/** Erster Tag danach (gehoert nicht mehr dazu). */
export const periodeEnde = (p: Periode) => verschiebe(p, 1).tag

export const enthaelt = (p: Periode, tag: string) => tag >= p.tag && tag < periodeEnde(p)

export function periodeTitel(p: Periode): string {
  if (p.art === 'woche') {
    const ende = plusTage(p.tag, 6)
    const von = p.tag.slice(5, 7) === ende.slice(5, 7) ? `${p.tag.slice(8)}.` : datumKurz(p.tag)
    return `KW ${kw(p.tag)} · ${von}–${datumKurz(ende)}`
  }
  if (p.art === 'monat') return `${MONATE[Number(p.tag.slice(5, 7)) - 1]} ${p.tag.slice(0, 4)}`
  return p.tag.slice(0, 4)
}

/** Eine Zeile der Statistik: Woche = Tage, Monat = Wochen, Jahr = Monate. */
export interface Zeile {
  label: string
  von: string
  /** erster Tag danach */
  bis: string
  ziel: { art: 'tag'; tag: string } | { art: 'periode'; periode: Periode }
  zukunft: boolean
}

export function zeilen(p: Periode, heute: string): Zeile[] {
  const ende = periodeEnde(p)
  const out: Zeile[] = []
  if (p.art === 'woche') {
    for (let i = 0; i < 7; i += 1) {
      const t = plusTage(p.tag, i)
      out.push({ label: `${wochentag(t)} ${datumKurz(t)}`, von: t, bis: plusTage(t, 1), ziel: { art: 'tag', tag: t }, zukunft: t > heute })
    }
  } else if (p.art === 'monat') {
    // Wochen, die in den Monat reichen - beschnitten auf den Monat.
    for (let mo = montag(p.tag); mo < ende; mo = plusTage(mo, 7)) {
      const von = mo < p.tag ? p.tag : mo
      const naechste = plusTage(mo, 7)
      out.push({
        label: `KW ${kw(mo)}`,
        von,
        bis: naechste > ende ? ende : naechste,
        ziel: { art: 'periode', periode: { art: 'woche', tag: mo } },
        zukunft: von > heute,
      })
    }
  } else {
    for (let i = 0; i < 12; i += 1) {
      const m = verschiebe({ art: 'monat', tag: p.tag }, i)
      out.push({ label: MONATE[i].slice(0, 3), von: m.tag, bis: periodeEnde(m), ziel: { art: 'periode', periode: m }, zukunft: m.tag > heute })
    }
  }
  return out
}

/**
 * Unterschied zum Zeitraum davor. Laeuft der Zeitraum noch, zaehlt vom
 * vorigen nur das gleiche Stueck (Montag bis jetzt gegen Montag bis zur
 * selben Stunde der Vorwoche). null, wenn der vorige Zeitraum leer ist.
 */
export function vergleich(bloecke: Block[], laeuft: Laeuft | null, p: Periode, jetzt: number): number | null {
  const von = tagStart(p.tag)
  const bis = tagStart(periodeEnde(p))
  const vp = verschiebe(p, -1)
  const vvon = tagStart(vp.tag)
  const vbis = von
  if (summe(bloecke, laeuft, vvon, vbis, jetzt).tot === 0) return null
  const laufend = jetzt >= von && jetzt < bis
  const jetztSumme = summe(bloecke, laeuft, von, laufend ? jetzt : bis, jetzt).tot
  const vorher = summe(bloecke, laeuft, vvon, laufend ? Math.min(vbis, vvon + (jetzt - von)) : vbis, jetzt).tot
  return jetztSumme - vorher
}

// ---------- Pruefen ----------

/** Der erste Block (oder der laufende), der [start, ende) schneidet. Der laufende reicht bis in alle Zukunft. */
export function konflikt(bloecke: Block[], laeuft: Laeuft | null, start: number, ende: number, ohne: string | null): Block | Laeuft | null {
  for (const x of bloecke) if (x.id !== ohne && x.start < ende && start < x.ende) return x
  if (laeuft && ohne !== LAEUFT && laeuft.start < ende) return laeuft
  return null
}

/** Ende des spaetesten Blocks, der vor start beginnt - fuer „Anschließen“. */
export function endeDavor(bloecke: Block[], start: number, ohne: string | null): number | null {
  let best: number | null = null
  for (const x of bloecke) if (x.id !== ohne && x.start < start && (best === null || x.ende > best)) best = x.ende
  return best
}

/** Beginn des naechsten Blocks nach start, auch der laufende - fuer „Bis zum nächsten“. */
export function startDanach(bloecke: Block[], laeuft: Laeuft | null, start: number, ohne: string | null): number | null {
  let best: number | null = null
  for (const x of bloecke) if (x.id !== ohne && x.start > start && (best === null || x.start < best)) best = x.start
  if (laeuft && ohne !== LAEUFT && laeuft.start > start && (best === null || laeuft.start < best)) best = laeuft.start
  return best
}

export type Fehler = { art: 'konflikt'; mit: Block | Laeuft } | { art: 'text'; text: string }

/** Darf ein Block [start, ende) so gesichert werden? null = ja. */
export function pruefeBlock(bloecke: Block[], laeuft: Laeuft | null, start: number, ende: number, ohne: string | null, jetzt: number): Fehler | null {
  if (ende - start < KURZ_MS) return { art: 'text', text: 'Kürzer als eine Minute' }
  if (ende > jetzt) return { art: 'text', text: 'Liegt in der Zukunft' }
  const k = konflikt(bloecke, laeuft, start, ende, ohne)
  return k ? { art: 'konflikt', mit: k } : null
}

/** Darf der laufende Block ab start laufen? Er reicht bis jetzt und weiter, also darf danach nichts mehr enden. */
export function pruefeStart(bloecke: Block[], start: number, jetzt: number): Fehler | null {
  if (start > jetzt) return { art: 'text', text: 'Liegt in der Zukunft' }
  const k = konflikt(bloecke, null, start, Infinity, null)
  return k ? { art: 'konflikt', mit: k } : null
}
