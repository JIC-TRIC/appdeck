import { IonReorder, IonReorderGroup } from '@ionic/react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconGriff, IconLeft, IconPlus, IconRight } from '../icons'
import { mitFarbe } from '../ui'
import type { Zaehlung } from '../liste'
import type { Ordner } from '../types'

interface Props {
  ordner: Ordner[]
  zaehlung: Zaehlung
  zurueck: string
  onZurueck: () => void
  onBearbeiten: (id: string) => void
  onNeu: () => void
  onSortiert: (ids: string[]) => void
}

// Ordner verwalten: der Eingang fuer sich, darunter alle Ordner mit Griff.
// Die Reihenfolge hier ist die der Reiter und der Abschnitte in „Alle“.
export function OrdnerSeite({ ordner, zaehlung, zurueck, onZurueck, onBearbeiten, onNeu, onSortiert }: Props) {
  return (
    <div className="t-screen">
      <header className="t-bar">
        <button type="button" className="t-back" onClick={onZurueck}>
          <IconLeft />
          {zurueck}
        </button>
      </header>
      <div className="t-scroll grau">
        <div className="t-lt">
          <h1>Ordner</h1>
          <p>
            {ordner.length === 1 ? '1 Ordner' : `${ordner.length} Ordner`} · {zaehlung.alle} offen
          </p>
        </div>

        <div className="t-ig">
          <div className="t-li" style={mitFarbe(EINGANG_FARBE)}>
            <span className="dot" />
            Eingang
            <span className="v">{zaehlung.eingang}</span>
          </div>
        </div>

        {ordner.length ? (
          <IonReorderGroup
            className="t-ig"
            disabled={false}
            onIonReorderEnd={(e) => onSortiert(e.detail.complete(ordner.map((o) => o.id)) as string[])}
          >
            {ordner.map((o) => (
              <div key={o.id} className="t-li" style={mitFarbe(farbe(o.farbe))}>
                <button type="button" className="t-li-knopf" onClick={() => onBearbeiten(o.id)}>
                  <span className="dot" />
                  {o.name}
                  <span className="v">
                    {zaehlung.je.get(o.id) ?? 0}
                    <IconRight />
                  </span>
                </button>
                <IonReorder>
                  <span className="t-griff" aria-label={`${o.name} verschieben`}>
                    <IconGriff />
                  </span>
                </IonReorder>
              </div>
            ))}
          </IonReorderGroup>
        ) : null}

        <div className="t-ig">
          <button type="button" className="t-li neu" onClick={onNeu}>
            <IconPlus />
            Neuer Ordner
          </button>
        </div>
      </div>
    </div>
  )
}
