import { useRef, useState } from 'react'
import { IconRight } from '../icons'
import { ablegen, LEER } from '../store'
import { anzahl as anzahlText, imStapelZuTitel, istGewaehlt, passendeTitel, wann } from '../text'
import { fokusBleibt, Leiste } from '../ui'
import type { Entwurf, Notiz } from '../types'

interface Props {
  entwurf: Entwurf
  setEntwurf: (e: Entwurf) => void
  vorschlaege: string[]
  notizen: Notiz[]
  onAbgelegt: () => void
  onStapel: () => void
}

// Startseite: Titel und Notiz schreiben, ablegen - weg ist sie. Das Blatt
// fliegt Richtung Stapel-Knopf, darunter liegt schon ein leeres.
function Schreiben({ entwurf, setEntwurf, vorschlaege, notizen, onAbgelegt, onStapel }: Props) {
  const [flug, setFlug] = useState<{ key: string; titel: string; text: string } | null>(null)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const leer = !entwurf.titel.trim() && !entwurf.text.trim()
  const passend = passendeTitel(vorschlaege, entwurf.titel)
  const anzahl = notizen.length

  // Was zu diesem Titel schon im Stapel liegt: erst nur als Zeile, ein Tipp
  // klappt es auf. Passt der Titel nicht mehr, ist die Liste von selbst zu.
  const schon = imStapelZuTitel(notizen, entwurf.titel)
  const [schonOffen, setSchonOffen] = useState(false)
  const zeigeSchon = schonOffen && schon.length > 0

  const ablegenJetzt = () => {
    const notiz = ablegen(entwurf)
    if (!notiz) return
    // Tastatur zu: man soll sehen, dass das Blatt weg ist.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur()
    setFlug({ key: notiz.id, titel: notiz.titel, text: notiz.text })
    setEntwurf(LEER)
    setSchonOffen(false)
    onAbgelegt()
  }

  // Ein anderer Titel klappt die Liste "Schon im Stapel" wieder zu.
  const setTitel = (titel: string) => {
    setEntwurf({ ...entwurf, titel })
    setSchonOffen(false)
  }

  // Vorschlag antippen setzt den Titel und springt in die Notiz; der schon
  // gewaehlte nimmt ihn wieder heraus.
  const waehle = (t: string) => {
    if (istGewaehlt(t, entwurf.titel)) {
      setTitel('')
      return
    }
    setTitel(t)
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
              onChange={(e) => setTitel(e.target.value)}
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
            {schon.length ? (
              <div className={`s-schon${zeigeSchon ? ' offen' : ''}`}>
                <button
                  type="button"
                  className="s-schon-zeile"
                  aria-expanded={zeigeSchon}
                  onMouseDown={fokusBleibt}
                  onClick={() => setSchonOffen(!zeigeSchon)}
                >
                  <span>Schon im Stapel: {anzahlText(schon.length)}</span>
                  <span className="s-schon-was">{zeigeSchon ? 'Ausblenden' : 'Zeigen'}</span>
                </button>
                {zeigeSchon ? (
                  <ol className="s-schon-liste">
                    {schon.map((n) => (
                      <li key={n.id}>
                        <span className="s-schon-zeit">{wann(n.erstellt)}</span>
                        <span className={`s-schon-text${n.text ? '' : ' ohne'}`}>{n.text || 'Nur der Titel'}</span>
                      </li>
                    ))}
                  </ol>
                ) : null}
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
