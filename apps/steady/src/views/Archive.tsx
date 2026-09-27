import { isArchived, quoteIn, share, streaks } from '../calc'
import { IconRight } from '../icons'
import { Screen, hue } from '../ui'
import { addDays, formatDateShort, formatPercent, parseKey } from '../util'
import type { ViewProps } from '../types'

// Beendete Gewohnheiten. Die Historie bleibt, in der Statistik zaehlen sie
// fuer die Zeit mit, in der sie liefen.
function Archive({ ctx }: ViewProps) {
  const { habits, log, today, push, back } = ctx
  const list = habits.filter(isArchived)

  return (
    <Screen title="Archiv" onBack={back}>
      {list.length ? (
        <div className="s-list">
          {list.map((h) => {
            const end = addDays(h.inactive[h.inactive.length - 1].from, -1)
            const q = share(quoteIn(h, log, h.start, end, today))
            const best = streaks(h, log[h.id], today).best
            const sameYear = parseKey(h.start).getFullYear() === parseKey(end).getFullYear()
            return (
              <button key={h.id} type="button" className="s-li" style={hue(h)} onClick={() => push({ name: 'detail', habitId: h.id })}>
                <span className="two">
                  <b>{h.name}</b>
                  <small>
                    {formatDateShort(h.start, !sameYear)} – {formatDateShort(end)} · {q === null ? '–' : formatPercent(q)} · Rekord {best}
                  </small>
                </span>
                <span className="v">
                  <IconRight />
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="s-note center">Nichts archiviert.</p>
      )}
      <p className="s-note">
        Archivierte Gewohnheiten zählen in der Statistik für die Zeit, in der sie liefen. Im Detail: Wiederherstellen
        (startet eine neue Serie) oder endgültig löschen.
      </p>
    </Screen>
  )
}

export default Archive
