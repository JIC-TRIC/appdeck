import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { IconClose } from '../icons'
import { mitKomma, weiter, type Konstante } from '../konstanten'
import { Laufuhr, Ziffernblock } from '../ui'
import { uhr } from '../util'
import type { KVersuch } from '../types'

// Aufsagen: Ziffer fuer Ziffer, die erste falsche beendet den Durchgang (wie
// beim Aufsagen aus dem Kopf - kein Loeschen). "Fertig" beendet ohne Fehler.

interface Ende {
  stellen: number
  /** falsche Ziffer: getippt und richtig */
  fehler: { ist: string; soll: string } | null
  dauer: number
  neuerRekord: boolean
  /** Rekord vor diesem Durchgang */
  vorher: number
}

export default function Aufsagen({
  k,
  rekord,
  uhrAn,
  onSpeichern,
  onSchliessen,
}: {
  k: Konstante
  rekord: number
  uhrAn: boolean
  onSpeichern: (v: KVersuch) => void
  onSchliessen: () => void
}) {
  const [getippt, setGetippt] = useState('')
  const [start, setStart] = useState(() => Date.now())
  const [ende, setEnde] = useState<Ende | null>(null)
  // Der Rekord vom Start: nach dem Speichern kommt schon der neue herein.
  const [vorher, setVorher] = useState(rekord)
  const [frage] = useIonAlert()
  const ziffernRef = useRef<HTMLDivElement>(null)
  const lang = k.ziffern.length > 20

  const beende = (stellen: number, fehler: Ende['fehler']) => {
    const dauer = Date.now() - start
    const v: KVersuch = { k: k.id, stellen, ende: Date.now(), dauer, fehler: !!fehler }
    onSpeichern(v)
    setEnde({ stellen, fehler, dauer, neuerRekord: stellen > vorher && stellen > 0, vorher })
  }

  const tippe = (z: string) => {
    if (ende) return
    const soll = k.ziffern[getippt.length]
    if (z !== soll) return beende(getippt.length, { ist: z, soll })
    const neu = getippt + z
    setGetippt(neu)
    if (neu.length === k.ziffern.length) beende(neu.length, null)
  }

  const fertig = () => {
    if (!ende) beende(getippt.length, null)
  }

  const nochmal = () => {
    setGetippt('')
    setEnde(null)
    setVorher(rekord)
    setStart(Date.now())
  }

  const schliessen = () => {
    if (ende || !getippt) return onSchliessen()
    frage({
      header: 'Abbrechen?',
      message: 'Dieser Durchgang wird nicht gespeichert.',
      cssClass: 'l-alert',
      buttons: [
        { text: 'Weiter', role: 'cancel' },
        { text: 'Abbrechen', role: 'destructive', handler: onSchliessen },
      ],
    })
  }

  // Die neueste Zeile bleibt sichtbar.
  useLayoutEffect(() => {
    const el = ziffernRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [getippt, ende])

  // Tasten am Rechner: Ziffern, Enter = fertig bzw. nochmal, Esc = schliessen.
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      if (ev.target instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (/^\d$/.test(ev.key)) tippe(ev.key)
      else if (ev.key === 'Enter') {
        if (ende) nochmal()
        else fertig()
      } else if (ev.key === 'Escape') schliessen()
      else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  const zeit = useCallback(() => (ende ? ende.dauer : Date.now() - start), [ende, start])

  // Lange Konstanten in Zeilen zu 10 (als 5 + 5), kurze in einer Zeile mit
  // Platzhaltern. Cursor bzw. falsche Ziffer belegen den naechsten Platz.
  const markePlatz = ende && !ende.fehler ? -1 : getippt.length
  const reihen = Math.max(1, Math.ceil((getippt.length + (markePlatz >= 0 ? 1 : 0)) / 10))
  const fuenfer = (t: string) => (t.length > 5 ? `${t.slice(0, 5)} ${t.slice(5)}` : t)
  const marke = ende?.fehler ? <em>{ende.fehler.ist}</em> : <i className="l-cursor" />

  return (
    <div className="l-voll">
      <header className="l-voll-kopf">
        <button type="button" className="l-x-gross" aria-label="Schließen" onClick={schliessen}>
          <IconClose />
        </button>
        <div className="l-voll-titel">
          <b>
            {k.symbol} · {getippt.length} {getippt.length === 1 ? 'Stelle' : 'Stellen'}
          </b>
          {uhrAn ? <Laufuhr zeit={zeit} laeuft={!ende} format={uhr} /> : null}
        </div>
        {ende ? (
          <span />
        ) : (
          <button type="button" className="l-link" onClick={fertig}>
            Fertig
          </button>
        )}
      </header>

      <div className="l-aufsagen" ref={ziffernRef} aria-live="polite">
        <p className="l-konst-vor">{k.name}</p>
        {lang ? (
          <>
            <p className="l-konst-kopf">{k.vor}</p>
            <div className="l-ziffern">
              {Array.from({ length: reihen }, (_, r) => {
                const text = getippt.slice(r * 10, r * 10 + 10)
                const hierMarke = markePlatz >= r * 10 && markePlatz < r * 10 + 10
                return (
                  <div className="l-ziffern-zeile" key={r}>
                    <span className="ab">{r * 10 + 1}</span>
                    <span className="z">
                      {fuenfer(text)}
                      {hierMarke && text.length === 5 ? ' ' : ''}
                      {hierMarke ? marke : null}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className="l-konst-kurz">
            {k.vor}
            <span className="getippt">{mitKomma(k, getippt)}</span>
            {ende?.fehler ? <em>{ende.fehler.ist}</em> : null}
            {!ende ? <i className="l-cursor" /> : null}
            <span className="rest">{'_'.repeat(Math.max(0, k.ziffern.length - getippt.length - (ende?.fehler ? 1 : 0)))}</span>{' '}
            <span className="nach">
              {k.exponent ? (
                <>
                  · 10<sup>{k.exponent}</sup>{' '}
                </>
              ) : null}
              {k.einheit}
            </span>
          </p>
        )}
      </div>

      {ende ? (
        <div className="l-konst-ende">
          <p className="l-konst-zahl">
            <b className="l-num">{ende.stellen}</b> {ende.stellen === 1 ? 'Stelle' : 'Stellen'}
          </p>
          {ende.neuerRekord ? <p className="l-rekord">Neuer Rekord{ende.vorher ? ` – vorher ${ende.vorher}` : ''}.</p> : null}
          <p className="l-s2">
            {ende.fehler
              ? `Stelle ${ende.stellen + 1}: richtig wäre ${ende.fehler.soll}, getippt ${ende.fehler.ist}.`
              : ende.stellen === k.ziffern.length
                ? `Alle ${k.ziffern.length} Stellen richtig!`
                : 'Aufgehört.'}
          </p>
          {ende.stellen < k.ziffern.length ? (
            <p className="l-weiter">
              <span className="l-s3">So geht es weiter</span>
              <span className="l-num">{fuenfer(weiter(k, ende.stellen, 10))}</span>
            </p>
          ) : null}
          <div className="l-knoepfe">
            <button type="button" className="l-btn" onClick={nochmal}>
              Nochmal
            </button>
            <button type="button" className="l-btn sek" onClick={onSchliessen}>
              Fertig
            </button>
          </div>
        </div>
      ) : (
        <div className="l-tastatur">
          <Ziffernblock onZiffer={tippe} />
        </div>
      )}
    </div>
  )
}
