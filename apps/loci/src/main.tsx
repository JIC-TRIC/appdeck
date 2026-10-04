import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. IBM Plex Mono fuer Daten und Zahlen
// (das Rechenheft), IBM Plex Sans fuer alles andere. Nur die lateinischen
// Teile - Kyrillisch, Griechisch usw. wuerden den Offline-Speicher fuer nichts
// um rund 250 KB vergroessern.
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-ext-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import '@fontsource/ibm-plex-mono/latin-ext-500.css'
import '@fontsource/ibm-plex-mono/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-ext-600.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-ext-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-ext-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-sans/latin-ext-600.css'

// Kein '@lib/dark': Loci ist immer hell und setzt seine Farben selbst (Loci.css).
import Loci from './Loci'
import './Loci.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Loci />)
