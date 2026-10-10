import { useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { abweichung, formatDauer, formatSatz, formatTausend, rekordeIn, statistik, vorlageAus, type RekordArt } from '../trainingCalc'
import { speichereTraining, speichereVorlage } from '../trainingStore'
import { Seite } from '../ui'
import type { FormCtx } from '../types'

const ART: Record<RekordArt, string> = {
  gewicht: 'schwerster Satz',
  '1rm': 'bestes 1RM',
  wdh: 'meiste Wdh',
  zeit: 'längste Zeit',
}

// Nach "Beenden": Dauer, Saetze, Volumen, die Rekorde - und wenn das Training
// von seiner Vorlage abwich, die Frage, ob sie mitgehen soll. Ein leeres
// Training laesst sich hier als Vorlage speichern.
function Fertig({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { trainings, vorlagen, uebungById, refresh, back, melde } = ctx
  const [erledigt, setErledigt] = useState(false)
  const [frage] = useIonAlert()
  const t = trainings.find((x) => x.id === id)
  if (!t) return <Seite>{null}</Seite>

  const st = statistik(t, uebungById)
  const rekorde = rekordeIn(t, trainings, uebungById)
  const vorlage = t.vorlage ? vorlagen.find((v) => v.id === t.vorlage) : undefined
  const abw = vorlage ? abweichung(t, vorlage) : null
  const namen = (ids: string[]) => {
    const n = ids.map((x) => uebungById[x]?.name ?? 'Übung')
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} und ${n[n.length - 1]}` : n[0]
  }

  let warum = ''
  if (abw) {
    const teile: string[] = []
    if (abw.fehlt.length) teile.push(`${namen(abw.fehlt)} ${abw.fehlt.length > 1 ? 'fehlten' : 'fehlte'}`)
    if (abw.neu.length) teile.push(`${namen(abw.neu)} ${abw.neu.length > 1 ? 'kamen' : 'kam'} dazu`)
    warum = teile.length ? `${teile.join(', ')}.` : 'Andere Sätze oder Reihenfolge.'
  }

  const anpassen = () => {
    if (!vorlage) return
    speichereVorlage({ name: vorlage.name, uebungen: vorlageAus(t, vorlage.uebungen) }, vorlage.id)
    refresh()
    setErledigt(true)
    melde(`${vorlage.name} angepasst`)
  }

  const alsVorlage = () =>
    frage({
      header: 'Als Vorlage speichern',
      cssClass: 'f-alert',
      inputs: [{ name: 'name', type: 'text', placeholder: 'Name, z. B. Push', attributes: { maxlength: 40, autocapitalize: 'words' } }],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Speichern',
          handler: (d: { name?: string }) => {
            const v = speichereVorlage({ name: d.name ?? '', uebungen: vorlageAus(t) })
            if (!v) return false
            // Ab jetzt gehoert das Training zur Vorlage - beim naechsten Mal
            // steht grau, was heute war.
            speichereTraining({ ...t, vorlage: v.id, name: v.name })
            refresh()
            setErledigt(true)
            melde(`${v.name} gespeichert`)
            return true
          },
        },
      ],
    })

  return (
    <Seite
      unten={
        <button type="button" className="f-haupt" onClick={back}>
          Fertig
        </button>
      }
    >
      <header className="f-kopf">
        <p className="f-kicker">Training beendet</p>
        <h1 className="f-h1">{t.name}</h1>
      </header>
      <p className="f-statzeile">
        {formatDauer(st.dauer)} · {st.saetze} {st.saetze === 1 ? 'Satz' : 'Sätze'}
        {st.volumen > 0 ? ` · ${formatTausend(st.volumen)} kg` : ''}
      </p>

      {rekorde.length ? (
        <>
          <h2 className="f-h2">Rekorde</h2>
          <div className="f-gruppe">
            {rekorde.map((r) => {
              const u = uebungById[r.uebung]
              return (
                <div key={`${r.ui}:${r.si}`} className="f-rek">
                  <div>
                    <b>{u?.name ?? 'Übung'}</b>
                    <small>{ART[r.art]}</small>
                  </div>
                  <em>{formatSatz(r.satz, u?.erfassung ?? 'gewicht')}</em>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {!erledigt && (abw || !vorlage) ? (
        <>
          <h2 className="f-h2">Vorlage</h2>
          <div className="f-karte-flach">
            {vorlage ? (
              <>
                <p className="f-frage">
                  {vorlage.name} anpassen?
                  <small>{warum}</small>
                </p>
                <div className="f-zwei">
                  <button type="button" className="f-knopf" onClick={() => setErledigt(true)}>
                    So lassen
                  </button>
                  <button type="button" className="f-knopf stark" onClick={anpassen}>
                    Anpassen
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="f-frage">
                  Beim nächsten Mal genauso?
                  <small>Als Vorlage startet es mit diesen Übungen und Sätzen.</small>
                </p>
                <button type="button" className="f-knopf stark" onClick={alsVorlage}>
                  Als Vorlage speichern
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </Seite>
  )
}

export default Fertig
