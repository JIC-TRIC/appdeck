# Loci – Konzept

Gedächtnistraining für unterwegs. Zwei Übungen: für ein beliebiges Datum im
Kopf den **Wochentag** ausrechnen, und ein gemischtes **Kartendeck** merken und
in der richtigen Reihenfolge wiedergeben.

Projekt-ID `loci`, Ordner `apps/loci/`, Speicher unter `loci:*`. Vorbild ist die
Übungsseite `skills/ueben.html` aus dem privaten Repo Gedächtnispalast, hier
ohne alles Persönliche (siehe unten), gebaut in TypeScript + Ionic wie Kontor,
Steady und Piano.

`[ ]` = offen, `[x]` = gebaut. **Stand: gebaut (04.10.2026).** Die Mockups liegen
als Design-Leinwand „Loci Mockups“ vor (claude.ai, privat:
https://claude.ai/artifact/NLfya9ikDBT11rjAxhUfBJ). Gewählt wurde: Richtung
**Tafel**, Aufgabe **A** (eine Reihe), Wiedergeben **A** (Leiste), Symbol
**Schlüsselloch im Bogen**.

---

## Datenschutz: der Code ist öffentlich

appdeck liegt auf GitHub Pages, jeder kann den Code lesen. Deshalb gilt:

- **Keine Personen, keine Route.** Die Zuordnung Karte → Person und die 52
  Stationen durchs Haus bleiben im Repo Gedächtnispalast. Loci kennt sie nicht,
  auch nicht als freiwillige Eingabe auf dem Gerät.
- **Keine Merkwörter.** Die Monatszahlen stehen nur als Zahlen in der App
  (033 · 614 · 625 · 035), ohne die Major-Wörter und die Geschichte dazu.
- **Keine Verweise** auf `daten/karten.md`, `daten/route.md`, `abgleichen.js`
  oder Ähnliches.
- Was drin steht, ist allgemein: die Rechenmethode, die Monats- und
  Jahrhundertzahlen, die Kartenbilder (gemeinfrei, CC0).
- Die Statistik liegt wie bei allen Apps nur auf dem iPhone.

## Prinzipien

- **Üben ist der Einstieg.** Keine Startseite: Loci öffnet im zuletzt
  benutzten Reiter, beim Wochentag steht sofort ein Datum da.
- **Ein Daumen reicht.** Antworten, Kartentastatur und „Weiter“ liegen unten.
- **Lernen aus dem Rechenweg.** Nach jeder Antwort steht der ganze Weg da,
  nicht nur richtig oder falsch.
- **Gemessen wird immer.** Die Uhr lässt sich ausblenden, die Statistik bleibt
  trotzdem vollständig.
- **Nur zwei Übungen.** Weitere Skills lassen sich später als dritter Reiter
  anhängen, sind aber nicht geplant.

## Design (Richtung „Tafel“)

Nur hell, wie ein Rechenheft: Karopapier (18 px) als Grund, Tintenblau als
einzige Akzentfarbe, Daten und Zahlen in Monospace. Kleine Rundungen (6 px
Karten, 4 px Tasten).

| Token | Wert | Wofür |
|---|---|---|
| `--bg` / `--grid` | `#F7F8F3` / `#E1E7F0` | Grund mit Karo, Launcher-Übergang, theme-color |
| `--surface` / `--surface-2` | `#FFFFFF` / `#EEF2F7` | Karten, Tasten / Flächen darin |
| `--line` | `#CBD4E1` | Linien, Rahmen |
| `--text` / `-2` / `-3` | `#172033` / `#46536B` / `#5E6A80` | Tinte, abgestuft (alle ≥ 4,5:1) |
| `--accent` | `#1E4DB7` | Tintenblau: Knöpfe, aktive Stelle, Takt |
| `--good` / `--bad` / `--tip` | `#1D7A4C` / `#C2372B` / `#8A5300` | richtig / falsch / mit Tipp, je mit hellem Grund |

- Schrift: **IBM Plex Mono** für Datum, Zahlen, Rechenwege und Titel,
  **IBM Plex Sans** für alles andere (per `@fontsource`, offline, nur die
  lateinischen Teile).
- Richtig, falsch und Tipp immer mit Text oder Zeichen, nie nur Farbe.
- Mini-Karten (Kartentastatur, Stellen, Auswertung) sind elfenbeinfarben
  `#FBF8F1` mit Rot `#C4352A` und Schwarz `#1D1D1F`, wie echte Karten.
  Farbsymbole als Text mit `U+FE0E`, damit iOS sie nicht als Emoji zeigt.
- Touch-Ziele mindestens 44 px; Zahlen in Tabellen mit Tabellenziffern.

## Regeln

### Wochentag: die Methode

- [x] **Formel:** (Tag + Monatszahl + Jahreszahl + Jahrhundertzahl −
  Schaltjahr-Korrektur) mod 7. Ergebnis 0–6: 1 = Montag … 6 = Samstag,
  0 = Sonntag.
- [x] **Monatszahlen:** Jan 0, Feb 3, Mär 3, Apr 6, Mai 1, Jun 4, Jul 6, Aug 2,
  Sep 5, Okt 0, Nov 3, Dez 5.
- [x] **Jahreszahl:** (yy + ⌊yy / 4⌋) mod 7 mit yy = letzte zwei Stellen.
  Im Rechenweg ab yy ≥ 28 zusätzlich die Abkürzung (28, 56 oder 84 abziehen).
- [x] **Jahrhundertzahl:** 2 × (3 − (⌊Jahr / 100⌋ mod 4)), also 1600er 6,
  1700er 4, 1800er 2, 1900er 0, dann von vorn.
- [x] **Schaltjahr** gregorianisch (durch 4, volle Jahrhunderte nur durch 400).
  Korrektur −1 nur im Januar und Februar eines Schaltjahres.
- [x] Frühestes Jahr **1583** (erstes volles Jahr im gregorianischen Kalender),
  spätestes 9999.
- [x] Die Methode wird in Tests gegen den Kalender (`Date.UTC` + `getUTCDay`)
  geprüft, für jeden Tag von 1583 bis 2400 und Stichproben bis 9999.

### Wochentag: Aufgabe und Antwort

- [x] **Zeitraum:** Dieses Jahr (immer das aktuelle) · 1900–2099 (Standard) ·
  1600–2399 · Eigener (von–bis, 1583–9999, „von“ nicht nach „bis“, sonst
  Hinweis im Blatt). Ein eigener Zeitraum gilt, sobald man das Feld verlässt.
  Bleibt gespeichert.
- [x] Zufallsdatum gleich verteilt über alle Tage des Zeitraums, nie zweimal
  dasselbe hintereinander.
- [x] Zeitraum wechseln bringt sofort ein neues Datum. Die offene Aufgabe
  verfällt und zählt nicht.
- [x] **Uhr** läuft ab dem Erscheinen des Datums (Anzeige auf 0,1 s). Sie steht,
  solange das Anleitungs- oder Zeitraum-Blatt offen ist oder der Reiter Karten
  gezeigt wird. Im Hintergrund läuft sie weiter (Zeitstempel).
- [x] **Antwort** über 7 Knöpfe Mo–So in einer Reihe, auf jedem Knopf die
  Ergebniszahl.
- [x] **Danach** (immer): Richtig/Leider falsch mit dem richtigen Tag, Zeit,
  „Deine Antwort: Dienstag (2)“, ein Hinweis bei typischen Fehlern, der ganze
  Rechenweg, Knopf **Nächstes Datum** über der Tab-Leiste.
- [x] **Hinweise bei typischen Fehlern** (wie im Original):
  - Jan/Feb im Schaltjahr und Antwort genau einen Tag zu spät →
    „Schaltjahr-Korrektur vergessen? …“
  - März–Dez im Schaltjahr und Antwort genau einen Tag zu früh →
    „Zu viel abgezogen? Die Schaltjahr-Korrektur gilt nur für Januar und Februar.“

### Wochentag: Tipp

- [x] Knopf **Tipp** unter dem Datum deckt Baustein für Baustein auf:
  1 Tag (mod 7), 2 Monat, 3 Jahr (mit Abkürzung), 4 Jahrhundert, 5 Schaltjahr.
  Jeder Tipp zeigt Rechnung und Zahl, der Knopf zählt mit („Nächster Tipp ·
  4 von 5“).
- [x] Ab dem ersten Tipp trägt die Aufgabe das Zeichen **Mit Tipp**. Sie zählt
  als Aufgabe, aber **nicht als richtig**, und ihre Zeit fließt nicht in
  Ø-Zeit und Bestzeit. Im Verlauf steht ein ockerfarbenes „T“.
- [x] Richtig mit Tipp beantwortet: Kopf „Richtig mit Tipp: Montag“ in Ocker.

### Wochentag: Statistik

- [x] **Diese Runde** zählt seit dem Start der App. Startet iOS die App neu,
  beginnt eine neue Runde. Darunter die letzten 12 Ergebnisse der Runde als
  Punkte (Sekunden, ✗ oder T).
- [x] Tabelle *Diese Runde | Gesamt*: Aufgaben, Richtig (%), Ø Zeit (nur
  richtige), Bestzeit, Mit Tipp.
- [x] **Schwächen** aus den letzten 200 Aufgaben. Gruppen: jeder Monat, jedes
  Jahrhundert, „Schaltjahr, Januar und Februar“. Eine Gruppe zählt ab
  5 Aufgaben. Gezeigt werden höchstens 3, deren Fehlerquote über dem eigenen
  Schnitt liegt, die schlechteste zuerst, mit Balken und Strich für den Schnitt.
  Mit Tipp zählt hier wie falsch. Unter 20 Aufgaben steht, wie viele noch fehlen.
- [x] „Statistik zurücksetzen“: zweimal tippen (wie Kontor und Steady), löscht
  nur den Wochentag.

### Kartendeck: Merken

- [x] Deck: Pik, Herz, Kreuz, Karo × A, 2–10, J, Q, K. Auf Tasten und Mini-Karten
  stehen A, J, Q, K wie auf den Karten. Vorgelesen (VoiceOver) und in Listen:
  Ass, Bube, Dame, König.
- [x] **Deckgröße** 10, 20, 26 oder 52 (Standard 52), bleibt gespeichert.
- [x] Mischen mit Fisher-Yates und `crypto.getRandomValues`, dann die ersten n.
  Beim Mischen werden alle n Bilder vorgeladen.
- [x] **Eine Karte pro Ansicht.** Weiter: Tipp auf die Karte, nach links
  wischen oder „Weiter“. Zurück: nach rechts wischen oder „Zurück“, die Uhr
  läuft weiter. Weiter auf der letzten Karte = Fertig.
- [x] „Fertig“ oben beendet das Merken jederzeit. ✕ bricht ab (Rückfrage, der
  Versuch wird nicht gespeichert).
- [x] **Taktgeber** (aus/an, 0,5–10 s in 0,5er-Schritten, Standard 3,0 s): die
  Karten blättern von selbst weiter, ein Balken unter der Karte zeigt den Takt.
  Tipp oder Wischen = sofort weiter, der Takt beginnt neu. Zurück hält den Takt
  an, bis du wieder bei der vordersten Karte bist; während einer Rückfrage steht
  er auch. Nach der letzten Karte geht es mit Ablauf des Takts direkt in die
  Wiedergabe.
- [x] **Uhr** (m:ss) ein- oder ausblendbar, dieselbe Einstellung wie beim
  Wochentag. Gemessen wird immer.

### Kartendeck: Wiedergeben

- [x] Stellen 1 bis n in einer Leiste, die aktive steht in der Mitte (Start:
  Stelle 1).
- [x] **Kartentastatur:** 13 Wert-Tasten, 4 Farb-Tasten, ⌫. Wert und Farbe in
  beliebiger Reihenfolge antippen, die halbe Wahl bleibt markiert (nochmal
  tippen hebt sie auf). Sind beide gewählt, liegt die Karte an der aktiven
  Stelle (eine belegte wird ersetzt), und die nächste freie Stelle wird aktiv
  (ringsum).
- [x] Zwischen Leiste und Tastatur steht die halbe Wahl groß („Stelle 7 · jetzt
  die Farbe“), bei einer belegten aktiven Stelle deren Karte.
- [x] **Alle Karten bleiben wählbar**, auch schon gelegte, sonst verrät die
  Tastatur gegen Ende, was noch fehlt. Eine doppelt gelegte Karte ist höchstens
  an einer Stelle richtig.
- [x] Stelle antippen = sie wird aktiv. Ist sie belegt, ersetzt die nächste
  Eingabe die Karte („Stelle 9 wird ersetzt“).
- [x] **⌫:** erst eine halbe Wahl löschen, sonst die aktive Stelle leeren, wenn
  sie belegt ist, sonst die letzte belegte Stelle davor leeren und aktiv machen.
- [x] **Abgeben** oben rechts, jederzeit. Sind noch Stellen leer: Rückfrage
  „Noch 12 Stellen leer. Trotzdem abgeben?“

### Kartendeck: Wertung

- [x] **Bis zum ersten Fehler:** Stellen von vorn, bis eine falsch oder leer
  ist (wie „Speed Cards“).
- [x] **An richtiger Stelle:** alle Treffer.
- [x] Merkzeit und Wiedergabezeit getrennt, in der Auswertung immer zu sehen.
- [x] **Fehlerfrei** = alle n richtig. **Bestzeit** = kürzeste Merkzeit
  fehlerfreier Versuche, je Deckgröße. Neue Bestzeit → Hinweis in der
  Auswertung.

## Datenmodell

| Schlüssel | Inhalt |
|---|---|
| `loci:einstellungen` | `{ reiter, uhr, zeitraum: { id, von, bis }, deck: { anzahl, taktAn, takt }, anleitungGesehen }` |
| `loci:wochentag` | `{ gesamt: { anzahl, richtig, mitTipp, zeitRichtig, best }, letzte: Aufgabe[] }` |
| `loci:karten` | `Versuch[]` (die letzten 100) |

- `zeitraum.id`: `jahr` · `1900` · `1600` · `eigen`. Bei `jahr` gilt immer das
  aktuelle Jahr.
- `deck.takt`: Sekunden (bleibt stehen, wenn der Taktgeber aus ist).
- `Aufgabe`: `{ d: 'YYYY-MM-DD', a: 0–6 (gewählt), r: Antwort stimmt, z: ms,
  t: Tipps }`, die letzten 200 (für Schwächen, ca. 10 KB). `gesamt` zählt über
  alles, auch über die 200 hinaus. `richtig` heißt: stimmt und ohne Tipp.
- `Versuch`: `{ zeit (Ende, ms), n, bisFehler, richtig, merk (ms), wieder (ms),
  takt }`.
- Gelesenes wird geprüft (`normalisiere*` in `store.ts`), Kaputtes fällt auf den
  Standard zurück.
- Keine eigene Exportdatei: das Launcher-Backup erfasst `loci:*` automatisch.
  Die Statistik der alten ueben.html lässt sich nicht übernehmen (sie lag im
  Browser-Speicher der lokalen Datei).

## Navigation

- [x] Tab-Leiste **Wochentag · Karten** im Seitenfluss unter der Bühne (wie
  Piano). Start im zuletzt benutzten Reiter. Beide Reiter bleiben eingehängt:
  die offene Aufgabe und die Runde überstehen den Wechsel.
- [x] **Erster Start:** Wochentag mit offenem Anleitungs-Blatt (einmalig,
  `anleitungGesehen`).
- [x] „‹ Apps“ oben links in beiden Reitern. Keine Einstellungsseite: Uhr und
  Zeitraum im Zeitraum-Blatt, Deck-Einstellungen auf dem Kartendeck-Start.
- [x] Blätter von unten: Anleitung (groß, scrollt) und Zeitraum.
- [x] **Merken und Wiedergeben** sind ein Vollbild ohne Tab-Leiste, ohne
  Zurückwischen vom Rand (Wischen blättert Karten). Raus geht es über ✕ (mit
  Rückfrage), Fertig oder Abgeben.
- [x] Die Auswertung ersetzt im Reiter Karten den Start, bis „Neu mischen“ oder
  „Einstellungen“.
- [x] Laufende Aufgabe und laufender Versuch überstehen **keinen** Neustart
  durch iOS (bei einem Merkversuch wäre die Zeit danach ohnehin wertlos).
- [x] Tasten am Rechner wie im Original: Wochentag 1–6, 0/7, Enter/Leertaste;
  Merken → ← Leertaste Enter Esc; Wiedergeben ⌫, Enter, Esc.

## Ansichten

### 1 – Wochentag: Aufgabe
- [x] Kopf: ‹ Apps, Zeitraum als Pille (öffnet Blatt 4), „?“ (öffnet Blatt 5).
- [x] Karte: „Aufgabe 13“, Uhr, „Welcher Wochentag ist der“, Datum groß
  („14. März 1987“), darunter 14.03.1987, Knopf Tipp.
- [x] 7 Knöpfe Mo–So in einer Reihe unter der Karte, kleine Zahl darunter.
- [x] Darunter Diese Runde, beim Scrollen Statistik und Schwächen (Ansicht 6).

### 2 – Wochentag: Lösung
- [x] Karte schrumpft auf Datum, richtiger Knopf grün, deiner rot, die anderen
  blass.
- [x] Urteil, Zeit, deine Antwort, Hinweis (ocker), Rechenweg mit Summe und
  „mod 7“, Knopf Nächstes Datum unten.

### 3 – Wochentag: Tipp
- [x] Bausteinliste in der Karte (aufgedeckte mit Rechnung und Zahl, die
  anderen mit „?“), Knopf „Nächster Tipp · 4 von 5“, Zeichen „Mit Tipp“, Satz
  unter den Knöpfen.

### 4 – Zeitraum (Blatt)
- [x] Vier Optionen mit Unterzeile, bei Eigener zwei Jahresfelder mit Fehlertext.
- [x] Schalter **Uhr anzeigen** („Gemessen wird trotzdem. Gilt auch fürs
  Kartendeck.“).

### 5 – Anleitung (Blatt)
- [x] Formel, Ergebnis → Wochentag, Monatszahlen (3 × 4) mit Reihe
  033 · 614 · 625 · 035, Jahr in drei Schritten plus Abkürzung, Jahrhunderte
  (1900er und 2000er hervorgehoben), Schaltjahr, „Dieses Jahr“ (Jahr +
  Jahrhundert schon ausgerechnet, z. B. 2026: Tag + Monat + 3), ein Beispiel
  (29. Februar 2024).
- [x] **Ausprobieren:** Datumsfeld (ab 1583, heute vorbelegt), darunter
  Wochentag und der ganze Rechenweg.

### 6 – Wochentag: Statistik (unter der Aufgabe)
- [x] Diese Runde, Tabelle, Schwächen, Statistik zurücksetzen.

### 7 – Kartendeck: Start
- [x] Titel, ein Satz, Karte mit Deckgröße, Taktgeber (Schalter + Schritte),
  Uhr anzeigen. **Mischen und loslegen.**
- [x] Bestzeiten (10/20/26/52, nur fehlerfrei), letzte 5 Versuche (Größe, bis
  Fehler, wann, Takt, Merk- und Wiedergabezeit), Statistik zurücksetzen.

### 8 – Merken
- [x] ✕, „Karte 7 von 52“ mit Uhr, Fertig; Fortschrittsbalken; Karte groß;
  Zurück · „Tippen oder wischen“ · Weiter.

### 9 – Merken mit Taktgeber
- [x] Wie 8, dazu Taktbalken mit „Takt 3,0 s“ und „Zurück hält den Takt an“
  bzw. „Takt angehalten“.

### 10 – Wiedergeben
- [x] ✕, „Stelle 7 von 52“ mit Uhr, Abgeben.
- [x] Leiste der Stellen, „6 von 52 gelegt“, die halbe Wahl groß,
  Kartentastatur unten.

### 11 – Auswertung
- [x] Titel („Fehlerfrei, alle 52 Karten!“ oder „31 von 52 bis zum ersten
  Fehler“), Deckgröße · Takt · Zeit, Kacheln (bis Fehler, an richtiger Stelle,
  Merkzeit, Wiedergabe).
- [x] Richtige Reihenfolge (10 pro Reihe, Fehler rot umrandet, der erste
  stärker), Fehlerliste (Stelle, richtig, deine oder „leer“), Neu mischen,
  Einstellungen.

## Querschnitt

- [x] Ionic-React-App wie Piano: `apps/loci/src/main.tsx` mit `mountApp`, eigenes
  CSS, kein schwebender Home-Knopf.
- [x] Eintrag in `apps.js`:
  `{ id: 'loci', name: 'Loci', icon: 'icons/loci.svg', color: '#F7F8F3', bg: '#F7F8F3', path: 'apps/loci/' }`
- [x] Symbol `icons/loci.svg`: Schlüsselloch im Bogen, Tintenblau auf Karo.
- [x] **Kartenbilder:** die 52 PNGs aus Gedächtnispalast (500 × 750, CC0) in
  voller Größe als WebP (Qualität 75, zusammen rund 1 MB; kleiner wäre auf dem
  iPhone-Display unscharf), in `src/karten/`, eingebunden per
  `import.meta.glob` in `bilder.ts`. So landen sie im Build und im
  Offline-Speicher. Quelle und Lizenz: `src/karten/LIZENZ.md`.
- [x] **Tests** (`npm test`):
  - Methode gegen Kalender (alle Tage 1583–2400, Stichproben bis 9999),
    Rechenweg-Texte inkl. Abkürzung, Schaltjahr-Fälle 1600/1700/1900/2000
  - Hinweise bei typischen Fehlern, Zufallsdatum bleibt im Zeitraum, Tipp-
    Bausteine ergeben zusammen den Wochentag
  - Tipp zählt nicht als richtig, Zeit nicht in Ø/Bestzeit
  - Schwächen: ab 20, Mindestanzahl, nur über Schnitt, höchstens 3, nur die
    letzten 200
  - Mischen ergibt eine Umordnung; Wertung (bis Fehler, Treffer, Duplikate,
    leere Stellen); nächste freie Stelle ringsum; ⌫ in allen drei Fällen
  - Gespeichertes lesen: gültige Werte bleiben, kaputte fallen auf den Standard

## Dateien

```
apps/loci/
├─ index.html          Hülle (shell.js, theme-color #F7F8F3)
├─ konzept.md          dieses Dokument
└─ src/
   ├─ main.tsx         Schriften, mountApp
   ├─ Loci.tsx         Einstellungen, zwei Reiter, Tab-Leiste
   ├─ Loci.css         alles Aussehen
   ├─ types.ts         Datenmodell
   ├─ wochentag.ts     Methode, Rechenweg, Hinweise, Tipp, Zeitraum, Zufallsdatum
   ├─ statistik.ts     Zählen, Runde und Gesamt, Schwächen
   ├─ karten.ts        Deck, Mischen, Stellen belegen, ⌫, Wertung, Bestzeiten
   ├─ bilder.ts        Kartenbilder (import.meta.glob), Vorladen
   ├─ store.ts         Schlüssel, Lesen mit Prüfung, Schreiben, Zurücksetzen
   ├─ util.ts          Zeiten formatieren („4,2 s“, „1:24“, „heute, 21:14“)
   ├─ ui.tsx           Apps-Knopf, Stoppuhr, Laufuhr, Blatt, Schalter,
   │                   Bestätigen, Rechenweg, Mini-Karte
   ├─ icons.tsx        Strich-Symbole
   ├─ karten/          52 Kartenbilder (WebP) + LIZENZ.md
   ├─ *.test.ts        wochentag, statistik, karten, store
   └─ views/           Wochentag, Anleitung, Zeitraum, Karten (Reiter und
                       Vollbild), KartenStart, Merken, Wiedergeben, Auswertung
icons/loci.svg
```

---

## Entscheidungen

Aus der Fragerunde am 04.10.2026:

1. **Eine App, zwei Reiter**, nicht zwei Kacheln
2. **Ionic + TypeScript**, nicht die alte HTML-Datei übernehmen
3. **Name Loci**
4. **Monatszahlen ohne Major-Wörter**, Personen und Route ganz weg (auch nicht
   freiwillig auf dem Gerät)
5. **Anleitung als Spickzettel mit Ausprobieren**, hinter „?“ als Blatt, Uhr
   steht solange
6. **Alle vier Zeiträume**, Standard 1900–2099
7. **Nach jeder Antwort der Rechenweg**, endlos üben (keine Runden fester Länge)
8. **Statistik in der Übung**, kein eigener Reiter
9. **Echte Kartenbilder**, **Kartentastatur** zum Wiedergeben, Tippen und Wischen
   beim Merken
10. **Vom Original bleiben:** Deckgröße, Uhr ausblendbar, Zurückblättern.
    **Weg:** mehrere Karten pro Ansicht
11. **Kartendeck ohne Anleitung** (kein „?“)
12. **Extras:** Schwächen und Tipp beim Wochentag, Taktgeber beim Kartendeck

Aus den Mockups gewählt (04.10.2026): Richtung **Tafel**, Aufgabe **A** (eine
Reihe), Wiedergeben **A** (Leiste), Symbol **Schlüsselloch im Bogen**.

## Nicht drin

- Bausteine einzeln üben (nur Monats-, Jahres- oder Jahrhundertzahl abfragen)
- Verlauf als Kurve, Fehlerkarten (welche Karten oft falsch liegen)
- Mehrere Karten pro Ansicht
- Personen und Route, Lernhilfen „Person/Station einblenden“
- Runden mit fester Länge
- Eigene Exportdatei, dunkler Modus
