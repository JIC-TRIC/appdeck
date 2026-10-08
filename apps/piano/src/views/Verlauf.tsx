import { useMemo, useState } from 'react'
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonList } from '@ionic/react'
import { Page, Thumb } from '../ui'
import { historyDays } from '../calc'
import { deleteSession } from '../store'
import { formatDayHeading, formatMinutes, formatTimeOfDay } from '../util'
import type { Session, ViewProps } from '../types'

const PAGE_DAYS = 30

// Alle Sitzungen nach Tagen - oder nur die eines Stuecks. Nach links wischen
// loescht sofort, die Meldung bietet ein paar Sekunden "Rueckgaengig" (wie Kontor).
function Verlauf({ ctx, view }: ViewProps) {
  const { sessions, byId, settings, today, backLabel, back, push, refresh, notify } = ctx
  const [shown, setShown] = useState(PAGE_DAYS)
  const days = useMemo(() => historyDays(sessions, settings.dayStart, view.pieceId), [sessions, settings.dayStart, view.pieceId])
  const count = days.reduce((n, d) => n + d.items.length, 0)
  const only = view.pieceId ? byId[view.pieceId] : undefined

  const remove = (pieceId: string, session: Session) => {
    const undo = deleteSession(pieceId, session)
    refresh()
    notify(`Sitzung gelöscht · ${formatMinutes(session.duration)}`, undo)
  }

  return (
    <Page backLabel={backLabel} onBack={back}>
      <header className="p-head tight">
        <div className="p-head-l">
          <p className="p-lbl">
            {only ? `${only.title} · ` : ''}
            {days.length} {days.length === 1 ? 'Tag' : 'Tage'} · {count} {count === 1 ? 'Sitzung' : 'Sitzungen'}
          </p>
          <h1 className="p-h1">Verlauf</h1>
        </div>
      </header>

      {days.length ? (
        days.slice(0, shown).map((d) => (
          <section key={d.day} className="p-sec">
            <div className="p-sec-h">
              <h2 className="p-lbl">{formatDayHeading(d.day, today)}</h2>
              <span className="p-num p-s2">{formatMinutes(d.seconds)}</span>
            </div>
            <IonList className="p-list p-slides" lines="none">
              {d.items.map(({ pieceId, session }) => {
                const piece = byId[pieceId]
                return (
                  <IonItemSliding key={`${pieceId}:${session.timestamp}`} className="p-slide">
                    <IonItem className="p-slide-item" lines="none">
                      <button
                        type="button"
                        className="p-row tight"
                        onClick={() => (piece && !only ? push({ name: 'stueck', pieceId }) : undefined)}
                      >
                        <Thumb piece={piece} className="sm" />
                        <span className="p-row-main">
                          <span className="p-row-t">{piece?.title ?? 'Gelöschtes Stück'}</span>
                          <span className="p-s3">{formatTimeOfDay(session.timestamp)}</span>
                        </span>
                        <span className="p-num p-s2">{formatMinutes(session.duration)}</span>
                      </button>
                    </IonItem>
                    <IonItemOptions side="end" onIonSwipe={() => remove(pieceId, session)}>
                      <IonItemOption className="p-slide-del" expandable onClick={() => remove(pieceId, session)}>
                        Löschen
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                )
              })}
            </IonList>
          </section>
        ))
      ) : (
        <p className="p-note">Noch keine Sitzungen.</p>
      )}

      {days.length > shown ? (
        <button type="button" className="p-btn ghost" onClick={() => setShown((n) => n + PAGE_DAYS)}>
          Mehr zeigen ({days.length - shown} {days.length - shown === 1 ? 'Tag' : 'Tage'})
        </button>
      ) : null}
    </Page>
  )
}

export default Verlauf
