// Alles, was aus den Trainings berechnet wird: was grau dasteht, die Pause,
// Rekorde, Volumen, die Abweichung von der Vorlage. Nichts davon wird
// gespeichert (konzept.md, "Training").

import { addDays, dateKey, formatZahl, parseKey, rund } from './util'
import type { Erfassung, Satz, Training, Uebung, Vorlage, VorlagenUebung } from './types'

/** Die Zahlen eines Satzes ohne den Haken. */
export type Zahlen = Pick<Satz, 'kg' | 'wdh' | 'sek'>

/** Hat der Satz die Zahlen, die seine Erfassung braucht? */
export function vollstaendig(s: Zahlen, erf: Erfassung): boolean {
  if (erf === 'gewicht') return s.kg !== null && s.wdh !== null
  if (erf === 'wdh') return s.wdh !== null
  return s.sek !== null
}

/** Nur die Zahlen, die zur Erfassung gehoeren - der Rest wird leer. */
export function nurNoetige(s: Zahlen, erf: Erfassung): Zahlen {
  return {
    kg: erf === 'gewicht' ? s.kg : null,
    wdh: erf === 'zeit' ? null : s.wdh,
    sek: erf === 'zeit' ? s.sek : null,
  }
}

export const erledigt = (s: Satz) => s.fertig !== null

// ---------- Was grau dasteht ----------

export interface Vorgabe {
  saetze: Satz[]
  training: Training
}

/**
 * Das letzte Mal, an dem eine Uebung dran war - fuer die grauen Zahlen. Zuerst
 * in derselben Vorlage (wer Push trainiert, sieht den letzten Push). Gab es
 * die Uebung dort noch nie oder ist es ein leeres Training, das letzte Mal
 * ueberhaupt. Nur Trainings, die vor `vor` begonnen haben.
 */
export function vorgabe(
  trainings: Training[],
  uebung: string,
  vorlage: string | null,
  vor: number,
  ohne?: string,
): Vorgabe | null {
  let gleich: Vorgabe | null = null
  let irgendein: Vorgabe | null = null
  let gleichStart = -1
  let irgendStart = -1
  for (const t of trainings) {
    if (t.id === ohne || t.start >= vor) continue
    for (const tu of t.uebungen) {
      if (tu.uebung !== uebung) continue
      const saetze = tu.saetze.filter(erledigt)
      if (!saetze.length) continue
      if (t.start >= irgendStart) {
        irgendein = { saetze, training: t }
        irgendStart = t.start
      }
      if (vorlage !== null && t.vorlage === vorlage && t.start >= gleichStart) {
        gleich = { saetze, training: t }
        gleichStart = t.start
      }
    }
  }
  return gleich ?? irgendein
}

/** Vorschlag fuers naechste Gewicht (siehe steigerung). */
export interface Steigerung {
  kg: number
  /** Wdh vom unteren Ende des Bereichs - null: wie letztes Mal */
  wdh: number | null
}

/**
 * Der Satz vom letzten Mal, der zu Satz i passt: gleiche Art (Aufwaermen oder
 * Arbeit) und gleiche Stelle darin - der zweite Arbeitssatz zum zweiten.
 */
export function gleicherSatz(ref: Satz[] | null, saetze: Satz[], i: number): Satz | undefined {
  const auf = saetze[i]?.aufwaermen ?? false
  let k = 0
  for (let j = 0; j < i; j += 1) if (saetze[j].aufwaermen === auf) k += 1
  return ref?.filter((r) => r.aufwaermen === auf)[k]
}

/**
 * Was in Satz i grau dasteht: der passende Satz vom letzten Mal - bei einem
 * Vorschlag (steigerung) mit dem naechsten Gewicht. Hat das letzte Mal weniger
 * Saetze dieser Art, der Satz davor in diesem Training (mit dem, was dort
 * getippt oder grau ist).
 */
export function platzhalter(ref: Satz[] | null, saetze: Satz[], i: number, plus: Steigerung | null = null): Zahlen | null {
  const auf = saetze[i]?.aufwaermen ?? false
  const r = gleicherSatz(ref, saetze, i)
  if (r) {
    if (!auf && plus && r.kg !== null) return { kg: rund(r.kg + plus.kg), wdh: plus.wdh ?? r.wdh, sek: r.sek }
    return { kg: r.kg, wdh: r.wdh, sek: r.sek }
  }
  for (let j = i - 1; j >= 0; j -= 1) {
    if ((saetze[j]?.aufwaermen ?? false) === auf) return effektiv(ref, saetze, j, plus)
  }
  return null
}

/** Was fuer Satz i gilt: Getipptes, sonst das Graue. null, wenn beides fehlt. */
export function effektiv(ref: Satz[] | null, saetze: Satz[], i: number, plus: Steigerung | null = null): Zahlen | null {
  const s = saetze[i]
  const p = platzhalter(ref, saetze, i, plus)
  if (!s) return p
  const z = { kg: s.kg ?? p?.kg ?? null, wdh: s.wdh ?? p?.wdh ?? null, sek: s.sek ?? p?.sek ?? null }
  return z.kg === null && z.wdh === null && z.sek === null ? null : z
}

/**
 * Doppelte Progression: Hat man beim letzten Mal in allen Arbeitssaetzen das
 * obere Ende des Wdh-Bereichs geschafft, steht diesmal das naechste Gewicht
 * grau da - mit den Wdh vom unteren Ende. Nur bei Gewicht x Wdh mit Bereich.
 */
export function steigerung(
  ref: Satz[] | null,
  vu: Pick<VorlagenUebung, 'von' | 'bis'> | undefined,
  erf: Erfassung,
  schritt: number,
): Steigerung | null {
  if (erf !== 'gewicht' || !ref || !vu || vu.bis === null) return null
  const bis = vu.bis
  const arbeit = ref.filter((x) => !x.aufwaermen)
  if (!arbeit.length || !arbeit.every((x) => x.wdh !== null && x.wdh >= bis)) return null
  return { kg: schritt, wdh: vu.von }
}

/** Was an einem Satz mehr ist als beim gleichen Satz vom letzten Mal - das wird orange. */
export function besser(s: Zahlen, ref: Zahlen | null | undefined, erf: Erfassung) {
  const nein = { kg: false, wdh: false, sek: false }
  if (!ref) return nein
  if (erf === 'gewicht') {
    if (s.kg === null || s.wdh === null || ref.kg === null || ref.wdh === null) return nein
    return { kg: s.kg > ref.kg, wdh: s.wdh > ref.wdh && s.kg >= ref.kg, sek: false }
  }
  if (erf === 'wdh') return { ...nein, wdh: s.wdh !== null && ref.wdh !== null && s.wdh > ref.wdh }
  return { ...nein, sek: s.sek !== null && ref.sek !== null && s.sek > ref.sek }
}

// ---------- Rekorde ----------

/** Geschaetztes 1RM nach Epley - bei einer Wiederholung das Gewicht selbst. */
export const epley = (kg: number, wdh: number) => (wdh <= 1 ? kg : rund(kg * (1 + wdh / 30)))

export interface Bestwerte {
  kg: number
  e1rm: number
  wdh: number
  sek: number
}

export type RekordArt = 'gewicht' | '1rm' | 'wdh' | 'zeit'

export interface Rekord {
  uebung: string
  /** Stelle der Uebung im Training und des Satzes darin. */
  ui: number
  si: number
  art: RekordArt
  satz: Satz
}

const bestwerteVon = (s: Satz): Bestwerte => ({
  kg: s.kg ?? 0,
  e1rm: s.kg !== null && s.wdh !== null && s.wdh > 0 ? epley(s.kg, s.wdh) : 0,
  wdh: s.wdh ?? 0,
  sek: s.sek ?? 0,
})

const max = (a: Bestwerte, b: Bestwerte): Bestwerte => ({
  kg: Math.max(a.kg, b.kg),
  e1rm: Math.max(a.e1rm, b.e1rm),
  wdh: Math.max(a.wdh, b.wdh),
  sek: Math.max(a.sek, b.sek),
})

/**
 * Die Rekorde eines Trainings: Saetze, die alles davor schlagen - fruehere
 * Trainings (`beste`) und die Saetze davor im selben Training. Das erste Mal
 * ist kein Rekord. `beste` wird dabei fortgeschrieben.
 */
function rekordeUndWeiter(t: Training, beste: Map<string, Bestwerte>, byId: Record<string, Uebung>): Rekord[] {
  const out: Rekord[] = []
  // Nur Uebungen, die es schon vor diesem Training gab - im ersten Training
  // einer Uebung ist kein Satz ein Rekord, auch nicht der bessere zweite.
  const bekannt = new Set(beste.keys())
  t.uebungen.forEach((tu, ui) => {
    const u = byId[tu.uebung]
    if (!u) return
    tu.saetze.forEach((s, si) => {
      if (!erledigt(s) || s.aufwaermen || !vollstaendig(s, u.erfassung)) return
      const neu = bestwerteVon(s)
      const alt = beste.get(tu.uebung)
      if (alt && bekannt.has(tu.uebung)) {
        let art: RekordArt | null = null
        if (u.erfassung === 'gewicht') {
          if (neu.kg > alt.kg) art = 'gewicht'
          else if (neu.e1rm > alt.e1rm) art = '1rm'
        } else if (u.erfassung === 'wdh') {
          if (neu.wdh > alt.wdh) art = 'wdh'
        } else if (neu.sek > alt.sek) art = 'zeit'
        if (art) out.push({ uebung: tu.uebung, ui, si, art, satz: s })
      }
      beste.set(tu.uebung, alt ? max(alt, neu) : neu)
    })
  })
  return out
}

/** Bestwerte pro Uebung aus allen Trainings, die vor `vor` begonnen haben. */
export function bestwerteVor(trainings: Training[], vor: number, byId: Record<string, Uebung>, ohne?: string) {
  const beste = new Map<string, Bestwerte>()
  for (const t of trainings) {
    if (t.id === ohne || t.start >= vor) continue
    rekordeUndWeiter(t, beste, byId)
  }
  return beste
}

/** Die Rekorde in einem Training (auch dem laufenden), verglichen mit allem davor. */
export function rekordeIn(t: Training, trainings: Training[], byId: Record<string, Uebung>): Rekord[] {
  return rekordeUndWeiter(t, bestwerteVor(trainings, t.start, byId, t.id), byId)
}

/** Rekorde aller Trainings auf einmal (fuer den Verlauf), nach Training-id. */
export function alleRekorde(trainings: Training[], byId: Record<string, Uebung>): Map<string, Rekord[]> {
  const beste = new Map<string, Bestwerte>()
  const out = new Map<string, Rekord[]>()
  for (const t of trainings) out.set(t.id, rekordeUndWeiter(t, beste, byId))
  return out
}

// ---------- Pause und Zahlen eines Trainings ----------

/** Der letzte Haken im Training: wann und bei welcher Uebung. Daraus rechnet sich die Pause. */
export function letzterHaken(t: Training): { zeit: number; uebung: string } | null {
  let treffer: { zeit: number; uebung: string } | null = null
  for (const tu of t.uebungen) {
    for (const s of tu.saetze) {
      if (s.fertig !== null && (!treffer || s.fertig > treffer.zeit)) treffer = { zeit: s.fertig, uebung: tu.uebung }
    }
  }
  return treffer
}

export interface Statistik {
  dauer: number
  saetze: number
  /** Summe Gewicht mal Wdh ueber alle erledigten Saetze (kg). */
  volumen: number
}

export function statistik(t: Training, byId: Record<string, Uebung>, jetzt = Date.now()): Statistik {
  let saetze = 0
  let volumen = 0
  for (const tu of t.uebungen) {
    const erf = byId[tu.uebung]?.erfassung ?? 'gewicht'
    for (const s of tu.saetze) {
      if (!erledigt(s) || s.aufwaermen) continue
      saetze += 1
      if (erf === 'gewicht' && s.kg !== null && s.wdh !== null) volumen += s.kg * s.wdh
    }
  }
  return { dauer: (t.ende ?? jetzt) - t.start, saetze, volumen: rund(volumen) }
}

/** Saetze ohne Haken - danach fragt "Beenden". */
export const offeneSaetze = (t: Training) =>
  t.uebungen.reduce((n, tu) => n + tu.saetze.filter((s) => !erledigt(s)).length, 0)

/**
 * Ende beim Beenden: jetzt - liegt der letzte Haken aber ueber eine Stunde
 * zurueck (vergessen zu beenden), der letzte Haken. Sonst stuende ein
 * Training mit 14 Stunden Dauer im Verlauf.
 */
export function endeFuer(t: Training, jetzt: number): number {
  const h = letzterHaken(t)
  return h && jetzt - h.zeit > 3600000 ? Math.max(t.start, h.zeit) : jetzt
}

/**
 * Macht aus einem Training ein beendetes. Offene Saetze fallen weg oder
 * werden mit dem abgehakt, was fuer sie grau dasteht ('abhaken', samt
 * Vorschlag). Uebungen ohne erledigten Satz fallen ganz weg.
 */
export function abschliessen(
  t: Training,
  ende: number,
  offene: 'verwerfen' | 'abhaken',
  byId: Record<string, Uebung>,
  trainings: Training[],
  vorlage?: Vorlage,
): Training {
  const uebungen = t.uebungen
    .map((tu) => {
      const u = byId[tu.uebung]
      const erf = u?.erfassung ?? 'gewicht'
      const ref = vorgabe(trainings, tu.uebung, t.vorlage, t.start, t.id)?.saetze ?? null
      const vu = vorlage?.uebungen.find((v) => v.uebung === tu.uebung)
      const plus = steigerung(ref, vu, erf, u?.schritt ?? 2.5)
      const saetze: Satz[] = []
      tu.saetze.forEach((s, i) => {
        if (erledigt(s) && vollstaendig(s, erf)) saetze.push(s)
        else if (offene === 'abhaken') {
          const z = effektiv(ref, tu.saetze, i, plus)
          if (z && vollstaendig(z, erf)) saetze.push({ ...nurNoetige(z, erf), fertig: ende, aufwaermen: s.aufwaermen })
        }
      })
      return { uebung: tu.uebung, saetze }
    })
    .filter((tu) => tu.saetze.length)
  return { ...t, ende, uebungen }
}

/** Das Training davor mit derselben Vorlage - fuer den Vergleich auf "Fertig". */
export function voriges(trainings: Training[], t: Training): Training | null {
  if (!t.vorlage) return null
  let treffer: Training | null = null
  for (const x of trainings) if (x.id !== t.id && x.vorlage === t.vorlage && x.start < t.start) treffer = x
  return treffer
}

// ---------- Eine Uebung ueber die Zeit ----------

export interface Einheit {
  training: Training
  saetze: Satz[]
}

/** Jedes Training mit dieser Uebung und ihren erledigten Arbeitssaetzen, aelteste zuerst. */
export function einheiten(trainings: Training[], uebung: string): Einheit[] {
  const out: Einheit[] = []
  for (const t of trainings) {
    const saetze = t.uebungen
      .filter((tu) => tu.uebung === uebung)
      .flatMap((tu) => tu.saetze.filter((s) => erledigt(s) && !s.aufwaermen))
    if (saetze.length) out.push({ training: t, saetze })
  }
  return out
}

/** Der staerkste Satz: der schwerste (bei gleichem Gewicht mehr Wdh), die meisten Wdh, die laengste Zeit. */
export function besterSatz(saetze: Satz[], erf: Erfassung): Satz | null {
  let best: Satz | null = null
  for (const s of saetze) {
    if (!vollstaendig(s, erf)) continue
    if (!best) best = s
    else if (erf === 'gewicht') {
      if (s.kg! > best.kg! || (s.kg === best.kg && s.wdh! > best.wdh!)) best = s
    } else if (erf === 'wdh') {
      if (s.wdh! > best.wdh!) best = s
    } else if (s.sek! > best.sek!) best = s
  }
  return best
}

/** Die Zahl fuer Verlauf und Kacheln: Gewicht oder 1RM, sonst Wdh bzw. Sekunden. */
export function kennzahl(s: Satz, erf: Erfassung, art: 'gewicht' | '1rm' = 'gewicht'): number {
  if (erf === 'gewicht') return art === '1rm' ? epley(s.kg ?? 0, s.wdh ?? 0) : (s.kg ?? 0)
  if (erf === 'wdh') return s.wdh ?? 0
  return s.sek ?? 0
}

/**
 * Bestwerte je Wdh-Zahl: das schwerste Gewicht fuer mindestens 1, 3, 5, 8, 10
 * und 12 Wdh. Was ein hoeherer Eintrag schon mit abdeckt (gleiches Gewicht),
 * faellt weg.
 */
export function bestwerteJeWdh(saetze: Satz[]): { wdh: number; kg: number }[] {
  const roh = [1, 3, 5, 8, 10, 12]
    .map((w) => {
      let kg = -1
      for (const s of saetze) {
        if (!s.aufwaermen && s.kg !== null && s.wdh !== null && s.wdh >= w) kg = Math.max(kg, s.kg)
      }
      return { wdh: w, kg }
    })
    .filter((x) => x.kg >= 0)
  return roh.filter((x, i) => !roh.slice(i + 1).some((y) => y.kg >= x.kg))
}

/** Bestes 1RM in einer Reihe Saetze (fuer den Verlauf "1RM"). */
export function bestesE1rm(saetze: Satz[]): number {
  return saetze.reduce((m, s) => (s.kg !== null && s.wdh !== null && s.wdh > 0 ? Math.max(m, epley(s.kg, s.wdh)) : m), 0)
}

// ---------- Vorlage ----------

export interface Abweichung {
  fehlt: string[]
  neu: string[]
  /** Andere Reihenfolge oder Satzzahl bei Uebungen, die in beiden sind. */
  anders: boolean
}

const zaehle = (saetze: Satz[], auf: boolean) => saetze.filter((s) => erledigt(s) && s.aufwaermen === auf).length

/** Wie sich ein beendetes Training von seiner Vorlage unterscheidet. null = gar nicht. */
export function abweichung(t: Training, v: Vorlage): Abweichung | null {
  const imTraining = t.uebungen.filter((tu) => tu.saetze.some(erledigt))
  const tIds = imTraining.map((tu) => tu.uebung)
  const vIds = v.uebungen.map((u) => u.uebung)
  const fehlt = vIds.filter((id) => !tIds.includes(id))
  const neu = tIds.filter((id) => !vIds.includes(id))
  const beide = tIds.filter((id) => vIds.includes(id))
  const reihenfolge = beide.join() !== vIds.filter((id) => tIds.includes(id)).join()
  const saetze = imTraining.some((tu) => {
    const vu = v.uebungen.find((u) => u.uebung === tu.uebung)
    return vu !== undefined && (vu.saetze !== zaehle(tu.saetze, false) || vu.aufwaermen !== zaehle(tu.saetze, true))
  })
  const anders = reihenfolge || saetze
  return fehlt.length || neu.length || anders ? { fehlt, neu, anders } : null
}

/** Die Uebungen einer Vorlage, wie sie im Training waren. Wdh-Bereiche bleiben. */
export function vorlageAus(t: Training, alt: VorlagenUebung[] = []): VorlagenUebung[] {
  return t.uebungen
    .filter((tu) => tu.saetze.some(erledigt))
    .map((tu) => {
      const a = alt.find((x) => x.uebung === tu.uebung)
      return {
        uebung: tu.uebung,
        saetze: Math.max(1, zaehle(tu.saetze, false)),
        aufwaermen: zaehle(tu.saetze, true),
        von: a?.von ?? null,
        bis: a?.bis ?? null,
      }
    })
}

// ---------- Text ----------

const zwei = (n: number) => String(n).padStart(2, '0')

/** '58 min', ab einer Stunde '1:04 h'. */
export function formatDauer(ms: number) {
  const min = Math.max(0, Math.round(ms / 60000))
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}:${zwei(min % 60)} h`
}

/** '17:40' (lokale Uhrzeit) */
export function formatUhr(ms: number) {
  const d = new Date(ms)
  return `${d.getHours()}:${zwei(d.getMinutes())}`
}

/** '1:24', ab einer Stunde '1:02:03' - fuer Pause und Trainingszeit. */
export function formatStoppuhr(sek: number) {
  const s = Math.max(0, Math.floor(sek))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h ? `${h}:${zwei(m)}:${zwei(s % 60)}` : `${m}:${zwei(s % 60)}`
}

/** '5.590' - ganze Kilo mit Tausenderpunkt. */
export const formatTausend = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

/** Wdh-Bereich aus der Vorlage: '8–12', '10' oder leer. */
export function formatBereich(v: Pick<VorlagenUebung, 'von' | 'bis'>) {
  if (v.von !== null && v.bis !== null) return v.von === v.bis ? String(v.von) : `${v.von}–${v.bis}`
  return v.von !== null ? String(v.von) : v.bis !== null ? String(v.bis) : ''
}

/** Eine Zeit: '45 s', ab einer Minute '1:30'. */
export const formatSek = (sek: number) => (sek < 60 ? `${sek} s` : formatStoppuhr(sek))

/** Ein Satz als Text: '82,5 × 8', '12', '1:30'. */
export function formatSatz(s: Zahlen, erf: Erfassung) {
  if (erf === 'gewicht') return `${formatZahl(s.kg ?? 0)} × ${s.wdh ?? 0}`
  if (erf === 'wdh') return String(s.wdh ?? 0)
  return formatSek(s.sek ?? 0)
}

/** Alle Saetze kurz: '82,5 × 8 · 8 · 7' bei gleichem Gewicht, sonst '80 × 8 · 82,5 × 6'. */
export function kurzSaetze(saetze: Zahlen[], erf: Erfassung) {
  if (!saetze.length) return ''
  if (erf === 'gewicht') {
    const kg = saetze[0].kg
    if (saetze.every((s) => s.kg === kg)) return `${formatZahl(kg ?? 0)} × ${saetze.map((s) => s.wdh ?? 0).join(' · ')}`
  }
  return saetze.map((s) => formatSatz(s, erf)).join(' · ')
}

// ---------- Hilfen ----------

const SCHEIBEN = [25, 20, 15, 10, 5, 2.5, 1.25]

/**
 * Scheiben pro Seite fuer ein Gewicht auf der Stange, schwerste zuerst. Leer
 * heisst: nur die Stange. null, wenn es mit den ueblichen Scheiben (25 bis
 * 1,25 kg) nicht genau aufgeht.
 */
export function scheiben(kg: number, stange: number): number[] | null {
  let rest = rund((kg - stange) / 2)
  if (rest < 0) return null
  const out: number[] = []
  for (const sch of SCHEIBEN) {
    while (rest >= sch - 1e-9) {
      out.push(sch)
      rest = rund(rest - sch)
    }
  }
  return rest > 1e-9 ? null : out
}

/** Trainings pro Woche (Montag bis Sonntag) fuer die letzten n Wochen bis heute, aelteste zuerst. */
export function wochen(trainings: Training[], heute: string, n = 12): { montag: string; anzahl: number }[] {
  const dieser = addDays(heute, -((parseKey(heute).getDay() + 6) % 7))
  const out = Array.from({ length: n }, (_, i) => ({ montag: addDays(dieser, -7 * (n - 1 - i)), anzahl: 0 }))
  for (const t of trainings) {
    const tag = dateKey(new Date(t.start))
    for (let i = n - 1; i >= 0; i -= 1) {
      if (tag >= out[i].montag) {
        out[i].anzahl += 1
        break
      }
    }
  }
  return out
}

/**
 * Die Vorlage, die in der Reihenfolge dran ist: die am laengsten nicht
 * trainierte. Nur unter denen, die schon einmal dran waren, und erst ab zwei -
 * eine selten genutzte neue Vorlage soll sich nicht vordraengeln.
 */
export function naechsteVorlage(vorlagen: Vorlage[], trainings: Training[]): string | null {
  const zuletzt = new Map<string, number>()
  for (const t of trainings) if (t.vorlage) zuletzt.set(t.vorlage, Math.max(t.start, zuletzt.get(t.vorlage) ?? 0))
  const kandidaten = vorlagen.filter((v) => zuletzt.has(v.id))
  if (kandidaten.length < 2) return null
  return kandidaten.reduce((a, b) => (zuletzt.get(a.id)! <= zuletzt.get(b.id)! ? a : b)).id
}

/** Alle Trainings als CSV - Semikolon und Komma, wie Excel und Numbers auf Deutsch es erwarten. */
export function alsCsv(trainings: Training[], byId: Record<string, Uebung>): string {
  const feld = (x: string) => (/[;"\r\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x)
  const zeilen = [['Datum', 'Beginn', 'Training', 'Übung', 'Satz', 'kg', 'Wdh', 'Sekunden'].join(';')]
  for (const t of trainings) {
    const tag = dateKey(new Date(t.start))
    const uhr = formatUhr(t.start)
    for (const tu of t.uebungen) {
      const name = byId[tu.uebung]?.name ?? 'Übung'
      let n = 0
      for (const s of tu.saetze) {
        if (!erledigt(s)) continue
        if (!s.aufwaermen) n += 1
        zeilen.push(
          [
            tag,
            uhr,
            feld(t.name),
            feld(name),
            s.aufwaermen ? 'A' : String(n),
            s.kg === null ? '' : formatZahl(s.kg),
            s.wdh === null ? '' : String(s.wdh),
            s.sek === null ? '' : String(s.sek),
          ].join(';'),
        )
      }
    }
  }
  return `${zeilen.join('\r\n')}\r\n`
}
