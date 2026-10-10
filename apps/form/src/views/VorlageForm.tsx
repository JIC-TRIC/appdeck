import { useState } from 'react'
import { IonReorder, IonReorderGroup, useIonAlert } from '@ionic/react'
import { IconGriff, IconPlus, IconX } from '../icons'
import { NAME_MAX, sauber } from '../store'
import { formatBereich } from '../trainingCalc'
import { AUFWAERMEN_MAX, SAETZE_MAX, WDH_MAX, loescheVorlage, speichereVorlage } from '../trainingStore'
import { Blatt, Seite, Stepper, TextKnopf } from '../ui'
import { Hinzufuegen } from './Hinzufuegen'
import type { FormCtx, VorlagenUebung } from '../types'

const chipText = (v: VorlagenUebung) => {
  const b = formatBereich(v)
  const arbeit = b ? `${v.saetze} × ${b}` : `${v.saetze} ${v.saetze === 1 ? 'Satz' : 'Sätze'}`
  return v.aufwaermen ? `${v.aufwaermen}A + ${arbeit}` : arbeit
}

// Vorlage anlegen oder bearbeiten: Name und Uebungen, pro Uebung Satzzahl,
// Aufwaermsaetze und Wdh-Bereich (ein Tipp auf "3 × 8–12", "1A" = ein
// Aufwaermsatz). Am Griff ziehen zum Sortieren.
// Erst "Sichern" schreibt.
function VorlageForm({ ctx, id }: { ctx: FormCtx; id?: string }) {
  const { vorlagen, uebungById, back, refresh, melde } = ctx
  const alt = id ? vorlagen.find((v) => v.id === id) : undefined
  const [name, setName] = useState(alt?.name ?? '')
  const [liste, setListe] = useState<VorlagenUebung[]>(alt?.uebungen ?? [])
  const [wahl, setWahl] = useState<number | null>(null)
  const [hinzu, setHinzu] = useState(false)
  const [frage] = useIonAlert()

  const aendere = (i: number, a: Partial<VorlagenUebung>) => setListe((l) => l.map((x, j) => (j === i ? { ...x, ...a } : x)))

  const sichern = () => {
    const v = speichereVorlage({ name, uebungen: liste }, alt?.id)
    if (!v) return
    refresh()
    back()
    melde(alt ? 'Gespeichert' : `${v.name} angelegt`)
  }

  const loeschen = () => {
    if (!alt) return
    frage({
      header: `${alt.name} löschen?`,
      message: 'Die Trainings damit bleiben.',
      cssClass: 'f-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            loescheVorlage(alt.id)
            refresh()
            back()
            melde(`${alt.name} gelöscht`)
          },
        },
      ],
    })
  }

  // Wdh-Bereich: "–" heisst keiner. Plus von dort startet bei 8 bzw. 12.
  const schritt = (wert: number | null, vz: 1 | -1, start: number) => {
    if (wert === null) return vz > 0 ? start : null
    const neu = wert + vz
    return neu < 1 ? null : Math.min(WDH_MAX, neu)
  }

  return (
    <>
      <Seite
        links={<TextKnopf onClick={back}>Abbrechen</TextKnopf>}
        titel={alt ? 'Vorlage' : 'Neue Vorlage'}
        rechts={
          <TextKnopf onClick={sichern} stark disabled={!sauber(name, NAME_MAX)}>
            Sichern
          </TextKnopf>
        }
      >
        <div className="f-felder">
          <label className="f-feld">
            <span className="f-label">Name</span>
            <input type="text" value={name} maxLength={NAME_MAX} autoComplete="off" onChange={(e) => setName(e.target.value)} />
          </label>
        </div>

        <h2 className="f-h2">Übungen</h2>
        <div className="f-gruppe">
          <IonReorderGroup
            className="f-ordnen"
            disabled={false}
            onIonReorderEnd={(e) => setListe(e.detail.complete(liste) as VorlagenUebung[])}
          >
            {liste.map((v, i) => (
              <div key={`${v.uebung}:${i}`} className="f-vz">
                <IonReorder>
                  <span className="f-griff" aria-label="Verschieben">
                    <IconGriff />
                  </span>
                </IonReorder>
                <button type="button" className="f-vz-name" onClick={() => setWahl(i)}>
                  {uebungById[v.uebung]?.name ?? 'Übung'}
                </button>
                <button type="button" className="f-vz-chip" onClick={() => setWahl(i)}>
                  {chipText(v)}
                </button>
              </div>
            ))}
          </IonReorderGroup>
          <button type="button" className="f-plus-zeile" onClick={() => setHinzu(true)}>
            <IconPlus />
            Übung
          </button>
        </div>

        {alt ? (
          <button type="button" className="f-loeschen" onClick={loeschen}>
            Vorlage löschen
          </button>
        ) : null}
      </Seite>

      {wahl !== null && liste[wahl] ? (
        <Blatt label="Sätze und Wdh" onClose={() => setWahl(null)}>
          {(schliessen) => {
            const i = wahl
            const v = liste[i]
            return (
              <>
                <div className="f-sheet-kopf">
                  <div>
                    <b>{uebungById[v.uebung]?.name ?? 'Übung'}</b>
                  </div>
                  <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
                    <IconX />
                  </button>
                </div>
                <div className="f-gruppe">
                  <div className="f-zeile">
                    <span>Sätze</span>
                    <Stepper
                      label="Sätze"
                      text={String(v.saetze)}
                      onMinus={() => aendere(i, { saetze: Math.max(1, v.saetze - 1) })}
                      onPlus={() => aendere(i, { saetze: Math.min(SAETZE_MAX, v.saetze + 1) })}
                      minusAus={v.saetze <= 1}
                      plusAus={v.saetze >= SAETZE_MAX}
                    />
                  </div>
                  <div className="f-zeile">
                    <span>Aufwärmsätze</span>
                    <Stepper
                      label="Aufwärmsätze"
                      text={String(v.aufwaermen)}
                      onMinus={() => aendere(i, { aufwaermen: Math.max(0, v.aufwaermen - 1) })}
                      onPlus={() => aendere(i, { aufwaermen: Math.min(AUFWAERMEN_MAX, v.aufwaermen + 1) })}
                      minusAus={v.aufwaermen <= 0}
                      plusAus={v.aufwaermen >= AUFWAERMEN_MAX}
                    />
                  </div>
                  <div className="f-zeile">
                    <span>Wdh von</span>
                    <Stepper
                      label="Wdh von"
                      text={v.von === null ? '–' : String(v.von)}
                      onMinus={() => aendere(i, { von: schritt(v.von, -1, 8) })}
                      onPlus={() => {
                        const von = schritt(v.von, 1, 8)
                        aendere(i, { von, bis: v.bis !== null && von !== null && von > v.bis ? von : v.bis })
                      }}
                      minusAus={v.von === null}
                    />
                  </div>
                  <div className="f-zeile">
                    <span>Wdh bis</span>
                    <Stepper
                      label="Wdh bis"
                      text={v.bis === null ? '–' : String(v.bis)}
                      onMinus={() => {
                        const bis = schritt(v.bis, -1, 12)
                        aendere(i, { bis, von: v.von !== null && bis !== null && bis < v.von ? bis : v.von })
                      }}
                      onPlus={() => aendere(i, { bis: schritt(v.bis, 1, Math.max(12, v.von ?? 0)) })}
                      minusAus={v.bis === null}
                    />
                  </div>
                </div>
                <div className="f-gruppe">
                  <button
                    type="button"
                    className="f-zeile gefahr"
                    onClick={() => {
                      setListe((l) => l.filter((_, j) => j !== i))
                      schliessen()
                    }}
                  >
                    <span>Aus der Vorlage nehmen</span>
                  </button>
                </div>
              </>
            )
          }}
        </Blatt>
      ) : null}

      {hinzu ? (
        <Hinzufuegen
          ctx={ctx}
          mehrfach
          ohne={liste.map((v) => v.uebung)}
          onWahl={(ids) => setListe((l) => [...l, ...ids.map((u) => ({ uebung: u, saetze: 3, aufwaermen: 0, von: null, bis: null }))])}
          onClose={() => setHinzu(false)}
        />
      ) : null}
    </>
  )
}

export default VorlageForm
