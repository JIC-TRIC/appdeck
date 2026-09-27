/*
 * App-Registry – jede Zeile ist eine Kachel im Launcher.
 *
 *   id     eindeutiger Kurzname (wird auch als Präfix für gespeicherte Daten genutzt)
 *   name   Anzeigename unter dem Icon
 *   icon   ein Emoji ODER ein Bildpfad, z. B. 'icons/habits.png'
 *   color  Hintergrundfarbe der Kachel
 *   path   Ordner der App – immer mit "/" am Ende
 *
 * Neue App: npm run new -- <id> "<Name>" [emoji] [farbe]  – trägt die Zeile hier automatisch ein.
 */
self.APPS = [
  { id: 'kontor', name: 'Kontor', icon: 'icons/kontor.svg', color: '#1F1D1A', path: 'apps/kontor/' },
];
