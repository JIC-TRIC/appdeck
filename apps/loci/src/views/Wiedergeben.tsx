import { useCallback, useEffect, useRef, useState } from 'react'
import { useIonAlert, type AlertOptions } from '@ionic/react'
import { IconClose, IconLoeschen } from '../icons'
import { FARBEN, KARTE, WERTE, kartenId, lege, loesche, type Stand } from '../karten'
import { Laufuhr, Mini, useWegziehen } from '../ui'
import { uhr } from '../util'

// Wiedergeben mit der Kartentastatur: Wert und Farbe in beliebiger Reihenfolge,
// dann liegt die Karte an der aktiven Stelle. Alle Karten bleiben waehlbar -
// sonst verraet die Tastatur gegen Ende, was noch fehlt.

interface Wahl {
  wert?: string
  farbe?: string
}

export default function Wiedergeben({
  n,
  start,
  uhrAn,
  onAbgeben,
  onAbbrechen,
}: {
  n: number
  start: number
  uhrAn: boolean
  onAbgeben: (antworten: Stand['antworten']) => void
  onAbbrechen: () => void
}) {
  const [stand, setStand] = useState<Stand>(() => ({ antworten: Array(n).fill(null), aktiv: 0 }))
  const [wahl, setWahl] = useState<Wahl>({})
  const [fragt, setFragt] = useState(false)
  const [frage] = useIonAlert()
  const leiste = useRef<HTMLDivElement>(null)

  const belegt = stand.antworten.filter(Boolean).length
  const voll = stand.aktiv >= n
  const aktivId = voll ? null : stand.antworten[stand.aktiv]

  // Die aktive Stelle steht in der Mitte der Leiste.
  useEffect(() => {
    const el = leiste.current?.children[Math.min(stand.aktiv, n - 1)] as HTMLElement | undefined
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [stand.aktiv, n])

  const nimm = (teil: Wahl) => {
    const w = { ...wahl, ...teil }
    if (w.wert && w.farbe) {
      setStand((s) => lege(s, kartenId(w.farbe!, w.wert!)))
      setWahl({})
    } else setWahl(w)
  }
  const loeschTaste = () => {
    if (wahl.wert || wahl.farbe) setWahl({})
    else setStand(loesche)
  }
  const stelle = (i: number) => {
    setStand((s) => ({ ...s, aktiv: i }))
    setWahl({})
  }

  const frag = (opts: AlertOptions) => {
    setFragt(true)
    frage({ ...opts, cssClass: 'l-alert', onDidDismiss: () => setFragt(false) })
  }
  const abgeben = () => {
    const leer = n - belegt
    if (!leer) return onAbgeben(stand.antworten)
    frag({
      header: leer === 1 ? 'Noch 1 Stelle leer' : `Noch ${leer} Stellen leer`,
      message: 'Trotzdem abgeben?',
      buttons: [
        { text: 'Weiter legen', role: 'cancel' },
        { text: 'Abgeben', handler: () => onAbgeben(stand.antworten) },
      ],
    })
  }
  const abbrechen = () =>
    frag({
      header: 'Übung abbrechen?',
      message: 'Der Versuch wird nicht gespeichert.',
      buttons: [
        { text: 'Weiter legen', role: 'cancel' },
        { text: 'Abbrechen', role: 'destructive', handler: onAbbrechen },
      ],
    })
  // Nach unten wegziehen fragt genauso nach wie das Kreuz.
  useWegziehen(false, () => {
    if (!fragt) abbrechen()
  })

  // Tasten am Rechner: ⌫ = loeschen, Enter = abgeben, Esc = abbrechen.
  useEffect(() => {
    if (fragt) return
    const taste = (ev: KeyboardEvent) => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return
      if (ev.target instanceof HTMLButtonElement && ev.key === 'Enter') return
      if (ev.key === 'Backspace') loeschTaste()
      else if (ev.key === 'Enter') abgeben()
      else if (ev.key === 'Escape') abbrechen()
      else return
      ev.preventDefault()
    }
    document.addEventListener('keydown', taste)
    return () => document.removeEventListener('keydown', taste)
  })

  const zeit = useCallback(() => Date.now() - start, [start])
  const farbe = FARBEN.find((f) => f.id === wahl.farbe)
  const wert = WERTE.find((w) => w.id === wahl.wert)
  const halb = !!(wahl.wert || wahl.farbe)

  let vorschauText = `Stelle ${stand.aktiv + 1} · Wert und Farbe antippen`
  if (voll) vorschauText = 'Alle Stellen belegt'
  else if (wahl.wert && !wahl.farbe) vorschauText = `Stelle ${stand.aktiv + 1} · jetzt die Farbe`
  else if (wahl.farbe && !wahl.wert) vorschauText = `Stelle ${stand.aktiv + 1} · jetzt der Wert`
  else if (aktivId) vorschauText = `Stelle ${stand.aktiv + 1} · die nächste Karte ersetzt sie`

  return (
    <div className="l-voll">
      <header className="l-voll-kopf">
        <button type="button" className="l-x-gross" aria-label="Abbrechen" onClick={abbrechen}>
          <IconClose />
        </button>
        <div className="l-voll-titel">
          <b>{voll ? `Alle ${n} belegt` : `Stelle ${stand.aktiv + 1} von ${n}`}</b>
          {uhrAn ? <Laufuhr zeit={zeit} laeuft format={uhr} /> : null}
        </div>
        <button type="button" className="l-link" onClick={abgeben}>
          Abgeben
        </button>
      </header>

      <div className="l-leiste" ref={leiste}>
        {stand.antworten.map((id, i) => {
          const aktiv = i === stand.aktiv
          return (
            <div key={i} className={`l-stelle${aktiv ? ' aktiv' : ''}`}>
              <span className="nr">{i + 1}</span>
              <button
                type="button"
                className={`l-slot${id ? ' belegt' : ''}${aktiv && halb ? ' halb' : ''}`}
                aria-label={`Stelle ${i + 1}: ${id ? KARTE[id].name : 'leer'}${aktiv ? ', ausgewählt' : ''}`}
                onClick={() => stelle(i)}
              >
                {aktiv && halb ? (
                  <span className={`l-halb${farbe?.rot ? ' rot' : ''}`}>
                    <b>{wert?.kurz ?? '·'}</b>
                    <i>{farbe?.symbol ?? '·'}</i>
                  </span>
                ) : id ? (
                  <Mini id={id} />
                ) : null}
              </button>
            </div>
          )
        })}
      </div>

      <div className="l-wieder-info">
        <span>
          {belegt} von {n} gelegt
        </span>
        <span>{aktivId ? `Stelle ${stand.aktiv + 1} wird ersetzt` : 'Antippen = Stelle wählen'}</span>
      </div>

      <div className="l-vorschau" aria-live="polite">
        {voll ? null : aktivId && !halb ? (
          <Mini id={aktivId} className="gross" />
        ) : (
          <span className={`l-vorschau-karte${farbe?.rot ? ' rot' : ''}`}>
            <b>{wert?.kurz ?? '?'}</b>
            <i>{farbe?.symbol ?? '?'}</i>
          </span>
        )}
        <span className="l-s2">{vorschauText}</span>
      </div>

      <div className="l-tastatur">
        <div className="l-werte" role="group" aria-label="Wert">
          {WERTE.map((w) => (
            <button
              key={w.id}
              type="button"
              className="l-taste"
              aria-label={w.name}
              aria-pressed={wahl.wert === w.id}
              disabled={voll}
              onClick={() => nimm({ wert: wahl.wert === w.id ? undefined : w.id })}
            >
              {w.kurz}
            </button>
          ))}
          <button type="button" className="l-taste loeschen" aria-label="Löschen" onClick={loeschTaste}>
            <IconLoeschen />
          </button>
        </div>
        <div className="l-farben" role="group" aria-label="Farbe">
          {FARBEN.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`l-taste farbe${f.rot ? ' rot' : ''}`}
              aria-label={f.name}
              aria-pressed={wahl.farbe === f.id}
              disabled={voll}
              onClick={() => nimm({ farbe: wahl.farbe === f.id ? undefined : f.id })}
            >
              {f.symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
