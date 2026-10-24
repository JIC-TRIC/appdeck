import { useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { IconPlay, IconPlus } from '../icons'
import { naechsteVorlage } from '../trainingCalc'
import { starteTraining } from '../trainingStore'
import { Seite, Zurueck, zumLauncher } from '../ui'
import { dateKey, wieLange } from '../util'
import { WocheKarte, ZielBlatt } from './Woche'
import type { FormCtx, Vorlage } from '../types'

// Startseite des Trainings (Tab "Training"): oben die laufende Woche mit
// Wochenziel und Serie, darunter die Vorlagen - ein Tipp startet sofort, ohne
// Vorschau; unter dem Namen stehen ihre Uebungen, die, die in der Reihenfolge
// dran ist, steht mit "als Nächstes" da - und ein leeres Training. "+" legt
// eine Vorlage an, "Bearbeiten" sortiert und aendert sie. Solange es weder
// Training noch Vorlage gibt, nur der Knopf fuers erste Training und darunter
// "Vorlage anlegen". Ein laufendes Training liegt als Seite darueber
// (Form.tsx) - solange es laeuft, startet hier kein zweites.
function TrainingStart({ ctx }: { ctx: FormCtx }) {
  const { vorlagen, trainings, uebungById, heute, laufend, push, refresh } = ctx
  const [zielOffen, setZielOffen] = useState(false)
  const [frage] = useIonAlert()
  const tagVon = (ms: number) => dateKey(new Date(ms))
  const letztes = trainings[trainings.length - 1]
  const dran = naechsteVorlage(vorlagen, trainings)

  const starte = (v: Vorlage | null) => {
    if (laufend) {
      frage({
        header: `${laufend.name} läuft noch`,
        message: 'Erst beenden, dann geht das nächste los.',
        cssClass: 'f-alert',
        buttons: [
          { text: 'Abbrechen', role: 'cancel' },
          { text: 'Zum Training', handler: () => push({ name: 'laufend' }) },
        ],
      })
      return
    }
    starteTraining(v)
    refresh()
    push({ name: 'laufend' })
  }

  const wann = (v: Vorlage) => {
    for (let i = trainings.length - 1; i >= 0; i -= 1) {
      if (trainings[i].vorlage === v.id) return wieLange(tagVon(trainings[i].start), heute)
    }
    return 'noch nie'
  }

  const ersterStart = !trainings.length && !vorlagen.length && !laufend

  return (
    <Seite
      links={<Zurueck label="Apps" onClick={zumLauncher} />}
      rechts={
        ersterStart ? null : (
          <button type="button" className="f-rund" onClick={() => push({ name: 'vorlageForm' })} aria-label="Neue Vorlage">
            <IconPlus />
          </button>
        )
      }
    >
      <header className="f-kopf">
        {letztes ? <p className="f-kicker">Zuletzt trainiert {wieLange(tagVon(letztes.start), heute)}</p> : null}
        <h1 className="f-marke">
          Form<span>.</span>
        </h1>
      </header>

      {ersterStart ? (
        <div className="f-leer">
          <p className="f-leer-t">Erstes Training?</p>
          <button type="button" className="f-haupt" onClick={() => starte(null)}>
            Training starten
          </button>
          <button type="button" className="f-textlink f-link-mitte" onClick={() => push({ name: 'vorlageForm' })}>
            Vorlage anlegen
          </button>
        </div>
      ) : (
        <>
          <WocheKarte ctx={ctx} onClick={() => setZielOffen(true)} />

          {vorlagen.length ? (
            <>
              <div className="f-h2-zeile">
                <h2 className="f-h2">Vorlagen</h2>
                <button type="button" className="f-textlink" onClick={() => push({ name: 'vorlagen' })}>
                  Bearbeiten
                </button>
              </div>
              {vorlagen.map((v) => {
                const namen = v.uebungen.map((x) => uebungById[x.uebung]?.name).filter(Boolean)
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={`f-vorlage${v.id === dran ? ' dran' : ''}`}
                    onClick={() => starte(v)}
                    aria-label={`${v.name} starten`}
                  >
                    <span className="f-vorlage-text">
                      <span className="f-vorlage-name">{v.name}</span>
                      {namen.length ? <small className="f-vorlage-uebungen">{namen.join(' · ')}</small> : null}
                    </span>
                    {v.id === dran ? <small className="f-dran">als Nächstes</small> : <small>{wann(v)}</small>}
                    <span className="f-play">
                      <IconPlay />
                    </span>
                  </button>
                )
              })}
            </>
          ) : null}

          <button type="button" className="f-leerbtn" onClick={() => starte(null)}>
            <IconPlus />
            Leeres Training
          </button>
        </>
      )}

      {zielOffen ? <ZielBlatt ctx={ctx} onClose={() => setZielOffen(false)} /> : null}
    </Seite>
  )
}

export default TrainingStart
