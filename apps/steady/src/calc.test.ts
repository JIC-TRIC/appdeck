import { describe, expect, it } from 'vitest'
import {
  amountSeries,
  dayScores,
  evaluateWeek,
  inLife,
  meets,
  messwert,
  naechsterHaken,
  perfectDays,
  progress,
  quoteIn,
  ruleAt,
  statesBetween,
  streaks,
  todayCount,
  weekdayQuotes,
  weeksDone,
} from './calc'
import { addDays, daysBetween } from './util'
import { NICHT_GESCHAFFT, type Habit, type HabitLog, type Log } from './types'

function habit(patch: Partial<Habit> = {}): Habit {
  const start = patch.start ?? '2026-06-01'
  return {
    id: 'h',
    name: 'Test',
    color: 'coral',
    kind: 'check',
    unit: '',
    rhythm: [{ from: start, perWeek: 7 }],
    goal: [],
    start,
    inactive: [],
    order: 0,
    createdAt: '',
    updatedAt: '',
    ...patch,
  }
}

const gym = (patch: Partial<Habit> = {}) =>
  habit({ rhythm: [{ from: patch.start ?? '2026-06-01', perWeek: 3 }], ...patch })

const logOf = (...days: string[]): HabitLog => Object.fromEntries(days.map((d) => [d, 1]))

// KW 36/2026: Mo 31.8. bis So 6.9.
const KW36 = '2026-08-31'

// Gym ab So 30.8. und an dem Tag trainiert: in KW 36 laeuft also eine Serie,
// die Ruhetage gelten. (Ohne laufende Serie gibt es keine, siehe unten.)
const imTritt = () => gym({ start: '2026-08-30' })
const VORHER = '2026-08-30'

describe('Ruhetage-Kontingent', () => {
  it('verteilt Ruhetage der Reihe nach und verpasst erst nach dem fuenften freien Tag', () => {
    const w = evaluateWeek(imTritt(), logOf(VORHER, '2026-09-03', '2026-09-05'), KW36, '2026-09-07')
    expect(w.states).toEqual(['rest', 'rest', 'rest', 'done', 'rest', 'done', 'miss'])
    expect(w.restBudget).toBe(4)
    expect(w.missed).toBe(1)
  })

  it('rechnet die Woche neu, wenn nachgetragen wird (× wird ◌)', () => {
    const w = evaluateWeek(imTritt(), logOf(VORHER, '2026-09-02', '2026-09-03', '2026-09-05'), KW36, '2026-09-07')
    expect(w.states).toEqual(['rest', 'rest', 'done', 'done', 'rest', 'done', 'rest'])
    expect(w.missed).toBe(0)
  })

  it('erlaubt mehr Trainings als das Ziel, uebrige Ruhetage verfallen', () => {
    const w = evaluateWeek(imTritt(), logOf(VORHER, '2026-08-31', '2026-09-01', '2026-09-02', '2026-09-03'), KW36, '2026-09-07')
    expect(w.done).toBe(4)
    expect(w.states.slice(4)).toEqual(['rest', 'rest', 'rest'])
  })

  it('laesst heute offen, verbraucht dafuer keinen Ruhetag und meldet, wann heute noetig ist', () => {
    // Mi 30.9.: Serie aus der Vorwoche, Montag frei, Dienstag trainiert
    const lebt = gym({ start: '2026-09-27' })
    const w = evaluateWeek(lebt, logOf('2026-09-27', '2026-09-29'), '2026-09-28', '2026-09-30')
    expect(w.states).toEqual(['rest', 'done', 'open', 'future', 'future', 'future', 'future'])
    expect(w.due).toBe(false)
    expect(w.restLeft).toBe(3)

    // Fr 2.10. nach vier freien Tagen: heute muss trainiert werden
    const fr = evaluateWeek(lebt, logOf('2026-09-27'), '2026-09-28', '2026-10-02')
    expect(fr.states.slice(0, 5)).toEqual(['rest', 'rest', 'rest', 'rest', 'open'])
    expect(fr.due).toBe(true)
    expect(fr.restLeft).toBe(0)
  })

  it('rechnet die erste Woche anteilig', () => {
    // Beginn Donnerstag: 4 Tage, Ziel round(3 * 4 / 7) = 2, also 2 Ruhetage
    const doStart = evaluateWeek(gym({ start: '2026-09-03' }), logOf('2026-09-03'), KW36, '2026-09-07')
    expect(doStart.target).toBe(2)
    expect(doStart.restBudget).toBe(2)
    expect(doStart.states).toEqual(['off', 'off', 'off', 'done', 'rest', 'rest', 'miss'])

    // Beginn Sonntag: Ziel 0
    const soStart = evaluateWeek(gym({ start: '2026-09-06' }), logOf('2026-09-06'), KW36, '2026-09-07')
    expect(soStart.target).toBe(0)
    expect(soStart.states[6]).toBe('done')
  })


  it('behandelt taeglich als Woche ohne Ruhetage', () => {
    const w = evaluateWeek(habit(), logOf('2026-08-31'), KW36, '2026-09-02')
    expect(w.states).toEqual(['done', 'miss', 'open', 'future', 'future', 'future', 'future'])
    expect(w.due).toBe(true)
  })
})

describe('Ruhetage nur mit laufender Serie', () => {
  // Laufen 2x pro Woche ab Mo 7.9. (KW 37), 5 Ruhetage pro Woche
  const laufen = habit({ start: '2026-09-07', rhythm: [{ from: '2026-09-07', perWeek: 2 }] })

  it('schenkt keine Ruhetage, wenn nie gelaufen wird', () => {
    const w = evaluateWeek(laufen, {}, '2026-09-07', '2026-09-21')
    expect(w.states).toEqual(['miss', 'miss', 'miss', 'miss', 'miss', 'miss', 'miss'])
    expect(quoteIn(laufen, {}, '2026-09-07', '2026-09-20', '2026-09-21')).toEqual({ met: 0, due: 14 })
  })

  it('beginnt Ruhetage erst mit dem ersten Lauf nach einer verfehlten Woche', () => {
    // KW 37 nichts, KW 38 Mi + Sa gelaufen
    const log = logOf('2026-09-16', '2026-09-19')
    const w = evaluateWeek(laufen, log, '2026-09-14', '2026-09-21')
    expect(w.states).toEqual(['miss', 'miss', 'done', 'rest', 'rest', 'done', 'rest'])
    expect(w.reached).toBe(true)
    expect(streaks(laufen, log, '2026-09-21').current).toBe(5)
  })

  it('laesst einen einzelnen Lauf die Woche nicht retten', () => {
    // Mo + Di ohne Serie verbrauchen trotzdem ihren Platz im Kontingent
    const w = evaluateWeek(laufen, logOf('2026-09-16'), '2026-09-14', '2026-09-21')
    expect(w.states).toEqual(['miss', 'miss', 'done', 'rest', 'rest', 'rest', 'miss'])
    expect(w.reached).toBe(false)
  })

  it('traegt die Serie ueber den Sonntag in die naechste Woche', () => {
    // KW 38 geschafft (Mi + Sa), KW 39: Montag ist ein Ruhetag
    const w = evaluateWeek(laufen, logOf('2026-09-16', '2026-09-19'), '2026-09-21', '2026-09-23')
    expect(w.states.slice(0, 3)).toEqual(['rest', 'rest', 'open'])
    expect(w.streakAlive).toBe(true)
  })

  it('gibt nach dem Archiv erst wieder Ruhetage, wenn gelaufen wurde', () => {
    const h = { ...laufen, inactive: [{ from: '2026-09-17', to: '2026-09-20' }] }
    const w = evaluateWeek(h, logOf('2026-09-14', '2026-09-15'), '2026-09-21', '2026-09-23')
    expect(w.states.slice(0, 2)).toEqual(['miss', 'miss'])
  })
})

describe('Serie', () => {
  const days = (from: string, to: string) => daysBetween(from, to)

  it('bricht nicht an einem offenen Heute und zaehlt ein erledigtes Heute mit', () => {
    const h = habit()
    const log = logOf('2026-09-28', '2026-09-29')
    expect(streaks(h, log, '2026-09-30').current).toBe(2)
    expect(streaks(h, { ...log, '2026-09-30': 1 }, '2026-09-30').current).toBe(3)
  })

  it('zaehlt Ruhetage mit', () => {
    // Gym seit Mo 21.9.: Mo, Mi, Fr trainiert; heute Mi 30.9., Di trainiert
    const h = gym({ start: '2026-09-21' })
    const log = logOf('2026-09-21', '2026-09-23', '2026-09-25', '2026-09-29')
    expect(streaks(h, log, '2026-09-30').current).toBe(9)
  })

  it('bricht an einem verpassten Tag und merkt sich den Rekord', () => {
    const h = habit({ start: '2026-09-01' })
    const log = logOf(...days('2026-09-01', '2026-09-10'), ...days('2026-09-12', '2026-09-15'))
    const s = streaks(h, log, '2026-09-15')
    expect(s.current).toBe(4)
    expect(s.best).toBe(10)
  })

  it('laeuft ueber Monats- und Jahresgrenzen und die Zeitumstellung', () => {
    const h = habit({ start: '2026-10-20' })
    // Ende der Sommerzeit am 25.10.2026
    expect(streaks(h, logOf(...days('2026-10-20', '2026-11-05')), '2026-11-05').current).toBe(17)
    const neujahr = habit({ start: '2026-12-25' })
    expect(streaks(neujahr, logOf(...days('2026-12-25', '2027-01-05')), '2027-01-05').current).toBe(12)
  })

  it('beginnt nach dem Archiv neu, der Rekord bleibt', () => {
    const h = habit({ start: '2026-09-01', inactive: [{ from: '2026-09-11', to: '2026-09-19' }] })
    const log = logOf(...days('2026-09-01', '2026-09-10'), ...days('2026-09-20', '2026-09-22'))
    const s = streaks(h, log, '2026-09-22')
    expect(s.current).toBe(3)
    expect(s.best).toBe(10)
    expect(inLife(h, '2026-09-15')).toBe(false)
  })
})

describe('Mengen', () => {
  const protein = habit({ kind: 'amount', unit: 'g', goal: [{ from: '2026-06-01', target: 150, dir: 'min' }] })
  const kcal = habit({ kind: 'amount', unit: 'kcal', goal: [{ from: '2026-06-01', target: 2500, dir: 'max' }] })

  it('prueft mindestens und hoechstens', () => {
    expect(meets(protein, 150, '2026-09-30')).toBe(true)
    expect(meets(protein, 149, '2026-09-30')).toBe(false)
    expect(meets(kcal, 2400, '2026-09-30')).toBe(true)
    expect(meets(kcal, 2600, '2026-09-30')).toBe(false)
  })

  it('zaehlt "hoechstens" ohne Wert nicht als erledigt', () => {
    expect(meets(kcal, undefined, '2026-09-30')).toBe(false)
  })

  it('laesst heute unter dem Ziel offen, gestern unter dem Ziel ist verpasst', () => {
    const st = statesBetween(protein, { '2026-09-29': 140, '2026-09-30': 140 }, '2026-09-29', '2026-09-30', '2026-09-30')
    expect(st).toEqual({ '2026-09-29': 'miss', '2026-09-30': 'open' })
  })

  it('nimmt "nicht geschafft" nicht als Wert - auch nicht bei "hoechstens"', () => {
    expect(meets(kcal, NICHT_GESCHAFFT, '2026-09-30')).toBe(false)
    expect(progress(kcal, NICHT_GESCHAFFT, '2026-09-30')).toMatchObject({ share: 0, met: false, over: false })
    const series = amountSeries(protein, { h: { '2026-09-29': NICHT_GESCHAFFT, '2026-09-30': 160 } }, '2026-09-29', '2026-09-30')
    expect(series).toEqual([
      { day: '2026-09-29', value: undefined, met: false },
      { day: '2026-09-30', value: 160, met: true },
    ])
  })
})

describe('Nicht geschafft', () => {
  it('schaltet beim Abhaken weiter: leer, geschafft, nicht geschafft, leer', () => {
    expect(naechsterHaken(undefined)).toBe(1)
    expect(naechsterHaken(1)).toBe(NICHT_GESCHAFFT)
    expect(naechsterHaken(NICHT_GESCHAFFT)).toBeNull()
  })

  it('ist beim Abhaken nicht erledigt und hat keinen Messwert', () => {
    expect(meets(habit(), NICHT_GESCHAFFT, '2026-09-30')).toBe(false)
    expect(messwert(NICHT_GESCHAFFT)).toBeUndefined()
    expect(messwert(0)).toBe(0)
  })

  it('rechnet wie ein leerer Tag: verpasst bzw. Ruhetag, Serie und Quote gleich', () => {
    const leer = logOf(VORHER, '2026-09-03', '2026-09-05')
    const nein: HabitLog = { ...leer, '2026-08-31': NICHT_GESCHAFFT, '2026-09-06': NICHT_GESCHAFFT }
    const a = evaluateWeek(imTritt(), leer, KW36, '2026-09-07')
    const b = evaluateWeek(imTritt(), nein, KW36, '2026-09-07')
    expect(b.states).toEqual(a.states)
    expect(b.states[0]).toBe('rest')
    expect(b.states[6]).toBe('miss')
    expect(streaks(imTritt(), nein, '2026-09-07')).toEqual(streaks(imTritt(), leer, '2026-09-07'))
  })

  it('laesst heute offen', () => {
    const st = statesBetween(habit(), { '2026-09-30': NICHT_GESCHAFFT }, '2026-09-30', '2026-09-30', '2026-09-30')
    expect(st['2026-09-30']).toBe('open')
  })
})

describe('Regeln aendern', () => {
  it('wechselt den Rhythmus ab Montag der Woche', () => {
    const h = habit({
      rhythm: [
        { from: '2026-06-01', perWeek: 7 },
        { from: '2026-09-28', perWeek: 3 },
      ],
    })
    const log = logOf('2026-09-27')
    expect(evaluateWeek(h, log, '2026-09-21', '2026-10-05').states[0]).toBe('miss')
    expect(evaluateWeek(h, log, '2026-09-28', '2026-10-05').states[0]).toBe('rest')
  })

  it('wechselt das Mengenziel ab dem Tag der Aenderung', () => {
    const h = habit({
      kind: 'amount',
      goal: [
        { from: '2026-06-01', target: 150, dir: 'min' },
        { from: '2026-09-30', target: 160, dir: 'min' },
      ],
    })
    expect(meets(h, 155, '2026-09-29')).toBe(true)
    expect(meets(h, 155, '2026-09-30')).toBe(false)
  })

  it('nimmt vor der ersten Regel die erste', () => {
    const rules = [{ from: '2026-06-01', perWeek: 3 }]
    expect(ruleAt(rules, '2026-05-01')).toBe(rules[0])
  })
})

describe('Zaehler und Quoten', () => {
  const today = '2026-09-30'
  const daily = habit({ id: 'd' })
  const weekly = gym({ id: 'w' })
  const log: Log = { d: logOf('2026-09-29'), w: logOf('2026-09-29') }

  it('zaehlt heute nur Faelliges', () => {
    // taeglich offen: faellig. Gym mit freien Ruhetagen: nicht faellig
    expect(todayCount([daily, weekly], log, today)).toEqual({ done: 0, due: 1 })
    const erledigt = { ...log, w: { ...log.w, [today]: 1 } }
    expect(todayCount([daily, weekly], erledigt, today)).toEqual({ done: 1, due: 2 })
  })

  it('ignoriert ein offenes Heute in der Quote', () => {
    const h = habit({ start: '2026-09-28' })
    expect(quoteIn(h, { h: logOf('2026-09-28') }, '2026-09-01', '2026-09-30', today)).toEqual({ met: 1, due: 2 })
  })

  it('zaehlt geschaffte Wochen ohne die laufende', () => {
    const h = gym({ start: '2026-09-14' })
    const l: Log = { h: logOf('2026-09-14', '2026-09-16', '2026-09-18', '2026-09-22') }
    // KW 38 geschafft, KW 39 nur ein Training
    expect(weeksDone(h, l, today)).toEqual({ done: 1, total: 2 })
  })

  it('findet perfekte Tage und schwache Wochentage', () => {
    const a = habit({ id: 'a', start: '2026-09-21' })
    const b = habit({ id: 'b', start: '2026-09-21' })
    const l: Log = {
      a: logOf(...daysBetween('2026-09-21', '2026-09-27')),
      b: logOf('2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-27'),
    }
    const scores = dayScores([a, b], l, '2026-09-21', '2026-09-27', '2026-09-28')
    expect(perfectDays(scores)).toEqual({ perfect: 6, days: 7 })
    expect(weekdayQuotes(scores)[5]).toBe(0.5) // Samstag
  })
})

describe('Beginn', () => {
  it('ist vor dem Beginn inaktiv', () => {
    const h = habit({ start: '2026-09-30' })
    expect(statesBetween(h, {}, addDays('2026-09-30', -2), '2026-09-30', '2026-09-30')).toEqual({
      '2026-09-28': 'off',
      '2026-09-29': 'off',
      '2026-09-30': 'open',
    })
  })
})
