import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import Main from './views/Main'
import EntryForm from './views/EntryForm'
import EntryList from './views/EntryList'
import CategoryDetail from './views/CategoryDetail'
import Categories from './views/Categories'
import CategoryForm from './views/CategoryForm'
import Accounts from './views/Accounts'
import AccountDetail from './views/AccountDetail'
import AccountForm from './views/AccountForm'
import BalanceSheet from './views/BalanceSheet'
import Stats from './views/Stats'
import Settings from './views/Settings'
import About from './views/About'
import Onboarding from './views/Onboarding'
import { MenuSheet, PeriodSheet } from './views/Sheets'
import {
  firstEntryDate,
  getAccounts,
  getCategories,
  getEntries,
  getSettings,
  isOnboarded,
  updateSettings,
} from './kontorStore'
import { todayKey } from './util'
import type { Account, Category, KontorCtx, Period, View, ViewName, ViewProps } from './types'

const PAGES: Partial<Record<ViewName, ComponentType<ViewProps>>> = {
  entries: EntryList,
  entry: EntryForm,
  transfer: EntryForm,
  categoryDetail: CategoryDetail,
  categories: Categories,
  categoryForm: CategoryForm,
  accounts: Accounts,
  accountDetail: AccountDetail,
  accountForm: AccountForm,
  stats: Stats,
  settings: Settings,
  about: About,
}

const SHEETS: Partial<Record<ViewName, ComponentType<ViewProps>>> = {
  period: PeriodSheet,
  menu: MenuSheet,
  balance: BalanceSheet,
}

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) einfach eine
// Ebene ueber apps/.
function toLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

// Seite und Hintergrund muessen nicht mehr von Hand gesperrt werden: Ionic
// fixiert den body selbst, gescrollt wird nur in den Bereichen, die es sollen
// (Listen, Kategorienraster). Die helle Flaeche setzt Kontor.css.
function Kontor() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Store gelesen. Bei dieser Datenmenge ist das billiger als eine
  // zweite Wahrheit im Speicher.
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const data = useMemo(() => {
    const settings = getSettings()
    const accounts = getAccounts()
    const categories = getCategories()
    const entries = getEntries()
    const accById: Record<string, Account> = {}
    for (const a of accounts) accById[a.id] = a
    const catById: Record<string, Category> = {}
    for (const c of categories) catById[c.id] = c
    return {
      settings,
      accounts,
      categories,
      entries,
      accById,
      catById,
      firstKey: firstEntryDate(entries),
      ready: isOnboarded(),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const [period, setPeriodState] = useState<Period>(() => ({
    kind: getSettings().lastPeriod ?? 'month',
    anchor: todayKey(),
  }))

  // Die Zeitraumart ueberlebt den Neustart - sie ist eine Arbeitsweise, keine
  // Einstellung, die man erst suchen sollte.
  const setPeriod = useCallback((next: Period | ((cur: Period) => Period)) => {
    setPeriodState((cur) => {
      const wert = typeof next === 'function' ? next(cur) : next
      if (wert.kind !== cur.kind) updateSettings({ lastPeriod: wert.kind })
      return wert
    })
  }, [])

  // Ansichtsstapel statt Tab-Leiste. Jeder Aufruf haengt einen Eintrag in die
  // Browser-History, damit die Zurueck-Taste des Handys funktioniert - der
  // Pfad bleibt dabei gleich.
  const [stack, setStack] = useState<View[]>([])
  const depth = useRef(0)

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
    window.history.pushState({ kontor: depth.current + 1 }, '')
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

  const ctx: KontorCtx = { ...data, period, setPeriod, push, replace, back, refresh, onExit: toLauncher }

  if (!data.ready) {
    return (
      <div className="kontor">
        <Onboarding ctx={ctx} />
      </div>
    )
  }

  const top = stack[stack.length - 1]
  const topIsSheet = !!top?.sheet
  const pageView = topIsSheet ? [...stack].reverse().find((v) => !v.sheet) : top

  const PageComponent = pageView ? PAGES[pageView.name] : null
  const SheetComponent = topIsSheet ? SHEETS[top.name] : null

  return (
    <div className="kontor">
      {PageComponent && pageView ? (
        <PageComponent
          ctx={ctx}
          view={pageView.name === 'transfer' ? { ...pageView, type: 'transfer' } : pageView}
        />
      ) : (
        <Main ctx={ctx} />
      )}
      {SheetComponent ? <SheetComponent ctx={ctx} view={top} /> : null}
    </div>
  )
}

export default Kontor
