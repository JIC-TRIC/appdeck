import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useIonAlert } from '@ionic/react'
import { IconClose } from '../icons'
import { istLang, pruefe, weiter, type KFehler, type Konstante } from '../konstanten'
import { Laufuhr, Ziffernblock, useWegziehen } from '../ui'
import { uhr } from '../util'
import type { KVersuch } from '../types'

// Aufsagen: Ziffer fuer Ziffer. ⌫ nimmt die letzte Ziffer zurueck, wenn man
// sich vertippt hat - gewertet wird nur, was am Ende dasteht.
// Ein Fehler beendet nichts und ist beim Tippen nicht zu sehen - weiter geht es
// bis "Fertig" oder bis alle Stellen getippt sind. Danach stehen die falschen
// Stellen rot da, die richtige Ziffer klein darunter. Fuer den Rekord zaehlen
// die Stellen bis zum ersten Fehler.

interface Ende {
  /** richtige Stellen bis zum ersten Fehler */
  stellen: number
  /** alle getippten Ziffern */
  getippt: number
  fehler: KFehler[]
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
  const lang = istLang(k)

  const beende = (text: string) => {
    const { bisFehler, fehler } = pruefe(k, text)
    const dauer = Date.now() - start
    const v: KVersuch = { k: k.id, stellen: bisFehler, ende: Date.now(), dauer, fehler: fehler.length > 0 }
    onSpeichern(v)
    setEnde({
      stellen: bisFehler,
      getippt: text.length,
      fehler,
      dauer,
      neuerRekord: bisFehler > vorher && bisFehler > 0,
      vorher,
    })
  }

  const tippe = (z: string) => {
    if (ende) return
    const neu = getippt + z
    setGetippt(neu)
    if (neu.length === k.ziffern.length) beende(neu)
  }

  const loesche = () => {
    if (!ende) setGetippt((t) => t.slice(0, -1))
  }

  const fertig = () => {
    if (!ende) beende(getippt)
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
  // Nach unten wegziehen wie das Kreuz: ohne Ziffern oder fertig sofort zu,
  // sonst erst die Rueckfrage.
  useWegziehen(!!ende || !getippt, schliessen)

  // Die neueste Zeile bleibt sichtbar. Am Ende steht der erste Fehler im Bild.
  useLayoutEffect(() => {
    const el = ziffernRef.current
    if (!el) return
    const erster = ende?.fehler.length ? el.querySelector('em') : null
    if (erster) el.scrollTop += erster.getBoundingClientRect().top - el.getBoundingClientRect().top - el.clientHeight / 3
    else el.scrollTop = el.scrollHeight
  }, [getippt, ende])

  // Tasten am Rechner: Ziffern, ⌫, Enter = fertig bzw. nochmal, Esc = schliessen.
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      if (ev.target instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (/^\d$/.test(ev.key)) tippe(ev.key)
      else if (ev.key === 'Backspace') loesche()
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
  // Platzhaltern. Der Cursor belegt beim Tippen den naechsten Platz.
  const cursorPlatz = ende ? -1 : getippt.length
  const reihen = Math.max(1, Math.ceil((getippt.length + (ende ? 0 : 1)) / 10))
  const fuenfer = (t: string) => (t.length > 5 ? `${t.slice(0, 5)} ${t.slice(5)}` : t)
  const falsch = new Map((ende?.fehler ?? []).map((f) => [f.stelle, f.soll]))
  const erster = ende?.fehler[0]
  const weitere = ende ? ende.fehler.slice(1) : []

  return (
    <div className="l-voll">
      <header className="l-voll-kopf">
        <button type="button" className="l-x-gross" aria-label="Schließen" onClick={schliessen}>
          <IconClose />
        </button>
        <div className="l-voll-titel">
          <b>
            {k.symbol} · {getippt.length} {erster ? 'getippt' : getippt.length === 1 ? 'Stelle' : 'Stellen'}
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

      <div className="l-aufsagen ion-content-scroll-host" ref={ziffernRef} aria-live="polite">
        <p className="l-konst-vor">{k.name}</p>
        {lang ? (
          <>
            <p className="l-konst-kopf">{k.vor}</p>
            <div className="l-ziffern">
              {Array.from({ length: reihen }, (_, r) => {
                const text = getippt.slice(r * 10, r * 10 + 10)
                const hierCursor = cursorPlatz >= r * 10 && cursorPlatz < r * 10 + 10
                const mitFehler = [...text].some((_, i) => falsch.has(r * 10 + i))
                return (
                  <div className={`l-ziffern-zeile${mitFehler ? ' mit-fehler' : ''}`} key={r}>
                    <span className="ab">{r * 10 + 1}</span>
                    <span className="z">
                      {mitFehler ? markiert(text, r * 10, falsch, (i) => (i === 5 ? ' ' : '')) : fuenfer(text)}
                      {hierCursor && text.length === 5 ? ' ' : ''}
                      {hierCursor ? <i className="l-cursor" /> : null}
                    </span>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          <p className={`l-konst-kurz${falsch.size ? ' mit-fehler' : ''}`}>
            {k.vor}
            <span className="getippt">{markiert(getippt, 0, falsch, (i) => (k.komma && i === k.komma ? ',' : ''))}</span>
            {!ende ? <i className="l-cursor" /> : null}
            <span className="rest">{'_'.repeat(Math.max(0, k.ziffern.length - getippt.length))}</span>{' '}
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
            {erster ? ' bis zum ersten Fehler' : ''}
          </p>
          {ende.neuerRekord ? <p className="l-rekord">Neuer Rekord{ende.vorher ? ` – vorher ${ende.vorher}` : ''}.</p> : null}
          {erster ? (
            <p className="l-konst-fehler">
              <b>
                Stelle {erster.stelle + 1}: richtig wäre <span className="soll">{erster.soll}</span>, getippt{' '}
                <span className="ist">{erster.ist}</span>.
              </b>
              {ende.getippt > erster.stelle + 1 ? (
                <span className="l-s2">{danach(ende.getippt - erster.stelle - 1, weitere)}</span>
              ) : null}
            </p>
          ) : (
            <p className="l-s2">
              {ende.getippt === k.ziffern.length
                ? `Alle ${k.ziffern.length} Stellen richtig!`
                : ende.getippt
                  ? 'Aufgehört, alles richtig.'
                  : 'Aufgehört.'}
            </p>
          )}
          {ende.getippt < k.ziffern.length ? (
            <p className="l-weiter">
              <span className="l-s3">So geht es weiter</span>
              <span className="l-num">{fuenfer(weiter(k, ende.getippt, 10))}</span>
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
          <Ziffernblock onZiffer={tippe} onLoeschen={loesche} />
        </div>
      )}
    </div>
  )
}

/** Ziffern mit Trennzeichen (Luecke bzw. Komma vor einer Stelle); falsche
 *  Stellen rot, die richtige Ziffer steht per CSS klein darunter (data-soll). */
function markiert(text: string, ab: number, falsch: Map<number, string>, trenner: (i: number) => string) {
  const teile: ReactNode[] = []
  let lauf = ''
  for (let i = 0; i < text.length; i++) {
    lauf += trenner(i)
    const soll = falsch.get(ab + i)
    if (soll === undefined) {
      lauf += text[i]
      continue
    }
    if (lauf) teile.push(lauf)
    lauf = ''
    teile.push(
      <em key={ab + i} data-soll={soll} aria-label={`${text[i]}, richtig wäre ${soll}`}>
        {text[i]}
      </em>,
    )
  }
  if (lauf) teile.push(lauf)
  return teile
}

/** Was nach dem ersten Fehler kam: "Danach noch 9 Stellen getippt, alle richtig." */
function danach(nachher: number, weitere: KFehler[]) {
  const getippt = `Danach noch ${nachher} ${nachher === 1 ? 'Stelle' : 'Stellen'} getippt`
  if (!weitere.length) return `${getippt}, ${nachher === 1 ? 'richtig' : 'alle richtig'}.`
  const stellen = weitere.slice(0, 5).map((f) => f.stelle + 1)
  const liste =
    weitere.length > 5
      ? `${stellen.join(', ')} …`
      : stellen.length > 1
        ? `${stellen.slice(0, -1).join(', ')} und ${stellen[stellen.length - 1]}`
        : `${stellen[0]}`
  return `${getippt}, ${weitere.length === 1 ? 'ein weiterer Fehler' : `${weitere.length} weitere Fehler`}: Stelle ${liste}.`
}
