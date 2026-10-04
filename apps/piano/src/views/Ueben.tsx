import { useEffect, useRef, useState } from 'react'
import { IonModal } from '@ionic/react'
import { IconClose, IconExternal, IconPause, IconPlay } from '../icons'
import { Segmented, Sheet, Thumb, PhaseControls } from '../ui'
import { DIFFICULTIES, PHASE_LABEL, currentPhase, difficultyInfo, nextStepLong } from '../model'
import { MIN_SESSION_SECONDS, recordSession, updatePiece } from '../store'
import { dayOf, embedUrl, formatClock, formatDurationLong, formatMinutes } from '../util'
import type { Difficulty, PianoCtx, Piece, Progress, Uebung } from '../types'

// Ueben: Vollbild von unten. Die Uhr rechnet mit Zeitstempeln (laeuft im
// Hintergrund weiter), jede Aenderung landet sofort in piano:uebung.
function Ueben({ ctx, uebung, onChange }: { ctx: PianoCtx; uebung: Uebung | null; onChange: (u: Uebung | null) => void }) {
  const piece = uebung ? ctx.byId[uebung.pieceId] : undefined
  return (
    <IonModal isOpen={!!uebung && !!piece} className="p-full-modal" aria-label="Üben">
      {uebung && piece ? (
        <UebenInhalt key={`${uebung.pieceId}:${uebung.startedAt}`} ctx={ctx} u={uebung} piece={piece} onChange={onChange} />
      ) : null}
    </IonModal>
  )
}

function UebenInhalt({ ctx, u, piece, onChange }: { ctx: PianoCtx; u: Uebung; piece: Piece; onChange: (u: Uebung | null) => void }) {
  const { settings, sessions, today, byId } = ctx
  const [, setTick] = useState(0)
  const [sheet, setSheet] = useState(false)
  const running = u.pausedAt === null

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => setTick((t) => t + 1), 500)
    const wach = () => setTick((t) => t + 1)
    document.addEventListener('visibilitychange', wach)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', wach)
    }
  }, [running])

  const seconds = Math.max(0, Math.floor(((u.pausedAt ?? Date.now()) - u.startedAt - u.pausedMs) / 1000))

  const pause = () => onChange({ ...u, pausedAt: Date.now() })
  const resume = () => onChange({ ...u, pausedMs: u.pausedMs + (Date.now() - (u.pausedAt ?? Date.now())), pausedAt: null })
  const finish = () => {
    if (running) pause()
    setSheet(true)
  }
  // Schliessen: unter 30 s gibt es nichts zu retten, sonst erst fragen.
  const close = () => (seconds < MIN_SESSION_SECONDS ? onChange(null) : finish())

  const before = (sessions[piece.id] ?? [])
    .filter((s) => dayOf(s.timestamp, settings.dayStart) === today)
    .reduce((sum, s) => sum + s.duration, 0)
  const queue = u.queue.filter((id) => byId[id])
  const embed = settings.videoMode === 'app' ? embedUrl(piece.youtubeUrl) : null

  const save = (progress: Progress, difficulty: Difficulty) => {
    const stored = recordSession(piece.id, seconds)
    const patch: Partial<Piece> = {}
    if (JSON.stringify(progress) !== JSON.stringify(piece.progress)) patch.progress = progress
    if (difficulty !== piece.difficulty) patch.difficulty = difficulty
    if (Object.keys(patch).length) updatePiece(piece.id, patch)
    ctx.refresh()
    ctx.notify(stored ? `Gespeichert · ${formatMinutes(seconds)}` : 'Unter 30 Sekunden – die Zeit zählt nicht')
    const [nextId, ...rest] = queue
    onChange(nextId ? { pieceId: nextId, queue: rest, startedAt: Date.now(), pausedMs: 0, pausedAt: null } : null)
  }

  return (
    <div className="p-ueben">
      <header className="p-ueben-bar">
        <button type="button" className="p-ib" aria-label="Schließen" onClick={close}>
          <IconClose />
        </button>
        <span className="p-strong p-ell p-center">{piece.title}</span>
        {piece.youtubeUrl ? (
          <a className="p-link end" href={piece.youtubeUrl} target="_blank" rel="noreferrer">
            YouTube
            <IconExternal />
          </a>
        ) : (
          <span />
        )}
      </header>

      {embed ? (
        <div className="p-video">
          <iframe
            src={embed}
            title={`Video: ${piece.title}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : piece.youtubeUrl ? (
        <a className="p-video" href={piece.youtubeUrl} target="_blank" rel="noreferrer" aria-label="Video in YouTube öffnen">
          <Thumb piece={piece} className="video">
            <span className="p-play">
              <IconPlay />
            </span>
            <span className="p-video-hint">In YouTube öffnen – die Uhr läuft weiter</span>
          </Thumb>
        </a>
      ) : (
        <div className="p-video">
          <Thumb piece={piece} className="video">
            <span className="p-video-hint">Kein Video hinterlegt</span>
          </Thumb>
        </div>
      )}

      <main className="p-ueben-body">
        <section className="p-stack p-center" style={{ gap: 8, alignItems: 'center' }} aria-live="off">
          <span className="p-lbl">{running ? 'Läuft' : 'Pausiert'}</span>
          <span className={`p-clock${running ? '' : ' paused'}`}>{formatClock(seconds)}</span>
          <span className="p-s2">{before ? `Davor heute schon ${formatMinutes(before)}` : 'Erste Sitzung heute'}</span>
        </section>

        <div className="p-hstack" style={{ gap: 14, width: '100%' }}>
          <button
            type="button"
            className="p-btn round sec"
            aria-label={running ? 'Pause' : 'Weiter'}
            onClick={running ? pause : resume}
          >
            {running ? <IconPause /> : <IconPlay />}
          </button>
          <button type="button" className="p-btn tall" onClick={finish}>
            Fertig
          </button>
        </div>

        <section className="p-card p-pad p-stack" style={{ gap: 4, width: '100%' }}>
          <span className="p-lbl">Ziel dieser Sitzung</span>
          <span className="p-strong">{nextStepLong(piece.progress)}</span>
          <span className="p-s3">
            {queue.length
              ? `Danach: ${byId[queue[0]].title}${queue.length > 1 ? ` und ${queue.length - 1} weitere` : ''}`
              : 'Unter 30 Sekunden wird nichts gespeichert.'}
          </span>
        </section>
      </main>

      {sheet ? (
        <Abschluss
          piece={piece}
          seconds={seconds}
          hasNext={queue.length > 0}
          onClose={() => setSheet(false)}
          onSave={save}
          onDiscard={() => onChange(null)}
        />
      ) : null}
    </div>
  )
}

// "Wie lief's?" - erst ueben, dann einordnen. Wegwischen fuehrt zurueck zur
// pausierten Uhr; Speichern oder Verwerfen laufen erst, wenn das Blatt zu ist.
function Abschluss({
  piece,
  seconds,
  hasNext,
  onClose,
  onSave,
  onDiscard,
}: {
  piece: Piece
  seconds: number
  hasNext: boolean
  onClose: () => void
  onSave: (progress: Progress, difficulty: Difficulty) => void
  onDiscard: () => void
}) {
  const [progress, setProgress] = useState(piece.progress)
  const [difficulty, setDifficulty] = useState<Difficulty>(piece.difficulty)
  const after = useRef<(() => void) | null>(null)
  const phase = currentPhase(piece.progress)
  const short = seconds < MIN_SESSION_SECONDS

  return (
    <Sheet
      label="Wie lief es?"
      onClose={() => {
        const f = after.current
        after.current = null
        onClose()
        f?.()
      }}
    >
      {(zu) => (
        <div className="p-sheet-pad">
          <div className="p-stack" style={{ gap: 4 }}>
            <h2 className="p-h2">Wie lief’s?</h2>
            <p className="p-sub">
              <b className="p-num p-ink">{formatDurationLong(seconds)}</b> · {piece.title}
            </p>
            {short ? <p className="p-s3">Unter 30 Sekunden – die Zeit wird nicht gespeichert, der Lernstand schon.</p> : null}
          </div>

          <div className="p-stack" style={{ gap: 8 }}>
            <span className="p-lbl">{PHASE_LABEL[phase]}</span>
            <PhaseControls progress={progress} phase={phase} onChange={setProgress} />
            <span className="p-s3">{nextStepLong(progress)}</span>
          </div>

          <div className="p-stack" style={{ gap: 8 }}>
            <span className="p-lbl">Wie sitzt es?</span>
            <Segmented
              label="Schwierigkeit"
              options={DIFFICULTIES.filter((d) => d.id !== 'Unknown').map((d) => ({ id: d.id, label: d.short }))}
              value={difficulty === 'Unknown' ? null : difficulty}
              onChange={setDifficulty}
            />
            <span className="p-s3">{difficultyInfo(difficulty).text}</span>
          </div>

          <div className="p-stack" style={{ gap: 6 }}>
            <button
              type="button"
              className="p-btn"
              onClick={() => {
                after.current = () => onSave(progress, difficulty)
                zu()
              }}
            >
              {hasNext ? 'Speichern und weiter' : 'Speichern'}
            </button>
            <button
              type="button"
              className="p-btn ghost danger"
              onClick={() => {
                after.current = onDiscard
                zu()
              }}
            >
              Sitzung verwerfen
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

export default Ueben
