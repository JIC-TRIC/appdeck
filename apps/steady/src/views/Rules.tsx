import { IconCheck } from '../icons'
import { Card, Screen, hue } from '../ui'
import type { ViewProps } from '../types'

// Die Regeln in der App - wer Steady in einem halben Jahr wieder oeffnet,
// soll sie hier finden und nicht nur im Konzept (wie Kontors "Über Kontor").
const LEGENDE = [
  { smp: <span className="s-c d"><i /></span>, t: 'Erledigt', s: 'abgehakt oder Ziel erreicht' },
  { smp: <span className="s-c r"><i /></span>, t: 'Ruhetag', s: 'automatisch gedeckt, zählt zur Serie' },
  { smp: <span className="s-c x"><i /></span>, t: 'Verpasst', s: 'nicht erledigt, die Serie beginnt neu' },
  { smp: <span className="s-c n"><i /></span>, t: 'Noch nicht begonnen', s: 'vor dem Beginn-Datum' },
  { smp: <span className="s-t" />, t: 'Heute offen', s: 'zählt noch, bricht nichts' },
  { smp: <span className="s-t due" />, t: 'Heute fällig', s: 'keine Ruhetage mehr übrig' },
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
        <Card title="Ruhetage">
          <p className="s-txt">
            Bei <b>3× pro Woche</b> hat jede Woche 4 Ruhetage. Jeder Tag ohne Training wird automatisch einer, bis sie
            aufgebraucht sind. Danach ist jeder freie Tag verpasst. Heute zählt erst, wenn der Tag vorbei ist.
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
