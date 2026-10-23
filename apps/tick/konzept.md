# Tick – Konzept

Die Todo-Liste für appdeck. Alles, was ansteht, steht in einer Gesamtliste. Jedes Todo kann in einem
Ordner liegen (Projekte, Zuhause, Einkauf …), und jeder Ordner lässt sich für sich ansehen.

Projekt-ID `tick`, Ordner `apps/tick/`, Speicher unter `tick:*`. Gebaut in TypeScript + Ionic wie Kontor,
Steady, Piano, Loci, Stash und Form. Mockups: [mockups.html](mockups.html).

`[ ]` = offen, `[x]` = gebaut. **Stand: gebaut (23.10.2026).** Erst Feature-Liste und Mockups mit drei
Richtungen, dann gebaut. Gewählt wurde: Richtung **A Reiter**, Name **Tick**, das Symbol aus den Mockups.
Die übrigen Fragen der Fragerunde gingen nach Empfehlung (siehe „Entschieden“ ganz unten).

---

## Abgrenzung

- **Steady** ist für Wiederkehrendes (jeden Tag, x-mal pro Woche), **Tick** für Einmaliges: erledigt ist
  erledigt. Darum keine Wiederholungen.
- **Stash** ist für Gedanken und Prompts, die raus an den Laptop gehen. Was in Tick steht, bleibt auf dem
  Gerät und wird abgehakt.

## Prinzipien

- **Eine Gesamtliste, viele Ordner.** „Alle“ zeigt alles, was offen ist, ein Ordner nur seins. Beides sind
  Ansichten derselben Todos, nichts wird kopiert.
- **Ein Todo, ein Ordner.** Höchstens ein Ordner pro Todo, keine Tags, keine Unterordner. Ohne Ordner liegt
  es im **Eingang**.
- **Erfassen geht vor Ordnen.** Titel tippen, Weiter, das nächste. Ordner und Datum sind je ein Tipp, aber
  nie Pflicht. Im offenen Ordner ist der Ordner schon gewählt.
- **Die Reihenfolge ist die Priorität.** Keine Prioritätsstufen, keine Sterne. Was wichtig ist, zieht man
  nach oben.
- **Farbe gehört den Ordnern** (wie in Steady den Gewohnheiten). Die Oberfläche selbst bleibt schwarz-weiß,
  dazu nur Rot für Überfälliges und Löschen.
- **Ohne Push muss man sie finden.** Erinnerungen per Mitteilung gehen als Web-App nicht (ROADMAP „Geht
  nicht“). Darum steht Fälliges in „Alle“ ganz oben, und die Kachel im Launcher zeigt, wie viel fällig ist.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Feature-Liste

Die Kurzfassung, Details unter „Regeln“. Die Nummern in Klammern sind die Ansichten in den Mockups.

1. [x] **Gesamtliste „Alle“**: oben alles Fällige, darunter ein Abschnitt pro Ordner (1)
2. [x] **Ordner als Reiter** unter dem Titel, ein Tipp zeigt nur diesen Ordner (2)
3. [x] **Schnellfeld** unten in jeder Liste: tippen, Weiter, das nächste. Ordner und Datum als Chips (3),
   `#` im Titel wählt einen Ordner (4)
4. [x] **Kategorie pro Todo**: beim Erfassen, im Todo selbst oder per Wischen „Verschieben“ (5, 6, 7)
5. [x] **Notiz und Fälligkeitsdatum** pro Todo, beides optional, Datum ohne Uhrzeit (6)
6. [x] **Abhaken** mit kurzer Bedenkzeit, Erledigtes eingeklappt am Ende jeder Liste (7, 8)
7. [x] **Wischen**: Verschieben in einen anderen Ordner, Löschen (7)
8. [x] **Reihenfolge im Ordner** über Griffe
9. [x] **Ordner verwalten**: anlegen, umbenennen, Farbe, Reihenfolge, löschen (10, 11, 12)
10. [x] **Suche** über alles, auch Erledigtes (9)
11. [x] **Plakette an der Kachel** im Launcher mit der Zahl der fälligen Todos (14)
12. [x] **Tick öffnet im zuletzt offenen Reiter**
13. [x] **Erststart** mit Ordner-Vorschlägen (13)
14. [x] **Alle Ordner** als Karten, ein Tipp führt direkt in den Ordner (15)

## Regeln

### Todo

- [x] Ein Todo = **Titel** (Pflicht, eine Zeile, höchstens 200 Zeichen), **Notiz** (optional, mehrzeilig,
  höchstens 2.000 Zeichen), **Ordner** (optional) und **Fällig** (optional, ein Tag ohne Uhrzeit).
- [x] Dazu wird festgehalten, wann es angelegt und wann es erledigt wurde.
- [x] Beim Speichern wird getrimmt wie in Stash. Ist der Titel leer, tut Weiter nichts.

### Gesamtliste „Alle“

- [x] Beim allerersten Öffnen der Start, danach öffnet Tick im zuletzt offenen Reiter.
- [x] Oben **Fällig**: alles Überfällige und heute Fällige aus allen Ordnern, das älteste Datum zuerst, am
  selben Tag der Eingang vor den Ordnern. Jede Zeile nennt dort ihren Ordner. Ist nichts fällig, fehlt der
  Abschnitt.
- [x] Darunter ein Abschnitt pro Ordner in der Reihenfolge der Reiter, der **Eingang** zuerst. Kopf:
  Farbpunkt, Name, ›. Ein Tipp auf den Kopf öffnet den Ordner. Leere Ordner fehlen.
- [x] Was oben unter Fällig steht, steht nicht noch einmal in seinem Ordner-Abschnitt.
- [x] Innerhalb eines Abschnitts gilt die Reihenfolge aus dem Ordner.
- [x] Der Ring des Abhak-Kreises trägt die Farbe des Ordners, so sieht man auch in „Alle“, wohin ein Todo
  gehört.
- [x] Ganz unten **Erledigt**, eingeklappt (siehe unten).

### Ordner und Reiter

- [x] Unter dem Titel eine **Reiterleiste**: **Alle**, dann **Eingang** (nur wenn darin etwas liegt oder er
  gerade offen ist), dann die Ordner, ganz rechts **+** für einen neuen Ordner. Jeder Reiter zeigt die Zahl
  seiner offenen Todos. Passt nicht alles, scrollt die Leiste seitlich, und der aktive Reiter rückt ins Bild.
- [x] Ein Tipp auf einen Reiter zeigt nur diesen Ordner. Kein Seitenwechsel, die Liste tauscht sich aus und
  steht wieder oben. Ein Tipp auf den aktiven Reiter scrollt nach oben.
- [x] Beim Scrollen bleibt die Reiterleiste stehen, der große Titel wandert klein in die Kopfleiste.
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
- [x] Vorgewählt ist der offene Ordner, in „Alle“ der Eingang. Ein anderer Reiter setzt den Ordner neu.
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
- [x] Landet das neue Todo nicht in der offenen Ansicht, kommt kurz „In Geschenke abgelegt“.
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

### Alle Ordner (seit 23.10.2026)

- [x] Das Ordner-Symbol oben rechts (neben der Lupe) öffnet eine Seite mit allen Ordnern als Karten, zwei
  nebeneinander: **Alle**, **Eingang** (wenn darin etwas liegt), dann die Ordner in ihrer Reihenfolge, am Ende
  **Neuer Ordner**. Jede Karte trägt oben den Strich in der Ordnerfarbe wie ein aktiver Reiter, dazu Name,
  wie viel offen ist und in Rot, wie viel fällig ist.
- [x] Ein Tipp auf eine Karte führt direkt in den Ordner (die Seite gleitet weg, darunter steht schon sein
  Reiter). Zurück ohne Wahl per „‹“ oder Wischen vom Rand.
- [x] **Bearbeiten** oben rechts macht aus den Karten die Liste zum Verwalten (siehe unten), **Fertig** wieder
  die Karten.

### Ordner verwalten

- [x] Über ⋯ → **Ordner verwalten** oder **Bearbeiten** auf der Seite „Alle Ordner“ (zurück per Wischen vom
  Rand): der Eingang für sich, darunter alle Ordner mit Farbpunkt, Name, Anzahl und Griff. Die Reihenfolge hier
  ist die der Reiter und der Abschnitte in „Alle“. Darunter **Neuer Ordner**.
- [x] ⋯ bietet außerdem **Reihenfolge ändern**, den offenen Ordner bearbeiten und **Neuer Ordner**.
- [x] Ein Tipp auf einen Ordner öffnet ein Blatt mit Name, Farbe, Vorschau des Reiters und **Ordner löschen**.
- [x] **Löschen** fragt nach. Liegen noch offene Todos darin: **In den Eingang verschieben** (ans Ende) oder
  **Mit allen 3 Todos löschen**. Erledigte gehen mit dem Ordner.
- [x] Ein neuer Ordner vom Reiter **+** oder aus dem Menü öffnet sich gleich als Reiter. Aus der Ordnerauswahl
  heraus angelegt, ist er gleich gewählt.

### Suche

- [x] Lupe oben rechts. Sucht in Titel und Notiz, Groß- und Kleinschreibung egal, über alle Ordner.
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

- [x] Noch kein Todo: „Was steht an?“ und das Schnellfeld. Darunter Ordner-Vorschläge als Chips (**Zuhause**,
  **Einkauf**, **Projekte**, **Papierkram**, **Arbeit**), ein Tipp legt den Ordner an. Kein Erklärtext.
- [x] Ist in einem Ordner alles erledigt: „Alles erledigt“ und darunter, wie viel heute erledigt wurde.

### Backup

- [x] Das Launcher-Backup erfasst `tick:*` automatisch, wie bei allen Apps.

## Datenmodell

```
tick:todos     [{ id, titel, notiz, ordner: id | null, faellig: 'YYYY-MM-DD' | null,
                  rang: number, angelegt: ms, erledigt: ms | null }]
tick:ordner    [{ id, name, farbe: 0–9, rang: number }]
tick:entwurf   { titel, ordner: id | null, faellig: 'YYYY-MM-DD' | null }
tick:reiter    'alle' | 'eingang' | ordnerId
```

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

1. **Alle (Start):** Kopf mit ‹ Apps, Ordner-Symbol, Lupe und ⋯, großer Titel mit „21 offen · 3 fällig“, Reiterleiste. Darunter
   Fällig, dann die Ordner-Abschnitte, unten das Schnellfeld.
2. **Ordner:** wie 1, der Reiter des Ordners ist aktiv. Nur seine Todos in eigener Reihenfolge, am Ende
   „Erledigt · 6“.
3. **Erfassen:** Tastatur offen, darüber das Feld mit der Chip-Zeile.
4. **`#` für den Ordner:** passende Ordner als Vorschlag über dem Feld.
5. **Ordner wählen:** Blatt mit Eingang und allen Ordnern samt Anzahl, der aktuelle mit Haken, unten
   „Neuer Ordner …“. Kommt vom Ordner-Chip, aus dem Todo und vom Wischen.
6. **Todo:** Blatt mit Titel, Notiz, Ordner, Fällig, „Angelegt am“ und Löschen.
7. **Abhaken und Wischen:** eine Zeile gerade abgehakt, eine nach links gewischt.
8. **Erledigt:** aufgeklappt nach Tagen, am Ende „Erledigte löschen“.
9. **Suche:** Treffer nach Offen und Erledigt, auch aus der Notiz.
10. **Ordner verwalten:** Eingang für sich, darunter die Ordner mit Griff, „Neuer Ordner“.
11. **Ordner (Blatt):** Name, zehn Farben, Vorschau des Reiters, „Ordner löschen“.
12. **Ordner löschen:** Rückfrage, wohin die offenen Todos sollen.
13. **Erststart:** „Was steht an?“, Ordner-Vorschläge, Schnellfeld.
14. **Launcher:** Kachel mit Plakette.
15. **Alle Ordner:** Karten mit Name, offen und fällig, ein Tipp führt in den Ordner.

## Design (Richtung „Reiter“)

- Kühles Hellgrau `#ECEEF1` als Grund, darauf das weiße Blatt mit der Liste. Die Reiter sitzen auf dem Grau, der
  aktive ist weiß, geht mit nach außen gerundeten Füßen ins Blatt über und trägt oben einen Strich von 3 px in
  der Ordnerfarbe („Alle“: Tinte).
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
- **Eigene Ansicht „Heute“ oder „Geplant“** als Reiter.
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

## Später klären

- Auf dem iPhone testen: Schnellfeld direkt über der Tastatur, Chips ohne dass die Tastatur zugeht, Haptik beim
  Abhaken, langer Druck zum Sortieren.
- Ob die Plakette auch alle offenen statt nur der fälligen zählen soll.
