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
  getSeite,
  getTodos,
  loesche,
  ordnerAnlegen,
  ordnerLoeschen,
  ordnerSortieren,
  setzeErledigt,
  sortiere,
  speichereEntwurf,
  speichereSeite,
  stelleWiederHer,
} from './store'
import { heuteTag } from './tage'
import { Liste } from './views/Liste'
import { OrdnerBlatt } from './views/OrdnerBlatt'
import { OrdnerWahl } from './views/OrdnerWahl'
import { TodoBlatt } from './views/TodoBlatt'
import type { Entwurf, Ordner, Todo, View } from './types'

// So lange bleibt ein abgehaktes Todo an seinem Platz, die letzte Viertelsekunde rutscht es weg.
const HAKEN_MS = 2000
const WEG_MS = 250

/** Die Startseite: alle Ordner als Karten. */
const START = 'start'

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

/** Wohin ein neues Todo auf dieser Seite gehoert: in ihren Ordner, sonst in den Eingang. */
const standardOrdner = (a: string) => (a === START || a === 'alle' || a === 'eingang' ? null : a)

/** Liegt ein Todo mit diesem Ordner auf der Seite sichtbar? */
const sichtbarAuf = (a: string, ordner: string | null) => a === 'alle' || (a === 'eingang' ? ordner === null : ordner === a)

// Unten die Startseite mit allen Ordnern als Karten, darueber eine Liste (Alle,
// Eingang oder ein Ordner) ueber die ganze Hoehe. Seitenwechsel mit
// Zurueckwischen wie in Kontor und Stash (lib/PageStage.tsx). Blaetter von
// unten fuer Todo und Ordner.
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
  const titelVon = (a: string) => (a === START ? 'Ordner' : a === 'alle' ? 'Alle' : nameVon(standardOrdner(a)))

  // Tick oeffnet dort, wo man zuletzt war: auf der Startseite oder in einem Ordner
  // (dann liegt die Startseite darunter, „‹ Ordner“ fuehrt hin).
  const { stack, push, back } = useHistoryStack<View>(() => {
    const r = getSeite()
    return r === 'alle' || r === 'eingang' || ordnerIds(getOrdner()).has(r) ? [{ name: 'liste', ansicht: r }] : []
  })
  const oben = stack.length ? stack[stack.length - 1].ansicht : START

  const [offen, setOffen] = useState<Offen | null>(null)
  const [ordnen, setOrdnen] = useState(false)

  // Der Entwurf lebt hier: vorgewaehlt ist der Ordner der offenen Seite.
  const [entwurf, setEntwurfState] = useState<Entwurf>(() => {
    const e = getEntwurf()
    return e.titel ? e : { ...e, ordner: standardOrdner(getSeite()) }
  })
  const setEntwurf = useCallback((e: Entwurf) => {
    setEntwurfState(e)
    speichereEntwurf(e)
  }, [])

  // Andere Seite: merken, Sortieren aus, der Ordner fuer neue Todos folgt.
  // Beim Start nicht - da gilt der gespeicherte Entwurf.
  const ersteSeite = useRef(true)
  useEffect(() => {
    speichereSeite(oben)
    if (ersteSeite.current) {
      ersteSeite.current = false
      return
    }
    setOrdnen(false)
    setEntwurfState((e) => {
      const n = { ...e, ordner: standardOrdner(oben) }
      speichereEntwurf(n)
      return n
    })
  }, [oben])

  const oeffne = (ansicht: string) => push({ name: 'liste', ansicht })

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
    // Auf der Startseite und in einem anderen Ordner sieht man es nicht: kurz sagen, wo es liegt.
    if (!sichtbarAuf(oben, t.ordner)) melde(`In ${nameVon(t.ordner)} abgelegt`)
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
    if (!sichtbarAuf(oben, ordner)) melde(`Nach ${nameVon(ordner)} verschoben`)
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
      // Steht man gerade in dem Ordner: zurueck zu allen Ordnern.
      if (oben === o.id) back()
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
    const buttons: ActionSheetButton[] = []
    if (oben === START) {
      if (daten.ordner.length) buttons.push({ text: 'Ordner bearbeiten', handler: () => setOrdnen(true) })
    } else {
      const o = daten.ordner.find((x) => x.id === oben)
      if (oben !== 'alle' && imOrdner(daten.todos, standardOrdner(oben), ids).length > 1)
        buttons.push({ text: 'Reihenfolge ändern', handler: () => setOrdnen(true) })
      if (o) buttons.push({ text: `„${o.name}“ bearbeiten`, handler: () => setOffen({ art: 'ordner', id: o.id }) })
    }
    buttons.push({ text: 'Neuer Ordner', handler: () => setOffen({ art: 'ordner', id: null }) })
    buttons.push({ text: 'Abbrechen', role: 'cancel' })
    auswahl({ cssClass: 't-as', buttons })
  }

  const seite = (view: View | null, i: number) => (
    <Liste
      ansicht={view ? view.ansicht : START}
      zurueck={i > 0 ? titelVon(stack[i - 1].ansicht) : 'Ordner'}
      todos={daten.todos}
      ordner={daten.ordner}
      heute={heute}
      haken={haken}
      gehen={gehen}
      neu={neuId}
      ordnen={ordnen}
      setOrdnen={setOrdnen}
      entwurf={entwurf}
      setEntwurf={setEntwurf}
      tastatur={sichtbar.tastatur}
      onZurueck={back}
      onOeffnen={oeffne}
      onHaken={hake}
      onTodo={(id) => setOffen({ art: 'todo', id })}
      onVerschieben={(id) => setOffen({ art: 'wahl-todo', id })}
      onLoeschen={loeschenJetzt}
      onAnlegen={anlegenJetzt}
      onOrdnerWahl={() => setOffen({ art: 'wahl-entwurf' })}
      onNeuerOrdner={() => setOffen({ art: 'ordner', id: null })}
      onOrdnerBearbeiten={(id) => setOffen({ art: 'ordner', id })}
      onVorschlag={(name, farbe) => {
        ordnerAnlegen(name, farbe)
        refresh()
      }}
      onMenue={menue}
      onSortiert={(ids) => {
        sortiere(ids)
        refresh()
      }}
      onOrdnerSortiert={(ids) => {
        ordnerSortieren(ids)
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
        faellig={o ? (zaehlung.faelligJe.get(o.id) ?? 0) : 0}
        onClose={() => {
          zu()
          refresh()
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
        rootKey={START}
        pageKey={(v, i) => `${i}:${v.ansicht}`}
        render={seite}
        onBack={back}
        swipe={!offen}
      />
      {blatt()}
    </div>
  )
}

export default Tick
