import { useMemo } from 'react'
import { IconRight } from '../icons'
import { Heading, TabPage } from '../ui'
import { calendar, currentStreak, dayTotals, longestStreak, sessionCount, topPieces, totalSeconds } from '../calc'
import { nextMilestone, statusOf } from '../model'
import { formatHoursMinutes, formatTotal } from '../util'
import type { PianoCtx } from '../types'

const LEARNED = new Set(['learned', 'memorizing', 'mastered'])

function Statistik({ ctx }: { ctx: PianoCtx }) {
  const { pieces, sessions, settings, today, push } = ctx

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
      milestone: nextMilestone(total),
    }
  }, [pieces, sessions, settings.dayStart, today])

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

export default Statistik
