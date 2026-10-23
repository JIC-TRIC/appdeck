import { useRef, useState } from 'react'
import { FARBEN, farbe as farbWert } from '../farben'
import { IconHaken } from '../icons'
import { NAME_MAX, naechsteFarbe, ordnerAendern, ordnerAnlegen, pruefeName, saubererName } from '../store'
import { Blatt, BlattKopf, mitFarbe } from '../ui'
import type { Ordner } from '../types'

interface Props {
  /** null = neuer Ordner */
  ordner: Ordner | null
  alle: Ordner[]
  /** offene Todos darin - fuer die Vorschau des Reiters */
  anzahl: number
  onClose: () => void
  /** nach dem Schliessen, mit dem angelegten oder geaenderten Ordner */
  onFertig?: (o: Ordner) => void
  onLoeschen?: (o: Ordner) => void
}

// Name und eine von zehn Farben, darunter der Reiter, wie er oben stehen wird.
export function OrdnerBlatt({ ordner, alle, anzahl, onClose, onFertig, onLoeschen }: Props) {
  const neu = ordner === null
  const [name, setName] = useState(ordner?.name ?? '')
  const [farbe, setFarbe] = useState(ordner?.farbe ?? naechsteFarbe(alle))
  const [versucht, setVersucht] = useState(false)
  const ergebnis = useRef<Ordner | null>(null)
  const nachher = useRef<(() => void) | null>(null)
  const fehler = pruefeName(name, alle, ordner?.id)
  // „Gibt es schon“ sofort zeigen, den leeren Namen erst nach dem ersten Versuch.
  const zeigeFehler = fehler && (versucht || name.trim() !== '')

  return (
    <Blatt
      label={neu ? 'Neuer Ordner' : 'Ordner'}
      onClose={() => {
        onClose()
        if (ergebnis.current) onFertig?.(ergebnis.current)
        nachher.current?.()
      }}
    >
      {(schliessen) => {
        const sichern = () => {
          setVersucht(true)
          if (fehler) return
          if (!ordner) ergebnis.current = ordnerAnlegen(name, farbe)
          else if (ordnerAendern(ordner.id, name, farbe)) ergebnis.current = { ...ordner, name: saubererName(name), farbe }
          schliessen()
        }
        return (
          <>
            <BlattKopf
              links={
                <button type="button" className="t-text-knopf" onClick={schliessen}>
                  Abbrechen
                </button>
              }
              titel={neu ? 'Neuer Ordner' : 'Ordner'}
              rechts={
                <button type="button" className="t-text-knopf stark" onClick={sichern} disabled={!!fehler && versucht}>
                  {neu ? 'Anlegen' : 'Fertig'}
                </button>
              }
            />
            <input
              className="t-fld"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  sichern()
                }
              }}
              placeholder="Name"
              aria-label="Name des Ordners"
              maxLength={NAME_MAX}
              enterKeyHint="done"
              autoCapitalize="sentences"
              autoComplete="off"
            />
            {zeigeFehler ? <p className="t-fehler">{fehler}</p> : null}

            <h3 className="t-sec-l">Farbe</h3>
            <div className="t-swg" role="radiogroup" aria-label="Farbe">
              {FARBEN.map((f, i) => (
                <button
                  key={f.name}
                  type="button"
                  role="radio"
                  aria-checked={farbe === i}
                  aria-label={f.name}
                  className={farbe === i ? 'sel' : ''}
                  style={mitFarbe(f.wert)}
                  onClick={() => setFarbe(i)}
                >
                  {farbe === i ? <IconHaken /> : null}
                </button>
              ))}
            </div>

            <h3 className="t-sec-l">Vorschau</h3>
            <div className="t-prev" aria-hidden="true">
              <div className="t-tr">
                <span className="t-tab on" style={mitFarbe(farbWert(farbe))}>
                  <i />
                  {name.trim() || 'Name'}
                  <small>{anzahl}</small>
                </span>
              </div>
              <div className="t-prev-blatt" />
            </div>

            {ordner && onLoeschen ? (
              <button
                type="button"
                className="t-gefahr"
                onClick={() => {
                  // Erst zu, dann die Rueckfrage - zwei Blaetter uebereinander waeren zu viel.
                  nachher.current = () => onLoeschen(ordner)
                  schliessen()
                }}
              >
                Ordner löschen
              </button>
            ) : null}
          </>
        )
      }}
    </Blatt>
  )
}
