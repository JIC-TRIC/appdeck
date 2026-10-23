import { useState } from 'react'
import { IonReorder, IonReorderGroup } from '@ionic/react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconGriff, IconLeft, IconPlus, IconRight } from '../icons'
import { mitFarbe } from '../ui'
import type { Zaehlung } from '../liste'
import type { Ordner, Reiter } from '../types'

interface Props {
  ordner: Ordner[]
  zaehlung: Zaehlung
  zurueck: string
  /** gleich zum Bearbeiten (⋯ → Ordner verwalten) statt der Karten */
  bearbeiten: boolean
  onZurueck: () => void
  /** Karte angetippt: zu diesem Ordner */
  onOeffnen: (r: Reiter) => void
  onBearbeiten: (id: string) => void
  onNeu: () => void
  onSortiert: (ids: string[]) => void
}

/** Eine Karte: Punkt und Name oben, unten was offen und was faellig ist. */
function Karte({ name, f, offen, faellig, onClick }: { name: string; f?: string; offen: number; faellig: number; onClick: () => void }) {
  return (
    <button type="button" className="t-karte" style={f ? mitFarbe(f) : undefined} onClick={onClick}>
      <span className="k-name">
        {f ? <i /> : null}
        {name}
      </span>
      <span className="k-zahl">
        <b>{offen}</b>
        offen
        {faellig ? <em>{faellig} fällig</em> : null}
      </span>
    </button>
  )
}

// Alle Ordner auf einen Blick: Karten, ein Tipp fuehrt in den Ordner. Bearbeiten
// macht daraus die Liste mit Griffen (Reihenfolge der Reiter und Abschnitte in
// „Alle“), ein Tipp dort oeffnet Name und Farbe.
export function OrdnerSeite({ ordner, zaehlung, zurueck, bearbeiten: anfangs, onZurueck, onOeffnen, onBearbeiten, onNeu, onSortiert }: Props) {
  const [bearbeiten, setBearbeiten] = useState(anfangs)
  const z = zaehlung

  return (
    <div className="t-screen">
      <header className="t-bar">
        <button type="button" className="t-back" onClick={onZurueck}>
          <IconLeft />
          {zurueck}
        </button>
        <span className="t-bar-r">
          <button type="button" className={`t-text-knopf${bearbeiten ? ' stark' : ''}`} onClick={() => setBearbeiten(!bearbeiten)}>
            {bearbeiten ? 'Fertig' : 'Bearbeiten'}
          </button>
        </span>
      </header>
      <div className="t-scroll grau">
        <div className="t-lt">
          <h1>Ordner</h1>
          <p>
            {ordner.length === 1 ? '1 Ordner' : `${ordner.length} Ordner`} · {z.alle} offen
          </p>
        </div>

        {bearbeiten ? (
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
        ) : (
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
        )}
      </div>
    </div>
  )
}
