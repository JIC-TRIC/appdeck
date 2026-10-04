import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react'
import { useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
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
import { isArchived } from './model'
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

// Seitenwechsel wie auf dem iPhone: lib/PageStage.tsx (mit Zurueckwischen),
// Stapel an der Browser-History: lib/useHistoryStack.ts - beides wie Kontor.
// Tab-Wechsel springen ohne Fahrt, wie auf dem iPhone.
const seitenKey = (v: View, i: number) => `${i}:${v.name}:${v.pieceId ?? v.setlistId ?? ''}`

function Piano() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie Kontor und Steady).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const data = useMemo(() => {
    const pieces = getPieces()
    const byId: Record<string, Piece> = {}
    for (const p of pieces) byId[p.id] = p
    const active = pieces.filter((p) => !isArchived(p))
    return { pieces, active, byId, sessions: getSessions(), settings: getSettings(), setlists: getSetlists() }
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
  const { stack, push, back, toRoot } = useHistoryStack<View>(() => [])
  // Die Startseite des neuen Tabs erscheint ohne Fahrt - nur fuer diesen einen
  // Wechsel, danach faehrt zurueck zur Startseite wieder.
  const [instantFor, setInstantFor] = useState<string | undefined>()
  useEffect(() => {
    if (instantFor) setInstantFor(undefined)
  }, [instantFor])

  // Aktiver Tab nochmal: zurueck zu seiner Startseite. Anderer Tab: ohne Fahrt wechseln.
  const setTab = (t: Tab) => {
    if (t === tab) {
      if (stack.length) toRoot()
      return
    }
    setInstantFor(`start:${t}`)
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

  const seite = (view: View | null, index: number) => {
    if (!view) {
      const Root = ROOTS[tab]
      return <Root ctx={ctx} />
    }
    const Page = PAGES[view.name]
    const backLabel = index > 0 ? titleOf(stack[index - 1]) : TAB_LABEL[tab]
    return <Page ctx={{ ...ctx, backLabel }} view={view} />
  }


  return (
    <div className="piano">
      <PageStage
        className="p-buehne"
        pages={stack}
        rootKey={`start:${tab}`}
        pageKey={seitenKey}
        render={seite}
        onBack={back}
        instantFor={instantFor}
      />

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
