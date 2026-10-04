import { IconMischen } from '../icons'
import { ANZAHLEN, TAKT_MAX, TAKT_MIN, TAKT_SCHRITT, bestzeiten } from '../karten'
import { AppsKnopf, Bestaetigen, Schalter } from '../ui'
import { taktText, uhr, wann } from '../util'
import type { Einstellungen, Versuch } from '../types'

export default function KartenStart({
  einst,
  aendere,
  versuche,
  onStart,
  onReset,
}: {
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
  versuche: Versuch[]
  onStart: () => void
  onReset: () => void
}) {
  const deck = einst.deck
  const setDeck = (patch: Partial<Einstellungen['deck']>) => aendere({ deck: { ...deck, ...patch } })
  const best = bestzeiten(versuche)
  const letzte = versuche.slice(-5).reverse()

  return (
    <>
      <header className="l-head">
        <AppsKnopf />
      </header>
      <div className="l-body">
        <div>
          <h1 className="l-h1">Kartendeck</h1>
          <p className="l-sub">Gemischtes Deck merken, dann in der richtigen Reihenfolge wiedergeben.</p>
        </div>

        <section className="l-card l-einst">
          <div className="l-einst-zeile">
            <span className="l-einst-name">Karten</span>
            <div className="l-chips" role="radiogroup" aria-label="Anzahl Karten">
              {ANZAHLEN.map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={deck.anzahl === n}
                  className={`l-chip${deck.anzahl === n ? ' an' : ''}`}
                  onClick={() => setDeck({ anzahl: n })}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className={`l-einst-zeile${deck.taktAn ? ' ohne-linie' : ''}`}>
            <span>
              <span className="l-einst-name">Taktgeber</span>
              <small>Karten blättern von selbst weiter</small>
            </span>
            <Schalter an={deck.taktAn} label="Taktgeber" onChange={(taktAn) => setDeck({ taktAn })} />
          </div>
          {deck.taktAn ? (
            <div className="l-einst-zeile unter">
              <span className="l-s2">Nächste Karte alle</span>
              <div className="l-stepper" role="group" aria-label="Takt in Sekunden">
                <button
                  type="button"
                  aria-label="Langsamer"
                  disabled={deck.takt <= TAKT_MIN}
                  onClick={() => setDeck({ takt: Math.max(TAKT_MIN, deck.takt - TAKT_SCHRITT) })}
                >
                  −
                </button>
                <span className="l-num">{taktText(deck.takt)}</span>
                <button
                  type="button"
                  aria-label="Schneller"
                  disabled={deck.takt >= TAKT_MAX}
                  onClick={() => setDeck({ takt: Math.min(TAKT_MAX, deck.takt + TAKT_SCHRITT) })}
                >
                  +
                </button>
              </div>
            </div>
          ) : null}
          <div className="l-einst-zeile">
            <span className="l-einst-name">Uhr anzeigen</span>
            <Schalter an={einst.uhr} label="Uhr anzeigen" onChange={(an) => aendere({ uhr: an })} />
          </div>
        </section>

        <button type="button" className="l-btn gross" onClick={onStart}>
          <IconMischen />
          Mischen und loslegen
        </button>

        <section className="l-sec">
          <div className="l-sec-kopf">
            <h2 className="l-h2">Bestzeiten</h2>
            <span className="l-s3">Merkzeit, nur fehlerfrei</span>
          </div>
          <div className="l-liste">
            {ANZAHLEN.map((n) => (
              <div className="l-listen-zeile" key={n}>
                <span className="l-s2">{n} Karten</span>
                <b className="l-num">{best[n] === null ? '–' : uhr(best[n]!)}</b>
              </div>
            ))}
          </div>
        </section>

        <section className="l-sec">
          <div className="l-sec-kopf">
            <h2 className="l-h2">Letzte Versuche</h2>
            <span className="l-s3">Merken · Wiedergabe</span>
          </div>
          {letzte.length ? (
            <div className="l-liste">
              {letzte.map((v) => (
                <div className="l-listen-zeile" key={v.zeit}>
                  <span>
                    <span className="l-versuch">
                      {v.n} Karten · {v.richtig === v.n ? 'fehlerfrei' : `${v.bisFehler} bis zum Fehler`}
                    </span>
                    <small>
                      {wann(v.zeit)}
                      {v.takt ? ` · Takt ${taktText(v.takt)}` : ''}
                    </small>
                  </span>
                  <span className="l-zeiten l-num">
                    <b>{uhr(v.merk)}</b>
                    <small>{uhr(v.wieder)}</small>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="l-note">Noch keine Versuche.</p>
          )}
        </section>

        {versuche.length ? <Bestaetigen label="Statistik zurücksetzen" frage="Wirklich zurücksetzen? Nochmal tippen" onConfirm={onReset} /> : null}
      </div>
    </>
  )
}
