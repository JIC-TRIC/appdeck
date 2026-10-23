import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Figtree fuer alles, nur die
// lateinischen Teile.
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-ext-400.css'
import '@fontsource/figtree/latin-500.css'
import '@fontsource/figtree/latin-ext-500.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-ext-600.css'
import '@fontsource/figtree/latin-700.css'
import '@fontsource/figtree/latin-ext-700.css'
import '@fontsource/figtree/latin-800.css'

// Kein '@lib/dark': Tick ist immer hell und setzt seine Farben selbst (Tick.css).
import Tick from './Tick'
import './Tick.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Tick />)
