# Punch – Konzept (Entwurf)

Zeiterfassung für alles, was produktiv war: Job, Side Job, Uni, eigene Projekte. Ein Tipp startet den Timer,
Vergessenes trägt man mit Von–Bis nach, und abends steht groß da, wie viele Stunden der Tag hatte. Der Grund für
die App steht in der Stash-Notiz vom 03.11.2026: Es fühlt sich gut an, nach 8 h Arbeit noch Uni oder Side Job
zu machen, und das soll man sehen. Als Vorbild war aTracker genannt. Übernommen wird das Prinzip (Bereiche als
Kacheln, ein Tipp startet, Auswertung nach Zeitraum), nicht das Aussehen.

Projekt-ID `punch`, später Ordner `apps/punch/`, Speicher unter `punch:*`. Gebaut in TypeScript + Ionic wie
Kontor, Steady, Piano, Loci, Stash, Form und Tick. Der Name kommt von „punch in / punch out“ (einstempeln,
ausstempeln) und der Stechkarte. Er ist kurz und englisch wie Tick, Stash und Steady.

`[ ]` = offen, `[x]` = gebaut. **Stand: Entwurf nach der Fragerunde (06.11.2026), noch nichts gebaut.**
Mockups mit drei Richtungen für „Stundenzettel“ und allen Ansichten in Richtung A: [punch-mockups.html](punch-mockups.html)
(06.11.2026). Nächster Schritt: Richtung, Symbol und Kachelfarbe wählen, dann bauen. Was in der Fragerunde gewählt
wurde und was danach selbst entschieden ist, steht ganz unten unter „Entschieden“.

Dieses Dokument liegt bewusst unter `ideen/` und noch nicht in `apps/punch/`. Ein Ordner unter `apps/` ohne
`src/main.tsx` würde beim Build als Vanilla-App auf die Website kopiert, und `npm run new -- punch` bricht ab,
wenn es den Ordner schon gibt. Beim Bau wird die Datei zu `apps/punch/konzept.md` und die Mockups zu
`apps/punch/mockups.html`.

---

## Prinzipien

- **Die Tagessumme ist die App.** Die Startseite zeigt groß, wie viele Stunden heute zusammenkamen, darunter
  die Aufteilung nach Bereichen. Alles andere ist dafür da, dass diese Zahl stimmt.
- **Eine Summe, kein Sonderfall.** Der Job ist ein Bereich wie Uni oder Side Job. Es gibt keine Markierung als
  Hauptjob und kein „obendrauf“. Wer wissen will, was neben dem Job dazukam, sieht es im Balken.
- **Keine Ziele.** Kein Soll pro Tag oder Woche, das man verfehlen kann. Punch zählt, was war.
- **Ein Timer zur Zeit.** Startet man einen anderen Bereich, endet der laufende Block in dieser Sekunde. Zeit
  zählt nie doppelt, ein Tag hat höchstens 24 h.
- **Gespeichert werden nur Blöcke mit Start und Ende.** Tagessummen, die Teilung um Mitternacht, Wochen,
  Monate und Anteile werden daraus berechnet und nie gespeichert (wie die Serien in Steady). Wer einen Block
  ändert, bekommt überall sofort die richtigen Zahlen.
- **Du korrigierst selbst.** Ein vergessener Timer läuft weiter, bis du ihn stoppst. Punch fragt nicht nach
  und stoppt nicht von selbst. Dafür lässt sich jeder Block leicht ändern, auch der laufende.
- **Rückschritt wird nicht bestraft.** Weniger als in der Vorwoche steht grau da, nicht rot (wie in Form).
- **Was eine Web-App nicht kann:** kein Timer auf dem Sperrbildschirm, keine Mitteilung, kein Widget (siehe
  ROADMAP „Geht nicht“). Der Timer läuft trotzdem weiter, wenn Punch zu ist, denn gespeichert ist nur der Start.
- **Nur hell.** Kein Dark Mode, wie bei Kontor, Stash und Tick.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Regeln

### Bereiche und Tätigkeiten

- [ ] Zwei Ebenen: **Bereich** (Job, Uni, Side Job …) und darunter optional **Tätigkeiten** (Uni → Statistik,
  Mathe, BWL). Einen Bereich gibt es auch ganz ohne Tätigkeiten.
- [ ] Ein Bereich hat **Name** (höchstens 30 Zeichen) und **Farbe** (eine von zehn, siehe Design). Eine
  Tätigkeit hat nur einen Namen (höchstens 30 Zeichen). Namen sind innerhalb ihrer Ebene eindeutig, ohne
  Rücksicht auf Groß- und Kleinschreibung.
- [ ] **Umbenennen** wirkt rückwirkend, denn Blöcke verweisen auf die id und nicht auf den Namen.
- [ ] **Archivieren statt Löschen**, sobald es Blöcke gibt: Ein archivierter Bereich verschwindet von der
  Startseite, bleibt aber in der Statistik. Für Tätigkeiten gilt dasselbe. Löschen geht nur, wenn noch kein
  Block darauf verweist.
- [ ] Reihenfolge der Bereiche per langem Druck und Ziehen (wie die Ordner in Tick). Tätigkeiten stehen
  nach „zuletzt genutzt“, nicht in fester Reihenfolge.

### Timer

- [ ] **Tipp auf eine Bereichskachel startet sofort**, ohne Tätigkeit. Die Tätigkeit wählt man während des
  Blocks auf der Laufend-Karte oder später beim Bearbeiten, oder man lässt sie weg.
- [ ] **Langer Druck auf eine Kachel** zeigt die Tätigkeiten des Bereichs und startet direkt mit der gewählten.
  So wechselt man auch innerhalb eines Bereichs, z. B. von Statistik zu Mathe.
- [ ] **Tipp auf einen anderen Bereich, während einer läuft:** Der laufende Block endet, der neue beginnt in
  derselben Sekunde. Danach kommt ein Toast „Uni gestoppt (0:42), Job läuft“ mit **Rückgängig** (5 s). Er
  stellt den Zustand vorher wieder her.
- [ ] **Tipp auf die laufende Kachel** tut nichts. Stoppen geht nur über **Stopp** auf der Laufend-Karte,
  damit kein Block aus Versehen endet. Auch danach kommt ein Toast „Uni gestoppt · 2:46“ mit **Rückgängig**.
- [ ] **Die Tätigkeit ändern, während der Block läuft,** benennt den ganzen Block um und teilt ihn nicht.
- [ ] **Notiz** (optional, höchstens 200 Zeichen, eine Zeile) auf der Laufend-Karte und beim Bearbeiten.
- [ ] **Startzeit des laufenden Blocks korrigieren:** Ein Tipp auf „seit 18:02“ öffnet die Uhrzeit, für „vor
  20 min angefangen, aber vergessen zu starten“. Der Start darf nicht vor dem Ende des Blocks davor liegen.
- [ ] **Unter einer Minute zählt nicht:** Ein Block, der kürzer als 60 s war, wird beim Stoppen oder Wechseln
  nicht gespeichert, der Toast sagt das. Das fängt Fehltipps ab.
- [ ] **Keine Pause im Block.** Pause heißt Stopp. Danach startet **Weiter** am letzten Block einen neuen Block
  mit demselben Bereich, derselben Tätigkeit und derselben Notiz. Die Mittagspause im Job sind dann zwei Blöcke.

### Nachtragen und Bearbeiten

- [ ] **Nachtragen** heißt Von–Bis: ein Datum (Chips „Heute · Gestern · Anderer Tag“) und zwei Uhrzeiten,
  minutengenau. Ist Bis früher als Von, endet der Block am nächsten Tag („+1 Tag“ steht dann dabei).
- [ ] Uhrzeiten tippt man über ein eigenes Tastenfeld wie die Zeiten in Form: vier Ziffern, „1830“ → 18:30.
  **Jetzt** auf dem Tastenfeld setzt die aktuelle Uhrzeit.
- [ ] **Lücken schließen:** „Anschließen“ setzt Von auf das Ende des Blocks davor, „Bis jetzt“ setzt Bis auf
  jetzt (gibt es nur am heutigen Tag), „Bis zum nächsten“ setzt Bis auf den Beginn des Blocks danach.
- [ ] **Keine Überschneidung:** Ein Block darf keinen anderen schneiden, auch nicht den laufenden. Der Hinweis
  nennt den anderen: „Überschneidet sich mit Uni 18:00–19:30“. Speichern ist dann aus. Endet ein Block genau
  dann, wenn der nächste beginnt, ist das keine Überschneidung.
- [ ] Bis darf nicht in der Zukunft liegen. Eine Höchstdauer gibt es nicht, damit sich auch ein vergessener
  Timer über Nacht noch bearbeiten lässt.
- [ ] **Bearbeiten** eines Blocks: dieselbe Maske mit Bereich, Tätigkeit, Notiz, Von und Bis. **Löschen** mit
  Toast und Rückgängig statt einer Rückfrage.

### Tage und Mitternacht

- [ ] Ein Tag geht von 0:00 bis 0:00 Ortszeit. **Ein Block über Mitternacht wird geteilt:** 23:00–1:00 sind
  1 h am Vortag und 1 h am neuen Tag. Gespeichert bleibt *ein* Block, die Teilung wird berechnet.
- [ ] Dauer wird immer aus den Millisekunden gerechnet. Die Zeitumstellung stimmt damit von allein: Die Nacht
  zum letzten Sonntag im Oktober hat 25 h.
- [ ] **Anzeige:** Dauer als `h:mm` („8:00“, „0:30“), der laufende Block als `h:mm:ss`. Summen werden aus
  Sekunden gebildet und erst am Ende auf volle Minuten **abgerundet**, sonst würden aus drei Blöcken mit je
  20:40 min „1:00“ statt „1:02“.
- [ ] Die Woche beginnt am Montag.

### Statistik

- [ ] Zeitraum per Segment **Woche · Monat · Jahr**, mit ‹ › zurück- und vorblättern. Der Start zeigt den
  laufenden Zeitraum.
- [ ] **Summe** des Zeitraums groß, dazu **„an 5 Tagen · Ø 10:17 h“**. Der Durchschnitt zählt nur Tage mit
  Einträgen, sonst drücken leere Wochenenden ihn nach unten.
- [ ] **Vergleich zum Vorzeitraum:** „+4:30 h zur Vorwoche“. Im laufenden Zeitraum vergleicht Punch mit dem
  gleichen Stück davor („bis Donnerstag“), sonst wäre jede Woche bis Samstag im Minus. Mehr erscheint in der
  Druckfarbe, weniger grau.
- [ ] **Balken**, gestapelt nach Bereichen: Woche = 7 Tage, Monat = jeder Tag, Jahr = 12 Monate. Ein Tipp auf
  einen Tagesbalken öffnet diesen Tag, ein Tipp auf einen Monatsbalken öffnet den Monat.
- [ ] **Verteilung:** Bereiche nach Stunden absteigend, mit Anteil und dünnem Balken in Bereichsfarbe. Ein Tipp
  klappt die Tätigkeiten auf: „Uni 32 % · 14:20 h“ → „Statistik 60 % · Mathe 30 % · ohne Tätigkeit 10 %“.
- [ ] Archivierte Bereiche erscheinen in der Statistik mit dem Zusatz „archiviert“.
- [ ] Ein laufender Block zählt live mit.

### Backup

- [ ] Das Launcher-Backup erfasst `punch:*` automatisch, wie bei allen Apps. Weitere Hinweise gibt es nicht.

## Datenmodell

```
punch:bereiche  [{ id, name, farbe, archiviert,
                   taetigkeiten: [{ id, name, archiviert, zuletzt (ms) | null }] }]   Reihenfolge = Liste
punch:bloecke   [{ id, bereich, taetigkeit | null, notiz, start (ms), ende (ms) }]    nach start sortiert
punch:laeuft    { bereich, taetigkeit | null, notiz, start (ms) } | null
```

- Der laufende Block liegt getrennt in `punch:laeuft`. Nur er ändert sich während des Timers, die große Liste
  wird erst beim Stoppen geschrieben.
- Die Regeln liegen als reine Funktionen in `zeit.ts` und sind getestet: Anteil eines Blocks an einem Tag,
  Summen pro Tag, Woche, Monat und Jahr, Überschneidung, Vergleich zum gleichen Stück des Vorzeitraums,
  Abrunden. Gelesenes wird geprüft und notfalls verworfen (`normalisiere*` in `store.ts`), wie überall.
- Der Timer rechnet jede Sekunde aus `start` und `Date.now()` neu und nach `visibilitychange` sofort, wie das
  laufende Training in Form. Läuft Punch über Mitternacht offen, springt die Startseite um 0:00 auf den neuen
  Tag.
- **Größe:** Ein Block ohne Notiz sind etwa 110 Zeichen. Bei 6 Blöcken am Tag macht das rund 240.000 Zeichen
  im Jahr, also ~240 KB mit Latin-1. Steht irgendwo ein Emoji oder „–“ in einer Notiz, kostet der ganze Wert
  2 Byte pro Zeichen (~480 KB). Punch belastet den 5-MB-Topf damit ähnlich stark wie Kontor. Spätestens im
  zweiten Jahr sollte der IndexedDB-Umzug aus der ROADMAP erledigt sein. Darum sind die Blöcke **eine** Liste,
  damit „Belegt“ im Launcher sie richtig zählt.

## Ansichten

### 1 – Tag (Start, heute)

- [ ] Kopf: ‹ Apps, Wortmarke, rechts die Symbole **Statistik** und **Bereiche**.
- [ ] Datumszeile „Freitag, 6. November“ mit ‹ › für die Tage davor und danach (› endet bei heute).
- [ ] **Summe groß:** „10:45 h“, darunter ein Balken nach Bereichen und die Legende „Job 8:00 · Uni 2:15 ·
  Side Job 0:30“.
- [ ] **Laufend-Karte** (nur solange ein Timer läuft): Farbpunkt und Bereich, Laufzeit `h:mm:ss` groß, „seit
  18:02“ (antippbar), Tätigkeiten als Chips mit „+ Neu“, das Notizfeld und **Stopp**.
- [ ] **Bereichskacheln** in zwei Spalten: Name und heutige Summe. Die laufende Kachel trägt ihre Farbe als
  Fläche, die anderen nur als Punkt.
- [ ] **Stundenzettel:** die Blöcke des Tages als Tabelle mit Von | Bis | Bereich · Tätigkeit | Dauer, frühester
  oben. Die Notiz steht klein darunter. Unten eine Summenzeile mit Doppelstrich. Ein Block über Mitternacht
  zeigt nur den Anteil des Tages und „↦ Fr 1:00“ bzw. „seit Do 23:00“. Ein Tipp öffnet den Block (Ansicht 2),
  am letzten Block steht **▶ Weiter**.
- [ ] Unten **+ Nachtragen** (Ansicht 2, Datum vorbelegt).
- [ ] An vergangenen Tagen gibt es keine Kacheln und keine Laufend-Karte, nur Summe, Balken, Stundenzettel und
  Nachtragen.
- [ ] Erststart: „Was zählt für dich als produktiv?“ und **Ersten Bereich anlegen**, darunter der leere
  Stundenzettel.

### 2 – Block (Blatt von unten)

- [ ] Kopf: Abbrechen, „Block“ bzw. „Nachtragen“, **Sichern**.
- [ ] Bereich (Chips in Bereichsfarbe), Tätigkeit (Chips des Bereichs und „+ Neu“, ein zweiter Tipp auf die
  gewählte nimmt sie weg), Notiz.
- [ ] Datum (Chips), Von und Bis mit eigenem Tastenfeld, darunter die Schnellknöpfe zum Lücken-Schließen und
  die berechnete Dauer.
- [ ] Hinweis bei Überschneidung, Sichern ist dann aus.
- [ ] Beim Bearbeiten unten **Löschen**.

### 3 – Statistik (Seite mit Zurückwischen)

- [ ] Segment Woche · Monat · Jahr, Zeitraum mit ‹ ›.
- [ ] Summe, Tage und Ø, Vergleich zum Vorzeitraum.
- [ ] Gestapelte Balken, darunter die Verteilung mit aufklappbaren Tätigkeiten.
- [ ] Ohne Blöcke im Zeitraum: „In dieser Woche ist noch nichts erfasst.“

### 4 – Bereiche (Seite mit Zurückwischen)

- [ ] Liste der Bereiche mit Farbpunkt und Zahl der Tätigkeiten, Sortieren per langem Druck.
- [ ] **+ Bereich**, darunter eingeklappt **Archiviert**.

### 5 – Bereich bearbeiten

- [ ] Name, Farbe (zehn Felder), Tätigkeiten mit Hinzufügen, Umbenennen und Archivieren.
- [ ] Unten **Archivieren**, oder **Löschen**, solange es keine Blöcke gibt.

## Design (Richtung „Stundenzettel“)

Die Mockups zeigen drei Richtungen: **A Formular** (Empfehlung, hier beschrieben), **B Stechkarte**
(Manila-Karton, rot gedruckt, Courier, „Ausstempeln“) und **C Beleg** (Kassenbon in IBM Plex Mono). Die Wahl
steht noch aus.

Ein Formular auf hellem Papier: Linien, Spaltenköpfe und Beschriftung („Summe“, „Bereiche“, „Stundenzettel“)
wirken wie in einer Druckfarbe vorgedruckt, die Zeiten wie mit der Stechuhr hineingestempelt. Farbe tragen nur
die Bereiche, die Oberfläche bleibt Tinte und Druckfarbe.

```
Grund        #EEF1EE   Formularpapier, leicht grünlich-grau
Blatt        #FCFCFA   Stundenzettel, Karten, Blätter
Druckfarbe   #17696A   Petrol: Linien, Spaltenköpfe, Hauptknopf, „mehr als Vorwoche“
Linie        #CBD8D5   Tabellenlinien (Druckfarbe, blass)
Tinte        #1B1F23   Text, Zeiten, Summen
Tinte leise  #6E7781   Notizen, „weniger als Vorwoche“, ohne Tätigkeit
Gefahr       #C2412D   Löschen und der Hinweis bei Überschneidung
```

- **Bereichsfarben:** die zehn Ordnerfarben von Tick (`apps/tick/src/farben.ts`), die schon auf hellem Grund
  erprobt sind. Petrol ist dort durch Schiefer `#5E6B7A` ersetzt, weil Petrol hier die Druckfarbe ist.
- **Schrift:** **Spline Sans Mono** für alle Zeiten und Zahlen und für die Wortmarke „PUNCH“ (Versalien,
  gesperrt, wie ein Stempel). Monospace hält den laufenden Timer ruhig, nichts springt. Die kleinen Serifen an
  der 1 wirken wie vorgedruckt. Alles andere ist Systemschrift, wie der Kleinkram in Stash. Spline Sans Mono
  nutzt noch keine App, sie wäre eine neue Abhängigkeit (`@fontsource/spline-sans-mono`).
- **Nicht DM Mono:** Die war zuerst geplant, hat aber nur eine durchgestrichene Null, und die sieht neben „Ø“
  für den Durchschnitt fast gleich aus („Ø 0:30“). Spline Sans Mono hat eine glatte Null.
- Spaltenköpfe im Stundenzettel klein, in Versalien und Druckfarbe, wie vorgedruckt. Die Summenzeile hat einen
  Doppelstrich.
- **Symbol** im Stil „Signal“ (siehe README): eine Stoppuhr (Kreis mit Krone), ein Viertel als Fläche
  ausgespart, weiß auf Petrol `#17696A`. Petrol hatte noch keine App. In den Mockups prüfen, ob die Kachel
  neben Kontors Grün `#2E9E6B` genug absticht.

## Nicht im MVP

- **Ziele** pro Tag oder Woche – in der Fragerunde bewusst abgelehnt.
- **Hauptjob markieren** mit „+2:45 obendrauf“ – abgelehnt, eine Summe für alles.
- **Mehrere Timer parallel** – abgelehnt, Zeit soll nie doppelt zählen.
- **Rückfrage oder automatisches Stoppen** bei einem vergessenen Timer – abgelehnt, du korrigierst selbst.
- **Verknüpfung mit anderen Apps** – abgelehnt: keine Plakette an der Kachel, Steady hakt nicht ab, Tick
  startet keinen Timer. Ginge später alles über `localStorage`.
- **Rekorde** (längster Tag, längste Woche) und **Jahreskalender** mit Kästchen pro Tag – in der Fragerunde
  nicht gewählt.
- **Nachtragen nur mit Dauer**, ohne Uhrzeit – abgelehnt, Von–Bis hält die Tage genau.
- **Tag als Zeitleiste** (0–24 Uhr mit Blöcken) – als Startseite nicht gewählt, wäre als zweite Darstellung
  des Stundenzettels denkbar.
- **Filter** in der Statistik (nur ein Bereich in den Balken), **CSV-Export** (wie in Form), **Suche** in den
  Notizen.

## Entschieden

**Fragerunde (06.11.2026):**

| Frage | Gewählt |
|---|---|
| Erfassung | Timer und Nachtragen |
| Hauptjob | wie alles andere, kein Sonderfall |
| Ebenen | Bereich → Tätigkeit, dazu eine Notiz |
| Starten | Bereich startet sofort, Tätigkeit optional |
| Startseite | Tagessumme groß |
| Ziele | keine |
| Zeit neben dem Job extra zeigen | nein, eine Summe |
| Mitternacht | Block wird geteilt |
| Mehrere Timer | einer zur Zeit |
| Vergessener Timer | nichts, du korrigierst selbst |
| Statistik | Woche / Monat / Jahr und Verteilung |
| Look | hell, wie ein Stundenzettel |
| Name | englisch → **Punch** |
| Andere Apps | keine Verknüpfung |
| Nachtragen | Von–Bis |

**Selbst entschieden, nach dem Vorbild der anderen Apps:** langer Druck startet mit Tätigkeit, Toast mit
Rückgängig beim Stoppen, Wechseln und Löschen (statt Rückfragen), Startzeit des laufenden Blocks korrigierbar,
Blöcke unter einer Minute zählen nicht, keine Pause im Block (dafür „Weiter“), Tastenfeld für Uhrzeiten wie in
Form mit „Jetzt“, Schnellknöpfe zum Lücken-Schließen, Abrunden erst bei der Summe, Woche ab Montag, Ø nur über
Tage mit Einträgen, Vergleich mit dem gleichen Stück des Vorzeitraums, Bereichsfarben von Tick, Spline Sans
Mono, Petrol als Druck- und Kachelfarbe, Stoppuhr als Symbol, nur hell.

**Nach den Mockups offen:** Richtung A, B oder C, das Symbol und ob Petrol neben Kontors Grün im Launcher genug
absticht.
