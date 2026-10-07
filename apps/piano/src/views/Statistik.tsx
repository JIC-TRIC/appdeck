import { useMemo, useState } from 'react'
import { IconLeft, IconRight } from '../icons'
import { Heading, TabPage, Thumb } from '../ui'
import {
  calendar,
  currentStreak,
  dayTotals,
  longestStreak,
  monthDays,
  monthStart,
  sessionCount,
  shiftMonth,
  topPieceByDay,
  topPieces,
  totalSeconds,
  type DayTop,
} from '../calc'
import { nextMilestone, statusOf } from '../model'
import { MONTHS, WEEKDAYS_SHORT, formatDateLong, formatDayHeading, formatHoursMinutes, formatTotal, parseKey } from '../util'
import type { PianoCtx } from '../types'

const LEARNED = new Set(['learned', 'memorizing', 'mastered'])

function Statistik({ ctx }: { ctx: PianoCtx }) {
  const { pieces, byId, sessions, settings, today, push } = ctx

  const s = useMemo(() => {
    const totals = dayTotals(sessions, settings.dayStart)
    const total = totalSeconds(sessions)
    const count = sessionCount(sessions)
    return {
      totals,
      total,
      count,
      avg: count ? total / count : 0,
      learned: pieces.filter((p) => LEARNED.has(statusOf(p.progress))).length,
      streak: currentStreak(totals, today),
      record: longestStreak(totals),
      cal: calendar(totals, today),
      top: topPieces(pieces, sessions, 3),
      dayTops: topPieceByDay(sessions, settings.dayStart, (id) => !!byId[id]),
      milestone: nextMilestone(total),
    }
  }, [pieces, byId, sessions, settings.dayStart, today])

  const topMax = s.top[0]?.seconds || 1

  return (
    <TabPage>
      <Heading title="Statistik" />

      <section className="p-kpis" aria-label="Kennzahlen">
        <div className="p-card p-kpi">
          <span className="p-lbl">Gesamt</span>
          <span className="v">{formatTotal(s.total)}</span>
        </div>
        <div className="p-card p-kpi">
          <span className="p-lbl">Sitzungen</span>
          <span className="v">{s.count}</span>
        </div>
        <div className="p-card p-kpi">
          <span className="p-lbl">Ø Sitzung</span>
          <span className="v">
            {Math.round(s.avg / 60)}
            <span className="u">min</span>
          </span>
        </div>
        <div className="p-card p-kpi">
          <span className="p-lbl">Gelernt</span>
          <span className="v">
            {s.learned}
            <span className="u">{s.learned === 1 ? 'Stück' : 'Stücke'}</span>
          </span>
        </div>
      </section>

      <section className="p-card p-pad p-between" aria-label="Serie">
        <div className="p-stack" style={{ gap: 2 }}>
          <span className="p-lbl">Serie</span>
          <span className="p-num p-acc p-streak">
            {s.streak} {s.streak === 1 ? 'Tag' : 'Tage'}
          </span>
        </div>
        <span className="p-s2">
          Rekord <b className="p-num p-ink">{s.record}</b> {s.record === 1 ? 'Tag' : 'Tage'}
        </span>
      </section>

      <section className="p-card p-pad p-stack" style={{ gap: 10 }} aria-label="Kalender der letzten 17 Wochen">
        <div className="p-between">
          <span className="p-lbl">Letzte 17 Wochen</span>
          <span className="p-s3">heute rechts unten</span>
        </div>
        <div className="p-cal">
          <span />
          <div className="p-cal-months p-s3" aria-hidden="true">
            {s.cal.labels.map((l) => (
              <span key={l.index} style={{ left: l.index * 16 }}>
                {l.label}
              </span>
            ))}
          </div>
          <div className="p-cal-days p-s3" aria-hidden="true">
            <span>Mo</span>
            <span />
            <span>Mi</span>
            <span />
            <span>Fr</span>
            <span />
            <span>So</span>
          </div>
          <div className="p-heat">
            {s.cal.columns.flat().map((c) => (
              <i
                key={c.day}
                className={`l${c.level}${c.future ? ' x' : ''}${c.isToday ? ' now' : ''}`}
                title={c.day}
              />
            ))}
          </div>
        </div>
        <div className="p-hstack p-s3" style={{ gap: 5, justifyContent: 'flex-end' }}>
          weniger
          <span className="p-heat legend" aria-hidden="true">
            <i className="l0" />
            <i className="l1" />
            <i className="l2" />
            <i className="l3" />
            <i className="l4" />
          </span>
          mehr
        </div>
      </section>

      {s.dayTops.size ? <Tageskalender ctx={ctx} tops={s.dayTops} /> : null}

      {s.milestone ? (
        <section className="p-card p-pad p-stack" style={{ gap: 10 }} aria-label="Meilenstein">
          <div className="p-between">
            <span className="p-lbl">Nächster Meilenstein</span>
            <span className="p-num p-strong">{s.milestone.hours} h</span>
          </div>
          <div className="p-meter">
            <i style={{ width: `${Math.round(s.milestone.share * 100)}%` }} />
          </div>
          <span className="p-s2">
            {formatTotal(s.total)} geschafft – noch {formatHoursMinutes(s.milestone.remaining)}
          </span>
        </section>
      ) : (
        <section className="p-card p-pad">
          <span className="p-strong">Alle Meilensteine geschafft – über 2000 Stunden.</span>
        </section>
      )}

      {s.top.length ? (
        <section className="p-sec">
          <h2 className="p-lbl">Meistgeübt</h2>
          <div className="p-list">
            {s.top.map(({ piece, seconds }) => (
              <button key={piece.id} type="button" className="p-row bar" onClick={() => push({ name: 'stueck', pieceId: piece.id })}>
                <span className="p-between">
                  <span className="p-strong p-ell">{piece.title}</span>
                  <span className="p-num p-s2">{formatTotal(seconds)}</span>
                </span>
                <span className="p-hbar">
                  <i style={{ width: `${Math.round((seconds / topMax) * 100)}%` }} />
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <button type="button" className="p-card p-pad p-between p-rowlink" onClick={() => push({ name: 'verlauf' })}>
        <span className="p-stack" style={{ gap: 2 }}>
          <span className="p-strong">Verlauf</span>
          <span className="p-s3">
            {s.totals.size} {s.totals.size === 1 ? 'Tag' : 'Tage'} · {s.count} {s.count === 1 ? 'Sitzung' : 'Sitzungen'}
          </span>
        </span>
        <IconRight className="p-chev" />
      </button>
    </TabPage>
  )
}

// Monatskalender: an jedem Tag das Vorschaubild des Stuecks, das an dem Tag am
// laengsten geuebt wurde. Ein Tipp zeigt Titel und Zeit darunter, die Zeile
// fuehrt zum Stueck. Blaettern vom ersten Monat mit Sitzungen bis heute.
function Tageskalender({ ctx, tops }: { ctx: PianoCtx; tops: Map<string, DayTop> }) {
  const { byId, today, push } = ctx
  const [month, setMonth] = useState(() => monthStart(today))
  const [selected, setSelected] = useState<string | null>(null)
  const first = useMemo(() => monthStart([...tops.keys()].reduce((a, b) => (b < a ? b : a), today)), [tops, today])
  const last = monthStart(today)
  const { lead, days } = monthDays(month)
  const d0 = parseKey(month)
  const sel = selected ? tops.get(selected) : undefined
  const selPiece = sel ? byId[sel.pieceId] : undefined

  const blaettern = (n: number) => {
    setMonth((m) => shiftMonth(m, n))
    setSelected(null)
  }

  return (
    <section className="p-card p-pad p-stack" style={{ gap: 12 }} aria-label="Meistgeübt pro Tag">
      <div className="p-between">
        <span className="p-lbl">Meistgeübt pro Tag</span>
        <span className="p-tk-nav">
          <button type="button" className="p-tk-arrow" aria-label="Monat davor" disabled={month <= first} onClick={() => blaettern(-1)}>
            <IconLeft />
          </button>
          <span className="p-strong">
            {MONTHS[d0.getMonth()]}
            {month.slice(0, 4) === today.slice(0, 4) ? '' : ` ${month.slice(0, 4)}`}
          </span>
          <button type="button" className="p-tk-arrow" aria-label="Monat danach" disabled={month >= last} onClick={() => blaettern(1)}>
            <IconRight />
          </button>
        </span>
      </div>
      <div className="p-tk">
        {WEEKDAYS_SHORT.map((w) => (
          <span key={w} className="p-tk-h p-s3" aria-hidden="true">
            {w}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`l${i}`} />
        ))}
        {days.map((d) => {
          const t = tops.get(d)
          const piece = t ? byId[t.pieceId] : undefined
          const n = parseKey(d).getDate()
          const cls = `p-tk-day${d === today ? ' now' : ''}${d > today ? ' future' : ''}`
          if (!piece) {
            return (
              <span key={d} className={cls}>
                <span className="n">{n}</span>
              </span>
            )
          }
          return (
            <button
              key={d}
              type="button"
              className={`${cls} has${d === selected ? ' sel' : ''}`}
              aria-label={`${formatDateLong(d)}: ${piece.title}`}
              aria-pressed={d === selected}
              onClick={() => setSelected((x) => (x === d ? null : d))}
            >
              <Thumb piece={piece} className="p-tk-thumb" />
              <span className="n">{n}</span>
            </button>
          )
        })}
      </div>
      {selected && sel && selPiece ? (
        <button type="button" className="p-tk-info" onClick={() => push({ name: 'stueck', pieceId: selPiece.id })}>
          <span className="p-stack" style={{ gap: 2, minWidth: 0 }}>
            <span className="p-s3">
              {formatDayHeading(selected, today)} · {formatTotal(sel.seconds)}
              {sel.pieces > 1 ? ` · ${sel.pieces - 1} ${sel.pieces === 2 ? 'weiteres Stück' : 'weitere Stücke'}` : ''}
            </span>
            <span className="p-strong p-ell">{selPiece.title}</span>
          </span>
          <IconRight className="p-chev" />
        </button>
      ) : (
        <span className="p-s3">Tipp auf ein Bild zeigt den Titel.</span>
      )}
    </section>
  )
}

export default Statistik
