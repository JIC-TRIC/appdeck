// Lernweg, Status, Schwierigkeit, Meilensteine - die Regeln aus konzept.md.

import type { Difficulty, Level, Piece, Progress, Status } from './types'

export const DEFAULT_PROGRESS: Progress = {
  rightHand: 0,
  leftHand: 0,
  together: 0,
  dynamics: false,
  memorized: 0,
}

const level = (v: unknown): Level => (v === 2 ? 2 : v === 1 ? 1 : 0)

// Eine spaetere Gruppe setzt alle frueheren voraus. Repariert Altbestaende
// (so hat es die alte App beim Laden auch gemacht).
export function normalizeProgress(raw: Partial<Progress> | undefined): Progress {
  const p: Progress = {
    rightHand: level(raw?.rightHand),
    leftHand: level(raw?.leftHand),
    together: level(raw?.together),
    dynamics: raw?.dynamics === true,
    memorized: level(raw?.memorized),
  }
  if (p.memorized >= 1) p.dynamics = true
  if (p.dynamics) p.together = 2
  if (p.together >= 1) {
    p.rightHand = 2
    p.leftHand = 2
  }
  return p
}

// Sehr alte Stuecke hatten statt "progress" eine Liste "milestones".
function fromMilestones(ms: string[]): Progress {
  const has = (m: string) => ms.includes(m)
  return {
    rightHand: has('right_hand_full') ? 2 : has('right_hand') ? 1 : 0,
    leftHand: has('left_hand_full') ? 2 : has('left_hand') ? 1 : 0,
    together: has('tempo_reached') ? 2 : has('hands_together') ? 1 : 0,
    dynamics: has('dynamics_added'),
    memorized: has('memorized') ? 2 : has('performance_ready') ? 1 : 0,
  }
}

const DIFFICULTY_IDS: Difficulty[] = ['Unknown', 'Free', 'Easy', 'Medium', 'Hard', 'Ultrahard']

/** Ein gespeichertes Stueck in die heutige Form bringen - fehlende Felder ergaenzen. */
export function migratePiece(raw: unknown): Piece {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const progress = r.progress
    ? normalizeProgress(r.progress as Partial<Progress>)
    : normalizeProgress(fromMilestones(Array.isArray(r.milestones) ? (r.milestones as string[]) : []))
  const rest = { ...r }
  delete rest.milestones
  return {
    ...(rest as Partial<Piece>),
    id: String(r.id ?? ''),
    title: typeof r.title === 'string' ? r.title : '',
    artist: typeof r.artist === 'string' ? r.artist : '',
    youtubeUrl: typeof r.youtubeUrl === 'string' ? r.youtubeUrl : '',
    difficulty: DIFFICULTY_IDS.includes(r.difficulty as Difficulty) ? (r.difficulty as Difficulty) : 'Unknown',
    progress,
    lastPracticed: typeof r.lastPracticed === 'string' ? r.lastPracticed : null,
  }
}

export const isArchived = (p: Piece) => !!p.archivedAt

// ---------- Status ----------

export function statusOf(p: Progress): Status {
  if (p.memorized === 2) return 'mastered'
  if (p.memorized === 1) return 'memorizing'
  if (p.dynamics) return 'learned'
  if (p.together >= 1) return 'together'
  if (p.rightHand >= 1 || p.leftHand >= 1) return 'hands'
  return 'not_started'
}

/** Rang fuer die Sortierung nach Lernstand */
export const STATUS_RANK: Record<Status, number> = {
  not_started: 0,
  hands: 1,
  together: 2,
  learned: 3,
  memorizing: 4,
  mastered: 5,
}

export const STATUS_LABEL: Record<Status, string> = {
  not_started: 'Nicht begonnen',
  hands: 'Hände einzeln',
  together: 'Zusammen',
  learned: 'Gelernt',
  memorizing: 'Auswendig lernen',
  mastered: 'Auswendig',
}

/** Status mit Tempo, wo es etwas sagt: "Zusammen, langsam" */
export function statusText(p: Progress) {
  const s = statusOf(p)
  if (s === 'together') return p.together === 2 ? 'Zusammen im Tempo' : 'Zusammen, langsam'
  return STATUS_LABEL[s]
}

export type Filter = 'alle' | 'arbeit' | 'gelernt' | 'auswendig'

export function filterOf(p: Progress): Exclude<Filter, 'alle'> {
  const s = statusOf(p)
  if (s === 'learned') return 'gelernt'
  if (s === 'memorizing' || s === 'mastered') return 'auswendig'
  return 'arbeit'
}

/** Erreichte Stufen 0-9 - in der Reihenfolge der Klaviatur */
export function stepsOn(p: Progress): boolean[] {
  return [
    p.rightHand >= 1,
    p.rightHand >= 2,
    p.leftHand >= 1,
    p.leftHand >= 2,
    p.together >= 1,
    p.together >= 2,
    p.dynamics,
    p.memorized >= 1,
    p.memorized >= 2,
  ]
}

export function stepCount(p: Progress) {
  return stepsOn(p).filter(Boolean).length
}

// ---------- Lernweg ----------

export type Phase = 'hands' | 'together' | 'dynamics' | 'memorize'

export const PHASE_LABEL: Record<Phase, string> = {
  hands: 'Hände einzeln',
  together: 'Hände zusammen',
  dynamics: 'Dynamik',
  memorize: 'Auswendig',
}

/** Die erste Gruppe, die noch nicht fertig ist (alles fertig: Auswendig). */
export function currentPhase(p: Progress): Phase {
  if (p.rightHand < 2 || p.leftHand < 2) return 'hands'
  if (p.together < 2) return 'together'
  if (!p.dynamics) return 'dynamics'
  return 'memorize'
}

export function isDone(p: Progress, phase: Phase) {
  if (phase === 'hands') return p.rightHand === 2 && p.leftHand === 2
  if (phase === 'together') return p.together === 2
  if (phase === 'dynamics') return p.dynamics
  return p.memorized === 2
}

export interface Lock {
  locked: boolean
  reason?: string
}

// Wie in der alten App: vorwaerts erst, wenn die Gruppe davor fertig ist;
// rueckwaerts nicht mehr, sobald die naechste begonnen hat.
export function lockOf(p: Progress, phase: Phase): Lock {
  switch (phase) {
    case 'hands':
      return p.together >= 1 ? { locked: true, reason: 'Zusammen schon begonnen' } : { locked: false }
    case 'together':
      if (p.rightHand < 2 || p.leftHand < 2) return { locked: true, reason: 'Erst beide Hände im Tempo' }
      if (p.dynamics) return { locked: true, reason: 'Dynamik schon begonnen' }
      return { locked: false }
    case 'dynamics':
      if (p.together < 2) return { locked: true, reason: 'Erst zusammen im Tempo' }
      if (p.memorized >= 1) return { locked: true, reason: 'Auswendig schon begonnen' }
      return { locked: false }
    case 'memorize':
      return p.dynamics ? { locked: false } : { locked: true, reason: 'Erst Dynamik' }
  }
}

export const HAND_LEVELS = ['Noch nicht', 'Langsam', 'Im Tempo']
export const MEMO_LEVELS = ['Noch nicht', 'Noten im Kopf', 'Ganz']

/** Kurz fuer Heute: "Nächster Schritt: Dynamik" */
export function nextStepShort(p: Progress) {
  if (p.rightHand < 2) return p.rightHand === 0 ? 'Rechte Hand' : 'Rechts ins Tempo'
  if (p.leftHand < 2) return p.leftHand === 0 ? 'Linke Hand' : 'Links ins Tempo'
  if (p.together < 2) return p.together === 0 ? 'Hände zusammen' : 'Zusammen ins Tempo'
  if (!p.dynamics) return 'Dynamik'
  if (p.memorized < 2) return p.memorized === 0 ? 'Auswendig lernen' : 'Ganz auswendig'
  return 'Auffrischen'
}

/** Lang fuer Ueben: "Ziel dieser Sitzung" */
export function nextStepLong(p: Progress) {
  if (p.rightHand < 2) return p.rightHand === 0 ? 'Rechte Hand allein, langsam' : 'Rechte Hand ins Tempo bringen'
  if (p.leftHand < 2) return p.leftHand === 0 ? 'Linke Hand allein, langsam' : 'Linke Hand ins Tempo bringen'
  if (p.together < 2) return p.together === 0 ? 'Hände zusammen, langsam' : 'Hände zusammen: von langsam zum Tempo'
  if (!p.dynamics) return 'Dynamik: laut und leise, Phrasen, Pedal'
  if (p.memorized < 2) return p.memorized === 0 ? 'Auswendig: Noten in den Kopf' : 'Ganz auswendig spielen'
  return 'Auffrischen – das Stück sitzt'
}

const HAND_IN_SENTENCE = ['noch nicht', 'langsam', 'im Tempo']

/** Zusammenfassung einer Gruppe: "Rechts im Tempo · Links langsam" */
export function phaseSummary(p: Progress, phase: Phase) {
  if (phase === 'hands') return `Rechts ${HAND_IN_SENTENCE[p.rightHand]} · Links ${HAND_IN_SENTENCE[p.leftHand]}`
  if (phase === 'together') return HAND_LEVELS[p.together]
  if (phase === 'dynamics') return p.dynamics ? 'Erledigt' : 'Noch nicht'
  return MEMO_LEVELS[p.memorized]
}

// "Wo stehst du?" beim Anlegen: setzt den Lernweg grob.
export const PRESETS = [
  { id: 'neu', label: 'Neu', progress: DEFAULT_PROGRESS },
  { id: 'haende', label: 'Hände einzeln', progress: { ...DEFAULT_PROGRESS, rightHand: 1, leftHand: 1 } },
  { id: 'zusammen', label: 'Zusammen', progress: { ...DEFAULT_PROGRESS, rightHand: 2, leftHand: 2, together: 1 } },
  {
    id: 'gelernt',
    label: 'Gelernt',
    progress: { rightHand: 2, leftHand: 2, together: 2, dynamics: true, memorized: 0 },
  },
  {
    id: 'auswendig',
    label: 'Auswendig',
    progress: { rightHand: 2, leftHand: 2, together: 2, dynamics: true, memorized: 2 },
  },
] as const satisfies readonly { id: string; label: string; progress: Progress }[]

// ---------- Schwierigkeit ----------

// Wie schwer das Stueck an sich ist - eingeschaetzt beim Anlegen, unabhaengig
// davon, wie weit man ist (das sagt der Lernweg). Die Werte sind die der alten
// App, nur die Bedeutung ist neu: "Free" heisst jetzt "Sehr leicht".

export interface DifficultyInfo {
  id: Difficulty
  label: string
  text: string
  /** Balken 0-5 */
  bars: number
  /** Farbe der Ecke auf den Kacheln (gruen = leicht … rot = schwer), Offen: keine */
  color: string | null
  /** Sortierung */
  rank: number
}

export const DIFFICULTIES: DifficultyInfo[] = [
  { id: 'Unknown', label: 'Offen', text: 'Noch nicht eingeschätzt.', bars: 0, color: null, rank: -1 },
  { id: 'Free', label: 'Sehr leicht', text: 'Wenige Töne, ruhiges Tempo – fast vom Blatt.', bars: 1, color: '#6fbf8e', rank: 0 },
  { id: 'Easy', label: 'Leicht', text: 'Überschaubar, nur einzelne Stellen brauchen Übung.', bars: 2, color: '#b4c95e', rank: 1 },
  { id: 'Medium', label: 'Mittel', text: 'Einige knifflige Stellen, ein paar Wochen Arbeit.', bars: 3, color: '#e8c95a', rank: 2 },
  { id: 'Hard', label: 'Schwer', text: 'Viele schwierige Stellen: Tempo, Sprünge, volle Griffe.', bars: 4, color: '#e8914f', rank: 3 },
  { id: 'Ultrahard', label: 'Sehr schwer', text: 'Eine echte Herausforderung, an der Grenze des Machbaren.', bars: 5, color: '#e0625a', rank: 4 },
]

export function difficultyInfo(id: Difficulty) {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[0]
}

// ---------- Meilensteine ----------

// 5 … 100 h in kleinen Schritten, dann alle 50 h bis 500 h, dann alle 100 h.
export const MILESTONE_HOURS: number[] = [
  5, 10, 25, 50, 75, 100,
  ...Array.from({ length: 8 }, (_, i) => 150 + i * 50),
  ...Array.from({ length: 15 }, (_, i) => 600 + i * 100),
]

export function nextMilestone(totalSeconds: number) {
  const hours = MILESTONE_HOURS.find((h) => totalSeconds < h * 3600)
  if (hours === undefined) return null
  return { hours, remaining: hours * 3600 - totalSeconds, share: totalSeconds / (hours * 3600) }
}
