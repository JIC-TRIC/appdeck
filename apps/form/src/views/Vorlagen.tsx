import { IonReorder, IonReorderGroup } from '@ionic/react'
import { IconGriff, IconPlus, IconRight } from '../icons'
import { ordneVorlagen } from '../trainingStore'
import { Seite, Zurueck } from '../ui'
import type { FormCtx, Vorlage } from '../types'

// Die Vorlagen sortieren (am Griff ziehen, gespeichert beim Loslassen),
// ein Tipp oeffnet eine zum Bearbeiten.
function Vorlagen({ ctx }: { ctx: FormCtx }) {
  const { vorlagen, push, back, refresh } = ctx

  return (
    <Seite
      links={<Zurueck label="Training" onClick={back} />}
      titel="Vorlagen"
      rechts={
        <button type="button" className="f-rund" onClick={() => push({ name: 'vorlageForm' })} aria-label="Neue Vorlage">
          <IconPlus />
        </button>
      }
    >
      {vorlagen.length ? (
        <IonReorderGroup
          className="f-gruppe f-ordnen"
          disabled={false}
          onIonReorderEnd={(e) => {
            const liste = e.detail.complete(vorlagen) as Vorlage[]
            ordneVorlagen(liste.map((v) => v.id))
            refresh()
          }}
        >
          {vorlagen.map((v) => (
            <div key={v.id} className="f-zeile f-zeile-griff">
              <IonReorder>
                <span className="f-griff" aria-label={`${v.name} verschieben`}>
                  <IconGriff />
                </span>
              </IonReorder>
              <button type="button" className="f-zeile-knopf" onClick={() => push({ name: 'vorlageForm', id: v.id })}>
                <span>{v.name}</span>
                <span className="f-zeile-r">
                  {v.uebungen.length} {v.uebungen.length === 1 ? 'Übung' : 'Übungen'}
                  <IconRight />
                </span>
              </button>
            </div>
          ))}
        </IonReorderGroup>
      ) : (
        <p className="f-leer-t f-leer-klein">Noch keine Vorlage.</p>
      )}
    </Seite>
  )
}

export default Vorlagen
