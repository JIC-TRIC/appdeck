# Punch – Konzept

Zeiterfassung für alles, was produktiv war: Job, Side Job, Uni, eigene Projekte. Ein Tipp startet den Timer,
Vergessenes trägt man mit Von–Bis nach, und jeder Tag ist ein Kassenbon mit der Summe unten. Der Grund für die
App steht in der Stash-Notiz vom 03.11.2026: Es fühlt sich gut an, nach 8 h Arbeit noch Uni oder Side Job zu
machen, und das soll man sehen. Als Vorbild war aTracker genannt. Übernommen ist das Prinzip (Bereiche als
Knöpfe, ein Tipp startet, Auswertung nach Zeitraum), nicht das Aussehen.

Projekt-ID `punch`, Ordner `apps/punch/`, Speicher unter `punch:*`. Gebaut in TypeScript + Ionic wie Kontor,
Steady, Piano, Loci, Stash, Form und Tick. Der Name kommt von „punch in / punch out“ (einstempeln, ausstempeln).
Mockups: [mockups.html](mockups.html).

`[ ]` = offen, `[x]` = gebaut. **Stand: gebaut (06.11.2026).** Erst Fragerunde, dann Mockups mit drei
Richtungen, dann gebaut. Gewählt wurde: Richtung **C Beleg**, das Symbol (Stoppuhr) und Petrol als
Kachelfarbe. Dazu der Wunsch: **so wenig auf dem Schirm wie möglich.** Darum ist der Bau schlanker als die
Mockups (siehe „Schlanker als die Mockups“). Was in der Fragerunde gewählt wurde, steht ganz unten.

---

## Prinzipien

- **Jeder Tag ist ein Bon.** Die Startseite zeigt den heutigen Tag als Kassenbon: eine Zeile pro Block, unten
  die Summe mit Doppelstrich. Darunter die Knöpfe der Bereiche und Stopp. Mehr nicht.
- **So wenig wie möglich.** Was sich aus dem Bon ablesen lässt, steht nicht noch einmal daneben. Keine Legende,
  keine Zeiten auf den Knöpfen, keine Laufend-Karte. Details (Tätigkeit, Notiz, Startzeit) stecken im Blatt
  eines Blocks.
- **Eine Summe, kein Sonderfall.** Der Job ist ein Bereich wie Uni oder Side Job. Es gibt keine Markierung als
  Hauptjob und kein „obendrauf“.
- **Keine Ziele.** Kein Soll pro Tag oder Woche, das man verfehlen kann. Punch zählt, was war.
- **Ein Timer zur Zeit.** Startet man einen anderen Bereich, endet der laufende Block in dieser Sekunde. Zeit
  zählt nie doppelt, ein Tag hat höchstens 24 h.
- **Gespeichert werden nur Blöcke mit Start und Ende.** Tagessummen, die Teilung um Mitternacht, Wochen,
  Monate und Anteile werden daraus berechnet und nie gespeichert (wie die Serien in Steady).
- **Du korrigierst selbst.** Ein vergessener Timer läuft weiter, bis du ihn stoppst. Punch fragt nicht nach und
  stoppt nicht von selbst. Dafür lässt sich jeder Block leicht ändern, auch der laufende.
- **Rückgängig statt Rückfrage.** Stoppen, Wechseln und Löschen gehen sofort, ein Toast nimmt sie 5 Sekunden
  lang zurück.
- **Was eine Web-App nicht kann:** kein Timer auf dem Sperrbildschirm, keine Mitteilung, kein Widget (siehe
  ROADMAP „Geht nicht“). Der Timer läuft trotzdem weiter, wenn Punch zu ist, denn gespeichert ist nur der Start.
- **Nur hell.** Kein Dark Mode, wie bei Kontor, Stash und Tick.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Regeln

### Bereiche und Tätigkeiten

- [x] Zwei Ebenen: **Bereich** (Job, Uni, Side Job …) und darunter optional **Tätigkeiten** (Uni → Statistik,
  Mathe, BWL). Einen Bereich gibt es auch ganz ohne Tätigkeiten.
- [x] Ein Bereich hat **Name** (höchstens 30 Zeichen) und **Farbe** (eine von zehn, siehe Design). Ein neuer
  bekommt die erste freie Farbe. Eine Tätigkeit hat nur einen Namen (höchstens 30 Zeichen). Namen sind
  innerhalb ihrer Ebene eindeutig, ohne Rücksicht auf Groß- und Kleinschreibung.
- [x] **Umbenennen** wirkt rückwirkend, denn Blöcke verweisen auf die id und nicht auf den Namen.
- [x] **Archivieren statt Löschen**, sobald ein Block (oder der Timer) darauf zeigt: Ein archivierter Bereich
  verschwindet von der Startseite, bleibt aber in der Statistik. Für Tätigkeiten gilt dasselbe. Löschen geht
  nur, solange nichts darauf zeigt. Eine neue Tätigkeit mit dem Namen einer archivierten holt diese zurück.
- [x] Reihenfolge der Bereiche durch Ziehen am Griff (Ionics Reorder wie in Steady und Tick). Tätigkeiten
  stehen nach „zuletzt genutzt“.

### Timer

- [x] **Tipp auf einen Bereich startet sofort**, ohne Tätigkeit. Die Tätigkeit wählt man im Blatt des
  laufenden Blocks (Tipp auf die schwarze Zeile im Bon) oder später, oder man lässt sie weg.
- [x] **Langer Druck auf einen Bereich** (0,45 s, mit Haptik) zeigt „… starten mit“: die Tätigkeiten, zuletzt
  genutzte zuerst, dazu „Ohne Tätigkeit“ und „Neue Tätigkeit“. So wechselt man auch innerhalb eines Bereichs.
- [x] **Tipp auf einen anderen Bereich, während einer läuft:** Der laufende Block endet, der neue beginnt in
  derselben Sekunde. Toast „Uni gestoppt · 0:42“ mit **Rückgängig**.
- [x] **Tipp auf den laufenden Bereich** tut nichts. Stoppen geht nur über **Stopp**, damit kein Block aus
  Versehen endet. Auch danach Toast mit Rückgängig.
- [x] **Den laufenden Block ändern:** Bereich, Tätigkeit, Notiz und seine Startzeit, für „vor 20 min
  angefangen, aber vergessen zu starten“. Der Start darf nicht vor dem Ende eines anderen Blocks liegen.
- [x] **Unter einer Minute zählt nicht:** Ein Block, der kürzer als 60 s war, wird beim Stoppen oder Wechseln
  nicht gespeichert, der Toast sagt das. Das fängt Fehltipps ab.
- [x] **Keine Pause im Block.** Pause heißt Stopp, danach wieder starten. Die Mittagspause im Job sind dann
  zwei Blöcke.

### Nachtragen und Bearbeiten

- [x] **Nachtragen** heißt Von–Bis: ein Tag (Chips „Heute · Gestern · Datum“) und zwei Uhrzeiten,
  minutengenau. Ist Bis früher als Von, endet der Block am nächsten Tag (bei Bis steht dann „+1 Tag“).
- [x] Uhrzeiten über das Zeitfeld des Telefons (auf dem iPhone das Rad). Ein eigenes Tastenfeld wie in Form war
  geplant, wäre aber mehr auf dem Schirm.
- [x] Vorschlag beim Nachtragen: Von = Ende des letzten Blocks an dem Tag (sonst 8:00), Bis eine Stunde später,
  höchstens jetzt.
- [x] **Lücken schließen:** „Anschließen 17:05“ setzt Von auf das Ende des Blocks davor, „Bis 19:02“ setzt Bis
  auf den Beginn des nächsten, „Bis jetzt“ gibt es, wenn danach nichts mehr kommt. Die Knöpfe stehen nur da,
  wenn sie etwas ändern.
- [x] Getippte Minuten treffen den Rand eines Timer-Blocks (mit Sekunden) nur auf die Minute. Liegt der Rand in
  derselben Minute, gilt der genaue Rand - sonst gäbe es eine Überschneidung von ein paar Sekunden.
- [x] **Keine Überschneidung:** Ein Block darf keinen anderen schneiden, auch nicht den laufenden (der reicht
  bis in alle Zukunft). Der Hinweis nennt den anderen: „Überschneidet sich mit Job/Entwicklung 12:41–17:05“.
  Sichern ist dann aus. Stoßen zwei Blöcke genau aneinander, ist das keine Überschneidung.
- [x] Bis darf nicht in der Zukunft liegen. Eine Höchstdauer gibt es nicht: Ein vergessener Timer über 24 h
  behält sein Ende, solange man Bis nicht anfasst.
- [x] **Bearbeiten** eines Blocks: dasselbe Blatt. **Block löschen** ohne Rückfrage, mit Rückgängig im Toast.

### Tage und Mitternacht

- [x] Ein Tag geht von 0:00 bis 0:00 Ortszeit. **Ein Block über Mitternacht wird geteilt:** Im Bon des ersten
  Tages steht er als „22:15–24:00“, im nächsten als „00:00–01:40“, jeweils mit seinem Anteil. Gespeichert bleibt
  *ein* Block.
- [x] Dauer wird immer aus den Millisekunden gerechnet. Die Zeitumstellung stimmt damit von allein: Die Nacht
  zum letzten Sonntag im Oktober hat 25 h.
- [x] **Anzeige:** Dauer als `h:mm` („8:00“, „0:30“), der laufende Block als `h:mm:ss`. Summen werden aus den
  Millisekunden gebildet und erst am Ende auf volle Minuten **abgerundet**, sonst würden aus drei Blöcken mit
  je 20:40 min „1:00“ statt „1:02“.
- [x] Die Woche beginnt am Montag, Kalenderwochen nach ISO 8601.
- [x] Läuft Punch über Mitternacht offen und steht der Bon auf heute, springt er auf den neuen Tag.

### Statistik

- [x] Zeitraum per **[Woche] · Monat · Jahr**, mit ‹ › zurück- und vorblättern (› endet beim laufenden
  Zeitraum). Der Start zeigt die laufende Woche.
- [x] Ein Bon pro Zeitraum mit einer Zeile je Abschnitt: **Woche = 7 Tage, Monat = Kalenderwochen (auf den
  Monat beschnitten), Jahr = 12 Monate.** Jede Zeile hat einen Balken nach Bereichen (der längste füllt die
  Breite) und die Summe. Ein Tipp auf einen Tag öffnet den Tag, auf eine Woche oder einen Monat diesen
  Zeitraum. Was noch kommt, ist grau.
- [x] **Summe** des Zeitraums, darunter der **Vergleich**: „+4:30 zur Vorwoche“. Im laufenden Zeitraum
  vergleicht Punch mit dem gleichen Stück davor (Montag bis jetzt gegen Montag bis zur selben Stunde der
  Vorwoche). Ist der Zeitraum davor leer, fällt der Vergleich weg. Kein Rot.
- [x] **Verteilung:** Bereiche nach Stunden, mit Anteil und Summe. Hat ein Bereich Tätigkeiten, klappt ein Tipp
  sie auf (mit „ohne Tätigkeit“).
- [x] Archivierte Bereiche zählen in der Statistik mit. Ein laufender Block zählt live mit.

### Backup

- [x] Das Launcher-Backup erfasst `punch:*` automatisch, wie bei allen Apps.

## Datenmodell

```
punch:bereiche  [{ id, name, farbe, archiviert,
                   taetigkeiten: [{ id, name, archiviert, zuletzt (ms) | null }] }]   Reihenfolge = Liste
punch:bloecke   [{ id, bereich, taetigkeit | null, notiz, start (ms), ende (ms) }]    nach start sortiert
punch:laeuft    { bereich, taetigkeit | null, notiz, start (ms) }                    nur solange einer läuft
```

- Der laufende Block liegt getrennt in `punch:laeuft`. Nur er ändert sich beim Starten, die große Liste wird erst
  beim Stoppen geschrieben.
- Die Regeln liegen als reine Funktionen in `zeit.ts` und sind getestet (`zeit.test.ts`): Anteil eines Blocks
  an einem Tag, Summen, Kalenderwochen, Zeilen der Statistik, Vergleich, Überschneidung, Anschluss. Gelesenes
  wird geprüft und notfalls verworfen (`normalisiere*` in `store.ts`, getestet in `store.test.ts`).
- **Rückgängig** merkt sich vor jeder Aktion `punch:bloecke` und `punch:laeuft` als Text und schreibt sie
  zurück.
- Die Uhr tickt jede Sekunde, solange ein Timer läuft, sonst alle 30 Sekunden, und sofort beim Zurückkommen
  (`visibilitychange`).
- **Größe:** Ein Block ohne Notiz sind etwa 130 Zeichen – die ids sind kurz (Zeit plus Zufall, 12 Zeichen)
  statt UUIDs, das spart ein Drittel. Bei 6 Blöcken am Tag macht das
  rund 280.000 Zeichen im Jahr, also ~280 KB mit Latin-1. Steht irgendwo ein Emoji oder „–“ in einer Notiz,
  kostet der ganze Wert 2 Byte pro Zeichen (~560 KB). Punch belastet den 5-MB-Topf damit ähnlich stark wie
  Kontor. Spätestens im zweiten Jahr sollte der IndexedDB-Umzug aus der ROADMAP erledigt sein.

## Ansichten

### 1 – Tag (Start)

- [x] Kopf: ‹ Apps, rechts die Symbole **Statistik** und **Bereiche**.
- [x] Der Bon: „PUNCH“, darunter das Datum „FR 06.11.2026“ mit ‹ › (› endet bei heute, ein Tipp aufs Datum
  springt zurück auf heute). Dann eine Zeile pro Block: „08:12–12:03 ■ JOB/ENTWICKLUNG 3:51“. Der laufende
  Block steht schwarz hinterlegt mit `h:mm:ss`. Darunter leise „+ Nachtragen“, dann **Summe** groß mit
  Doppelstrich, unten abgerissen.
- [x] Ein Tipp auf eine Zeile öffnet den Block (2).
- [x] Nur heute: darunter die **Bereiche** als Knöpfe in zwei Spalten (Quadrat in der Farbe, Name), der
  laufende schwarz. Läuft etwas, darunter **■ Stopp** über die ganze Breite.
- [x] Erststart: leerer Bon, darunter „Was zählt für dich als produktiv?“ und **+ Bereich anlegen**.

### 2 – Block (Blatt von unten)

- [x] Kopf: Abbrechen, „Nachtragen“, „Block“ oder „Läuft“, **Sichern**.
- [x] Bereich (Chips mit Farbquadrat), Tätigkeit (Chips und „+ Neu“, ein zweiter Tipp nimmt sie weg), Notiz
  (eine Zeile, höchstens 200 Zeichen).
- [x] Tag (nicht beim laufenden), Von und Bis (beim laufenden steht bei Bis „läuft“), die Knöpfe zum Lücken
  schließen, der Hinweis bei Überschneidung in Rot und die Dauer.
- [x] Unten **Block löschen** (rot) bzw. beim laufenden **Stopp**.

### 3 – Statistik (Seite mit Zurückwischen)

- [x] Kopf ‹ Punch, „STATISTIK“, darunter [Woche] Monat Jahr.
- [x] Der Bon mit Zeitraum ‹ ›, den Zeilen, der Summe, dem Vergleich und der Verteilung.

### 4 – Bereiche (Seite mit Zurückwischen)

- [x] Die aktiven Bereiche mit Griff zum Ziehen, „+ Bereich“, darunter eingeklappt „Archiviert (n)“.
- [x] Ein Tipp auf einen Bereich öffnet das Blatt (5).

### 5 – Bereich (Blatt von unten)

- [x] Name, Farbe (zehn Felder), Tätigkeiten als Chips: ein Tipp zeigt Umbenennen und Archivieren bzw.
  Löschen bzw. Zurückholen, „+ Neu“ fragt nach dem Namen. Name und Farbe gelten mit Sichern, die Tätigkeiten
  sofort.
- [x] Unten **Archivieren**, **Bereich löschen** (solange nichts darauf zeigt) oder **Zurückholen**.

## Design (Richtung „Beleg“)

Der Tag als Kassenbon: weißes Thermopapier auf hellem Grau, alles in Mono, gestrichelte Linien, die Summe mit
Doppelstrich, unten abgerissen. Schwarz für Knöpfe und den laufenden Block. Farbe tragen nur die Bereiche, als
kleine Quadrate und in den Balken.

```
Grund        #E3E5E8   helles Grau, auf dem der Bon liegt
Papier       #FFFFFF   Bon, Knöpfe, Blätter
Tinte        #121416   Text, Knöpfe, laufender Block, Stopp
Tinte leise  #6A6F76   Datum, Vergleich, Beschriftungen im Blatt
Tinte still  #A4A9AF   „+ Nachtragen“, was noch kommt
Linie        #9EA3A9   gestrichelte Linien
Gefahr       #C2412D   Block löschen, Überschneidung
```

- **Schrift:** **IBM Plex Mono** für alles (400, 500, 600), schon im Projekt durch Loci, also keine neue
  Abhängigkeit. Monospace hält den laufenden Timer ruhig, die Spalten stehen von selbst untereinander. Namen in
  Versalien wie auf einem Bon, „PUNCH“ weit gesperrt.
- **Bereichsfarben:** die zehn Ordnerfarben von Tick (`farben.ts`), statt Petrol Schiefer `#5E6B7A`, weil Petrol
  die Farbe des Symbols ist.
- Keine runden Ecken, außer am Blatt von unten. Knöpfe mit 1,5 px Rahmen, gewählt heißt schwarz gefüllt.
- **Symbol** im Stil „Signal“ (siehe README): eine Stoppuhr mit Krone und Seitenknopf, ein Viertel in der
  Kachelfarbe ausgespart, weiß auf Petrol `#17696A` (`icons/punch.svg`).

## Schlanker als die Mockups

Auf den Wunsch „so wenig wie möglich“ fiel beim Bau weg, was die Mockups (Richtung C und die Ansichten in A)
noch zeigten:

- die Zeiten auf den Knöpfen der Bereiche und die Legende unter der Summe (steht alles im Bon),
- die Notiz als eigene Zeile im Bon (steht im Blatt),
- die Laufend-Karte mit Tätigkeit, Notiz und „seit 19:02“ (alles im Blatt des laufenden Blocks),
- „▶ Weiter“ am letzten Block (Bereich einfach wieder antippen),
- „an 5 Tagen · Ø 10:17 h“ in der Statistik,
- der Monat als Balken pro Tag (jetzt eine Zeile pro Woche),
- das eigene Tastenfeld für Uhrzeiten (jetzt das Zeitfeld des Telefons).

## Nicht im MVP

- **Ziele** pro Tag oder Woche – in der Fragerunde bewusst abgelehnt.
- **Hauptjob markieren** mit „+2:45 obendrauf“ – abgelehnt, eine Summe für alles.
- **Mehrere Timer parallel** – abgelehnt, Zeit soll nie doppelt zählen.
- **Rückfrage oder automatisches Stoppen** bei einem vergessenen Timer – abgelehnt, du korrigierst selbst.
- **Verknüpfung mit anderen Apps** – abgelehnt: keine Plakette an der Kachel, Steady hakt nicht ab, Tick
  startet keinen Timer. Ginge später alles über `localStorage`.
- **Rekorde** (längster Tag, längste Woche) und **Jahreskalender** mit Kästchen pro Tag – nicht gewählt.
- **Nachtragen nur mit Dauer**, ohne Uhrzeit – abgelehnt, Von–Bis hält die Tage genau.
- **Weiter** am letzten Block, **Ø pro Tag**, **eigenes Tastenfeld** – siehe „Schlanker als die Mockups“.
- **Filter** in der Statistik, **CSV-Export** (wie in Form), **Suche** in den Notizen.

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

**Nach den Mockups (06.11.2026):** Richtung **C Beleg**, das Symbol und Petrol als Kachelfarbe. „Zeige so wenig
Informationen an wie möglich, sonst sieht es zu clustered aus“ – daher „Schlanker als die Mockups“.

**Selbst entschieden, nach dem Vorbild der anderen Apps:** langer Druck startet mit Tätigkeit, Toast mit
Rückgängig beim Stoppen, Wechseln und Löschen (statt Rückfragen), Startzeit des laufenden Blocks im Blatt
korrigierbar, Blöcke unter einer Minute zählen nicht, keine Pause im Block, Schnellknöpfe zum Lücken-Schließen,
Abrunden erst bei der Summe, Woche ab Montag, Vergleich mit dem gleichen Stück des Vorzeitraums, Bereichsfarben
von Tick, IBM Plex Mono, nur hell.
