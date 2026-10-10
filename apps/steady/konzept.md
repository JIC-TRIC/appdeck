# Steady – Konzept

Habit Tracker für appdeck. Jeden Tag abhaken, was man sich vorgenommen hat –
Gym, Creatin, Bett gemacht, genug gegessen, kein Handy im Bett, Lesen – und im
Wochenraster sehen, ob man dranbleibt. Der Name ist das Ziel: **beständig**,
nicht perfekt.

Projekt-ID `steady`, Ordner `apps/steady/`, Speicher unter `steady:*`.

`[ ]` = offen, `[x]` = gebaut. **Stand: das MVP läuft** (27.09.2026, noch
nicht committet) – alle elf Ansichten, Regeln getestet. Was fehlt, steht bei
den Ansichten als `[ ]` und unten unter „Nicht im MVP“. Die Mockups zu jeder
Ansicht liegen daneben in
[mockups.html](mockups.html); Beispieldatum dort ist **Mittwoch, 30. September
2026**, Beispieldaten sind die sieben Gewohnheiten unten.

---

## Prinzipien

- **Das Wochenraster ist die App.** Eine Hauptansicht: alle Gewohnheiten
  untereinander, die letzten 7 Tage nebeneinander. Abhaken, Lücken sehen,
  nachtragen – alles auf diesem einen Bildschirm.
- **Gespeichert wird nur, was du einträgst.** Ein Haken, ein Tageswert oder
  „nicht geschafft“. Ruhetage, verpasste Tage, Serien und Quoten werden daraus
  berechnet, nie gespeichert. Wer nachträgt, bekommt automatisch die richtige
  Serie.
- **Zwei Messarten, zwei Rhythmen.** Abhaken oder Menge; täglich oder x-mal pro
  Woche. Mehr nicht. Jede weitere Variante macht das Raster schwerer zu lesen.
- **Ruhetage sind kein Schummeln.** Bei „3× pro Woche“ werden die freien Tage
  automatisch mitabgehakt und die Serie läuft weiter – aber man sieht immer den
  Unterschied zwischen „war da“ (●) und „automatisch“ (◌).
- **Keine Pausen.** Krank oder Urlaub bricht die Serie. Die Ruhetage bei
  x-mal pro Woche sind Puffer genug.
- **Positiv formulieren, immer abhaken.** „Kein Handy im Bett“ ist eine normale
  Gewohnheit: Haken rein, wenn man es geschafft hat. Es gibt keine eigene
  „Vermeiden“-Art – bestätigen fühlt sich besser an als nichts eintragen.
- **Nur dunkel.** Kein heller Modus.
- **Name + Farbe.** Keine Symbole, keine Emoji pro Gewohnheit. Die Farbe ist die
  Identität einer Gewohnheit, keine Bewertung.
- **Keine Tab-Leiste.** Kopfzeile mit Symbolen, das Raster bekommt die volle
  Höhe.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.

---

## Design

Dunkel, ruhig, farbige Punkte auf Graphit. Die UI selbst ist schwarz-weiß –
Farbe gehört ausschließlich den Gewohnheiten (plus Bernstein für die Serie).
Dadurch lesen sich die Punkte im Raster sofort.

```
Grund        #0F1113   Graphit, leicht kühl, kein reines Schwarz
Fläche       #171A1D   Blätter, Karten, Menü
Fläche hoch  #1F2327   Eingabefelder, Tasten, Segment-Hintergrund
Linie        #2A2F34   Trenner, offene Heute-Zelle
Linie leise  #1E2226   Zeilentrenner im Raster
Text         #EDEFF1
Text leise   #9AA1A9
Text still   #6B727A   Wochentage, Regelzeile, verpasst (×)
Serie        #F2B84B   Flamme + Serienzahl (die einzige UI-Farbe)
Gefahr       #F06A5E   nur für „Alle Daten löschen“ / „Endgültig löschen“
```

**Gewohnheitsfarben** – zehn Töne auf gleicher Helligkeit, damit keine
Gewohnheit lauter ist als die andere. Alle lesbar als Text auf Graphit:

```
Koralle #F2785C   Orange #F59E45   Gelb   #E9C84A   Limette #A5CF5A   Grün #5DC486
Türkis  #45C2C0   Himmel #5AAEF0   Indigo #8190F5   Violett #B58AF0   Rosa #EE80B5
```

- **Schrift:** Onest für alles, Bricolage Grotesque nur für Wortmarke und große
  Zahlen (Serie in der Detailansicht, Kennzahlen der Statistik). Beide über
  `@fontsource` mit im Build, wie bei Kontor – offline, keine Anfrage an Dritte
- **Ziffern tabellarisch** (`tabular-nums`) in Raster, Serie und Statistik,
  damit Spalten ruhig stehen
- **Kein Rot für verpasste Tage.** Ein verpasster Tag ist eine Lücke (graues ×),
  kein Alarm. Rot gibt es nur für endgültiges Löschen
- **Primärknöpfe weiß** mit dunkler Schrift, Sekundärknöpfe auf „Fläche hoch“.
  Einzige Ausnahme: „Sichern“ im Mengen-Blatt trägt die Farbe der Gewohnheit
- Radien: Karten 18 px, Heute-Zelle 11 px, Knöpfe 14 px, Blätter oben 24 px
- Mobil zuerst im **Hochformat**, Referenz 390 × 844 (iPhone 13–16), geprüft
  ab 375 px Breite; auf dem Desktop zentriert bei max. 460 px
- Nur dunkel: `color-scheme: dark`, eigene Tokens. **Nicht** `@lib/dark`
  importieren – das folgt der Systemeinstellung und würde hell zulassen

### Die Zeichen im Raster

Das wichtigste Designelement. Jede vergangene Zelle ist ein Punkt in der Farbe
der Gewohnheit – oder eben keiner.

| Zeichen | Zustand | Aussehen |
| --- | --- | --- |
| ● | **erledigt** – abgehakt bzw. Tageswert erfüllt das Ziel | gefüllter Kreis, 16 px, Gewohnheitsfarbe |
| ◌ | **Ruhetag** – nur bei x-mal pro Woche und laufender Serie, automatisch gedeckt | Ring 2 px, Gewohnheitsfarbe, innen leer |
| ⊗ | **Ruhetag, als nicht geschafft eingetragen** – gedeckt wie ◌ | Ring wie ◌, kleines graues Kreuz darin |
| × | **nicht geschafft** – verpasst und so eingetragen | kleines graues Kreuz (Text still) |
| ▢ | **nichts eingetragen** – verpasst, aber leer (vielleicht vergessen) | leerer Kasten 13 px, Rand Text still |
| 152 | **Menge** – der eingetragene Tageswert statt Punkt bzw. Kreuz | Zahl 11 px (vierstellig 9,5 px, enger), Gewohnheitsfarbe wenn erfüllt, sonst Text leise |
| (90) | **Menge am Ruhetag** – Ziel verfehlt, aber vom Kontingent gedeckt, die Serie hält (seit 07.10.2026) | Zahl in weiß in einem Ring 1,5 px in Gewohnheitsfarbe, wie ◌ |
| · | **noch nicht begonnen** – vor dem Beginn-Datum | winziger Punkt, 3 px |

**Drei Zustände beim Eintragen** (seit 06.10.2026): leer, geschafft, nicht
geschafft. Leer und „nicht geschafft“ **rechnen gleich** (verpasst bzw.
Ruhetag) – sonst wäre Vergessen besser als ehrliches Eintragen. Der
Unterschied ist nur zu sehen: ▢ zeigt, wo man vielleicht nur vergessen hat
einzutragen, × war wirklich nicht. Vor dem 06.10.2026 gab es nur leer, darum
stehen ältere verpasste Tage als ▢ da.

Die **Heute-Spalte** ist breiter (Kasten 50 × 36 px) und zeigt mehr:

| Zustand | Aussehen |
| --- | --- |
| offen (auch **heute fällig**: x-mal/Woche ohne übrige Ruhetage) | leerer Kasten, grauer Rand. Bis 08.10.2026 hatte „fällig“ einen Rand in der Gewohnheitsfarbe – zu leicht mit dem Ruhetag-Ring zu verwechseln |
| **heute frei** (nur x-mal/Woche, Ruhetag übrig, Serie läuft; seit 08.10.2026) | grauer Rand, Ring in Gewohnheitsfarbe im Kasten wie ◌ – bleibt der Tag leer, wird er ein Ruhetag. Bei Mengen steht die Einheit im Ring |
| erledigt (Abhaken) | Kasten gefüllt in Gewohnheitsfarbe, dunkler Haken |
| nicht geschafft | grauer Rand, graues Kreuz im Kasten (heute frei: Ring mit Kreuz wie ⊗) |
| Menge ohne Wert | leerer Kasten, Einheit in Text still („kcal“) |
| Menge unter Ziel | Wert in weiß, Fortschrittsbalken am unteren Rand in Gewohnheitsfarbe |
| Menge erfüllt | Kasten gefüllt in Gewohnheitsfarbe, Wert dunkel |
| Menge über „höchstens“ | Wert in Text still, grauer Rand – verfehlt |
| Menge am Ruhetag (nur zurückgeblättert) | Wert in weiß, Rand 2 px in Gewohnheitsfarbe – verfehlt, aber gedeckt |

### Hochformat – von Kontor übernommen

- [x] Viewport ohne Zoom, `viewport-fit=cover`, `overscroll-behavior: contain`,
      `touch-action: manipulation`, kein Text-Markieren (Eingabefelder
      ausgenommen)
- [x] Safe Area oben am `body`, unten in den Komponenten; `100dvh` statt
      `100vh` – auch an der äußeren Hülle (Kontors Streifen-Fehler)
- [x] Das Dokument scrollt nicht. Gescrollt wird nur im Raster-Körper (bei
      vielen Gewohnheiten) und in Unterseiten. Kopfzeile und Spaltenkopf stehen
- [x] Flex-Kinder mit `flex-shrink: 0`, sonst quetschen sich Zeilen
- [x] **Der Querwisch gehört der App:** `touch-action: pan-y` auf dem Raster,
      sonst blättert Safari eine Seite zurück statt eine Woche

---

## Die Regeln

Das Herz der App. Alles hier steckt in einer reinen Rechenschicht (`calc.ts`)
und ist vollständig getestet, bevor eine Ansicht darauf baut.

### Tag und Woche

- [x] Datumsschlüssel lokal als `YYYY-MM-DD`, nie UTC (sonst rutschen abends
      erfasste Tage in den Vortag – bei Kontor schon gelernt)
- [x] **Tageswechsel einstellbar, Standard 3:00 Uhr.** Der „logische Tag“ ist
      das Datum von *jetzt minus Tageswechsel*: um 1:30 Uhr ist noch gestern.
      Wer nach Mitternacht liest, hakt „Lesen“ für den richtigen Tag ab.
      Einstellbar von 0 bis 6 Uhr
- [x] **Woche = Kalenderwoche Montag bis Sonntag**, fest. Das Wochenziel
      beginnt jeden Montag bei 0

### Status eines Tages

Gespeichert ist pro Gewohnheit und Tag höchstens ein Wert: `1` (abgehakt),
`-1` (nicht geschafft, `NICHT_GESCHAFFT` in `types.ts`) oder eine Zahl
(Tageswert). Daraus ergibt sich:

- [x] **Nicht geschafft** (`-1`) ist kein Wert: rechnet überall wie kein
      Eintrag, zählt nie als erledigt – auch nicht bei „höchstens“
- [x] **Abhaken:** Wert vorhanden → erledigt
- [x] **Menge „mindestens X“:** Wert ≥ X → erledigt
- [x] **Menge „höchstens X“:** Wert vorhanden **und** ≤ X → erledigt. Kein Wert
      zählt **nicht** als erledigt – sonst wäre Nichts-Eintragen der
      einfachste Erfolg
- [x] **Heute ist nie verpasst.** Bis zum Tageswechsel bleibt der Tag offen,
      auch ein Mengenwert unter dem Ziel (der steht dann als Fortschritt da)
- [x] Ein vergangener Tag, der nicht erledigt ist, wird bei **täglich** zu ×,
      bei **x-mal pro Woche** zum Ruhetag oder zu × (siehe Kontingent)
- [x] Tage vor dem Beginn und archivierte Zeiträume sind **inaktiv** (·): sie
      zählen nirgends mit und brechen nichts

### Ruhetage-Kontingent (x-mal pro Woche)

Beispiel Gym 3× pro Woche → jede Woche hat **7 − 3 = 4 Ruhetage**.

- [x] Jeder vergangene Tag der Woche ohne Eintrag wird **der Reihe nach
      (Montag → Sonntag) zum Ruhetag** ◌, solange Ruhetage übrig sind
- [x] Ist das Kontingent aufgebraucht, wird **jeder weitere leere Tag ×** –
      die Serie bricht dort
- [x] **Ruhetage nur mit laufender Serie** (ergänzt am 27.09.2026): ein
      freier Tag wird nur zum Ruhetag, wenn der Tag davor zählt (● oder ◌).
      Ein Ruhetag setzt eine Serie fort, er kann keine beginnen. Läuft keine –
      nach einer verfehlten Woche, beim Start, nach dem Archiv –, ist der freie
      Tag ×. Er **verbraucht trotzdem seinen Platz im Kontingent**, sonst
      rettete ein einzelnes Training die Woche. **Warum:** ohne die Regel sah
      „Laufen 2× pro Woche“ auch ohne einen einzigen Lauf nach 5 von 7 aus
- [x] **Wochenziel erreicht** heißt: mindestens x Einträge. Tage ohne Serie
      vor dem ersten Training zählen dabei nicht gegen die Woche
- [x] **Heute verbraucht nichts**, solange heute läuft. Erst nach dem
      Tageswechsel wird entschieden
- [x] **Heute fällig:** sind keine Ruhetage mehr übrig, muss heute trainiert
      werden, damit die Serie hält. Die Heute-Zelle sieht aus wie bei einer
      täglichen Gewohnheit (kein Ring), und die Gewohnheit zählt im
      Tageszähler mit
- [x] **Heute frei** (seit 08.10.2026): ist noch ein Ruhetag übrig und läuft
      eine Serie, trägt die Heute-Zelle schon den Ring des Ruhetags – man sieht
      auch heute, was nicht sein muss. Ohne laufende Serie ist heute nicht frei
      (ein leerer Tag wäre verpasst), die Zelle bleibt grau
- [x] Mehr als x Einträge sind erlaubt. Übrige Ruhetage **verfallen am
      Sonntag**, kein Übertrag in die nächste Woche
- [x] **Nachtragen rechnet die Woche neu.** Wird ein × nachträglich erledigt,
      rutschen die Ruhetage nach – aus × kann ◌ werden, aus ◌ ●
- [x] **Erste Woche anteilig:** beginnt eine Gewohnheit mitten in der Woche,
      gilt für die restlichen `a` Tage das Ziel `round(x · a / 7)`.
      Gym ab Donnerstag: 4 Tage, Ziel 2, also 2 Ruhetage
- [x] Menge mit x-mal pro Woche geht genauso (z. B. „3× pro Woche mindestens
      5 km“): ein Tag zählt als Training, wenn der Wert das Ziel erfüllt

```
Gym 3× pro Woche – KW 36, schlechte Woche

  Mo  Di  Mi  Do  Fr  Sa  So
  ◌   ◌   ◌   ●   ◌   ●   ×
  R1  R2  R3      R4       ← 5. freier Tag, Kontingent leer → verpasst

Nachgetragen: Mittwoch war doch Training
  ◌   ◌   ●   ●   ◌   ●   ◌   ← 3 Trainings, 4 Ruhetage – Serie hält

Laufen 2× pro Woche – ohne laufende Serie

Nie gelaufen:
  ×   ×   ×   ×   ×   ×   ×   ← keine geschenkten Ruhetage, Quote 0 %

Nach einer verfehlten Woche, Mi + Sa gelaufen:
  ×   ×   ●   ◌   ◌   ●   ◌   ← Serie beginnt Mittwoch, Ziel erreicht

Nur Mi gelaufen:
  ×   ×   ●   ◌   ◌   ◌   ×   ← Mo + Di verbrauchen ihren Platz, So verpasst
```

### Serie

- [x] Zählt **Tage in Folge mit ● oder ◌**, rückwärts ab gestern. Ist heute
      schon erledigt, zählt heute mit. **Ein offenes Heute bricht nichts**
- [x] **Ruhetage zählen mit** – die Serie läuft an Ruhetagen weiter und wächst
      dabei, genau wie an Trainingstagen
- [x] Beginnt frühestens am Beginn-Datum der Gewohnheit
- [x] **Rekord** = längste Serie der ganzen Historie
- [x] Anzeige in der Zeile: Flamme + Zahl unter dem Namen; bei 0 nichts
      (bis 10.10.2026 eigene Spalte ganz rechts, bei 0 ein stilles „–“)

### Quoten und Tageszähler

- [x] **Erfolgsquote** einer Gewohnheit = (● + ◌) / aktive Tage im Zeitraum.
      Gezählt wird bis gestern, heute nur, wenn schon erledigt – ein offenes
      Heute drückt die Quote nicht
- [x] **Perfekter Tag** = alle an diesem Tag aktiven Gewohnheiten ● oder ◌
- [x] **Tageszähler** in der Kopfzeile („Noch 3 einzutragen“, seit
      08.10.2026): zählt, was heute noch einen Eintrag braucht – es geht um
      Vollständigkeit, nicht um einen perfekten Tag. **Jeder Eintrag zählt**,
      auch „nicht geschafft“ und eine Menge unter dem Ziel. Keinen Eintrag
      braucht, was heute frei ist (leer wird es ein Ruhetag). Alles drin:
      „Alles eingetragen“. Vorher „3 von 6 erledigt“, da zählte nur Erledigtes
- [x] **Heute in der Statistik** (Tagesquote, perfekter Tag) zählt weiter nur
      Erledigtes: tägliche Gewohnheiten immer, x-mal pro Woche nur, wenn heute
      fällig (keine Ruhetage mehr) oder heute schon erledigt

### Regeln ändern

- [x] **Rhythmus** (täglich ⇄ x-mal, oder x selbst) gilt **ab Montag der
      laufenden Woche** – ein Wochenziel ergibt nur für ganze Wochen Sinn
- [x] **Mengenziel** (Zahl oder mindestens/höchstens) gilt **ab heute** –
      sonst würde eine Zieländerung am Mittwoch Montag und Dienstag
      nachträglich zu × machen und die Serie brechen
- [x] Frühere Wochen und Tage behalten ihre alte Regel. Darum sind Rhythmus
      und Ziel am Datenmodell **Listen mit Gültigkeitsdatum**, nicht Felder
- [x] **Die Messart** (Abhaken ⇄ Menge) ist nach dem ersten Eintrag fest.
      Ein Haken lässt sich nicht in Gramm umrechnen – dann lieber archivieren
      und neu anlegen

---

## Datenmodell

```
Gewohnheit (habit)
{
  id: string,
  name: string,                  // Pflicht, max. 40 Zeichen
  color: string,                 // Palettenschlüssel: 'coral' | 'orange' | … | 'pink'
  kind: 'check' | 'amount',      // nach dem ersten Eintrag fest
  unit: string,                  // nur amount: 'g', 'kcal', 'min', 'Seiten' …; sonst ''
  rhythm: [                      // aufsteigend nach from, der jüngste gilt
    { from: 'YYYY-MM-DD',        // immer ein Montag (bzw. das Beginn-Datum)
      perWeek: number }          // 7 = täglich, 1–6 = x-mal pro Woche
  ],
  goal: [                        // nur amount, sonst []
    { from: 'YYYY-MM-DD',
      target: number,            // z. B. 150
      dir: 'min' | 'max' }
  ],
  start: 'YYYY-MM-DD',           // Beginn; darf in der Vergangenheit liegen
  inactive: [                    // archivierte Zeiträume
    { from: 'YYYY-MM-DD',
      to: 'YYYY-MM-DD' | null }  // null = gerade archiviert
  ],
  order: number,
  createdAt: string,
  updatedAt: string,
}

Einträge (log) – ein Objekt für alle Gewohnheiten
{
  [habitId]: {
    [date: 'YYYY-MM-DD']: number // 1 = abgehakt, -1 = nicht geschafft, sonst Tageswert
  }
}

Einstellungen (settings)
{
  dayStart: number               // Tageswechsel in Stunden, 0–6, Standard 3
}
```

- [x] Schlüssel: `steady:habits`, `steady:log`, `steady:settings`
- [x] **Archiviert** = letzter Eintrag in `inactive` hat `to: null`. Kein
      eigenes Feld, damit beides nie auseinanderläuft
- [x] **Wiederherstellen startet eine neue Serie.** Der archivierte Zeitraum
      ist inaktiv, aber „in Folge“ heißt in Folge – sonst wäre Archivieren
      eine Pause durch die Hintertür. Der Rekord bleibt
- [x] Mengen: höchstens eine Nachkommastelle (5,2 km), gespeichert als Zahl
- [x] **Speicherbedarf:** der Log enthält nur ASCII (Schlüssel, Datum, Zahl),
      also 1 Byte pro Zeichen, ~18 Zeichen pro Eintrag. 7 Gewohnheiten × 365
      Tage ≈ 46 KB pro Jahr. Emoji in einem Namen würden nur `steady:habits`
      verteuern, nicht den Log (siehe ROADMAP zu WebKits Byte-Zählung)
- [x] Das Launcher-Backup sichert `steady:*` automatisch mit (liest
      `localStorage`)

---

## Ansichten

Kein Tab-Balken. Die Unteransichten liegen auf einem Ansichtsstapel an der
Browser-History – die Zurück-Geste funktioniert, wie bei Kontor.

```
Hauptansicht – Wochenraster, letzte 7 Tage
├─ Menge eintragen              (Tipp auf eine Mengen-Zelle, Blatt)
├─ Gewohnheit – Detail          (Tipp auf den Namen)
│  └─ Gewohnheit bearbeiten     (Bearbeiten)
├─ Neue Gewohnheit              (+ oben rechts)
├─ Alle Apps                    (Raster oben links, zurück zum Launcher)
├─ Statistik                    (Balken oben links)
│  └─ Gewohnheit – Detail       (Tipp auf eine Zeile)
└─ Menü                         (⋯ oben rechts, Blatt)
   ├─ Archiv
   │  └─ Gewohnheit – Detail    (archiviert: Wiederherstellen, Löschen)
   ├─ Reihenfolge ändern
   ├─ Einstellungen
   │  └─ So zählt Steady
   └─ Alle Apps                 (zurück zum Launcher)

Erststart                       (solange es keine Gewohnheit gibt)
```

### 1 – Hauptansicht (Wochenraster)

**Kopfzeile**

- [x] Links: Alle Apps (Raster-Symbol) und Statistik (Balken-Symbol). Rechts:
      **+** (neue Gewohnheit) und **⋯** (Menü). Runde Knöpfe, 36 px, auf
      „Fläche“. Alle Apps steht seit 06.10.2026 direkt hier (ein Tipp, wie in
      Stash), vorher nur im Menü
- [x] Mitte: das Datum des jüngsten Tages im Fenster („Mittwoch,
      30. September“), darunter der Tageszähler „Noch 3 einzutragen“
- [x] Beim Zurückblättern steht dort der Bereich („17.–23. September“) und
      statt des Zählers ein Knopf **„Heute“**; auch ein Tipp auf den Titel
      springt zurück

**Spaltenkopf**

- [x] Sechs schmale Spalten (28 px) mit Wochentag und Tageszahl, rechts die
      breite Spalte (56 px) mit „Heute“ und der Tageszahl in weiß, fett
- [x] **Wochengrenze:** eine feine senkrechte Linie links vom Montag, durch
      Kopf und alle Zeilen. Links davon die alte Kalenderwoche, rechts die
      laufende – so sieht man, welche Ruhetage zu welchem Wochenziel gehören
- [x] Keine eigene Spalte für die Serie (seit 10.10.2026, vorher 34 px ganz
      rechts): sie steht unter dem Namen, der Platz geht an Name und Regel

**Zeilen**

- [x] Eine Zeile pro Gewohnheit, 56 px hoch, feine Trennlinie
- [x] **Name in der Gewohnheitsfarbe**, einzeilig, lange Namen enden auf „…“
      („Kein Handy im B…“). Darunter die Serie (Flamme + Zahl) und in Text
      still die Regel, wenn sie nicht „täglich abhaken“ ist: „3×/Wo.“,
      „≥ 150 g“, „≤ 2500 kcal“. **Ziel vor Rhythmus** („≥ 5 km · 3×/Wo.“):
      wird es eng, fällt hinten der Rhythmus ab, nicht das Ziel. Bis
      10.10.2026 stand „3× pro Woche“ vorn und verdrängte das Ziel
- [x] Sechs Punkte (●, ◌, ⊗, ×, ▢, ·) für die vergangenen Tage, bei Mengen
      stattdessen die eingetragene Zahl (ab 100 ohne Komma, ab 10 000 als
      „12k“). Verfehlt die Zahl das Ziel an einem Ruhetag, steht sie in einem
      Ring – sonst sähe sie aus wie ein verpasster Tag, obwohl die Serie hält
- [x] Heute-Kasten (Zustände siehe Design), bei Mengen mit dem heutigen Wert
- [x] Serie: kleine Flamme in Bernstein + Zahl, unter dem Namen vor der Regel
- [x] Reihenfolge manuell (Menü → Reihenfolge ändern), neue Gewohnheiten unten
- [x] Bei vielen Gewohnheiten scrollt nur der Zeilenbereich; Kopfzeile und
      Spaltenkopf bleiben stehen. Platz ist für ~12 Zeilen auf 844 px

**Tippen und Wischen**

- [x] **Abhaken:** jeder Tipp auf eine Zelle schaltet weiter: leer →
      geschafft → nicht geschafft → leer. Ein Tipp auf ◌ oder ▢ macht daraus ●
      (man war doch da). Vorher (bis 05.10.2026) nur erledigt ⇄ leer
- [x] **Menge:** Tipp auf eine Zelle öffnet das Ziffernfeld-Blatt für genau
      diesen Tag (Ansicht 2)
- [x] Tage vor dem Beginn (·) reagieren nicht; wer früher anfangen will,
      ändert das Beginn-Datum
- [x] **Nachtragen ist unbegrenzt.** Für Tage vor heute kommt eine Meldung
      „Gym · Di 22.9. eingetragen – Rückgängig“ (4 s). Für heute keine
      Meldung, dort ist die Rückmeldung der Punkt selbst
- [x] Tipp auf den **Namen** → Detailansicht
- [x] **Wischen nach rechts blättert 7 Tage zurück**, nach links wieder vor –
      nie über heute hinaus. Das Raster folgt gedämpft dem Finger und federt
      zurück, wenn die Strecke nicht reicht (wie Kontors Ring)
- [x] Die breite Spalte zeigt immer den jüngsten Tag des Fensters; beim
      Zurückblättern also z. B. „Mi 23“ mit dessen Werten

### 2 – Menge eintragen (Blatt)

- [x] Blatt von unten über dem Raster, nach unten wegwischbar
- [x] Kopf: Name in Farbe, darunter der Tag („Heute · Mittwoch,
      30. September“ bzw. das nachgetragene Datum)
- [x] Wert groß (Bricolage), Einheit daneben kleiner
- [x] Darunter das Ziel: „Ziel mindestens 150 g · noch 2 g“ bzw. „erreicht“,
      mit Fortschrittsbalken. Bei „höchstens“: „Ziel höchstens 2500 kcal ·
      noch 300 kcal Luft“
- [x] **Eigenes Ziffernfeld** (kein System-Keyboard, wie Kontor): 1–9, Komma,
      0, Löschtaste. Der **Wert ersetzt** den bisherigen Tageswert, er wird
      nicht addiert – eingetragen wird die Tagessumme
- [x] Vorbelegt mit dem bestehenden Wert des Tages, sonst leer
- [x] Knöpfe: **Leeren** (entfernt den Wert des Tages) und **Sichern** (in der
      Gewohnheitsfarbe)
- [x] Oben rechts neben dem Schließen-Knopf: **Nicht geschafft** – trägt den
      Tag ohne Zahl als nicht geschafft ein. Leise, weil meist eine Zahl kommt;
      ist der Tag schon so eingetragen, ist der Knopf hervorgehoben und unter
      der Zahl steht „Nicht geschafft · Ziel …“. Sichern ohne Tippen lässt es
      dabei
- [x] Validierung: nicht negativ, höchstens eine Nachkommastelle, max. 6
      Stellen

### 3 – Gewohnheit: Detail

Eine lange Seite, scrollt. Kopf: Zurück, Name in Farbe, **Bearbeiten**.

- [x] **Serie groß** in der Gewohnheitsfarbe („23 Tage in Folge“), rechts
      daneben der Rekord
- [x] Regelzeile: „3× pro Woche · seit 4. Mai 2026“
- [x] **Diese Woche** (nur x-mal pro Woche): Mo–So als Punkte, kommende Tage
      leer, dazu „1 von 3 · noch 3 Ruhetage“ (bzw. „Wochenziel erreicht“,
      „heute nötig“). Hier steht der Wochenstand, den das Raster bewusst
      weglässt
- [x] **Heute** (nur Menge): heutiger Wert mit Fortschrittsbalken und Knopf
      „Eintragen“ (öffnet Ansicht 2)
- [x] **Werteverlauf** (nur Menge): Balken der letzten 30 Tage, Ziellinie
      gestrichelt, erfüllte Tage voll gefärbt, verfehlte blass. Darunter
      Durchschnitt und bester Tag
- [x] **Erfolgsquote:** letzte 30 Tage und gesamt, darunter ein Balken pro
      Monat
- [ ] Im Kalender wischen (heute nur Pfeile)
- [x] **Kalender:** ein Monat, blätterbar mit Pfeilen. Abhaken:
      Kreise mit Tageszahl (● gefüllt, ◌ Ring, × still gefüllt, nichts
      eingetragen nur grau umrandet als Kasten). Menge: Kästchen mit dem
      Tageswert („×“ bei nicht geschafft, leer nur umrandet). **Tipp auf einen
      Tag trägt nach** – der Weg für alles, was älter ist als das Raster;
      beim Abhaken schaltet er weiter wie im Raster
- [x] **Jahresübersicht:** Heatmap seit Beginn (max. 53 Wochen), Spalte =
      Woche, Zeile = Wochentag. ● voll, ◌ blass, × grau
- [x] Archivierte Gewohnheit: gleiche Seite, oben ein Hinweis
      „Archiviert seit 30. Aug 2026“ mit **Wiederherstellen**, ganz unten
      **Endgültig löschen** (rot, zweistufig). Kein Nachtragen im Kalender
- [x] **Archiviert rechnet bis zum Archivtag**: Serie („bis zum Archiv“),
      30-Tage-Quote, Monatsbalken, Kalender und Heatmap enden dort. Sonst
      stünden „100 % in den letzten 30 Tagen“ und ein leerer Kalender da

### 4 – Neue Gewohnheit / Bearbeiten

Ganze Seite, Kopf: Abbrechen · Titel · **Sichern** (erst aktiv mit Namen).

- [x] **Name** groß als erstes Feld, Fokus beim Öffnen
- [x] **Farbe:** 10 Kreise in zwei Reihen. Vorgewählt ist die erste Farbe, die
      noch keine aktive Gewohnheit trägt
- [x] **Messart:** Segment Abhaken | Menge. Beim Bearbeiten nach dem ersten
      Eintrag gesperrt, mit Hinweis warum
- [x] **Ziel** (nur Menge): Segment mindestens | höchstens, dazu Zahl und
      Einheit (Freitext, Vorschläge: g, kcal, min, km, Seiten)
- [x] **Rhythmus:** Segment Täglich | Pro Woche. Bei Pro Woche ein Stepper
      1–6 („3× pro Woche“) und darunter „4 Ruhetage pro Woche. Sie zählen zur
      Serie, solange sie reichen.“
- [x] **Beginnt:** Datum, Standard heute. Ein früheres Datum erlaubt
      Nachtragen ab dort
- [x] **Vorschau:** die Rasterzeile, wie sie gleich aussehen wird
- [x] Beim Bearbeiten: Hinweis „Gilt ab dieser Woche (KW 40). Frühere Wochen
      behalten ihr Ziel.“ sobald Rhythmus oder Ziel geändert werden
- [x] Beim Bearbeiten ganz unten: **Archivieren** – „Verschwindet aus dem
      Raster, die Historie bleibt.“ Löschen gibt es nur im Archiv
- [x] Validierung: Name nicht leer und nicht doppelt unter den aktiven, Ziel
      > 0 (bei „höchstens“ ≥ 0)

### 5 – Statistik

Über alle Gewohnheiten. Scrollt.

- [x] Segment **Woche | Monat | Jahr**, darunter die Zeitraum-Zeile mit
      Pfeilen und Wischen (wie Kontor). Standard: Monat, zuletzt gewählte Art
      wird gemerkt
- [x] **Drei Kennzahlen:** Erfüllt (Gesamtquote), Perfekte Tage („8 von 29“,
      heute nur, wenn schon alles erledigt ist), **längste Serie im Zeitraum**
      (mit Name). Abweichung vom Entwurf („längste laufende Serie“): so ergibt
      die Zahl auch beim Zurückblättern in einen alten Monat Sinn
- [x] **Tagesquote:** ein Balken pro Tag (bei Jahr: pro Woche), Höhe = Anteil
      erfüllter Gewohnheiten. Perfekte Tage in Bernstein, heute umrandet,
      kommende Tage als Stummel
- [x] **Gewohnheiten:** Balkenliste nach Quote sortiert, in der jeweiligen
      Farbe, antippbar → Detail
- [x] **Wochentage:** Quote je Wochentag als sieben Balken, der schwächste
      hervorgehoben, darunter ein Satz: „Samstag ist dein schwächster Tag
      (68 %).“ Ab Zeitraum Monat
- [x] Archivierte Gewohnheiten zählen für die Zeit mit, in der sie liefen

### 6 – Menü (Blatt)

- [x] Archiv (mit Anzahl), Reihenfolge ändern, Einstellungen, Alle Apps
- [x] Blatt von unten, nach unten wegwischbar, Tipp daneben schließt

### 7 – Archiv

- [x] Liste der archivierten Gewohnheiten: Name in Farbe, Zeitraum
      („12. Mai – 30. Aug 2026“), Quote und Rekord
- [x] Tipp → Detail im archivierten Zustand (Wiederherstellen, Löschen)
- [x] Leerer Zustand: „Nichts archiviert.“

### 8 – Reihenfolge ändern

- [x] Liste aller aktiven Gewohnheiten mit Griff rechts, ziehen zum
      Umsortieren (Ionics `IonReorder`), **Fertig** oben rechts
- [x] Die gezogene Zeile hebt sich mit Schatten ab

### 9 – Einstellungen

- [x] **Tageswechsel** (0–6 Uhr, Standard 3:00) mit Erklärung „Bis 3:00 Uhr
      nachts gilt noch der Vortag.“ und dem Hinweis, dass Wochen immer
      montags beginnen
- [x] **Export als JSON** / **Import aus JSON** (ersetzt alles, prüft die
      Struktur, meldet eine kaputte Datei) – Format
      `{ app: 'steady', version: 1, habits, log, settings }`
- [x] **Alle Daten löschen** (rot, zweistufig)
- [x] **So zählt Steady** → Ansicht 10
- [x] Fußzeile: „Deine Daten liegen nur auf diesem Gerät.“

### 10 – So zählt Steady

Wie Kontors „Über Kontor“: wer die App in einem halben Jahr öffnet, soll die
Regeln in der App finden und nicht nur hier.

- [x] Legende aller Zeichen mit echtem Aussehen (●, ◌, ×, ·, Menge, Menge
      am Ruhetag, offener und freier Heute-Kasten)
- [x] Kurz erklärt: Ruhetage, Woche Mo–So, Serie, Tageswechsel, warum es
      keine Pausen gibt

### 11 – Erststart

- [x] Nur die Wortmarke, ein angedeutetes leeres Raster und **Erste
      Gewohnheit anlegen**. Keine Vorlagen, kein Erklärtext
- [x] Darunter still: „Aus Exportdatei wiederherstellen“
- [x] Nach dem Anlegen direkt die Hauptansicht

---

## Bewegung

Rückmeldung, kein Schmuck.

- [x] **Abhaken:** der Punkt wächst mit kurzem Federn (0,6 → 1,1 → 1)
- [ ] Rutschen durch das Nachtragen Ruhetage um, blenden die betroffenen
      Zellen weich über (heute springen sie um)
- [x] **Serie +1:** die Zahl tickt hoch
- [x] **Blättern:** Raster folgt dem Finger, fliegt von der richtigen Seite
      herein (von Kontor)
- [x] **Blätter** fahren von unten auf und lassen sich nach unten wegwischen
- [x] `prefers-reduced-motion` schaltet alles ab

## Querschnitt

- [x] Ionic-React-App wie Kontor: `apps/steady/src/main.tsx` mit `mountApp`,
      eigenes CSS statt Ionic-Listen-Look
- [x] Anlegen **nicht** über `npm run new` (das legt die Vorlage an), sondern
      Kontors Aufbau übernehmen. Eintrag in `apps.js`:
      `{ id: 'steady', name: 'Steady', icon: 'icons/steady.svg', color: '#F2785C', bg: '#0F1113', path: 'apps/steady/' }`
- [x] App-Symbol `icons/steady.svg`: der abgehakte Heute-Kasten, weiß auf
      Koralle, der Haken in der Kachelfarbe (Symbol-Stil „Signal“ siehe
      README). Vorher 3 × 3 Punkte (gefiel nicht), am 07.10.2026 kurz ein
      Zettel mit zwei Rasterzeilen (alle Apps sahen gleich aus), danach der
      Kasten mit Flamme als Umriss auf Graphit.
- [x] Zurück-Navigation an der Browser-History
- [x] **Entwürfe** wie Kontor: ein halb ausgefülltes Formular und die offene
      Ansicht überleben einen Neustart für drei Stunden
- [x] Datum und Zahlen über **eine** Hilfsschicht formatiert (`util.ts`)
- [x] **Tests für `calc.ts`**, mindestens:
  - Ruhetage der Reihe nach, × erst nach aufgebrauchtem Kontingent
  - keine Ruhetage ohne laufende Serie; ein einzelnes Training rettet die
    Woche nicht; die Serie trägt über den Sonntag
  - Nachtragen verschiebt Ruhetage (× → ◌)
  - heute offen bricht keine Serie, heute erledigt zählt mit
  - erste Woche anteilig (Beginn Do, So)
  - Tageswechsel 3:00 (1:30 Uhr = gestern)
  - „höchstens“ ohne Wert ist nicht erledigt
  - Rhythmuswechsel ab Montag, Zielwechsel ab heute
  - Archivieren und Wiederherstellen: neue Serie, Rekord bleibt
  - Serie über Monats- und Jahresgrenzen, Sommerzeitumstellung
- [x] Testdaten `testdaten/steady-beispiel.json` mit den sieben Gewohnheiten
      aus den Mockups, Mai bis September 2026, zwei archivierte

## Dateien

```
apps/steady/
├─ index.html              Seite im Launcher (lädt shell.js + src/main.tsx)
├─ konzept.md              dieses Dokument
├─ mockups.html            Mockups aller Ansichten (Stand Konzept)
├─ testdaten/
│  └─ steady-beispiel.json 7 Gewohnheiten + 2 archivierte, Jan–Sep 2026
└─ src/
   ├─ main.tsx             Start: Schriften, Ionic-Hülle
   ├─ Steady.tsx           Ansichtsstapel, logischer Tag, Meldungen, History
   ├─ Steady.css           Tokens und Klassen
   ├─ types.ts             Datenmodell und Ansichtstypen
   ├─ store.ts             Speicher, Regeln ändern, Archiv, Export/Import
   ├─ calc.ts              Tagesstatus, Ruhetage, Serie, Quoten
   ├─ util.ts              Datum, logischer Tag, Wochen, Zahlen, Ziffernfeld
   ├─ entwurf.ts           offene Ansicht und Formular überleben Neustarts
   ├─ data.ts              Farbpalette, Einheiten-Vorschläge
   ├─ ui.tsx               Seite, Blatt, Segment, Punkt, Heute-Kasten, Serie
   ├─ charts.tsx           Kalender, Heatmap, Werteverlauf, Quotenbalken
   ├─ icons.tsx            die paar Strich-Symbole der Oberfläche
   ├─ *.test.ts            calc, store, util
   └─ views/               Main, AmountSheet, Detail, HabitForm, Stats,
                           Sheets (Menü, Tageswechsel), Archive, Reorder,
                           Settings, Rules, Onboarding
```

Die Testdaten erzeugt ein kleines Skript mit festem Zufall; wer sie neu
braucht, sagt Bescheid. Ein Test (`npm test`) prüft, dass die Datei zum
Datenmodell passt.

---

## Entscheidungen

Beim Konzept offen, am 27.09.2026 so bestätigt und gebaut:

1. **Ruhetage lassen die Serie wachsen**, nicht nur weiterlaufen (Gym 3× pro
   Woche: eine volle Woche = +7)
2. **Heute bricht nie.** Verpasst wird ein Tag erst nach dem Tageswechsel
3. **Verpasst ist grau, nicht rot**
4. **„Höchstens“ ohne Wert gilt als nicht erledigt**
5. **Rhythmuswechsel ab Montag der laufenden Woche, Zielwechsel ab heute**
6. **Erste Woche anteilig** (gerundet)
7. **Wiederherstellen aus dem Archiv startet eine neue Serie**, der Rekord bleibt
8. **Tageszähler** zählt x-mal/Woche nur, wenn heute fällig oder erledigt
   (am 08.10.2026 abgelöst durch 16)
9. **Messart nach dem ersten Eintrag fest**
10. **Rückgängig-Meldung** nur für Tage vor heute
11. **Keine Gamification** – keine Punkte, Level, Abzeichen. Serie, Rekord und
    Quote sind die einzige Belohnung
12. **Mengen:** Tagessumme ersetzt, max. eine Nachkommastelle, Einheit Freitext

Ergänzt am 06.10.2026:

13. **Drei Zustände beim Eintragen** – leer, geschafft, nicht geschafft. Leer
    und nicht geschafft rechnen gleich, nur das Zeichen unterscheidet sie
14. **Mengen zeigen im Raster ihre Zahl**, nicht nur, ob das Ziel erreicht ist

Ergänzt am 07.10.2026:

15. **Menge am Ruhetag im Ring.** Eine Zahl unter dem Ziel sah an einem
    Ruhetag genauso aus wie an einem verpassten Tag. Jetzt trägt sie den Ring
    des Ruhetags (im breiten Kasten den Rand in der Farbe): verfehlt, aber die
    Serie hält

Ergänzt am 08.10.2026:

16. **Tageszähler fragt nach Einträgen, nicht nach Erfolg.** „Noch 3
    einzutragen“ statt „3 von 6 erledigt“; „nicht geschafft“ ist ein Eintrag.
    Steady soll beim Festhalten helfen und Muster zeigen, nicht jeden Tag
    perfekt machen
17. **Heute frei im Ring.** Was heute nicht sein muss (Ruhetag übrig, Serie
    läuft), trägt schon im Heute-Kasten den Ring wie ein vergangener Ruhetag
18. **Heute fällig ohne eigenes Zeichen.** Der farbige Rand für „fällig“ las
    sich wie der Ring des Ruhetags. Jetzt gilt: Ring = darf frei bleiben, kein
    Ring = heute machen. Mengen zeigen am freien Tag ihre Einheit im Ring,
    damit sie nicht wie ein Haken aussehen

Ergänzt am 10.10.2026:

19. **Serie unter dem Namen, Regel knapp.** Die Serien-Spalte rechts kostete
    34 px, und unter dem Namen verdrängte „3× pro Woche“ das Mengenziel. Jetzt
    steht die Serie klein vor der Regel, die Regel nennt erst das Ziel, dann
    „3×/Wo.“ – das Raster hat mehr Platz, und das Ziel bleibt lesbar

---

## Nicht im MVP

- [ ] Notiz pro Eintrag (z. B. „Beine, 100 kg Kniebeuge“)
- [ ] Startvorlagen beim Erststart
- [ ] Zähler (mehrmals am Tag antippen bis zum Ziel)
- [ ] Feste Wochentage (Mo, Mi, Fr) und „alle N Tage“
- [ ] Gruppen oder Tageszeiten (morgens / abends)
- [ ] Monats- oder Jahresziele („12 Bücher“)
- [ ] CSV-Export

## Explizit nicht

- Keine Pausen / kein Urlaubsmodus – Serie ist Serie
- Keine Erinnerungen per Push (bräuchte auf iOS einen Server), keine Widgets
  (für Web-Apps nicht möglich)
- Kein heller Modus
- Keine Symbole oder Emoji pro Gewohnheit
- Keine Tab-Navigationsleiste
- Kein Account, keine Cloud, kein Sync
- Keine Werbung, kein Tracking
