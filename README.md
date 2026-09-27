# Meine Apps

Alle eigenen iPhone-Apps in **einem** Repo, mit **einem** Icon auf dem Home-Bildschirm.
Beim Öffnen erscheint ein Launcher im iOS-Stil, von dort geht's in die einzelnen Apps –
und über den Zurück-Link bzw. den runden Home-Button wieder zurück.

- Kein Backend: Daten liegen im `localStorage` auf dem Gerät.
- Läuft als Web-App ohne Safari-Leisten, im Dark Mode, offline.
- Backup/Wiederherstellen ist im Launcher eingebaut (Zahnrad oben rechts).

```
index.html, launcher.*   Launcher (App-Auswahl + Einstellungen)
apps.js                  Liste deiner Apps  ← hier trägst du neue Apps ein
apps/<name>/             je eine App pro Ordner
apps/vorlage/            Startpunkt für neue Apps (taucht nicht im Launcher auf)
shared/shell.css         iOS-Look: Farben, Navbar, Listen, Buttons, Sheets, Dark Mode
shared/shell.js          Home-Button, Speicher-Helfer, Toast, Offline
shared/backup.js         Backup & Wiederherstellen
sw.js                    Service Worker (Offline + schneller Start)
manifest.webmanifest     Name, Icon, Vollbild
.nojekyll                GitHub Pages liefert alle Dateien unverändert aus
```

---

## 1. Einrichten (einmalig)

1. Auf GitHub ein neues Repo anlegen, z. B. `meine-apps`.
2. Alle Dateien aus diesem Ordner hochladen (inkl. der versteckten Datei `.nojekyll`).
3. Im Repo: **Settings → Pages → Source: „Deploy from a branch“ → `main` / `(root)`** → Save.
4. Nach ca. einer Minute ist alles unter `https://DEINNAME.github.io/meine-apps/` erreichbar.
5. Auf dem iPhone diese Adresse in **Safari** öffnen → Teilen-Symbol → **„Zum Home-Bildschirm“**
   → „Als Web-App öffnen“ eingeschaltet lassen → Hinzufügen.

**Lokal testen** (am Rechner, im Repo-Ordner):

```bash
python3 -m http.server 8000
# dann http://localhost:8000 öffnen – im Browser die Handy-Ansicht aktivieren
```

---

## 2. Neue App hinzufügen

1. Ordner `apps/vorlage` kopieren, z. B. nach `apps/habits`.
2. In `apps/habits/index.html` die App-ID anpassen: `Shell.store('habits')`.
3. In `apps.js` eine Zeile ergänzen:
   ```js
   { id: 'habits', name: 'Gewohnheiten', icon: '✅', color: '#34C759', path: 'apps/habits/' },
   ```
4. Committen & pushen. Beim nächsten Öffnen ist die Kachel da.

Statt eines Emojis geht auch ein Bild: `icon: 'apps/habits/icon.png'` (quadratisch, z. B. 180×180).

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
1. In **Safari** (nicht im neuen Icon!) `https://DEINNAME.github.io/meine-apps/` öffnen.
   Weil alle deine GitHub-Pages-Seiten dieselbe Adresse `DEINNAME.github.io` haben, sieht
   der Launcher dort die alten Daten.
2. Zahnrad → **In Zwischenablage kopieren** (oder „Backup sichern …“ → In Dateien sichern).
3. Die neue Launcher-App vom Home-Bildschirm öffnen → Zahnrad →
   **Aus Zwischenablage einfügen** (bzw. „Aus Datei importieren …“).

**Fall B – die alte App war schon als eigenes Icon auf dem Home-Bildschirm:**
1. In der `index.html` der **alten** App (im alten Repo) diese Zeile vor `</body>` einfügen und pushen:
   ```html
   <script src="https://DEINNAME.github.io/meine-apps/shared/backup.js" data-ui="button"></script>
   ```
2. Alte App öffnen (ggf. zweimal, damit die neue Version lädt) → oben rechts **Backup** →
   „In Zwischenablage kopieren“.
3. Neue Launcher-App → Zahnrad → **Aus Zwischenablage einfügen**.
4. Für jede alte App wiederholen. Erst wenn alles da ist, die alten Icons löschen.

> **Ein Icon löschen = seine Daten löschen.** Deshalb ab und zu ein Backup in „Dateien“ (iCloud Drive) sichern.
> Auch keine Extra-Icons für einzelne Apps aus diesem Repo anlegen – die hätten wieder eigenen, getrennten Speicher.

---

## 5. Updates

Einfach pushen. Der Service Worker lädt bei Internet immer die neueste Version –
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
- Die Bausteine aus `shell.css` nutzen: `.navbar`, `.large-title`, `.group` + `.row`, `.btn`, `dialog.sheet`.
  Die Vorlage und die zwei Beispiel-Apps zeigen, wie.
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
