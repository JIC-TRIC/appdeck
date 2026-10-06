import { useRef, useState } from 'react'
import { IconRight } from '../icons'
import { ablegen, LEER } from '../store'
import { istGewaehlt, passendeTitel } from '../text'
import { fokusBleibt, Leiste } from '../ui'
import type { Entwurf } from '../types'

interface Props {
  entwurf: Entwurf
  setEntwurf: (e: Entwurf) => void
  vorschlaege: string[]
  anzahl: number
  onAbgelegt: () => void
  onStapel: () => void
}

// Startseite: Titel und Notiz schreiben, ablegen - weg ist sie. Das Blatt
// fliegt Richtung Stapel-Knopf, darunter liegt schon ein leeres.
function Schreiben({ entwurf, setEntwurf, vorschlaege, anzahl, onAbgelegt, onStapel }: Props) {
  const [flug, setFlug] = useState<{ key: string; titel: string; text: string } | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const leer = !entwurf.titel.trim() && !entwurf.text.trim()
  const passend = passendeTitel(vorschlaege, entwurf.titel)

  const ablegenJetzt = () => {
    const notiz = ablegen(entwurf)
    if (!notiz) return
    // Tastatur zu: man soll sehen, dass das Blatt weg ist.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setFlug({ key: notiz.id, titel: notiz.titel, text: notiz.text })
    setEntwurf(LEER)
    onAbgelegt()
  }

  // Vorschlag antippen setzt den Titel und springt in die Notiz; der schon
  // gewaehlte nimmt ihn wieder heraus.
  const waehle = (t: string) => {
    if (istGewaehlt(t, entwurf.titel)) {
      setEntwurf({ ...entwurf, titel: '' })
      return
    }
    setEntwurf({ ...entwurf, titel: t })
    textRef.current?.focus()
  }

  return (
    <div className="s-screen">
      <Leiste
        zurueck="Apps"
        rechts={
          <button type="button" className={`s-zum-stapel${anzahl ? '' : ' leer'}`} onClick={onStapel}>
            Stapel
            {anzahl ? (
              <span key={flug?.key ?? 'ruhe'} className={`s-zahl${flug ? ' neu' : ''}`}>
                {anzahl}
              </span>
            ) : null}
            <IconRight />
          </button>
        }
      />

      <div className="s-schreiben">
        <h1 className="s-marke">Stash</h1>

        <div className="s-blatt-platz">
          <div className="s-blatt">
            <input
              className="s-titel"
              value={entwurf.titel}
              onChange={(e) => setEntwurf({ ...entwurf, titel: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  textRef.current?.focus()
                }
              }}
              placeholder="Titel"
              aria-label="Titel"
              enterKeyHint="next"
              autoCapitalize="sentences"
              autoComplete="off"
              maxLength={120}
            />
            {passend.length ? (
              <div className="s-chips" aria-label="Zuletzt benutzte Titel">
                {passend.map((t) => {
                  const an = istGewaehlt(t, entwurf.titel)
                  return (
                    <button
                      key={t}
                      type="button"
                      className={`s-chip${an ? ' an' : ''}`}
                      aria-pressed={an}
                      onMouseDown={fokusBleibt}
                      onClick={() => waehle(t)}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
            ) : null}
            <textarea
              ref={textRef}
              className="s-text"
              value={entwurf.text}
              onChange={(e) => setEntwurf({ ...entwurf, text: e.target.value })}
              onKeyDown={(e) => {
                // Am Rechner: Strg/Cmd + Enter legt ab.
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  ablegenJetzt()
                }
              }}
              aria-label="Notiz"
              autoCapitalize="sentences"
            />
          </div>

          {flug ? (
            <div key={flug.key} className="s-blatt s-flug" aria-hidden="true" onAnimationEnd={() => setFlug(null)}>
              <div className={`s-titel${flug.titel ? '' : ' leer'}`}>{flug.titel || 'Titel'}</div>
              <div className="s-text">{flug.text}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="s-unten">
        <button type="button" className="s-haupt" disabled={leer} onMouseDown={fokusBleibt} onClick={ablegenJetzt}>
          Ablegen
        </button>
      </div>

      <p className="s-unsichtbar" aria-live="polite">
        {flug ? 'Abgelegt' : ''}
      </p>
    </div>
  )
}

export default Schreiben
