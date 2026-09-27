# Kontor – Konzept

Finanztracker fuer k-deploy. Jede Einnahme und jede Ausgabe wird **von Hand**
erfasst – genau das ist der Punkt: keine Bankanbindung, kein automatischer
Import, kein Kontozugriff. Wer jeden Kaffee selbst eintippt, weiss am
Monatsende, wo das Geld geblieben ist.

Projekt-ID `kontor`, erreichbar unter `/k-deploy/kontor`.

`[ ]` = offen, `[x]` = gebaut. **Stand: das MVP laeuft** – Erfassen, Uebersicht,
Statistik, Konten, Kategorien, Einstellungen. Was fehlt, steht unten unter
„Nicht im MVP".

---

## Prinzipien

- **Eine Buchung = Betrag, Typ, Kategorie, Konto, Datum, Notiz.** Nicht mehr.
  Wenn das Erfassen laenger als 10 Sekunden dauert, macht man es nicht durch.
- **Eine Hauptansicht.** Alles Wichtige passiert auf einem Bildschirm: Donut,
  Saldo, Erfassen. **Keine Tab-Navigationsleiste.** Konten, Statistik,
  Kategorien und Einstellungen liegen dahinter, erreichbar ueber Kopfzeile
  und Menue.
- **Kein Dark Mode.** Die App ist durchgehend hell.
- **Eigene Designsprache**, ausdruecklich nicht die Tokens oder das Layout von
  Setlist.
- Lokal im Browser (`localStorage`), kein Account, kein Server, offline nutzbar.
- Betraege werden als **ganze Cent (Integer)** gespeichert, nie als Float.
  12,30 € ist `1230`. Float-Addition erzeugt sonst Cent-Differenzen in den
  Summen.

---

## Design

Hell, freundlich, wenig Linien. Die Zahl ist das groesste Element auf jedem
Bildschirm. Farbe traegt Bedeutung: Einnahme gruen, Ausgabe koralle, jede
Kategorie ihre eigene Farbe.

```
Grund      #FAF8F4   warmes Off-White, kein reines Weiss
Flaeche    #FFFFFF   Karten, Bloecke
Linie      #ECE7DF   Trenner, Rahmen
Text       #1F1D1A   Ink
Text leise #8A8377
Einnahme   #2E9E6B
Ausgabe    #E2685F
Neutral    #4A6FA5   Umbuchung, Korrektur
```

- **Schrift:** Schibsted Grotesk fuer alles, Instrument Serif (kursiv) nur
  fuer die Wortmarke
- **Keine Tabellenziffern.** In Schibsted Grotesk bekommen Punkt und Komma
  Ziffernbreite; in grossen Betraegen sieht das aus wie ein Leerzeichen
  („1 . 448 , 35"). Zum Ausrichten in Spalten genuegt rechtsbuendiger Satz
- Grosse Radien (Karten 20 px, Buttons rund), weiche Schatten statt Rahmen
- Betraege gemischt gesetzt: Euro gross, Cent kleiner
- Kategorien als **Icon + Farbe**, nie als Farbfleck allein. Eigenes
  Strich-Icon-Set (`icons.jsx`), kein Emoji – Emoji sehen auf jedem System
  anders aus und lassen sich nicht umfaerben
- Mobil zuerst im **Hochformat**, auf dem Desktop zentriert bei max. 460 px

> Der CSS-Reset fuer `button` laeuft ueber `:where()`. Ohne das ist
> `.kontor button` spezifischer als `.k-chip` und schluckt Flaeche und Rahmen
> jeder Chip-, Kategorie- und Zifferntaste.

### Hochformat: warum nichts scrollen soll

Uebernommen aus dem piano-practice-tracker, dort laeuft dasselbe Muster:

- [x] Viewport ohne Zoom: `maximum-scale=1, user-scalable=no, viewport-fit=cover`
- [x] `overscroll-behavior: contain`, `touch-action: manipulation`, kein
      Text-Markieren und kein Kontextmenue auf langes Tippen (Eingabefelder
      ausgenommen)
- [x] Safe Area: **oben am `body`, unten in den Komponenten.** Waere der
      `body` auch unten gepolstert, endete die App-Flaeche ueber der
      Gestenleiste – unter Blaettern und Knoepfen bliebe ein heller Streifen.
      Stattdessen reicht die Flaeche bis an den Geraeterand, und
      `.k-actions`, `.k-pad-wrap`, `.k-body` und das Blatt legen den Abstand
      zur Gestenleiste in ihr eigenes `padding-bottom`
- [x] **Das Dokument scrollt in Kontor gar nicht.** `html` und `body` werden
      fuer die Laufzeit des Projekts gesperrt (`overflow: hidden`,
      `position: fixed`) und beim Verlassen zurueckgegeben – Setlist bleibt
      unberuehrt. Gescrollt wird ausschliesslich in den Bereichen, die es
      sollen: der Inhalt einer Unterseite und das Kategorienraster im
      Erfassen-Formular, beide mit `overscroll-behavior: contain`
- [x] **Flex-Kinder duerfen nicht schrumpfen.** `.k-body` ist ein
      Flex-Container; ohne `flex-shrink: 0` an den Kindern quetschen sich
      Karten zusammen, statt ueberzulaufen – die Seite scrollt dann nie und
      sieht kaputt aus. Genau dieser Fehler ist einmal passiert
- [x] **`100dvh`, nicht `100vh`.** `100vh` ist auf dem Handy die Hoehe ohne
      eingeklappte Browserleiste – damit ragt der untere Rand darunter und die
      Seite scrollt, obwohl alles passt. Zusaetzlich werden die
      Safe-Area-Abstaende herausgerechnet, weil der `body` sie schon traegt
  - [x] **Auch die Huelle `.kontor`, nicht nur die Ansichten darin.** Sie hing
        lange auf `min-height: 100vh` und war damit doppelt zu hoch: einmal um
        die Browserleiste, einmal um die Statusleiste, die der `body` schon
        als Abstand traegt. Weil die Huelle den Hintergrund zeichnet, stand
        unter den Knoepfen auf iOS ein leerer Streifen – auf dem Rechner nicht,
        dort sind `vh` und `dvh` gleich und die Abstaende null
- [x] **Die Hauptansicht passt komplett auf den Schirm** (geprueft von 320×568
      bis 412×915) und scrollt nicht
- [x] **Formulare mit Ziffernfeld**: Betrag oben und Tasten unten stehen fest,
      nur der Mittelteil scrollt. Sonst liegt das Ziffernfeld auf einem 667 px
      hohen Schirm 127 px unter dem Rand und man tippt eine Zahl, die man
      nicht sieht

---

## Datenmodell

```
Buchung (entry)
{
  id: string,
  type: 'expense' | 'income' | 'transfer' | 'adjustment',
  amountCent: number,          // positiv; das Vorzeichen steckt im Typ.
                               // Ausnahme 'adjustment': traegt sein Vorzeichen
                               // selbst, eine Korrektur geht in beide Richtungen
  date: string,                // 'YYYY-MM-DD', lokal, keine Uhrzeit
  categoryId: string | null,   // bei transfer/adjustment: null
  accountId: string,           // Quelle bei expense/transfer, Ziel bei income
  toAccountId: string | null,  // nur bei transfer: Zielkonto
  note: string,
  createdAt: string,
  updatedAt: string,
}

Kategorie (category)
{
  id, name,
  kind: 'expense' | 'income',  // Kategorien sind nach Typ getrennt
  icon: string,                // Icon-Key aus dem eigenen Set
  color: string,               // faerbt Donut, Liste und Chips
  budgetCent: number | null,   // optionales Monatsbudget (nur expense)
  archived: boolean, order: number,
}

Konto (account)
{
  id, name,                    // kein Typ: was ein Konto ist, sagt sein Name
  balanceCent: number,         // GESPEICHERTER Saldo, siehe unten
  includeInTotal: boolean,     // zaehlt zur Gesamtbalance?
  color: string, archived: boolean, order: number,
}
```

### Saldo: gespeichert, nicht gerechnet

Der Kontosaldo liegt als `balanceCent` **am Konto** und wird bei jeder Buchung
mitgeschrieben. Er wird nicht bei jeder Anzeige aus der Historie neu summiert.

- [x] Buchung anlegen / aendern / loeschen schreibt den Saldo der betroffenen
      Konten fort (bei Umbuchung beide, bei Kontowechsel beide Seiten)
- [x] **Manuelle Saldokorrektur**: im Kontodetail den Saldo direkt auf einen
      Wert setzen. Die Differenz wird als Buchung vom Typ `adjustment`
      protokolliert, damit man spaeter sieht, dass und wann korrigiert wurde
- [x] `adjustment` zaehlt in **keiner** Einnahmen-/Ausgaben-Statistik mit –
      es ist eine Korrektur, kein Geldfluss
- [x] Darum ist Loeschen der Historie unkritisch: alte Buchungen aufraeumen
      veraendert den Saldo nicht

**Warum so:** der Saldo bleibt unabhaengig von der Buchungshistorie
bearbeitbar, und ein Tippfehler von vor zwei Jahren zwingt nicht dazu, die
Historie zu verbiegen, nur damit der heutige Stand stimmt.

- [x] **Der Anfangssaldo eines neuen Kontos ist selbst eine Buchung**
      („Anfangssaldo", Typ `adjustment`), kein stiller Startwert am Konto.
      Nur so sind gespeicherter Saldo und Summe der Buchungen von Anfang an
      deckungsgleich – sonst wuerde die Abweichungswarnung immer anschlagen
- [x] Kontodetail warnt, wenn gespeicherter Saldo und Summe der Buchungen
      auseinanderlaufen (z. B. nach einem Import), mit Knopf „Aus Buchungen
      neu berechnen". Informativ, nie automatisch

### Gesamtbalance und ausgeschlossene Konten

- [x] Pro Konto ein Schalter **„Zur Gesamtbalance zaehlen"**
- [x] Die Gesamtbalance summiert nur Konten mit `includeInTotal: true`
- [x] Ausgeschlossene Konten bleiben voll benutzbar und stehen in der
      Kontenliste unter einer eigenen Ueberschrift

**Umbuchung ueber die Grenze.** Geld auf ein ausgeschlossenes Konto verlaesst
die gezaehlte Welt. Fuer die Statistik wirkt das wie eine Ausgabe, ist aber
keine:

| Umbuchung | Wirkung auf die Statistik |
| --- | --- |
| gezaehlt → gezaehlt | neutral, taucht nirgends auf |
| gezaehlt → **ausgeschlossen** | wirkt als **Ausgabe** |
| **ausgeschlossen** → gezaehlt | wirkt als **Einnahme** |
| ausgeschlossen → ausgeschlossen | neutral |

- [x] Solche Umbuchungen bekommen im Donut ein eigenes, neutrales Segment
      **„Umbuchung"** – nie eine echte Ausgabenkategorie
- [x] In der Liste behalten sie Umbuchungs-Icon und neutrale Farbe
- [x] Das Erfassen-Formular warnt vorab, sobald die Umbuchung die Grenze
      ueberschreitet
- [x] Schalter in den Einstellungen: **„Umbuchungen ueber die Grenze zaehlen"**.
      **Standard: aus** – Umbuchungen sind dann immer neutral

**Warum aus als Standard.** Der Anlass ist das Investieren: Geld aufs Depot ist
keine Ausgabe, soll aber auch nicht mehr in der verfuegbaren Balance stehen.
Ein ausgeschlossenes Depot-Konto plus neutrale Umbuchung liefert genau das –
die Balance sinkt, in der Statistik taucht nichts auf, und das Geld bleibt in
der Kontenliste sichtbar. Waere der Schalter an, waere „Investieren" jeden
Monat die groesste Ausgabe im Donut. Wer die andere Sicht will (alles, was die
gezaehlte Welt verlaesst, ist Ausgabe), schaltet ihn an.

> Darum gibt es **keine Kategorie „Investieren"**: Depot als Konto anlegen,
> Schalter „Zur Gesamtbalance zaehlen" aus, und per Umbuchung fuettern.

---

## Ansichten

Kein Tab-Balken. Die Unteransichten liegen auf einem Ansichtsstapel, der an der
Browser-History haengt – die Zurueck-Taste des Handys funktioniert damit.

```
Hauptansicht
├─ Zeitraum waehlen            (Tippen auf die Zeitraum-Zeile)
├─ Ausgabe erfassen            (grosser Knopf −)
├─ Einnahme erfassen           (grosser Knopf +)
├─ Umbuchung                   (Menue ⇄)
├─ Buchungen im Zeitraum       (Tippen auf die Saldoleiste)
│  └─ Buchung bearbeiten
├─ Kategorie-Detail            (Tippen auf ein Donut-Segment)
└─ Menue                       (Zeitraum-Zeile ⋮)
   ├─ Konten
   │  └─ Kontodetail ─ Konto bearbeiten / Saldo korrigieren
   ├─ Statistik
   ├─ Kategorien
   │  └─ Kategorie bearbeiten
   └─ Einstellungen
```

### 1 – Hauptansicht

- [x] **Keine Kopfzeile.** Die Wortmarke stand auf jedem Start dieselbe halbe
      Zeile lang da und kostete die Hoehe, die der Ring braucht; sie steht
      weiter im Erststart und in den Einstellungen. Das Menue haengt am rechten
      Rand der Zeitraum-Zeile, aus dem Fluss genommen, damit der Zeitraum in
      der Mitte des Schirms bleibt. Die Umbuchung sitzt im Menue
- [x] Zeitraum-Zeile mit Pfeilen; Wischen blaettert einen Zeitraum vor/zurueck
  - [x] Der Ring folgt dabei **gedaempft dem Finger** und federt zurueck, wenn
        die Strecke nicht reicht. Ohne das passiert beim Wischen sichtbar
        nichts, bis es ploetzlich umspringt
  - [x] Nach dem Wechsel fliegt der neue Zeitraum von der Seite herein, aus
        der er kommt
- [x] **Der Querwisch gehoert der App, nicht dem Browser.** Ohne
      `touch-action: pan-y` auf dem Ring und `overscroll-behavior: contain`
      deutet Chrome und Safari einen Wisch nach rechts als Zurueck-Navigation:
      die Seite verliert bei jedem Zurueckblaettern einen History-Eintrag und
      faellt irgendwann ganz aus der App heraus
- [x] **Von unten hochwischen oeffnet das Menue.** Der Startpunkt muss
      deutlich ueber dem unteren Rand liegen – dort gehoert die Geste dem
      System, iOS verlaesst damit die App – und die Strecke lang genug sein,
      damit es nicht versehentlich aufgeht
- [x] Umschalter Ausgaben ⇄ Einnahmen fuer den Donut
- [x] **Donut** des Zeitraums nach Kategorie
  - [x] Kategorie-Icons aussen am Ring mit Prozentwert
  - [x] In der Mitte **Einnahmen gruen** und **Ausgaben koralle**
  - [x] Segment antippen → Kategorie-Detail. **Der Ring selbst ist antippbar,
        nicht nur die Beschriftung** – kleine Segmente haben keine und waeren
        sonst unerreichbar
  - [x] Icon und Prozentwert stehen **nebeneinander**, nicht uebereinander:
        die flache Beschriftung braucht radial weniger Platz, und der geht in
        den Ring. Links vom Ring stehen sie andersherum als rechts davon, so
        liegt das Symbol immer an seinem Abschnitt an
  - [x] **Beschriftung und Ring liegen im selben SVG.** Frueher hing die
        Beschriftung als HTML darueber und war in rem bemasst: auf einem
        schmalen Schirm schrumpfte der Ring, die Symbole aber nicht, und dann
        stimmte die Kollisionspruefung nicht mehr mit dem ueberein, was man
        sah – Beschriftungen fielen weg, obwohl reichlich Platz war
  - [x] **Keine Verbindungslinie.** Neben dem Ring bleiben rund zehn Einheiten
        Luft; fuer ein flach zur Seite stehendes Kaestchen ist das der ganze
        Platz, den die Zeichenflaeche hergibt. Ein Strich lag dort entweder
        unter dem Symbol oder fehlte ganz, waehrend er oben und unten gut zu
        sehen war. Weil jede Beschriftung genau auf der Mitte ihres Abschnitts
        sitzt, zeigt die Lage allein schon, wozu sie gehoert
  - [x] Nicht der Mittelpunkt einer Beschriftung liegt auf einem festen
        Radius, sondern ihre **naechste Ecke oder Kante**. Sonst steht ein
        breites Kaestchen links und rechts halb im Ring und ein schraeg
        stehendes mit der Ecke drin, waehrend flache oben und unten unnoetig
        weit weg stehen
  - [x] Der Ring ist bewusst **kleiner als moeglich** (Aussendurchmesser rund
        55 % der Breite): der frei werdende Platz geht in die Symbole, denn
        die sind die eigentliche Beschriftung
  - [x] **Zu viele Kategorien?** Beschriftet wird der Groesse nach: das
        groesste Segment zuerst, jedes weitere faellt weg, sobald sich sein
        Kaestchen mit einem schon gesetzten wirklich ueberschneidet. Geprueft
        werden die tatsaechlichen Kaestchen, nicht ein pauschaler
        Mindestabstand – der hat auch dort ausgeblendet, wo reichlich Platz
        war. Die wichtigen Kategorien bleiben lesbar, statt dass sich alle
        Icons ueberlagern – und die unbeschrifteten Segmente bleiben farbig
        und antippbar
  - [x] Ein Segment unter **6 %** wird kleiner gesetzt: es traegt weniger
        Gewicht, und das kleinere Kaestchen findet oefter Platz, statt ganz
        wegzufallen. Ganz weg faellt eine kleine Kategorie erst, wenn der Ring
        mit sechs Beschriftungen schon voll ist – oder wenn sie unter einem
        halben Prozent liegt, denn dann stuende dort „0 %"
  - [x] Zwischen zwei Segmenten bleibt eine **feine Luecke**; ohne sie laufen
        zwei aehnliche Farben ineinander
  - [x] Erst ab **mehr als 10** Posten wandert der Schwanz nach „Sonstiges".
        Die Grenze liegt bewusst hoeher als die Zahl der Beschriftungen: so
        zeigt der Ring die Verteilung, statt sie hinter einem dicken
        Sammelposten zu verstecken
  - [x] Ab mehr als 7 Posten wandert der Schwanz nach „Sonstiges"; das
        Kategorie-Detail listet dann die gebuendelten Buchungen
  - [x] Selbst gezeichnetes SVG, keine Chart-Library
  - [x] Leerer Zeitraum: grauer Ring mit „Keine Ausgaben"
- [x] **Saldoleiste**: Gesamtbalance + Anzahl Buchungen, antippen → Liste.
      Eine Haarlinie statt einer schwebenden Karte – der Ring darueber ist
      schon eine Flaeche, eine zweite direkt darunter macht die Uebersicht
      unruhig. Der Betrag steht allein auf seiner Zeile und darf dafuer gross
      sein; ist er negativ, faerbt ihn Koralle, denn ein Minus faellt in
      dieser Groesse leicht unter den Tisch
- [x] **Kategorie antippen hebt sie hervor** (Icon am Ring oder das Segment
      selbst): nur ihr Segment bleibt farbig, der Rest verblasst, und in der
      Mitte steht statt der Gesamtsummen ihr Betrag, Name und Anteil. Nochmal
      antippen hebt es auf, ein Wechsel von Zeitraum oder Typ ebenso
- [x] Ein Tipp auf die hervorgehobene Mitte oeffnet das Kategoriedetail –
      so bleiben Hervorheben und Oeffnen zwei verschiedene Gesten
- [x] Zwei flache Knoepfe mit abgerundeten Ecken: **−** Ausgabe, **+**
      Einnahme. Rechtecke statt Kreise, damit unten weniger Hoehe draufgeht
- [x] **Saldoleiste und Knoepfe schliessen unten buendig ab**; darunter steht
      nur noch die Safe Area des Geraets
- [x] Der Ring ist durch die Schirmbreite begrenzt – auf hohen Geraeten bleibt
      also Luft uebrig. Sie wird **zwei Drittel nach oben, ein Drittel nach
      unten** verteilt statt mittig: so gehoert der Ring sichtbar zum unteren
      Block, und die Luft steht unter den Bedienelementen, wo sie nach Atem
      aussieht und nicht nach Leerlauf
- [ ] Kontenfilter (nur eine Auswahl von Konten betrachten)
- [ ] Suche in der Kopfzeile

### 2 – Zeitraum waehlen

- [x] **Tag · Woche · Monat · Jahr · Gesamt**, jeweils mit Vorschau des
      Zeitraums im Blatt
- [x] **Jede Auswahl landet im heutigen Zeitraum.** Vorher behielt sie den
      Anker, auf dem das Blaettern zuletzt stand – „Tag" landete dann auf dem
      Ersten des Monats statt auf heute
- [x] Woche beginnt Montag (umstellbar)
- [x] „Heute"-Sprung
- [x] Die zuletzt gewaehlte Art wird gemerkt und beim naechsten Start wieder
      geladen, Standard ist Monat. Eine Arbeitsweise, keine Einstellung, die
      man erst suchen sollte – darum steht sie nicht mehr in den Einstellungen
- [ ] Eigener Zeitraum (zwei Datumsfelder)

### 3 – Ausgabe / Einnahme erfassen

Ein Bildschirm, der nur Farbe und Kategorienliste wechselt. Der Aufbau ist
fuers Hochformat gerechnet – von oben nach unten:

- [x] **Datum und Konto ganz oben**: Datumsknopf („Heute", „Gestern", sonst
      das Datum) mit dem Kalender des Systems dahinter, daneben das Konto als
      Dropdown. Beides ist bei jeder Buchung gesetzt und muss ohne Scrollen
      sichtbar und aenderbar sein
- [x] Vorbelegtes Datum: **heute**, falls heute im gewaehlten Zeitraum liegt –
      sonst der Anfang des Zeitraums. Wer in der Uebersicht im Juli blaettert
      und dort etwas nachtraegt, meint den Juli
- [x] Betrag gross, eigenes Nummernfeld (kein System-Keyboard):
      Ziffern, Komma, 00, Backspace, Loeschen, Speichern
- [x] **Notiz direkt darunter, immer sichtbar**, Platzhalter nur „Wofür?" –
      ein Beispiel darin liest man beim zweiten Mal nicht mehr und es macht
      das Feld unruhig. Die Kategorie sagt
      „Lebensmittel", die Notiz sagt, was es war – ohne sie ist eine Buchung
      spaeter nicht mehr zuzuordnen. Sie darf nie unter dem Rand liegen
- [x] Kategorie als Grid aus Icon-Chips, plus „Neu" direkt zum Anlegen.
      **Der einzige scrollende Bereich des Formulars**; lange Namen brechen
      auf zwei Zeilen um statt abgeschnitten zu werden
- [x] Ziffernfeld flach genug, dass mindestens zwei Kategoriereihen auch auf
      einem 667 px hohen Schirm sichtbar bleiben
- [x] Speichern → zurueck
- [x] Validierung: Betrag > 0, Kategorie und Konto gesetzt
- [ ] ~~„Speichern & neu"~~ – entfernt, kostete Platz und wurde nicht genutzt

### 4 – Umbuchung

- [x] Von-Konto und Nach-Konto als zwei Dropdowns mit Tauschknopf
- [x] Betrag ueber das gleiche Nummernfeld, Datum, Notiz
- [x] Hinweisbanner beim Grenzfall („wirkt in der Statistik als Ausgabe")
- [x] Validierung: zwei verschiedene Konten

### 5 – Buchungen im Zeitraum

- [x] Liste, neueste zuerst, nach Tag gruppiert mit Tagessumme im Gruppenkopf
      (Nettofluss des Tages, damit eine Gutschrift eine Ausgabe ausgleicht)
- [x] Zeile: Icon, Kategorie, Notiz, Konto, Betrag in der passenden Farbe
- [x] Kopf: Einnahmen, Ausgaben, Differenz des Zeitraums
- [x] Zeile antippen → bearbeiten
- [x] Leerer Zustand mit direktem „Ausgabe erfassen"
- [x] Keine schwebenden Erfassen-Knoepfe: die stehen auf der Hauptansicht,
      einen Tipp entfernt
- [ ] Wischen zum Loeschen (Loeschen sitzt heute im Bearbeiten-Bildschirm)

### 6 – Buchung bearbeiten

- [x] Alle Felder aenderbar, inklusive Typwechsel Ausgabe ⇄ Einnahme
- [x] Loeschen ueber das Papierkorb-Symbol in der Kopfzeile
- [x] Aenderung schreibt die Salden der betroffenen Konten fort
- [x] `adjustment`-Buchungen sind nicht bearbeitbar; ein Tippen darauf fuehrt
      ins Kontodetail
- [ ] **Abweichung vom Mockup:** Bearbeiten benutzt dasselbe Formular wie das
      Erfassen (Nummernfeld, Kategorie-Grid) und nicht das eigene Zeilenlayout
      aus dem Entwurf. Gleiche Funktion, ein Bildschirm weniger zu pflegen

### 7 – Kategorie-Detail

- [x] Kopf: Icon, Name, Summe und Anteil im Zeitraum
- [x] Verlauf der letzten 6 Zeitraeume als Balken
- [x] Budget-Fortschritt, wenn ein Monatsbudget gesetzt und der Zeitraum ein
      Monat ist (in anderen Zeitraeumen waere der Vergleich schief)
- [x] Kennzahlen: Ø pro Zeitraum, groesste Buchung, Anzahl
- [x] Alle Buchungen dieser Kategorie im Zeitraum
- [x] Sonderfaelle „Sonstiges" und „Umbuchung" erklaeren sich im Kopf

### 8 – Konten

- [x] **Gesamtbalance** als Kopfkarte, nur aus mitgezaehlten Konten
- [x] Abschnitte „In der Gesamtbalance", „Nicht in der Gesamtbalance",
      „Archiviert"
- [x] Konto anlegen (Name, Farbe, Anfangssaldo, Schalter)
- [x] **Keine Kontoart.** Giro/Bargeld/Sparen/Kredit war Auswahl ohne Nutzen –
      nichts hing daran, und was ein Konto ist, sagt sein Name. Alle Konten
      tragen dasselbe Symbol und unterscheiden sich ueber Name und Farbe
- [x] Der Hinweis unter der Liste folgt der Einstellung „Umbuchungen ueber die
      Grenze zaehlen" – sonst behauptet er das Gegenteil von dem, was die App
      rechnet
- [x] Konto antippen → Kontodetail
- [ ] Reihenfolge per Drag aendern

### 9 – Kontodetail

- [x] Saldo gross, Farbe
- [x] **Saldo korrigieren** → Wert eingeben, Differenz wird protokolliert
- [x] Schalter „Zur Gesamtbalance zaehlen"
- [x] Einnahmen / Ausgaben / Umbuchungen dieses Kontos im Zeitraum
      (Kontosicht: was abfliesst, ist Abfluss – unabhaengig davon, wie die
      Gesamtstatistik eine Umbuchung bewertet)
- [x] Saldoverlauf als Linie, rueckwaerts vom heutigen Stand gerechnet
- [x] Buchungen nur dieses Kontos
- [x] Archivieren und wiederherstellen; Konten werden nie geloescht
- [x] Hinweis bei Abweichung zwischen Saldo und Buchungssumme
- [ ] Umbuchung direkt aus dem Kontodetail starten (geht heute ueber Konten
      oder das Menue)

### 10 – Statistik

- [x] **Dieselbe Zeitraum-Zeile wie die Uebersicht** (gemeinsame Komponente):
      Pfeile zum Blaettern, Antippen oeffnet die Auswahl. Der Zeitraum ist
      derselbe wie dort – wer hier blaettert, blaettert auch die Uebersicht
- [x] **Verlauf**: Balken pro Tag (Tag/Woche/Monat) bzw. pro Monat
      (Jahr/Gesamt), heutiger Balken hervorgehoben, kommende Tage als Stummel
  - [x] **Nur Ausgaben als Balken.** Einnahmen stehen als Zeile darunter: ein
        Gehalt ist ein Vielfaches eines Wocheneinkaufs, auf einer gemeinsamen
        Achse waeren alle Ausgabenbalken unsichtbar
- [x] **Sparquote** `(Einnahmen − Ausgaben) / Einnahmen`
- [x] **Ø pro Tag**, **Hochrechnung** auf den ganzen Zeitraum (nur solange er
      laeuft), **ausgabenfreie Tage** (nur bis heute gezaehlt)
- [x] **Groesste Kategorien** als Balkenliste, antippbar
- [ ] ~~Vergleich zum Vorzeitraum~~ – entfernt, brachte keinen Erkenntniswert
- [ ] ~~Groesste Einzelbuchung~~ – entfernt, es ist fast immer die Miete
- [ ] Wochentags-Auswertung
- [ ] Vermoegensverlauf ueber die Zeit

### 11 – Kategorien

- [x] Zwei Abschnitte ueber einen Umschalter: Ausgaben und Einnahmen
- [x] Anlegen, umbenennen, Symbol (25 Stueck zur Auswahl), Farbe, archivieren
- [x] Monatsbudget pro Ausgabenkategorie
- [x] Archivierte ueber einen Schalter sichtbar und wiederherstellbar;
      archivierte verschwinden aus dem Erfassen-Formular, ihre Buchungen
      bleiben erhalten
- [ ] Reihenfolge per Drag aendern

### 12 – Einstellungen

- [x] Wochenstart (Montag/Sonntag)
- [x] Umbuchungen ueber die Grenze zaehlen (Standard an)
- [x] **Export als JSON** / **Import aus JSON** (ersetzt alles, prueft die
      Struktur und meldet eine kaputte Datei)
- [x] Alle Daten loeschen (zweistufig, ein Tippen bestaetigt)
- [x] **Ueber Kontor**: eigene Seite, die erklaert, warum man hier alles von
      Hand eintraegt. Wer die App in einem halben Jahr wieder aufmacht, soll
      den Grund in der App finden und nicht nur im Konzept
- [x] Zurueck zur Projektuebersicht
- [ ] Waehrung und Dezimaltrennzeichen (fest auf € und Komma)
- [ ] CSV-Export

### 13 – Erststart

- [x] Nur Wortmarke und das erste Konto (Name, Art, Anfangssaldo, Schalter) –
      kein erklaerender Text, keine Deko. Der Bildschirm muss ohne Scrollen auf
      ein Handy passen, und die App erklaert sich beim ersten Buchen selbst
- [x] Gleiches festes Geruest wie die Erfassen-Formulare: Wortmarke oben,
      Ziffernfeld unten, der Rest scrollt bei Bedarf
- [x] Standardkategorien werden angelegt
- [x] Direkt danach die Hauptansicht mit leerem Donut

---

## Startdaten

**Ausgaben (14):** Wohnen · Abos & Vertraege · Bildung · Lebensmittel ·
Mobilitaet · Persoenliches · Essen gehen · Trinken · Freizeit & Kultur ·
Reisen · Konsum · Geschenke · Spenden · Sonstiges

**Einnahmen (5):** Gehalt · Unterstuetzung · Verkaeufe · Geschenke · Sonstiges

Geschenke und Spenden stehen getrennt: das eine geht an Menschen, die man
kennt, das andere an Organisationen. Wer beides zusammenwirft, sieht keines
von beiden.

**Konto:** eines, im Erststart selbst benannt. Weitere ueber Menue → Konten

- [x] Jede Kategorie hat ein eigenes Symbol und eine eigene Farbe; die Farbtoene
      liegen auf gleicher Saettigung und Helligkeit, damit im Donut kein Segment
      lauter ist als das andere
- [x] **Fehlende Standardkategorien nachtragen**: ein Knopf unter der
      Kategorienliste legt an, was in der Voreinstellung steht und im Bestand
      fehlt – verglichen ueber den Namen, Vorhandenes bleibt unberuehrt. So
      kommt eine geaenderte Voreinstellung in einen Bestand, ohne ihn zu
      loeschen

---

## Bewegung

Animationen sind hier kein Schmuck, sondern Rueckmeldung: sie zeigen, dass
eine Geste angekommen ist und wohin sie fuehrt.

- [x] Zeitraumwechsel: der Ring folgt dem Finger und fliegt danach von der
      richtigen Seite herein
- [x] Blatt: faehrt von unten auf, schliesst rueckwaerts statt zu verschwinden,
      und laesst sich **nach unten wegwischen**. Solange der Inhalt nicht ganz
      oben steht, gehoert die Geste dem Scrollen
- [x] Auch ein Tipp auf eine Zeile im Blatt schliesst mit derselben Animation,
      nicht abrupt
- [x] `prefers-reduced-motion` schaltet alles davon ab

## Querschnitt

- [x] Daten in `localStorage` unter dem Projekt-Namespace `proj:kontor`
- [x] Registrierung in [projects.js](../../projects.js), Routing ueber
      `router.js`
- [x] Geldbetraege ueber **eine** Hilfsfunktion formatiert (`util.js`),
      nie inline
- [x] Datumsschluessel sind lokal (`YYYY-MM-DD`), keine UTC-Umrechnung –
      sonst rutschen abends erfasste Buchungen in den Vortag
- [x] Zurueck-Navigation haengt an der Browser-History
- [x] Die globale `index.css` stellt die Seite auf dunkel; Kontor setzt fuer
      seine Laufzeit `color-scheme: light` und gibt es beim Verlassen zurueck

## Dateien

```
apps/kontor/
├─ index.html              Seite im Launcher (laedt shell.js + src/main.tsx)
├─ konzept.md              dieses Dokument
└─ src/
   ├─ main.tsx             Start: Schriften, Ionic-Huelle (mountApp)
   ├─ Kontor.tsx           Ansichtsstapel, Datenzugriff, History
   ├─ Kontor.css           alle Tokens und Klassen
   ├─ types.ts             Datenmodell und Ansichtstypen
   ├─ kontorStore.ts       Speicher, Salden fortschreiben, Export/Import,
   │                       Uebernahme der Daten aus k-deploy
   ├─ calc.ts              Summen, Donut-Segmente, Reihen, Vergleiche
   ├─ util.ts              Geld, Datum, Zeitraeume
   ├─ charts.tsx           Donut, Balken, Linie
   ├─ icons.tsx            Strich-Icon-Set
   ├─ data.ts              Startdaten, Farben
   └─ views/               die 15 Bildschirme
```

Seit dem Umzug aus k-deploy (Repo Kuerbissuppe) in den Launcher (appdeck):
TypeScript, Speicher unter `kontor:<liste>` statt eines Blocks unter
`k-deploy:proj:kontor`, Schriften selbst gehostet, „Alle Apps" im Menue.

---

## Nicht im MVP

Bewusst verschoben, damit das MVP zum Testen fertig ist:

- [ ] **Suche und Kontenfilter** (Ansicht 12 im Entwurf)
- [ ] Eigener Zeitraum mit zwei Datumsfeldern
- [ ] Reihenfolge von Konten und Kategorien per Drag
- [ ] Wischen zum Loeschen in der Buchungsliste
- [ ] CSV-Export, Waehrungs- und Trennzeichen-Einstellung
- [ ] Wochentags-Auswertung und Vermoegensverlauf in der Statistik
- [ ] **Wiederkehrende Buchungen** (Miete, Abos) mit Vorschlag am Faelligkeitstag
- [ ] Sparziele mit Fortschritt
- [ ] Mehrere Waehrungen
- [ ] Foto/Beleg an eine Buchung haengen
- [ ] Splitbuchung (ein Einkauf auf mehrere Kategorien)
- [ ] Tags zusaetzlich zur Kategorie
- [x] PWA (Manifest, Service Worker) – kommt mit dem Launcher

## Explizit nicht

- Keine Bankanbindung, kein Kontoimport, kein Open Banking – das Erfassen von
  Hand **ist** das Feature
- Kein Account, keine Cloud, kein Sync
- Kein Dark Mode
- Keine Tab-Navigationsleiste
- Keine Werbung, kein Tracking, kein Paywall
- Keine Kredit-/Zinsrechner, keine Depotverwaltung
