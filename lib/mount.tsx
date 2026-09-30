/*
 * Startet eine Ionic-React-App. In apps/<name>/src/main.tsx:
 *   mountApp(<App />);
 */
import { StrictMode, useEffect, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { IonApp, setupIonicReact } from '@ionic/react';

/* Pflicht-CSS von Ionic */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Hilfsklassen (ion-padding, ion-text-center, …) */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Dark Mode ist Sache der App: wer ihn will, importiert in main.tsx
   zusätzlich '@lib/dark' (die Vorlage tut das). */

import './theme.css';

// Immer iOS-Look, auch beim Testen im Desktop-Browser
setupIonicReact({ mode: 'ios' });

// Sagt der Shell, dass die App gezeichnet ist – erst dann blendet sie sich
// ein (Übergang vom Launcher, siehe shared/shell.js). Vorher sähe man eine
// halb aufgebaute Seite.
function Ready() {
  useEffect(() => window.Shell?.ready(), []);
  return null;
}

export function mountApp(app: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <IonApp>
        {app}
        <Ready />
      </IonApp>
    </StrictMode>,
  );
}
