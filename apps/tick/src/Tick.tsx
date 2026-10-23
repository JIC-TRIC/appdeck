import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useIonActionSheet, useIonAlert, useIonToast, type ActionSheetButton } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import { haptik } from './geraet'
import { imOrdner, ordnerIds, zaehle } from './liste'
import { useSichtbar } from './sichtbar'
import {
  anlegen,
  aendere,
  erledigteLoeschen,
  getEntwurf,
  getOrdner,
  getReiter,
  getTodos,
  loesche,
  ordnerAnlegen,
  ordnerLoeschen,
  ordnerSortieren,
  setzeErledigt,
  sortiere,
  speichereEntwurf,
  speichereReiter,
  stelleWiederHer,
} from './store'
import { heuteTag } from './tage'
import { Liste } from './views/Liste'
import { OrdnerBlatt } from './views/OrdnerBlatt'
import { OrdnerSeite } from './views/OrdnerSeite'
import { OrdnerWahl } from './views/OrdnerWahl'
import { TodoBlatt } from './views/TodoBlatt'
import type { Entwurf, Ordner, Reiter, Todo, View } from './types'

// So lange bleibt ein abgehaktes Todo an seinem Platz, die letzte Viertelsekunde rutscht es weg.
const HAKEN_MS = 2000
const WEG_MS = 250

type Offen =
  | { art: 'todo'; id: string }
  | { art: 'wahl-entwurf' }
  | { art: 'wahl-todo'; id: string }
  | { art: 'ordner'; id: string | null }

/** Der heutige Tag - neu, sobald die App wieder in den Vordergrund kommt (und jede Minute). */
function useHeute() {
  const [heute, setHeute] = useState(() => heuteTag())
  useEffect(() => {
    const neu = () => setHeute(heuteTag())
    document.addEventListener('visibilitychange', neu)
    window.addEventListener('focus', neu)
    const id = window.setInterval(neu, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', neu)
      window.removeEventListener('focus', neu)
      window.clearInterval(id)
    }
  }, [])
  return heute
}

const standardOrdner = (r: Reiter) => (r === 'alle' || r === 'eingang' ? null : r)

// Eine Liste als Startseite, darueber die Seite „Ordner“ (Seitenwechsel wie in
// Kontor und Stash, lib/PageStage.tsx). Blaetter von unten fuer Todo und Ordner.
function Tick() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [rev, setRev] = useState(0)
  const refresh = useCallback(() => setRev((r) => r + 1), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daten = useMemo(() => ({ todos: getTodos(), ordner: getOrdner() }), [rev])
  const heute = useHeute()
  const sichtbar = useSichtbar()
  const ids = useMemo(() => ordnerIds(daten.ordner), [daten.ordner])
  const zaehlung = zaehle(daten.todos, daten.ordner, heute)
  const nameVon = (id: string | null) => daten.ordner.find((o) => o.id === id)?.name ?? 'Eingang'

  const { stack, push, back } = useHistoryStack<View>(() => [])
  const [offen, setOffen] = useState<Offen | null>(null)
  const [sortieren, setSortieren] = useState(false)

  // Ein geloeschter Ordner faellt auf „Alle“ zurueck.
  const [reiterRoh, setReiterRoh] = useState(getReiter)
  const reiter = reiterRoh === 'alle' || reiterRoh === 'eingang' || ids.has(reiterRoh) ? reiterRoh : 'alle'

  // Der Entwurf lebt hier: vorgewaehlt ist der Ordner des offenen Reiters.
  const [entwurf, setEntwurfState] = useState<Entwurf>(() => {
    const e = getEntwurf()
    return e.titel ? e : { ...e, ordner: standardOrdner(getReiter()) }
  })
  const setEntwurf = useCallback((e: Entwurf) => {
    setEntwurfState(e)
    speichereEntwurf(e)
  }, [])

  const setReiter = useCallback((r: Reiter) => {
    setReiterRoh(r)
    speichereReiter(r)
    setSortieren(false)
    setEntwurfState((e) => {
      const n = { ...e, ordner: standardOrdner(r) }
      speichereEntwurf(n)
      return n
    })
  }, [])

  const [zeigeToast, schliesseToast] = useIonToast()
  const melde = useCallback(
    (message: string, rueckgaengig?: () => void) => {
      schliesseToast().catch(() => {})
      zeigeToast({
        message,
        duration: rueckgaengig ? 4000 : 2000,
        position: 'top',
        cssClass: 't-toast',
        swipeGesture: 'vertical',
        buttons: rueckgaengig ? [{ text: 'Rückgängig', handler: rueckgaengig }] : undefined,
      })
    },
    [zeigeToast, schliesseToast],
  )
  const [frage] = useIonAlert()
  const [auswahl] = useIonActionSheet()

  // ---------- Abhaken: 2 Sekunden Bedenkzeit, dann rutscht es zu „Erledigt“ ----------

  const [haken, setHaken] = useState<ReadonlySet<string>>(() => new Set())
  const [gehen, setGehen] = useState(false)
  const hakenRef = useRef(haken)
  const timer = useRef<number[]>([])
  const stopp = () => {
    timer.current.forEach((t) => window.clearTimeout(t))
    timer.current = []
  }
  const festschreiben = useCallback(() => {
    stopp()
    const welche = [...hakenRef.current]
    hakenRef.current = new Set()
    setHaken(hakenRef.current)
    setGehen(false)
    if (welche.length) {
      setzeErledigt(welche, true)
      refresh()
    }
  }, [refresh])

  const hake = (t: Todo) => {
    if (t.erledigt !== null) {
      // Aus „Erledigt“ heraus: sofort wieder offen, an seinem alten Platz.
      setzeErledigt([t.id], false)
      refresh()
      return
    }
    const neu = new Set(hakenRef.current)
    if (neu.has(t.id)) neu.delete(t.id)
    else {
      neu.add(t.id)
      haptik()
    }
    hakenRef.current = neu
    setHaken(neu)
    setGehen(false)
    stopp()
    // Mehrere schnell hintereinander rutschen gemeinsam: jeder Haken startet die Zeit neu.
    if (neu.size) timer.current = [window.setTimeout(() => setGehen(true), HAKEN_MS - WEG_MS), window.setTimeout(festschreiben, HAKEN_MS)]
  }

  // App geht in den Hintergrund: nicht auf den Timer warten, iOS haelt ihn an.
  useEffect(() => {
    const weg = () => {
      if (document.visibilityState === 'hidden') festschreiben()
    }
    document.addEventListener('visibilitychange', weg)
    return () => {
      document.removeEventListener('visibilitychange', weg)
      festschreiben()
    }
  }, [festschreiben])

  // ---------- Anlegen ----------

  const [neuId, setNeuId] = useState<string | null>(null)
  useEffect(() => {
    if (!neuId) return
    const id = window.setTimeout(() => setNeuId(null), 1600)
    return () => window.clearTimeout(id)
  }, [neuId])

  const anlegenJetzt = () => {
    const t = anlegen(entwurf)
    if (!t) return
    setEntwurf({ ...entwurf, titel: '' })
    refresh()
    setNeuId(t.id)
    const hier = reiter === 'alle' || (reiter === 'eingang' ? t.ordner === null : t.ordner === reiter)
    if (!hier) melde(`In ${nameVon(t.ordner)} abgelegt`)
  }

  // ---------- Loeschen, Verschieben ----------

  const loeschenJetzt = (id: string) => {
    const weg = loesche(id)
    refresh()
    if (weg)
      melde('Gelöscht', () => {
        stelleWiederHer(weg)
        refresh()
      })
  }

  const verschieben = (id: string, ordner: string | null) => {
    const t = daten.todos.find((x) => x.id === id)
    if (!t || t.ordner === ordner) return
    aendere(id, { ordner })
    refresh()
    const hier = reiter === 'alle' || (reiter === 'eingang' ? ordner === null : ordner === reiter)
    if (!hier) melde(`Nach ${nameVon(ordner)} verschoben`)
  }

  const erledigteLoeschenFragen = (ansicht: string | null, n: number) => {
    const wo = ansicht === 'alle' ? '' : ` in ${nameVon(ansicht)}`
    frage({
      header: n === 1 ? `Erledigtes Todo${wo} löschen?` : `${n} erledigte Todos${wo} löschen?`,
      message: ansicht === 'alle' ? 'Das gilt für alle Ordner.' : undefined,
      cssClass: 't-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            const weg = erledigteLoeschen(ansicht)
            refresh()
            melde(weg === 1 ? '1 erledigtes Todo gelöscht' : `${weg} erledigte Todos gelöscht`)
          },
        },
      ],
    })
  }

  // ---------- Ordner ----------

  const ordnerLoeschenFragen = (o: Ordner) => {
    const n = imOrdner(getTodos(), o.id, ordnerIds(getOrdner())).length
    const fertig = (mitTodos: boolean) => {
      ordnerLoeschen(o.id, mitTodos)
      if (reiter === o.id) setReiter('alle')
      refresh()
      melde(`„${o.name}“ gelöscht`)
    }
    auswahl({
      header: `„${o.name}“ löschen?`,
      subHeader: n ? `Darin ${n === 1 ? 'liegt noch 1 offenes Todo' : `liegen noch ${n} offene Todos`}.` : undefined,
      cssClass: 't-as',
      buttons: n
        ? [
            { text: 'In den Eingang verschieben', handler: () => fertig(false) },
            { text: n === 1 ? 'Mit dem Todo löschen' : `Mit allen ${n} Todos löschen`, role: 'destructive', handler: () => fertig(true) },
            { text: 'Abbrechen', role: 'cancel' },
          ]
        : [
            { text: 'Ordner löschen', role: 'destructive', handler: () => fertig(false) },
            { text: 'Abbrechen', role: 'cancel' },
          ],
    })
  }

  const menue = () => {
    const o = daten.ordner.find((x) => x.id === reiter)
    const buttons: ActionSheetButton[] = []
    if (reiter !== 'alle' && imOrdner(daten.todos, standardOrdner(reiter), ids).length > 1)
      buttons.push({ text: 'Reihenfolge ändern', handler: () => setSortieren(true) })
    if (o) buttons.push({ text: `„${o.name}“ bearbeiten`, handler: () => setOffen({ art: 'ordner', id: o.id }) })
    buttons.push({ text: 'Neuer Ordner', handler: () => setOffen({ art: 'ordner', id: null }) })
    buttons.push({ text: 'Ordner verwalten', handler: () => push({ name: 'ordner' }) })
    buttons.push({ text: 'Abbrechen', role: 'cancel' })
    auswahl({ cssClass: 't-as', buttons })
  }

  const titelHier = reiter === 'alle' ? 'Alle' : nameVon(standardOrdner(reiter))

  const seite = (view: View | null) =>
    view ? (
      <OrdnerSeite
        ordner={daten.ordner}
        zaehlung={zaehlung}
        zurueck={titelHier}
        onZurueck={back}
        onBearbeiten={(id) => setOffen({ art: 'ordner', id })}
        onNeu={() => setOffen({ art: 'ordner', id: null })}
        onSortiert={(ids) => {
          ordnerSortieren(ids)
          refresh()
        }}
      />
    ) : (
      <Liste
        todos={daten.todos}
        ordner={daten.ordner}
        heute={heute}
        reiter={reiter}
        setReiter={setReiter}
        haken={haken}
        gehen={gehen}
        neu={neuId}
        sortieren={sortieren}
        setSortieren={setSortieren}
        entwurf={entwurf}
        setEntwurf={setEntwurf}
        tastatur={sichtbar.tastatur}
        onHaken={hake}
        onOeffnen={(id) => setOffen({ art: 'todo', id })}
        onVerschieben={(id) => setOffen({ art: 'wahl-todo', id })}
        onLoeschen={loeschenJetzt}
        onAnlegen={anlegenJetzt}
        onOrdnerWahl={() => setOffen({ art: 'wahl-entwurf' })}
        onNeuerOrdner={() => setOffen({ art: 'ordner', id: null })}
        onVorschlag={(name, farbe) => {
          ordnerAnlegen(name, farbe)
          refresh()
        }}
        onMenue={menue}
        onSortiert={(ids) => {
          sortiere(ids)
          refresh()
        }}
        onErledigteLoeschen={erledigteLoeschenFragen}
      />
    )

  const blatt = () => {
    if (!offen) return null
    const zu = () => setOffen(null)
    if (offen.art === 'todo') {
      const t = daten.todos.find((x) => x.id === offen.id)
      if (!t) return null
      return (
        <TodoBlatt
          key={t.id}
          todo={t}
          an={haken.has(t.id) || t.erledigt !== null}
          ordner={daten.ordner}
          zaehlung={zaehlung}
          heute={heute}
          onHaken={() => hake(t)}
          onGeaendert={refresh}
          onLoeschen={() => loeschenJetzt(t.id)}
          onClose={zu}
        />
      )
    }
    if (offen.art === 'wahl-entwurf') {
      return (
        <OrdnerWahl
          titel="Ordner"
          unter={entwurf.titel.trim() || undefined}
          aktuell={entwurf.ordner !== null && ids.has(entwurf.ordner) ? entwurf.ordner : null}
          ordner={daten.ordner}
          zaehlung={zaehlung}
          onWahl={(id) => {
            refresh()
            setEntwurf({ ...entwurf, ordner: id })
          }}
          onClose={zu}
        />
      )
    }
    if (offen.art === 'wahl-todo') {
      const t = daten.todos.find((x) => x.id === offen.id)
      if (!t) return null
      return (
        <OrdnerWahl
          titel="Verschieben"
          unter={t.titel}
          aktuell={t.ordner !== null && ids.has(t.ordner) ? t.ordner : null}
          ordner={daten.ordner}
          zaehlung={zaehlung}
          onWahl={(id) => {
            refresh()
            verschieben(t.id, id)
          }}
          onClose={zu}
        />
      )
    }
    const o = offen.id ? daten.ordner.find((x) => x.id === offen.id) : null
    if (offen.id && !o) return null
    return (
      <OrdnerBlatt
        key={offen.id ?? 'neu'}
        ordner={o ?? null}
        alle={daten.ordner}
        anzahl={o ? (zaehlung.je.get(o.id) ?? 0) : 0}
        onClose={() => {
          zu()
          refresh()
        }}
        onFertig={(x) => {
          // Neuer Ordner vom Reiter + oder aus dem Menue: gleich hinein.
          if (!offen.id && !stack.length) setReiter(x.id)
        }}
        onLoeschen={ordnerLoeschenFragen}
      />
    )
  }

  return (
    <div className={`tick${sichtbar.tastatur ? ' tastatur' : ''}`} style={sichtbar.style}>
      <PageStage
        className="t-buehne"
        pages={stack}
        rootKey="liste"
        pageKey={(v, i) => `${i}:${v.name}`}
        render={seite}
        onBack={back}
        swipe={!offen}
      />
      {blatt()}
    </div>
  )
}

export default Tick
