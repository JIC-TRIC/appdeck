import { KARTE, type Antworten } from '../karten'
import { AppsKnopf, Mini } from '../ui'
import { taktText, uhr, wann } from '../util'
import type { Versuch } from '../types'

export interface Ergebnis {
  versuch: Versuch
  deck: string[]
  antworten: Antworten
  neuerRekord: boolean
}

// Wie bei "Speed Cards": gezaehlt wird bis zum ersten Fehler, dazu alle Treffer.
// Die Zeiten stehen hier immer, auch wenn die Uhr ausgeblendet war.
export default function Auswertung({
  ergebnis,
  onNeu,
  onEinstellungen,
}: {
  ergebnis: Ergebnis
  onNeu: () => void
  onEinstellungen: () => void
}) {
  const { versuch: v, deck, antworten, neuerRekord } = ergebnis
  const perfekt = v.richtig === v.n
  const fehler = deck.map((id, i) => ({ id, i, deine: antworten[i] })).filter((x) => x.deine !== x.id)

  return (
    <>
      <header className="l-head">
        <AppsKnopf />
      </header>
      <div className="l-body">
        <div>
          <h1 className={`l-h1${perfekt ? ' gut' : ''}`}>
            {perfekt ? `Fehlerfrei, alle ${v.n} Karten!` : `${v.bisFehler} von ${v.n} bis zum ersten Fehler`}
          </h1>
          <p className="l-sub">
            {v.n} Karten{v.takt ? ` · Takt ${taktText(v.takt)}` : ''} · {wann(v.zeit)}
          </p>
        </div>
        {neuerRekord ? <p className="l-rekord">Neue Bestzeit fürs Merken von {v.n} Karten.</p> : null}

        <div className="l-kacheln">
          <div>
            <b className="l-num">
              {v.bisFehler}/{v.n}
            </b>
            <span>bis zum ersten Fehler</span>
          </div>
          <div>
            <b className="l-num">
              {v.richtig}/{v.n}
            </b>
            <span>an richtiger Stelle</span>
          </div>
          <div>
            <b className="l-num">{uhr(v.merk)}</b>
            <span>Merkzeit</span>
          </div>
          <div>
            <b className="l-num">{uhr(v.wieder)}</b>
            <span>Wiedergabe</span>
          </div>
        </div>

        <section className="l-sec">
          <h2 className="l-h2">Richtige Reihenfolge</h2>
          <div className="l-reihe">
            {deck.map((id, i) => {
              const ok = antworten[i] === id
              return (
                <span key={i} className={`l-reihe-k${ok ? '' : ' fehler'}${!perfekt && i === v.bisFehler ? ' erster' : ''}`} title={`${i + 1}. ${KARTE[id].name}`}>
                  <Mini id={id} />
                </span>
              )
            })}
          </div>
        </section>

        {fehler.length ? (
          <section className="l-sec">
            <h2 className="l-h2">Fehler ({fehler.length})</h2>
            <div className="l-fehlerliste">
              {fehler.map((x) => (
                <div className="l-fehler-zeile" key={x.i}>
                  <span className="l-num l-s3">{x.i + 1}.</span>
                  <span className="l-fehler-karten">
                    <span className="l-s2">richtig</span>
                    <Mini id={x.id} className="klein" />
                    <span className="l-s3">· deine</span>
                    {x.deine ? <Mini id={x.deine} className="klein" /> : <span className="l-s3">leer</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="l-knoepfe">
          <button type="button" className="l-btn" onClick={onNeu}>
            Neu mischen
          </button>
          <button type="button" className="l-btn sek" onClick={onEinstellungen}>
            Einstellungen
          </button>
        </div>
      </div>
    </>
  )
}
