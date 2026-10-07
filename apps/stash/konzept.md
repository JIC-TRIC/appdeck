# Stash – Konzept

Schnell einen Gedanken loswerden: Titel und Notiz schreiben, ablegen, weg ist
er. Später, wenn Zeit ist, den ganzen Stapel auf einmal in die Zwischenablage
kopieren (z. B. per WhatsApp an sich selbst schicken und am Laptop in WhatsApp
Web weiterverarbeiten) und danach löschen. Meist sind das Prompts für ein
bestimmtes Projekt, es kann aber alles sein.

Projekt-ID `stash`, Ordner `apps/stash/`, Speicher unter `stash:*`. Gebaut in
TypeScript + Ionic wie Kontor, Steady, Piano und Loci.

**Stand: gebaut (05.10.2026).** Nach einer kurzen Fragerunde direkt gebaut, ohne
Mockups. Gewählt wurde: Name **Stash**, Look **Papier (hell)**, Kopierformat
**mit Datum und Uhrzeit**, dazu **Titel-Vorschläge**, **Kopieren fragt nach
Löschen** und **Notizen in der Liste sehen**. Nicht gewählt: einzelne Notizen
bearbeiten oder löschen. Offene Fragen stehen unten unter „Später klären“.

---

## Prinzipien

- **Schreiben ist der Start.** Die App öffnet mit dem leeren Blatt, nichts
  davor. Zwei Felder, ein Knopf.
- **Abgelegt ist weg.** Nach „Ablegen“ fliegt das Blatt zum Stapel, das
  Formular ist leer. Was im Stapel liegt, sieht man nur, wenn man hingeht.
- **Raus geht alles auf einmal.** Kein Auswählen, kein Sortieren: alles
  kopieren, dann alles löschen.
- **Nichts geht verloren, was man noch nicht abgeschickt hat.** Der Entwurf
  übersteht das Schließen der App, und der zuletzt geleerte Stapel lässt sich
  einmal zurückholen.

## Design (Richtung „Papier“)

- Cremefarbener Grund `#F3EEE3`, darauf ein helleres Blatt `#FFFDF8` mit
  feinen Linien wie auf einem Notizblock. Die Notiz schreibt sich auf den
  Linien (Zeilenabstand = Linienabstand, 28 px).
- Tinte `#1F1D1A` ist die einzige Akzentfarbe: Hauptknopf, gewählter Titel,
  Zähler am Stapel. Rot `#A93226` nur für „Löschen“.
- **Newsreader** (Serifenschrift) für alles, was man schreibt und liest:
  Wortmarke, Titel, Notizen. Knöpfe und Kleinkram in der Systemschrift.
- Nur hell, kein Dark Mode.
- Symbol: drei gestapelte Zettel, der vordere mit Titelstrich und zwei Zeilen
  (`icons/stash.svg`).

## Regeln

### Ablegen

- Titel ist eine Zeile (höchstens 120 Zeichen), die Notiz beliebig lang. Einer
  von beiden reicht, beide leer: „Ablegen“ ist aus.
- Beim Ablegen wird getrimmt: Titel ohne doppelte Leerzeichen, Notiz ohne
  Leerzeilen vorn und hinten. Zeilenumbrüche in der Notiz bleiben.
- Danach: Tastatur zu, das Blatt fliegt Richtung Stapel-Knopf, der Zähler hüpft.
- Im Titel springt Enter in die Notiz. Am Rechner legt Strg/Cmd + Enter ab.

### Entwurf

- Was im Formular steht, wird bei jedem Tastendruck gespeichert und ist beim
  nächsten Öffnen wieder da (iOS beendet Web-Apps im Hintergrund gern).

### Titel-Vorschläge

- Die letzten **6** benutzten Titel stehen als Chips unter dem Titelfeld,
  neuester zuerst. Gleiche Titel zählen einmal (Groß/klein egal, die neueste
  Schreibweise gewinnt).
- Beim Tippen bleiben nur die Chips, die das Getippte enthalten.
- Ein Tipp auf einen Chip setzt den Titel und springt in die Notiz. Ein Tipp
  auf den schon gewählten nimmt ihn wieder heraus.
- Die Vorschläge bleiben auch nach dem Löschen des Stapels erhalten.

### Schon im Stapel (seit 07.10.2026)

Damit sich beim zweiten Eintrag zum selben Thema nichts doppelt:

- Steht im Titelfeld genau ein Titel, zu dem noch Notizen im Stapel liegen
  (Groß/klein und Leerzeichen egal, per Chip oder getippt), erscheint unter den
  Chips die Zeile „Schon im Stapel: 2 Notizen · Zeigen“.
- Ein Tipp klappt die Notizen auf: Zeit und Text, älteste zuerst, höchstens
  knapp die halbe Blatthöhe (scrollt), darunter bleibt das Notizfeld. Die
  Tastatur bleibt dabei offen. Ohne Text steht kursiv „Nur der Titel“.
- Ein anderer Titel und das Ablegen klappen die Liste wieder zu. Was schon
  kopiert und gelöscht ist, taucht nicht auf – nur der aktuelle Stapel zählt.

### Kopieren

Der ganze Stapel als ein Text, älteste Notiz zuerst, eine Leerzeile dazwischen.
Titel in Sternchen (WhatsApp zeigt das fett), dahinter Datum und Uhrzeit:

```
*Kontor* · 5.10. 14:32
Baue einen CSV-Export für die Buchungsliste,
Spalten wie im Konto.

_5.10. 18:05_
Notiz ohne Titel: nur die Zeit, kursiv.

*Anrufen* · 6.10. 09:10
```

- Aus einem anderen Jahr: `5.10.2025 14:32`.
- Ohne Notiz steht nur die Kopfzeile da.
- Kopieren über die Clipboard-API, sonst über ein unsichtbares Textfeld
  (ältere iOS-Versionen, http im WLAN beim Testen). Klappt beides nicht, kommt
  eine Meldung, und es wird nichts gelöscht.

### Löschen

- Nach erfolgreichem Kopieren fragt Stash: „Kopiert. 4 Notizen liegen in der
  Zwischenablage. Jetzt aus dem Stapel löschen?“ – **Behalten** oder **Löschen**.
- Der Knopf „Löschen“ neben „Alles kopieren“ leert den Stapel auch ohne
  Kopieren (mit Rückfrage), z. B. wenn man erst behalten und nach dem
  Abschicken löschen will.
- **Zurückholen:** Der geleerte Stapel bleibt bis zum nächsten Leeren
  gespeichert. Ist der Stapel leer, steht dort „Zuletzt geleert heute 14:40 ·
  4 Notizen – Zurückholen“. Zurückgeholte Notizen landen zeitlich sortiert
  zwischen dem, was seitdem dazukam.

## Datenmodell

```ts
interface Notiz {
  id: string        // crypto.randomUUID()
  titel: string     // eine Zeile, getrimmt, darf leer sein
  text: string      // getrimmt, darf leer sein – aber nicht beides
  erstellt: number  // ms
}
```

| Schlüssel       | Inhalt                                                   |
|-----------------|----------------------------------------------------------|
| `stash:notizen` | `Notiz[]` – der Stapel, älteste zuerst                   |
| `stash:entwurf` | `{ titel, text }` – fehlt, wenn das Formular leer ist    |
| `stash:titel`   | `string[]` – zuletzt benutzte Titel, neuester zuerst, ≤ 6 |
| `stash:geleert` | `{ am, notizen }` – zuletzt geleerter Stapel             |

Alles wird beim Lesen geprüft (`normalisiere*` in `store.ts`): Kaputtes und
doppelte ids fallen weg. Das Launcher-Backup erfasst alles, weil alles unter
`stash:` liegt.

Speicher: 100 Notizen à 500 Zeichen sind 50 KB (100 KB, sobald irgendwo ein
Zeichen über Latin-1 vorkommt, z. B. „–“ oder ein Emoji, siehe ROADMAP).
Unkritisch, weil der Stapel regelmäßig geleert wird.

## Navigation

Zwei Seiten mit Seitenwechsel wie Kontor und Piano (`lib/PageStage.tsx`,
`lib/useHistoryStack.ts`): **Schreiben** (Start) und **Stapel** (fährt von
rechts herein, zurück per Wischen vom linken Rand oder „‹ Schreiben“). Keine
Tab-Leiste: unten steht der Hauptknopf, und der soll bei offener Tastatur
direkt über ihr sitzen.

**Tastatur:** iOS schiebt bei offener Tastatur nur den sichtbaren Ausschnitt
über die Seite. Stash legt sich genau auf diesen Ausschnitt (`sichtbar.ts`,
`visualViewport`): Wortmarke weg, das Blatt nimmt den Platz dazwischen,
„Ablegen“ sitzt über der Tastatur.

## Ansichten

### 1 – Schreiben

Leiste: „‹ Apps“ links, rechts „Stapel“ mit Zähler (schwarzer Kreis, bei 0
grau ohne Zähler). Darunter die Wortmarke „Stash“, das Blatt mit Titel,
Chips und Notiz auf Linien, unten der Knopf „Ablegen“.

### 2 – Stapel

Leiste „‹ Schreiben“. Kopf: Anzahl („4 Notizen“) über dem Titel „Stapel“.
Darunter jede Notiz als kleines Blatt: Titel (oder kursiv „Ohne Titel“), rechts
die Zeit („heute 14:32“, „gestern 09:05“, „Fr 18:05“, älter „Mo 28.9. 08:00“),
darunter die Notiz, höchstens vier Zeilen. Antippen klappt sie ganz auf.
Unten: „Löschen“ (rot umrandet) und „Alles kopieren“ (schwarz).

Leer: „Nichts im Stapel.“ und ggf. die Zeile zum Zurückholen.

## Dateien

```
apps/stash/
  index.html            HTML-Hülle (nur hell, theme-color #F3EEE3)
  konzept.md            dieses Dokument
  src/main.tsx          Start, Schriften
  src/Stash.tsx         Seitenstapel, Kopieren, Löschen, Rückfragen
  src/views/Schreiben.tsx
  src/views/Stapel.tsx
  src/store.ts          Speicher + Prüfung (store.test.ts)
  src/text.ts           Zeitangaben, Kopiertext, Titel-Vorschläge (text.test.ts)
  src/kopieren.ts       Zwischenablage mit Rückfallweg
  src/sichtbar.ts       Bereich über der Tastatur
  src/ui.tsx, icons.tsx
  src/Stash.css
icons/stash.svg
```

## Später klären

Beim Bauen selbst entschieden oder offen geblieben, bitte bei Gelegenheit
anschauen:

- [ ] **Tastatur am iPhone testen.** Das Anlegen an den sichtbaren Bereich ist
  nur am Rechner nachgestellt. Falls es ruckelt oder der Knopf unter der
  Tastatur verschwindet: melden.
- [ ] **Notiz ohne Titel** wird als `_5.10. 14:32_` (kursiv, nur Zeit) kopiert.
  Passt das, oder lieber z. B. `*Notiz* · 5.10. 14:32`?
- [ ] **„Zuletzt geleert“ bleibt gespeichert**, bis zum nächsten Leeren. Das ist
  ein Sicherheitsnetz, heißt aber auch: nach „Löschen“ liegt der Stapel noch
  einmal auf dem Gerät. Okay so, oder nach z. B. einem Tag weg?
- [ ] **Titel-Vorschläge entfernen:** geht heute nicht. Ein vertippter Titel
  fällt erst raus, wenn sechs neuere da sind. Langes Drücken zum Entfernen?
- [ ] **Teilen statt Kopieren:** iOS kann den Text auch direkt an WhatsApp
  geben (Teilen-Blatt), das spart das Einfügen. Als zweiter Knopf?
- [ ] **Nach Titel gruppieren** beim Kopieren (alle Kontor-Prompts zusammen) –
  war eine der Format-Optionen, nicht gewählt.
- [ ] **Einzelne Notiz bearbeiten oder löschen** – bewusst nicht gewählt.
- [ ] **Wortmarke** „Stash“ groß über dem Blatt: schön, kostet aber Platz. Weg
  oder kleiner?

## Nicht drin

- Kein Dark Mode (Papier).
- Keine Ordner, Tags, Suche, Bilder oder Formatierung – dafür ist der Stapel zu
  kurzlebig.
- Keine Erinnerung („du hast 12 Notizen im Stapel“): Push geht auf iOS nur mit
  eigenem Server.
