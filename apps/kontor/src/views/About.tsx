import { Screen } from '../ui'
import type { ViewProps } from '../types'

// Wofuer die App da ist - in der App selbst, nicht nur im Konzept. Wer sie in
// einem halben Jahr wieder aufmacht, soll den Grund wiederfinden.
function About({ ctx }: ViewProps) {
  return (
    <Screen title="Über Kontor" onBack={ctx.back}>
      <div className="k-prose">
        <p className="k-prose-lead">
          Kontor trägt nichts für dich ein. Jede Ausgabe und jede Einnahme tippst du selbst.
        </p>

        <p>
          Das ist keine fehlende Funktion, sondern der ganze Punkt. Eine App, die deine Umsätze
          automatisch von der Bank holt, zeigt dir am Monatsende eine Liste – gesehen hast du davon
          nichts. Wer jeden Einkauf, jeden Kaffee und jede Rechnung selbst eintippt, merkt sich beim
          Tippen, was er gerade ausgegeben hat.
        </p>

        <p>
          Nach ein paar Wochen bekommst du ein Gefühl dafür, <strong>wann</strong>,{' '}
          <strong>wofür</strong> und <strong>wie viel</strong> Geld tatsächlich weggeht – und zwar
          bevor der Kontostand es dir sagt. Genau dieses Gefühl ist das Ziel, nicht die perfekte
          Buchführung.
        </p>

        <p>
          Deshalb ist das Erfassen auf wenige Sekunden ausgelegt: Betrag, Kategorie, eine kurze
          Notiz. Die Notiz lohnt sich – „Lebensmittel" sagt dir in drei Monaten nichts mehr,
          „Wocheneinkauf" oder „Geburtstagskuchen" schon.
        </p>

        <div className="k-prose-facts">
          <div>
            <strong>Keine Bankanbindung.</strong> Kein Zugriff auf deine Konten, kein Import, kein
            Abgleich.
          </div>
          <div>
            <strong>Kein Konto, keine Cloud.</strong> Alle Daten liegen nur auf diesem Gerät.
            Sie verlassen es nicht.
          </div>
          <div>
            <strong>Keine Werbung, kein Tracking, keine Bezahlschranke.</strong>
          </div>
          <div>
            <strong>Sichern musst du selbst.</strong> Wer das App-Icon löscht, löscht die Daten.
            Das Backup im Launcher (Zahnrad) oder der JSON-Export in den Einstellungen schützt davor.
          </div>
        </div>

        <p className="k-prose-end">
          Wenn du eine Woche lang nichts einträgst, fehlt die Woche. Auch das ist ehrlich: die App
          zeigt, was du erfasst hast, und tut nicht so, als wüsste sie mehr.
        </p>
      </div>
    </Screen>
  )
}

export default About
