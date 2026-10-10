import { useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { NAME_MAX, sauber } from '../store'
import { formatStoppuhr } from '../trainingCalc'
import {
  NOTIZ_MAX,
  PAUSE_MAX,
  PAUSE_MIN,
  PAUSE_STANDARD,
  loescheUebung,
  pauseSauber,
  setzeUebung,
  speichereUebung,
  wirdBenutzt,
} from '../trainingStore'
import { Seite, Stepper, TextKnopf } from '../ui'
import type { Erfassung, FormCtx } from '../types'

const ERFASSUNGEN: { id: Erfassung; label: string }[] = [
  { id: 'gewicht', label: 'Gewicht × Wdh' },
  { id: 'wdh', label: 'Nur Wdh' },
  { id: 'zeit', label: 'Zeit' },
]

// Uebung anlegen oder bearbeiten: Name, was eingetragen wird, Pause, Notiz.
// Die Erfassung laesst sich nur aendern, solange die Uebung nie trainiert
// wurde. Trainierte Uebungen werden archiviert statt geloescht - ihr Verlauf
// bleibt.
function UebungForm({ ctx, id }: { ctx: FormCtx; id?: string }) {
  const { uebungById, back, toRoot, refresh, melde } = ctx
  const alt = id ? uebungById[id] : undefined
  const [name, setName] = useState(alt?.name ?? '')
  const [erfassung, setErfassung] = useState<Erfassung>(alt?.erfassung ?? 'gewicht')
  const [pause, setPause] = useState(alt?.pause ?? PAUSE_STANDARD)
  const [notiz, setNotiz] = useState(alt?.notiz ?? '')
  const [benutzt] = useState(() => (alt ? wirdBenutzt(alt.id) : false))
  const [frage] = useIonAlert()
  const kannSichern = sauber(name, NAME_MAX) !== ''

  const sichern = () => {
    const u = speichereUebung({ name, erfassung, pause, notiz }, alt?.id)
    if (!u) return
    refresh()
    back()
    melde(alt ? 'Gespeichert' : `${u.name} angelegt`)
  }

  const archivieren = () => {
    if (!alt) return
    setzeUebung(alt.id, { archiviert: !alt.archiviert })
    refresh()
    back()
    melde(alt.archiviert ? `${alt.name} ist zurück` : `${alt.name} archiviert`)
  }

  const loeschen = () => {
    if (!alt) return
    frage({
      header: `${alt.name} löschen?`,
      message: 'Sie fliegt auch aus den Vorlagen.',
      cssClass: 'f-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            if (!loescheUebung(alt.id)) return
            refresh()
            toRoot()
            melde(`${alt.name} gelöscht`)
          },
        },
      ],
    })
  }

  return (
    <Seite
      links={<TextKnopf onClick={back}>Abbrechen</TextKnopf>}
      titel={alt ? 'Übung' : 'Neue Übung'}
      rechts={
        <TextKnopf onClick={sichern} stark disabled={!kannSichern}>
          Sichern
        </TextKnopf>
      }
    >
      <div className="f-felder">
        <label className="f-feld">
          <span className="f-label">Name</span>
          <input type="text" value={name} maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="f-feld">
          <span className="f-label">Was trägst du ein?</span>
          <div className="f-chips">
            {ERFASSUNGEN.map((e) => (
              <button
                key={e.id}
                type="button"
                className={`f-chip${erfassung === e.id ? ' an' : ''}`}
                aria-pressed={erfassung === e.id}
                disabled={benutzt && erfassung !== e.id}
                onClick={() => setErfassung(e.id)}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="f-feld quer">
          <span className="f-label">Pause</span>
          <Stepper
            label="Pause"
            text={formatStoppuhr(pause)}
            onMinus={() => setPause((p) => pauseSauber(p - 15))}
            onPlus={() => setPause((p) => pauseSauber(p + 15))}
            minusAus={pause <= PAUSE_MIN}
            plusAus={pause >= PAUSE_MAX}
          />
        </div>

        <label className="f-feld">
          <span className="f-label">Notiz</span>
          <input type="text" value={notiz} maxLength={NOTIZ_MAX} autoComplete="off" onChange={(e) => setNotiz(e.target.value)} />
        </label>
      </div>

      {alt ? (
        benutzt ? (
          <button type="button" className="f-loeschen neutral" onClick={archivieren}>
            {alt.archiviert ? 'Zurückholen' : 'Archivieren'}
          </button>
        ) : (
          <button type="button" className="f-loeschen" onClick={loeschen}>
            Übung löschen
          </button>
        )
      ) : null}
    </Seite>
  )
}

export default UebungForm
