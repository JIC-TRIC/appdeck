import { useRef, type PointerEvent, type ReactNode } from 'react'
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding } from '@ionic/react'
import { IconHaken, IconMuell, IconNotiz, IconOrdner } from '../icons'
import { faelligArt, faelligText, wannKurz } from '../tage'
import { mitFarbe } from '../ui'
import type { Todo } from '../types'

// So lange gedrueckt halten, dann gilt es als langer Druck (Sortieren).
const LANG_MS = 450

interface Props {
  todo: Todo
  /** Farbe des Ordners - Ring und Fuellung des Kreises */
  farbe: string
  heute: string
  /** Haken gesetzt: gerade abgehakt (steht noch kurz da) oder erledigt */
  an: boolean
  /** rutscht gleich zu „Erledigt“ */
  geht?: boolean
  /** gerade angelegt - leuchtet kurz auf */
  neu?: boolean
  /** Ordner unter dem Titel (in „Fällig“, in der Suche, im Erledigten von „Alle“) */
  ordner?: { name: string; farbe: string }
  titel?: ReactNode
  ausschnitt?: ReactNode
  onHaken: () => void
  onOeffnen: () => void
  /** Wischen nach links: ohne onLoeschen kein Wischen */
  onVerschieben?: () => void
  onLoeschen?: () => void
  /** Langer Druck (schaltet im Ordner das Sortieren ein) */
  onLang?: () => void
}

// Eine Zeile: Kreis zum Abhaken, Titel, darunter Datum, Ordner und ob es eine
// Notiz gibt. Nach links wischen: Verschieben und Loeschen (Ionic, wie in Kontor).
export function Zeile(p: Props) {
  const sliding = useRef<HTMLIonItemSlidingElement>(null)
  const druck = useRef<{ x: number; y: number; timer: number } | null>(null)
  const warLang = useRef(false)
  const erledigt = p.todo.erledigt !== null

  const loslassen = () => {
    if (druck.current) window.clearTimeout(druck.current.timer)
    druck.current = null
  }
  const drueckt = (e: PointerEvent) => {
    if (!p.onLang) return
    warLang.current = false
    loslassen()
    druck.current = {
      x: e.clientX,
      y: e.clientY,
      timer: window.setTimeout(() => {
        druck.current = null
        warLang.current = true
        p.onLang?.()
      }, LANG_MS),
    }
  }
  const bewegt = (e: PointerEvent) => {
    const d = druck.current
    if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) loslassen()
  }

  const meta: ReactNode[] = []
  if (p.todo.faellig && !erledigt) {
    meta.push(
      <span key="f" className={`t-due ${faelligArt(p.todo.faellig, p.heute)}`}>
        {faelligText(p.todo.faellig, p.heute)}
      </span>,
    )
  }
  if (erledigt && p.ordner) meta.push(<span key="e">erledigt {wannKurz(p.todo.erledigt!, p.heute)}</span>)
  if (p.ordner) {
    meta.push(
      <span key="o" className="t-of" style={mitFarbe(p.ordner.farbe)}>
        <i />
        {p.ordner.name}
      </span>,
    )
  }
  if (p.todo.notiz && !p.ausschnitt) {
    meta.push(
      <span key="n" className="t-nt" aria-label="mit Notiz">
        <IconNotiz />
      </span>,
    )
  }

  const zeile = (
    <div
      className={`t-row${p.an ? ' an' : ''}${erledigt ? ' erledigt' : ''}${p.geht ? ' geht' : ''}${p.neu ? ' neu' : ''}`}
      style={mitFarbe(p.farbe)}
      data-id={p.todo.id}
    >
      <button
        type="button"
        className={`t-ck${p.an ? ' an' : ''}`}
        aria-pressed={p.an}
        aria-label={p.an ? `${p.todo.titel}: Haken zurücknehmen` : `${p.todo.titel} abhaken`}
        onClick={p.onHaken}
      >
        {p.an ? <IconHaken /> : null}
      </button>
      <button
        type="button"
        className="t-rt"
        onClick={() => {
          if (warLang.current) {
            warLang.current = false
            return
          }
          p.onOeffnen()
        }}
        onPointerDown={drueckt}
        onPointerMove={bewegt}
        onPointerUp={loslassen}
        onPointerCancel={loslassen}
        onContextMenu={(e) => p.onLang && e.preventDefault()}
      >
        <b>{p.titel ?? p.todo.titel}</b>
        {meta.length ? <small>{meta}</small> : null}
        {p.ausschnitt ? <span className="t-snip">{p.ausschnitt}</span> : null}
      </button>
    </div>
  )

  if (!p.onLoeschen) return zeile

  return (
    <IonItemSliding ref={sliding} className="t-slide">
      <IonItem className="t-slide-item" lines="none">
        {zeile}
      </IonItem>
      {/* Ganz durchgewischt loescht sofort (mit „Rückgängig“ in der Meldung). */}
      <IonItemOptions side="end" onIonSwipe={() => p.onLoeschen?.()}>
        {p.onVerschieben ? (
          <IonItemOption
            className="t-opt mv"
            onClick={() => {
              void sliding.current?.close()
              p.onVerschieben?.()
            }}
          >
            <span slot="top" className="t-opt-i">
              <IconOrdner />
            </span>
            Verschieben
          </IonItemOption>
        ) : null}
        <IonItemOption className="t-opt del" expandable onClick={() => p.onLoeschen?.()}>
          <span slot="top" className="t-opt-i">
            <IconMuell />
          </span>
          Löschen
        </IonItemOption>
      </IonItemOptions>
    </IonItemSliding>
  )
}
