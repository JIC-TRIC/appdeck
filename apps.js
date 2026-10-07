/*
 * App-Registry – jede Zeile ist eine Kachel im Launcher.
 *
 *   id     eindeutiger Kurzname (wird auch als Präfix für gespeicherte Daten genutzt)
 *   name   Anzeigename unter dem Icon
 *   icon   ein Emoji ODER ein Bildpfad, z. B. 'icons/habits.png'
 *   color  Hintergrundfarbe der Kachel
 *   bg     Hintergrund der App (= theme-color in ihrer index.html). Beim Öffnen zoomt die
 *          Kachel in diese Farbe, und die App blendet sich darauf ein. Weglassen, wenn die
 *          App hell/dunkel dem System folgt wie die Vorlage – dann gilt der Launcher-Grund.
 *   path   Ordner der App – immer mit "/" am Ende
 *
 * Neue App: npm run new -- <id> "<Name>" [emoji] [farbe]  – trägt die Zeile hier automatisch ein.
 */
self.APPS = [
  { id: 'kontor', name: 'Kontor', icon: 'icons/kontor.svg', color: '#FAF8F4', bg: '#FAF8F4', path: 'apps/kontor/' },
  { id: 'steady', name: 'Steady', icon: 'icons/steady.svg', color: '#0F1113', bg: '#0F1113', path: 'apps/steady/' },
  { id: 'piano', name: 'Piano', icon: 'icons/piano.svg', color: '#0E0D0B', bg: '#0E0D0B', path: 'apps/piano/' },
  { id: 'loci', name: 'Loci', icon: 'icons/loci.svg', color: '#F7F8F3', bg: '#F7F8F3', path: 'apps/loci/' },
  { id: 'stash', name: 'Stash', icon: 'icons/stash.svg', color: '#F3EEE3', bg: '#F3EEE3', path: 'apps/stash/' },
];
