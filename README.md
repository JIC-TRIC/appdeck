# appdeck

Alle eigenen iPhone-Apps in **einem** Repo, mit **einem** Icon auf dem Home-Bildschirm.
Beim Öffnen erscheint ein Launcher im iOS-Stil, von dort geht's in die einzelnen Apps –
und über den Zurück-Link bzw. den runden Home-Button wieder zurück.

- Kein Backend: Daten liegen im `localStorage` auf dem Gerät.
- Läuft als Web-App ohne Safari-Leisten, im Dark Mode, offline.
- Backup/Wiederherstellen ist im Launcher eingebaut (Zahnrad oben rechts).
- Offene Punkte und Ideen: [ROADMAP.md](ROADMAP.md) (u. a. Ideen für neue Apps und der Umzug auf IndexedDB, bevor der Speicher eng wird).

```
index.html, launcher.*   Launcher (App-Auswahl + Einstellungen)
apps.js                  Liste deiner Apps  ← hier trägst du neue Apps ein
apps/<name>/             je eine App pro Ordner
apps/vorlage/            Ionic-React-Vorlage für neue Apps (taucht nicht im Launcher auf)
lib/                     Gemeinsamer Code für Ionic-Apps (mountApp, useStored, HomeButton, Theme)
shared/shell.css         iOS-Look für Vanilla-Apps: Farben, Navbar, Listen, Buttons, Sheets
shared/shell.js          Home-Button, Speicher-Helfer, Toast, Offline (für alle Apps)
shared/backup.js         Backup & Wiederherstellen
sw.js                    Service Worker (Offline + schneller Start)
manifest.webmanifest     Name, Icon, Vollbild
vite.config.ts           Build: Ionic-Apps bauen, Rest nach dist/ kopieren
scripts/new-app.mjs      `npm run new` – neue App anlegen
.github/workflows/       Automatisches Deployment auf GitHub Pages
```

**Zwei Sorten Apps** leben nebeneinander:

- **Ionic-React-Apps** (TypeScript + Vite) – erkennbar an `apps/<name>/src/main.tsx`.
  Werden beim Build übersetzt. Standard für alles Neue.
- **Vanilla-Apps** (reines HTML/JS) – ohne `src/main.tsx`. Werden unverändert kopiert.
  Praktisch, um eine bestehende alte App ohne Umbau zu übernehmen (siehe Abschnitt 3).

---

## 1. Einrichten (einmalig)

**Am Rechner** (Node.js 22+ nötig):

```bash
npm install
```

**Auf GitHub** – Deployment über GitHub Actions einschalten:

1. Repo öffnen → **Settings → Pages**.
2. Unter **Build and deployment → Source** „**GitHub Actions**“ auswählen
   (nicht mehr „Deploy from a branch“). Speichern ist nicht nötig, die Auswahl gilt sofort.
3. Pushen. Unter **Actions** siehst du den Lauf „Deploy to GitHub Pages“; nach ca. 1–2 Minuten
   ist alles unter `https://jic-tric.github.io/appdeck/` erreichbar.

Ab dann gilt: **jeder Push auf `main` = neue Version online.** Schlagen Tests oder Build fehl
(z. B. TypeScript-Fehler), bleibt die alte Version online und du bekommst eine Mail von GitHub.
Manuell neu deployen: Actions → Deploy to GitHub Pages → **Run workflow**.

**Auf dem iPhone:** Adresse in **Safari** öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**
→ „Als Web-App öffnen“ eingeschaltet lassen → Hinzufügen.

**Entwickeln:**

```bash
npm run dev        # http://localhost:5173 – Launcher + alle Apps, Änderungen sofort sichtbar
npm test           # Tests (Vitest) – laufen auch bei jedem Deploy
npm run build      # TypeScript prüfen + Produktions-Build nach dist/ (macht GitHub genauso)
npm run preview    # dist/ lokal ansehen
```

`npm run dev` zeigt auch eine **Network**-Adresse (z. B. `http://192.168.x.x:5173`) – die im
iPhone-Safari öffnen (gleiches WLAN), um direkt am Handy zu testen.

---

## 2. Neue App hinzufügen

```bash
npm run new -- habits "Gewohnheiten" ✅ "#34C759"
```

Das kopiert `apps/vorlage` nach `apps/habits`, setzt App-ID und Titel und trägt die Kachel in
`apps.js` ein. Dann `npm run dev` und in `apps/habits/src/App.tsx` loslegen.

Aufbau einer Ionic-App:

```
apps/habits/index.html     HTML-Hülle (lädt shell.js + src/main.tsx)
apps/habits/src/main.tsx   Startpunkt: mountApp(<App />)
apps/habits/src/App.tsx    deine App
apps/habits/src/app.css    eigene Styles, z. B. :root { --ion-color-primary: #34C759; }
```

Bausteine aus `lib/`:

```tsx
import { useStored } from '@lib/useStored';
const [todos, setTodos] = useStored(APP_ID, 'todos', [] as Todo[]);   // wie useState, aber gespeichert

import { HomeButton } from '@lib/HomeButton';
<IonButtons slot="start"><HomeButton /></IonButtons>                    // „‹ Apps“ zurück zum Launcher
```

- Komponenten-Übersicht: https://ionicframework.com/docs/components – Ionic läuft fest im iOS-Stil.
- Dark Mode ist Sache der App: `import '@lib/dark'` in `main.tsx` (die Vorlage hat das). Weglassen,
  wenn die App nur hell sein soll – so wie Kontor.
- Tests liegen neben dem Code als `*.test.ts` (Beispiele in `apps/kontor/src/`).
- `<IonContent className="grouped">` + `<IonList inset>` ergibt den Look der iOS-Einstellungen.
- Mehrere Seiten in einer App? `IonReactHashRouter` aus `@ionic/react-router` verwenden
  (Hash-Routing, weil GitHub Pages keine Unterseiten-URLs umleiten kann).

Statt eines Emojis geht auch ein Bild: Datei nach `icons/` legen (quadratisch, z. B. 180×180) und in
`apps.js` `icon: 'icons/habits.png'` eintragen. (Bei Ionic-Apps landen nur die gebauten Dateien auf der
Website, ein Bild direkt in `apps/habits/` würde also nicht mitkopiert.)

---

## 3. Bestehende App umziehen

1. Dateien der alten App in einen neuen Ordner kopieren, z. B. `apps/einkauf/`.
2. **Pfade prüfen:** Absolute Pfade wie `/altes-repo/style.css` oder `/script.js` auf
   relative Pfade (`style.css`, `./script.js`) umstellen.
3. Am Ende von `<body>` einfügen – mehr ist nicht nötig, damit der Home-Button erscheint:
   ```html
   <script src="../../shared/shell.js"></script>
   ```
   Optional für den iOS-Look: `<link rel="stylesheet" href="../../shared/shell.css">` in den `<head>`.
   (Kann das bestehende Design verändern – ausprobieren.)
4. In den `<head>` gehören außerdem (falls noch nicht vorhanden):
   ```html
   <meta charset="utf-8">
   <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
   ```
5. Zeile in `apps.js` ergänzen.

⚠️ **Speicher-Schlüssel prüfen:** Alle Apps teilen sich ab jetzt denselben `localStorage`.
Verwenden zwei alte Apps denselben Schlüssel (z. B. beide `"data"`), überschreiben sie sich
gegenseitig. Dann in einer der Apps den Schlüssel umbenennen (z. B. `"einkauf:data"`).
Neue Apps nutzen `Shell.store('id')`, das setzt das Präfix automatisch.

---

## 4. Daten aus den alten Apps mitnehmen (wichtig!)

iOS gibt **jedem Home-Bildschirm-Icon einen eigenen, abgeschotteten Speicher** – getrennt von
Safari und von allen anderen Icons. Die neue Launcher-App sieht die Daten deiner alten Apps
deshalb **nicht automatisch**. Umzug per Backup:

**Fall A – die alte App lief in Safari (Lesezeichen, mit Adressleiste):**
1. In **Safari** (nicht im neuen Icon!) `https://jic-tric.github.io/appdeck/` öffnen.
   Weil alle deine GitHub-Pages-Seiten dieselbe Adresse `jic-tric.github.io` haben, sieht
   der Launcher dort die alten Daten.
2. Zahnrad → **In Zwischenablage kopieren** (oder „Backup sichern …“ → In Dateien sichern).
3. Die neue Launcher-App vom Home-Bildschirm öffnen → Zahnrad →
   **Aus Zwischenablage einfügen** (bzw. „Aus Datei importieren …“).

**Fall B – die alte App war schon als eigenes Icon auf dem Home-Bildschirm:**
1. In der `index.html` der **alten** App (im alten Repo) diese Zeile vor `</body>` einfügen und pushen:
   ```html
   <script src="https://jic-tric.github.io/appdeck/shared/backup.js" data-ui="button"></script>
   ```
2. Alte App öffnen (ggf. zweimal, damit die neue Version lädt) → oben rechts **Backup** →
   „In Zwischenablage kopieren“.
3. Neue Launcher-App → Zahnrad → **Aus Zwischenablage einfügen**.
4. Für jede alte App wiederholen. Erst wenn alles da ist, die alten Icons löschen.

**Kontor (früher in k-deploy):** Kontor übernimmt seine alten Daten beim ersten Start von selbst,
sofern sie im selben Speicher liegen (Schlüssel `k-deploy:proj:kontor`). Also: den alten Stand wie oben
per Launcher-Backup herüberholen, danach Kontor öffnen – fertig. Alternativ eine alte Kontor-Exportdatei
in Kontor unter Einstellungen → **Import aus JSON** einlesen.

**Kontor-Testdaten:** `apps/kontor/testdaten/kontor-beispiel.json` – Juni bis September 2026, vier Konten
(eins außerhalb der Gesamtbalance), Budgets, eine archivierte Kategorie, Umbuchungen und Korrekturen.
Aufs iPhone: https://raw.githubusercontent.com/JIC-TRIC/appdeck/main/apps/kontor/testdaten/kontor-beispiel.json
in Safari öffnen → Teilen → „In Dateien sichern". Dann in Kontor beim Erststart „Aus Exportdatei
wiederherstellen" oder unter Einstellungen → „Import aus JSON". **Der Import ersetzt alle Kontor-Daten** –
echte Daten vorher exportieren. Ein Test (`npm test`) prüft, dass die Datei zum Datenmodell passt.

**Steady-Testdaten:** `apps/steady/testdaten/steady-beispiel.json` – sieben Gewohnheiten (Gym 3× pro Woche,
Creatin, Bett gemacht, Kalorien und Protein als Mengen, Kein Handy im Bett, Lesen) von Juni bis 26. September
2026, dazu zwei archivierte. Aufs iPhone wie oben über
https://raw.githubusercontent.com/JIC-TRIC/appdeck/main/apps/steady/testdaten/steady-beispiel.json, dann in Steady
beim Erststart „Aus Exportdatei wiederherstellen“ oder unter Einstellungen → „Import aus JSON“. **Der Import ersetzt
alle Steady-Daten.** Konzept und Regeln: `apps/steady/konzept.md`.

> **Ein Icon löschen = seine Daten löschen.** Deshalb ab und zu ein Backup in „Dateien“ (iCloud Drive) sichern.
> Auch keine Extra-Icons für einzelne Apps aus diesem Repo anlegen – die hätten wieder eigenen, getrennten Speicher.

---

## 5. Updates

Einfach auf `main` pushen – GitHub baut und veröffentlicht automatisch. Der Service Worker lädt bei Internet immer die neueste Version –
die Änderung ist spätestens beim **nächsten Öffnen** der App da. Falls nicht:
Zahnrad → **Neu laden & Updates holen**, oder die App im App-Umschalter wegwischen und neu starten.

Ohne Internet startet alles aus dem Offline-Speicher.

---

## 6. Was für das „App-Gefühl“ sorgt (schon eingebaut)

| Problem bei „normalen“ Websites | Lösung hier |
|---|---|
| Adressleiste & Safari-Leisten | Web-App-Modus + Manifest |
| Doppeltipp zoomt, Tipp-Verzögerung | `touch-action: manipulation` |
| Grauer Blitz beim Antippen | `-webkit-tap-highlight-color: transparent` |
| Langes Drücken markiert Text / Lupe | `user-select: none` auf Bedienelementen |
| iOS zoomt beim Tippen in Eingabefelder | Schrift in Feldern mindestens 16 px |
| Inhalt unter Notch / Home-Balken | `viewport-fit=cover` + Safe-Area-Abstände |
| Harte Seitenwechsel | View Transitions (Safari 18.2+) |
| Kein Offline | Service Worker |
| Daten werden „aufgeräumt“ | `navigator.storage.persist()` |

**Tipps für eigene Apps**
- Ionic-Apps: Ionic-Komponenten erledigen das meiste davon schon (Listen, Alerts, Toasts, Sheets).
- Vanilla-Apps: die Bausteine aus `shell.css` nutzen: `.navbar`, `.large-title`, `.group` + `.row`, `.btn`, `dialog.sheet`.
  Der Launcher (`index.html`) zeigt, wie.
- `prompt()`, `confirm()` und `alert()` erscheinen auf dem iPhone als native iOS-Dialoge – für
  kleine Eingaben völlig okay.
- Touch-Ziele mindestens 44 × 44 px, keine Hover-Effekte.
- Seite soll nicht „federn“? `<html class="no-bounce">`.
- Eigene Akzentfarbe pro App: `:root { --accent: #34C759; }`.

---

## 7. Shell-API (Kurzreferenz)

```js
const db = Shell.store('meine-app');  // Speicher mit Präfix "meine-app:"
db.get('todos', [])                    // lesen (mit Standardwert), JSON automatisch
db.set('todos', todos)                 // schreiben
db.remove('todos'); db.keys(); db.clear();

Shell.toast('Gespeichert');           // kurze Meldung oben
Shell.home();                          // zurück zum Launcher
Shell.isStandalone                     // true, wenn vom Home-Bildschirm gestartet
```

HTML-Helfer: Jedes Element mit `data-shell-home` führt zum Launcher.
`<script src="../../shared/shell.js" data-home="bottom-right">` verschiebt den Home-Button
(`bottom-left` | `bottom-right` | `top-left` | `top-right` | `none`).

---

## 8. Öffentlich? Datenschutz

Der **Code** ist bei GitHub Pages öffentlich abrufbar, deine **Daten** nicht – die liegen nur
auf deinem iPhone. Alle Seiten haben `noindex`, tauchen also nicht in Suchmaschinen auf.
(GitHub Pages aus einem privaten Repo geht nur mit bezahltem GitHub-Plan, und die Seite selbst
ist auch dann öffentlich erreichbar.)
