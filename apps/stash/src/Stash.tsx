import { useCallback, useMemo, useState } from 'react'
import { useIonAlert, useIonToast } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import Schreiben from './views/Schreiben'
import Stapel from './views/Stapel'
import { kopiere } from './kopieren'
import { pruefe, REPO_VORSCHLAG, sende } from './senden'
import { useSichtbar } from './sichtbar'
import {
  getEntwurf,
  getGeleert,
  getInbox,
  getNotizen,
  getTitel,
  leeren,
  normalisiereInbox,
  speichereEntwurf,
  speichereInbox,
  zurueckholen,
} from './store'
import { anzahl, kopierText } from './text'
import type { Entwurf, Inbox, View } from './types'

// Zwei Seiten: Schreiben (Start) und Stapel. Seitenwechsel mit Zurueckwischen
// wie Kontor und Piano (lib/PageStage.tsx, lib/useHistoryStack.ts).
function Stash() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])
  const daten = useMemo(
    () => ({ notizen: getNotizen(), titel: getTitel(), geleert: getGeleert(), inbox: getInbox() }),
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

  // Senden: der ganze Stapel als eine Datei in die Inbox, danach ist er leer
  // (zurueckholen geht wie nach dem Loeschen). Ohne Inbox erst einrichten.
  const [sendet, setSendet] = useState(false)
  const senden = async (inbox: Inbox | null = daten.inbox) => {
    const notizen = daten.notizen
    if (!notizen.length || sendet) return
    if (!inbox) return einrichten(true)
    setSendet(true)
    const r = await sende(inbox, notizen)
    setSendet(false)
    if (!r.ok) return melde(`Nicht gesendet: ${r.meldung}`)
    leeren(Date.now(), new Set(notizen.map((n) => n.id)))
    refresh()
    melde(`${anzahl(notizen.length)} gesendet`)
  }

  const einrichten = (dannSenden = false) => {
    const bisher = daten.inbox
    frage({
      header: 'Senden an GitHub',
      message: 'Privates Repo und ein Fine-grained Token nur für dieses Repo (Contents: Read and write).',
      cssClass: 's-alert',
      inputs: [
        {
          name: 'repo',
          value: bisher?.repo ?? REPO_VORSCHLAG,
          placeholder: 'besitzer/repo',
          attributes: { autocapitalize: 'off', autocorrect: 'off', spellcheck: false },
        },
        {
          name: 'token',
          type: 'password',
          value: bisher?.token ?? '',
          placeholder: 'github_pat_…',
          attributes: { autocomplete: 'off' },
        },
      ],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        ...(bisher
          ? [
              {
                text: 'Entfernen',
                role: 'destructive',
                handler: () => {
                  speichereInbox(null)
                  refresh()
                  melde('Token entfernt')
                },
              },
            ]
          : []),
        {
          text: dannSenden ? 'Speichern und senden' : 'Speichern',
          handler: (werte: unknown) => {
            const inbox = normalisiereInbox(werte)
            if (!inbox) {
              melde('Repo als besitzer/name und den Token eintragen.')
              return false
            }
            speichereInbox(inbox)
            refresh()
            if (dannSenden) void senden(inbox)
            else
              void pruefe(inbox).then((r) =>
                melde(r.ok ? `Verbunden mit ${inbox.repo}` : `Nicht verbunden: ${r.meldung}`),
              )
          },
        },
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
        sendet={sendet}
        onZurueck={back}
        onSenden={() => void senden()}
        onKopieren={kopieren}
        onLoeschen={loeschen}
        onEinrichten={() => einrichten()}
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
        notizen={daten.notizen}
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
