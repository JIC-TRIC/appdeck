import { useState } from 'react'
import { IconRight } from '../icons'
import { KONSTANTE, KONSTANTEN, istLang, rekorde } from '../konstanten'
import { getKVersuche, konstantenZuruecksetzen, speichereKVersuch } from '../store'
import { AppsKnopf, Bestaetigen, Vollbild } from '../ui'
import { wann } from '../util'
import type { Einstellungen, KModus, KVersuch } from '../types'
import Aufsagen from './Aufsagen'
import Lernen from './Lernen'

// Reiter Konstanten: Modus (frei, streng oder lernen), Liste mit Rekorden,
// Aufsagen bzw. Lernen als Vollbild darueber.
const MODI: { id: KModus; name: string; info: string }[] = [
  { id: 'frei', name: 'Frei', info: 'Weitertippen bis „Fertig“, ausgewertet wird am Ende.' },
  { id: 'streng', name: 'Streng', info: 'Ein Fehler, den du nicht sofort mit ⌫ korrigierst, beendet den Durchgang.' },
  { id: 'lernen', name: 'Lernen', info: 'Die nächsten 10 Stellen nach deinem Rekord ansehen, verdecken, tippen – dann von vorn bis dorthin.' },
]

export default function Konstanten({
  aktiv,
  einst,
  aendere,
}: {
  aktiv: boolean
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
}) {
  const [versuche, setVersuche] = useState(getKVersuche)
  const [offen, setOffen] = useState<string | null>(null)
  // Waehrend das Vollbild zugeht, bleibt die Konstante stehen.
  const [zuletzt, setZuletzt] = useState<string | null>(null)
  const rekord = rekorde(versuche)

  const oeffne = (id: string) => {
    setZuletzt(id)
    setOffen(id)
  }

  const gruppe = (g: 'mathe' | 'physik') =>
    KONSTANTEN.filter((k) => k.gruppe === g).map((k) => {
      const letzter = [...versuche].reverse().find((v) => v.k === k.id)
      const best = rekord[k.id] ?? 0
      // Bei den langen (1000 Stellen) zaehlt nur, wie weit man schon kommt -
      // die Gesamtzahl steht nicht da. Die kurzen lassen sich ganz schaffen.
      const lang = istLang(k)
      return (
        <button key={k.id} type="button" className="l-konst" onClick={() => oeffne(k.id)}>
          <span className="l-konst-symbol">{k.symbol}</span>
          <span className="l-konst-text">
            <span className="l-konst-name">{k.name}</span>
            <small>
              {best
                ? lang
                  ? `Rekord ${best} ${best === 1 ? 'Stelle' : 'Stellen'}`
                  : `Rekord ${best} von ${k.ziffern.length}`
                : lang
                  ? ''
                  : `${k.ziffern.length} Stellen`}
              {letzter ? `${best || !lang ? ' · ' : ''}${wann(letzter.ende)}` : ''}
            </small>
          </span>
          <IconRight />
        </button>
      )
    })

  const k = zuletzt ? KONSTANTE[zuletzt] : null

  return (
    <div className="l-screen" hidden={!aktiv}>
      <header className="l-head">
        <AppsKnopf />
      </header>
      <div className="l-body">
        <div>
          <h1 className="l-h1">Konstanten</h1>
        </div>
        <div>
          <div className="l-seg drei" role="radiogroup" aria-label="Modus">
            {MODI.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={einst.konstanten.modus === m.id}
                className={einst.konstanten.modus === m.id ? 'an' : ''}
                onClick={() => aendere({ konstanten: { modus: m.id } })}
              >
                {m.name}
              </button>
            ))}
          </div>
          <p className="l-text2">{MODI.find((m) => m.id === einst.konstanten.modus)!.info}</p>
        </div>
        <section className="l-sec">
          <h2 className="l-h2">Mathematik</h2>
          <div className="l-card l-konst-liste">{gruppe('mathe')}</div>
        </section>
        <section className="l-sec">
          <h2 className="l-h2">Physik</h2>
          <div className="l-card l-konst-liste">{gruppe('physik')}</div>
        </section>
        {versuche.length ? (
          <Bestaetigen
            label="Statistik zurücksetzen"
            frage="Wirklich alle Rekorde löschen? Nochmal tippen"
            onConfirm={() => setVersuche(konstantenZuruecksetzen())}
          />
        ) : null}
      </div>

      <Vollbild offen={offen !== null} label="Konstante aufsagen" onZu={() => setOffen(null)}>
        {k && einst.konstanten.modus === 'lernen' ? (
          <Lernen
            key={k.id}
            k={k}
            rekord={rekord[k.id] ?? 0}
            uhrAn={einst.uhr}
            onSpeichern={(v: KVersuch) => setVersuche(speichereKVersuch(v))}
            onSchliessen={() => setOffen(null)}
          />
        ) : k ? (
          <Aufsagen
            key={k.id}
            k={k}
            rekord={rekord[k.id] ?? 0}
            uhrAn={einst.uhr}
            streng={einst.konstanten.modus === 'streng'}
            onSpeichern={(v: KVersuch) => setVersuche(speichereKVersuch(v))}
            onSchliessen={() => setOffen(null)}
          />
        ) : null}
      </Vollbild>
    </div>
  )
}
