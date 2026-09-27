/*
 * Build-Konfiguration für das ganze Repo.
 *
 * - Jeder Ordner apps/<name>/ mit einer Datei src/main.tsx ist eine Ionic-React-App
 *   und wird von Vite gebaut (TypeScript, JSX, Imports aus node_modules).
 * - Alles andere (Launcher, shared/, icons/, Vanilla-Apps ohne src/main.tsx) wird
 *   unverändert nach dist/ kopiert.
 * - dist/ ist das, was auf GitHub Pages landet.
 *
 * Normalerweise musst du hier nichts ändern: neue Apps werden automatisch erkannt.
 */
import { cpSync, existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const ROOT = import.meta.dirname;
const OUT = resolve(ROOT, 'dist');

const appDirs = readdirSync(resolve(ROOT, 'apps'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const isIonicApp = (name: string) => existsSync(resolve(ROOT, 'apps', name, 'src/main.tsx'));
const ionicApps = appDirs.filter(isIonicApp);

// Dateien/Ordner im Repo-Root, die 1:1 auf die Website gehören
const STATIC = [
  'index.html', 'launcher.css', 'launcher.js', 'apps.js', 'sw.js',
  'manifest.webmanifest', '.nojekyll', 'icons', 'shared',
];

/** Kopiert die statischen Dateien und schreibt die Offline-Liste für den Service Worker. */
function staticFiles(): Plugin {
  return {
    name: 'meine-apps:static',
    apply: 'build',
    closeBundle() {
      for (const entry of STATIC) {
        cpSync(resolve(ROOT, entry), resolve(OUT, entry), { recursive: true });
      }
      for (const name of appDirs.filter((n) => !isIonicApp(n))) {
        cpSync(resolve(ROOT, 'apps', name), resolve(OUT, 'apps', name), { recursive: true });
      }

      // Alle gebauten JS/CSS-Dateien, damit Ionic-Apps auch offline starten,
      // die noch nie geöffnet wurden. Die Build-ID sorgt dafür, dass der
      // Service Worker nach jedem Deploy alte Dateien aufräumt.
      const assets = listFiles(resolve(OUT, 'assets')).map((f) => relative(OUT, f).replaceAll('\\', '/'));
      const buildId = new Date().toISOString();
      writeFileSync(
        resolve(OUT, 'precache.js'),
        `// automatisch erzeugt von vite.config.ts\nself.BUILD_ID = ${JSON.stringify(buildId)};\nself.PRECACHE = ${JSON.stringify(assets, null, 2)};\n`,
      );
    },
  };
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? listFiles(join(dir, d.name)) : [join(dir, d.name)],
  );
}

export default defineConfig({
  root: ROOT,
  base: './',            // relative Pfade → funktioniert unter /meine-apps/ genauso wie lokal
  appType: 'mpa',        // mehrere Seiten: Launcher + eine Seite pro App
  publicDir: false,
  plugins: [react(), staticFiles()],
  resolve: {
    alias: { '@lib': resolve(ROOT, 'lib') },
  },
  build: {
    outDir: OUT,
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,   // Ionic + React sind zusammen ~1,3 MB (≈ 290 KB gzip) – das ist normal
    // Hinweis: Warnungen „'host-context' is not recognized“ kommen aus Ionics CSS und sind harmlos.
    rollupOptions: {
      input: Object.fromEntries(ionicApps.map((name) => [name, resolve(ROOT, 'apps', name, 'index.html')])),
    },
  },
  server: {
    host: true,          // auch im WLAN erreichbar → am iPhone testen
  },
});
