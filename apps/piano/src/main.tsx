import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'

// Schriften liegen mit im Build statt bei Google Fonts: funktioniert offline
// und schickt keine Anfrage an Dritte. Gleiche Schnitte wie vorher.
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'

import './index.css'
import App from './App.jsx'
import { migrateLegacy } from './storage'

// Die App ist 1:1 aus piano-practice-tracker uebernommen (React ohne Ionic).
// Darum nicht mountApp aus lib/: das bringt Ionics CSS und die IonApp-Huelle
// mit, die Aussehen und Seiten-Scrollen der App veraendern wuerden.

// Vor dem ersten Lesen: alten Stand uebernehmen, falls hier noch nichts liegt.
migrateLegacy()

// Sagt der Shell, dass die App gezeichnet ist - erst dann blendet sie sich ein
// (Uebergang vom Launcher, siehe shared/shell.js).
function Ready() {
  useEffect(() => window.Shell?.ready(), [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Ready />
  </StrictMode>,
)
