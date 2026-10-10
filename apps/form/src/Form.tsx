import { useCallback, useEffect, useMemo, useState } from 'react'
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
import Verlauf from './views/Verlauf'
import EinTraining from './views/EinTraining'
import Nachtragen from './views/Nachtragen'
import Uebungen from './views/Uebungen'
import UebungSeite from './views/UebungSeite'
import UebungForm from './views/UebungForm'
import Vorlagen from './views/Vorlagen'
import VorlageForm from './views/VorlageForm'
import { getLog, getWerte } from './store'
import { getBereich, getLaufend, getTrainings, getUebungen, getVorlagen, setzeBereich as speichereBereich } from './trainingStore'
import { dateKey } from './util'
import type { AppBereich, FormCtx, Uebung, View, Wert } from './types'

// Seitenwechsel mit Zurueckwischen wie Kontor, Piano und Stash
// (lib/PageStage.tsx, lib/useHistoryStack.ts). Messen und Bearbeiten sind
// ganze Seiten, damit die Tastatur genug Platz hat; Blaetter von unten gibt es
// nur im Training (Tastenfeld, Uebung, Menue).
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
      return bereich === 'training' ? <TrainingStart ctx={ctx} /> : <Start ctx={ctx} />
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
      case 'verlauf':
        return <Verlauf ctx={ctx} />
      case 'training':
        return <EinTraining ctx={ctx} id={view.id} />
      case 'bearbeiten': {
        const t = daten.trainings.find((x) => x.id === view.id)
        return t ? <TrainingSeite ctx={ctx} entwurf={t} /> : <EinTraining ctx={ctx} id={view.id} />
      }
      case 'neu':
        return <TrainingSeite ctx={ctx} entwurf={view.training} neu />
      case 'nachtragen':
        return <Nachtragen ctx={ctx} />
      case 'uebungen':
        return <Uebungen ctx={ctx} />
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
    <div className="form">
      <PageStage className="f-buehne" pages={stack} rootKey="start" pageKey={seitenKey} render={seite} onBack={back} />
    </div>
  )
}

export default Form
