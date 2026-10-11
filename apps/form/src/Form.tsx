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
import { LaufLeiste, usePausenTon } from './views/Pause'
import { useWach } from './geraet'
import { IconHantel, IconKalender, IconListe, IconStatistik, IconWerte } from './icons'
import { getLog, getWerte } from './store'
import {
  getBereich,
  getEinstellungen,
  getLaufend,
  getPausenKorrektur,
  getTrainings,
  getUebungen,
  getVorlagen,
  setzeBereich as speichereBereich,
} from './trainingStore'
import { dateKey } from './util'
import type { FormCtx, Tab, Uebung, View, Wert } from './types'

// Seitenwechsel mit Zurueckwischen wie Kontor, Piano und Stash
// (lib/PageStage.tsx, lib/useHistoryStack.ts). Messen und Bearbeiten sind
// ganze Seiten, damit die Tastatur genug Platz hat; Blaetter von unten gibt es
// nur im Training (Tastenfeld, Uebung, Menue).

// Unten eine Tab-Leiste fuer ganz Form (wie Strong: Training, Verlauf,
// Uebungen, Koerperwerte) - auch waehrend eines laufenden Trainings. Nur ueber
// Formularen, dem Bearbeiten eines Trainings und "Fertig" nicht: Dort wuerde
// ein Tipp auf einen Tab die Eingabe verwerfen. Laeuft ein Training und man
// steht woanders, zeigt eine Leiste darueber das Training mit seiner Pause.
const TABS: { id: Tab; label: string; Icon: ComponentType }[] = [
  { id: 'training', label: 'Training', Icon: IconHantel },
  { id: 'kalender', label: 'Kalender', Icon: IconKalender },
  { id: 'statistik', label: 'Statistik', Icon: IconStatistik },
  { id: 'uebungen', label: 'Übungen', Icon: IconListe },
  { id: 'werte', label: 'Werte', Icon: IconWerte },
]
const MIT_LEISTE: View['name'][] = ['training', 'uebung', 'vorlagen', 'wert']

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
      pausenKorrektur: getPausenKorrektur(),
      einstellungen: getEinstellungen(),
    }
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

  // Bildschirm an und Ton am Pausenende gelten fuers ganze laufende Training,
  // auch wenn man gerade im Kalender oder bei den Werten ist.
  useWach(!!daten.laufend && daten.einstellungen.wach)
  usePausenTon(daten.laufend, daten.uebungById, daten.pausenKorrektur, daten.einstellungen.ton)

  const { stack, push, replace, back, toRoot } = useHistoryStack<View>(() => [])

  // Form oeffnet beim laufenden Training, sonst bei den Werten oder beim
  // Training - je nachdem, wo man zuletzt war (form:bereich).
  const [tab, setTab] = useState<Tab>(() => (getLaufend() || getBereich() === 'training' ? 'training' : 'werte'))
  // Die Startseite des neuen Tabs erscheint ohne Fahrt - nur fuer diesen einen
  // Wechsel, danach faehrt zurueck zur Startseite wieder (wie Piano).
  const [ohneFahrt, setOhneFahrt] = useState<string | undefined>()
  useEffect(() => {
    if (ohneFahrt) setOhneFahrt(undefined)
  }, [ohneFahrt])
  // Aktiver Tab nochmal: zurueck zu seiner Startseite. Anderer Tab: ohne Fahrt wechseln.
  const zeigeTab = useCallback(
    (t: Tab) => {
      if (t === tab) {
        if (stack.length) toRoot()
        return
      }
      setOhneFahrt(`start:${t}`)
      toRoot()
      setTab(t)
      speichereBereich(t === 'werte' ? 'werte' : 'training')
    },
    [tab, stack.length, toRoot],
  )
  const oben = stack[stack.length - 1]
  const leiste = !oben || MIT_LEISTE.includes(oben.name)
  // Das laufende Training ist die Startseite des Trainings-Tabs - steht man
  // dort, braucht es keine Leiste, die dorthin fuehrt.
  const lauf = daten.laufend && leiste && (tab !== 'training' || !!oben) ? daten.laufend : null

  // Es gibt immer nur eine Meldung - eine neue ersetzt die alte. Oben, weil
  // unten der Hauptknopf steht.
  const [zeigeToast, schliesseToast] = useIonToast()
  const melde = useCallback(
    (message: string, art?: 'rekord') => {
      schliesseToast().catch(() => {})
      zeigeToast({
        message,
        duration: art ? 2800 : 2200,
        position: 'top',
        cssClass: art ? 'f-toast f-toast-rekord' : 'f-toast',
        swipeGesture: 'vertical',
      })
    },
    [zeigeToast, schliesseToast],
  )

  const ctx: FormCtx = { ...daten, tab, zeigeTab, heute, push, replace, back, toRoot, refresh, melde }

  const seite = (view: View | null) => {
    if (!view) {
      switch (tab) {
        case 'training':
          return daten.laufend ? <TrainingSeite ctx={ctx} /> : <TrainingStart ctx={ctx} />
        case 'kalender':
          return <Kalender ctx={ctx} />
        case 'statistik':
          return <Statistik ctx={ctx} />
        case 'uebungen':
          return <Uebungen ctx={ctx} />
        case 'werte':
          return <Start ctx={ctx} />
      }
    }
    switch (view.name) {
      case 'wert':
        return <WertSeite ctx={ctx} id={view.id} />
      case 'messen':
        return <Messen ctx={ctx} start={view.tag} />
      case 'wertForm':
        return <WertForm ctx={ctx} id={view.id} />
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
      {lauf ? (
        <LaufLeiste t={lauf} uebungById={daten.uebungById} korrektur={daten.pausenKorrektur} onClick={() => zeigeTab('training')} />
      ) : null}
      {leiste ? (
        <nav className="f-tabs" aria-label="Bereiche">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`f-tab${tab === id ? ' an' : ''}${id === 'training' && daten.laufend ? ' laeuft' : ''}`}
              aria-current={tab === id ? 'page' : undefined}
              onClick={() => zeigeTab(id)}
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
