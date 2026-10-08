import { useState } from 'react'
import { IconPlay, IconPlus } from '../icons'
import { IconButton, Page, Thumb } from '../ui'
import { avgSessionOf } from '../calc'
import { createSetlist } from '../store'
import { formatMinutes } from '../util'
import { SetlistNameSheet } from './Sheets'
import type { PianoCtx, Piece, Setlist, ViewProps } from '../types'

/** Stuecke einer Setlist, die es noch gibt */
export function setlistPieces(ctx: PianoCtx, s: Setlist) {
  return s.pieceIds.map((id) => ctx.byId[id]).filter((p): p is Piece => !!p)
}

export function setlistSeconds(ctx: PianoCtx, s: Setlist) {
  return setlistPieces(ctx, s).reduce((sum, p) => sum + avgSessionOf(ctx.sessions, p.id), 0)
}

function Setlists({ ctx }: ViewProps) {
  const { setlists, backLabel, back, push, refresh, startUebung } = ctx
  const [naming, setNaming] = useState(false)

  return (
    <Page
      backLabel={backLabel}
      onBack={back}
      right={
        <IconButton label="Neue Setlist" onClick={() => setNaming(true)}>
          <IconPlus />
        </IconButton>
      }
    >
      <header className="p-head tight">
        <div className="p-head-l">
          <h1 className="p-h1">Setlists</h1>
        </div>
      </header>

      {setlists.map((s) => {
        const pieces = setlistPieces(ctx, s)
        return (
          <div key={s.id} className="p-card p-setlist">
            <button type="button" className="p-setlist-main" onClick={() => push({ name: 'setlist', setlistId: s.id })}>
              <span className="p-stack-thumbs" aria-hidden="true">
                {[2, 1, 0].map((i) => (
                  <Thumb key={i} piece={pieces[i]} className={`sm n${i}`} />
                ))}
              </span>
              <span className="p-stack" style={{ gap: 3, minWidth: 0 }}>
                <span className="p-strong p-ell p-setlist-t">{s.title}</span>
                <span className="p-s2">
                  {pieces.length} {pieces.length === 1 ? 'Stück' : 'Stücke'}
                  {pieces.length ? ` · ca. ${formatMinutes(setlistSeconds(ctx, s))}` : ''}
                </span>
              </span>
            </button>
            <button
              type="button"
              className="p-playbtn"
              aria-label={`${s.title} durchspielen`}
              disabled={!pieces.length}
              onClick={() => startUebung(pieces.map((p) => p.id))}
            >
              <IconPlay />
            </button>
          </div>
        )
      })}

      <button type="button" className="p-btn ghost dashed" onClick={() => setNaming(true)}>
        <IconPlus />
        Neue Setlist
      </button>

      {naming ? (
        <SetlistNameSheet
          title="Neue Setlist"
          onClose={() => setNaming(false)}
          onSave={(name) => {
            const s = createSetlist(name)
            refresh()
            push({ name: 'setlist', setlistId: s.id })
          }}
        />
      ) : null}
    </Page>
  )
}

export default Setlists
