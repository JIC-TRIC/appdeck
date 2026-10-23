import { useRef, useState } from 'react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconDown, IconPlus } from '../icons'
import { findeHash, hashVorschlaege, ohneHash } from '../liste'
import { TITEL_MAX } from '../store'
import { DatumChips, fokusBleibt, mitFarbe } from '../ui'
import type { Entwurf, Ordner } from '../types'

interface Props {
  entwurf: Entwurf
  setEntwurf: (e: Entwurf) => void
  ordner: Ordner[]
  heute: string
  tastatur: boolean
  onAnlegen: () => void
  onOrdnerWahl: () => void
}

// Unten in jeder Liste: zu ist es eine Pille mit „Neues Todo“ und dem Ordner,
// in dem es landet. Offen sitzt es ueber der Tastatur, darunter Ordner und
// Datum als Chips. Weiter legt an, das Feld bleibt offen fuer das naechste.
export function Schnellfeld({ entwurf, setEntwurf, ordner, heute, tastatur, onAnlegen, onOrdnerWahl }: Props) {
  const [fokus, setFokus] = useState(false)
  const feld = useRef<HTMLInputElement>(null)
  const ziel = ordner.find((o) => o.id === entwurf.ordner) ?? null
  const name = ziel?.name ?? 'Eingang'
  const offen = fokus || entwurf.titel !== ''
  const hash = offen ? findeHash(entwurf.titel) : null
  const vorschlaege = hash ? hashVorschlaege(ordner, hash.suche) : []

  return (
    <div
      className={`t-add${offen ? ' offen' : ''}${tastatur ? ' tastatur' : ''}`}
      style={mitFarbe(ziel ? farbe(ziel.farbe) : EINGANG_FARBE)}
      // Fokus irgendwo im Schnellfeld (auch im Datumsfeld) haelt es offen.
      onFocus={() => setFokus(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFokus(false)
      }}
    >
      {hash && vorschlaege.length ? (
        <div className="t-hash" aria-label="Ordner wählen">
          <small>Ordner</small>
          {vorschlaege.map((o) => (
            <button
              key={o.id}
              type="button"
              className="t-chip ring"
              style={mitFarbe(farbe(o.farbe))}
              onMouseDown={fokusBleibt}
              onClick={() => setEntwurf({ ...entwurf, ordner: o.id, titel: ohneHash(entwurf.titel, hash) })}
            >
              <i />
              {o.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="t-feld" onClick={() => feld.current?.focus()}>
        {offen ? <span className="t-ck leer" aria-hidden="true" /> : (
          <span className="t-pl" aria-hidden="true">
            <IconPlus />
          </span>
        )}
        <input
          ref={feld}
          value={entwurf.titel}
          onChange={(e) => setEntwurf({ ...entwurf, titel: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAnlegen()
            } else if (e.key === 'Escape') {
              feld.current?.blur()
            }
          }}
          placeholder="Neues Todo"
          aria-label="Neues Todo"
          enterKeyHint="next"
          autoCapitalize="sentences"
          autoComplete="off"
          maxLength={TITEL_MAX}
        />
        {offen ? null : (
          <span className="t-ziel">
            <i />
            {name}
          </span>
        )}
      </div>

      {offen ? (
        <div className="t-chips">
          <button type="button" className="t-chip on" onMouseDown={fokusBleibt} onClick={onOrdnerWahl}>
            <i />
            {name}
            <IconDown />
          </button>
          <DatumChips wert={entwurf.faellig} heute={heute} halten onWahl={(tag) => setEntwurf({ ...entwurf, faellig: tag })} />
        </div>
      ) : null}
    </div>
  )
}
