/*
 * Legt eine neue Ionic-React-App aus apps/vorlage an und trägt sie in apps.js ein.
 *
 *   npm run new -- <id> "<Name>" [emoji] [farbe]
 *   npm run new -- habits "Gewohnheiten" ✅ "#34C759"
 */
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const [id, name, icon = '✨', color = '#007AFF'] = process.argv.slice(2);

if (!id || !name) {
  console.error('Aufruf: npm run new -- <id> "<Name>" [emoji] [farbe]');
  console.error('Beispiel: npm run new -- habits "Gewohnheiten" ✅ "#34C759"');
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
  console.error(`Ungültige ID "${id}": nur Kleinbuchstaben, Ziffern und "-" (sie wird Ordnername und Speicher-Präfix).`);
  process.exit(1);
}

const target = resolve(ROOT, 'apps', id);
if (existsSync(target)) {
  console.error(`apps/${id} gibt es schon.`);
  process.exit(1);
}

cpSync(resolve(ROOT, 'apps/vorlage'), target, { recursive: true });

const replaceIn = (file, pairs) => {
  const path = resolve(target, file);
  let text = readFileSync(path, 'utf8');
  for (const [from, to] of pairs) text = text.replace(from, to);
  writeFileSync(path, text);
};
const q = (s) => s.replaceAll("'", "\\'");

replaceIn('src/App.tsx', [
  ["const APP_ID = 'vorlage';", `const APP_ID = '${id}';`],
  ["const TITLE = 'Meine neue App';", `const TITLE = '${q(name)}';`],
]);
replaceIn('index.html', [['<title>Meine neue App</title>', `<title>${name}</title>`]]);

const appsFile = resolve(ROOT, 'apps.js');
const apps = readFileSync(appsFile, 'utf8');
const line = `  { id: '${id}', name: '${q(name)}', icon: '${icon}', color: '${color}', path: 'apps/${id}/' },\n`;
const end = apps.lastIndexOf('];');
writeFileSync(appsFile, apps.slice(0, end) + line + apps.slice(end));

console.log(`✔ apps/${id}/ angelegt und in apps.js eingetragen.`);
console.log(`  Loslegen: npm run dev  →  App-Code in apps/${id}/src/App.tsx`);
