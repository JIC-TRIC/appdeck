/*
 * Startet eine Ionic-React-App. In apps/<name>/src/main.tsx:
 *   mountApp(<App />);
 */
import { StrictMode, type ReactNode } from 'react';
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

/* Dark Mode folgt der iPhone-Einstellung – wie beim Launcher */
import '@ionic/react/css/palettes/dark.system.css';

import './theme.css';

// Immer iOS-Look, auch beim Testen im Desktop-Browser
setupIonicReact({ mode: 'ios' });

export function mountApp(app: ReactNode) {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <IonApp>{app}</IonApp>
    </StrictMode>,
  );
}
