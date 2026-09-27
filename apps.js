/*
 * App-Registry – jede Zeile ist eine Kachel im Launcher.
 *
 *   id     eindeutiger Kurzname (wird auch als Präfix für gespeicherte Daten genutzt)
 *   name   Anzeigename unter dem Icon
 *   icon   ein Emoji ODER ein Bildpfad, z. B. 'apps/zaehler/icon.png'
 *   color  Hintergrundfarbe der Kachel
 *   path   Ordner der App – immer mit "/" am Ende
 *
 * Neue App: Ordner apps/vorlage kopieren, hier eine Zeile ergänzen, pushen. Fertig.
 */
self.APPS = [
  { id: 'zaehler', name: 'Zähler',  icon: '🔢', color: '#FF9500', path: 'apps/zaehler/' },
  { id: 'notizen', name: 'Notizen', icon: '📝', color: '#FFCC00', path: 'apps/notizen/' },
];
