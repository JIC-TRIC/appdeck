import { useCallback, useEffect, useRef, useState } from 'react'
import { useIonAlert } from '@ionic/react'
import { bild } from '../bilder'
import { IconClose, IconLeft, IconRight, IconTakt } from '../icons'
import { KARTE } from '../karten'
import { Laufuhr, useWegziehen } from '../ui'
import { taktText, uhr } from '../util'

// Merken: eine Karte pro Ansicht. Tipp oder Wisch nach links = weiter, nach
// rechts = zurueck. Mit Taktgeber blaettert es von selbst - aber nur an der
// vordersten Karte; wer zurueckblaettert, haelt den Takt an.

const WISCH_PX = 40

export default function Merken({
  deck,
  start,
  uhrAn,
  takt,
  onFertig,
  onAbbrechen,
}: {
  deck: string[]
  start: number
  uhrAn: boolean
  takt: number | null
  onFertig: () => void
  onAbbrechen: () => void
}) {
  const n = deck.length
  const [pos, setPos] = useState(0)
  const [vorne, setVorne] = useState(0)
  const [fragt, setFragt] = useState(false)
  const [frage] = useIonAlert()

  const fertig = useRef(onFertig)
  useEffect(() => {
    fertig.current = onFertig
  }, [onFertig])

  const weiter = useCallback(() => {
    if (pos + 1 >= n) return fertig.current()
    setPos(pos + 1)
    setVorne((v) => Math.max(v, pos + 1))
  }, [pos, n])
  const zurueck = useCallback(() => setPos((p) => Math.max(0, p - 1)), [])

  // Der Takt beginnt bei jeder neuen Karte von vorn.
  const taktLaeuft = takt !== null && pos === vorne && !fragt
  useEffect(() => {
    if (!taktLaeuft || takt === null) return
    const id = window.setTimeout(weiter, takt * 1000)
    return () => window.clearTimeout(id)
  }, [taktLaeuft, takt, weiter])

  const abbrechen = () => {
    setFragt(true)
    frage({
      header: 'Übung abbrechen?',
      message: 'Der Versuch wird nicht gespeichert.',
      cssClass: 'l-alert',
      buttons: [
        { text: 'Weiter merken', role: 'cancel' },
        { text: 'Abbrechen', role: 'destructive', handler: onAbbrechen },
      ],
      onDidDismiss: () => setFragt(false),
    })
  }
  // Nach unten wegziehen fragt genauso nach wie das Kreuz.
  useWegziehen(false, () => {
    if (!fragt) abbrechen()
  })

  // Tasten am Rechner: → Leertaste Enter = weiter, ← = zurueck, Esc = abbrechen.
  useEffect(() => {
    if (fragt) return
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      if (ev.target instanceof HTMLButtonElement && (ev.key === 'Enter' || ev.key === ' ')) return
      if (ev.key === 'ArrowRight' || ev.key === ' ' || ev.key === 'Enter') weiter()
      else if (ev.key === 'ArrowLeft') zurueck()
      else if (ev.key === 'Escape') abbrechen()
      else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  // Wischen: per Pointer, damit Maus und Finger gleich gehen. Ein Wisch
  // schluckt den Klick, der danach vielleicht noch kommt.
  const beruehrt = useRef<{ x: number; y: number } | null>(null)
  const gewischt = useRef(false)

  const zeit = useCallback(() => Date.now() - start, [start])
  const id = deck[pos]
  const letzte = pos + 1 >= n

  return (
    <div className="l-voll">
      <header className="l-voll-kopf">
        <button type="button" className="l-x-gross" aria-label="Abbrechen" onClick={abbrechen}>
          <IconClose />
        </button>
        <div className="l-voll-titel">
          <b>
            Karte {pos + 1} von {n}
          </b>
          {uhrAn ? <Laufuhr zeit={zeit} laeuft format={uhr} /> : null}
        </div>
        <button type="button" className="l-link" onClick={onFertig}>
          Fertig
        </button>
      </header>
      <div className="l-fortschritt">
        <i style={{ width: `${(100 * (pos + 1)) / n}%` }} />
      </div>

      <button
        type="button"
        className="l-tisch"
        aria-label={`${KARTE[id].name}. Weiter`}
        onPointerDown={(e) => {
          beruehrt.current = { x: e.clientX, y: e.clientY }
          gewischt.current = false
        }}
        onPointerUp={(e) => {
          const b = beruehrt.current
          beruehrt.current = null
          if (!b) return
          const dx = e.clientX - b.x
          const dy = e.clientY - b.y
          if (Math.abs(dx) > WISCH_PX && Math.abs(dx) > Math.abs(dy)) {
            gewischt.current = true
            if (dx < 0) weiter()
            else zurueck()
          }
        }}
        onClick={() => {
          if (gewischt.current) {
            gewischt.current = false
            return
          }
          weiter()
        }}
      >
        <img src={bild(id)} alt="" draggable={false} />
      </button>

      {takt !== null ? (
        <div className="l-takt">
          <div className="l-takt-zeile">
            <span className="l-takt-name">
              <IconTakt />
              Takt {taktText(takt)}
            </span>
            {taktLaeuft ? null : <span>Takt angehalten</span>}
          </div>
          <div className="l-takt-bahn">
            <i key={`${pos}:${taktLaeuft}`} className={taktLaeuft ? 'laeuft' : ''} style={{ animationDuration: `${takt}s` }} />
          </div>
        </div>
      ) : null}

      <div className="l-voll-fuss">
        <button type="button" className="l-btn sek rund" disabled={pos === 0} onClick={zurueck}>
          <IconLeft />
          Zurück
        </button>
        <span />
        <button type="button" className="l-btn rund" onClick={weiter}>
          {letzte ? 'Fertig' : 'Weiter'}
          <IconRight />
        </button>
      </div>
    </div>
  )
}
