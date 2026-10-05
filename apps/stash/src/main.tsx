import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Newsreader fuer alles, was man
// schreibt und liest (Wortmarke, Titel, Notizen); Knoepfe und Kleinkram in
// der Systemschrift. Nur die lateinischen Teile.
import '@fontsource/newsreader/latin-400.css'
import '@fontsource/newsreader/latin-ext-400.css'
import '@fontsource/newsreader/latin-400-italic.css'
import '@fontsource/newsreader/latin-600.css'
import '@fontsource/newsreader/latin-ext-600.css'

// Kein '@lib/dark': Stash ist immer hell (Papier) und setzt seine Farben selbst (Stash.css).
import Stash from './Stash'
import './Stash.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Stash />)
