/*
 * Speicher des Trainings, neben den Werten unter form:* - so erfasst das
 * Launcher-Backup auch das. Gelesenes wird geprueft und notfalls verworfen
 * (normalisiere* - getestet in trainingStore.test.ts).
 *
 *   form:uebungen   Uebung[]        alle Uebungen, auch archivierte
 *   form:vorlagen   Vorlage[]       Reihenfolge ueber rang
 *   form:trainings  Training[]      beendete, aelteste zuerst
 *   form:laufend    Training|null   das laufende - nach jedem Tipp gesichert
 *   form:bereich    'werte'|'training'   wo Form zuletzt war
 *   form:einstellungen  { ton, wach }   Schalter im Menue des Trainings
 */
import { NAME_MAX, lies, neueId, obj, sauber, schreibe, zahl } from './store'
import { rund } from './util'
import type { AppBereich, Einstellungen, Erfassung, Satz, Training, TrainingsUebung, Uebung, Vorlage, VorlagenUebung } from './types'

export const NOTIZ_MAX = 80
export const PAUSE_STANDARD = 120
export const PAUSE_MIN = 15
export const PAUSE_MAX = 600
export const SAETZE_MAX = 20
export const WDH_MAX = 100
export const AUFWAERMEN_MAX = 5
export const NOTIZ_TRAINING_MAX = 300
/** Gewichtsschritte, die man pro Uebung waehlen kann (kg). */
export const SCHRITTE = [1, 1.25, 2, 2.5, 5]
export const SCHRITT_STANDARD = 2.5
/** Stangen fuer den Scheibenrechner (kg). */
export const STANGEN = [10, 15, 20]
const ERFASSUNGEN: Erfassung[] = ['gewicht', 'wdh', 'zeit']

/** Pausen in 15-Sekunden-Schritten zwischen 0:15 und 10:00. */
export const pauseSauber = (s: number) => Math.min(PAUSE_MAX, Math.max(PAUSE_MIN, Math.round(s / 15) * 15))

const ganz = (x: unknown, min: number, max: number): number | null =>
  zahl(x) && x >= min ? Math.min(max, Math.round(x)) : null

/** Alphabetisch nach Namen, deutsch, ohne Gross und klein. */
export const alphabetisch = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, 'de', { sensitivity: 'base' })

// ---------- Uebungen ----------

export function normalisiereUebungen(raw: unknown): Uebung[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Uebung[] = []
  for (const x of raw) {
    const u = obj(x)
    if (typeof u.id !== 'string' || !u.id || ids.has(u.id)) continue
    const name = typeof u.name === 'string' ? sauber(u.name, NAME_MAX) : ''
    if (!name) continue
    ids.add(u.id)
    out.push({
      id: u.id,
      name,
      erfassung: ERFASSUNGEN.includes(u.erfassung as Erfassung) ? (u.erfassung as Erfassung) : 'gewicht',
      pause: zahl(u.pause) ? pauseSauber(u.pause) : PAUSE_STANDARD,
      notiz: typeof u.notiz === 'string' ? sauber(u.notiz, NOTIZ_MAX) : '',
      schritt: zahl(u.schritt) && SCHRITTE.includes(u.schritt) ? u.schritt : SCHRITT_STANDARD,
      stange: zahl(u.stange) && STANGEN.includes(u.stange) ? u.stange : null,
      archiviert: u.archiviert === true,
      erstellt: zahl(u.erstellt) && u.erstellt > 0 ? u.erstellt : 0,
    })
  }
  return out
}

export const getUebungen = () => normalisiereUebungen(lies('uebungen'))

export interface UebungEingabe {
  name: string
  erfassung: Erfassung
  pause: number
  notiz: string
  schritt?: number
  stange?: number | null
}

/** Legt eine Uebung an (ohne id) oder aendert sie. null, wenn der Name fehlt. */
export function speichereUebung(e: UebungEingabe, id?: string, jetzt = Date.now()): Uebung | null {
  const name = sauber(e.name, NAME_MAX)
  if (!name) return null
  const alle = getUebungen()
  const alt = id ? alle.find((u) => u.id === id) : undefined
  const u: Uebung = {
    id: alt?.id ?? neueId(jetzt),
    name,
    erfassung: e.erfassung,
    pause: pauseSauber(e.pause),
    notiz: sauber(e.notiz, NOTIZ_MAX),
    schritt: e.schritt !== undefined && SCHRITTE.includes(e.schritt) ? e.schritt : (alt?.schritt ?? SCHRITT_STANDARD),
    stange: e.stange !== undefined ? (e.stange !== null && STANGEN.includes(e.stange) ? e.stange : null) : (alt?.stange ?? null),
    archiviert: alt?.archiviert ?? false,
    erstellt: alt?.erstellt ?? jetzt,
  }
  schreibe('uebungen', alt ? alle.map((x) => (x.id === u.id ? u : x)) : [...alle, u])
  return u
}

/** Aendert nur Pause oder Archiv - der Rest bleibt. */
export function setzeUebung(id: string, aenderung: Partial<Pick<Uebung, 'pause' | 'archiviert'>>) {
  schreibe(
    'uebungen',
    getUebungen().map((u) =>
      u.id === id
        ? {
            ...u,
            ...(aenderung.pause !== undefined ? { pause: pauseSauber(aenderung.pause) } : {}),
            ...(aenderung.archiviert !== undefined ? { archiviert: aenderung.archiviert } : {}),
          }
        : u,
    ),
  )
}

/** Steckt die Uebung in irgendeinem Training? Dann laesst sie sich nur archivieren. */
export function wirdBenutzt(id: string) {
  const drin = (t: Training) => t.uebungen.some((u) => u.uebung === id)
  const laufend = getLaufend()
  return getTrainings().some(drin) || (laufend !== null && drin(laufend))
}

/** Loescht eine nie trainierte Uebung, auch aus den Vorlagen. false, wenn sie benutzt wird. */
export function loescheUebung(id: string): boolean {
  if (wirdBenutzt(id)) return false
  schreibe('uebungen', getUebungen().filter((u) => u.id !== id))
  const vorlagen = getVorlagen()
  if (vorlagen.some((v) => v.uebungen.some((u) => u.uebung === id))) {
    schreibe(
      'vorlagen',
      vorlagen.map((v) => ({ ...v, uebungen: v.uebungen.filter((u) => u.uebung !== id) })),
    )
  }
  return true
}

// ---------- Vorlagen ----------

function normalisiereVorlagenUebung(x: unknown): VorlagenUebung | null {
  const u = obj(x)
  if (typeof u.uebung !== 'string' || !u.uebung) return null
  let von = ganz(u.von, 1, WDH_MAX)
  let bis = ganz(u.bis, 1, WDH_MAX)
  if (von !== null && bis !== null && von > bis) [von, bis] = [bis, von]
  return {
    uebung: u.uebung,
    saetze: ganz(u.saetze, 1, SAETZE_MAX) ?? 3,
    aufwaermen: ganz(u.aufwaermen, 0, AUFWAERMEN_MAX) ?? 0,
    von,
    bis,
  }
}

export function normalisiereVorlagen(raw: unknown): Vorlage[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Vorlage[] = []
  raw.forEach((x, i) => {
    const v = obj(x)
    if (typeof v.id !== 'string' || !v.id || ids.has(v.id)) return
    const name = typeof v.name === 'string' ? sauber(v.name, NAME_MAX) : ''
    if (!name) return
    ids.add(v.id)
    out.push({
      id: v.id,
      name,
      uebungen: Array.isArray(v.uebungen)
        ? v.uebungen.map(normalisiereVorlagenUebung).filter((u): u is VorlagenUebung => u !== null)
        : [],
      rang: zahl(v.rang) ? v.rang : i,
    })
  })
  return out.sort((a, b) => a.rang - b.rang)
}

export const getVorlagen = () => normalisiereVorlagen(lies('vorlagen'))

/** Legt eine Vorlage an (ohne id, dann ganz hinten) oder aendert sie. null ohne Namen. */
export function speichereVorlage(
  e: { name: string; uebungen: VorlagenUebung[] },
  id?: string,
  jetzt = Date.now(),
): Vorlage | null {
  const name = sauber(e.name, NAME_MAX)
  if (!name) return null
  const alle = getVorlagen()
  const alt = id ? alle.find((v) => v.id === id) : undefined
  const v: Vorlage = {
    id: alt?.id ?? neueId(jetzt),
    name,
    uebungen: e.uebungen.map(normalisiereVorlagenUebung).filter((u): u is VorlagenUebung => u !== null),
    rang: alt?.rang ?? (alle.length ? Math.max(...alle.map((x) => x.rang)) + 1 : 0),
  }
  schreibe('vorlagen', alt ? alle.map((x) => (x.id === v.id ? v : x)) : [...alle, v])
  return v
}

export function loescheVorlage(id: string) {
  schreibe('vorlagen', getVorlagen().filter((v) => v.id !== id))
}

/** Neue Reihenfolge auf der Startseite. */
export function ordneVorlagen(ids: string[]) {
  const pos = new Map(ids.map((id, i) => [id, i]))
  schreibe(
    'vorlagen',
    getVorlagen().map((v) => ({ ...v, rang: pos.get(v.id) ?? ids.length + v.rang })),
  )
}

// ---------- Trainings ----------

export const leererSatz = (aufwaermen = false): Satz => ({ kg: null, wdh: null, sek: null, fertig: null, aufwaermen })

/** Die Saetze einer Uebung beim Start: erst die Aufwaermsaetze, dann die Arbeitssaetze. */
export const saetzeFuer = (v: Pick<VorlagenUebung, 'saetze' | 'aufwaermen'>): Satz[] => [
  ...Array.from({ length: v.aufwaermen }, () => leererSatz(true)),
  ...Array.from({ length: v.saetze }, () => leererSatz()),
]

function normalisiereSatz(x: unknown): Satz {
  const s = obj(x)
  return {
    kg: zahl(s.kg) && s.kg >= 0 ? rund(s.kg) : null,
    wdh: ganz(s.wdh, 0, 9999),
    sek: ganz(s.sek, 0, 86400),
    fertig: zahl(s.fertig) && s.fertig > 0 ? s.fertig : null,
    aufwaermen: s.aufwaermen === true,
  }
}

export function normalisiereTraining(x: unknown): Training | null {
  const t = obj(x)
  if (typeof t.id !== 'string' || !t.id || !zahl(t.start) || t.start <= 0) return null
  const uebungen: TrainingsUebung[] = Array.isArray(t.uebungen)
    ? t.uebungen
        .map(obj)
        .filter((u) => typeof u.uebung === 'string' && u.uebung)
        .map((u) => ({
          uebung: u.uebung as string,
          saetze: Array.isArray(u.saetze) ? u.saetze.slice(0, SAETZE_MAX * 3).map(normalisiereSatz) : [],
        }))
    : []
  return {
    id: t.id,
    vorlage: typeof t.vorlage === 'string' && t.vorlage ? t.vorlage : null,
    name: (typeof t.name === 'string' && sauber(t.name, NAME_MAX)) || 'Training',
    start: t.start,
    ende: zahl(t.ende) && t.ende >= t.start ? t.ende : null,
    uebungen,
    notiz: typeof t.notiz === 'string' ? t.notiz.trim().slice(0, NOTIZ_TRAINING_MAX) : '',
  }
}

/** Nur beendete Trainings, jede id einmal, aelteste zuerst. */
export function normalisiereTrainings(raw: unknown): Training[] {
  if (!Array.isArray(raw)) return []
  const ids = new Set<string>()
  const out: Training[] = []
  for (const x of raw) {
    const t = normalisiereTraining(x)
    if (!t || t.ende === null || ids.has(t.id)) continue
    ids.add(t.id)
    out.push(t)
  }
  return out.sort((a, b) => a.start - b.start)
}

export const getTrainings = () => normalisiereTrainings(lies('trainings'))

/** Fuegt ein beendetes Training ein oder ersetzt es (gleiche id). */
export function speichereTraining(t: Training) {
  const alle = getTrainings().filter((x) => x.id !== t.id)
  schreibe('trainings', [...alle, t].sort((a, b) => a.start - b.start))
}

export function loescheTraining(id: string) {
  schreibe('trainings', getTrainings().filter((t) => t.id !== id))
}

// ---------- Das laufende Training ----------

export function getLaufend(): Training | null {
  const t = normalisiereTraining(lies('laufend'))
  return t && t.ende === null ? t : null
}

export function setzeLaufend(t: Training | null) {
  schreibe('laufend', t)
}

/** Startet ein Training: aus einer Vorlage mit ihren Uebungen und Saetzen, oder leer. */
export function starteTraining(vorlage: Vorlage | null, jetzt = Date.now()): Training {
  const t: Training = {
    id: neueId(jetzt),
    vorlage: vorlage?.id ?? null,
    name: vorlage?.name ?? 'Training',
    start: jetzt,
    ende: null,
    uebungen: (vorlage?.uebungen ?? []).map((v) => ({ uebung: v.uebung, saetze: saetzeFuer(v) })),
    notiz: '',
  }
  setzeLaufend(t)
  return t
}

// ---------- Wo Form zuletzt war ----------

export const getBereich = (): AppBereich => (lies('bereich') === 'training' ? 'training' : 'werte')

export function setzeBereich(b: AppBereich) {
  schreibe('bereich', b)
}

// ---------- Schalter ----------

export function getEinstellungen(): Einstellungen {
  const e = obj(lies('einstellungen'))
  return { ton: e.ton === true, wach: e.wach === true }
}

export function setzeEinstellungen(e: Einstellungen) {
  schreibe('einstellungen', e)
}
