import { useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { NAME_MAX, sauber } from '../store'
import { FELDER, einheitStandard, formatStoppuhr, inMetern } from '../trainingCalc'
import { formatZahl } from '../util'
import {
  NOTIZ_MAX,
  PAUSE_MAX,
  PAUSE_MIN,
  PAUSE_STANDARD,
  SCHRITTE,
  SCHRITT_STANDARD,
  STANGEN,
  loescheUebung,
  pauseSauber,
  setzeUebung,
  speichereUebung,
  trainiert,
  wirdBenutzt,
} from '../trainingStore'
import { Chips, EINHEIT_TEXT, ERFASSUNG_TEXT, Seite, Stepper, TextKnopf } from '../ui'
import type { Erfassung, FormCtx, StreckenEinheit } from '../types'

// Uebung anlegen oder bearbeiten: Name, was eingetragen wird, mit Strecke
// deren Einheit (km, m, Stockwerke ...), Pause, Notiz - mit Gewicht auch der
// Gewichtsschritt (+/- im Tastenfeld, bei Gewicht x Wdh der Vorschlag fuers
// naechste Gewicht), bei Gewicht x Wdh die Stange fuer den Scheibenrechner.
// Die Erfassung laesst sich nur aendern, solange die Uebung in keinem
// beendeten Training steckt - im laufenden geht es noch (trainingStore.ts,
// passeLaufendAn). Danach wechselt die Einheit nur noch zwischen km und m.
// Trainierte Uebungen werden archiviert statt geloescht - ihr Verlauf bleibt.
function UebungForm({ ctx, id }: { ctx: FormCtx; id?: string }) {
  const { uebungById, back, toRoot, refresh, melde } = ctx
  const alt = id ? uebungById[id] : undefined
  const [name, setName] = useState(alt?.name ?? '')
  const [erfassung, setErfassung] = useState<Erfassung>(alt?.erfassung ?? 'gewicht')
  const [einheit, setEinheit] = useState<StreckenEinheit>(alt?.einheit ?? 'm')
  const [einheitGewaehlt, setEinheitGewaehlt] = useState(false)
  const [pause, setPause] = useState(alt?.pause ?? PAUSE_STANDARD)
  const [notiz, setNotiz] = useState(alt?.notiz ?? '')
  const [schritt, setSchritt] = useState(alt?.schritt ?? SCHRITT_STANDARD)
  const [stange, setStange] = useState<number | null>(alt?.stange ?? null)
  const [benutzt] = useState(() => (alt ? wirdBenutzt(alt.id) : false))
  const [gesperrt] = useState(() => (alt ? trainiert(alt.id) : false))
  const [frage] = useIonAlert()
  const kannSichern = sauber(name, NAME_MAX) !== ''

  // km oder m folgt der Erfassung, solange keine Einheit gewaehlt ist - Stockwerke & Co. bleiben.
  const waehleErfassung = (e: Erfassung) => {
    setErfassung(e)
    if (!einheitGewaehlt && inMetern(einheit)) setEinheit(einheitStandard(e))
  }

  const sichern = () => {
    const u = speichereUebung({ name, erfassung, einheit, pause, notiz, schritt, stange }, alt?.id)
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
          <Chips optionen={ERFASSUNG_TEXT} wert={erfassung} aus={(e) => gesperrt && e !== erfassung} onWahl={waehleErfassung} />
        </div>

        {FELDER[erfassung].includes('m') ? (
          <div className="f-feld">
            <span className="f-label">Strecke in</span>
            <Chips
              optionen={EINHEIT_TEXT}
              wert={einheit}
              aus={(e) => gesperrt && e !== einheit && !(inMetern(e) && inMetern(einheit))}
              onWahl={(e) => {
                setEinheit(e)
                setEinheitGewaehlt(true)
              }}
            />
          </div>
        ) : null}

        {FELDER[erfassung].includes('kg') ? (
          <div className="f-feld">
            <span className="f-label">Gewichtsschritt</span>
            <div className="f-chips">
              {SCHRITTE.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`f-chip${schritt === x ? ' an' : ''}`}
                  aria-pressed={schritt === x}
                  onClick={() => setSchritt(x)}
                >
                  {formatZahl(x)} kg
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {erfassung === 'gewicht' ? (
          <div className="f-feld">
            <span className="f-label">Langhantel (Scheibenrechner)</span>
            <div className="f-chips">
              <button type="button" className={`f-chip${stange === null ? ' an' : ''}`} aria-pressed={stange === null} onClick={() => setStange(null)}>
                Nein
              </button>
              {STANGEN.map((x) => (
                <button
                  key={x}
                  type="button"
                  className={`f-chip${stange === x ? ' an' : ''}`}
                  aria-pressed={stange === x}
                  onClick={() => setStange(x)}
                >
                  {x} kg
                </button>
              ))}
            </div>
          </div>
        ) : null}

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
          <span className="f-label">Notiz · steht im Training bei der Übung</span>
          <textarea value={notiz} maxLength={NOTIZ_MAX} rows={3} onChange={(e) => setNotiz(e.target.value)} />
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
