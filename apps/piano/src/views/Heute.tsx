import { useEffect, useMemo, useRef, useState } from 'react'
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonList } from '@ionic/react'
import { IconCheck, IconImport, IconPlay, IconPlus, IconRefresh, IconRight, IconSliders } from '../icons'
import { Heading, IconButton, Keys, Sheet, TabPage, Thumb } from '../ui'
import { avgSessionOf, currentStreak, dayTotals, practicedOn, remixPlaylist, skipToday, todaysPlaylist, weekDays } from '../calc'
import { nextStepShort } from '../model'
import { getPlaylist, savePlaylist } from '../store'
import { dayOf, formatDateLong, formatMinutes, formatTotal } from '../util'
import type { PianoCtx } from '../types'

// Heute: das naechste Stueck der Tagesliste, die Woche, die Serie.
function Heute({ ctx }: { ctx: PianoCtx }) {
  const { pieces, active, byId, sessions, settings, today, now, push, startUebung, refresh, notify } = ctx
  const [listOpen, setListOpen] = useState(false)
  // Was nach dem Schliessen des Blatts passieren soll (Ueben starten)
  const afterList = useRef<(() => void) | null>(null)
  const target = settings.dailyGoalMinutes * 60

  const { playlist, fresh } = useMemo(
    () => todaysPlaylist(getPlaylist(), active, sessions, today, target, now),
    [active, sessions, today, target, now],
  )
  // Gespeichert wird nach dem Zeichnen, nicht waehrend - in der alten App
  // fuehrte genau das bei leerer Bibliothek zur Endlosschleife.
  useEffect(() => {
    if (fresh && playlist.pieceIds.length) savePlaylist(playlist)
  }, [fresh, playlist])

  const totals = useMemo(() => dayTotals(sessions, settings.dayStart), [sessions, settings.dayStart])

  if (!pieces.length) return <Erststart ctx={ctx} />
  if (!active.length) return <AllesArchiviert ctx={ctx} />

  const done = new Set(playlist.pieceIds.filter((id) => practicedOn(sessions, id, today, settings.dayStart)))
  const open = playlist.pieceIds.filter((id) => !done.has(id))
  const nextId = open[0]
  const next = nextId ? byId[nextId] : undefined
  const nextIndex = nextId ? playlist.pieceIds.indexOf(nextId) + 1 : 0

  const week = weekDays(totals, today)
  const weekSum = week.reduce((s, d) => s + d.seconds, 0)
  const weekMax = Math.max(target, ...week.map((d) => d.seconds))
  const todaySec = totals.get(today) ?? 0
  const streak = currentStreak(totals, today)

  const remix = () => {
    savePlaylist(remixPlaylist(playlist, active, sessions, target, Date.now()))
    refresh()
  }

  // "Heute nicht": raus fuer heute, das naechstbeste rueckt nach - mit Rueckgaengig.
  const skip = (id: string) => {
    const before = playlist
    savePlaylist(skipToday(playlist, id, active, sessions, Date.now()))
    refresh()
    notify(`„${byId[id]?.title ?? 'Stück'}“ heute nicht`, () => savePlaylist(before))
  }

  return (
    <TabPage>
      <Heading
        kicker={formatDateLong(today)}
        title="Heute"
        right={
          <IconButton label="Einstellungen" onClick={() => push({ name: 'einstellungen' })}>
            <IconSliders />
          </IconButton>
        }
      />

      {next ? (
        <section className="p-card p-hero" aria-label="Als Nächstes">
          <button type="button" className="p-hero-thumb" onClick={() => push({ name: 'stueck', pieceId: next.id })} aria-label={`${next.title} öffnen`}>
            <Thumb piece={next} className="hero">
              <span className="p-play">
                <IconPlay />
              </span>
            </Thumb>
          </button>
          <div className="p-pad p-stack" style={{ gap: 12 }}>
            <div className="p-stack" style={{ gap: 4 }}>
              <div className="p-between">
                <span className="p-lbl">
                  Als Nächstes · {nextIndex} von {playlist.pieceIds.length}
                </span>
                <button type="button" className="p-link small" onClick={() => skip(next.id)}>
                  Heute nicht
                </button>
              </div>
              <h2 className="p-h2">{next.title}</h2>
              <span className="p-s2">
                {next.artist ? `${next.artist} · ` : ''}ca. {formatMinutes(avgSessionOf(sessions, next.id))}
              </span>
            </div>
            <div className="p-between">
              <Keys progress={next.progress} />
              <span className="p-s2">
                Nächster Schritt: <b className="p-ink">{nextStepShort(next.progress)}</b>
              </span>
            </div>
            <button type="button" className="p-btn" onClick={() => startUebung(open)}>
              <IconPlay />
              Üben starten
            </button>
          </div>
        </section>
      ) : (
        <section className="p-card p-pad p-stack p-done" aria-label="Tagesliste">
          <span className="p-lbl">Tagesliste</span>
          <h2 className="p-h2">Alles geübt</h2>
          <p className="p-s2">Alle {playlist.pieceIds.length} Stücke von heute sind dran gewesen.</p>
          <button type="button" className="p-btn sec" onClick={remix}>
            <IconRefresh />
            Neue Liste mischen
          </button>
        </section>
      )}

      <section className="p-card p-pad p-stack" style={{ gap: 12 }} aria-label="Diese Woche">
        <div className="p-between">
          <span className="p-lbl">Diese Woche</span>
          <span className="p-num p-strong">{formatTotal(weekSum)}</span>
        </div>
        <div className="p-week">
          {week.map((d) => (
            <div key={d.day} className={`p-day${d.isToday ? ' today' : ''}${d.future ? ' future' : ''}`}>
              <span className="b" title={formatMinutes(d.seconds)}>
                <span className="f" style={{ height: `${Math.round((d.seconds / weekMax) * 100)}%` }} />
              </span>
              {d.label}
            </div>
          ))}
        </div>
        <div className="p-between">
          <span className="p-s2">
            Heute <b className="p-num p-ink">{Math.round(todaySec / 60)}</b> von {settings.dailyGoalMinutes} min
          </span>
          <span className="p-s2">
            Serie <b className="p-num p-acc">{streak}</b> {streak === 1 ? 'Tag' : 'Tage'}
          </span>
        </div>
      </section>

      <button type="button" className="p-card p-pad p-between p-rowlink" onClick={() => setListOpen(true)}>
        <span className="p-strong">
          Tagesliste · {open.length ? `noch ${open.length} ${open.length === 1 ? 'Stück' : 'Stücke'}` : 'alles geübt'}
        </span>
        <IconRight className="p-chev" />
      </button>

      {listOpen ? (
        <Sheet
          label="Tagesliste"
          onClose={() => {
            setListOpen(false)
            const f = afterList.current
            afterList.current = null
            f?.()
          }}
        >
          {(zu) => (
            <div className="p-sheet-pad">
              <div className="p-between">
                <div className="p-stack" style={{ gap: 2 }}>
                  <div className="p-sheet-title">Tagesliste</div>
                  <span className="p-s2">
                    {playlist.pieceIds.length} Stücke · ca.{' '}
                    {formatMinutes(playlist.pieceIds.reduce((s, id) => s + avgSessionOf(sessions, id), 0))}
                  </span>
                </div>
                <button type="button" className="p-link" onClick={remix}>
                  <IconRefresh />
                  Neu mischen
                </button>
              </div>
              <IonList className="p-list p-slides" lines="none">
                {playlist.pieceIds.map((id) => {
                  const p = byId[id]
                  if (!p) return null
                  const isDone = done.has(id)
                  const spent = (sessions[id] ?? [])
                    .filter((s) => dayOf(s.timestamp, settings.dayStart) === today)
                    .reduce((sum, s) => sum + s.duration, 0)
                  // Schon geuebt laesst sich nicht wegwischen - es ist ja erledigt.
                  return (
                    <IonItemSliding key={id} className="p-slide" disabled={isDone}>
                      <IonItem className="p-slide-item" lines="none">
                        <button
                          type="button"
                          className={`p-row${isDone ? ' done' : ''}`}
                          onClick={() => {
                            const rest = open.filter((x) => x !== id)
                            afterList.current = () => startUebung([id, ...rest])
                            zu()
                          }}
                        >
                          <span className={`p-check${isDone ? ' on' : ''}`} aria-label={isDone ? 'heute geübt' : 'offen'}>
                            {isDone ? <IconCheck /> : null}
                          </span>
                          <Thumb piece={p} />
                          <span className="p-row-main">
                            <span className="p-row-t">{p.title}</span>
                            <span className="p-s2 p-ell">
                              {p.artist ? `${p.artist} · ` : ''}
                              {isDone ? `${formatMinutes(spent)} geübt` : `ca. ${formatMinutes(avgSessionOf(sessions, id))}`}
                            </span>
                          </span>
                          {!isDone ? (
                            <span className="p-playbtn" aria-hidden="true">
                              <IconPlay />
                            </span>
                          ) : null}
                        </button>
                      </IonItem>
                      <IonItemOptions side="end" onIonSwipe={() => skip(id)}>
                        <IonItemOption className="p-slide-skip" expandable onClick={() => skip(id)}>
                          Heute nicht
                        </IonItemOption>
                      </IonItemOptions>
                    </IonItemSliding>
                  )
                })}
              </IonList>
            </div>
          )}
        </Sheet>
      ) : null}
    </TabPage>
  )
}

// Alle Stuecke liegen im Archiv: nichts fuer die Tagesliste.
function AllesArchiviert({ ctx }: { ctx: PianoCtx }) {
  const { today, push, openForm } = ctx
  return (
    <TabPage>
      <Heading
        kicker={formatDateLong(today)}
        title="Heute"
        right={
          <IconButton label="Einstellungen" onClick={() => push({ name: 'einstellungen' })}>
            <IconSliders />
          </IconButton>
        }
      />
      <section className="p-card p-pad p-stack p-done">
        <span className="p-lbl">Tagesliste</span>
        <h2 className="p-h2">Alles im Archiv</h2>
        <button type="button" className="p-btn" onClick={() => openForm()}>
          <IconPlus />
          Stück hinzufügen
        </button>
      </section>
    </TabPage>
  )
}

// Heute ohne Stuecke: der Weg zum ersten Stueck oder zum alten Stand.
function Erststart({ ctx }: { ctx: PianoCtx }) {
  const { today, push, openForm, importBackup } = ctx
  return (
    <TabPage className="p-empty-page">
      <Heading
        kicker={formatDateLong(today)}
        title="Heute"
        right={
          <IconButton label="Einstellungen" onClick={() => push({ name: 'einstellungen' })}>
            <IconSliders />
          </IconButton>
        }
      />
      <div className="p-empty">
        <div className="p-kbd" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <i />
          <b style={{ left: 19 }} />
          <b style={{ left: 48 }} />
          <b style={{ left: 106 }} />
          <b style={{ left: 135 }} />
          <b style={{ left: 164 }} />
        </div>
        <div className="p-stack p-center" style={{ gap: 8, maxWidth: 300 }}>
          <h2 className="p-h2">Noch keine Stücke</h2>
        </div>
        <div className="p-stack" style={{ gap: 10, width: '100%' }}>
          <button type="button" className="p-btn" onClick={() => openForm()}>
            <IconPlus />
            Erstes Stück hinzufügen
          </button>
          <button type="button" className="p-btn ghost" onClick={importBackup}>
            <IconImport />
            Backup importieren
          </button>
        </div>
      </div>
    </TabPage>
  )
}

export default Heute
