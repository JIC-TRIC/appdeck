/* ==========================================================================
   sw.js – macht Launcher und Apps offline-fähig

   Strategie "Netz zuerst": Mit Internet bekommst du immer die neueste Version
   (nach einem Push also beim nächsten Öffnen). Ohne Netz oder bei sehr
   langsamer Verbindung wird nach 2,5 Sekunden die gespeicherte Kopie genutzt.
   Normalerweise musst du hier nie etwas ändern.
   ========================================================================== */
const NETWORK_TIMEOUT_MS = 2500;

importScripts('apps.js');   // liefert self.APPS
// precache.js entsteht beim Build (vite.config.ts): Build-ID + gebaute JS/CSS-Dateien der Ionic-Apps.
// Ändert sich nach jedem Deploy → Browser installiert den Service Worker neu und räumt alte Dateien weg.
try { importScripts('precache.js'); } catch (e) { /* lokal ohne Build */ }

const CACHE = 'meine-apps-' + (self.BUILD_ID || 'dev');

const CORE = [
  './',
  'index.html',
  'launcher.css',
  'launcher.js',
  'apps.js',
  'manifest.webmanifest',
  'shared/shell.css',
  'shared/shell.js',
  'shared/backup.js',
  'icons/icon-180.png',
  'icons/icon-192.png',
];
const APP_PAGES = (self.APPS || []).map((app) => app.path);
const BUILD_ASSETS = self.PRECACHE || [];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Einzeln cachen, damit ein fehlender Eintrag nicht alles abbricht
    await Promise.allSettled([...CORE, ...APP_PAGES, ...BUILD_ASSETS].map(async (url) => {
      const res = await fetch(new Request(url, { cache: 'reload' }));
      if (res.ok && !res.redirected) await cache.put(url, res);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   // fremde Seiten nicht anfassen
  event.respondWith(networkFirst(event, req));
});

async function networkFirst(event, req) {
  const cache = await caches.open(CACHE);

  const fromNetwork = fetch(req).then((res) => {
    if (res.ok && !res.redirected && res.type === 'basic') {
      cache.put(req, res.clone());
    }
    return res;
  });
  // Läuft im Hintergrund weiter und aktualisiert den Cache, auch wenn wir schon geantwortet haben
  event.waitUntil(fromNetwork.catch(() => {}));

  try {
    return await Promise.race([
      fromNetwork,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NETWORK_TIMEOUT_MS)),
    ]);
  } catch (err) {
    const cached = await cache.match(req, { ignoreSearch: true });
    return cached || fromNetwork;
  }
}
