# Piano – Konzept

Übe-Tagebuch fürs Klavier. Stücke mit YouTube-Video sammeln, Übezeit messen,
den Lernstand Stufe für Stufe festhalten und sehen, ob man dranbleibt.

Projekt-ID `piano`, Ordner `apps/piano/`, Speicher unter `piano:*`. Früher
eigenes Repo (piano-practice-tracker, englisch, Version 1.4.7) – seit Oktober
2026 hier, seit 2.0 neu gebaut (TypeScript + Ionic wie Kontor und Steady).

`[ ]` = offen, `[x]` = gebaut. Die Mockups liegen als Design-Leinwand
„Piano Redesign“ vor (claude.ai, privat). Gewählt wurde: Richtung **Flügel**,
Heute 2, Stücke 1, Stück 1, Üben 1 mit Abschluss-Blatt, Neues Stück, Erststart,
Statistik 1, Verlauf, Setlists, Setlist-Programm, Einstellungen.

---

## Prinzipien

- **Heute ist der Einstieg.** Kein Werbetext, keine Kachel-Startseite: das
  nächste Stück, die Woche, die Serie.
- **Jedes Stück hat eine eigene Seite.** Ein Tipp aufs Stück öffnet seine Seite,
  nicht sofort Video und Uhr. Üben startet bewusst.
- **Erst üben, dann einordnen.** Den Lernstand fragt das Blatt nach „Fertig“
  ab – nicht neun Schalter neben dem laufenden Video.
- **Schwierigkeit ist nicht Lernstand.** Die Schwierigkeit ist die Einschätzung
  des Stücks (beim Anlegen, änderbar), wie gut es sitzt, sagt der Lernweg.
  Beides steht nebeneinander, auch auf den Kacheln.
- **Gespeichert wird, was passiert ist.** Sitzungen (Ende + Dauer), Lernstand,
  Schwierigkeit, Notizen. Serie, Woche, Tagesliste, Trend werden berechnet.
- **Kompatibel bleiben.** Datenformat und Exportdatei wie in der alten App:
  alte Exporte lassen sich importieren, neue in der alten App auch.

## Design (Richtung „Flügel“)

Nur dunkel. Klavierlack als Grund, Elfenbein für Text, Messing als einzige
Akzentfarbe (keine Farbwahl). Rot nur fürs Löschen. Einzige Ausnahme: die
Schwierigkeit hat eine eigene Farbskala von Grün bis Rot (siehe unten), damit
sie auf den Kacheln klein bleibt und trotzdem auf einen Blick zu sehen ist.

| Token | Wert | Wofür |
|---|---|---|
| `--bg` | `#0E0D0B` | Grund, Launcher-Übergang, theme-color |
| `--surface` / `--surface-2` | `#191714` / `#26221D` | Karten / Flächen darin |
| `--line` / `--line-soft` | `#332E27` / `#221F1A` | Linien |
| `--text` / `-2` / `-3` | `#F2EBDD` / `#ADA393` / `#8A8171` | Elfenbein, abgestuft (alle ≥ 4,5:1) |
| `--accent` | `#D9A953` | Messing: Knöpfe, Fortschritt, Serie |
| `--danger` | `#E0705C` | Löschen |

Schrift: **Gloock** für Titel und große Zahlen, **Instrument Sans** für alles
andere (beide per `@fontsource`, offline). Rundungen weich (Karten 20 px,
Knöpfe ganz rund). Der Lernstand ist eine kleine Klaviatur: 9 Tasten in vier
Gruppen, erreichte Tasten in Messing.

Video-Vorschaubilder kommen von YouTube (`img.youtube.com`). Ohne Netz oder
ohne Link steht dort eine getönte Fläche mit Tastenstreifen.

## Regeln

### Tag und Woche

- [x] **Logischer Tag** mit Tageswechsel (Standard 3:00 Uhr, einstellbar 0–6):
  wer um 1:30 Uhr übt, übt noch für den Vortag. Gilt für heute, Woche, Serie,
  Kalender, Verlauf und Tagesliste. Gerechnet in Ortszeit – die alte App nahm
  für die Serie UTC, Sitzungen kurz nach Mitternacht landeten am falschen Tag.
- [x] Wochen beginnen montags.

### Sitzung und Uhr

- [x] Eine Sitzung = `{ timestamp: Ende (ISO), duration: Sekunden }` pro Stück.
- [x] Gespeichert ab **30 Sekunden**. Kürzer: nur „zuletzt geübt“ wird gesetzt
  (wie bisher).
- [x] Die Uhr startet beim Öffnen von Üben, lässt sich **pausieren**, rechnet mit
  Zeitstempeln (läuft im Hintergrund weiter).
- [x] Die laufende Sitzung liegt in `piano:uebung`. Beendet iOS die App im
  Hintergrund (typisch, wenn das Video in der YouTube-App läuft), öffnet Piano
  beim nächsten Start wieder Üben mit der richtigen Zeit.

### Lernweg (9 Stufen)

| Gruppe | Stufen | Feld |
|---|---|---|
| Hände einzeln | rechts langsam, rechts im Tempo, links langsam, links im Tempo | `rightHand`, `leftHand` 0–2 |
| Hände zusammen | langsam, im Tempo | `together` 0–2 |
| Dynamik | ja | `dynamics` |
| Auswendig (freiwillig) | Noten im Kopf, ganz | `memorized` 0–2 |

- [x] Sperren wie bisher: Zusammen erst, wenn beide Hände im Tempo sind;
  Dynamik erst, wenn zusammen im Tempo; Auswendig erst nach Dynamik. Rückwärts
  gesperrt, sobald die nächste Gruppe begonnen hat.
- [x] Status: Nicht begonnen · Hände einzeln · Zusammen · Gelernt (Dynamik) ·
  Auswendig lernen (Noten im Kopf) · Auswendig (ganz).
- [x] Filter in Stücke: *In Arbeit* (bis Zusammen), *Gelernt*, *Auswendig*
  (beide Auswendig-Stufen).

### Schwierigkeit

Wie schwer das Stück an sich ist – die eigene Einschätzung, meist beim
Anlegen, unabhängig davon, wie weit man ist. Wie gut es sitzt, zeigt allein der
Lernweg. Die Werte bleiben (`Unknown` … `Ultrahard`, kompatibel mit der alten
App), nur die Bedeutung ist neu:

| Wert | Anzeige | Farbe | Beschreibung |
|---|---|---|---|
| Unknown | Offen | – | Noch nicht eingeschätzt. |
| Free | Sehr leicht | `#6fbf8e` | Wenige Töne, ruhiges Tempo – fast vom Blatt. |
| Easy | Leicht | `#b4c95e` | Überschaubar, nur einzelne Stellen brauchen Übung. |
| Medium | Mittel | `#e8c95a` | Einige knifflige Stellen, ein paar Wochen Arbeit. |
| Hard | Schwer | `#e8914f` | Viele schwierige Stellen: Tempo, Sprünge, volle Griffe. |
| Ultrahard | Sehr schwer | `#e0625a` | Eine echte Herausforderung, an der Grenze des Machbaren. |

- [x] Gesetzt im Blatt Neues Stück / Bearbeiten und auf der Stück-Seite
  („Ändern“). Nicht mehr nach jeder Sitzung abgefragt.
- [x] Bis 06.10.2026 hieß die Skala „Wie sitzt es?“ (Frei … Noch keine Hand
  allein spielbar) und wurde nach jeder Sitzung abgefragt – das doppelte den
  Lernweg. Gespeicherte Werte bleiben stehen und gelten jetzt als Einschätzung.

### Tagesliste

- [x] Wie bisher: Punkte für „lange nicht geübt“ (bis 60), Trend (bis 30),
  Lernstand (nicht begonnen 15 … auswendig 2) und Zufall (bis 20); so viele
  Stücke, bis die geschätzte Zeit das **Tagesziel** füllt (früher fest 30 min).
- [x] Geschätzte Zeit pro Stück: Ø seiner Sitzungen, ohne Sitzungen 5 min.
- [x] Pro logischem Tag fest (Zufall mit dem Datum als Startwert), „Neu mischen“
  würfelt neu. Gespeichert in `piano:playlist` – nicht mehr während des
  Zeichnens (das war die Endlosschleife bei leerer Bibliothek).
- [x] Erledigt = heute mindestens eine Sitzung.
- [x] **Heute nicht**: in der Liste nach links wischen (oder „Heute nicht“ in der
  Karte Als Nächstes) – das Stück fällt für heute raus, das nächstbeste nach
  denselben Regeln rückt ans Ende nach. Mit Rückgängig. Weggewischtes bleibt auch
  beim Neu-Mischen draußen, am nächsten Tag ist es wieder dabei.

### Archiv

- [x] Ein archiviertes Stück fällt aus Tagesliste, Kacheln und Filtern; Sitzungen,
  Setlists und Statistik bleiben. Eigener Filter „Archiv“ (nur wenn es etwas gibt),
  die Suche unter „Alle“ findet auch Archiviertes. Archivieren mit Rückgängig,
  Zurückholen über „…“ auf der Stück-Seite.

### Serie, Trend, Meilensteine

- [x] **Serie**: logische Tage am Stück mit mindestens einer Sitzung, bis heute
  oder gestern (heute noch nicht geübt bricht sie nicht). Dazu der **Rekord**.
- [x] **Im Trend**: Summe der Sitzungen, gewichtet mit 10 · e^(−Tage/13).
- [x] **Meilensteine** der Gesamtzeit: 5, 10, 25, 50, 75, 100 h, dann alle
  50 h bis 500 h, dann alle 100 h bis 2000 h.

## Datenmodell

| Schlüssel | Inhalt |
|---|---|
| `piano:pieces` | `Piece[]` |
| `piano:sessions` | `{ [pieceId]: Session[] }` |
| `piano:settings` | Einstellungen (unten) |
| `piano:setlists` | `{ id, title, pieceIds[] }[]` |
| `piano:playlist` | `{ date: 'YYYY-MM-DD', pieceIds[], seed, skipped[] }` (skipped = heute weggewischt) |
| `piano:uebung` | laufende Sitzung `{ pieceId, queue[], startedAt, pausedMs, pausedAt }` – nicht im Export |

`Piece`: `id, title, artist, youtubeUrl, thumbnail, difficulty, progress,
notes (neu), archivedAt (neu), lastPracticed, createdAt, practiceTime (Altlast, 0)`. Sehr alte
Stücke mit `milestones[]` werden beim Lesen in `progress` übersetzt.

Einstellungen: `dailyGoalMinutes` (30), `videoMode` (`app` | `youtube`),
`dayStart` (3), `sort { by, reverse }`. Felder der alten App
(`showExternalYouTubeButton`, `favoritePiecesCount`, `colorScheme`) bleiben
stehen; `videoMode` fehlt → aus `showExternalYouTubeButton` (alt: an = YouTube).

**Export** (Einstellungen → Backup teilen): wie die alte App (`pianoPieces`,
`practiceSessions`, `pianoSettings`) plus `pianoSetlists`, `sessionPlaylist`.
**Import** nimmt diese Dateien und appdeck-Backups (`storage.ts`). Beim ersten
Start übernimmt Piano die alten Schlüssel ohne Präfix, falls vorhanden.

## Navigation

- [x] Tab-Leiste: **Heute · Stücke · Statistik**. Ein Tipp auf den aktiven Tab
  führt zu seiner Startseite zurück.
- [x] Unterseiten (Stück, Setlists, Setlist, Verlauf, Einstellungen) fahren von
  rechts herein, vom linken Rand lässt sich zurückwischen. Gemeinsam mit Kontor:
  `lib/PageStage.tsx` (Übergänge) und `lib/useHistoryStack.ts` (Stapel an der
  Browser-History – die Zurück-Geste geht Schritt für Schritt zurück).
- [x] Die Tab-Leiste steht im Seitenfluss unter der Bühne, nicht darüber: der
  Scrollbereich endet genau an ihr (mit `100dvh` und fester Leiste blieb auf dem
  iPhone das Ende von „Heute“ verdeckt und ließ sich nicht scrollen).
- [x] Üben ist ein Vollbild von unten, alles andere sind Blätter von unten.
- [x] „‹ Apps“ oben links auf jeder Tab-Startseite (ein Tipp zum Launcher, wie
  in Stash und Loci; seit 06.10.2026). „Alle Apps“ steht außerdem weiter in den
  Einstellungen. Kein schwebender Home-Knopf.

## Ansichten

### 1 – Heute
- [x] Datum (logischer Tag), Titel, Einstellungen oben rechts.
- [x] Karte **Als Nächstes**: erstes noch nicht geübtes Stück der Tagesliste (mit
  „Heute nicht“) –
  Vorschaubild (öffnet das Stück), „Als Nächstes · 2 von 4“, Titel, Interpret,
  geschätzte Zeit, Lernstand und nächster Schritt, **Üben starten** (übt die
  restliche Tagesliste der Reihe nach).
- [x] Alles geschafft: Karte „Tagesliste geschafft“ mit „Neu mischen“.
- [x] Karte **Diese Woche**: Summe, Balken Mo–So (heute umrandet), heute X von
  Y min, Serie.
- [x] Zeile **Tagesliste · noch n Stücke** → Blatt mit der ganzen Liste
  (Haken, Zeit, Neu mischen; Tipp startet Üben).

### 2 – Erststart (Heute ohne Stücke)
- [x] Kleine Klaviatur, „Noch keine Stücke“, **Erstes Stück hinzufügen**,
  **Backup importieren** (Exportdatei der alten App oder Launcher-Backup).

### 3 – Stücke
- [x] Titel, Setlists (Listen-Symbol), Hinzufügen (+).
- [x] Suche (Titel, Interpret), Sortierung als Blatt (Im Trend, Zuletzt geübt,
  Übezeit, Lernstand, Schwierigkeit, Titel, Hinzugefügt, Zufall; umkehrbar;
  bleibt gespeichert).
- [x] Filter: Alle · In Arbeit · Gelernt · Auswendig, jeweils mit Anzahl.
- [x] Kacheln zu zweit: Vorschaubild mit Schwierigkeit als farbige Ecke oben
  links (ohne Zahl, bei „Offen“ keine Ecke) und Gesamtzeit unten rechts, Titel,
  Interpret, Lernstand als Klaviatur. Unter den Kacheln eine Zeile als Legende
  („Schwierigkeit: leicht ◤◤◤◤◤ schwer“), nur wenn eine Ecke zu sehen ist.
  Mockups dazu: Design-Leinwand „Piano – Schwierigkeit in der Übersicht“
  (claude.ai, privat), gewählt J.

### 4 – Stück
- [x] Zurück, Bearbeiten (Blatt 7), „…“ (Zu Setlist hinzufügen, Archivieren bzw.
  Aus dem Archiv holen, Löschen mit Rückgängig – fehlte bisher ganz).
- [x] Großes Vorschaubild (startet Üben), Titel, Interpret, Status und
  Schwierigkeit, **Üben starten**, gesamt · Sitzungen · zuletzt.
- [x] **Lernweg** als Stufenleiter, direkt änderbar, mit Sperr-Hinweisen.
- [x] **Schwierigkeit** mit Beschreibung, „Ändern“ öffnet ein Blatt („Wie
  schwer ist das Stück?“).
- [x] **Notizen** (neu): Freitext, speichert beim Tippen.
- [x] **Letzte Sitzungen** (3), „Alle n“ → Verlauf dieses Stücks.

### 5 – Üben
- [x] Schließen (unter 30 s sofort, sonst erst das Abschluss-Blatt), Titel,
  „YouTube ↗“.
- [x] Video eingebettet (Einstellung „In der App“) oder Vorschaubild mit
  „In YouTube öffnen“.
- [x] Große Uhr, „Läuft“/„Pausiert“, was heute davor schon geübt wurde.
- [x] **Pause/Weiter** und **Fertig**.
- [x] Karte „Ziel dieser Sitzung“: der nächste Schritt im Lernweg.

### 6 – Wie lief’s? (Blatt nach „Fertig“)
- [x] Dauer (unter 30 s mit Hinweis), die aktuelle Gruppe des Lernwegs zum
  Weiterschalten. Keine Schwierigkeit – die ist eine Einschätzung des Stücks,
  nicht wie die Sitzung lief.
- [x] **Speichern** (danach das nächste Stück, wenn eine Liste läuft) oder
  **Sitzung verwerfen**. Wegwischen = zurück zur pausierten Uhr.

### 7 – Neues Stück / Bearbeiten (Blatt)
- [x] YouTube-Link mit **Einfügen**, Vorschaubild, sobald der Link passt.
- [x] Titel (Pflicht), Interpret.
- [x] „Wie schwer ist das Stück?“ – Sehr leicht · Leicht · Mittel · Schwer ·
  Sehr schwer, nochmal tippen = Offen. Auch beim Bearbeiten.
- [x] Nur beim Anlegen: „Wo stehst du?“ – Neu · Hände einzeln · Zusammen ·
  Gelernt · Auswendig (setzt den Lernweg grob).
- [x] „Auf YouTube suchen ↗“. Dasselbe Video zweimal → Hinweis, nicht gespeichert.

### 8 – Statistik
- [x] Gesamt, Sitzungen, Ø Sitzung, gelernte Stücke.
- [x] Serie mit Rekord.
- [x] Kalender der **letzten 17 Wochen**, heute rechts unten (bisher ein Jahr,
  das Neueste rechts außerhalb des Bildschirms).
- [x] Nächster Meilenstein, Meistgeübt (3), Zeile Verlauf mit Tagen und
  Sitzungen (bisher „0 days“ bis zum Aufklappen).

### 9 – Verlauf
- [x] Nach Tagen gruppiert, je Tag Summe; Zeile mit Uhrzeit und Dauer.
- [x] Nach links wischen löscht, mit Rückgängig. 30 Tage, dann „Mehr zeigen“.
- [x] Auch gefiltert auf ein Stück (aus Stück → „Alle n“).

### 10 – Setlists
- [x] Karten mit Vorschaubildern, Anzahl, geschätzter Dauer, **Durchspielen**.
- [x] Neue Setlist (Blatt mit Namen).

### 11 – Setlist (Programm)
- [x] Titel, Anzahl · Dauer, **Durchspielen**, nummerierte Liste mit
  Punktlinie und Dauer. Reihenfolge per Ziehen am Griff, Entfernen per Wischen.
- [x] „Stück hinzufügen“ (Blatt mit Suche), „…“ (Umbenennen, Löschen mit
  Rückgängig).

### 12 – Einstellungen
- [x] Tagesziel (5–240 min, in 5er-Schritten), Videos öffnen (In der App · In
  YouTube), Tageswechsel (Blatt, Mitternacht bis 6 Uhr).
- [x] Backup teilen (iOS-Teilen-Menü, sonst Download), Backup importieren
  (mit Rückfrage), belegter Speicher.
- [x] Alle Apps. Version.

## Dateien

```
index.html          Hülle (shell.js, theme-color #0E0D0B)
src/main.tsx        Schriften, Übernahme alter Schlüssel, mountApp
src/Piano.tsx       Daten, Tabs, Seitenstapel mit Wechsel und Zurückwischen, Üben, Meldungen
src/storage.ts      Schlüssel, Übernahme, Export/Import (Format der alten App)
src/store.ts        Lesen/Schreiben der Daten, Stücke/Sitzungen/Setlists ändern
src/model.ts        Lernweg, Status, Schwierigkeit, Meilensteine
src/calc.ts         Tage, Woche, Serie, Kalender, Trend, Tagesliste, Verlauf
src/util.ts         Datum, Formate, YouTube
src/ui.tsx          Bausteine (Seite, Blatt, Klaviatur, Vorschaubild, …)
src/icons.tsx       Linien-Icons
src/views/          eine Datei pro Ansicht, Blätter in Sheets.tsx
src/Piano.css       alles Aussehen
```

## Nicht drin

- Mehrere Farbschemen (früher 6) – eine Richtung, eine Akzentfarbe.
- Metronom, Aufnahme, Erinnerungen (Push bräuchte einen Server).
- Titel automatisch aus YouTube holen – ginge (YouTube-oEmbed erlaubt den Abruf
  von jic-tric.github.io, geprüft), ist aber bewusst noch nicht drin.
