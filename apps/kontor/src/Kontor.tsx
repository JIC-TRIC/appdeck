import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { useIonToast } from '@ionic/react'
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

// ---------- Seitenwechsel ----------
//
// Wie auf dem iPhone: eine neue Seite faehrt von rechts herein, die alte
// rueckt ein Stueck nach links und dunkelt ab; zurueck laeuft es umgekehrt.
// Vom linken Rand laesst sich die Seite mit dem Finger zurueckwischen.
// Waehrend eines Wechsels stehen darum zwei Ebenen uebereinander - danach
// ist wieder nur die oberste eingehaengt.

// Eine Ebene: eine Seite aus dem Stapel oder die Startseite (view null).
// Der Schluessel haengt an ihrer Lage im Stapel, damit React dieselbe Seite
// waehrend des Wechsels nicht neu aufbaut.
interface Ebene {
  key: string
  view: View | null
}

interface Fahrt {
  art: 'vor' | 'zurueck'
  alt: Ebene
  /** Wie weit der Finger die Seite schon gezogen hatte (px). */
  ab: number
}

// Ab hier am linken Rand beginnt ein Zurueckwischen.
const RAND_PX = 24
// So weit (Anteil der Breite) oder so schnell, dann geht es zurueck.
const ZURUECK_AB = 0.35
const ZURUECK_TEMPO = 0.5
// So weit rueckt die Seite darunter nach links (wie iOS).
const VERSATZ = 28

function seitenKey(v: View, i: number) {
  return `${i}:${v.name}:${v.entryId ?? v.accountId ?? v.categoryId ?? v.segment?.id ?? v.type ?? ''}`
}

const ruhig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Die gehende Seite bleibt stehen, wie sie zuletzt aussah: nach Speichern
// oder Loeschen aendern sich die Daten im selben Moment - ohne das saehe man
// beim Hinausgleiten kurz ein umspringendes Formular.
const Standbild = memo(
  function Standbild({ children }: { still: boolean; children: ReactNode }) {
    return <>{children}</>
  },
  (_vorher, jetzt) => jetzt.still,
)

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
  //
  // Nach einem Neustart kommt der zuletzt offene Stapel zurueck (entwurf.ts) -
  // ohne Ansichten, deren Buchung oder Konto es inzwischen nicht mehr gibt.
  const [stack, setStack] = useState<View[]>(() => {
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
  const depth = useRef(0)

  // Fuer jeden wiederhergestellten Eintrag einen History-Eintrag - sonst
  // fuehrt "Zurueck" nicht Schritt fuer Schritt, sondern gleich zur Startseite.
  // Die Ref verhindert, dass React im StrictMode das doppelt macht.
  const wiederhergestellt = useRef(false)
  useEffect(() => {
    if (wiederhergestellt.current) return
    wiederhergestellt.current = true
    for (let i = 0; i < stack.length; i += 1) window.history.pushState({ kontor: i + 1 }, '')
    depth.current = stack.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    stapelSchreiben(stack)
  }, [stack])

  // Zurueck nimmt die Seite sofort vom Stapel (siehe back) - das folgende
  // popstate gehoert dazu und wird uebersprungen.
  const popIgnorieren = useRef(0)

  useEffect(() => {
    const onPop = () => {
      if (popIgnorieren.current > 0) {
        popIgnorieren.current -= 1
        return
      }
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

  // Sofort vom Stapel statt erst auf popstate zu warten: so wechselt die Seite
  // im selben Moment, in dem sich nach Speichern oder Loeschen die Daten
  // aendern - und die hinausgleitende Seite zeigt noch ihren letzten Stand,
  // statt kurz als leeres Formular aufzuflackern.
  const back = useCallback(() => {
    if (depth.current > 0) {
      depth.current -= 1
      popIgnorieren.current += 1
      setStack((s) => s.slice(0, -1))
      window.history.back()
    } else setStack([])
  }, [])

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
  const removeEntry = useCallback(
    (entry: Entry) => {
      const look = entryLook(entry, data.catById, data.accById)
      deleteEntry(entry.id)
      refresh()
      notify(`Gelöscht: ${look.title}, ${formatCent(entry.amountCent)} €`, () => restoreEntry(entry))
    },
    [data, refresh, notify],
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
  }

  // ---------- Ebenen fuer den Seitenwechsel ----------
  const top = stack[stack.length - 1]
  const topIsSheet = !!top?.sheet
  const seiten = stack.filter((v) => !v.sheet)
  const ebeneAn = (i: number): Ebene =>
    i < 0 ? { key: 'start', view: null } : { key: seitenKey(seiten[i], i), view: seiten[i] }
  const oben = ebeneAn(seiten.length - 1)
  const drunter = seiten.length ? ebeneAn(seiten.length - 2) : null

  const [fahrt, setFahrt] = useState<Fahrt | null>(null)
  const [ziehen, setZiehen] = useState(false)
  const buehne = useRef<HTMLDivElement>(null)
  const obenRef = useRef<HTMLDivElement>(null)
  const drunterRef = useRef<HTMLDivElement>(null)
  const zug = useRef<{ x: number; y: number; dx: number; quer: boolean; lastX: number; lastT: number; v: number } | null>(null)
  // Wie weit die Seite beim Loslassen schon gezogen war.
  const zugWeg = useRef(0)

  // Wechselt die oberste Seite, beginnt die Fahrt - noch in diesem Render,
  // damit die alte Seite gar nicht erst ausgehaengt wird.
  const [zuletzt, setZuletzt] = useState({ key: oben.key, ebene: oben, tiefe: seiten.length })
  if (zuletzt.key !== oben.key) {
    setZuletzt({ key: oben.key, ebene: oben, tiefe: seiten.length })
    setFahrt(
      ruhig() || !data.ready
        ? null
        : { art: seiten.length < zuletzt.tiefe ? 'zurueck' : 'vor', alt: zuletzt.ebene, ab: zugWeg.current },
    )
    zugWeg.current = 0
    if (ziehen) setZiehen(false)
  }

  // Was der Finger direkt an die Elemente geschrieben hat, muss weg, sobald
  // die Animation uebernimmt - sonst stuende die Seite danach wieder dort.
  useLayoutEffect(() => {
    if (ziehen) return
    buehne.current?.querySelectorAll<HTMLElement>('.k-ebene').forEach((el) => {
      el.style.transform = ''
      el.style.removeProperty('--dunkel')
    })
  }, [fahrt, ziehen])

  // ---------- Zurueckwischen vom linken Rand ----------
  const onZugStart = (e: TouchEvent) => {
    if (!seiten.length || fahrt || topIsSheet) return
    const t = e.touches[0]
    if (t.clientX > RAND_PX) return
    zug.current = { x: t.clientX, y: t.clientY, dx: 0, quer: false, lastX: t.clientX, lastT: performance.now(), v: 0 }
  }

  const onZugMove = (e: TouchEvent) => {
    const z = zug.current
    if (!z) return
    const t = e.touches[0]
    const dx = t.clientX - z.x
    const dy = t.clientY - z.y
    if (!z.quer) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      // Senkrecht oder nach links gemeint - das gehoert dem Inhalt.
      if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
        zug.current = null
        return
      }
      z.quer = true
      setZiehen(true)
    }
    const now = performance.now()
    z.v = 0.7 * ((t.clientX - z.lastX) / Math.max(1, now - z.lastT)) + 0.3 * z.v
    z.lastX = t.clientX
    z.lastT = now
    z.dx = Math.max(0, dx)
    const breite = buehne.current?.clientWidth || 390
    const p = Math.min(1, z.dx / breite)
    if (obenRef.current) obenRef.current.style.transform = `translateX(${z.dx}px)`
    if (drunterRef.current) {
      drunterRef.current.style.transform = `translateX(${-VERSATZ + VERSATZ * p}%)`
      drunterRef.current.style.setProperty('--dunkel', String(1 - p))
    }
  }

  const onZugEnde = () => {
    const z = zug.current
    zug.current = null
    if (!z?.quer) return
    const breite = buehne.current?.clientWidth || 390
    const schnell = performance.now() - z.lastT < 100 && z.v > ZURUECK_TEMPO && z.dx > 30
    if (z.dx > breite * ZURUECK_AB || schnell) {
      zugWeg.current = z.dx
      back()
      return
    }
    // Nicht weit genug: zurueckfedern, dann die Seite darunter wieder weg.
    const dauer = ruhig() ? 0 : 220
    const federn = { duration: dauer, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' as const }
    drunterRef.current?.animate([{ transform: `translateX(-${VERSATZ}%)` }], federn)
    const a = obenRef.current?.animate([{ transform: 'translateX(0)' }], federn)
    const fertig = () => {
      if (obenRef.current) obenRef.current.style.transform = ''
      obenRef.current?.getAnimations().forEach((x) => x.cancel())
      setZiehen(false)
    }
    if (a) a.onfinish = fertig
    else fertig()
  }

  if (!data.ready) {
    return (
      <div className="kontor">
        <Onboarding ctx={ctx} />
      </div>
    )
  }

  const SheetComponent = topIsSheet ? SHEETS[top.name] : null

  const seite = (e: Ebene) => {
    const Page = e.view ? PAGES[e.view.name] : null
    if (!e.view || !Page) return <Main ctx={ctx} />
    return <Page ctx={ctx} view={e.view.name === 'transfer' ? { ...e.view, type: 'transfer' } : e.view} />
  }

  // Welche Ebenen gerade stehen und wie sie sich bewegen.
  const breite = buehne.current?.clientWidth || 390
  const ebenen: { e: Ebene; rolle: string; still?: boolean; style?: CSSProperties; ref?: typeof obenRef }[] = []
  if (fahrt?.art === 'vor') {
    ebenen.push({ e: fahrt.alt, rolle: 'weg-links', still: true }, { e: oben, rolle: 'rein-rechts', ref: obenRef })
  } else if (fahrt?.art === 'zurueck') {
    const p = Math.min(1, fahrt.ab / breite)
    ebenen.push(
      {
        e: oben,
        rolle: 'rein-links',
        ref: obenRef,
        style: { '--von': `${-VERSATZ + VERSATZ * p}%`, '--dunkel-von': String(1 - p) } as CSSProperties,
      },
      { e: fahrt.alt, rolle: 'raus-rechts', still: true, style: { '--ab': `${fahrt.ab}px` } as CSSProperties },
    )
  } else if (ziehen && drunter) {
    ebenen.push({ e: drunter, rolle: 'drunter', ref: drunterRef }, { e: oben, rolle: 'zieht', ref: obenRef })
  } else {
    ebenen.push({ e: oben, rolle: '', ref: obenRef })
  }

  return (
    <div className="kontor">
      <div className="k-buehne" ref={buehne}>
        {ebenen.map(({ e, rolle, still, style, ref }) => {
          const aktiv = e.key === oben.key
          return (
            <div
              key={e.key}
              ref={ref}
              className={`k-ebene${rolle ? ` ${rolle}` : ''}`}
              style={style}
              inert={!aktiv || undefined}
              onAnimationEnd={(ev) => {
                // Nur die Fahrt der Seite selbst, nicht die Abdunklung (::after)
                // oder eine Animation irgendwo darin.
                if (ev.target === ev.currentTarget && aktiv && ev.animationName.startsWith('k-seite')) setFahrt(null)
              }}
              onTouchStart={aktiv ? onZugStart : undefined}
              onTouchMove={aktiv ? onZugMove : undefined}
              onTouchEnd={aktiv ? onZugEnde : undefined}
              onTouchCancel={aktiv ? onZugEnde : undefined}
            >
              <Standbild still={!!still}>{seite(e)}</Standbild>
            </div>
          )
        })}
      </div>
      {SheetComponent ? <SheetComponent ctx={ctx} view={top} /> : null}
    </div>
  )
}

export default Kontor
