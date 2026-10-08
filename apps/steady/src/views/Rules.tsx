import { IconCheck } from '../icons'
import { Card, Screen, hue } from '../ui'
import type { ViewProps } from '../types'

// Die Regeln in der App - wer Steady in einem halben Jahr wieder oeffnet,
// soll sie hier finden und nicht nur im Konzept (wie Kontors "Über Kontor").
const LEGENDE = [
  { smp: <span className="s-c d"><i /></span>, t: 'Erledigt', s: 'abgehakt oder Ziel erreicht' },
  { smp: <span className="s-c r"><i /></span>, t: 'Ruhetag', s: 'automatisch gedeckt, zählt zur Serie' },
  { smp: <span className="s-c x"><i /></span>, t: 'Nicht geschafft', s: 'so eingetragen, die Serie beginnt neu' },
  { smp: <span className="s-c l"><i /></span>, t: 'Nichts eingetragen', s: 'zählt wie nicht geschafft – vielleicht vergessen?' },
  { smp: <span className="s-c r nein"><i /></span>, t: 'Ruhetag, nicht geschafft', s: 'so eingetragen, vom Kontingent gedeckt' },
  { smp: <span className="s-c z ok"><b>152</b></span>, t: 'Menge', s: 'der Tageswert, farbig = Ziel erreicht' },
  { smp: <span className="s-c z ruhe"><b>90</b></span>, t: 'Menge am Ruhetag', s: 'Ziel verfehlt, aber vom Kontingent gedeckt – die Serie hält' },
  { smp: <span className="s-c n"><i /></span>, t: 'Noch nicht begonnen', s: 'vor dem Beginn-Datum' },
  { smp: <span className="s-t" />, t: 'Heute offen', s: 'noch einzutragen, bricht nichts' },
  { smp: <span className="s-t rest"><i /></span>, t: 'Heute frei', s: 'Ruhetag übrig – bleibt es leer, wird es einer' },
  { smp: <span className="s-t done"><IconCheck /></span>, t: 'Heute erledigt', s: 'abgehakt' },
  { smp: <span className="s-t">148<i className="bar" style={{ width: '98%' }} /></span>, t: 'Menge unter Ziel', s: 'der Balken zeigt den Fortschritt' },
]

function Rules({ ctx }: ViewProps) {
  const { back, settings } = ctx
  return (
    <Screen title="So zählt Steady" onBack={back}>
      <div className="s-rules" style={hue('coral')}>
        <Card>
          {LEGENDE.map((l) => (
            <div key={l.t} className="s-lg-row">
              <span className="smp">{l.smp}</span>
              <span>
                <b>{l.t}</b>
                <small>{l.s}</small>
              </span>
            </div>
          ))}
        </Card>
        <Card title="Eintragen">
          <p className="s-txt">
            Ein Tipp auf einen Tag schaltet weiter: <b>geschafft</b>, <b>nicht geschafft</b>, wieder leer. Bei Mengen
            öffnet sich das Ziffernfeld, „Nicht geschafft“ steht dort oben.
          </p>
          <p className="s-txt">
            Ein leerer Tag zählt wie nicht geschafft – sonst wäre Vergessen besser als ehrlich Eintragen. Der Unterschied
            zeigt nur, wo du vielleicht bloß vergessen hast einzutragen. Nachtragen geht jederzeit.
          </p>
          <p className="s-txt">
            Oben unter dem Datum steht, wie viel heute <b>noch einzutragen</b> ist. Auch „nicht geschafft“ ist ein
            Eintrag – es geht ums Festhalten, nicht um den perfekten Tag. Was heute frei ist, braucht keinen.
          </p>
        </Card>
        <Card title="Ruhetage">
          <p className="s-txt">
            Bei <b>3× pro Woche</b> hat jede Woche 4 Ruhetage. Jeder Tag ohne Training wird automatisch einer, bis sie
            aufgebraucht sind. Danach ist jeder freie Tag verpasst. Heute zählt erst, wenn der Tag vorbei ist.
          </p>
          <p className="s-txt">
            Ruhetage halten eine <b>laufende Serie</b> – sie beginnen keine. Läuft keine (etwa nach einer verfehlten
            Woche), zählt ein freier Tag als verpasst, bis du es wieder machst. Sonst sähe „Laufen 2× pro Woche“ auch
            ohne einen einzigen Lauf nach 5 von 7 aus.
          </p>
        </Card>
        <Card title="Woche">
          <p className="s-txt">
            Montag bis Sonntag. Übrige Ruhetage verfallen am Sonntag. Im Raster trennt eine feine Linie die Wochen.
            Beginnt eine Gewohnheit mitten in der Woche, gilt das Ziel anteilig.
          </p>
        </Card>
        <Card title="Serie">
          <p className="s-txt">
            Tage in Folge mit erledigt oder Ruhetag. Heute zählt mit, sobald es erledigt ist. Es gibt <b>keine Pausen</b>:
            krank oder Urlaub beginnt eine neue Serie, ebenso das Zurückholen aus dem Archiv. Der Rekord bleibt.
          </p>
        </Card>
        <Card title="Ziele ändern">
          <p className="s-txt">
            Ein neuer Rhythmus gilt ab Montag der laufenden Woche, ein neues Mengenziel ab heute. Frühere Tage behalten
            ihre Regel.
          </p>
        </Card>
        <Card title="Tageswechsel">
          <p className="s-txt">
            {settings.dayStart === 0
              ? 'Der Tag wechselt um Mitternacht.'
              : `Bis ${settings.dayStart}:00 Uhr nachts zählt noch der Vortag.`}{' '}
            Einstellbar unter Einstellungen.
          </p>
        </Card>
      </div>
    </Screen>
  )
}

export default Rules
