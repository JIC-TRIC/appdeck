# Form – Konzept

Fortschritt in Zahlen: Körperwerte wie Gewicht, Bizeps oder Taille von Hand eintragen und sehen, wohin
es geht. Später soll Form auch das Training aufnehmen (Idee „Trainingsbuch“ in der ROADMAP) – dort
macht man genauso mit der Zeit Fortschritte. Der erste Stand kann nur das Verfolgen von Werten.

Projekt-ID `form`, Ordner `apps/form/`, Speicher unter `form:*`. Gebaut in TypeScript + Ionic wie
Kontor, Steady, Piano, Loci und Stash.

`[ ]` = offen, `[x]` = gebaut. **Stand: gebaut (08.10.2026).** Nach einer kurzen Fragerunde direkt
gebaut, ohne Mockups. Gewählt wurde: Name **Form**, Look **Kreide (dunkel) mit grellem Orange**, dazu
**Richtung pro Wert** und **Zielwert pro Wert**. Nicht gewählt: Startvorlagen, Notiz pro Messtag.

---

## Prinzipien

- **Ein Wert = Name, Einheit, Richtung, Ziel.** Mehr nicht. Was ein Wert ist, bestimmt man selbst –
  keine feste Liste.
- **Ein Blatt pro Messtag.** Messen heißt: alle Werte untereinander, ausfüllen, was man heute gemessen
  hat. Leere Felder bleiben leer, niemand muss jeden Tag alles messen.
- **Gespeichert wird nur, was du einträgst.** Pro Wert und Tag eine Zahl. Veränderung, Ziel-Abstand
  und Verlauf werden daraus berechnet, nie gespeichert.
- **Fortschritt wird gefeiert, Rückschritt nicht bestraft.** Was in die gewünschte Richtung geht, ist
  orange. Was in die andere Richtung geht, steht einfach weiß da – kein Rot.
- **Nur dunkel.** Kein heller Modus.
- **Keine Tab-Leiste.** Übersicht, darunter Seiten mit Zurückwischen wie Kontor, Piano und Stash.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Design (Richtung „Kreide“)

Schwarz wie eine Gummimatte im Studio, Kreideweiß für Text und Linien, ein grelles Orange als einzige
Akzentfarbe. Versalien in sehr fetter Grotesk für Wortmarke, Namen und große Zahlen.

| Token | Wert | Wofür |
|---|---|---|
| `--bg` | `#0D0D0E` | Grund, Launcher-Übergang, theme-color |
| `--surface` / `-2` / `-3` | `#161618` / `#1F1F22` / `#2C2C30` | Karten / Felder, Tasten / gewählt, gedrückt |
| `--line` | `#262629` | Trenner, Raster im Verlauf |
| `--text` / `-2` / `-3` | `#F2F0EB` / `#A8A49C` / `#77736C` | Kreide, abgestuft |
| `--accent` | `#FF6A00` | Hauptknopf, jüngster Punkt, Ziel, Fortschritt |
| `--danger` | `#FF5C6C` | nur „Wert löschen“ und „keine Zahl“ |

- **Schrift:** Schibsted Grotesk 800/900 für Wortmarke („FORM.“ mit orangem Punkt), Namen und große
  Zahlen, Instrument Sans für alles andere. Beide sind schon im Repo (`@fontsource`), keine neue
  Abhängigkeit. Keine Tabellenziffern – in Schibsted bekäme das Komma Ziffernbreite (Kontors Lehre).
- Rundungen weich (Karten 18–20 px, Hauptknopf 16 px).
- Symbol `icons/form.svg`: der Verlauf mit gestrichelter Ziellinie, weiße Kurve auf `#FF6A00`, der
  jüngste Punkt in Mattschwarz (Symbol-Stil „Signal“ siehe README). Reines Orange statt Steadys
  Koralle, damit die beiden Kacheln im Launcher nicht verschwimmen.

## Die Regeln

### Werte

- [x] Name ist eine Zeile, höchstens 40 Zeichen, Pflicht. Einheit frei (höchstens 8 Zeichen), mit
  Schnellwahl kg, cm, %; leer ist erlaubt.
- [x] **Richtung:** „mehr ist besser“ (Bizeps), „weniger ist besser“ (Taille) oder „egal“
  (Standard). Danach färbt sich jede Veränderung: in die gewünschte Richtung orange, sonst weiß, bei
  „egal“ immer grau.
- [x] **Ziel** (optional): erreicht bei „mehr“ ab dem Zielwert, bei „weniger“ bis zum Zielwert, bei
  „egal“ erst genau auf dem Wert – davor zählt der Abstand in beide Richtungen.
- [x] Reihenfolge = Reihenfolge des Anlegens.
- [x] Löschen nimmt alle Einträge mit (Rückfrage nennt die Anzahl), ohne Rückgängig.

### Einträge

- [x] Pro Wert und Tag eine Zahl. Nochmal messen am selben Tag ersetzt sie, ein geleertes Feld
  entfernt sie.
- [x] Zahlen mit Komma oder Punkt, höchstens zwei Nachkommastellen (gerundet). Ein Punkt mit genau drei
  Ziffern danach ist ein Tausenderpunkt („1.500“).
- [x] Tage sind lokale Kalendertage (`YYYY-MM-DD`), kein Tageswechsel um 3 Uhr wie in Steady – man
  misst morgens.
- [x] Nachtragen: beim Messen mit den Pfeilen einen früheren Tag wählen. Was schon getippt ist, bleibt
  beim Tageswechsel stehen. In die Zukunft geht es nicht.

### Speicher

```
form:werte   [{ id, name, einheit, richtung, ziel, erstellt }]
form:log     { [wertId]: { 'YYYY-MM-DD': zahl } }
```

Gelesenes wird geprüft und notfalls verworfen (`normalisiere*` in `store.ts`, getestet). Das
Launcher-Backup erfasst alles automatisch.

## Ansichten

### 1. Übersicht

- [x] Kopf: „Zuletzt gemessen vor 3 Tagen“, Wortmarke, rechts oben „+“ für einen neuen Wert.
- [x] Pro Wert eine Karte: Name, wann zuletzt gemessen, jüngste Zahl groß, Mini-Verlauf der letzten
  zwölf Messungen (jüngster Punkt orange), Veränderung seit der ersten Messung und – mit Ziel – „noch
  2,4 kg“ bzw. „✓ Ziel“.
- [x] Unten der Hauptknopf **Messen** (heute).
- [x] Ohne Werte: „Was willst du verfolgen?“ und „Ersten Wert anlegen“.

### 2. Messen

- [x] Kopf: Abbrechen, „Messen“, Sichern. Darunter der Tag mit Pfeilen.
- [x] Alle Werte untereinander, je ein Zahlenfeld (Zifferntastatur mit Komma). Platzhalter ist der
  letzte Wert davor, darunter „zuletzt 83 kg · Do 1. Okt“ – sobald getippt wird, die Veränderung dazu.
- [x] Enter springt ins nächste Feld. Steht irgendwo keine Zahl, wird nichts gesichert und die Meldung
  nennt den Wert.
- [x] Nach dem Sichern: „2 Werte gespeichert“, für vergangene Tage mit Datum.

### 3. Ein Wert

- [x] Name, Einheit und Richtung, jüngste Zahl sehr groß.
- [x] Drei Kacheln: seit Start, seit der letzten Messung, Ziel (nur mit Ziel).
- [x] Verlauf über **3 Monate / 1 Jahr / Alles** (Standard: Alles). Waagerecht nach Zeit, nicht nach
  Anzahl. Ziel als gestrichelte orange Linie, jüngster Punkt orange.
- [x] Alle Einträge, neueste zuerst, mit Veränderung zum Eintrag davor. Ein Tipp öffnet den Messtag.
- [x] Oben rechts „Bearbeiten“.

### 4. Wert anlegen / bearbeiten

- [x] Name, Einheit (mit kg / cm / %), „Was ist besser?“ (Mehr / Weniger / Egal) mit einem Satz
  Erklärung, Ziel (optional).
- [x] Beim Bearbeiten unten „Wert löschen“.

## Nicht im MVP

- Reihenfolge der Werte ändern, Werte archivieren.
- Startvorlagen beim ersten Start, Notiz pro Messtag (in der Fragerunde nicht gewählt).
- Entwurf beim Messen über das Schließen der App hinaus (Stash macht das; hier sind es nur ein paar
  Zahlen).
- Mehrere Messungen am selben Tag, Uhrzeit.
- Fortschrittsfotos (zu groß für `localStorage`, siehe IndexedDB-Umzug in der ROADMAP).
- Export als CSV.

## Richtung Training

Der Workout-Teil ist ein eigenes, größeres Projekt (ROADMAP, „Trainingsbuch“). Was Form dafür schon
vorbereitet: Körpergewicht ist hier ein ganz normaler Wert – die offene Frage „Körpergewicht mit
erfassen?“ im Trainingsbuch ist damit beantwortet. Offen bleibt, ob das Training als zweiter Bereich in
Form kommt (dann mit Tab oder Umschalter auf der Übersicht) oder als eigene App, die Forms Daten liest.
