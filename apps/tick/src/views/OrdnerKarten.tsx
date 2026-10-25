import { IonReorder, IonReorderGroup } from '@ionic/react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconGriff, IconPlus, IconRight } from '../icons'
import { mitFarbe } from '../ui'
import type { Zaehlung } from '../liste'
import type { Ordner } from '../types'

/**
 * Eine Karte: Punkt und Name oben, unten was offen und was faellig ist. Oben
 * ein Strich in der Ordnerfarbe. Ohne onClick nur zum Ansehen (Vorschau im Blatt).
 */
export function Karte({
  name,
  f,
  offen,
  faellig,
  onClick,
}: {
  name: string
  f?: string
  offen: number
  faellig: number
  onClick?: () => void
}) {
  const inhalt = (
    <>
      <span className="k-name">
        {f ? <i /> : null}
        {name}
      </span>
      <span className="k-zahl">
        <b>{offen}</b>
        offen
        {faellig ? <em>{faellig} fällig</em> : null}
      </span>
    </>
  )
  return onClick ? (
    <button type="button" className="t-karte" style={f ? mitFarbe(f) : undefined} onClick={onClick}>
      {inhalt}
    </button>
  ) : (
    <div className="t-karte" style={f ? mitFarbe(f) : undefined}>
      {inhalt}
    </div>
  )
}

// Die Startseite: Alle, Eingang (wenn darin etwas liegt) und jeder Ordner als
// Karte, zwei nebeneinander. Ein Tipp oeffnet die Liste als eigene Seite.
export function OrdnerKarten({
  ordner,
  zaehlung: z,
  onOeffnen,
  onNeu,
}: {
  ordner: Ordner[]
  zaehlung: Zaehlung
  onOeffnen: (ansicht: string) => void
  onNeu: () => void
}) {
  return (
    <div className="t-karten">
      <Karte name="Alle" offen={z.alle} faellig={z.faellig} onClick={() => onOeffnen('alle')} />
      {z.eingang > 0 ? (
        <Karte name="Eingang" f={EINGANG_FARBE} offen={z.eingang} faellig={z.faelligEingang} onClick={() => onOeffnen('eingang')} />
      ) : null}
      {ordner.map((o) => (
        <Karte
          key={o.id}
          name={o.name}
          f={farbe(o.farbe)}
          offen={z.je.get(o.id) ?? 0}
          faellig={z.faelligJe.get(o.id) ?? 0}
          onClick={() => onOeffnen(o.id)}
        />
      ))}
      <button type="button" className="t-karte neu" onClick={onNeu}>
        <IconPlus />
        Neuer Ordner
      </button>
    </div>
  )
}

// Ordner bearbeiten (⋯ auf der Startseite): der Eingang fuer sich, darunter alle
// Ordner mit Griff. Die Reihenfolge hier ist die der Karten und der Abschnitte
// in „Alle“. Ein Tipp oeffnet Name und Farbe.
export function OrdnerVerwalten({
  ordner,
  zaehlung: z,
  onBearbeiten,
  onNeu,
  onSortiert,
}: {
  ordner: Ordner[]
  zaehlung: Zaehlung
  onBearbeiten: (id: string) => void
  onNeu: () => void
  onSortiert: (ids: string[]) => void
}) {
  return (
    <>
      <div className="t-ig">
        <div className="t-li" style={mitFarbe(EINGANG_FARBE)}>
          <span className="dot" />
          Eingang
          <span className="v">{z.eingang}</span>
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
                  {z.je.get(o.id) ?? 0}
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
    </>
  )
}
