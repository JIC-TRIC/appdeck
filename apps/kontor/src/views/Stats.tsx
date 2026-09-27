import { useMemo } from 'react'
import { Bars } from '../charts'
import {
  breakdown,
  projection,
  seriesForPeriod,
  spendFreeDays,
  totalsInRange,
} from '../calc'
import { Empty, Money, PeriodBar, Screen } from '../ui'
import { formatCent, parseKey, periodRange, shiftPeriod, todayKey } from '../util'
import type { ViewProps } from '../types'

function Stats({ ctx }: ViewProps) {
  const { entries, accById, catById, settings, period, setPeriod, back, push, firstKey } = ctx
  const countBoundary = settings.countBoundaryTransfers

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )
  const totals = totalsInRange(entries, range, accById, countBoundary)

  // Der Zeitraum ist derselbe wie in der Uebersicht - hier blaettert man ihn
  // genauso, statt zurueckgehen und dort wechseln zu muessen.
  const move = (dir: number) =>
    setPeriod({ ...period, anchor: shiftPeriod(period.kind, period.anchor, dir, settings.weekStart) })

  const series = useMemo(
    () =>
      seriesForPeriod({
        entries,
        kind: period.kind,
        range,
        accById,
        countBoundary,
        firstKey,
      }),
    [entries, period.kind, range, accById, countBoundary, firstKey],
  )

  const now = useMemo(
    () => breakdown({ entries, range, kind: 'expense', catById, accById, countBoundary, maxSegments: 99 }),
    [entries, range, catById, accById, countBoundary],
  )
  const free = spendFreeDays(entries, range, accById, countBoundary, firstKey)
  const proj = projection(totals.exp, range, firstKey)
  const savings = totals.inc > 0 ? totals.diff / totals.inc : null
  const avgPerDay = free.total ? Math.round(totals.exp / free.total) : 0
  const incomeDays = new Set(
    entries
      .filter((e) => e.type === 'income' && (!range.from || (e.date >= range.from && e.date <= (range.to as string))))
      .map((e) => e.date),
  ).size

  const maxTop = now.all[0]?.value ?? 0

  const firstDay = series.points[0]
  const lastDay = series.points[series.points.length - 1]
  // "heute" steht unter seinem Balken, nicht einfach in der Mitte. Liegt der
  // Tag am Rand, ersetzt er die Beschriftung dort, statt sie zu ueberdecken.
  const heuteIndex = series.perMonth ? -1 : series.points.findIndex((p) => p.key === todayKey())
  const heuteAnteil = heuteIndex < 0 ? null : ((heuteIndex + 0.5) / series.points.length) * 100
  const heuteLinks = heuteAnteil !== null && heuteAnteil < 16
  const heuteRechts = heuteAnteil !== null && heuteAnteil > 84

  return (
    <Screen title="Statistik" onBack={back}>
      <PeriodBar
        range={range}
        gesamt={period.kind === 'all'}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onOpen={() => push({ name: 'period', sheet: true })}
      />

      {totals.count === 0 ? (
        <Empty
          title="Nichts zu rechnen"
          hint="In diesem Zeitraum gibt es keine Buchungen."
        />
      ) : (
        <>
          <div className="k-card k-pad16">
            <div className="k-row-base">
              <span className="k-label grow">
                Ausgaben pro {series.perMonth ? 'Monat' : 'Tag'}
              </span>
              <span className="k-small-num muted">
                Spitze {formatCent(series.points.reduce((m, p) => Math.max(m, p.exp), 0))} €
              </span>
            </div>
            <Bars points={series.points} />
            <div className="k-axis">
              <span style={heuteLinks ? { visibility: 'hidden' } : undefined}>
                {series.perMonth ? firstDay?.label : `${firstDay?.label}.`}
              </span>
              {heuteAnteil !== null ? (
                <span
                  className={`strong k-axis-heute${heuteLinks ? ' links' : heuteRechts ? ' rechts' : ''}`}
                  style={heuteLinks || heuteRechts ? undefined : { left: `${heuteAnteil}%` }}
                >
                  heute, {parseKey(todayKey()).getDate()}.
                </span>
              ) : null}
              <span style={heuteRechts ? { visibility: 'hidden' } : undefined}>
                {series.perMonth ? lastDay?.label : `${lastDay?.label}.`}
              </span>
            </div>
            <div className="k-inc-row">
              <span className="k-dot" style={{ background: 'var(--inc)' }} />
              <span className="grow">
                Einnahmen {incomeDays > 0 ? `an ${incomeDays} ${incomeDays === 1 ? 'Tag' : 'Tagen'}` : 'keine'}
              </span>
              <span className="k-small-num strong inc"><Money cent={totals.inc} /> €</span>
            </div>
          </div>

          <div className="k-card k-pad16">
            <div className="k-row-base">
              <span className="k-label grow">Sparquote</span>
              <span className={`k-quote ${savings !== null && savings >= 0 ? 'inc' : 'exp'}`}>
                {savings === null ? '–' : `${(savings * 100).toFixed(1).replace('-', '−').replace('.', ',')} %`}
              </span>
            </div>
            <div className="k-track">
              <span
                className="k-track-fill"
                style={{
                  width: `${Math.max(0, Math.min(100, (savings ?? 0) * 100))}%`,
                  background: 'var(--inc)',
                }}
              />
            </div>
            <div className="k-kpi-grid">
              <div>
                <div className="k-kpi-num"><Money cent={avgPerDay} /></div>
                <div className="k-kpi-lbl">Ø pro Tag</div>
              </div>
              <div>
                <div className="k-kpi-num">{proj === null ? '–' : <>~<Money cent={proj} /></>}</div>
                <div className="k-kpi-lbl">Hochrechnung</div>
              </div>
              <div>
                <div className="k-kpi-num">{free.free} / {free.total}</div>
                <div className="k-kpi-lbl">ausgabenfreie Tage</div>
              </div>
            </div>
          </div>

          {now.all.length ? (
            <div className="k-card k-pad16">
              <div className="k-label">Größte Kategorien</div>
              <div className="k-top">
                {now.all.slice(0, 5).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="k-top-row"
                    onClick={() =>
                      push({ name: 'categoryDetail', segment: { ...s, share: now.total ? s.value / now.total : 0 }, kind: 'expense' })
                    }
                  >
                    <span className="k-top-name">{s.name}</span>
                    <span className="k-track thin">
                      <span
                        className="k-track-fill"
                        style={{ width: `${maxTop ? (s.value / maxTop) * 100 : 0}%`, background: s.color }}
                      />
                    </span>
                    <span className="k-top-val"><Money cent={s.value} /></span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

        </>
      )}
    </Screen>
  )
}

export default Stats
