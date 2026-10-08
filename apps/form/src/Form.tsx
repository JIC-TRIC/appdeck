import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import Start from './views/Start'
import Messen from './views/Messen'
import WertSeite from './views/WertSeite'
import WertForm from './views/WertForm'
import { getLog, getWerte } from './store'
import { dateKey } from './util'
import type { FormCtx, View, Wert } from './types'

// Seitenwechsel mit Zurueckwischen wie Kontor, Piano und Stash
// (lib/PageStage.tsx, lib/useHistoryStack.ts). Keine Blaetter: Messen und
// Bearbeiten sind ganze Seiten, damit die Tastatur genug Platz hat.
const seitenKey = (v: View, i: number) =>
  `${i}:${v.name}:${v.name === 'wert' ? v.id : v.name === 'messen' ? v.tag : (v.id ?? '')}`

function Form() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  const daten = useMemo(() => {
    const werte = getWerte()
    const byId: Record<string, Wert> = {}
    for (const w of werte) byId[w.id] = w
    return { werte, byId, log: getLog() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  // Bleibt die App ueber Mitternacht offen oder kommt am naechsten Morgen aus
  // dem Hintergrund, muss "heute" nachziehen.
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const wach = () => setJetzt(Date.now())
    const id = window.setInterval(wach, 60_000)
    document.addEventListener('visibilitychange', wach)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', wach)
    }
  }, [])
  const heute = dateKey(new Date(jetzt))

  const { stack, push, back, toRoot } = useHistoryStack<View>(() => [])

  // Es gibt immer nur eine Meldung - eine neue ersetzt die alte. Oben, weil
  // unten der Hauptknopf steht.
  const [zeigeToast, schliesseToast] = useIonToast()
  const melde = useCallback(
    (message: string) => {
      schliesseToast().catch(() => {})
      zeigeToast({ message, duration: 2200, position: 'top', cssClass: 'f-toast', swipeGesture: 'vertical' })
    },
    [zeigeToast, schliesseToast],
  )

  const ctx: FormCtx = { ...daten, heute, push, back, toRoot, refresh, melde }

  const seite = (view: View | null) => {
    if (!view) return <Start ctx={ctx} />
    if (view.name === 'wert') return <WertSeite ctx={ctx} id={view.id} />
    if (view.name === 'messen') return <Messen ctx={ctx} start={view.tag} />
    return <WertForm ctx={ctx} id={view.id} />
  }

  return (
    <div className="form">
      <PageStage className="f-buehne" pages={stack} rootKey="start" pageKey={seitenKey} render={seite} onBack={back} />
    </div>
  )
}

export default Form
