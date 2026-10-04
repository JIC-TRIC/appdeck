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
import Heute from './views/Heute'
import Stuecke from './views/Stuecke'
import Statistik from './views/Statistik'
import Stueck from './views/Stueck'
import Verlauf from './views/Verlauf'
import Setlists from './views/Setlists'
import Setlist from './views/Setlist'
import Einstellungen from './views/Einstellungen'
import Ueben from './views/Ueben'
import PieceForm from './views/PieceForm'
import { ImportSheet } from './views/Sheets'
import { IconBars, IconNote, IconToday } from './icons'
import { getPieces, getSessions, getSettings, getSetlists, getUebung, saveUebung } from './store'
import { readBackup, type Values } from './storage'
import { dayOf } from './util'
import type { PianoCtx, Piece, Tab, Uebung, View, ViewName, ViewProps } from './types'

const PAGES: Record<ViewName, ComponentType<ViewProps>> = {
  stueck: Stueck,
  verlauf: Verlauf,
  setlists: Setlists,
  setlist: Setlist,
  einstellungen: Einstellungen,
}

const ROOTS: Record<Tab, ComponentType<{ ctx: PianoCtx }>> = {
  heute: Heute,
  stuecke: Stuecke,
  statistik: Statistik,
}

const TABS: { id: Tab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'heute', label: 'Heute', Icon: IconToday },
  { id: 'stuecke', label: 'Stücke', Icon: IconNote },
  { id: 'statistik', label: 'Statistik', Icon: IconBars },
]

const TAB_LABEL: Record<Tab, string> = { heute: 'Heute', stuecke: 'Stücke', statistik: 'Statistik' }

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) einfach eine
// Ebene ueber apps/.
function toLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

// ---------- Seitenwechsel (wie Kontor) ----------
//
// Eine neue Seite faehrt von rechts herein, die alte rueckt ein Stueck nach
// links und dunkelt ab; zurueck laeuft es umgekehrt. Vom linken Rand laesst
// sich die Seite mit dem Finger zurueckwischen. Waehrend eines Wechsels
// stehen zwei Ebenen uebereinander - danach ist wieder nur die oberste da.
// Tab-Wechsel springen ohne Fahrt, wie auf dem iPhone.

interface Ebene {
  key: string
  view: View | null
  tab: Tab
}

interface Fahrt {
  art: 'vor' | 'zurueck'
  alt: Ebene
  /** Wie weit der Finger die Seite schon gezogen hatte (px). */
  ab: number
}

const RAND_PX = 24
const ZURUECK_AB = 0.35
const ZURUECK_TEMPO = 0.5
const VERSATZ = 28

const seitenKey = (v: View, i: number) => `${i}:${v.name}:${v.pieceId ?? v.setlistId ?? ''}`
const ruhig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Die gehende Seite bleibt stehen, wie sie zuletzt aussah: nach Loeschen
// aendern sich die Daten im selben Moment.
const Standbild = memo(
  function Standbild({ children }: { still: boolean; children: ReactNode }) {
    return <>{children}</>
  },
  (_vorher, jetzt) => jetzt.still,
)

function Piano() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie Kontor und Steady).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const data = useMemo(() => {
    const pieces = getPieces()
    const byId: Record<string, Piece> = {}
    for (const p of pieces) byId[p.id] = p
    return { pieces, byId, sessions: getSessions(), settings: getSettings(), setlists: getSetlists() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  // Bleibt die App ueber den Tageswechsel offen oder kommt am naechsten
  // Morgen aus dem Hintergrund, muss "heute" nachziehen.
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
  const today = dayOf(now, data.settings.dayStart)

  // ---------- Tabs und Seitenstapel ----------

  const [tab, setTabState] = useState<Tab>('heute')
  const [stack, setStack] = useState<View[]>([])
  const depth = useRef(0)
  // Zurueck nimmt die Seite sofort vom Stapel - das folgende popstate gehoert
  // dazu und wird uebersprungen (wie Kontor).
  const popIgnorieren = useRef(0)
  const ohneFahrt = useRef(false)

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
    window.history.pushState({ piano: depth.current + 1 }, '')
    depth.current += 1
    setStack((s) => [...s, view])
  }, [])

  const back = useCallback(() => {
    if (depth.current > 0) {
      depth.current -= 1
      popIgnorieren.current += 1
      setStack((s) => s.slice(0, -1))
      window.history.back()
    } else setStack([])
  }, [])

  const toRoot = useCallback(() => {
    if (depth.current > 0) {
      popIgnorieren.current += 1
      window.history.go(-depth.current)
      depth.current = 0
    }
    setStack([])
  }, [])

  // Aktiver Tab nochmal: zurueck zu seiner Startseite. Anderer Tab: ohne Fahrt wechseln.
  const setTab = (t: Tab) => {
    if (t === tab) {
      if (stack.length) toRoot()
      return
    }
    ohneFahrt.current = true
    toRoot()
    setTabState(t)
  }

  // ---------- Meldungen ----------

  const [uebung, setUebungState] = useState<Uebung | null>(() => {
    const u = getUebung()
    if (u && getPieces().some((p) => p.id === u.pieceId)) return u
    if (u) saveUebung(null)
    return null
  })
  // Es gibt immer nur eine Meldung - eine neue ersetzt die alte. Sie steht
  // ueber der Tab-Leiste (auch nach dem Ueben, wenn das Vollbild gerade zugeht).
  const [presentToast, dismissToast] = useIonToast()
  const notify = useCallback(
    (message: string, undo?: () => void) => {
      dismissToast().catch(() => {})
      presentToast({
        message,
        duration: undo ? 5000 : 2200,
        position: 'bottom',
        positionAnchor: 'p-tabs',
        cssClass: 'p-toast',
        swipeGesture: 'vertical',
        buttons: undo ? [{ text: 'Rückgängig', handler: () => { undo(); refresh() } }] : [],
      })
    },
    [presentToast, dismissToast, refresh],
  )

  // ---------- Ueben, Formular, Import ----------

  const setUebung = useCallback((u: Uebung | null) => {
    saveUebung(u)
    setUebungState(u)
  }, [])

  const startUebung = useCallback(
    (ids: string[]) => {
      const [first, ...rest] = ids
      if (first) setUebung({ pieceId: first, queue: rest, startedAt: Date.now(), pausedMs: 0, pausedAt: null })
    },
    [setUebung],
  )

  const [form, setForm] = useState<{ pieceId?: string } | null>(null)
  const openForm = useCallback((pieceId?: string) => setForm({ pieceId }), [])

  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<Values | null>(null)
  const importBackup = useCallback(() => fileRef.current?.click(), [])
  const onFile = async (file: File) => {
    try {
      setPendingImport(readBackup(await file.text()))
    } catch {
      notify('Das ist keine Piano-Exportdatei und kein appdeck-Backup.')
    }
  }

  // ---------- Kontext ----------

  const titleOf = (v: View) => {
    if (v.name === 'stueck') return data.byId[v.pieceId ?? '']?.title ?? 'Stück'
    if (v.name === 'setlist') return data.setlists.find((s) => s.id === v.setlistId)?.title ?? 'Setlist'
    return { verlauf: 'Verlauf', setlists: 'Setlists', einstellungen: 'Einstellungen' }[v.name]
  }

  const ctx: PianoCtx = {
    ...data,
    today,
    now,
    tab,
    backLabel: TAB_LABEL[tab],
    push,
    back,
    refresh,
    notify,
    startUebung,
    openForm,
    importBackup,
    onExit: toLauncher,
  }

  // ---------- Ebenen fuer den Seitenwechsel ----------

  const ebeneAn = (i: number): Ebene =>
    i < 0 ? { key: `start:${tab}`, view: null, tab } : { key: seitenKey(stack[i], i), view: stack[i], tab }
  const oben = ebeneAn(stack.length - 1)
  const drunter = stack.length ? ebeneAn(stack.length - 2) : null

  const [fahrt, setFahrt] = useState<Fahrt | null>(null)
  const [ziehen, setZiehen] = useState(false)
  const buehne = useRef<HTMLDivElement>(null)
  const obenRef = useRef<HTMLDivElement>(null)
  const drunterRef = useRef<HTMLDivElement>(null)
  const zug = useRef<{ x: number; y: number; dx: number; quer: boolean; lastX: number; lastT: number; v: number } | null>(null)
  const zugWeg = useRef(0)

  // Wechselt die oberste Seite, beginnt die Fahrt - noch in diesem Render,
  // damit die alte Seite gar nicht erst ausgehaengt wird.
  const [zuletzt, setZuletzt] = useState({ key: oben.key, ebene: oben, tiefe: stack.length })
  if (zuletzt.key !== oben.key) {
    setZuletzt({ key: oben.key, ebene: oben, tiefe: stack.length })
    setFahrt(
      ruhig() || ohneFahrt.current
        ? null
        : { art: stack.length < zuletzt.tiefe ? 'zurueck' : 'vor', alt: zuletzt.ebene, ab: zugWeg.current },
    )
    ohneFahrt.current = false
    zugWeg.current = 0
    if (ziehen) setZiehen(false)
  }

  // Was der Finger direkt an die Elemente geschrieben hat, muss weg, sobald
  // die Animation uebernimmt.
  useLayoutEffect(() => {
    if (ziehen) return
    buehne.current?.querySelectorAll<HTMLElement>('.p-ebene').forEach((el) => {
      el.style.transform = ''
      el.style.removeProperty('--dunkel')
    })
  }, [fahrt, ziehen])

  const onZugStart = (e: TouchEvent) => {
    if (!stack.length || fahrt) return
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
      if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
        zug.current = null
        return
      }
      z.quer = true
      setZiehen(true)
    }
    const nowT = performance.now()
    z.v = 0.7 * ((t.clientX - z.lastX) / Math.max(1, nowT - z.lastT)) + 0.3 * z.v
    z.lastX = t.clientX
    z.lastT = nowT
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

  const seite = (e: Ebene, index: number) => {
    if (!e.view) {
      const Root = ROOTS[e.tab]
      return <Root ctx={ctx} />
    }
    const Page = PAGES[e.view.name]
    const backLabel = index > 0 ? titleOf(stack[index - 1]) : TAB_LABEL[e.tab]
    return <Page ctx={{ ...ctx, backLabel }} view={e.view} />
  }

  const breite = buehne.current?.clientWidth || 390
  const ebenen: { e: Ebene; index: number; rolle: string; still?: boolean; style?: CSSProperties; ref?: typeof obenRef }[] = []
  const obenIndex = stack.length - 1
  if (fahrt?.art === 'vor') {
    ebenen.push(
      { e: fahrt.alt, index: obenIndex - 1, rolle: 'weg-links', still: true },
      { e: oben, index: obenIndex, rolle: 'rein-rechts', ref: obenRef },
    )
  } else if (fahrt?.art === 'zurueck') {
    const p = Math.min(1, fahrt.ab / breite)
    ebenen.push(
      {
        e: oben,
        index: obenIndex,
        rolle: 'rein-links',
        ref: obenRef,
        style: { '--von': `${-VERSATZ + VERSATZ * p}%`, '--dunkel-von': String(1 - p) } as CSSProperties,
      },
      { e: fahrt.alt, index: obenIndex + 1, rolle: 'raus-rechts', still: true, style: { '--ab': `${fahrt.ab}px` } as CSSProperties },
    )
  } else if (ziehen && drunter) {
    ebenen.push(
      { e: drunter, index: obenIndex - 1, rolle: 'drunter', ref: drunterRef },
      { e: oben, index: obenIndex, rolle: 'zieht', ref: obenRef },
    )
  } else {
    ebenen.push({ e: oben, index: obenIndex, rolle: '', ref: obenRef })
  }

  return (
    <div className="piano">
      <div className="p-buehne" ref={buehne}>
        {ebenen.map(({ e, index, rolle, still, style, ref }) => {
          const aktiv = e.key === oben.key
          return (
            <div
              key={e.key}
              ref={ref}
              className={`p-ebene${rolle ? ` ${rolle}` : ''}`}
              style={style}
              inert={!aktiv || undefined}
              onAnimationEnd={(ev) => {
                if (ev.target === ev.currentTarget && aktiv && ev.animationName.startsWith('p-seite')) setFahrt(null)
              }}
              onTouchStart={aktiv ? onZugStart : undefined}
              onTouchMove={aktiv ? onZugMove : undefined}
              onTouchEnd={aktiv ? onZugEnde : undefined}
              onTouchCancel={aktiv ? onZugEnde : undefined}
            >
              <Standbild still={!!still}>{seite(e, index)}</Standbild>
            </div>
          )
        })}
      </div>

      <nav id="p-tabs" className="p-tabs" aria-label="Bereiche">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`p-tab${tab === id ? ' on' : ''}`}
            aria-current={tab === id ? 'page' : undefined}
            onClick={() => setTab(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      <Ueben ctx={ctx} uebung={uebung} onChange={setUebung} />

      {form ? <PieceForm ctx={ctx} pieceId={form.pieceId} onClose={() => setForm(null)} /> : null}

      {pendingImport ? (
        <ImportSheet
          values={pendingImport}
          onClose={() => setPendingImport(null)}
          onDone={() => {
            setUebungState(null)
            refresh()
            toRoot()
            setTabState('heute')
            notify('Backup eingespielt')
          }}
        />
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default Piano
