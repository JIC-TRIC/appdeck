/*
 * Speicher von Loci: drei localStorage-Schluessel mit dem Praefix der App-ID,
 * so erfasst das Launcher-Backup alles. Gelesenes wird geprueft und notfalls
 * auf Standardwerte gesetzt (normalisiere* - getestet in store.test.ts).
 *
 *   loci:einstellungen   Einstellungen
 *   loci:wochentag       { gesamt, letzte }  Statistik Wochentag
 *   loci:karten          Versuch[]           die letzten 100 Kartendeck-Versuche
 */
import { ANZAHLEN, TAKT_MAX, TAKT_MIN } from './karten'
import { LEER, LETZTE_MAX, addiere } from './statistik'
import { FRUEHESTES_JAHR, SPAETESTES_JAHR } from './wochentag'
import type { Aufgabe, Deckgroesse, Einstellungen, Versuch, WtDaten, WtGesamt, ZeitraumId } from './types'

export const APP_ID = 'loci'
const VERSUCHE_MAX = 100

export const STANDARD: Einstellungen = {
  reiter: 'wochentag',
  uhr: true,
  zeitraum: { id: '1900', von: 1900, bis: 2099 },
  deck: { anzahl: 52, taktAn: false, takt: 3 },
  anleitungGesehen: false,
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
const jahr = (x: unknown) => typeof x === 'number' && Number.isInteger(x) && x >= FRUEHESTES_JAHR && x <= SPAETESTES_JAHR

// ---------- Einstellungen ----------

export function normalisiereEinstellungen(raw: unknown): Einstellungen {
  const r = obj(raw)
  const z = obj(r.zeitraum)
  const d = obj(r.deck)
  const ids: ZeitraumId[] = ['jahr', '1900', '1600', 'eigen']
  const zeitraum =
    ids.includes(z.id as ZeitraumId) && jahr(z.von) && jahr(z.bis) && (z.von as number) <= (z.bis as number)
      ? { id: z.id as ZeitraumId, von: z.von as number, bis: z.bis as number }
      : STANDARD.zeitraum
  // Takt auf halbe Sekunden runden - so bleibt der Stepper im Raster.
  const takt = zahl(d.takt, TAKT_MIN, TAKT_MAX) ? Math.round((d.takt as number) * 2) / 2 : STANDARD.deck.takt
  return {
    reiter: r.reiter === 'karten' ? 'karten' : 'wochentag',
    uhr: typeof r.uhr === 'boolean' ? r.uhr : STANDARD.uhr,
    zeitraum,
    deck: {
      anzahl: (ANZAHLEN as readonly number[]).includes(d.anzahl as number) ? (d.anzahl as Deckgroesse) : STANDARD.deck.anzahl,
      taktAn: d.taktAn === true,
      takt,
    },
    anleitungGesehen: r.anleitungGesehen === true,
  }
}

export const getEinstellungen = () => normalisiereEinstellungen(lies('einstellungen'))

export function setEinstellungen(patch: Partial<Einstellungen>): Einstellungen {
  const neu = normalisiereEinstellungen({ ...getEinstellungen(), ...patch })
  schreibe('einstellungen', neu)
  return neu
}

// ---------- Wochentag ----------

const istAufgabe = (x: unknown): x is Aufgabe => {
  const a = obj(x)
  return (
    typeof a.d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(a.d) &&
    zahl(a.a, 0, 6) && typeof a.r === 'boolean' && zahl(a.z, 0, Infinity) && zahl(a.t, 0, 5)
  )
}

export function normalisiereWochentag(raw: unknown): WtDaten {
  const r = obj(raw)
  const g = obj(r.gesamt)
  const n = (x: unknown) => (zahl(x, 0, Infinity) ? (x as number) : 0)
  const gesamt: WtGesamt = {
    anzahl: n(g.anzahl),
    richtig: n(g.richtig),
    mitTipp: n(g.mitTipp),
    zeitRichtig: n(g.zeitRichtig),
    best: zahl(g.best, 0, Infinity) ? (g.best as number) : null,
  }
  const letzte = Array.isArray(r.letzte) ? r.letzte.filter(istAufgabe).slice(-LETZTE_MAX) : []
  return { gesamt, letzte }
}

export const getWochentag = () => normalisiereWochentag(lies('wochentag'))

export function speichereAufgabe(a: Aufgabe): WtDaten {
  const alt = getWochentag()
  const neu = { gesamt: addiere(alt.gesamt, a), letzte: [...alt.letzte, a].slice(-LETZTE_MAX) }
  schreibe('wochentag', neu)
  return neu
}

export function wochentagZuruecksetzen(): WtDaten {
  const neu = { gesamt: LEER, letzte: [] }
  schreibe('wochentag', neu)
  return neu
}

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
