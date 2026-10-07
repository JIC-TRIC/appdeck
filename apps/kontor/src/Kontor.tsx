import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
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
import { entryLook } from './views/EntryRow'
import {
  deleteEntry,
  firstEntryDate,
  getAccounts,
  getCategories,
  getEntries,
  getSettings,
  isOnboarded,
  restoreEntry,
  updateSettings,
} from './kontorStore'
import { formatCent, todayKey } from './util'
import { stapelLesen, stapelSchreiben } from './entwurf'
import { betragOderMaske, diskretAus, DiskretContext } from './diskret'
import type { Account, Category, Entry, KontorCtx, Period, View, ViewName, ViewProps } from './types'

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
// Ebene ueber apps/. Wer Kontor bewusst verlaesst, soll beim naechsten Oeffnen
// auf der Startseite landen, nicht in der Ansicht von eben.
function toLauncher() {
  stapelSchreiben([])
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

// Seitenwechsel wie auf dem iPhone: lib/PageStage.tsx (mit Zurueckwischen).
// Der Schluessel haengt an der Lage im Stapel, damit React dieselbe Seite
// waehrend des Wechsels nicht neu aufbaut.
function seitenKey(v: View, i: number) {
  return `${i}:${v.name}:${v.entryId ?? v.accountId ?? v.categoryId ?? v.segment?.id ?? v.type ?? ''}`
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

  // "Beim Öffnen verbergen": einmal vor dem ersten Zeichnen ...
  useState(() => {
    const s = getSettings()
    if (s.diskretBeimStart && !s.diskret) updateSettings({ diskret: true })
  })
  // ... und jedes Mal, wenn Kontor in den Hintergrund geht. iOS holt eine
  // Web-App oft ohne Neuladen zurueck - dann stuende sonst noch alles offen da.
  useEffect(() => {
    const weg = () => {
      if (document.visibilityState !== 'hidden') return
      const s = getSettings()
      if (s.diskretBeimStart && !s.diskret) {
        updateSettings({ diskret: true })
        refresh()
      }
    }
    document.addEventListener('visibilitychange', weg)
    return () => document.removeEventListener('visibilitychange', weg)
  }, [refresh])

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

  // Ansichtsstapel statt Tab-Leiste, an der Browser-History, damit die
  // Zurueck-Taste des Handys funktioniert (lib/useHistoryStack).
  //
  // Nach einem Neustart kommt der zuletzt offene Stapel zurueck (entwurf.ts) -
  // ohne Ansichten, deren Buchung oder Konto es inzwischen nicht mehr gibt.
  const { stack, setStack, push, replace, back } = useHistoryStack<View>(() => {
    const entries = getEntries()
    const accounts = getAccounts()
    const categories = getCategories()
    return stapelLesen().filter((v) => {
      if (v.entryId) return entries.some((e) => e.id === v.entryId)
      if (v.accountId) return accounts.some((a) => a.id === v.accountId)
      if (v.categoryId) return categories.some((c) => c.id === v.categoryId)
      return true
    })
  })

  useEffect(() => {
    stapelSchreiben(stack)
  }, [stack])

  const unterlegen = useCallback((view: View) => {
    setStack((s) => {
      const top = s[s.length - 1]
      return top?.sheet ? [...s.slice(0, -1), view, top] : [...s, view]
    })
  }, [])

  const blattWeg = useCallback(() => {
    setStack((s) => (s[s.length - 1]?.sheet ? s.slice(0, -1) : s))
  }, [])

  // Meldungen leben hier und nicht in der Ansicht, die sie ausloest: nach dem
  // Loeschen schliesst das Formular sofort, die Meldung mit "Rueckgaengig"
  // muss aber stehen bleiben. Es gibt immer nur eine - eine neue ersetzt die alte.
  const [presentToast, dismissToast] = useIonToast()
  const notify = useCallback(
    (message: string, undo?: () => void, options?: { hoch?: boolean }) => {
      dismissToast().catch(() => {})
      presentToast({
        message,
        // Nach dem Speichern nur eine Bestaetigung (kuerzer, sie liegt ueber
        // der Gesamtbalance), nach dem Loeschen mehr Zeit fuers Zuruecknehmen.
        duration: !undo ? 2000 : options?.hoch ? 3500 : 5000,
        position: 'bottom',
        cssClass: options?.hoch ? 'k-toast hoch' : 'k-toast',
        swipeGesture: 'vertical',
        buttons: undo
          ? [{ text: 'Rückgängig', handler: () => { undo(); refresh() } }]
          : [],
      })
    },
    [presentToast, dismissToast, refresh],
  )

  // Loeschen ist sofort und ohne Rueckfrage - dafuer laesst es sich ein paar
  // Sekunden lang zuruecknehmen. Eine Rueckfrage bei jedem Wisch waere laestig,
  // ein Versehen ohne Ausweg aergerlich.
  const diskret = useMemo(() => diskretAus(data.settings), [data.settings])
  const setDiskret = useCallback(
    (an: boolean) => {
      updateSettings({ diskret: an })
      refresh()
    },
    [refresh],
  )

  const removeEntry = useCallback(
    (entry: Entry) => {
      const look = entryLook(entry, data.catById, data.accById)
      deleteEntry(entry.id)
      refresh()
      const betrag = betragOderMaske(diskret, entry.amountCent, formatCent(entry.amountCent), true)
      notify(`Gelöscht: ${look.title}, ${betrag} €`, () => restoreEntry(entry))
    },
    [data, diskret, refresh, notify],
  )

  const ctx: KontorCtx = {
    ...data,
    period,
    setPeriod,
    push,
    replace,
    unterlegen,
    blattWeg,
    back,
    refresh,
    onExit: toLauncher,
    notify,
    removeEntry,
    diskret,
    setDiskret,
  }

  // ---------- Seiten und Blatt ----------
  const top = stack[stack.length - 1]
  const topIsSheet = !!top?.sheet
  const seiten = stack.filter((v) => !v.sheet)

  if (!data.ready) {
    return (
      <div className="kontor">
        <Onboarding ctx={ctx} />
      </div>
    )
  }

  const SheetComponent = topIsSheet ? SHEETS[top.name] : null

  const seite = (view: View | null) => {
    const Page = view ? PAGES[view.name] : null
    if (!view || !Page) return <Main ctx={ctx} />
    return <Page ctx={ctx} view={view.name === 'transfer' ? { ...view, type: 'transfer' } : view} />
  }

  return (
    <DiskretContext.Provider value={diskret}>
      <div className={`kontor${diskret.an ? ' diskret' : ''}`}>
        <PageStage
          className="k-buehne"
          pages={seiten}
          rootKey="start"
          pageKey={seitenKey}
          render={seite}
          onBack={back}
          swipe={!topIsSheet}
        />
        {SheetComponent ? <SheetComponent ctx={ctx} view={top} /> : null}
      </div>
    </DiskretContext.Provider>
  )
}

export default Kontor
