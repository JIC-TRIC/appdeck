# Tick – Konzept

Die Todo-Liste für appdeck. Start sind die Ordner (Projekte, Zuhause, Einkauf …) als Karten, ein Tipp öffnet
einen Ordner als eigene Seite. Alles, was ansteht, steht außerdem in der Gesamtliste „Alle“.

Projekt-ID `tick`, Ordner `apps/tick/`, Speicher unter `tick:*`. Gebaut in TypeScript + Ionic wie Kontor,
Steady, Piano, Loci, Stash und Form. Mockups: [mockups.html](mockups.html).

`[ ]` = offen, `[x]` = gebaut. **Stand: gebaut (23.10.2026).** Erst Feature-Liste und Mockups mit drei
Richtungen, dann gebaut. Gewählt wurde: Richtung **A Reiter**, Name **Tick**, das Symbol aus den Mockups.
Die übrigen Fragen der Fragerunde gingen nach Empfehlung (siehe „Entschieden“ ganz unten).

**Umbau (25.10.2026):** Keine Reiter mehr. Die Reiterleiste unter dem Titel brauchte zu viel Platz. Start ist
jetzt die Seite mit allen Ordnern als Karten, ein Ordner ist eine eigene Seite über die ganze Höhe.

---

## Abgrenzung

- **Steady** ist für Wiederkehrendes (jeden Tag, x-mal pro Woche), **Tick** für Einmaliges: erledigt ist
  erledigt. Darum keine Wiederholungen.
- **Stash** ist für Gedanken und Prompts, die raus an den Laptop gehen. Was in Tick steht, bleibt auf dem
  Gerät und wird abgehakt.

## Prinzipien

- **Erst die Ordner, dann die Liste.** Der Start zeigt alle Ordner auf einen Blick, ein Tipp gibt die ganze
  Seite der Liste dieses Ordners. „Alle“ zeigt alles, was offen ist. Das sind nur Ansichten derselben Todos,
  nichts wird kopiert.
- **Ein Todo, ein Ordner.** Höchstens ein Ordner pro Todo, keine Tags, keine Unterordner. Ohne Ordner liegt
  es im **Eingang**.
- **Erfassen geht vor Ordnen.** Titel tippen, Weiter, das nächste. Ordner und Datum sind je ein Tipp, aber
  nie Pflicht. Im offenen Ordner ist der Ordner schon gewählt.
- **Die Reihenfolge ist die Priorität.** Keine Prioritätsstufen, keine Sterne. Was wichtig ist, zieht man
  nach oben.
- **Farbe gehört den Ordnern** (wie in Steady den Gewohnheiten). Die Oberfläche selbst bleibt schwarz-weiß,
  dazu nur Rot für Überfälliges und Löschen.
- **Ohne Push muss man sie finden.** Erinnerungen per Mitteilung gehen als Web-App nicht (ROADMAP „Geht
  nicht“). Darum steht Fälliges rot auf den Karten und in „Alle“ ganz oben, und die Kachel im Launcher zeigt,
  wie viel fällig ist.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Feature-Liste

Die Kurzfassung, Details unter „Regeln“. Die Nummern in Klammern sind die Ansichten in den Mockups.

1. [x] **Start: alle Ordner als Karten**, mit offen und fällig, ein Tipp öffnet den Ordner (1)
2. [x] **Gesamtliste „Alle“**: oben alles Fällige, darunter ein Abschnitt pro Ordner (2)
3. [x] **Ordner als eigene Seite** über die ganze Höhe, zurück mit „‹“ oder Wischen vom Rand (3)
4. [x] **Schnellfeld** unten auf jeder Seite: tippen, Plus oder Weiter, das nächste. Ordner und Datum als
   Chips (4), `#` im Titel wählt einen Ordner (5)
5. [x] **Kategorie pro Todo**: beim Erfassen, im Todo selbst oder per Wischen „Verschieben“ (6, 7, 8)
6. [x] **Notiz und Fälligkeitsdatum** pro Todo, beides optional, Datum ohne Uhrzeit (7)
7. [x] **Abhaken** mit kurzer Bedenkzeit, Erledigtes eingeklappt am Ende jeder Liste (8, 9)
8. [x] **Wischen**: Verschieben in einen anderen Ordner, Löschen (8)
9. [x] **Reihenfolge im Ordner** über Griffe
10. [x] **Ordner bearbeiten**: anlegen, umbenennen, Farbe, Reihenfolge, löschen (11, 12, 13)
11. [x] **Suche** über alles, auch Erledigtes (10)
12. [x] **Plakette an der Kachel** im Launcher mit der Zahl der fälligen Todos (15)
13. [x] **Tick öffnet dort, wo man zuletzt war**: auf dem Start oder in einem Ordner
14. [x] **Erststart** mit Ordner-Vorschlägen (14)

## Regeln

### Todo

- [x] Ein Todo = **Titel** (Pflicht, eine Zeile, höchstens 200 Zeichen), **Notiz** (optional, mehrzeilig,
  höchstens 2.000 Zeichen), **Ordner** (optional) und **Fällig** (optional, ein Tag ohne Uhrzeit).
- [x] Dazu wird festgehalten, wann es angelegt und wann es erledigt wurde.
- [x] Beim Speichern wird getrimmt wie in Stash. Ist der Titel leer, tut Weiter nichts.

### Start: alle Ordner

- [x] Tick öffnet mit allen Ordnern als Karten, zwei nebeneinander: **Alle**, **Eingang** (wenn darin etwas
  liegt), dann die Ordner in ihrer Reihenfolge, am Ende **Neuer Ordner**. Titel „Ordner“, darunter
  „21 offen · 3 fällig“.
- [x] Jede Karte trägt oben einen Strich in der Ordnerfarbe („Alle“: Tinte), dazu Name, wie viel offen ist
  und in Rot, wie viel fällig ist.
- [x] Ein Tipp auf eine Karte öffnet die Liste als eigene Seite, die von rechts hereinfährt. Zurück mit
  „‹ Ordner“ oder Wischen vom linken Rand. „‹ Apps“ steht nur auf dem Start.
- [x] Das Schnellfeld legt hier in den Eingang (oder den Ordner aus dem Chip), dazu kurz „In Eingang abgelegt“.
- [x] Tick merkt sich die offene Seite. Ist beim Öffnen ein Ordner offen, liegt der Start darunter.
- [x] ⋯ auf dem Start: **Ordner bearbeiten** (siehe unten) und **Neuer Ordner**.
- (Bis 25.10.2026 standen die Ordner als Reiterleiste unter dem Titel, die Karten waren eine Extraseite hinter
  einem Ordner-Symbol. Die Reiter brauchten zu viel Platz.)

### Gesamtliste „Alle“

- [x] Oben **Fällig**: alles Überfällige und heute Fällige aus allen Ordnern, das älteste Datum zuerst, am
  selben Tag der Eingang vor den Ordnern. Jede Zeile nennt dort ihren Ordner. Ist nichts fällig, fehlt der
  Abschnitt.
- [x] Darunter ein Abschnitt pro Ordner in der Reihenfolge der Karten, der **Eingang** zuerst. Kopf:
  Farbpunkt, Name, ›. Ein Tipp auf den Kopf öffnet den Ordner als weitere Seite („‹ Alle“ führt zurück).
  Leere Ordner fehlen.
- [x] Was oben unter Fällig steht, steht nicht noch einmal in seinem Ordner-Abschnitt.
- [x] Innerhalb eines Abschnitts gilt die Reihenfolge aus dem Ordner.
- [x] Der Ring des Abhak-Kreises trägt die Farbe des Ordners, so sieht man auch in „Alle“, wohin ein Todo
  gehört.
- [x] Ganz unten **Erledigt**, eingeklappt (siehe unten).

### Ordnerseite

- [x] Kopf: „‹ Ordner“ (bzw. „‹ Alle“, wenn man aus „Alle“ kam), Lupe und ⋯. Darunter groß der Name und
  „5 offen · 6 erledigt“, dann das weiße Blatt mit der Liste über die ganze Höhe. Es trägt oben den Strich in
  der Ordnerfarbe wie die Karte, aus der es kommt.
- [x] Beim Scrollen wandert der große Titel klein in die Kopfleiste.
- [x] ⋯: **Reihenfolge ändern** (ab zwei offenen Todos), den Ordner **bearbeiten** (Name, Farbe, löschen),
  **Neuer Ordner**.
- [x] Ein Ordner zeigt seine offenen Todos in seiner eigenen Reihenfolge. Fällige behalten ihren Platz und
  tragen das Datum, sie rutschen nicht nach oben.
- [x] **Reihenfolge ändern**: lange auf eine Zeile drücken (oder ⋯ → Reihenfolge ändern). Rechts erscheinen
  Griffe, daran zieht man, oben rechts steht **Fertig**. Nur im Ordner und im Eingang, nicht in „Alle“.
  (Im Entwurf hieß es „lange drücken, dann ziehen“ in einem Zug. Ionics Sortieren startet nur an einem Griff,
  und eine ganze Zeile als Griff würde das Scrollen schlucken.)
- [x] Neu Angelegtes kommt **ans Ende**, direkt über das Schnellfeld, wie auf einem Zettel.
- [x] Ordner = **Name** (höchstens 24 Zeichen, eindeutig, Groß- und Kleinschreibung egal, nicht „Alle“ oder
  „Eingang“) + **Farbe** aus zehn festen Tönen. Ein neuer Ordner bekommt die erste freie Farbe. Keine Grenze
  bei der Zahl der Ordner.
- [x] Der **Eingang** ist kein Ordner: kein eigener Name, Grau, nicht löschbar, steht immer zuerst.

### Erfassen

- [x] Unten in jeder Liste das Schnellfeld **Neues Todo**, rechts darin der Ordner, in dem es landet. Ein
  Tipp öffnet die Tastatur, das Feld sitzt darüber (Tick legt sich auf den sichtbaren Ausschnitt wie Stash).
- [x] Unter dem Feld eine Chip-Zeile: **Ordner** (Farbpunkt + Name, ein Tipp öffnet die Auswahl), **Heute**,
  **Morgen**, **Datum …** (öffnet den Kalender des Telefons). Ein Tipp auf den gewählten Datums-Chip nimmt
  ihn wieder heraus. Die Chips nehmen dem Feld den Fokus nicht, die Tastatur bleibt stehen.
- [x] Vorgewählt ist der offene Ordner, auf dem Start und in „Alle“ der Eingang. Eine andere Seite setzt den
  Ordner neu.
- [x] Das **Plus** links im Feld oder **Weiter** auf der Tastatur legt an. Das Plus bleibt beim Tippen stehen
  und ist blass, solange das Feld leer ist. Das Feld bleibt danach offen und leer, Ordner und Datum bleiben
  stehen, so geht die Einkaufsliste am Stück. Fertig ist man mit einem Tipp neben das Feld oder Tastatur zu.
  Steht noch Text drin, bleibt das Feld mit dem Plus offen, auch ohne Tastatur.
  (Seit 23.10.2026: Vorher legte nur die Taste an, und links stand offen ein leerer Kreis, der wie ein
  Abhak-Knopf aussah – am iPhone fand man keinen Weg, das Geschriebene abzulegen. Ein zusätzlicher Knopf
  „Hinzufügen“ rechts war kurz drin und ist wieder weg, das Plus reicht.)
- [x] Das neue Todo leuchtet kurz in der Ordnerfarbe auf und wird ins Bild geholt.
- [x] **`#` im Titel**: `#ge` zeigt passende Ordner über dem Feld (die mit dem Getippten beginnen zuerst,
  höchstens vier), ein Tipp setzt den Ordner und nimmt `#ge` aus dem Titel. Ohne Tipp bleibt `#ge` einfach
  Text.
- [x] Landet das neue Todo nicht auf der offenen Seite (auch auf dem Start), kommt kurz „In Geschenke abgelegt“.
- [x] **Entwurf**: Was im Feld steht, übersteht das Schließen der App (wie in Stash).

### Abhaken

- [x] Ein Tipp auf den Kreis: Er füllt sich in der Ordnerfarbe und springt kurz auf, der Titel wird
  durchgestrichen, dazu die Haptik wie in Form.
- [x] Die Zeile bleibt 2 Sekunden stehen, ein zweiter Tipp nimmt den Haken zurück. Danach rutscht sie zu
  „Erledigt“. Mehrere schnell hintereinander rutschen gemeinsam (jeder Haken startet die Zeit neu).
- [x] Geht die App in den Hintergrund, wird sofort festgeschrieben – iOS hält den Timer dort an.
- [x] Abhaken geht überall, auch unter „Fällig“, in der Suche und im Todo selbst.

### Erledigt

- [x] Am Ende jeder Liste eine Zeile **Erledigt · 6**, eingeklappt. Aufgeklappt nach Tagen: Heute, Gestern,
  dann Wochentag und Datum, das Neueste zuerst. In „Alle“ nennt jede Zeile ihren Ordner.
- [x] Ein Tipp auf den gefüllten Kreis macht das Todo sofort wieder offen. Es kommt an seinen alten Platz
  zurück (der Rang bleibt beim Abhaken erhalten).
- [x] **Erledigte löschen** am Ende der aufgeklappten Liste, mit Rückfrage („6 erledigte Todos in Projekte
  löschen?“). In „Alle“ gilt das für alle Ordner.
- [x] Erledigtes bleibt, bis man es löscht.

### Wischen und Todo bearbeiten

- [x] **Nach links wischen**: **Verschieben** (öffnet die Ordnerauswahl) und **Löschen** (rot). Ganz
  durchwischen löscht sofort. Nach dem Löschen steht „Rückgängig“ in der Meldung.
- [x] **Antippen** öffnet das Todo als Blatt: Titel und Notiz direkt bearbeitbar (beide wachsen mit), darunter
  Ordner, Fällig (Heute, Morgen, Datum, Ohne, darüber der Tag ausgeschrieben) und „Angelegt am …“, ganz unten
  Löschen. Änderungen gelten sofort, kein Sichern-Knopf. Ein leerer Titel bleibt beim alten. Nach unten
  wegziehen oder Fertig schließt (README „Fenster in allen Apps“).

### Fällig

- [x] Ein Tag ohne Uhrzeit. Angezeigt als **heute**, **morgen**, bis 6 Tage voraus als Wochentag (**Mi**), sonst
  **10. Nov**, in einem anderen Jahr mit Jahreszahl.
- [x] **Überfällig** in Rot: **gestern**, sonst **seit Mo** bzw. **seit 2. Okt**.
- [x] Nach Mitternacht rechnet Tick beim Zurückkommen neu (und jede Minute, solange es offen ist).

### Ordner bearbeiten

- [x] Auf dem Start über ⋯ → **Ordner bearbeiten**: Statt der Karten stehen dort der Eingang für sich und
  darunter alle Ordner mit Farbpunkt, Name, Anzahl und Griff, oben rechts **Fertig**. Die Reihenfolge hier ist
  die der Karten und der Abschnitte in „Alle“. Darunter **Neuer Ordner**.
- [x] Ein Tipp auf einen Ordner öffnet ein Blatt mit Name, Farbe, Vorschau der Karte und **Ordner löschen**.
  Dasselbe Blatt kommt auf der Ordnerseite über ⋯ → „Projekte“ bearbeiten.
- [x] **Löschen** fragt nach. Liegen noch offene Todos darin: **In den Eingang verschieben** (ans Ende) oder
  **Mit allen 3 Todos löschen**. Erledigte gehen mit dem Ordner. Steht man gerade in dem Ordner, geht es zurück
  zum Start.
- [x] Ein neuer Ordner (Karte „Neuer Ordner“ oder ⋯) erscheint als Karte. Aus der Ordnerauswahl heraus
  angelegt, ist er gleich gewählt.

### Suche

- [x] Lupe oben rechts, auf jeder Seite. Sucht in Titel und Notiz, Groß- und Kleinschreibung egal, über alle
  Ordner.
- [x] Treffer getrennt nach **Offen** und **Erledigt**, Treffer im Titel zuerst, jeder mit seinem Ordner, der
  Treffer gelb hervorgehoben. Steht er nur in der Notiz, zeigt die Zeile den Ausschnitt.

### Hinweis im Launcher

- [x] Plakette an der Kachel mit der Zahl der offenen Todos, die heute fällig oder überfällig sind. Bei 0
  keine Plakette, ab 100 „99+“.
- [x] Allgemein gebaut: In `apps.js` kann jede App eine Funktion `badge` haben, die eine Zahl liefert. Der
  Launcher fragt sie beim Zeichnen und beim Zurückkommen ab. Für Tick ist das `tickBadge()`, es liest nur
  `faellig` und `erledigt` aus `tick:todos` (dieselbe Rechnung wie `plakette()` in `liste.ts`). Die Zeitkapsel
  (`ideen/zeitkapsel.md`) kann das mitnutzen.

### Erststart

- [x] Noch kein Todo und kein Ordner: „Was steht an?“ und das Schnellfeld. Darunter Ordner-Vorschläge als Chips
  (**Zuhause**, **Einkauf**, **Projekte**, **Papierkram**, **Arbeit**), ein Tipp legt den Ordner an. Kein
  Erklärtext. Sobald es einen Ordner oder ein Todo gibt, kommen die Karten.
- [x] Ist in einem Ordner alles erledigt: „Alles erledigt“ und darunter, wie viel heute erledigt wurde. Ein
  neuer, leerer Ordner sagt „Noch nichts drin“.

### Backup

- [x] Das Launcher-Backup erfasst `tick:*` automatisch, wie bei allen Apps.

## Datenmodell

```
tick:todos     [{ id, titel, notiz, ordner: id | null, faellig: 'YYYY-MM-DD' | null,
                  rang: number, angelegt: ms, erledigt: ms | null }]
tick:ordner    [{ id, name, farbe: 0–9, rang: number }]
tick:entwurf   { titel, ordner: id | null, faellig: 'YYYY-MM-DD' | null }
tick:seite     'start' | 'alle' | 'eingang' | ordnerId
```

- `tick:seite` ist die zuletzt offene Seite. Bis 25.10.2026 hieß der Schlüssel `tick:reiter` (der offene Reiter).
  Er wird nicht übernommen, damit nach dem Umbau der Start mit den Karten kommt, und beim ersten Speichern
  entfernt.

- `ordner: null` = Eingang. Zeigt `ordner` auf einen Ordner, den es nicht mehr gibt, gilt das Todo als Eingang.
- `rang` ordnet innerhalb des Ordners. Neu ans Ende = größter Rang + 1. Sortieren nummeriert die offenen Todos
  des Ordners neu durch (0, 1, 2 …), erledigte behalten ihren Rang und kommen beim Wiederöffnen ungefähr an
  ihren alten Platz. Verschieben setzt ans Ende des neuen Ordners.
- Gelesenes wird geprüft und notfalls verworfen (`normalisiere*` in `store.ts`, getestet in `store.test.ts`),
  wie überall. Listenlogik (`liste.ts`) und Tage (`tage.ts`) sind reine Funktionen mit eigenen Tests.
- **Größe:** Ein Todo ohne Notiz sind gut 150 Zeichen. 2.000 Todos mit den Erledigten sind rund 300 KB, mit
  einem Emoji irgendwo im Wert das Doppelte (WebKit zählt Bytes, siehe ROADMAP „IndexedDB“). Unkritisch,
  solange Erledigtes nicht über Jahre liegen bleibt.

## Ansichten

Nummern wie in den Mockups.

1. **Ordner (Start):** Kopf mit ‹ Apps, Lupe und ⋯, großer Titel „Ordner“ mit „21 offen · 3 fällig“, darunter
   die Karten, unten das Schnellfeld.
2. **Alle:** eigene Seite, oben Fällig, dann die Ordner-Abschnitte.
3. **Ordner:** eigene Seite mit „‹ Ordner“, nur seine Todos in eigener Reihenfolge, am Ende „Erledigt · 6“.
4. **Erfassen:** Tastatur offen, darüber das Feld mit der Chip-Zeile.
5. **`#` für den Ordner:** passende Ordner als Vorschlag über dem Feld.
6. **Ordner wählen:** Blatt mit Eingang und allen Ordnern samt Anzahl, der aktuelle mit Haken, unten
   „Neuer Ordner …“. Kommt vom Ordner-Chip, aus dem Todo und vom Wischen.
7. **Todo:** Blatt mit Titel, Notiz, Ordner, Fällig, „Angelegt am“ und Löschen.
8. **Abhaken und Wischen:** eine Zeile gerade abgehakt, eine nach links gewischt.
9. **Erledigt:** aufgeklappt nach Tagen, am Ende „Erledigte löschen“.
10. **Suche:** Treffer nach Offen und Erledigt, auch aus der Notiz.
11. **Ordner bearbeiten:** auf dem Start, Eingang für sich, darunter die Ordner mit Griff, „Neuer Ordner“.
12. **Ordner (Blatt):** Name, zehn Farben, Vorschau der Karte, „Ordner löschen“.
13. **Ordner löschen:** Rückfrage, wohin die offenen Todos sollen.
14. **Erststart:** „Was steht an?“, Ordner-Vorschläge, Schnellfeld.
15. **Launcher:** Kachel mit Plakette.

## Design (Richtung „Reiter“)

- Kühles Hellgrau `#ECEEF1` als Grund. Auf dem Start liegen darauf die Ordner als weiße Karten, auf einer
  Ordnerseite das weiße Blatt mit der Liste. Karte und Blatt tragen oben einen Strich von 3 px in der
  Ordnerfarbe („Alle“: Tinte). Der Name der Richtung stammt aus der Zeit, als die Ordner Karteireiter über dem
  Blatt waren, der Strich ist davon geblieben.
- Tinte `#16181D` für Knöpfe und den Plus-Kreis, Rot `#D92D20` für Überfälliges und Löschen, Gelb nur für den
  Treffer in der Suche.
- **Ordnerfarben** (`farben.ts`): Rot `#E5484D`, Orange `#EF7A1C`, Gelb `#E2A800`, Grün `#2F9E5B`, Petrol
  `#0E9384`, Blau `#2E7CF6`, Indigo `#5B5FE0`, Violett `#9B51E0`, Pink `#E0457B`, Braun `#A0714F`. Der Eingang
  ist grau `#8E959E` und keine der zehn.
- **Schrift:** Figtree für alles (400 bis 800, `@fontsource/figtree`, nur Latein).
- Nur hell, kein Dark Mode.
- **Symbol** im Stil „Signal“ (siehe README): drei Listenzeilen, die oberste abgehakt, weiß auf Violett
  `#7A50E0` (`icons/tick.svg`). Violett hatte noch keine App, und das Motiv ist nicht der Kasten von Steady.
- In den Mockups stehen dazu die verworfenen Richtungen B „Nacht“ (dunkel, Ordner als Chips, Geist) und C
  „Block“ (Ordner als Farbflächen, Archivo).

## Nicht im MVP

- **Wiederholungen** (jeden Montag Müll rausstellen). Grenze zu Steady. Später vielleicht „wiederholen alle
  N Tage oder Wochen“: Abhaken legt das nächste an.
- **Unteraufgaben** im Todo. Bis dahin trägt die Notiz.
- **Mehrfachauswahl**: mehrere auf einmal verschieben, erledigen oder löschen. Praktisch, um den Eingang
  aufzuräumen.
- **Seitlich wischen zwischen Ordnern**: beißt sich mit dem Wischen auf den Zeilen.
- **Eigene Ansicht „Heute“ oder „Geplant“** als Karte auf dem Start.
- **Ordner archivieren** statt löschen.
- **Aus Stash übernehmen**: eine Notiz aus dem Stapel als Todo.
- Fotos und Anhänge, erst nach dem IndexedDB-Umzug (ROADMAP).

## Geht nicht / bewusst nicht

- Erinnerungen per Mitteilung, Uhrzeiten mit Wecker: bräuchten einen Server (ROADMAP „Geht nicht“).
- Gemeinsame Listen mit anderen: ebenso.
- Prioritäten, Tags, Unterordner: siehe Prinzipien.

## Entschieden (Fragerunde, 23.10.2026)

1. **Name:** Tick (Vorschläge waren Tick, Docket, Tabs, Slate, Binder, Sorted).
2. **Richtung:** A Reiter, nur hell.
3. **Gesamtliste:** nach Ordnern mit „Fällig“ oben, nicht flach nach Datum.
4. **Eingang:** Todos ohne Ordner sind erlaubt.
5. **Fälligkeitsdatum:** ja, ohne Uhrzeit.
6. **Neues Todo:** ans Ende.
7. **Erledigtes:** bleibt, bis man es löscht.
8. **Plakette im Launcher:** fällige Todos.
9. **`#` beim Tippen:** ja, zusätzlich zum Ordner-Chip.
10. **Aufbau (25.10.2026):** Start sind die Ordner als Karten, ein Ordner ist eine eigene Seite. Die Reiter
    sind weg, sie brauchten zu viel Platz.

## Später klären

- Auf dem iPhone testen: Schnellfeld direkt über der Tastatur, Chips ohne dass die Tastatur zugeht, Haptik beim
  Abhaken, langer Druck zum Sortieren.
- Ob die Plakette auch alle offenen statt nur der fälligen zählen soll.
