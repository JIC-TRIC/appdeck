import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. IBM Plex Mono fuer alles (wie in Loci),
// nur die lateinischen Teile.
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-ext-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-ext-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-ext-600.css'

// Kein '@lib/dark': Punch ist immer hell und setzt seine Farben selbst (Punch.css).
import Punch from './Punch'
import './Punch.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Punch />)
