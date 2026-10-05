// Bausteine, die auf beiden Seiten gleich aussehen muessen.

import type { ReactNode } from 'react'
import { IconLeft } from './icons'

// Zurueck zum Launcher. Ohne shell.js (z. B. einzeln geoeffnet) eine Ebene ueber apps/.
function zumLauncher() {
  if (window.Shell) window.Shell.home()
  else window.location.href = '../../'
}

/** Kopfleiste: links zurueck (zum Launcher oder zur Seite darunter), rechts frei. */
export function Leiste({ zurueck, onZurueck, rechts }: { zurueck: string; onZurueck?: () => void; rechts?: ReactNode }) {
  return (
    <header className="s-bar">
      <button type="button" className="s-back" onClick={onZurueck ?? zumLauncher}>
        <IconLeft />
        {zurueck}
      </button>
      {rechts}
    </header>
  )
}

/** Knoepfe im Formular: ein Tipp darauf nimmt dem Textfeld nicht den Fokus - die Tastatur bleibt stehen. */
export const fokusBleibt = (e: { preventDefault: () => void }) => e.preventDefault()
