/*
 * Speicher von Loci: ein localStorage-Schluessel pro Bereich mit dem Praefix
 * der App-ID, so erfasst das Launcher-Backup alles. Gelesenes wird geprueft
 * und notfalls auf Standardwerte gesetzt (normalisiere* - getestet in
 * store.test.ts).
 *
 *   loci:einstellungen   Einstellungen
 *   loci:wochentag       { gesamt, letzte }  Statistik Wochentag
 *   loci:rechnen         { gesamt, letzte }  Statistik Rechnen
 *   loci:karten          Versuch[]           die letzten 100 Kartendeck-Versuche
 *   loci:konstanten      KVersuch[]          die letzten 200 Durchgaenge Aufsagen
 */
import { ANZAHLEN, TAKT_MAX, TAKT_MIN } from './karten'
import { KONSTANTE } from './konstanten'
import { STUFEN } from './rechnen'
import { LEER, LETZTE_MAX, addiere } from './statistik'
import { FRUEHESTES_JAHR, SPAETESTES_JAHR } from './wochentag'
import type {
  Aufgabe,
  Deckgroesse,
  Einstellungen,
  Ergebnis,
  Gesamt,
  KVersuch,
  Methode,
  RechenAufgabe,
  Reiter,
  Stufe,
  Uebungsdaten,
  Versuch,
  ZeitraumId,
} from './types'

export const APP_ID = 'loci'
const VERSUCHE_MAX = 100
const KVERSUCHE_MAX = 200

export const STANDARD: Einstellungen = {
  reiter: 'wochentag',
  uhr: true,
  zeitraum: { id: '1900', von: 1900, bis: 2099 },
  deck: { anzahl: 52, taktAn: false, takt: 3 },
  rechnen: { stufe: '2x2', methode: 'zerlegen' },
  anleitungGesehen: false,
  anleitungRechnen: false,
}

function lies(key: string): unknown {
  try {
    const raw = localStorage.getItem(`${APP_ID}:${key}`)
    return raw === null ? null : JSON.parse(raw)
  } catch {
    return null
  }
}

function schreibe(key: string, value: unknown) {
  try {
    localStorage.setItem(`${APP_ID}:${key}`, JSON.stringify(value))
  } catch {
    window.Shell?.toast('Speichern fehlgeschlagen – Speicher voll?')
  }
}

const obj = (x: unknown): Record<string, unknown> => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {})
const zahl = (x: unknown, min: number, max: number) => typeof x === 'number' && Number.isFinite(x) && x >= min && x <= max
const ganz = (x: unknown, min: number, max: number) => zahl(x, min, max) && Number.isInteger(x)
const jahr = (x: unknown) => ganz(x, FRUEHESTES_JAHR, SPAETESTES_JAHR)

// ---------- Einstellungen ----------

const REITER: Reiter[] = ['wochentag', 'rechnen', 'karten', 'konstanten']
const ZEITRAUM_IDS: ZeitraumId[] = ['jahr', '1900', '1600', 'eigen']
const METHODEN: Methode[] = ['zerlegen', 'ueberkreuz']

export function normalisiereEinstellungen(raw: unknown): Einstellungen {
  const r = obj(raw)
  const z = obj(r.zeitraum)
  const d = obj(r.deck)
  const re = obj(r.rechnen)
  const zeitraum =
    ZEITRAUM_IDS.includes(z.id as ZeitraumId) && jahr(z.von) && jahr(z.bis) && (z.von as number) <= (z.bis as number)
      ? { id: z.id as ZeitraumId, von: z.von as number, bis: z.bis as number }
      : STANDARD.zeitraum
  // Takt auf halbe Sekunden runden - so bleibt der Stepper im Raster.
  const takt = zahl(d.takt, TAKT_MIN, TAKT_MAX) ? Math.round((d.takt as number) * 2) / 2 : STANDARD.deck.takt
  return {
    reiter: REITER.includes(r.reiter as Reiter) ? (r.reiter as Reiter) : STANDARD.reiter,
    uhr: typeof r.uhr === 'boolean' ? r.uhr : STANDARD.uhr,
    zeitraum,
    deck: {
      anzahl: (ANZAHLEN as readonly number[]).includes(d.anzahl as number) ? (d.anzahl as Deckgroesse) : STANDARD.deck.anzahl,
      taktAn: d.taktAn === true,
      takt,
    },
    rechnen: {
      stufe: STUFEN.some((s) => s.id === re.stufe) ? (re.stufe as Stufe) : STANDARD.rechnen.stufe,
      methode: METHODEN.includes(re.methode as Methode) ? (re.methode as Methode) : STANDARD.rechnen.methode,
    },
    anleitungGesehen: r.anleitungGesehen === true,
    anleitungRechnen: r.anleitungRechnen === true,
  }
}

export const getEinstellungen = () => normalisiereEinstellungen(lies('einstellungen'))

export function setEinstellungen(patch: Partial<Einstellungen>): Einstellungen {
  const neu = normalisiereEinstellungen({ ...getEinstellungen(), ...patch })
  schreibe('einstellungen', neu)
  return neu
}

// ---------- Wochentag und Rechnen ----------

const istErgebnis = (a: Record<string, unknown>) => typeof a.r === 'boolean' && zahl(a.z, 0, Infinity) && ganz(a.t, 0, 9)

const istAufgabe = (x: unknown): x is Aufgabe => {
  const a = obj(x)
  return typeof a.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.d) && ganz(a.a, 0, 6) && istErgebnis(a)
}

const istRechenAufgabe = (x: unknown): x is RechenAufgabe => {
  const a = obj(x)
  return ganz(a.x, 2, 999) && ganz(a.y, 2, 999) && ganz(a.a, 0, 999999) && istErgebnis(a)
}

function normalisiereUebung<A extends Ergebnis>(raw: unknown, istA: (x: unknown) => x is A): Uebungsdaten<A> {
  const r = obj(raw)
  const g = obj(r.gesamt)
  const n = (x: unknown) => (zahl(x, 0, Infinity) ? (x as number) : 0)
  const gesamt: Gesamt = {
    anzahl: n(g.anzahl),
    richtig: n(g.richtig),
    mitTipp: n(g.mitTipp),
    zeitRichtig: n(g.zeitRichtig),
    best: zahl(g.best, 0, Infinity) ? (g.best as number) : null,
  }
  const letzte = Array.isArray(r.letzte) ? r.letzte.filter(istA).slice(-LETZTE_MAX) : []
  return { gesamt, letzte }
}

export const normalisiereWochentag = (raw: unknown) => normalisiereUebung(raw, istAufgabe)
export const normalisiereRechnen = (raw: unknown) => normalisiereUebung(raw, istRechenAufgabe)

function speichere<A extends Ergebnis>(key: string, alt: Uebungsdaten<A>, a: A): Uebungsdaten<A> {
  const neu = { gesamt: addiere(alt.gesamt, a), letzte: [...alt.letzte, a].slice(-LETZTE_MAX) }
  schreibe(key, neu)
  return neu
}

function zuruecksetzen<A extends Ergebnis>(key: string): Uebungsdaten<A> {
  const neu = { gesamt: LEER, letzte: [] }
  schreibe(key, neu)
  return neu
}

export const getWochentag = () => normalisiereWochentag(lies('wochentag'))
export const speichereAufgabe = (a: Aufgabe) => speichere('wochentag', getWochentag(), a)
export const wochentagZuruecksetzen = () => zuruecksetzen<Aufgabe>('wochentag')

export const getRechnen = () => normalisiereRechnen(lies('rechnen'))
export const speichereRechenAufgabe = (a: RechenAufgabe) => speichere('rechnen', getRechnen(), a)
export const rechnenZuruecksetzen = () => zuruecksetzen<RechenAufgabe>('rechnen')

// ---------- Kartendeck ----------

const istVersuch = (x: unknown): x is Versuch => {
  const v = obj(x)
  return (
    zahl(v.zeit, 0, Infinity) && (ANZAHLEN as readonly number[]).includes(v.n as number) &&
    zahl(v.bisFehler, 0, 52) && zahl(v.richtig, 0, 52) && zahl(v.merk, 0, Infinity) && zahl(v.wieder, 0, Infinity) &&
    (v.takt === null || zahl(v.takt, TAKT_MIN, TAKT_MAX))
  )
}

export const normalisiereVersuche = (raw: unknown): Versuch[] =>
  Array.isArray(raw) ? raw.filter(istVersuch).slice(-VERSUCHE_MAX) : []

export const getVersuche = () => normalisiereVersuche(lies('karten'))

export function speichereVersuch(v: Versuch): Versuch[] {
  const neu = [...getVersuche(), v].slice(-VERSUCHE_MAX)
  schreibe('karten', neu)
  return neu
}

export function kartenZuruecksetzen(): Versuch[] {
  schreibe('karten', [])
  return []
}

// ---------- Konstanten ----------

const istKVersuch = (x: unknown): x is KVersuch => {
  const v = obj(x)
  const k = typeof v.k === 'string' ? KONSTANTE[v.k] : undefined
  return (
    !!k && ganz(v.stellen, 0, k.ziffern.length) && zahl(v.ende, 0, Infinity) && zahl(v.dauer, 0, Infinity) &&
    typeof v.fehler === 'boolean'
  )
}

export const normalisiereKVersuche = (raw: unknown): KVersuch[] =>
  Array.isArray(raw) ? raw.filter(istKVersuch).slice(-KVERSUCHE_MAX) : []

export const getKVersuche = () => normalisiereKVersuche(lies('konstanten'))

export function speichereKVersuch(v: KVersuch): KVersuch[] {
  const neu = [...getKVersuche(), v].slice(-KVERSUCHE_MAX)
  schreibe('konstanten', neu)
  return neu
}

export function konstantenZuruecksetzen(): KVersuch[] {
  schreibe('konstanten', [])
  return []
}
