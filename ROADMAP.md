# Roadmap

Offene Punkte und Ideen, damit nichts verloren geht. Grob nach Wichtigkeit sortiert.

## Alle Apps (Launcher)

### Speicher: von localStorage auf IndexedDB umziehen

**Warum:** Alle Apps im Launcher speichern in `localStorage`, und das hat auf dem iPhone eine
feste Grenze von **5 MB pro Adresse** (`jic-tric.github.io`) – geteilt von *allen* Apps.
IndexedDB darf dagegen bis zu **60 % des Gerätespeichers** nutzen, auch als Home-Bildschirm-App.

**Wann:** Nicht akut. Kontor allein braucht ~235 Zeichen pro Buchung; bei 5 Buchungen am Tag reicht
das 6–12 Jahre (je nach Inhalt, siehe unten). Mit jeder weiteren App schrumpft der Puffer. Spätestens
umziehen, wenn im Launcher unter „Belegt" gut 2,5 MB stehen.

**Was man wissen muss:**
- WebKit zählt **Bytes**, nicht Zeichen: Ein Wert mit nur Latin-1-Zeichen (inkl. ä, ö, ü, ß) kostet
  1 Byte/Zeichen. Enthält er irgendwo ein Zeichen darüber (Emoji, „€", „–"), kostet der *ganze* Wert
  2 Byte/Zeichen. Kontors Buchungsliste ist *ein* Wert – eine einzige Notiz mit Emoji halbiert also
  die Reichweite.
- Die Anzeige „Belegt" im Launcher rechnet pauschal 2 Byte/Zeichen, zeigt also eher zu viel.

**Umsetzung (Skizze):**
1. Kleine Speicherschicht in `lib/` (z. B. `lib/storage.ts`) mit IndexedDB dahinter, asynchron.
2. Apps darauf umstellen – bei Kontor steckt der Speicherzugriff gebündelt in `kontorStore.ts`
   (die Funktionen würden asynchron, die Ansichten lesen ohnehin alles beim `refresh()` neu).
3. Einmalige Übernahme der `<app>:*`-Schlüssel aus localStorage, danach dort löschen.
4. **Backup (`shared/backup.js`) muss IndexedDB mitsichern und wiederherstellen** – heute liest es nur
   localStorage.
5. `navigator.storage.persist()` wird schon angefragt (`shared/shell.js`) – damit gilt der Speicher
   nicht als „best effort" und wird nicht geräumt.

Quellen: [WebKit – LocalStorageManager.cpp](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebKit/NetworkProcess/storage/LocalStorageManager.cpp)
(`localStorageQuotaInBytes = 5 * MB`),
[WebKit – StorageMap.cpp](https://raw.githubusercontent.com/WebKit/WebKit/main/Source/WebCore/storage/StorageMap.cpp)
(Zählung per `sizeInBytes()`),
[WebKit-Blog: Updates to Storage Policy](https://webkit.org/blog/14403/updates-to-storage-policy/)
(Origin-Quota bis 60 %, gilt auch für Home-Bildschirm-Apps).

### Direkt in die zuletzt genutzte App starten

Heute beginnt jede Buchung mit Icon → Launcher → Kontor. Option im Launcher: zuletzt genutzte App
direkt öffnen. Startet iOS die Web-App neu, landet man ebenfalls im Launcher (Kontor stellt dann
zwar den Entwurf wieder her, aber erst nach dem Tipp auf die Kachel).

### Backup-Erinnerung

Anzeigen, wann zuletzt gesichert wurde, und nach ~2 Wochen daran erinnern. Die Daten liegen nur auf
dem Gerät; wer das Icon löscht, löscht sie.

## Kontor

- **Notiz-Vorschläge** aus früheren Buchungen: „Woch…" → „Wocheneinkauf", Tipp setzt auch die
  Kategorie. Schneller und einheitlichere Notizen (besser für die Suche).
- **„Nochmal buchen"**: bestehende Buchung als Vorlage für eine neue.
- **Vorbelegte Kategorie überdenken**: das Formular wählt die zuletzt genutzte vor – schnell, aber
  Fehlbuchungen fallen leicht durch. Alternative: leer lassen, Pflichtwahl.
- **Budgets sichtbar machen**: heute nur in Kategorien-Liste und -Detail. Budget-Block in der
  Statistik oder Hinweis auf der Startseite ab 80 %.
- **Monatsrückblick** beim ersten Öffnen im neuen Monat: ausgegeben, Sparquote, größte Kategorien,
  Vergleich zum Vormonat.
- **Kontenfilter** in der Buchungsliste.
- **Wiederkehrende Buchungen** (Miete, Abos) mit Vorschlag am Fälligkeitstag – größeres Feature,
  bewusst zurückgestellt.
- **Splitbuchung, Tags, CSV-Export** – siehe „Nicht im MVP" in `apps/kontor/konzept.md`.

## Steady

- **Weiches Umblenden beim Nachtragen**: rutschen Ruhetage um (× wird ◌), springen die Zellen heute nur um.
- **Wischen im Monatskalender** der Detailansicht (heute nur Pfeile).
- **Notiz pro Eintrag** (z. B. am Gym-Tag „Beine, 100 kg Kniebeuge“), **Startvorlagen** beim Erststart.
- **Zähler** (mehrmals am Tag antippen), **feste Wochentage** und **„alle N Tage“** als Rhythmus – bewusst
  draußen, damit das Raster lesbar bleibt. Siehe „Nicht im MVP“ in `apps/steady/konzept.md`.

## Ideen für neue Apps

Nur festgehalten, noch nicht entschieden. Vor dem Bau wie gewohnt: Fragerunde, dann `konzept.md`
und `mockups.html`.

### Trainingsbuch

Übungen, Sätze, Wiederholungen und Gewicht erfassen – schnell genug, um es zwischen zwei Sätzen im
Studio zu machen.

- **Letzter Wert steht schon da**: beim nächsten Training zeigt jede Übung, was man zuletzt geschafft
  hat („3×8 à 100 kg"), ein Tipp übernimmt es als Startwert.
- **Fortschrittskurve pro Übung**, z. B. schwerster Satz über die Zeit.
- **Verbindung zu Steady**: ein erfasstes Training zählt dort als erledigte Gewohnheit (z. B. „Gym").
  Geht, weil alle Apps unter derselben Adresse liegen und gegenseitig ihre Daten lesen können. Würde
  die Steady-Idee „Notiz pro Eintrag" fürs Training überflüssig machen.
- Offen: feste Pläne/Vorlagen (Push/Pull/Beine) oder frei? Körpergewicht mit erfassen? Pausentimer
  läuft nur, solange die App offen ist (iOS hält Web-Apps im Hintergrund an).
- Speicher: bei 4 Trainings à 20 Sätzen pro Woche grob 4.000 Sätze im Jahr, ein paar hundert KB –
  zusammen mit Kontor ein Grund mehr für den IndexedDB-Umzug (siehe oben).

### Ein Satz am Tag

Minimal-Tagebuch: pro Tag genau ein Satz. Die Hürde ist so niedrig, dass man es wirklich jeden Abend
macht.

- **Ein Feld, ein Tag.** Kein Titel, keine Formatierung, keine Fotos. Eine Längengrenze
  (z. B. ~200 Zeichen) hält es bei einem Satz.
- **„Heute vor einem Jahr"** über dem Eingabefeld (bis es ein Jahr gibt: vor einem Monat) – der
  eigentliche Grund, warum man dranbleibt.
- **Nachtragen** für gestern und vorgestern, falls ein Abend durchrutscht.
- Durchblättern nach Monat, Suche über alle Sätze.
- Offen: Stimmung (1–5) gleich mit erfassen oder bewusst nicht? Sperre per Code wäre nur Sichtschutz,
  die Daten liegen unverschlüsselt im Speicher.
- Speicher unkritisch: 365 × 200 Zeichen sind auch mit Emoji unter 150 KB im Jahr.

## Geht nicht / bewusst nicht

- Erinnerung per Push (bräuchte auf iOS einen eigenen Server), Widgets (für Web-Apps nicht möglich).
- Kontor: keine Bankanbindung, kein Dark Mode (siehe Konzept).
- Steady: keine Pausen/Urlaubsmodus, kein heller Modus, keine Symbole pro Gewohnheit (siehe Konzept).
