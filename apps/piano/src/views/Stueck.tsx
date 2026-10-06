import { useEffect, useRef, useState } from 'react'
import { IconArchive, IconCheck, IconImport, IconList, IconLock, IconMore, IconPencil, IconPlay } from '../icons'
import { DifficultyBars, IconButton, ListSheet, Page, PhaseControls, Thumb } from '../ui'
import { lastSessionsOf, pieceTotal, sessionsOf } from '../calc'
import {
  DIFFICULTIES,
  PHASE_LABEL,
  currentPhase,
  difficultyInfo,
  isArchived,
  isDone,
  lockOf,
  phaseSummary,
  statusText,
  type Phase,
} from '../model'
import { deletePiece, setArchived, updatePiece, updateSetlist } from '../store'
import { dayOf, formatDayHeading, formatMinutes, formatRelativeDay, formatTimeOfDay, formatTotal } from '../util'
import type { Progress, ViewProps } from '../types'

const PHASES: Phase[] = ['hands', 'together', 'dynamics', 'memorize']

function Stueck({ ctx, view }: ViewProps) {
  const { byId, sessions, settings, setlists, today, backLabel, back, push, refresh, notify, startUebung, openForm } = ctx
  const piece = view.pieceId ? byId[view.pieceId] : undefined
  const [sheet, setSheet] = useState<null | 'actions' | 'difficulty' | 'setlists'>(null)

  // Geloescht, waehrend die Seite noch hinausgleitet: nichts mehr zeigen.
  if (!piece) return <Page backLabel={backLabel} onBack={back}>{null}</Page>

  const p = piece.progress
  const cur = currentPhase(p)
  const list = sessionsOf(sessions, piece.id)
  const recent = lastSessionsOf(sessions, piece.id, 3)
  const diff = difficultyInfo(piece.difficulty)

  const setProgress = (next: Progress) => {
    updatePiece(piece.id, { progress: next })
    refresh()
  }

  const remove = () => {
    const title = piece.title
    back()
    const undo = deletePiece(piece.id)
    refresh()
    notify(`„${title}“ gelöscht`, undo)
  }

  // Archivieren fuehrt zurueck (das Stueck verschwindet aus der Uebersicht),
  // Zurueckholen bleibt auf der Seite.
  const archived = isArchived(piece)
  const archive = () => {
    const title = piece.title
    back()
    const undo = setArchived(piece.id, true)
    refresh()
    notify(`„${title}“ archiviert`, undo)
  }
  const unarchive = () => {
    setArchived(piece.id, false)
    refresh()
    notify('Wieder aktiv – kommt in die Tagesliste')
  }

  return (
    <Page
      backLabel={backLabel}
      onBack={back}
      right={
        <>
          <IconButton label="Bearbeiten" onClick={() => openForm(piece.id)}>
            <IconPencil />
          </IconButton>
          <IconButton label="Weitere Aktionen" onClick={() => setSheet('actions')}>
            <IconMore />
          </IconButton>
        </>
      }
    >
      <button type="button" className="p-bleed" onClick={() => startUebung([piece.id])} aria-label="Üben starten">
        <Thumb piece={piece} className="big">
          <span className="p-play">
            <IconPlay />
          </span>
        </Thumb>
      </button>

      <section className="p-stack" style={{ gap: 14 }}>
        <div className="p-stack" style={{ gap: 4 }}>
          <h1 className="p-h2">{piece.title}</h1>
          {piece.artist ? <p className="p-sub">{piece.artist}</p> : null}
        </div>
        <div className="p-hstack" style={{ gap: 8, flexWrap: 'wrap' }}>
          {archived ? <span className="p-pill">Archiviert</span> : null}
          <span className="p-pill acc">{statusText(p)}</span>
          <span className="p-pill">
            <DifficultyBars difficulty={piece.difficulty} />
            {diff.label}
          </span>
        </div>
        <button type="button" className="p-btn" onClick={() => startUebung([piece.id])}>
          <IconPlay />
          Üben starten
        </button>
        <div className="p-trio">
          <div>
            <span className="p-num v">{formatTotal(pieceTotal(sessions, piece.id))}</span>
            <span className="p-s3">gesamt</span>
          </div>
          <div>
            <span className="p-num v">{list.length}</span>
            <span className="p-s3">{list.length === 1 ? 'Sitzung' : 'Sitzungen'}</span>
          </div>
          <div>
            <span className="p-num v">{formatRelativeDay(piece.lastPracticed ? dayOf(piece.lastPracticed, settings.dayStart) : null, today)}</span>
            <span className="p-s3">zuletzt</span>
          </div>
        </div>
      </section>

      <section className="p-sec">
        <h2 className="p-lbl">Lernweg</h2>
        <ol className="p-steps">
          {PHASES.map((phase, i) => {
            const done = isDone(p, phase)
            const lock = lockOf(p, phase)
            const state = done ? 'done' : phase === cur ? 'cur' : 'todo'
            return (
              <li key={phase} className={`p-step ${state}${lock.locked && !done ? ' lock' : ''}`}>
                <span className="p-mark">{done ? <IconCheck /> : i + 1}</span>
                <div className="p-step-bd">
                  <span className="p-strong">
                    {PHASE_LABEL[phase]}
                    {phase === 'memorize' ? <span className="p-s3"> · freiwillig</span> : null}
                  </span>
                  {!lock.locked ? (
                    <PhaseControls progress={p} phase={phase} onChange={setProgress} />
                  ) : done ? (
                    <span className="p-s2">{phaseSummary(p, phase)}</span>
                  ) : (
                    <span className="p-s2 p-hstack" style={{ gap: 6 }}>
                      <IconLock className="xs" />
                      {lock.reason}
                    </span>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="p-card p-pad p-stack" style={{ gap: 6 }}>
        <div className="p-between">
          <span className="p-lbl">Schwierigkeit</span>
          <button type="button" className="p-link" onClick={() => setSheet('difficulty')}>
            Ändern
          </button>
        </div>
        <span className="p-strong">{diff.label}</span>
        <span className="p-s2">{diff.text}</span>
      </section>

      <Notes key={piece.id} pieceId={piece.id} initial={piece.notes ?? ''} onSaved={refresh} />

      <section className="p-sec">
        <div className="p-sec-h">
          <h2 className="p-lbl">Letzte Sitzungen</h2>
          {list.length ? (
            <button type="button" className="p-link" onClick={() => push({ name: 'verlauf', pieceId: piece.id })}>
              Alle {list.length}
            </button>
          ) : null}
        </div>
        {recent.length ? (
          <div className="p-list">
            {recent.map((s) => (
              <div key={s.timestamp} className="p-row tight">
                <span className="p-row-main p-strong">
                  {formatDayHeading(dayOf(s.timestamp, settings.dayStart), today)}, {formatTimeOfDay(s.timestamp)}
                </span>
                <span className="p-num p-s2">{formatMinutes(s.duration)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="p-note">Noch keine Sitzung. Die Uhr läuft, sobald du auf „Üben starten“ tippst.</p>
        )}
      </section>

      {sheet === 'actions' ? (
        <ListSheet
          label="Aktionen"
          onClose={() => setSheet(null)}
          items={[
            {
              key: 'setlists',
              label: 'Zu Setlist hinzufügen',
              icon: <IconList />,
              onPick: () => setSheet('setlists'),
            },
            archived
              ? { key: 'unarchive', label: 'Aus dem Archiv holen', icon: <IconImport />, onPick: unarchive }
              : { key: 'archive', label: 'Archivieren', icon: <IconArchive />, onPick: archive },
            { key: 'delete', label: 'Stück löschen', danger: true, onPick: remove },
          ]}
          note="Archivieren nimmt das Stück aus Tagesliste und Übersicht – Sitzungen und Statistik bleiben. Löschen nimmt auch die Sitzungen mit. Beides lässt sich ein paar Sekunden lang zurücknehmen."
        />
      ) : null}

      {sheet === 'difficulty' ? (
        <ListSheet
          label="Schwierigkeit"
          title="Wie schwer ist das Stück?"
          note="Deine Einschätzung des Stücks – wie weit du schon bist, zeigt der Lernweg."
          onClose={() => setSheet(null)}
          items={DIFFICULTIES.map((d) => ({
            key: d.id,
            label: d.label,
            sub: d.text,
            checked: piece.difficulty === d.id,
            onPick: () => {
              updatePiece(piece.id, { difficulty: d.id })
              refresh()
            },
          }))}
        />
      ) : null}

      {sheet === 'setlists' ? (
        <ListSheet
          label="Zu Setlist hinzufügen"
          title="Setlists"
          onClose={() => setSheet(null)}
          note={setlists.length ? 'Tippen nimmt das Stück auf oder heraus.' : 'Noch keine Setlists – anlegen unter Stücke → Setlists.'}
          items={setlists.map((s) => {
            const has = s.pieceIds.includes(piece.id)
            return {
              key: s.id,
              label: s.title,
              sub: `${s.pieceIds.length} ${s.pieceIds.length === 1 ? 'Stück' : 'Stücke'}`,
              checked: has,
              keepOpen: true,
              onPick: () => {
                updateSetlist(s.id, { pieceIds: has ? s.pieceIds.filter((x) => x !== piece.id) : [...s.pieceIds, piece.id] })
                refresh()
              },
            }
          })}
        />
      ) : null}
    </Page>
  )
}

// Notizen speichern beim Tippen (kurz verzoegert) und beim Verlassen des Felds.
function Notes({ pieceId, initial, onSaved }: { pieceId: string; initial: string; onSaved: () => void }) {
  const [text, setText] = useState(initial)
  const saved = useRef(initial)
  const timer = useRef<number | undefined>(undefined)
  const area = useRef<HTMLTextAreaElement>(null)

  const save = (value: string) => {
    window.clearTimeout(timer.current)
    if (value === saved.current) return
    saved.current = value
    updatePiece(pieceId, { notes: value })
    onSaved()
  }

  // Waechst mit dem Text, statt selbst zu scrollen.
  useEffect(() => {
    const el = area.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [text])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <section className="p-card p-pad p-stack" style={{ gap: 8 }}>
      <label className="p-lbl" htmlFor={`notes-${pieceId}`}>
        Notizen
      </label>
      <textarea
        ref={area}
        id={`notes-${pieceId}`}
        className="p-notes"
        value={text}
        rows={2}
        placeholder="Fingersätze, schwierige Takte, was als Nächstes dran ist …"
        onChange={(e) => {
          const v = e.target.value
          setText(v)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => save(v), 600)
        }}
        onBlur={() => save(text)}
      />
    </section>
  )
}

export default Stueck
