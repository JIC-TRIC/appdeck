# Form – Konzept

Fortschritt in Zahlen, in zwei Bereichen: **Werte** – Körperwerte wie Gewicht, Bizeps oder Taille von
Hand eintragen und sehen, wohin es geht – und **Training** – Übungen, Sätze, Gewicht und Wdh, schnell
genug für zwischen zwei Sätzen im Studio (siehe „Training“ unten).

Projekt-ID `form`, Ordner `apps/form/`, Speicher unter `form:*`. Gebaut in TypeScript + Ionic wie
Kontor, Steady, Piano, Loci und Stash.

`[ ]` = offen, `[x]` = gebaut. **Stand: Werte gebaut (08.10.2026), Training gebaut (10.10.2026).**
Die Werte nach einer kurzen Fragerunde direkt gebaut, ohne Mockups. Gewählt wurde: Name **Form**, Look **Kreide (dunkel) mit grellem Orange**, dazu
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
  Zwischen Werten und Training wechselt ein Umschalter in der Kopfleiste der beiden Startseiten; Form
  öffnet den Bereich, in dem man zuletzt war.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Design (Richtung „Kreide“)

Schwarz wie eine Gummimatte im Studio, Kreideweiß für Text und Linien, ein grelles Orange als einzige
Akzentfarbe. Schmale, fette Versalien wie auf einer Anzeigetafel für Wortmarke, Namen und große Zahlen.

| Token | Wert | Wofür |
|---|---|---|
| `--bg` | `#0D0D0E` | Grund, Launcher-Übergang, theme-color |
| `--surface` / `-2` / `-3` | `#161618` / `#1F1F22` / `#2C2C30` | Karten / Felder, Tasten / gewählt, gedrückt |
| `--line` | `#262629` | Trenner, Raster im Verlauf |
| `--text` / `-2` / `-3` | `#F2F0EB` / `#A8A49C` / `#77736C` | Kreide, abgestuft |
| `--accent` | `#FF6A00` | Hauptknopf, jüngster Punkt, Ziel, Fortschritt |
| `--danger` | `#FF5C6C` | nur „Wert löschen“ und „keine Zahl“ |

- **Schrift:** Barlow Condensed 600–800 für Wortmarke („FORM.“ mit orangem Punkt), Namen und große
  Zahlen, Instrument Sans für alles andere. Barlow Condensed ist die einzige Schrift, die nur Form
  braucht (`@fontsource/barlow-condensed`, seit 08.10.2026; vorher Schibsted Grotesk, wirkte zu
  brav). Keine Tabellenziffern – sonst bekäme das Komma Ziffernbreite (Kontors Lehre).
- **Dicht** (seit 10.10.2026, für beide Bereiche): Kopfleiste 44 px, Wortmarke 48 px, Karten mit
  14–16 px Rundung, Hauptknopf 46 px hoch. Im laufenden Training sind etwa fünf Übungen auf einmal zu
  sehen. Vorher waren alle Elemente größer, es passte zu wenig auf den Bildschirm.
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

## Training

Der zweite Bereich. **Stand: gebaut (10.10.2026)** nach einer Feature-Liste und Mockups aller
Ansichten ([mockups.html](mockups.html), Beispieltag Sa 10. Okt 2026, 18:14, „Push“ läuft). Entschieden
in der Runde: Umschalter statt Tab-Leiste, während eines Trainings sind die Werte schwer zu erreichen,
erst `localStorage` (IndexedDB später), grau steht das letzte Mal aus derselben Vorlage, die Pause wird
aus dem letzten Haken berechnet, alles dichter als die Werte bisher. Körpergewicht bleibt ein normaler
Wert.

### Prinzipien

- **Läuft ein Training, gehört ihm der ganze Bildschirm.** Kein Umschalter, kein Zurück, Form öffnet
  direkt dort. Zu den Werten geht es nur über ⋯ → „Werte ansehen“ (darüber „‹ Training“ zurück).
- **Grau steht das letzte Mal.** Ein Haken übernimmt es – wer dasselbe schafft wie letztes Mal, tippt
  nur Haken. Kein eigenes „Zuletzt“-Feld.
- **Die Pause wird berechnet, nicht gezählt.** Jeder Haken speichert seine Uhrzeit, die Pause ist jetzt
  minus letzter Haken. App zu, Handy gesperrt – beim Öffnen stimmt sie trotzdem.
- **Gespeichert wird nur, was du einträgst:** Zahlen und die Uhrzeit des Hakens. Rekorde, Volumen,
  Dauer, Fortschritt werden berechnet (`trainingCalc.ts`).
- **Orange heißt Fortschritt** – mehr als letztes Mal, Rekorde, „Pause um“. Weniger steht weiß da.
- **Ein Tipp startet.** Vorlagen ohne Vorschau, die Übungen weiß man.

### Regeln

Übungen:

- [x] Name (40 Zeichen), Erfassung **Gewicht × Wdh**, **nur Wdh** oder **Zeit** (Sekunden), Pause
  (0:15–10:00 in 15-s-Schritten, Standard 2:00), Notiz (80 Zeichen, steht im Training unter dem Namen).
- [x] Kein Startkatalog: Übungen entstehen beim Hinzufügen über die Suche („‚Facepull‘ anlegen“, mit
  Gewicht × Wdh) oder unter Übungen.
- [x] Die Erfassung lässt sich nur ändern, solange die Übung nie trainiert wurde. Trainierte werden
  archiviert statt gelöscht (Verlauf bleibt, taucht beim Hinzufügen nicht mehr auf), nie trainierte
  lassen sich löschen – auch aus den Vorlagen.

Vorlagen:

- [x] Name und Übungen, pro Übung Satzzahl (1–20) und Wdh-Bereich (optional, steht im Training neben
  dem Namen). Reihenfolge auf der Startseite und in der Vorlage per Griff.
- [x] Neu entweder unter Vorlagen oder beim Beenden eines leeren Trainings („Als Vorlage speichern“ –
  das Training gehört danach zur Vorlage).
- [x] Weicht ein Training von seiner Vorlage ab (Übung fehlt oder kam dazu, andere Satzzahl oder
  Reihenfolge), fragt „Fertig“: anpassen oder so lassen. Anpassen übernimmt Übungen, Reihenfolge und
  Satzzahl, die Wdh-Bereiche bleiben.

Sätze:

- [x] **Grau:** derselbe Satz aus dem letzten Training mit derselben Vorlage. Gab es die Übung dort noch
  nie (oder ist es ein leeres Training): das letzte Mal überhaupt. Hat das letzte Mal weniger Sätze,
  gilt der Satz davor in diesem Training.
- [x] **Haken:** füllt leere Felder mit dem Grauen und speichert die Uhrzeit. Fehlt eine Zahl, geht das
  Tastenfeld auf. Ein zweiter Tipp nimmt den Haken wieder weg.
- [x] **Tastenfeld** statt iOS-Tastatur: der erste Tastendruck ersetzt, ±2,5 kg / ±1 Wdh / ±5 s, jeder
  Tastendruck wird sofort gesichert. Darunter „Zuletzt bei Push: 30 × 9“.
- [x] **Orange** am abgehakten Satz: mehr Gewicht als der gleiche Satz vom letzten Mal, oder mehr Wdh
  bei mindestens gleichem Gewicht.
- [x] **Rekord** („PR“ statt Satznummer): schwerster Satz oder bestes geschätztes 1RM (Epley) bisher,
  über alle Vorlagen – bei nur Wdh die meisten, bei Zeit die längste. Zählt auch gegen frühere Sätze im
  selben Training. Im ersten Training einer Übung gibt es keinen.
- [x] Fertige Übungen (alle Sätze abgehakt) schrumpfen auf eine Zeile, ein Tipp klappt sie auf.

Pause, Beenden, Nachtragen:

- [x] Oben in der Kopfleiste: jetzt minus letzter Haken, der Strich füllt sich bis zur Pause der
  Übung des letzten Hakens, danach orange. Vor dem ersten Haken die Trainingsdauer. Kein Ton, keine
  Mitteilung (geht als Web-App im Hintergrund nicht).
- [x] Beenden mit offenen Sätzen: verwerfen oder abhaken (mit dem Grauen). Ohne abgehakten Satz:
  verwerfen. Übungen ohne Satz fallen weg.
- [x] Beliebig viele Trainings am Tag. Nachtragen: Tag (nicht in die Zukunft), Vorlage, Beginn, Dauer –
  danach dieselbe Ansicht wie im Training, ohne Pause, erst „Sichern“ schreibt.

### Speicher

```
form:uebungen   [{ id, name, erfassung, pause, notiz, archiviert, erstellt }]
form:vorlagen   [{ id, name, rang, uebungen: [{ uebung, saetze, von, bis }] }]
form:trainings  [{ id, vorlage, name, start, ende, uebungen: [{ uebung, saetze: [{ kg, wdh, sek, fertig }] }] }]
form:laufend    das laufende Training (gleiche Form, ende null) – nach jedem Tipp gesichert
form:bereich    'werte' | 'training' – wo Form zuletzt war
```

Gelesenes wird geprüft (`normalisiere*` in `trainingStore.ts`, getestet). Die Rechnungen stehen in
`trainingCalc.ts` (getestet). Grob 4.000 Sätze im Jahr, ein paar hundert KB – passt vorerst in
`localStorage`.

### Ansichten

Nummern wie in den Mockups.

- [x] **1 Werte:** wie bisher, neu der Umschalter in der Kopfleiste.
- [x] **2 Training:** „Zuletzt trainiert vor 2 Tagen“, Wortmarke, Vorlagen (Name, wann zuletzt,
  oranger Start), „Leeres Training“, darunter Verlauf und Übungen. „Bearbeiten“ führt zu den Vorlagen.
- [x] **3 Erster Start:** solange es weder Training noch Vorlage gibt – „Erstes Training?“ und ein Knopf.
- [x] **4 Training läuft:** ⋯ (Menü), Pause, Beenden. Pro Übung Name, Wdh-Bereich, ⋯, Notiz, Sätze
  `Nr | kg × Wdh | Haken`, „+ Satz“. Unten „+ Übung“.
- [x] **5 Satz eingeben:** Blatt mit beiden Feldern, Schnellknöpfen, Ziffern und „Abhaken“.
- [x] **6 Übung hinzufügen:** ganze Seite, Suche, „Zuletzt“ (bis 5, nicht schon dabei), „Alle“.
  Mehrere auf einmal; beim Tauschen genügt ein Tipp.
- [x] **7 Übung im Training:** Pause der Übung, Verlauf ansehen, tauschen (Satzzahl bleibt),
  verschieben, letzten Satz entfernen, herausnehmen.
- [x] **8 Menü im Training:** Beginn ändern, Werte ansehen, Training verwerfen.
- [x] **9 Fertig:** Dauer, Sätze, Volumen, Rekorde, Vorlage anpassen bzw. als Vorlage speichern.
- [x] **10 Verlauf:** eine Zeile pro Training, nach Monaten, „PR“ wenn es einen Rekord gab, „+“
  trägt nach.
- [x] **11 Ein Training:** alle Sätze kompakt, Rekorde orange, „Bearbeiten“, darin „Training löschen“.
- [x] **12 Nachtragen.**
- [x] **13 Übungen:** alphabetisch mit Suche, Archivierte ausklappbar ganz unten.
- [x] **14 Eine Übung:** stärkster Satz des letzten Trainings, Kacheln (seit Start, seit letztem,
  Rekord), Verlauf (Gewicht oder 1RM, 3 M / 1 J / Alles), jedes Training mit allen Sätzen.
- [x] **15 Übung bearbeiten.**
- [x] **16 Vorlage bearbeiten** und die Liste der Vorlagen (sortieren, neu).

### Noch nicht gebaut

Aus der Feature-Liste zurückgestellt (ROADMAP, „Training“): Satzarten (Aufwärmen, Drop-Satz), RPE/RIR,
Supersätze, Notiz pro Training, Rotation und Progressionsvorschlag, Rekordtabelle, Monatskalender,
Wochenstatistik, Muskelgruppen, Geräteart und Gewichtsschritte, Scheiben- und Aufwärmrechner, Ton und
Bildschirm-an, Verbindung zu Steady, Körpergewicht in Körpergewichtsübungen, Export als CSV.
