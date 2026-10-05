import { useState } from 'react'
import { IconKopie } from '../icons'
import { anzahl, wann } from '../text'
import { Leiste } from '../ui'
import type { Geleert, Notiz } from '../types'

interface Props {
  notizen: Notiz[]
  geleert: Geleert | null
  onZurueck: () => void
  onKopieren: () => void
  onLoeschen: () => void
  onZurueckholen: () => void
}

// Alles, was abgelegt wurde, aelteste zuerst - so, wie es auch kopiert wird.
// Antippen klappt eine lange Notiz ganz auf. Unten: alles kopieren oder
// alles loeschen. Ist der Stapel leer, laesst sich der zuletzt geleerte
// zurueckholen.
function Stapel({ notizen, geleert, onZurueck, onKopieren, onLoeschen, onZurueckholen }: Props) {
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
      <Leiste zurueck="Schreiben" onZurueck={onZurueck} />

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
            <p className="s-note">Was du ablegst, sammelt sich hier, bis du es kopierst.</p>
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
        <div className="s-unten zwei">
          <button type="button" className="s-neben" onClick={onLoeschen}>
            Löschen
          </button>
          <button type="button" className="s-haupt" onClick={onKopieren}>
            <IconKopie />
            Alles kopieren
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default Stapel
