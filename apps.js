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
 *   badge  optional: Funktion, die eine Zahl liefert – steht als rote Plakette an der Kachel
 *          (0 = keine). Der Launcher fragt sie beim Anzeigen und beim Zurückkommen ab.
 *
 * Neue App: npm run new -- <id> "<Name>" [emoji] [farbe]  – trägt die Zeile hier automatisch ein.
 */

// Tick: offene Todos, die heute fällig oder überfällig sind (wie plakette() in apps/tick/src/liste.ts).
function tickBadge() {
  var todos = JSON.parse(localStorage.getItem('tick:todos') || '[]');
  var d = new Date();
  var heute = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  return todos.filter(function (t) {
    return t && !t.erledigt && typeof t.faellig === 'string' && t.faellig <= heute;
  }).length;
}

self.APPS = [
  { id: 'kontor', name: 'Kontor', icon: 'icons/kontor.svg', color: '#2E9E6B', bg: '#FAF8F4', path: 'apps/kontor/' },
  { id: 'steady', name: 'Steady', icon: 'icons/steady.svg', color: '#F2785C', bg: '#0F1113', path: 'apps/steady/' },
  { id: 'piano', name: 'Piano', icon: 'icons/piano.svg', color: '#D9A953', bg: '#0E0D0B', path: 'apps/piano/' },
  { id: 'loci', name: 'Loci', icon: 'icons/loci.svg', color: '#1E4DB7', bg: '#F7F8F3', path: 'apps/loci/' },
  { id: 'stash', name: 'Stash', icon: 'icons/stash.svg', color: '#1F1D1A', bg: '#F3EEE3', path: 'apps/stash/' },
  { id: 'form', name: 'Form', icon: 'icons/form.svg', color: '#FF6A00', bg: '#0D0D0E', path: 'apps/form/' },
  { id: 'tick', name: 'Tick', icon: 'icons/tick.svg', color: '#7A50E0', bg: '#ECEEF1', path: 'apps/tick/', badge: tickBadge },
];
