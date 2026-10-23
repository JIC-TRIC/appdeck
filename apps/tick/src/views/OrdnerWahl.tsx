import { useRef, useState } from 'react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconHaken, IconPlus } from '../icons'
import { Blatt, BlattKopf, mitFarbe } from '../ui'
import { OrdnerBlatt } from './OrdnerBlatt'
import type { Zaehlung } from '../liste'
import type { Ordner } from '../types'

interface Props {
  titel: string
  /** z. B. der Titel des Todos, das verschoben wird */
  unter?: string
  /** der Ordner, in dem es gerade liegt (null = Eingang) */
  aktuell: string | null
  ordner: Ordner[]
  zaehlung: Zaehlung
  onWahl: (ordner: string | null) => void
  onClose: () => void
}

// Eingang und alle Ordner mit Anzahl, der aktuelle mit Haken. „Neuer Ordner …“
// legt an und waehlt ihn gleich.
export function OrdnerWahl({ titel, unter, aktuell, ordner, zaehlung, onWahl, onClose }: Props) {
  const [neu, setNeu] = useState(false)
  const gewaehlt = useRef<{ id: string | null } | null>(null)

  return (
    <Blatt
      label={titel}
      onClose={() => {
        onClose()
        if (gewaehlt.current) onWahl(gewaehlt.current.id)
      }}
    >
      {(schliessen) => {
        const waehle = (id: string | null) => {
          gewaehlt.current = { id }
          schliessen()
        }
        const zeile = (id: string | null, name: string, f: string, n: number) => (
          <button key={id ?? 'eingang'} type="button" className="t-pick" style={mitFarbe(f)} aria-pressed={aktuell === id} onClick={() => waehle(id)}>
            <i />
            {name}
            <small>{n}</small>
            <span className="okc">{aktuell === id ? <IconHaken /> : null}</span>
          </button>
        )
        return (
          <>
            <BlattKopf
              links={
                <button type="button" className="t-text-knopf" onClick={schliessen}>
                  Abbrechen
                </button>
              }
              titel={titel}
              unter={unter}
            />
            <div className="t-picks">
              {zeile(null, 'Eingang', EINGANG_FARBE, zaehlung.eingang)}
              {ordner.map((o) => zeile(o.id, o.name, farbe(o.farbe), zaehlung.je.get(o.id) ?? 0))}
              <button type="button" className="t-pick neu" onClick={() => setNeu(true)}>
                <IconPlus />
                Neuer Ordner …
              </button>
            </div>
            {neu ? (
              <OrdnerBlatt
                ordner={null}
                alle={ordner}
                anzahl={0}
                onClose={() => setNeu(false)}
                onFertig={(o) => waehle(o.id)}
              />
            ) : null}
          </>
        )
      }}
    </Blatt>
  )
}
