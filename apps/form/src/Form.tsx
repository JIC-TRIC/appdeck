import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import { useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import Start from './views/Start'
import Messen from './views/Messen'
import WertSeite from './views/WertSeite'
import WertForm from './views/WertForm'
import TrainingStart from './views/TrainingStart'
import TrainingSeite from './views/TrainingSeite'
import Fertig from './views/Fertig'
import Kalender from './views/Kalender'
import Statistik from './views/Statistik'
import EinTraining from './views/EinTraining'
import Nachtragen from './views/Nachtragen'
import Uebungen from './views/Uebungen'
import UebungSeite from './views/UebungSeite'
import UebungForm from './views/UebungForm'
import Vorlagen from './views/Vorlagen'
import VorlageForm from './views/VorlageForm'
import { IconHantel, IconKalender, IconStatistik, IconVorlagen } from './icons'
import { getLog, getWerte } from './store'
import { getBereich, getLaufend, getTrainings, getUebungen, getVorlagen, setzeBereich as speichereBereich } from './trainingStore'
import { dateKey } from './util'
import type { AppBereich, FormCtx, TrainingTab, Uebung, View, Wert } from './types'

// Seitenwechsel mit Zurueckwischen wie Kontor, Piano und Stash
// (lib/PageStage.tsx, lib/useHistoryStack.ts). Messen und Bearbeiten sind
// ganze Seiten, damit die Tastatur genug Platz hat; Blaetter von unten gibt es
// nur im Training (Tastenfeld, Uebung, Menue).

// Das Training hat unten eine Tab-Leiste wie Piano - nicht waehrend eines
// laufenden Trainings, und nicht ueber Formularen, dem Bearbeiten eines
// Trainings und "Fertig": Dort wuerde ein Tipp auf einen Tab die Eingabe
// verwerfen. Die Werte bleiben ohne Leiste.
const TABS: { id: TrainingTab; label: string; Icon: ComponentType; Seite: ComponentType<{ ctx: FormCtx }> }[] = [
  { id: 'vorlagen', label: 'Vorlagen', Icon: IconVorlagen, Seite: TrainingStart },
  { id: 'kalender', label: 'Kalender', Icon: IconKalender, Seite: Kalender },
  { id: 'statistik', label: 'Statistik', Icon: IconStatistik, Seite: Statistik },
  { id: 'uebungen', label: 'Übungen', Icon: IconHantel, Seite: Uebungen },
]
const MIT_LEISTE: View['name'][] = ['training', 'uebung', 'vorlagen']

const seitenKey = (v: View, i: number) => {
  const zusatz = 'id' in v ? (v.id ?? '') : v.name === 'messen' ? v.tag : v.name === 'neu' ? v.training.id : ''
  return `${i}:${v.name}:${zusatz}`
}

function Form() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  const daten = useMemo(() => {
    const werte = getWerte()
    const byId: Record<string, Wert> = {}
    for (const w of werte) byId[w.id] = w
    const uebungen = getUebungen()
    const uebungById: Record<string, Uebung> = {}
    for (const u of uebungen) uebungById[u.id] = u
    return {
      werte,
      byId,
      log: getLog(),
      uebungen,
      uebungById,
      vorlagen: getVorlagen(),
      trainings: getTrainings(),
      laufend: getLaufend(),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  // Werte oder Training - Form oeffnet den Bereich, in dem man zuletzt war.
  const [bereich, setBereich] = useState<AppBereich>(getBereich)
  const setzeBereich = useCallback((b: AppBereich) => {
    speichereBereich(b)
    setBereich(b)
  }, [])

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

  const { stack, push, replace, back, toRoot } = useHistoryStack<View>(() => [])

  // Form oeffnet das Training immer bei den Vorlagen - dort startet man.
  const [tab, setTab] = useState<TrainingTab>('vorlagen')
  // Die Startseite des neuen Tabs erscheint ohne Fahrt - nur fuer diesen einen
  // Wechsel, danach faehrt zurueck zur Startseite wieder (wie Piano).
  const [ohneFahrt, setOhneFahrt] = useState<string | undefined>()
  useEffect(() => {
    if (ohneFahrt) setOhneFahrt(undefined)
  }, [ohneFahrt])
  // Aktiver Tab nochmal: zurueck zu seiner Startseite. Anderer Tab: ohne Fahrt wechseln.
  const waehleTab = (t: TrainingTab) => {
    if (t === tab) {
      if (stack.length) toRoot()
      return
    }
    setOhneFahrt(`start:${t}`)
    toRoot()
    setTab(t)
  }
  const oben = stack[stack.length - 1]
  const leiste = bereich === 'training' && !daten.laufend && (!oben || MIT_LEISTE.includes(oben.name))

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

  const ctx: FormCtx = { ...daten, bereich, setzeBereich, heute, push, replace, back, toRoot, refresh, melde }

  const seite = (view: View | null) => {
    // Laeuft ein Training, gehoert ihm die Startseite: kein Umschalter, Form
    // oeffnet direkt dort. Zu den Werten geht es nur ueber sein Menue.
    if (!view) {
      if (daten.laufend) return <TrainingSeite ctx={ctx} />
      if (bereich === 'werte') return <Start ctx={ctx} />
      const Tab = TABS.find((x) => x.id === tab)!.Seite
      return <Tab ctx={ctx} />
    }
    switch (view.name) {
      case 'wert':
        return <WertSeite ctx={ctx} id={view.id} />
      case 'messen':
        return <Messen ctx={ctx} start={view.tag} />
      case 'wertForm':
        return <WertForm ctx={ctx} id={view.id} />
      case 'werte':
        return <Start ctx={ctx} imTraining />
      case 'fertig':
        return <Fertig ctx={ctx} id={view.id} />
      case 'training':
        return <EinTraining ctx={ctx} id={view.id} />
      case 'bearbeiten': {
        const t = daten.trainings.find((x) => x.id === view.id)
        return t ? <TrainingSeite ctx={ctx} entwurf={t} /> : <EinTraining ctx={ctx} id={view.id} />
      }
      case 'neu':
        return <TrainingSeite ctx={ctx} entwurf={view.training} neu />
      case 'nachtragen':
        return <Nachtragen ctx={ctx} tag={view.tag} />
      case 'uebung':
        return <UebungSeite ctx={ctx} id={view.id} />
      case 'uebungForm':
        return <UebungForm ctx={ctx} id={view.id} />
      case 'vorlagen':
        return <Vorlagen ctx={ctx} />
      case 'vorlageForm':
        return <VorlageForm ctx={ctx} id={view.id} />
    }
  }

  return (
    <div className={`form${leiste ? ' mit-leiste' : ''}`}>
      <PageStage
        className="f-buehne"
        pages={stack}
        rootKey={`start:${tab}`}
        pageKey={seitenKey}
        render={seite}
        onBack={back}
        instantFor={ohneFahrt}
      />
      {leiste ? (
        <nav className="f-tabs" aria-label="Training">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`f-tab${tab === id ? ' an' : ''}`}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => waehleTab(id)}
            >
              <Icon />
              {label}
            </button>
          ))}
        </nav>
      ) : null}
    </div>
  )
}

export default Form
