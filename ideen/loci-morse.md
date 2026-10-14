# Loci: Morse – Konzept (Entwurf)

Morsezeichen lernen, hören und geben. Loci bringt das Alphabet nach Gehör bei (nicht von einer Tabelle), übt
das Empfangen Zeichen für Zeichen und das Senden über eine Taste auf dem Bildschirm, mit dem eigenen Rhythmus
auf Karopapier.

Gedacht als **fünfter Reiter in Loci** („Morse“), nicht als eigene App: Es ist dieselbe Art Kopftraining wie
Wochentag, Karten, Konstanten und Rechnen, und Lokis Tab-Leiste verträgt laut `apps/loci/konzept.md` genau noch
einen fünften Reiter. Speicher unter `loci:morse`, Einstellungen in `loci:einstellungen`.

`[ ]` = offen, `[x]` = gebaut. **Stand: Entwurf (14.10.2026), noch nichts gebaut.** Erst entscheiden, ob es sich
neben den fertigen Apps lohnt (nächster Abschnitt), dann wie gewohnt Fragerunde („Offene Fragen“ ganz unten),
Mockups, bauen. Beim Bau wandert der Inhalt in `apps/loci/konzept.md`.

---

## Lohnt sich das? Was es schon gibt

Stand 14.10.2026, Angaben von den Seiten im US-App-Store (Preise in Dollar, im deutschen Store können sie
abweichen).

| App | Preis | Was sie kann | Grenzen |
|---|---|---|---|
| [Morse Mania: Learn Morse Code](https://apps.apple.com/app/id1511042196) | kostenlos, Käufe (Pro-Paket 8,99 $, Abo 0,99 $/Monat), keine Werbung | 135 Level Empfangen und 135 Level Senden, von E und T bis Q-Codes, Rufzeichen und Sätze; Ton, Blinklicht, Taschenlampe, Vibration; 7 Tastenarten; Farnsworth 5–45 WpM; offline. 4,9 Sterne aus 8.300 Bewertungen | nur Englisch; nennt Koch nicht, beginnt mit E und T; letzte Version vom 01.09.2025 |
| [Morse Master](https://apps.apple.com/us/app/morse-code-morse-master/id1664039661) | kostenlos, Pro 0,99 $/Monat, 2,99 $/Jahr oder 5,99 $ einmalig | Koch-Kurs nach Gehör, 60-Sekunden-Sprint, schwache Zeichen und Verwechslungspaare gezielt, Rauschen und Fading, Apple Watch, Dekoder übers Mikrofon, **auf Deutsch**. 4,6 Sterne aus rund 240, Update im Oktober 2026 | Senden laut Beschreibung „ein Punkt oder Strich pro Tipp“, ob es eine echte Handtaste gibt, ist unklar |
| [Morse Toad](https://apps.apple.com/app/id906586079) | 4,99 $ | schlichter Koch-Kurs, ein neues Zeichen, sobald die bisherigen sitzen; rund 4,5 Sterne | kleiner Nutzerkreis, wenig Bewertungen |
| [Morse-It](https://apps.apple.com/app/id284942940) | 0,99 $ + Käufe | eher Werkzeug: Handtaste, Iambic-Paddel A/B, Mikrofon-Dekoder; Koch-Trainer und Quiz als Zusatzkauf | Lernen ist Nebensache |
| [LCWO.net](https://lcwo.net) | kostenlos, Website (läuft in Safari) | der verbreitete Koch-Kurs unter Funkamateuren, mit Statistik | Website mit Konto, keine App |
| [morsecode.world](https://morsecode.world/international/trainer/character.html) | kostenlos, Website | Trainer für Zeichen, Wörter und Sätze, wahlweise in Koch- oder LCWO-Reihenfolge; Ton, Licht oder Vibration; Farnsworth und Wordsworth | Website, ohne Kursführung |

**Einschätzung.** In der Breite holt Loci diese Apps nicht ein. Rauschen, Funkverkehr-Simulation, Paddel,
Apple Watch und hunderte Level sind dort fertig und ausgereift. Morse Mania ist kostenlos, werbefrei und sehr
gut bewertet. Morse Master hat den Koch-Kurs und spricht Deutsch.

Ein Loci-Reiter lohnt sich nur, wenn er klein bleibt und etwas anderes will: **die Zeichen sicher nach Gehör
kennen, als Kopftraining wie π oder das Kartendeck**, nicht Funkbetrieb. Was Loci dann bietet: keine weitere
App und kein Abo, die Daten im selben Backup, gemessen wie alle Loci-Übungen (Reaktionszeit je Zeichen,
Schwächen) und der eigene Senderhythmus auf dem Karo der Tafel.

**Vorschlag:** Erst ein, zwei Wochen Morse Mania oder Morse Master ausprobieren. Fehlt dort nichts, braucht
Loci keinen Morse-Reiter. Stört etwas (Englisch, Abo, eine App mehr, das Ziel ist Kopftraining und nicht
Funken), dann den kleinen Reiter wie unten bauen.

---

## Wie man Morsen lernt (Grundlagen für den Bau)

- **Nach Gehör, nicht nach Tabelle.** Wer Punkte und Striche abzählt, bleibt erfahrungsgemäß bei etwa 10 Wörtern
  pro Minute hängen. Jedes Zeichen soll als Klangbild sitzen: „dah-di-dah“ ist K, ohne Umweg über „Strich Punkt Strich“.
- **Koch-Methode:** von Anfang an im vollen Zeichentempo, mit nur zwei Zeichen beginnen und ein neues dazunehmen,
  sobald etwa 90 % richtig erkannt werden. Die übliche Reihenfolge stellt Zeichen mit deutlich verschiedenem
  Klang an den Anfang:
  `K M U R E S N A P T L W I . J Z F O Y V G 5 Q 9 2 H 3 8 B ? 4 7 C 1 D 6 0 X`
  (LCWO nimmt noch `=`, `,` und `/` dazwischen auf. Vor dem Bau gegen lcwo.net prüfen.)
- **Farnsworth:** Die Zeichen kommen im vollen Tempo, nur die Pausen dazwischen sind gestreckt. So bleibt Zeit
  zum Erkennen, ohne dass das Klangbild langsam und anders klingt. Mit der Übung werden die Pausen kürzer.
- **Zeiten:** Punkt 1 Einheit, Strich 3, Pause im Zeichen 1, zwischen Zeichen 3, zwischen Wörtern 7. Das Tempo
  in Wörtern pro Minute (WpM) zählt mit dem Normwort PARIS (50 Einheiten): **eine Einheit = 1200 / WpM ms**,
  bei 20 WpM also 60 ms pro Punkt.
- **Farnsworth gerechnet:** Von den 50 Einheiten von PARIS bleiben die 31 in den Zeichen im Zeichentempo `c`,
  die 19 Pausen-Einheiten (4 × 3 zwischen den Zeichen, 7 nach dem Wort) werden gestreckt, bis das Gesamttempo
  `g` stimmt: Pausen-Einheit = (60 / g − 31 × 1,2 / c) / 19 Sekunden. Bei g = c kommt wieder 1,2 / c heraus.

## Prinzipien (Loci-Prinzipien, auf Morse übertragen)

- **Hören, nicht zählen.** Während einer Aufgabe zeigt Loci keine Punkte und Striche, nur den Ton.
- **Üben ist der Einstieg.** Den Reiter öffnen, und das erste Zeichen klingt.
- **Ein Daumen reicht.** Zeichentastatur und Sendetaste liegen unten.
- **Gemessen wird immer:** Reaktionszeit vom Ende des Tons bis zur Antwort. Sie zeigt, welche Zeichen schon
  „sofort“ kommen und welche man noch abzählt.
- **Lernen aus der Lösung** (wie der Rechenweg): Nach der Antwort steht das Zeichen da, sein Rhythmus auf Karo,
  und bei einer Verwechslung hört man beide nacheinander.
- **Karo ist Zeit.** Auf der Tafel ist ein Kästchen eine Einheit: ein Punkt füllt eins, ein Strich drei, die
  Pausen bleiben leer. Das passt nur zu Loci und macht den Takt sichtbar, ohne zum Abzählen einzuladen (es kommt
  erst nach der Antwort).
- Nichts Persönliches (Code ist öffentlich, siehe Loci-Konzept). Morse ist allgemein, hier gibt es nichts zu
  verbergen.

## Regeln

### Empfangen

- [ ] **Kurs nach Koch:** Lektion 1 = K und M, jede weitere Lektion ein Zeichen mehr, Reihenfolge wie oben.
  Buchstaben, Ziffern und die zwei Satzzeichen der Reihenfolge, zusammen 38 Zeichen in 37 Lektionen.
- [ ] **Aufgabe:** ein Zeichen aus den gelernten, nie zweimal dasselbe hintereinander. Das neueste und die
  schwachen kommen öfter (Schwächen wie beim Wochentag).
- [ ] **Antwort** über die Zeichentastatur: QWERTZ mit Ziffern darüber, noch nicht gelernte Zeichen blass und
  ohne Funktion. So lernt die Hand von Anfang an, wo die Zeichen liegen.
- [ ] **Richtig:** kurz grün, nach einer halben Sekunde klingt das nächste. Der Takt hält, wie beim Mithören.
- [ ] **Falsch:** „Gehört V, getippt U“, beide Rhythmen auf Karo untereinander, und beide klingen nacheinander.
  Weiter per Tipp.
- [ ] **Nochmal** spielt das Zeichen erneut. Danach zählt die Antwort nicht als richtig (wie ein Tipp beim
  Wochentag).
- [ ] **Nächste Lektion,** sobald die letzten 50 Antworten zu 90 % richtig waren (ohne Nochmal). Das neue
  Zeichen wird vorgestellt: groß, dreimal gespielt, dann ist es in der Mischung, anfangs öfter.
- [ ] **Später (offene Frage):** Gruppen zu fünf Zeichen und kurze Wörter: erst ganz anhören, dann eintippen.

### Senden

- [ ] **Vorgabe:** ein Zeichen aus den gelernten, später ein kurzes Wort.
- [ ] **Taste:** eine große Fläche als Handtaste. Drücken ist Ton (Mithörton), Loslassen ist Stille, kurz ein
  Punkt, lang ein Strich.
- [ ] **Erkennen:** Die Grenze zwischen Punkt und Strich liegt bei 2 Einheiten des **eigenen** Tempos, geschätzt
  aus den eigenen Punkten. Man muss also nicht genau 20 WpM geben. Eine Pause ab 3 Einheiten schließt das
  Zeichen, ab 7 das Wort.
- [ ] **Danach:** was erkannt wurde, darunter der eigene Rhythmus auf Karo über dem idealen, das eigene Tempo in
  WpM und wie gleichmäßig es war (Strich zu Punkt, Soll 3 : 1).
- [ ] Richtig erkannt und gleichmäßig genug gilt als geschafft, sonst noch einmal (Grenze für „gleichmäßig“
  beim Bau ausprobieren).
- [ ] **Bewertet werden die Tippzeiten, nicht der Ton.** Bluetooth-Kopfhörer verzögern den Mithörton spürbar.
  Bei Morse Mania beklagt eine Rezension Timing-Probleme beim Geben, und der Entwickler nennt die Verzögerung
  über Bluetooth als Ursache.
- [ ] Senden ist ein **Vollbild** ohne Tab-Leiste, wie Aufsagen. Die Taste hält Abstand zum unteren Rand, denn
  dort gehört das Wischen iOS. Kein Zurückwischen vom Rand, solange die Taste aktiv ist.

### Ton

- [ ] Sinus mit **600 Hz** (einstellbar 500–800), weiche Flanken von etwa 5 ms, sonst klickt jeder Punkt.
- [ ] **Zeitgenau:** Alle Punkte und Striche werden im Voraus auf der Uhr des Audio-Kontexts geplant
  (`AudioContext.currentTime`), nicht per `setTimeout`. Bei 60 ms pro Punkt fiele sonst jedes Ruckeln auf.
- [ ] **Erst nach einem Tipp:** Safari spielt Ton erst nach einer Berührung. Der erste Tipp im Reiter weckt den
  Ton, so wie `tonBereit()` in Form (`apps/form/src/geraet.ts`).
- [ ] **Stummschalter:** Web Audio ist auf dem iPhone stumm, wenn es auf lautlos steht. WebKit kennt dafür
  `navigator.audioSession.type = 'playback'`, dann klingt es trotzdem. Vermutlich hält das aber Musik aus
  anderen Apps an. Am Gerät prüfen. Geht es nicht, steht ein Hinweis da („Kein Ton? Stummschalter prüfen“).
- [ ] **Tempo-Blatt:** Zeichentempo (Vorschlag 20 WpM, 15–30), Gesamttempo (Vorschlag 10 WpM, bis zum
  Zeichentempo), Tonhöhe. Dazu „Uhr anzeigen“ wie in den anderen Blättern (gilt für alle Übungen).

### Statistik (unter der Übung, wie bei Wochentag und Rechnen)

- [ ] Kurs: Lektion, gelernte Zeichen, wie weit es bis zum nächsten ist („43 von 50 richtig, ab 45 kommt R“).
- [ ] Je Zeichen Trefferquote und typische Reaktionszeit, die langsamsten zuerst.
- [ ] Häufigste Verwechslungen als Paare („U ↔ V · 6 ×“).
- [ ] Senden: Tempo und Gleichmäßigkeit der letzten Versuche.
- [ ] Statistik zurücksetzen (mit Rückfrage). Die Lektion bleibt, außer man setzt den Kurs eigens zurück.

## Datenmodell

```
loci:einstellungen   … morse: { teil: 'empfangen' | 'senden', lektion, zeichenTempo, gesamtTempo, ton }
loci:morse           { gesamt: { [zeichen]: { n, richtig, zeitRichtig } },
                       verwechselt: { 'U>V': n },
                       letzte: MAntwort[],        die letzten 200
                       senden: SVersuch[] }       die letzten 100
```

- `MAntwort`: `{ z: gehört, a: getippt, r: richtig, ms: Reaktionszeit, n: Nochmal gedrückt }`.
- `SVersuch`: `{ soll, erkannt, wpm, verhaeltnis, ende (ms) }`.
- `reiter` in den Einstellungen bekommt den Wert `morse`. Ältere Einstellungen ohne `morse` bekommen den
  Standard (Lektion 1).
- Freischaltung und Schwächen werden aus `letzte` gerechnet, nicht gespeichert.
- Gelesenes wird geprüft (`normalisiere*` in `store.ts`) wie überall in Loci. Das Launcher-Backup erfasst
  `loci:*` schon.
- Größe unkritisch: 200 Antworten mit wenigen Feldern sind unter 10 KB.

## Navigation und Ansichten

- [ ] **Fünfter Reiter „Morse“** ganz rechts. Danach ist die Tab-Leiste voll, ein sechster bräuchte eine
  Skill-Auswahl (Loci-Konzept, Entscheidung 15).
- [ ] Kopf wie in den anderen Reitern: ‹ Apps, Tempo als Pille („20 / 10 WpM“, öffnet das Tempo-Blatt), „?“.
- [ ] Darunter ein Umschalter **Empfangen · Senden** (wie der Modus bei den Konstanten), bleibt gespeichert.

### 1 – Empfangen

- [ ] Karte: „Lektion 7 · 8 Zeichen“, Uhr, ein großer Lautsprecher-Knopf (Nochmal), die Zeichentastatur unten.
- [ ] Unter der Karte „Diese Runde“, beim Scrollen die Statistik.

### 2 – Lösung

- [ ] Zeichen groß, Urteil, Reaktionszeit, Rhythmus auf Karo. Bei einer Verwechslung beide Zeichen mit Rhythmus
  und je einem Knopf zum Anhören. Weiter.

### 3 – Neues Zeichen

- [ ] „Neu in Lektion 8: R“, das Zeichen groß, es klingt dreimal, der Rhythmus auf Karo. Los geht's.

### 4 – Senden (Vollbild)

- [ ] ✕, die Vorgabe groß, darunter das Karo, auf dem der eigene Rhythmus beim Geben mitläuft, unten die Taste.
- [ ] Danach Ergebnis wie oben, Nochmal oder Nächstes.

### 5 – Tempo (Blatt)

- [ ] Zeichentempo, Gesamttempo, Tonhöhe mit Hörprobe, Uhr anzeigen.

### 6 – Anleitung Morse (Blatt)

- [ ] Warum nach Gehör, wie der Kurs aufgebaut ist, die Zeiten (1 · 3 · 1 · 3 · 7) auf Karo, PARIS und
  Farnsworth in zwei Sätzen.
- [ ] Ganz unten die Tabelle aller Zeichen, ausdrücklich zum Nachschlagen, nicht zum Lernen.
- [ ] **Ausprobieren:** Text eintippen und als Morse hören (wie das Datumsfeld in der Wochentag-Anleitung).

## Design

- Lokis Tafel bleibt: Karo, Tintenblau, IBM Plex Mono. Neu ist nur, dass das Karo hier eine Bedeutung hat (ein
  Kästchen = eine Einheit).
- Rhythmus als gefüllte Kästchen in Tintenblau. Der eigene beim Senden in Tinte, der ideale blass darunter,
  Abweichungen ohne Rot (Rot heißt in Loci „falsch“, ungleichmäßig ist nicht falsch).
- Symbol im Reiter: „·–“ in Mono oder drei Kästchen mit Lücke, passend zu den anderen Reiter-Symbolen.
- Die Sendetaste sieht aus wie eine Taste der Kartentastatur, nur groß, und gibt beim Drücken nach.

## Technik

- `morse.ts`: Zeichentabelle (ITU), Zeiten, Farnsworth, Planen einer Tonfolge, Dekoder für Tippzeiten,
  Schätzen des Tempos. Alles ohne Oberfläche, darum gut testbar.
- `ton.ts`: Audio-Kontext, Wecken nach dem ersten Tipp, Audio-Session, Mithörton beim Senden. Form hat ähnlichen
  Code in `geraet.ts`. Braucht es beide, könnte er nach `lib/` wandern (beim Bau entscheiden).
- Tippzeiten über Pointer-Events (`pointerdown` / `pointerup` mit `event.timeStamp`), nicht über Klicks.
- **Tests:** Tabelle gegen ITU, eine Einheit = 1200 / WpM, PARIS = 50 Einheiten und mit Farnsworth genau das
  Gesamttempo, Dekoder mit erzeugten Tippfolgen samt Streuung (± 25 %) und anderem Tempo ergibt die richtigen
  Zeichen, Freischaltung nach 90 % der letzten 50, Gewichtung der Aufgaben, Lesen kaputter Daten.

## Nicht im MVP

- Rauschen, Störungen, Fading, mehrere Sender zugleich
- Funkverkehr: QSO-Simulation, Rufzeichen, Q-Codes, Abkürzungen, Betriebszeichen (AR, SK, BT)
- Paddel und Keyer (Iambic A/B), externe Tasten
- Licht und Vibration als Ausgabe (Safari auf dem iPhone kann nicht vibrieren, siehe Form)
- Umlaute und CH (Ä, Ö, Ü, CH), weitere Satzzeichen
- Apple Watch, Dekoder übers Mikrofon, Tempo-Wettbewerbe

## Offene Fragen (für die Fragerunde)

1. **Überhaupt bauen?** Erst eine der Apps oben ausprobieren (Empfehlung), oder gleich bauen?
2. **Ziel:** die Zeichen sicher kennen, als Kopftraining (Empfehlung, hält den Reiter klein), oder Richtung
   Funkbetrieb (dann eher eine der fertigen Apps)?
3. **Ort:** fünfter Reiter in Loci (Empfehlung) oder eigene App?
4. **Reihenfolge:** Koch wie LCWO (Empfehlung) oder klassisch mit E und T zuerst?
5. **Punkte und Striche zeigen:** nie, erst nach der Antwort als Rhythmus auf Karo (Empfehlung) oder immer?
6. **Senden:** eine Taste wie eine Handtaste (Empfehlung) oder zwei Knöpfe für Punkt und Strich?
7. **Wörter und Gruppen** schon im ersten Schritt oder erst danach (Empfehlung: danach)?
8. **Tempo-Standard:** 20 WpM Zeichentempo und 10 WpM gesamt (Vorschlag)?
9. **Ton trotz Stummschalter**, auch wenn dafür Musik anderer Apps pausiert (am Gerät prüfen)?
