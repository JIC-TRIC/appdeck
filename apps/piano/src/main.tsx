import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Gloock fuer Titel und grosse Zahlen,
// Instrument Sans fuer alles andere.
import '@fontsource/gloock/400.css'
import '@fontsource/instrument-sans/400.css'
import '@fontsource/instrument-sans/500.css'
import '@fontsource/instrument-sans/600.css'
import '@fontsource/instrument-sans/700.css'

// Kein '@lib/dark': das folgt der Systemeinstellung. Piano ist immer dunkel
// und setzt seine Farben selbst (Piano.css).
import { migrateLegacy } from './storage'
import Piano from './Piano'
import './Piano.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

// Vor dem ersten Lesen: den Stand der alten App uebernehmen, falls hier noch nichts liegt.
migrateLegacy()

mountApp(<Piano />)
