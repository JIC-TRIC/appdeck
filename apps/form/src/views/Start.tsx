import { reihe, stand, zielStand } from '../calc'
import { Linie } from '../charts'
import { IconCheck, IconPlus } from '../icons'
import { Diff, Seite, Zurueck, zumLauncher } from '../ui'
import { formatKurz, formatZahl, mitEinheit, wieLange } from '../util'
import type { FormCtx, Wert } from '../types'

// Uebersicht: pro Wert eine Karte mit dem juengsten Stand, dem Fortschritt
// seit der ersten Messung und dem Mini-Verlauf. Unten der Hauptknopf zum
// Messen. Ohne Werte steht hier nur, wie es losgeht.
function Start({ ctx }: { ctx: FormCtx }) {
  const { werte, log, heute, push } = ctx

  // Juengste Messung ueber alle Werte - fuer die Zeile ueber der Wortmarke.
  let zuletzt = ''
  for (const w of werte) {
    for (const tag of Object.keys(log[w.id] ?? {})) if (tag > zuletzt) zuletzt = tag
  }

  const neu = (
    <button type="button" className="f-rund" onClick={() => push({ name: 'wertForm' })} aria-label="Neuer Wert">
      <IconPlus />
    </button>
  )

  return (
    <Seite
      links={<Zurueck label="Apps" onClick={zumLauncher} />}
      rechts={werte.length ? neu : null}
      unten={
        werte.length ? (
          <button type="button" className="f-haupt" onClick={() => push({ name: 'messen', tag: heute })}>
            Messen
          </button>
        ) : null
      }
    >
      <header className="f-kopf">
        <p className="f-kicker">{zuletzt ? `Zuletzt gemessen ${wieLange(zuletzt, heute)}` : 'Fortschritt in Zahlen'}</p>
        <h1 className="f-marke">
          Form<span>.</span>
        </h1>
      </header>

      {werte.length ? (
        <div className="f-karten">
          {werte.map((w) => (
            <Karte key={w.id} wert={w} ctx={ctx} />
          ))}
        </div>
      ) : (
        <div className="f-leer">
          <p className="f-leer-t">Was willst du verfolgen?</p>
          <p className="f-note">
            Gewicht, Bizeps, Taille – alles, was sich messen lässt. Jeder Wert bekommt eine Einheit, eine Richtung und auf
            Wunsch ein Ziel.
          </p>
          <button type="button" className="f-haupt" onClick={() => push({ name: 'wertForm' })}>
            Ersten Wert anlegen
          </button>
        </div>
      )}
    </Seite>
  )
}

function Karte({ wert, ctx }: { wert: Wert; ctx: FormCtx }) {
  const { log, heute, push } = ctx
  const punkte = reihe(log, wert.id)
  const s = stand(punkte)
  const z = s.letzter ? zielStand(wert, s.letzter.zahl) : null

  return (
    <button type="button" className="f-karte" onClick={() => push({ name: 'wert', id: wert.id })}>
      <span className="f-karte-kopf">
        <span className="f-karte-name">{wert.name}</span>
        {s.letzter ? <span className="f-karte-wann">{wieLange(s.letzter.tag, heute)}</span> : null}
      </span>
      <span className="f-karte-mitte">
        {s.letzter ? (
          <span className="f-zahl">
            <b>{formatZahl(s.letzter.zahl)}</b>
            {wert.einheit ? <small>{wert.einheit}</small> : null}
          </span>
        ) : (
          <span className="f-zahl leer">
            <b>–</b>
          </span>
        )}
        <Linie punkte={punkte} />
      </span>
      <span className="f-karte-info">
        {!s.letzter ? (
          'Noch nichts eingetragen'
        ) : s.erster && s.anzahl > 1 ? (
          <>
            <Diff wert={wert} diff={s.letzter.zahl - s.erster.zahl} /> seit {formatKurz(s.erster.tag, heute)}
          </>
        ) : (
          'Erste Messung'
        )}
        {z ? (
          <span className={`f-karte-ziel${z.erreicht ? ' erreicht' : ''}`}>
            {z.erreicht ? (
              <>
                <IconCheck />
                Ziel
              </>
            ) : (
              `noch ${mitEinheit(formatZahl(z.rest), wert.einheit)}`
            )}
          </span>
        ) : null}
      </span>
    </button>
  )
}

export default Start
