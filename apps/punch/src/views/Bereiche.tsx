import { useState } from 'react'
import { IonReorder, IonReorderGroup } from '@ionic/react'
import { farbe } from '../farben'
import { Bon, IconGriff, Kopf, mitFarbe, Strich, Zurueck } from '../ui'
import type { Bereich } from '../types'

interface Props {
  bereiche: Bereich[]
  zurueck: string
  onZurueck: () => void
  onBearbeiten: (id: string) => void
  onNeu: () => void
  onSortiert: (ids: string[]) => void
}

// Alle Bereiche als Bon. Ziehen am Griff sortiert, so stehen auch die Knoepfe
// auf dem Start. Archivierte sind eingeklappt.
export function Bereiche({ bereiche, zurueck, onZurueck, onBearbeiten, onNeu, onSortiert }: Props) {
  const [archivOffen, setArchivOffen] = useState(false)
  const aktiv = bereiche.filter((b) => !b.archiviert)
  const archiv = bereiche.filter((b) => b.archiviert)

  const zeile = (b: Bereich) => (
    <button type="button" className="p-li-knopf" onClick={() => onBearbeiten(b.id)}>
      <i style={mitFarbe(farbe(b.farbe))} />
      {b.name}
    </button>
  )

  return (
    <div className="p-seite">
      <Kopf links={<Zurueck label={zurueck} onClick={onZurueck} />} mitte="Bereiche" />
      <div className="p-scroll">
        <Bon>
          <IonReorderGroup disabled={false} onIonReorderEnd={(e) => onSortiert(e.detail.complete(aktiv.map((b) => b.id)) as string[])}>
            {aktiv.map((b) => (
              <div key={b.id} className="p-li">
                {zeile(b)}
                <IonReorder>
                  <span className="p-griff" aria-label={`${b.name} verschieben`}>
                    <IconGriff />
                  </span>
                </IonReorder>
              </div>
            ))}
          </IonReorderGroup>
          <button type="button" className="p-nach" onClick={onNeu}>
            + Bereich
          </button>
          {archiv.length ? (
            <>
              <Strich />
              <button type="button" className="p-nach" aria-expanded={archivOffen} onClick={() => setArchivOffen(!archivOffen)}>
                {archivOffen ? '−' : '+'} Archiviert ({archiv.length})
              </button>
              {archivOffen
                ? archiv.map((b) => (
                    <div key={b.id} className="p-li archiv">
                      {zeile(b)}
                    </div>
                  ))
                : null}
            </>
          ) : null}
        </Bon>
      </div>
    </div>
  )
}
