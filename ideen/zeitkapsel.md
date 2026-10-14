# Zeitkapsel – Konzept (Entwurf)

Briefe an dich selbst, die sich erst an einem bestimmten Tag öffnen. Heute schreiben, versiegeln,
vergessen – und in einem Jahr lesen, was dich damals beschäftigt hat und wo du damals standest.

Projekt-ID `zeitkapsel` (vorläufig, siehe Name in den offenen Fragen), später Ordner `apps/zeitkapsel/`,
Speicher unter `zeitkapsel:*`. Gebaut in TypeScript + Ionic wie Kontor, Steady, Piano, Loci, Stash und Form.

`[ ]` = offen, `[x]` = gebaut. **Stand: Entwurf (14.10.2026), noch nichts gebaut.** Vor dem Bau wie gewohnt:
Fragerunde (siehe „Offene Fragen“ ganz unten), dann Mockups, dann bauen.

Dieses Dokument liegt bewusst unter `ideen/` und noch nicht in `apps/zeitkapsel/`: Ein Ordner unter `apps/`
ohne `src/main.tsx` würde beim Build als Vanilla-App auf die Website kopiert, und `npm run new -- zeitkapsel`
bricht ab, wenn es den Ordner schon gibt. Beim Bau zieht die Datei als `apps/zeitkapsel/konzept.md` um.

---

## Prinzipien

- **Versiegelt ist versiegelt.** Nach dem Versiegeln lässt sich ein Brief weder lesen noch ändern, bis sein
  Tag kommt. Löschen geht (mit Rückfrage), früher öffnen nicht. Genau dieser Verzicht macht den Reiz aus –
  sonst wäre es ein Notizbuch.
- **Schreiben ist leicht, Öffnen ist ein Moment.** Schreiben: ein Feld, ein Tag, versiegeln. Öffnen: bewusst,
  mit Umschlag und Siegel, nicht als Zeile in einer Liste.
- **Damals und heute.** Auf Wunsch hält ein Brief fest, wo du gerade stehst – ein paar Zahlen aus den anderen
  appdeck-Apps. Beim Öffnen steht daneben, wo du jetzt bist. Das kann nur appdeck, weil alle Apps unter einer
  Adresse liegen und eine App die Daten der anderen lesen kann.
- **Ohne Push muss man sie finden.** Eine Mitteilung am Tag X geht als Web-App nicht (bräuchte einen Server,
  siehe ROADMAP „Geht nicht“). Darum zeigt der Launcher an der Kachel, wenn ein Brief bereitliegt.
- **Versiegelt heißt nicht verschlüsselt.** Der Text liegt lesbar im Gerätespeicher und im Backup. Das Siegel
  schützt vor dir selbst, nicht vor anderen. Das sagt die App einmal, beim ersten Versiegeln.
- **Lange Fristen brauchen Backups.** Ein Brief für in fünf Jahren überlebt nur, wenn die Daten so lange da
  sind. Wer das Icon vom Home-Bildschirm löscht, löscht die Briefe mit.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

## Regeln

### Schreiben und versiegeln

- [ ] Ein Brief = **Text** (Pflicht, höchstens 5.000 Zeichen), **Aufschrift** (optional, eine Zeile, höchstens
  40 Zeichen – steht außen auf dem Umschlag, z. B. „Für mich mit 30“) und **Öffnungstag**.
- [ ] **Öffnungstag** per Schnellwahl **1 Monat · 6 Monate · 1 Jahr · 5 Jahre** (Standard 1 Jahr) oder ein
  eigener Tag. Frühestens morgen, spätestens in 10 Jahren – länger hält kaum ein Gerät, und dann trägt nur
  noch das Backup.
- [ ] Ein Brief lässt sich ab 0:00 Uhr seines Tages öffnen (lokale Zeit, wie die Messtage in Form).
- [ ] Beim Versiegeln wird Datum **und Uhrzeit** festgehalten, damit beim Öffnen „geschrieben am Dienstag,
  14. Oktober 2026, um 23:12“ dasteht.
- [ ] **Entwurf:** Was geschrieben, aber nicht versiegelt ist, übersteht das Schließen der App (wie bei Stash).
- [ ] **Versiegeln mit Rückfrage:** „Bis Donnerstag, 14. Oktober 2027 kannst du ihn nicht mehr lesen.“
  Beim allerersten Mal dazu der Satz zum Sichtschutz (siehe Prinzipien).
- [ ] **Anregungen** im leeren Textfeld, eine pro Brief, zufällig: „Was beschäftigt dich gerade?“, „Was hoffst
  du, ist in einem Jahr anders?“, „Worauf bist du gerade stolz?“, „Was würdest du dir gern raten?“ (siehe
  offene Fragen).

### Versiegelt

- [ ] In der Liste: Aufschrift (ohne Aufschrift „Brief vom 14. Okt 2026“), wann geschrieben und wann er sich
  öffnet: „in 287 Tagen“, „morgen“, ab einem Jahr „in 2 Jahren“.
- [ ] Kein Lesen, kein Ändern, kein früheres Öffnen, kein Verschieben des Tags (siehe offene Fragen).
- [ ] **Löschen** geht, mit Rückfrage („Ungelesen löschen? Der Brief ist dann weg.“).

### Öffnen

- [ ] Ab seinem Tag steht ein Brief ganz oben unter **Bereit**.
- [ ] Öffnen ist ein eigener Moment im Vollbild: der Umschlag groß, ein Tipp aufs Siegel, es bricht, der Brief
  entfaltet sich. Ohne Animation bei „Bewegung reduzieren“ (wie das Konfetti in Form).
- [ ] Danach: „Geschrieben vor 1 Jahr, am Dienstag, 14. Oktober 2026“, der Text, und – wenn festgehalten –
  **Damals · Heute** (siehe unten).
- [ ] Unten **Antworten**: ein neuer Brief, der auf diesen verweist („Antwort auf deinen Brief vom
  14. Okt 2026“), Öffnungstag vorbelegt mit demselben Abstand.
- [ ] Sind mehrere Briefe fällig geworden, öffnet man sie einzeln, den ältesten zuerst.
- [ ] Geöffnete Briefe bleiben im **Archiv**, neueste zuerst, jederzeit lesbar. Löschen mit Rückfrage.

### Damals und heute

- [ ] Beim Schreiben ein Schalter **„Damals festhalten“** (Standard an) mit Vorschau, was festgehalten wird.
  Nur Zahlen, die es gibt; fehlt eine App oder hat sie keine Daten, fällt die Zeile weg.
- [ ] Vorschlag, was festgehalten wird (Auswahl in der Fragerunde):
  - **Form:** Körpergewicht (Trend, sonst jüngste Messung), Trainings im letzten Monat, Rekord der häufigsten
    Übung
  - **Loci:** π-Rekord (und andere Konstanten mit Rekord), Bestzeit Kartendeck
  - **Steady:** längste laufende Serie
  - **Piano:** Übezeit im letzten Monat
  - **Kontor:** eher nicht – Geld im Rückblick ist heikel (offene Frage)
- [ ] Die Zahlen werden beim Versiegeln **kopiert** (eingefroren), nicht verlinkt. Ändert oder löscht die
  andere App später ihre Daten, bleibt „damals“, wie es war.
- [ ] Beim Öffnen dieselben Zahlen von heute daneben: „Körpergewicht 84,1 → 79,6 kg“, „π 87 → 412 Stellen“.
  In die gewünschte Richtung hervorgehoben, wie in Form.
- Technik: Zeitkapsel liest die Schlüssel der anderen Apps (`form:log`, `form:trainings`, `loci:konstanten`,
  `steady:*`, `piano:*`) nur lesend aus `localStorage`. Das koppelt an deren Datenformat – darum eine kleine,
  getestete Lese-Schicht pro Quelle (`damals.ts`), die bei Unbekanntem `null` liefert statt abzustürzen.

### Hinweis im Launcher

- [ ] Liegt ein Brief bereit (Tag erreicht, noch nicht geöffnet), trägt die Kachel im Launcher eine Plakette
  mit der Anzahl, wie bei iOS. Der Launcher liest dafür nur die Öffnungstage und ob geöffnet aus
  `zeitkapsel:briefe`, nie den Text.
- [ ] Sonst keine Hinweise – keine Liste, kein Countdown im Launcher.

### Backup

- [ ] Das Launcher-Backup erfasst `zeitkapsel:*` automatisch (wie bei allen Apps).
- [ ] Gibt es versiegelte Briefe und liegt das letzte Backup über einen Monat zurück, steht auf der Startseite
  ein leiser Hinweis mit Weg zum Backup. Setzt voraus, dass der Launcher sich das letzte Backup merkt – das ist
  die „Backup-Erinnerung“ aus der ROADMAP, die damit vorgezogen würde.

## Datenmodell

```
zeitkapsel:briefe   [{ id, geschrieben (ms), oeffnet 'YYYY-MM-DD', aufschrift, text,
                       damals: [{ quelle, label, zahl, einheit, richtung }] | null,
                       antwortAuf: id | null,
                       geoeffnet: ms | null }]
zeitkapsel:entwurf  { aufschrift, text, oeffnet, damals: boolean, antwortAuf }
```

- `geoeffnet: null` und `oeffnet` ≤ heute = bereit. `geoeffnet` gesetzt = im Archiv.
- Gelesenes wird geprüft und notfalls verworfen (`normalisiere*` in `store.ts`, getestet) – wie überall.
- **Größe:** WebKit zählt Bytes; mit einem Emoji im Text kostet der ganze Wert 2 Byte pro Zeichen (siehe
  ROADMAP, IndexedDB). 5.000 Zeichen sind dann 10 KB pro Brief, 50 Briefe 500 KB – spürbar im 5-MB-Topf, den
  sich alle Apps teilen. Darum die Grenze von 5.000 Zeichen (offene Frage) und die Briefe als **eine** Liste,
  damit „Belegt“ im Launcher es richtig zählt.

## Ansichten

### 1 – Kapsel (Start)

- [ ] Kopf: ‹ Apps, Wortmarke.
- [ ] **Bereit** (nur wenn etwas bereitliegt): Umschläge groß mit Aufschrift und „seit heute“ bzw. „seit
  3 Tagen“. Ein Tipp öffnet (Ansicht 4).
- [ ] **Versiegelt:** „3 Briefe · der nächste öffnet sich in 23 Tagen“, darunter die Umschläge klein mit
  Aufschrift und Countdown, ohne Inhalt. Ein Tipp zeigt den Umschlag (Ansicht 3).
- [ ] **Geöffnet:** das Archiv, neueste zuerst, mit „geschrieben vor 1 Jahr“.
- [ ] Unten der Hauptknopf **Brief schreiben**.
- [ ] Leer: „Was möchtest du dir in einem Jahr sagen?“ und **Ersten Brief schreiben**.

### 2 – Schreiben

- [ ] Kopf: Abbrechen (Entwurf bleibt), „Brief“, **Versiegeln**.
- [ ] Aufschrift (eine Zeile), darunter der Text groß, wächst mit; Anregung als Platzhalter.
- [ ] „Öffnen in“: Schnellwahl als Chips, „Eigener Tag“ öffnet ein Datum. Darunter ausgeschrieben, an welchem
  Tag („Donnerstag, 14. Oktober 2027“).
- [ ] Schalter „Damals festhalten“ mit den Zahlen als Vorschau.
- [ ] Bei einer Antwort oben „Antwort auf deinen Brief vom 14. Okt 2026“.

### 3 – Versiegelter Umschlag

- [ ] Der Umschlag mit Aufschrift und Siegel, „geschrieben am Dienstag, 14. Oktober 2026“, „öffnet sich am
  Donnerstag, 14. Oktober 2027 – in 287 Tagen“.
- [ ] Nur **Löschen** (mit Rückfrage). Kein Lesen, kein Ändern.

### 4 – Öffnen (Vollbild)

- [ ] Umschlag groß, „Tippe auf das Siegel“. Siegel bricht, Brief entfaltet sich, dann weiter zu Ansicht 5.

### 5 – Brief

- [ ] „Geschrieben vor 1 Jahr“ und das genaue Datum mit Uhrzeit, der Text in Briefschrift.
- [ ] **Damals · Heute** als kleine Tabelle, nur wenn festgehalten.
- [ ] Unten **Antworten** und **Löschen**. Bei einer Antwort oben ein Verweis auf den Brief davor.

## Design (Richtung offen, für die Mockups)

„Papier“ liegt nahe, aber das hat schon Stash (cremefarbenes Notizblatt, Newsreader). Zeitkapsel muss sich
davon abheben. Drei Richtungen zum Vergleichen:

- **Siegellack:** Nachtblau als Grund, Umschläge in Elfenbein, das Siegel in Siegellack-Rot als einzige
  Akzentfarbe. Eine Serifenschrift für den Brief, damit er wie ein Brief aussieht und nicht wie eine Notiz.
- **Nachthimmel:** fast schwarz mit feinem Sternenrauschen; die versiegelten Briefe als Lichtpunkte, die
  heller werden, je näher ihr Tag rückt. Ruhig, etwas poetisch.
- **Postamt:** hell, Kraftpapier, ein Poststempel mit Datum als wiederkehrendes Element, dazu eine
  Schreibmaschinen-Mono.
- **Symbol** im Stil „Signal“ (siehe README): Umschlag mit Siegel oder Sanduhr.
- **Schrift:** möglichst eine, die noch keine App nutzt. Belegt sind Barlow Condensed, Instrument Sans und
  Serif, Schibsted Grotesk, IBM Plex, Gloock, Newsreader, Bricolage Grotesque und Onest. Eine neue Schrift wäre
  eine neue `@fontsource`-Abhängigkeit.

## Nicht im MVP

- Fotos und Sprachnachrichten – zu groß für `localStorage`, erst nach dem IndexedDB-Umzug (ROADMAP).
- Briefe an andere – bräuchte einen Server oder einen Weg nach draußen.
- **Fragen an dein zukünftiges Ich**, die du beim Öffnen mit Ja oder Nein beantwortest („Hast du den
  Halbmarathon geschafft?“) – schöne Erweiterung für den zweiten Schritt.
- Wiederkehrende Briefe (jedes Jahr am Geburtstag einer).
- Eine Kopie außerhalb des Geräts, z. B. versiegelt in eine private GitHub-Inbox wie bei Stash – Schutz gegen
  Datenverlust bei sehr langen Fristen.
- Echte Verschlüsselung mit Passwort – Passwort vergessen hieße Brief weg.

## Offene Fragen (für die Fragerunde)

1. **Name:** „Zeitkapsel“, oder kurz wie die anderen Apps (z. B. „Kapsel“, „Später“, „Post“)?
2. **Früher öffnen:** nie (Empfehlung) oder mit doppelter Rückfrage?
3. **Öffnungstag verschieben:** gar nicht (Empfehlung), nur nach hinten, oder frei?
4. **Damals und heute:** welche Zahlen aus welchen Apps? Kontor dabei oder nicht (Empfehlung: nicht)?
5. **Hinweis im Launcher:** Plakette an der Kachel (Empfehlung) oder gar nichts?
6. **Länge:** 5.000 Zeichen (Empfehlung) oder knapper, z. B. 2.000?
7. **Anregungen beim Schreiben:** ja (Empfehlung) oder bewusst ein leeres Blatt?
8. **Backup-Hinweis:** die Backup-Erinnerung dafür vorziehen (Empfehlung) oder erst einmal ohne?
9. **Design-Richtung und Symbol:** nach den Mockups.
