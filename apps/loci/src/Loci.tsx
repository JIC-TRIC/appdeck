import { useCallback, useState, type ComponentType } from 'react'
import { IconKalender, IconKarten } from './icons'
import { getEinstellungen, setEinstellungen } from './store'
import Wochentag from './views/Wochentag'
import Karten from './views/Karten'
import type { Einstellungen, Reiter } from './types'

const REITER: { id: Reiter; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'wochentag', label: 'Wochentag', Icon: IconKalender },
  { id: 'karten', label: 'Karten', Icon: IconKarten },
]

// Zwei Reiter, beide bleiben eingehaengt: die offene Wochentag-Aufgabe und die
// Runde ueberstehen den Wechsel zu den Karten und zurueck.
function Loci() {
  const [einst, setEinst] = useState(getEinstellungen)
  const aendere = useCallback((patch: Partial<Einstellungen>) => setEinst(setEinstellungen(patch)), [])

  return (
    <div className="loci">
      <div className="l-buehne">
        <Wochentag aktiv={einst.reiter === 'wochentag'} einst={einst} aendere={aendere} />
        <Karten aktiv={einst.reiter === 'karten'} einst={einst} aendere={aendere} />
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
