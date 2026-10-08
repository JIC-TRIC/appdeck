import { mountApp } from '@lib/mount'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Barlow Condensed (schmal und fett, wie
// auf einer Anzeigetafel) fuer Wortmarke, Namen und grosse Zahlen,
// Instrument Sans fuer alles andere. Nur die lateinischen Teile - Umlaute und
// ß sind darin.
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-condensed/latin-800.css'
import '@fontsource/instrument-sans/latin-400.css'
import '@fontsource/instrument-sans/latin-500.css'
import '@fontsource/instrument-sans/latin-600.css'

// Kein '@lib/dark': Form ist immer dunkel (Kreide) und setzt seine Farben selbst (Form.css).
import Form from './Form'
import './Form.css'

// iOS zeigt :active (die Rueckmeldung beim Antippen) nur, wenn irgendwo ein
// touchstart-Handler haengt - dieser leere genuegt.
document.addEventListener('touchstart', () => {}, { passive: true })

mountApp(<Form />)
