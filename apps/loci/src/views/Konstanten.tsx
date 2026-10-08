import { useState } from 'react'
import { IconRight } from '../icons'
import { KONSTANTE, KONSTANTEN, istLang, rekorde } from '../konstanten'
import { getKVersuche, konstantenZuruecksetzen, speichereKVersuch } from '../store'
import { AppsKnopf, Bestaetigen, Vollbild } from '../ui'
import { wann } from '../util'
import type { Einstellungen, KVersuch } from '../types'
import Aufsagen from './Aufsagen'

// Reiter Konstanten: Liste mit Rekorden, Aufsagen als Vollbild darueber.
export default function Konstanten({ aktiv, einst }: { aktiv: boolean; einst: Einstellungen }) {
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
        {k ? (
          <Aufsagen
            key={k.id}
            k={k}
            rekord={rekord[k.id] ?? 0}
            uhrAn={einst.uhr}
            onSpeichern={(v: KVersuch) => setVersuche(speichereKVersuch(v))}
            onSchliessen={() => setOffen(null)}
          />
        ) : null}
      </Vollbild>
    </div>
  )
}
