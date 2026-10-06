import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useIonToast } from '@ionic/react'
import Main from './views/Main'
import Detail from './views/Detail'
import HabitForm from './views/HabitForm'
import Stats from './views/Stats'
import Archive from './views/Archive'
import Reorder from './views/Reorder'
import Settings from './views/Settings'
import Rules from './views/Rules'
import Onboarding from './views/Onboarding'
import AmountSheet from './views/AmountSheet'
import { DayStartSheet, MenuSheet } from './views/Sheets'
import { getHabits, getLog, getSettings, setValue } from './store'
import { stapelLesen, stapelSchreiben } from './entwurf'
import { formatDayShort, logicalToday } from './util'
import { NICHT_GESCHAFFT, type Habit, type SteadyCtx, type View, type ViewName, type ViewProps } from './types'

const PAGES: Partial<Record<ViewName, ComponentType<ViewProps>>> = {
  detail: Detail,
  habitForm: HabitForm,
  stats: Stats,
  archive: Archive,
  reorder: Reorder,
  settings: Settings,
  rules: Rules,
}

const SHEETS: Partial<Record<ViewName, ComponentType<ViewProps>>> = {
  menu: MenuSheet,
  amount: AmountSheet,
  dayStart: DayStartSheet,
}

// Zurueck zum Launcher. Wer Steady bewusst verlaesst, landet beim naechsten
// Oeffnen im Raster, nicht in der Ansicht von eben.
function toLauncher() {
  stapelSchreiben([])
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

function Steady() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie Kontor). Bei dieser Datenmenge billiger als
  // eine zweite Wahrheit im Speicher.
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const data = useMemo(() => {
    const habits = [...getHabits()].sort((a, b) => a.order - b.order)
    const byId: Record<string, Habit> = {}
    for (const h of habits) byId[h.id] = h
    return { habits, byId, log: getLog(), settings: getSettings() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  // Der logische Tag. Bleibt die App ueber den Tageswechsel offen oder kommt
  // am naechsten Morgen aus dem Hintergrund, muss "heute" nachziehen.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const wach = () => setNow(Date.now())
    const id = window.setInterval(wach, 60_000)
    document.addEventListener('visibilitychange', wach)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', wach)
    }
  }, [])
  const today = logicalToday(new Date(now), data.settings.dayStart)

  // Ansichtsstapel statt Tab-Leiste, an der Browser-History (Zurueck-Geste).
  // Nach einem Neustart kommt der zuletzt offene Stapel zurueck - ohne
  // Ansichten, deren Gewohnheit es nicht mehr gibt.
  const [stack, setStack] = useState<View[]>(() => {
    const ids = new Set(getHabits().map((h) => h.id))
    return stapelLesen().filter((v) => !v.habitId || ids.has(v.habitId))
  })
  const depth = useRef(0)

  const wiederhergestellt = useRef(false)
  useEffect(() => {
    if (wiederhergestellt.current) return
    wiederhergestellt.current = true
    for (let i = 0; i < stack.length; i += 1) window.history.pushState({ steady: i + 1 }, '')
    depth.current = stack.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    stapelSchreiben(stack)
  }, [stack])

  useEffect(() => {
    const onPop = () => {
      setStack((s) => {
        if (!s.length) return s
        depth.current = Math.max(0, depth.current - 1)
        return s.slice(0, -1)
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((view: View) => {
    window.history.pushState({ steady: depth.current + 1 }, '')
    depth.current += 1
    setStack((s) => [...s, view])
  }, [])

  const replace = useCallback((view: View) => {
    setStack((s) => (s.length ? [...s.slice(0, -1), view] : [view]))
  }, [])

  const back = useCallback(() => {
    if (depth.current > 0) window.history.back()
    else setStack([])
  }, [])

  // Meldungen leben hier und nicht in der Ansicht, die sie ausloest: das
  // Blatt schliesst sofort, die Meldung mit "Rückgängig" bleibt stehen.
  const [presentToast, dismissToast] = useIonToast()
  const notify = useCallback(
    (message: string, undo?: () => void) => {
      dismissToast().catch(() => {})
      presentToast({
        message,
        duration: undo ? 4000 : 2000,
        position: 'bottom',
        cssClass: 's-toast',
        swipeGesture: 'vertical',
        buttons: undo ? [{ text: 'Rückgängig', handler: () => { undo(); refresh() } }] : [],
      })
    },
    [presentToast, dismissToast, refresh],
  )

  const [lastChange, setLastChange] = useState<SteadyCtx['lastChange']>(null)

  // Jede Eingabe laeuft hier durch. Fuer heute genuegt der Punkt selbst als
  // Rueckmeldung; wer einen vergangenen Tag aendert, bekommt eine Meldung mit
  // Rückgängig - ein versehentlicher Tipp im Raster soll nichts kaputt machen.
  const enter = useCallback(
    (habit: Habit, day: string, value: number | null) => {
      const before = getLog()[habit.id]?.[day]
      setValue(habit.id, day, value)
      setLastChange((c) => ({ habitId: habit.id, day, n: (c?.n ?? 0) + 1 }))
      refresh()
      if (day < today) {
        const was =
          value === null
            ? 'entfernt'
            : value === NICHT_GESCHAFFT
              ? 'nicht geschafft'
              : habit.kind === 'check'
                ? 'geschafft'
                : 'eingetragen'
        notify(`${habit.name} · ${formatDayShort(day)} ${was}`, () => setValue(habit.id, day, before ?? null))
      }
    },
    [refresh, notify, today],
  )

  const ctx: SteadyCtx = {
    ...data,
    today,
    push,
    replace,
    back,
    refresh,
    onExit: toLauncher,
    notify,
    enter,
    lastChange,
  }

  const top = stack[stack.length - 1]
  const topIsSheet = !!top?.sheet
  const pageView = topIsSheet ? [...stack].reverse().find((v) => !v.sheet) : top
  const PageComponent = pageView ? PAGES[pageView.name] : null
  const SheetComponent = topIsSheet ? SHEETS[top.name] : null

  return (
    <div className="steady">
      {PageComponent && pageView ? (
        <PageComponent ctx={ctx} view={pageView} />
      ) : data.habits.length ? (
        <Main ctx={ctx} />
      ) : (
        <Onboarding ctx={ctx} />
      )}
      {SheetComponent ? <SheetComponent ctx={ctx} view={top} key={stack.length} /> : null}
    </div>
  )
}

export default Steady
