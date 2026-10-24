# Form – Konzept

Fortschritt in Zahlen, in zwei Bereichen: **Werte** – Körperwerte wie Gewicht, Bizeps oder Taille von
Hand eintragen und sehen, wohin es geht – und **Training** – Übungen, Sätze, Gewicht und Wdh, schnell
genug für zwischen zwei Sätzen im Studio (siehe „Training“ unten).

Projekt-ID `form`, Ordner `apps/form/`, Speicher unter `form:*`. Gebaut in TypeScript + Ionic wie
Kontor, Steady, Piano, Loci und Stash.

`[ ]` = offen, `[x]` = gebaut. **Stand: Werte gebaut (08.10.2026), Training gebaut (10.10.2026),
Tab-Leiste für ganz Form und dritte Runde im Training (11.10.2026).**
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
- **Eine Tab-Leiste für ganz Form** (seit 11.10.2026, wie Strong mit „Measure“): **Training · Kalender ·
  Statistik · Übungen · Werte**. Darunter Seiten mit Zurückwischen wie Kontor, Piano und Stash. Der
  Umschalter Werte/Training in der Kopfleiste ist damit weg. Form öffnet beim laufenden Training, sonst
  bei den Werten oder beim Training – je nachdem, wo man zuletzt war (`form:bereich`).
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
- [x] **Trend** (seit 14.10.2026): Wird ein Wert oft genug gemessen (mindestens 8 Messungen in den 4 Wochen
  bis zur jüngsten, also etwa zweimal pro Woche), gibt es zu jedem Messtag den Schnitt der Messungen aus den
  7 Tagen bis dahin – das glättet Tagesschwankungen wie beim Körpergewicht. Dazu das **Tempo pro Woche**
  (Ausgleichsgerade durch die Messungen der letzten 4 Wochen, in die gewünschte Richtung orange) und mit Ziel,
  wann es bei diesem Tempo **etwa erreicht** ist („Mitte Dezember“). Keine Prognose, wenn der Trend das Ziel
  schon erreicht hat, das Tempo davon wegführt oder es über zwei Jahre dauern würde. Seltener gemessene Werte
  bleiben, wie sie sind.

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
- [x] Mit Trend (siehe Regeln): darüber „Trend · Schnitt 7 Tage“ groß, rechts „pro Woche“ und „Ziel etwa“;
  im Verlauf ist der Trend die kräftige Linie, die Messungen stehen leiser dahinter.
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
in der Runde (inzwischen teils überholt, siehe Prinzipien): Umschalter statt Tab-Leiste, während eines
Trainings sind die Werte schwer zu erreichen,
erst `localStorage` (IndexedDB später), grau steht das letzte Mal aus derselben Vorlage, die Pause wird
aus dem letzten Haken berechnet, alles dichter als die Werte bisher. Körpergewicht bleibt ein normaler
Wert.

### Prinzipien

- **Unten eine Tab-Leiste** (seit 11.10.2026, vorher Zeilen „Verlauf“, „Übungen“, „Vorlagen“ auf der
  Startseite): **Training** (Startseite, hier startet man – läuft eins, liegt es darüber),
  **Kalender**, **Statistik**, **Übungen**, **Werte**. Im Seitenfluss unter der Bühne wie bei Piano, aktiv
  in Kreide statt Orange. Ein Tipp auf den aktiven Tab führt zu seiner Startseite zurück. Sie steht auch
  unter „Ein Training“, „Eine Übung“, „Ein Wert“ und der Liste der Vorlagen, aber **nicht** über
  Formularen (Vorlage, Übung, Wert, Messen, Nachtragen), dem Bearbeiten eines Trainings und „Fertig“ –
  dort würde ein Tipp die Eingabe verwerfen.
- **Das laufende Training liegt über der Startseite des Tabs „Training“** (seit 25.10.2026; vom
  11.10.2026 an war es selbst die Startseite des Tabs, Woche und Vorlagen waren dann nicht zu erreichen,
  davor gehörte ihm der ganze Bildschirm ohne Tab-Leiste). Oben links „‹ Form“ (oder Wischen) führt zur
  Startseite, dort „‹ Apps“ zum Launcher; das Menü ⋯ steht rechts neben „Beenden“. Sein Tab hat einen
  orangen Punkt und öffnet es von anderen Tabs aus direkt, ein zweiter Tipp zeigt die Startseite. Steht
  man nicht im Training, zeigt eine Leiste über den Tabs Name, Dauer, Sätze und die Pause (wie der
  Mini-Player bei Strong und Hevy); ein Tipp führt zurück. Ein zweites Training startet nicht, solange
  eins läuft („Push läuft noch“ mit „Zum Training“). Ton am Pausenende und „Bildschirm bleibt an“ gelten
  auf jedem Tab.
- **Grau steht das letzte Mal.** Ein Haken übernimmt es – wer dasselbe schafft wie letztes Mal, tippt
  nur Haken. Kein eigenes „Zuletzt“-Feld.
- **Die Pause wird berechnet, nicht gezählt.** Jeder Haken speichert seine Uhrzeit, die Pause ist jetzt
  minus letzter Haken. App zu, Handy gesperrt – beim Öffnen stimmt sie trotzdem. Angezeigt wird sie
  (seit 11.10.2026) als Countdown, danach orange „Los +0:12“.
- **Gespeichert wird nur, was du einträgst:** Zahlen und die Uhrzeit des Hakens. Rekorde, Volumen,
  Dauer, Fortschritt werden berechnet (`trainingCalc.ts`).
- **Orange heißt Fortschritt** – mehr als letztes Mal, Rekorde, „Pause um“. Weniger steht weiß da.
- **Ein Tipp startet.** Vorlagen ohne Vorschau, die Übungen weiß man.

### Regeln

Übungen:

- [x] Name (40 Zeichen), Erfassung **Gewicht × Wdh**, **nur Wdh** oder **Zeit** (Sekunden), seit
  25.10.2026 auch **Strecke + Zeit** (Laufband, Rad, Rudern), **Gewicht × Zeit** (Plank mit Gewicht,
  Halten) und **Gewicht × Strecke** (Farmer's Walk, Schlitten), Pause (0:15–10:00 in 15-s-Schritten,
  Standard 2:00), Notiz. Welche Zahlen eine Erfassung braucht, steht an einer Stelle (`FELDER` in
  `trainingCalc.ts`); im Satz stehen sie nebeneinander, „82,5 × 8“, „5 km in 26:30“, „10 kg × 45 s“,
  „24 kg × 40 m“. Strecken werden in Metern gespeichert und unter 1 km in m, darüber in km gezeigt.
- [x] **Notiz als Zettel** (seit 25.10.2026, vorher eine kleine graue Zeile, nur unter „Übung bearbeiten“
  zu ändern): ein paar Zeilen (200 Zeichen), etwa wie das Gerät eingestellt wird. Steht im Training immer
  unter dem Namen als Zettel (getöntes Papier mit Eselsohr, Text in Kreide) und ebenso auf „Eine Übung“.
  Ein Tipp auf den Zettel ändert sie gleich dort, ohne Notiz geht das über „Notiz“ im Blatt der Übung.
  Sie gehört zur Übung, nicht zum Training, und gilt sofort für jedes Mal.
- [x] Mit Gewicht: **Gewichtsschritt** (1 / 1,25 / 2 / 2,5 / 5 kg, Standard 2,5) für ± im
  Tastenfeld und bei Gewicht × Wdh den Vorschlag, dort auf Wunsch auch **Langhantel** (Stange 10 / 15 /
  20 kg) für den Scheibenrechner.
- [x] Den **Wdh-Bereich** der Vorlage gibt es nur bei Erfassungen mit Wdh.
- [x] Kein Startkatalog: Übungen entstehen beim Hinzufügen über die Suche („‚Facepull‘ anlegen“, mit
  Gewicht × Wdh) oder unter Übungen.
- [x] Die Erfassung lässt sich nur ändern, solange die Übung nie trainiert wurde. Trainierte werden
  archiviert statt gelöscht (Verlauf bleibt, taucht beim Hinzufügen nicht mehr auf), nie trainierte
  lassen sich löschen – auch aus den Vorlagen.

Vorlagen:

- [x] Name und Übungen, pro Übung Satzzahl (1–20), Aufwärmsätze (0–5, im Chip „1A + 3 × 8–12“) und
  Wdh-Bereich (optional, steht im Training neben dem Namen). Reihenfolge auf der Startseite und in der Vorlage per Griff.
- [x] Neu unter Vorlagen (Zeile auf der Startseite, beim ersten Start „Vorlage anlegen“) oder aus einem
  beendeten Training: gleich auf „Fertig“ (bei einem leeren Training) oder später unter „Ein Training“
  („Als Vorlage speichern“ – das Training gehört danach zur Vorlage und heißt wie sie).
- [x] Weicht ein Training von seiner Vorlage ab (Übung fehlt oder kam dazu, andere Satzzahl oder
  Reihenfolge), fragt „Fertig“: anpassen oder so lassen. Anpassen übernimmt Übungen, Reihenfolge und
  Satzzahl (Aufwärm- und Arbeitssätze), die Wdh-Bereiche bleiben.
- [x] **Als Nächstes:** Die Vorlage, die am längsten nicht dran war, steht auf der Startseite mit „als
  Nächstes“ statt „vor 5 Tagen“ – erst ab zwei trainierten Vorlagen, nie trainierte drängeln sich nicht
  vor.

Sätze:

- [x] **Grau:** der passende Satz aus dem letzten Training mit derselben Vorlage (gleiche Art und
  Stelle – der zweite Arbeitssatz zum zweiten). Gab es die Übung dort noch nie (oder ist es ein leeres
  Training): das letzte Mal überhaupt. Hat das letzte Mal weniger Sätze dieser Art, gilt der Satz davor
  in diesem Training.
- [x] **Nicht als Vorgabe** (seit 13.10.2026): Nach einem schwachen Tag (angeschlagen, müde) lässt sich
  eine Übung im Blatt der Übung als „Nicht als Vorgabe“ markieren, im Training oder später beim
  Bearbeiten. Beim nächsten Mal steht grau das Mal davor, und Vorschlag, Orange und der Vergleich in
  Prozent richten sich auch danach. Das Tastenfeld sagt dann „Vorgabe von Push (vor 9 Tagen)“ statt
  „Zuletzt bei Push“. Rekorde und Verlauf zählen das Mal weiter mit. Pro Übung statt pro Training, weil
  oft nur eine Übung schwach war. Bewusst nicht automatisch (etwa das stärkere der letzten zwei Male):
  absichtlich leichtere Tage würden sonst übergangen. Ist jedes Mal in der Vorlage ausgelassen, gilt das
  letzte Mal überhaupt, sonst steht nichts grau.
- [x] **Vorschlag (doppelte Progression):** Lagen beim letzten Mal alle Arbeitssätze am oberen Ende des
  Wdh-Bereichs, steht diesmal grau das Gewicht plus Gewichtsschritt, mit den Wdh vom unteren Ende. Im
  Kopf der Übung steht dann orange „+2,5 kg“.
- [x] **Aufwärmsätze:** „A“ statt Nummer, Zahlen leiser. Zählen nicht für Rekorde, Volumen, Satzzahl,
  Orange und Vorschlag, stehen immer vor den Arbeitssätzen. Ein Tipp auf die Satznummer: Aufwärmsatz an
  oder aus, Satz entfernen. „Aufwärmsatz hinzufügen“ im Blatt der Übung.
- [x] **Haken:** füllt leere Felder mit dem Grauen und speichert die Uhrzeit. Fehlt eine Zahl, geht das
  Tastenfeld auf. Ein zweiter Tipp nimmt den Haken wieder weg. Seit 11.10.2026 größer (32 px) und mit
  Rückmeldung: er springt auf, die Zahlen leuchten kurz, ein Haptik-Tick (Android über Vibration, iPhone
  ab iOS 18 über den Schalter-Trick – nur ein Zusatz, ohne ihn bleibt die Animation).
- [x] **Der nächste Satz** (der erste offene in der Reihenfolge der Übungen) hat einen orangen Ring am
  Haken. Liegt er nach einem Haken unter dem Rand, scrollt die Seite ihn ins Bild – nie nach oben.
- [x] **Rekord beim Abhaken:** orange Meldung oben („Neuer Rekord · Schulterdrücken 55 × 9“), der Satz
  leuchtet orange auf, doppelter Tick.
- [x] **Übung fertig** (alle Sätze abgehakt): Haken vor dem Namen und daneben der Vergleich mit dem
  letzten Mal – Volumen, bei nur Wdh die Summe der Wdh, bei Zeit die Summe der Sekunden, bei Strecke +
  Zeit die Summe der Strecke (gleich weit: wie viel schneller), mit Gewicht kg × Sekunden bzw. kg × Meter
  („+6 %“, mehr in Orange; wie Strongs „Focus Metric“).
- [x] **Tastenfeld** statt iOS-Tastatur: der erste Tastendruck ersetzt, ± Gewichtsschritt / ±1 Wdh /
  ±5 s (bei Strecke + Zeit ±1 min) / ±100 m bzw. ±10 m, jeder Tastendruck wird sofort gesichert.
  **Zeiten tippt man wie an der Mikrowelle** (seit 25.10.2026, vorher in Sekunden): die letzten zwei
  Ziffern sind Sekunden, davor Minuten und Stunden – „2830“ ist 28:30, im Feld steht es gleich so da.
  Strecken bei Strecke + Zeit in km mit Komma, bei Gewicht × Strecke in m. Darunter „Zuletzt bei Push: 30 × 9“ und bei Langhantel
  die Scheiben pro Seite („Je Seite 25 · 5 · 1,25“, aus 25 bis 1,25 kg).
- [x] **Orange** am abgehakten Satz: mehr Gewicht als der gleiche Satz vom letzten Mal, oder mehr Wdh
  (Zeit, Strecke) bei mindestens gleichem Gewicht. Bei Strecke + Zeit weiter, oder für mindestens
  dieselbe Strecke weniger Zeit.
- [x] **Rekord** („PR“ statt Satznummer): schwerster Satz oder bestes geschätztes 1RM (Epley) bisher,
  über alle Vorlagen – bei nur Wdh die meisten, bei Zeit die längste, bei Strecke + Zeit die weiteste
  Strecke oder das schnellste Tempo, mit Gewicht der schwerste Satz oder die längste Zeit bzw. weiteste
  Strecke. Zählt auch gegen frühere Sätze im
  selben Training. Im ersten Training einer Übung gibt es keinen.
- [x] Fertige Übungen bleiben offen (in den Mockups noch zugeklappt, nach dem ersten Ausprobieren
  geändert).

Pause, Beenden, Nachtragen:

- [x] Oben in der Kopfleiste die Pause als **Countdown** (noch 0:49), der Strich füllt sich bis zur Pause
  der Übung des letzten Hakens; danach orange „Los“ und wie weit sie drüber ist (+0:12), einmal kurz
  aufleuchtend. Vor dem ersten Haken die Trainingsdauer.
- [x] **Pausen-Blatt** (Tipp auf die Pause, wie Strong und Hevy): die Zeit groß, **−15 s**,
  **Überspringen**, **+15 s**. Das gilt nur für die Pause nach diesem einen Haken (`form:pause` merkt sich
  die Uhrzeit des Hakens, mit dem nächsten Haken ist es vergessen); die Pause der Übung bleibt.
- [x] **Live-Zahlen** unter der Kopfleiste: Dauer, Volumen (wächst mit jedem Haken) und Sätze (2/15),
  darunter ein oranger Strich, wie viel geschafft ist.
- [x] Im Menü zwei Schalter: **Ton am Pausenende** (zwei kurze Töne beim Übergang, nicht beim späteren
  Öffnen) und **Bildschirm bleibt an** (Wake Lock, nur wo das Gerät es kann; seit 11.10.2026 ohne
  Eintrag eingeschaltet). Beides wirkt nur bei offener App – eine Mitteilung im Hintergrund geht als
  Web-App nicht. Die Werte sind ein Tab, „Werte ansehen“ im Menü ist weg.
- [x] **Notiz** pro Training (300 Zeichen): im Menü, beim Bearbeiten, steht in „Ein Training“.
- [x] Ein leeres Training öffnet gleich die Auswahl der Übungen.
- [x] Beenden mit offenen Sätzen: verwerfen oder abhaken (mit dem Grauen). Ohne abgehakten Satz:
  verwerfen. Übungen ohne Satz fallen weg.
- [x] Liegt der letzte Haken über eine Stunde zurück (vergessen zu beenden), endet das Training beim
  letzten Haken statt jetzt.
- [x] „Fertig“ vergleicht das Volumen mit dem letzten Training derselben Vorlage („+2 % zum letzten
  Mal“, mehr in Orange).
- [x] **„Fertig“ feiert** (seit 11.10.2026, nach Hevy): „26. Training · geschafft“, drei Kacheln (Dauer,
  Volumen mit Vergleich, Sätze mit Zahl der Rekorde), „Heute bewegt: mehr als ein Elefant“ (Klavier
  250 kg bis Blauwal 150 t), **Meilensteine** (10., 25., 50. … Training; 10, 25, 50, 100 … t bewegt
  insgesamt), „Wochenziel erreicht“ genau mit dem Training, das es erreicht, die Woche, die Rekorde.
  Konfetti in Kreide und Orange (mehr bei Rekord, Meilenstein oder Ziel; aus bei „Bewegung
  reduzieren“). Links neben „Fertig“ **Teilen**: das Training als Text (Kopfzeile, jede Übung mit ihren
  Sätzen, Rekorde) übers Teilen-Blatt, sonst in die Zwischenablage.
- [x] Beliebig viele Trainings am Tag. Nachtragen: Tag (nicht in die Zukunft), Vorlage, Beginn, Dauer –
  danach dieselbe Ansicht wie im Training, ohne Pause, erst „Sichern“ schreibt.
- [x] Ein beendetes Training lässt sich unter „Bearbeiten“ umbenennen (Name oben, leer heißt
  „Training“), Beginn und Dauer ändern, Sätze und Notiz ändern oder es löschen.

Woche und Ziel:

- [x] **Wochenziel** (seit 11.10.2026): aus oder 1–7 Trainings pro Woche (`form:einstellungen`).
- [x] Auf der Startseite des Trainings oben **die laufende Woche**: Mo–So als Punkte (Trainingstage in
  Kreide, heute umrandet), rechts die Zahl – mit Ziel „2/3“, erreicht in Orange samt Punkten –, darüber
  die Serie („9 Wochen in Folge“, ab zwei). Ein Tipp öffnet das Wochenziel. Dieselbe Karte steht auf
  „Fertig“.

Rückblick:

- [x] **Kalender** (Tab, seit 11.10.2026, ersetzt mit der Statistik den Verlauf): ein Monat als Blatt ab
  Montag, Trainingstage in Kreide, Tage mit Rekord mit orangem Punkt, heute umrandet. Blättern vom ersten
  Monat mit Training bis heute. Darunter die Trainings des Monats, neueste oben; ein Tipp auf einen Tag
  zeigt nur dessen Trainings (mit Uhrzeit), an einem Tag ohne Training „Training nachtragen“ für genau
  diesen Tag. „+“ trägt für den gewählten Tag nach, sonst für gestern. Monat und Tag bleiben stehen, wenn
  man ein Training öffnet und zurückkommt (am selben Tag).
- [x] **Statistik** (Tab): oben pro Woche als Balken – **Trainings, Volumen oder Dauer** (seit
  11.10.2026, wie Hevy) –, 12 Wochen, die laufende in Kreide, dazu „Diese Woche“ und der Schnitt der Wochen
  davor. Bei den Trainings mit Wochenziel als gestrichelter oranger Linie, Wochen, die es erreicht
  haben, in Orange. Drei Kacheln: Trainings insgesamt (und im laufenden
  Jahr), **Serie** (Wochen in Folge mit Training – die laufende zählt, sobald darin trainiert wurde, und
  bricht sie vorher nicht; ab zwei Wochen orange), Dauer im Schnitt. Die **letzten Rekorde** (fünf, pro
  Training und Übung der letzte) und die **häufigsten Übungen** (in den meisten Trainings, fünf) – ein
  Tipp öffnet die Übung. Ganz unten **Export als CSV** (Semikolon, Komma, mit BOM für Excel) über das
  Teilen-Blatt bzw. als Download.
- [x] **Eine Übung:** Bestwerte je Wdh-Zahl – schwerstes Gewicht für mindestens 1, 3, 5, 8, 10, 12 Wdh,
  was ein höherer Eintrag schon abdeckt, fällt weg. Zeiten ab einer Minute als „1:30“.
- [x] **Gewicht je Wdh** (seit 14.10.2026, unter den Bestwerten, nur bei Gewicht × Wdh): welches Gewicht
  für 1, 3, 5, 8, 10 und 12 Wdh passt – das geschätzte 1RM (Epley) rückwärts gerechnet, abgerundet auf den
  Gewichtsschritt der Übung. Grundlage ist der beste 1RM-Satz des letzten Trainings, das als Vorgabe zählt
  (ein Mal „Nicht als Vorgabe“ wird übersprungen); darunter steht, aus welchem Satz und von wann.

### Speicher

```
form:uebungen   [{ id, name, erfassung, pause, notiz, schritt, stange, archiviert, erstellt }]
                notiz mit Zeilenumbrüchen, höchstens 200 Zeichen
form:vorlagen   [{ id, name, rang, uebungen: [{ uebung, saetze, aufwaermen, von, bis }] }]
form:trainings  [{ id, vorlage, name, start, ende, notiz,
                   uebungen: [{ uebung, keineVorgabe?, saetze: [{ kg, wdh, sek, m, fertig, aufwaermen }] }] }]
                sek in Sekunden, m in Metern (Strecke)
                keineVorgabe nur gespeichert, wenn an (true)
form:laufend    das laufende Training (gleiche Form, ende null) – nach jedem Tipp gesichert
form:bereich    'werte' | 'training' – wo Form zuletzt war (Tab Werte oder Training beim Öffnen)
form:einstellungen  { ton, wach, wochenziel } – die Schalter im Menü des Trainings, Ziel pro Woche
form:pause      { haken, sek } – die Pause nach diesem Haken von Hand geändert (±15 s, Überspringen)
```

Gelesenes wird geprüft (`normalisiere*` in `trainingStore.ts`, getestet). Die Rechnungen stehen in
`trainingCalc.ts` (getestet). Grob 4.000 Sätze im Jahr, ein paar hundert KB – passt vorerst in
`localStorage`.

### Ansichten

Nummern wie in den Mockups.

- [x] **1 Werte:** wie bisher, neu der Umschalter in der Kopfleiste.
- [x] **2 Training** (Tab „Training“): „Zuletzt trainiert vor 2 Tagen“, Wortmarke, die Woche mit Ziel,
  Vorlagen (Name, darunter ihre Übungen in einer Zeile, wann zuletzt, oranger Start; die, die dran ist,
  mit Rand), „Leeres Training“. „+“ oben rechts legt eine Vorlage an, „Bearbeiten“ neben der Überschrift
  führt zur Liste der Vorlagen.
- [x] **3 Erster Start:** solange es weder Training noch Vorlage gibt – „Erstes Training?“, ein Knopf
  und darunter „Vorlage anlegen“.
- [x] **4 Training läuft:** ‹ Form, Pause, ⋯ (Menü), Beenden, darunter die Live-Zahlen. Pro Übung Name,
  Vorschlag (fertig: Vergleich), Wdh-Bereich, ⋯, Notiz als Zettel, Sätze `Nr | kg × Wdh | Haken`, „+ Satz“. Unten
  „+ Übung“ und die Notiz des Trainings. Darunter die Tab-Leiste.
- [x] **5 Satz eingeben:** Blatt mit beiden Feldern, Schnellknöpfen, Ziffern und „Abhaken“.
- [x] **6 Übung hinzufügen:** ganze Seite, Suche, „Zuletzt“ (bis 5, nicht schon dabei), „Alle“.
  Mehrere auf einmal; beim Tauschen genügt ein Tipp.
- [x] **7 Übung im Training:** die letzten drei Male und der Rekord bisher (ohne das Training zu
  verlassen), Pause und Notiz der Übung, „Nicht als Vorgabe“ (Schalter, seit 13.10.2026; im Training steht es dann
  leise unter dem Namen, ebenso in „Ein Training“ und bei den letzten Malen), Aufwärmsatz hinzufügen,
  Verlauf ansehen, tauschen (Satzzahl bleibt), verschieben, herausnehmen. Neu daneben: **Satz-Blatt** über
  die Satznummer (Aufwärmsatz, Satz entfernen).
- [x] **8 Menü im Training:** Beginn (mit Dauer) ändern, Notiz, Ton am Pausenende, Bildschirm bleibt an,
  Training verwerfen.
- [x] **9 Fertig:** Dauer, Sätze, Volumen und Vergleich zum letzten Mal, Rekorde, Vorlage anpassen bzw.
  als Vorlage speichern.
- [x] **10 Kalender und Statistik** (Tabs, seit 11.10.2026; vorher eine Seite „Verlauf“ mit
  Wochenbalken und allen Trainings nach Monaten): siehe „Rückblick“ oben.
- [x] **11 Ein Training:** alle Sätze kompakt, Rekorde orange, unten „Als Vorlage speichern“.
  „Bearbeiten“: Name, Sätze, „Training löschen“.
- [x] **12 Nachtragen.**
- [x] **13 Übungen** (Tab): alphabetisch mit Suche, Archivierte ausklappbar ganz unten.
- [x] **14 Eine Übung:** stärkster Satz des letzten Trainings, Kacheln (seit Start, seit letztem –
  seit 25.10.2026 in der Kennzahl des Verlaufs –, Rekord), Verlauf (Gewicht, 1RM oder Volumen; bei
  Strecke + Zeit Strecke oder Tempo in km/h; mit Gewicht Gewicht oder Zeit bzw. Strecke; 3 M / 1 J /
  Alles) – darüber die Zahl selbst (seit
  11.10.2026): die jüngste oder die eines angetippten Trainings (Finger über den Verlauf ziehen geht
  auch, ein zweiter Tipp hebt die Auswahl auf), beim 1RM mit dem Satz, aus dem es geschätzt ist
  („98,7 kg – geschätzt aus 80 × 7“, eine Nachkommastelle), sonst mit den Sätzen des Trainings; rechts das
  Beste im Zeitraum und die Veränderung seit seinem Anfang, Bestwerte je Wdh-Zahl, Gewicht je Wdh (seit
  14.10.2026), jedes Training mit allen Sätzen.
- [x] **15 Übung bearbeiten.**
- [x] **16 Vorlage bearbeiten** und die Liste der Vorlagen (sortieren, neu).

### Noch nicht gebaut

Nach dem Abgleich mit gängigen Trackern (Strong, Hevy) am 10.10.2026 nachgezogen: Aufwärmsätze, einzelne
Sätze entfernen, Vorschlag fürs nächste Gewicht, Gewichtsschritt, Scheibenrechner, Ton und Bildschirm an,
Notiz pro Training, Beginn und Dauer ändern, vergessenes Training, Vergleich auf „Fertig“, Wochenbalken,
Bestwerte, CSV-Export, „als Nächstes“.

Dritte Runde nach einer Recherche zu Strong, Hevy, Fitbod, Boostcamp und StrongLifts (11.10.2026): eine
Tab-Leiste für ganz Form, das laufende Training über den Tabs, Pause als Countdown mit ±15 s und
Überspringen, Live-Zahlen, der nächste Satz, Rückmeldung und Rekord beim Haken, Vergleich pro Übung,
die letzten Male im Blatt der Übung, Wochenziel, „Fertig“ mit Nummer, Meilensteinen, Konfetti und
Teilen, Statistik nach Volumen und Dauer, Verlauf einer Übung nach Volumen.

Bewusst weggelassen, weil es die Oberfläche voller macht als nötig: Drop-Sätze und Satz bis zum Versagen,
RPE/RIR, Supersätze, Muskelgruppen und Statistik je Muskel, Aufwärmrechner, Wischen zum Löschen eines
Satzes (geht über die Satznummer). Als Web-App nicht möglich: Live-Activity bzw. Dynamic Island und eine
Mitteilung am Pausenende bei gesperrtem Handy. Offen (ROADMAP): Verbindung
zu Steady, Körpergewicht in Körpergewichtsübungen. Der Monatskalender kam am 11.10.2026 mit der
Tab-Leiste.
