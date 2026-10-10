import { useState } from 'react'
import { IconZahnrad } from '../icons'
import { anzahl, wann } from '../text'
import { Leiste } from '../ui'
import type { Geleert, Notiz } from '../types'

interface Props {
  notizen: Notiz[]
  geleert: Geleert | null
  onZurueck: () => void
  /** Laeuft gerade ein Senden? Dann ist der Knopf aus. */
  sendet: boolean
  onSenden: () => void
  onKopieren: () => void
  onLoeschen: () => void
  onZurueckholen: () => void
  onEinrichten: () => void
}

// Alles, was abgelegt wurde, aelteste zuerst - so, wie es auch kopiert wird.
// Antippen klappt eine lange Notiz ganz auf. Unten: alles an die Inbox
// senden, kopieren oder loeschen; das Zahnrad oben richtet das Senden ein.
// Ist der Stapel leer, laesst sich der zuletzt geleerte zurueckholen.
function Stapel({
  notizen,
  geleert,
  sendet,
  onZurueck,
  onSenden,
  onKopieren,
  onLoeschen,
  onZurueckholen,
  onEinrichten,
}: Props) {
  const [offen, setOffen] = useState<ReadonlySet<string>>(() => new Set())
  const jetzt = Date.now()

  const umschalten = (id: string) =>
    setOffen((s) => {
      const neu = new Set(s)
      if (neu.has(id)) neu.delete(id)
      else neu.add(id)
      return neu
    })

  return (
    <div className="s-screen">
      <Leiste
        zurueck="Schreiben"
        onZurueck={onZurueck}
        rechts={
          <button type="button" className="s-einrichten" aria-label="Senden einrichten" onClick={onEinrichten}>
            <IconZahnrad />
          </button>
        }
      />

      <div className="s-body">
        <header className="s-kopf">
          <p className="s-kicker">{notizen.length ? anzahl(notizen.length) : 'leer'}</p>
          <h1 className="s-h1">Stapel</h1>
        </header>

        {notizen.length ? (
          <ol className="s-liste">
            {notizen.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`s-notiz${offen.has(n.id) ? ' offen' : ''}`}
                  aria-expanded={n.text ? offen.has(n.id) : undefined}
                  onClick={() => umschalten(n.id)}
                >
                  <span className="s-notiz-kopf">
                    <span className={`s-notiz-titel${n.titel ? '' : ' ohne'}`}>{n.titel || 'Ohne Titel'}</span>
                    <span className="s-notiz-zeit">{wann(n.erstellt, jetzt)}</span>
                  </span>
                  {n.text ? <span className="s-notiz-text">{n.text}</span> : null}
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <div className="s-leer">
            <p className="s-leer-t">Nichts im Stapel.</p>
            {geleert ? (
              <div className="s-geleert">
                <p className="s-note">
                  Zuletzt geleert {wann(geleert.am, jetzt)} · {anzahl(geleert.notizen.length)}
                </p>
                <button type="button" className="s-link" onClick={onZurueckholen}>
                  Zurückholen
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {notizen.length ? (
        <div className="s-unten drei">
          <button type="button" className="s-neben" onClick={onLoeschen}>
            Löschen
          </button>
          <button type="button" className="s-neben tinte" onClick={onKopieren}>
            Kopieren
          </button>
          <button type="button" className="s-haupt" disabled={sendet} onClick={onSenden}>
            {sendet ? 'Sendet …' : 'Senden'}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Stapel
