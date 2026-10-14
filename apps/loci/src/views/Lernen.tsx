import { useEffect, useState, type ReactNode } from 'react'
import { IconClose, IconLeft, IconRight } from '../icons'
import { blockBis, istLang, lernStart, type KFehler, type Konstante } from '../konstanten'
import { Ziffernblock, useWegziehen } from '../ui'
import type { KVersuch } from '../types'
import Aufsagen from './Aufsagen'

// Konstante lernen statt nur abfragen, Block fuer Block (10 Stellen, eine
// Zeile wie beim Aufsagen): ansehen, verdecken, aus dem Kopf tippen. Ein
// Fehler zeigt sofort die richtige Ziffer, dann wird nochmal angesehen. Sitzt
// der Block, geht es von vorn bis zu seinem Ende (Aufsagen, streng) - erst das
// zaehlt als Durchgang und hebt den Rekord, und danach kommt der naechste.
// Los geht es beim Block nach dem Rekord, mit den Pfeilen auch anderswo.
// Kurze Konstanten (Physik) sind ein einziger Block.

export default function Lernen({
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
  const [ab, setAb] = useState(() => lernStart(k, rekord))
  const [kette, setKette] = useState(false)
  // Zaehlt mit, damit derselbe Block nochmal frisch anfaengt.
  const [runde, setRunde] = useState(0)

  const zuBlock = (neu: number) => {
    setAb(neu)
    setKette(false)
    setRunde((r) => r + 1)
  }

  if (kette) {
    return (
      <Aufsagen
        key={`kette:${ab}`}
        k={k}
        rekord={rekord}
        uhrAn={uhrAn}
        streng
        bis={blockBis(k, ab)}
        lernen={zuBlock}
        onSpeichern={onSpeichern}
        onSchliessen={onSchliessen}
      />
    )
  }
  return (
    <Block
      key={`${ab}:${runde}`}
      k={k}
      ab={ab}
      rekord={rekord}
      onBlock={zuBlock}
      onKette={() => setKette(true)}
      onSpeichern={onSpeichern}
      onSchliessen={onSchliessen}
    />
  )
}

type Phase = 'ansehen' | 'tippen' | 'sitzt'

function Block({
  k,
  ab,
  rekord,
  onBlock,
  onKette,
  onSpeichern,
  onSchliessen,
}: {
  k: Konstante
  ab: number
  rekord: number
  onBlock: (ab: number) => void
  onKette: () => void
  onSpeichern: (v: KVersuch) => void
  onSchliessen: () => void
}) {
  const lang = istLang(k)
  const bis = blockBis(k, ab)
  const letzter = lernStart(k, k.ziffern.length)
  const [phase, setPhase] = useState<Phase>('ansehen')
  // So viele Stellen des Blocks sind richtig getippt - eine falsche beendet das Tippen.
  const [n, setN] = useState(0)
  const [fehler, setFehler] = useState<KFehler | null>(null)
  const [start, setStart] = useState(0)
  const [neuerRekord, setNeuerRekord] = useState(false)
  // Beim Lernen geht nichts verloren - wegziehen schliesst sofort.
  useWegziehen(true, onSchliessen)

  const verdecken = () => {
    setPhase('tippen')
    setN(0)
    setFehler(null)
    setStart(Date.now())
  }

  const tippe = (z: string) => {
    if (phase !== 'tippen' || fehler) return
    const i = ab + n
    if (z !== k.ziffern[i]) {
      setFehler({ stelle: i, ist: z, soll: k.ziffern[i] })
      return
    }
    setN(n + 1)
    if (ab + n + 1 < bis) return
    // Der erste Block ist schon "von vorn" - er zaehlt gleich als Durchgang.
    if (ab === 0) {
      setNeuerRekord(bis > rekord)
      onSpeichern({ k: k.id, stellen: bis, ende: Date.now(), dauer: Date.now() - start, fehler: false })
    }
    setPhase('sitzt')
  }

  const weiter = () => {
    if (phase === 'ansehen') verdecken()
    else if (fehler) setPhase('ansehen')
    else if (phase === 'sitzt') {
      if (ab > 0) onKette()
      else if (bis < k.ziffern.length) onBlock(bis)
      else onBlock(0)
    }
  }

  // Tasten am Rechner: Ziffern, Enter = weiter, Pfeile = anderer Block, Esc = schliessen.
  useEffect(() => {
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      if (ev.target instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (/^\d$/.test(ev.key)) tippe(ev.key)
      else if (ev.key === 'Enter') weiter()
      else if (ev.key === 'ArrowLeft' && phase === 'ansehen' && ab > 0) onBlock(ab - 10)
      else if (ev.key === 'ArrowRight' && phase === 'ansehen' && ab < letzter) onBlock(ab + 10)
      else if (ev.key === 'Escape') onSchliessen()
      else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  // Die Stellen des Blocks: beim Ansehen alle, beim Tippen die richtig
  // getippten, dann Cursor und Luecken. Eine falsche Ziffer steht rot da, die
  // richtige klein darunter.
  const stellen: ReactNode[] = []
  for (let i = ab; i < bis; i++) {
    const r = i - ab
    if (lang && r === 5) stellen.push(' ')
    if (!lang && k.komma && i === k.komma) stellen.push(',')
    if (fehler?.stelle === i) {
      stellen.push(
        <em key={i} data-soll={fehler.soll} aria-label={`${fehler.ist}, richtig wäre ${fehler.soll}`}>
          {fehler.ist}
        </em>,
      )
    } else if (phase !== 'tippen' || r < n) stellen.push(k.ziffern[i])
    else {
      if (r === n && !fehler) stellen.push(<i key="cursor" className="l-cursor" />)
      stellen.push(
        <span key={i} className="rest">
          _
        </span>,
      )
    }
  }
  const fuenfer = (t: string) => `${t.slice(0, 5)} ${t.slice(5)}`

  return (
    <div className="l-voll">
      <header className="l-voll-kopf">
        <button type="button" className="l-x-gross" aria-label="Schließen" onClick={onSchliessen}>
          <IconClose />
        </button>
        <div className="l-voll-titel">
          <b>{k.symbol} · Lernen</b>
          <span className="l-num">{lang ? `Stellen ${ab + 1}–${bis}` : `${k.ziffern.length} Stellen`}</span>
        </div>
        <span />
      </header>

      <div className="l-aufsagen l-lernen" aria-live="polite">
        <p className="l-konst-vor">{k.name}</p>
        {lang ? (
          <>
            <p className="l-konst-kopf">{k.vor}</p>
            <div className="l-ziffern">
              {ab >= 10 ? (
                <div className="l-ziffern-zeile davor">
                  <span className="ab">{ab - 9}</span>
                  <span className="z">{fuenfer(k.ziffern.slice(ab - 10, ab))}</span>
                </div>
              ) : null}
              <div className={`l-ziffern-zeile${fehler ? ' mit-fehler' : ''}`}>
                <span className="ab">{ab + 1}</span>
                <span className="z">{stellen}</span>
              </div>
            </div>
          </>
        ) : (
          <p className={`l-konst-kurz${fehler ? ' mit-fehler' : ''}`}>
            {k.vor}
            {stellen}{' '}
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
        {phase === 'ansehen' ? (
          <p className="l-text2">Präg dir die Ziffern ein, dann verdecken und aus dem Kopf tippen.</p>
        ) : phase === 'tippen' && !fehler ? (
          <p className="l-text2">Aus dem Kopf – bei einem Fehler siehst du sie nochmal.</p>
        ) : null}
      </div>

      {phase === 'ansehen' ? (
        <div className="l-voll-fuss">
          {lang ? (
            <button type="button" className="l-btn sek rund" disabled={ab === 0} onClick={() => onBlock(ab - 10)}>
              <IconLeft />
              Davor
            </button>
          ) : (
            <span />
          )}
          <button type="button" className="l-btn rund" onClick={verdecken}>
            Verdecken
          </button>
          {lang ? (
            <button type="button" className="l-btn sek rund" disabled={ab >= letzter} onClick={() => onBlock(ab + 10)}>
              Danach
              <IconRight />
            </button>
          ) : (
            <span />
          )}
        </div>
      ) : phase === 'tippen' && !fehler ? (
        <div className="l-tastatur">
          <Ziffernblock onZiffer={tippe} />
        </div>
      ) : (
        <div className="l-konst-ende">
          {fehler ? (
            <p className="l-konst-fehler">
              <b>
                Stelle {fehler.stelle + 1}: richtig wäre <span className="soll">{fehler.soll}</span>, getippt{' '}
                <span className="ist">{fehler.ist}</span>.
              </b>
            </p>
          ) : (
            <>
              <p className="l-konst-zahl">{lang ? `Stellen ${ab + 1}–${bis} sitzen.` : `Alle ${bis} Stellen sitzen.`}</p>
              {ab > 0 ? (
                <p className="l-s2">Jetzt von vorn bis Stelle {bis} – erst dann sitzt der Block wirklich.</p>
              ) : neuerRekord ? (
                <p className="l-rekord">Neuer Rekord: {bis} Stellen.</p>
              ) : null}
            </>
          )}
          <div className="l-knoepfe">
            <button type="button" className="l-btn" onClick={weiter}>
              {fehler ? 'Nochmal ansehen' : ab > 0 ? 'Von vorn aufsagen' : bis < k.ziffern.length ? 'Nächste 10 lernen' : 'Nochmal'}
            </button>
            <button type="button" className="l-btn sek" onClick={onSchliessen}>
              Fertig
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
