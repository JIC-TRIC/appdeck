import { useMemo, useState } from 'react'
import {
  amountSeries,
  hakenAm,
  isArchived,
  isWeekly,
  messwert,
  progress,
  quoteIn,
  share,
  statesBetween,
  streaks,
  weekOf,
  weeksDone,
} from '../calc'
import { AmountChart, Heatmap, MonthCalendar, ShareBars } from '../charts'
import { IconLeft, IconRight } from '../icons'
import { Card, Dot, Screen, TextButton, hue, ruleLong } from '../ui'
import { colorOf } from '../data'
import { deleteHabit, restoreHabit } from '../store'
import {
  MONTHS,
  WEEKDAYS_SHORT,
  addDays,
  diffDays,
  formatDate,
  formatPercent,
  formatValue,
  isoWeek,
  maxKey,
  mondayOf,
  monthShort,
  parseKey,
} from '../util'
import { NICHT_GESCHAFFT, type DayState, type Habit, type ViewProps } from '../types'

const firstOfMonth = (key: string) => `${key.slice(0, 7)}-01`

function shiftMonth(first: string, n: number) {
  const d = parseKey(first)
  const m = new Date(d.getFullYear(), d.getMonth() + n, 1)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}-01`
}

function lastOfMonth(first: string) {
  return addDays(shiftMonth(first, 1), -1)
}

// Letzter aktiver Tag: heute, oder bei einer archivierten Gewohnheit der
// Archivtag (der inaktive Zeitraum beginnt am Tag danach).
function lastDay(h: Habit, today: string) {
  if (!isArchived(h)) return today
  const from = h.inactive[h.inactive.length - 1].from
  return from <= today ? addDays(from, -1) : today
}

function Detail({ ctx, view }: ViewProps) {
  const { byId, log, today, push, back, enter, refresh, notify } = ctx
  const habit = view.habitId ? byId[view.habitId] : undefined
  // Archiviert: alles rechnet bis zum Archivtag, nicht bis heute - sonst
  // stuenden dort "100 % in den letzten 30 Tagen" und ein leerer Kalender.
  const end = habit ? lastDay(habit, today) : today
  const [month, setMonth] = useState(() => firstOfMonth(end))
  const [armed, setArmed] = useState(false)

  const facts = useMemo(() => {
    if (!habit) return null
    const hlog = log[habit.id]
    const s = { current: streaks(habit, hlog, end).current, best: streaks(habit, hlog, today).best }
    const q30 = quoteIn(habit, log, addDays(end, -29), end, today)
    const qAll = quoteIn(habit, log, habit.start, end, today)
    // Ein Balken pro Monat seit Beginn, hoechstens sechs.
    const months: { label: string; share: number | null }[] = []
    for (let i = 5; i >= 0; i -= 1) {
      const first = shiftMonth(firstOfMonth(end), -i)
      if (lastOfMonth(first) < habit.start) continue
      months.push({ label: monthShort(parseKey(first).getMonth()), share: share(quoteIn(habit, log, first, lastOfMonth(first), today)) })
    }
    const hmTo = addDays(mondayOf(end), 6)
    const hmFrom = maxKey(mondayOf(habit.start), addDays(mondayOf(end), -52 * 7))
    return {
      s,
      q30,
      qAll,
      months,
      weekly: isWeekly(habit, today),
      week: weekOf(habit, log, today, today),
      weeks: weeksDone(habit, log, today),
      hmFrom,
      hmTo,
      hmStates: statesBetween(habit, hlog, hmFrom, hmTo, today),
      series: habit.kind === 'amount' ? amountSeries(habit, log, addDays(end, -29), end) : [],
    }
  }, [habit, log, today, end])

  if (!habit || !facts) return null

  const archived = isArchived(habit)
  const color = colorOf(habit.color)
  const hlog = log[habit.id]
  const { s, week } = facts
  const monthStates = statesBetween(habit, hlog, month, lastOfMonth(month), today)
  const canPrev = lastOfMonth(shiftMonth(month, -1)) >= habit.start
  const canNext = month < firstOfMonth(end)
  const archivedSince = archived ? addDays(habit.inactive[habit.inactive.length - 1].from, -1) : null

  const onDay = (day: string, state: DayState) => {
    if (state === 'off' || state === 'future') return
    if (habit.kind === 'amount') push({ name: 'amount', sheet: true, habitId: habit.id, day })
    else enter(habit, day, hakenAm(habit, hlog, day, today))
  }

  const heuteNein = hlog?.[today] === NICHT_GESCHAFFT
  const todayValue = messwert(hlog?.[today])
  const p = progress(habit, todayValue, today)

  // Mengen: Durchschnitt der eingetragenen Tage und der beste Tag (bei
  // "hoechstens" der niedrigste).
  const entered = facts.series.filter((x) => x.value !== undefined).map((x) => x.value as number)
  const avg = entered.length ? entered.reduce((a, b) => a + b, 0) / entered.length : null
  const goalDir = habit.goal[habit.goal.length - 1]?.dir ?? 'min'
  const best = entered.length ? (goalDir === 'max' ? Math.min(...entered) : Math.max(...entered)) : null

  const restore = () => {
    restoreHabit(habit.id, today)
    refresh()
    notify(`${habit.name} ist zurück – die Serie beginnt neu`)
  }

  const remove = () => {
    if (!armed) {
      setArmed(true)
      return
    }
    deleteHabit(habit.id)
    back()
    refresh()
    notify(`Gelöscht: ${habit.name}`)
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(week.monday, i))
  const needed = Math.max(0, week.target - week.done)

  return (
    <Screen
      title={habit.name}
      color={color}
      onBack={back}
      right={archived ? null : <TextButton onClick={() => push({ name: 'habitForm', habitId: habit.id })}>Bearbeiten</TextButton>}
      className="s-detail"
    >
      <div className="s-detail-body" style={hue(habit)}>
        {archived && archivedSince ? (
          <div className="s-banner">
            <span>Archiviert am {formatDate(archivedSince)}</span>
            <button type="button" className="s-btn small" onClick={restore}>
              Wiederherstellen
            </button>
          </div>
        ) : null}

        <div className="s-hero">
          <div>
            <div className="big">{s.current}</div>
            <div className="lbl">
              {s.current === 1 ? 'Tag in Folge' : 'Tage in Folge'}
              {archived ? ' bis zum Archiv' : ''}
            </div>
          </div>
          <div className="rec">
            <small>Rekord</small>
            <b>{s.best}</b>
          </div>
        </div>
        <div className="s-rule">
          {ruleLong(habit, today)} · seit {formatDate(habit.start)}
        </div>

        {facts.weekly && !archived ? (
          <Card title="Diese Woche" aside={`KW ${isoWeek(today)}`}>
            <div className="s-wk">
              {weekDays.map((d, i) => (
                <Dot key={d} state={week.states[i]} eintrag={hlog?.[d]} />
              ))}
              {weekDays.map((d, i) => (
                <small key={`l${d}`} className={d === today ? 'now' : undefined}>
                  {WEEKDAYS_SHORT[i]}
                </small>
              ))}
            </div>
            <p className="s-cap">
              <b>
                {week.done} von {week.target}
              </b>
              {needed === 0
                ? ' · Wochenziel erreicht'
                : !week.streakAlive && week.states[weekDays.indexOf(today)] !== 'done'
                  ? // Keine Serie: freie Tage zaehlen als verpasst, bis wieder etwas eingetragen ist.
                    ' · keine Ruhetage'
                  : ` · noch ${week.restLeft} ${week.restLeft === 1 ? 'Ruhetag' : 'Ruhetage'}${week.due ? ' · heute nötig' : ''}`}
            </p>
          </Card>
        ) : null}

        {habit.kind === 'amount' && !archived ? (
          <Card title="Heute">
            <div className="s-today-amt">
              <b>{todayValue !== undefined ? formatValue(todayValue) : '–'}</b>
              <span>{habit.unit}</span>
              <em>
                {heuteNein
                  ? 'nicht geschafft'
                  : todayValue === undefined
                  ? 'noch nichts eingetragen'
                  : p.met
                    ? 'Ziel erreicht'
                    : p.over
                      ? 'über dem Ziel'
                      : `noch ${formatValue(p.rest)} ${habit.unit}`}
              </em>
            </div>
            <div className="s-prog">
              <i style={{ width: `${(p.over ? 1 : p.share) * 100}%` }} className={p.over ? 'over' : ''} />
            </div>
            <button type="button" className="s-btn block" onClick={() => push({ name: 'amount', sheet: true, habitId: habit.id, day: today })}>
              Eintragen
            </button>
          </Card>
        ) : null}

        {habit.kind === 'amount' ? (
          <Card title="Werteverlauf" aside="letzte 30 Tage">
            <AmountChart habit={habit} points={facts.series} today={today} />
            <div className="s-chart-legend">
              <span>
                Ø <b>{avg === null ? '–' : `${formatValue(avg)} ${habit.unit}`}</b>
              </span>
              <span>
                bester Tag <b>{best === null ? '–' : `${formatValue(best)} ${habit.unit}`}</b>
              </span>
            </div>
          </Card>
        ) : null}

        <Card title="Erfolgsquote">
          <div className="s-q3">
            <div>
              <b>{share(facts.q30) === null ? '–' : formatPercent(share(facts.q30)!)}</b>
              <small>letzte 30 Tage</small>
            </div>
            <div>
              <b>{share(facts.qAll) === null ? '–' : formatPercent(share(facts.qAll)!)}</b>
              <small>seit Beginn</small>
            </div>
            {facts.weekly ? (
              <div>
                <b>
                  {facts.weeks.done}/{facts.weeks.total}
                </b>
                <small>Wochen geschafft</small>
              </div>
            ) : (
              <div>
                <b>{facts.qAll.met}</b>
                <small>{facts.qAll.met === 1 ? 'Tag erfüllt' : 'Tage erfüllt'}</small>
              </div>
            )}
          </div>
          {facts.months.length > 1 ? <ShareBars items={facts.months} height={64} /> : null}
        </Card>

        <Card
          title={`${MONTHS[parseKey(month).getMonth()]} ${parseKey(month).getFullYear()}`}
          aside={
            <span className="s-arrows">
              <button type="button" className="s-ib small plain" disabled={!canPrev} onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Monat zurück">
                <IconLeft />
              </button>
              <button type="button" className="s-ib small plain" disabled={!canNext} onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Monat vor">
                <IconRight />
              </button>
            </span>
          }
        >
          <MonthCalendar habit={habit} first={month} states={monthStates} values={hlog} onDay={archived ? undefined : onDay} />
        </Card>

        <Card title="Seit Beginn" aside={`${(diffDays(facts.hmFrom, facts.hmTo) + 1) / 7} Wochen`}>
          <Heatmap from={facts.hmFrom} to={facts.hmTo} states={facts.hmStates} />
        </Card>

        {archived ? (
          <button type="button" className={`s-btn block danger${armed ? ' armed' : ''}`} onClick={remove}>
            {armed ? 'Wirklich endgültig löschen? Tippen bestätigt' : 'Endgültig löschen'}
          </button>
        ) : null}
      </div>
    </Screen>
  )
}

export default Detail
