import { useCallback, useMemo, useState } from 'react'
import { useIonAlert, useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import Schreiben from './views/Schreiben'
import Stapel from './views/Stapel'
import { kopiere } from './kopieren'
import { useSichtbar } from './sichtbar'
import { getEntwurf, getGeleert, getNotizen, getTitel, leeren, speichereEntwurf, zurueckholen } from './store'
import { anzahl, kopierText } from './text'
import type { Entwurf, View } from './types'

// Zwei Seiten: Schreiben (Start) und Stapel. Seitenwechsel mit Zurueckwischen
// wie Kontor und Piano (lib/PageStage.tsx, lib/useHistoryStack.ts).
function Stash() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  const daten = useMemo(
    () => ({ notizen: getNotizen(), titel: getTitel(), geleert: getGeleert() }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick],
  )

  // Der Entwurf lebt hier und nicht in der Seite: die ist waehrend "Stapel"
  // ausgehaengt. Gespeichert wird bei jedem Tastendruck.
  const [entwurf, setEntwurfState] = useState(getEntwurf)
  const setEntwurf = useCallback((e: Entwurf) => {
    setEntwurfState(e)
    speichereEntwurf(e)
  }, [])

  const { stack, push, back } = useHistoryStack<View>(() => [])
  const sichtbar = useSichtbar()

  const [frage] = useIonAlert()
  const [zeigeToast, schliesseToast] = useIonToast()
  const melde = useCallback(
    (message: string) => {
      schliesseToast().catch(() => {})
      zeigeToast({ message, duration: 2200, position: 'top', cssClass: 's-toast', swipeGesture: 'vertical' })
    },
    [zeigeToast, schliesseToast],
  )

  const zumStapel = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    push({ name: 'stapel' })
  }

  const leerenJetzt = () => {
    leeren()
    refresh()
    melde('Stapel geleert')
  }

  const kopieren = async () => {
    const n = daten.notizen.length
    if (!n) return
    if (!(await kopiere(kopierText(daten.notizen)))) {
      melde('Kopieren hat nicht geklappt.')
      return
    }
    frage({
      header: 'Kopiert',
      message: `${anzahl(n)} ${n === 1 ? 'liegt' : 'liegen'} in der Zwischenablage. Jetzt aus dem Stapel löschen?`,
      cssClass: 's-alert',
      buttons: [
        { text: 'Behalten', role: 'cancel' },
        { text: 'Löschen', role: 'destructive', handler: leerenJetzt },
      ],
    })
  }

  const loeschen = () => {
    const n = daten.notizen.length
    frage({
      header: n === 1 ? 'Notiz löschen?' : `Alle ${n} Notizen löschen?`,
      message: 'Bis zum nächsten Leeren lässt sich der Stapel noch einmal zurückholen.',
      cssClass: 's-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Löschen', role: 'destructive', handler: leerenJetzt },
      ],
    })
  }

  const seite = (view: View | null) =>
    view ? (
      <Stapel
        notizen={daten.notizen}
        geleert={daten.geleert}
        onZurueck={back}
        onKopieren={kopieren}
        onLoeschen={loeschen}
        onZurueckholen={() => {
          zurueckholen()
          refresh()
          melde('Zurückgeholt')
        }}
      />
    ) : (
      <Schreiben
        entwurf={entwurf}
        setEntwurf={setEntwurf}
        vorschlaege={daten.titel}
        anzahl={daten.notizen.length}
        onAbgelegt={refresh}
        onStapel={zumStapel}
      />
    )

  return (
    <div className={`stash${sichtbar.tastatur ? ' tastatur' : ''}`} style={sichtbar.style}>
      <PageStage
        className="s-buehne"
        pages={stack}
        rootKey="schreiben"
        pageKey={(v, i) => `${i}:${v.name}`}
        render={seite}
        onBack={back}
      />
    </div>
  )
}

export default Stash
