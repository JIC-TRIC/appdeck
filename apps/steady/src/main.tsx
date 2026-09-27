import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Onest fuer alles, Bricolage Grotesque
// nur fuer Wortmarke und grosse Zahlen.
import '@fontsource/onest/400.css'
import '@fontsource/onest/500.css'
import '@fontsource/onest/600.css'
import '@fontsource/onest/700.css'
import '@fontsource/bricolage-grotesque/700.css'
import '@fontsource/bricolage-grotesque/800.css'

// Kein '@lib/dark': das folgt der Systemeinstellung. Steady ist immer dunkel
// und setzt seine Farben selbst (Steady.css).
import Steady from './Steady'
import './Steady.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Steady />)
