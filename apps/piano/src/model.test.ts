import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PROGRESS,
  currentPhase,
  filterOf,
  lockOf,
  migratePiece,
  nextMilestone,
  nextStepShort,
  normalizeProgress,
  phaseSummary,
  statusOf,
  statusText,
  stepCount,
} from './model'
import type { Progress } from './types'

const p = (x: Partial<Progress>): Progress => ({ ...DEFAULT_PROGRESS, ...x })

describe('Lernweg', () => {
  it('setzt fruehere Gruppen voraus (Reparatur alter Daten)', () => {
    expect(normalizeProgress({ memorized: 1 })).toEqual({ rightHand: 2, leftHand: 2, together: 2, dynamics: true, memorized: 1 })
    expect(normalizeProgress({ together: 1, rightHand: 0 })).toMatchObject({ rightHand: 2, leftHand: 2 })
  })

  it('sperrt vorwaerts und rueckwaerts wie die alte App', () => {
    const start = p({})
    expect(lockOf(start, 'hands').locked).toBe(false)
    expect(lockOf(start, 'together')).toEqual({ locked: true, reason: 'Erst beide Hände im Tempo' })
    const zusammen = p({ rightHand: 2, leftHand: 2, together: 1 })
    expect(lockOf(zusammen, 'hands')).toEqual({ locked: true, reason: 'Zusammen schon begonnen' })
    expect(lockOf(zusammen, 'together').locked).toBe(false)
    expect(lockOf(zusammen, 'dynamics')).toEqual({ locked: true, reason: 'Erst zusammen im Tempo' })
    expect(lockOf(zusammen, 'memorize').locked).toBe(true)
  })

  it('kennt Status, Filter, Stufen und den naechsten Schritt', () => {
    const fall = p({ rightHand: 2, leftHand: 2, together: 2 })
    expect(statusOf(fall)).toBe('together')
    expect(statusText(fall)).toBe('Zusammen im Tempo')
    expect(filterOf(fall)).toBe('arbeit')
    expect(stepCount(fall)).toBe(6)
    expect(currentPhase(fall)).toBe('dynamics')
    expect(nextStepShort(fall)).toBe('Dynamik')
    const fertig = normalizeProgress({ memorized: 2 })
    expect(statusOf(fertig)).toBe('mastered')
    expect(filterOf(fertig)).toBe('auswendig')
    expect(stepCount(fertig)).toBe(9)
    expect(nextStepShort(fertig)).toBe('Auffrischen')
    expect(phaseSummary(p({ rightHand: 2, leftHand: 1 }), 'hands')).toBe('Rechts im Tempo · Links langsam')
  })
})

describe('Altbestand', () => {
  it('uebersetzt milestones[] und ergaenzt fehlende Felder', () => {
    const piece = migratePiece({ id: 7, title: 'Alt', milestones: ['right_hand_full', 'left_hand', 'x'] })
    expect(piece).toMatchObject({
      id: '7',
      title: 'Alt',
      artist: '',
      difficulty: 'Unknown',
      lastPracticed: null,
      progress: { rightHand: 2, leftHand: 1, together: 0, dynamics: false, memorized: 0 },
    })
    expect('milestones' in piece).toBe(false)
  })

  it('laesst unbekannte Felder stehen', () => {
    expect(migratePiece({ id: 'a', practiceTime: 0, foo: 1 })).toMatchObject({ practiceTime: 0, foo: 1 })
  })
})

describe('Meilensteine', () => {
  it('folgt der Treppe 5 … 100, 150 … 500, 600 …', () => {
    expect(nextMilestone(0)?.hours).toBe(5)
    expect(nextMilestone(27.5 * 3600)).toMatchObject({ hours: 50, remaining: 22.5 * 3600 })
    expect(nextMilestone(120 * 3600)?.hours).toBe(150)
    expect(nextMilestone(520 * 3600)?.hours).toBe(600)
    expect(nextMilestone(2000 * 3600)).toBeNull()
  })
})
