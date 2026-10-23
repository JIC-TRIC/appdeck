import { useLayoutEffect, useRef, useState } from 'react'
import { EINGANG_FARBE, farbe } from '../farben'
import { IconHaken, IconRight } from '../icons'
import { aendere, NOTIZ_MAX, TITEL_MAX } from '../store'
import { angelegtText, tagLang, wannKurz } from '../tage'
import { Blatt, BlattKopf, DatumChips, mitFarbe } from '../ui'
import { OrdnerWahl } from './OrdnerWahl'
import type { Zaehlung } from '../liste'
import type { Ordner, Todo } from '../types'

interface Props {
  todo: Todo
  /** Haken gesetzt (gerade abgehakt oder erledigt) */
  an: boolean
  ordner: Ordner[]
  zaehlung: Zaehlung
  heute: string
  onHaken: () => void
  onGeaendert: () => void
  onLoeschen: () => void
  onClose: () => void
}

function passe(el: HTMLTextAreaElement) {
  el.style.height = 'auto'
  if (el.scrollHeight) el.style.height = `${el.scrollHeight}px`
}

/**
 * Textfeld, das mit seinem Inhalt waechst. Im noch nicht gezeigten Blatt
 * misst es falsch - darum misst das Blatt noch einmal, wenn es oben steht.
 */
function useWachsen(wert: string) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    if (ref.current) passe(ref.current)
  }, [wert])
  return ref
}

// Ein Todo als Blatt: Titel und Notiz direkt bearbeitbar, darunter Ordner und
// Faellig. Jede Aenderung gilt sofort, es gibt keinen Sichern-Knopf.
export function TodoBlatt({ todo, an, ordner, zaehlung, heute, onHaken, onGeaendert, onLoeschen, onClose }: Props) {
  const [titel, setTitel] = useState(todo.titel)
  const [notiz, setNotiz] = useState(todo.notiz)
  const [wahl, setWahl] = useState(false)
  const titelRef = useWachsen(titel)
  const notizRef = useWachsen(notiz)
  const nachher = useRef<(() => void) | null>(null)
  const ord = ordner.find((o) => o.id === todo.ordner)
  const f = ord ? farbe(ord.farbe) : EINGANG_FARBE

  const setze = (a: Parameters<typeof aendere>[1]) => {
    aendere(todo.id, a)
    onGeaendert()
  }

  return (
    <Blatt
      label="Todo"
      onPresent={() => {
        if (titelRef.current) passe(titelRef.current)
        if (notizRef.current) passe(notizRef.current)
      }}
      onClose={() => {
        onClose()
        nachher.current?.()
      }}
    >
      {(schliessen) => (
        <div className="t-td" style={mitFarbe(f)}>
          <BlattKopf
            rechts={
              <button type="button" className="t-text-knopf stark" onClick={schliessen}>
                Fertig
              </button>
            }
          />
          <div className="t-td-titel">
            <button type="button" className={`t-ck gross${an ? ' an' : ''}`} aria-pressed={an} aria-label={an ? 'Haken zurücknehmen' : 'Abhaken'} onClick={onHaken}>
              {an ? <IconHaken /> : null}
            </button>
            <textarea
              ref={titelRef}
              rows={1}
              value={titel}
              maxLength={TITEL_MAX}
              aria-label="Titel"
              enterKeyHint="done"
              autoCapitalize="sentences"
              onChange={(e) => {
                // Eine Zeile: Zeilenumbrueche aus dem Einfuegen werden Leerzeichen.
                const v = e.target.value.replace(/\n/g, ' ')
                setTitel(v)
                if (v.trim()) setze({ titel: v })
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.currentTarget.blur()
                }
              }}
              onBlur={() => {
                if (!titel.trim()) setTitel(todo.titel)
              }}
            />
          </div>
          <textarea
            ref={notizRef}
            className="t-td-notiz"
            rows={2}
            value={notiz}
            maxLength={NOTIZ_MAX}
            placeholder="Notiz"
            aria-label="Notiz"
            autoCapitalize="sentences"
            onChange={(e) => {
              setNotiz(e.target.value)
              setze({ notiz: e.target.value })
            }}
          />

          <div className="t-grp">
            <button type="button" className="t-li" onClick={() => setWahl(true)}>
              Ordner
              <span className="v">
                <i />
                {ord?.name ?? 'Eingang'}
                <IconRight />
              </span>
            </button>
            <div className="t-li">
              Fällig
              <span className="v">{todo.faellig ? tagLang(todo.faellig, heute) : 'Ohne Datum'}</span>
            </div>
            <div className="t-li chrow">
              <DatumChips wert={todo.faellig} heute={heute} ohne onWahl={(tag) => setze({ faellig: tag })} />
            </div>
          </div>

          <p className="t-td-meta">
            {angelegtText(todo.angelegt, heute)}
            {todo.erledigt ? ` · erledigt ${wannKurz(todo.erledigt, heute)}` : ''}
          </p>

          <button
            type="button"
            className="t-gefahr"
            onClick={() => {
              nachher.current = onLoeschen
              schliessen()
            }}
          >
            Löschen
          </button>

          {wahl ? (
            <OrdnerWahl
              titel="Ordner"
              unter={todo.titel}
              aktuell={ord ? ord.id : null}
              ordner={ordner}
              zaehlung={zaehlung}
              onWahl={(id) => setze({ ordner: id })}
              onClose={() => setWahl(false)}
            />
          ) : null}
        </div>
      )}
    </Blatt>
  )
}
