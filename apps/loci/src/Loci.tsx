import { useCallback, useState, type ComponentType } from 'react'
import { IconKalender, IconKarten, IconMal, IconPi } from './icons'
import { getEinstellungen, setEinstellungen } from './store'
import Wochentag from './views/Wochentag'
import Rechnen from './views/Rechnen'
import Karten from './views/Karten'
import Konstanten from './views/Konstanten'
import type { Einstellungen, Reiter } from './types'

// Erst die Kopfrechen-Uebungen, dann die Gedaechtnis-Uebungen.
const REITER: { id: Reiter; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'wochentag', label: 'Wochentag', Icon: IconKalender },
  { id: 'rechnen', label: 'Rechnen', Icon: IconMal },
  { id: 'karten', label: 'Karten', Icon: IconKarten },
  { id: 'konstanten', label: 'Konstanten', Icon: IconPi },
]

// Alle Reiter bleiben eingehaengt: offene Aufgaben und Runden ueberstehen den
// Wechsel zwischen ihnen.
function Loci() {
  const [einst, setEinst] = useState(getEinstellungen)
  const aendere = useCallback((patch: Partial<Einstellungen>) => setEinst(setEinstellungen(patch)), [])

  return (
    <div className="loci">
      <div className="l-buehne">
        <Wochentag aktiv={einst.reiter === 'wochentag'} einst={einst} aendere={aendere} />
        <Rechnen aktiv={einst.reiter === 'rechnen'} einst={einst} aendere={aendere} />
        <Karten aktiv={einst.reiter === 'karten'} einst={einst} aendere={aendere} />
        <Konstanten aktiv={einst.reiter === 'konstanten'} einst={einst} />
      </div>

      <nav className="l-tabs" aria-label="Übungen">
        {REITER.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`l-tab${einst.reiter === id ? ' an' : ''}`}
            aria-current={einst.reiter === id ? 'page' : undefined}
            onClick={() => aendere({ reiter: id })}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default Loci
