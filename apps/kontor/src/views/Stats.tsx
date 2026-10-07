import { useMemo, useState } from 'react'
import { Bars, LabelledBars, Line } from '../charts'
import {
  breakdown,
  projection,
  seriesForPeriod,
  spendFreeDays,
  totalsInRange,
  wealthSeries,
  weekdayProfile,
} from '../calc'
import { Empty, Money, PeriodBar, Screen } from '../ui'
import { Glyph, IconRight } from '../icons'
import { WEEKDAYS, formatCent, formatDate, parseKey, periodRange, shiftPeriod, todayKey } from '../util'
import { betragOderMaske } from '../diskret'
import type { ViewProps } from '../types'

function Stats({ ctx }: ViewProps) {
  const { entries, accounts, accById, catById, settings, period, setPeriod, back, push, firstKey } = ctx
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
  const spitze = series.points.reduce((m, p) => Math.max(m, p.exp), 0)
  const incomeDays = new Set(
    entries
      .filter((e) => e.type === 'income' && (!range.from || (e.date >= range.from && e.date <= (range.to as string))))
      .map((e) => e.date),
  ).size

  const maxTop = now.all[0]?.value ?? 0
  // Die groessten fuenf, auf Wunsch alle. Budgets nur im Monat - in jedem
  // anderen Zeitraum waere der Vergleich schief.
  const [alleKategorien, setAlleKategorien] = useState(false)
  const kategorien = alleKategorien ? now.all : now.all.slice(0, 5)
  const mitBudget = period.kind === 'month'

  // Laeuft der Zeitraum noch? Dann sind Durchschnitt und ausgabenfreie Tage
  // "bis heute" gezaehlt.
  const laufend = !range.to || range.to >= todayKey()
  const ganz = period.kind === 'week' ? 'die ganze Woche' : period.kind === 'year' ? 'das ganze Jahr' : 'den ganzen Monat'
  // Durchschnitt fuer die gestrichelte Linie: pro Tag, in Jahr und Gesamt pro
  // Monat (ohne die kommenden).
  const vergangen = series.points.filter((p) =>
    series.perMonth ? p.key <= todayKey().slice(0, 7) : p.key <= todayKey(),
  )
  const avgBalken = series.perMonth
    ? vergangen.length ? Math.round(vergangen.reduce((sum, p) => sum + p.exp, 0) / vergangen.length) : null
    : avgPerDay

  // Wochentage erst ab Monat: in einer Woche ist jeder Tag nur einmal da -
  // das zeigt schon "Ausgaben pro Tag".
  const profil = useMemo(
    () =>
      period.kind === 'day' || period.kind === 'week'
        ? null
        : weekdayProfile(entries, range, accById, countBoundary, firstKey, settings.weekStart),
    [period.kind, entries, range, accById, countBoundary, firstKey, settings.weekStart],
  )
  const profilMax = profil ? profil.reduce((m, t, i) => (t.value > profil[m].value ? i : m), 0) : -1
  const profilTop = profil && profil[profilMax].value > 0 ? profil[profilMax] : null

  const vermoegen = useMemo(() => wealthSeries(entries, accounts, range, firstKey), [entries, accounts, range, firstKey])
  const ausserhalb = accounts.filter((a) => !a.includeInTotal && !a.archived).map((a) => a.name)

  const firstDay = series.points[0]
  const lastDay = series.points[series.points.length - 1]
  // "heute" steht unter seinem Balken, nicht einfach in der Mitte. Liegt der
  // Tag am Rand, ersetzt er die Beschriftung dort, statt sie zu ueberdecken.
  const heuteIndex = series.perMonth ? -1 : series.points.findIndex((p) => p.key === todayKey())
  const heuteAnteil = heuteIndex < 0 ? null : ((heuteIndex + 0.5) / series.points.length) * 100
  const heuteLinks = heuteAnteil !== null && heuteAnteil < 16
  const heuteRechts = heuteAnteil !== null && heuteAnteil > 84

  const tage = (n: number) => `${n} ${n === 1 ? 'Tag' : 'Tage'}`

  return (
    <Screen
      title="Statistik"
      onBack={back}
      // Der Zeitraum steht fest unter dem Titel - wer unten bei den
      // Kategorien ist, soll nicht erst hochscrollen muessen, um zu blaettern.
      kopf={
        <PeriodBar
          range={range}
          gesamt={period.kind === 'all'}
          onPrev={() => move(-1)}
          onNext={() => move(1)}
          onOpen={() => push({ name: 'period', sheet: true })}
        />
      }
    >
      {totals.count === 0 ? (
        <Empty
          title="Nichts zu rechnen"
          hint="In diesem Zeitraum gibt es keine Buchungen."
        />
      ) : (
        <>
          {/* Auf einen Blick: die vier Zahlen, die man meistens sucht. */}
          <div className="k-kpi4">
            <div className="k-card k-kpi4-tile">
              <div className="k-kpi4-l">Sparquote</div>
              <div className={`k-kpi4-v${savings === null ? '' : savings >= 0 ? ' inc' : ' exp'}`}>
                {savings === null ? '–' : `${(savings * 100).toFixed(1).replace('-', '−').replace('.', ',')} %`}
              </div>
              <span className="k-track mini">
                <span
                  className="k-track-fill"
                  style={{ width: `${Math.max(0, Math.min(100, (savings ?? 0) * 100))}%`, background: 'var(--inc)' }}
                />
              </span>
              <div className="k-kpi4-s">
                <Money cent={Math.abs(totals.diff)} /> € {totals.diff < 0 ? 'mehr ausgegeben' : 'übrig'}
              </div>
            </div>
            <div className="k-card k-kpi4-tile">
              <div className="k-kpi4-l">Ø pro Tag</div>
              <div className="k-kpi4-v"><Money cent={avgPerDay} /> <span className="k-cur">€</span></div>
              <div className="k-kpi4-s">{tage(free.total)}{laufend ? ' bis heute' : ''}</div>
            </div>
            <div className="k-card k-kpi4-tile">
              <div className="k-kpi4-l">Hochrechnung</div>
              <div className="k-kpi4-v">
                {proj === null
                  ? '–'
                  : `~${betragOderMaske(ctx.diskret, proj, Math.round(proj / 100).toLocaleString('de-DE'))} €`}
              </div>
              <div className="k-kpi4-s">{proj === null ? 'nur im laufenden Zeitraum' : `für ${ganz}`}</div>
            </div>
            <div className="k-card k-kpi4-tile">
              <div className="k-kpi4-l">Ohne Ausgaben</div>
              <div className="k-kpi4-v">{tage(free.free)}</div>
              <div className="k-kpi4-s">von {free.total}{laufend ? ' bisher' : ''}</div>
            </div>
          </div>

          <div className="k-card k-pad16">
            <div className="k-row-base">
              <span className="k-label grow">
                Ausgaben pro {series.perMonth ? 'Monat' : 'Tag'}
              </span>
              <span className="k-small-num muted">
                Spitze {betragOderMaske(ctx.diskret, spitze, formatCent(spitze))} €
              </span>
            </div>
            <Bars points={series.points} avg={avgBalken} />
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

          {now.all.length ? (
            <div className="k-card k-pad16">
              <div className="k-row-base">
                <span className="k-label grow">Kategorien</span>
                {now.all.length > 5 ? (
                  <span className="k-small-num muted">{kategorien.length} von {now.all.length}</span>
                ) : null}
              </div>
              <div className="k-catstat-list">
                {kategorien.map((s) => {
                  const budget = mitBudget ? catById[s.id]?.budgetCent ?? null : null
                  const anteil = now.total ? s.value / now.total : 0
                  const quote = budget ? Math.round((s.value / budget) * 100) : null
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className="k-catstat"
                      onClick={() => push({ name: 'categoryDetail', segment: { ...s, share: anteil }, kind: 'expense' })}
                    >
                      <span className="k-cat-row-av" style={{ color: s.color, background: `${s.color}1F` }}>
                        <Glyph name={s.icon} />
                      </span>
                      <span className="k-catstat-mid">
                        <span className="k-catstat-top">
                          <span className="k-catstat-name">{s.name}</span>
                          <span className="k-catstat-val"><Money cent={s.value} /></span>
                        </span>
                        <span className="k-catstat-bar">
                          <span style={{ width: `${maxTop ? (s.value / maxTop) * 100 : 0}%`, background: s.color }} />
                          {/* Strich = Budget, damit man sieht, wie weit drueber oder drunter */}
                          {budget ? <i style={{ left: `${Math.min(100, (budget / maxTop) * 100)}%` }} /> : null}
                        </span>
                        <span className={`k-catstat-note${quote !== null && quote > 100 ? ' exp' : ''}`}>
                          {quote !== null ? `${quote} % vom Budget` : `${Math.max(1, Math.round(anteil * 100))} %`}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
              {now.all.length > 5 ? (
                <button type="button" className="k-textlink left" onClick={() => setAlleKategorien((a) => !a)}>
                  {alleKategorien ? 'Weniger zeigen' : `Alle ${now.all.length} Kategorien`}
                  {alleKategorien ? null : <span className="k-textlink-ic"><IconRight /></span>}
                </button>
              ) : null}
            </div>
          ) : null}

          {profil ? (
            <div className="k-card k-pad16">
              <div className="k-row-base">
                <span className="k-label grow">Typischer Tag (in €)</span>
                <span className="k-small-num muted">
                  {profilTop ? `am meisten ${WEEKDAYS[profilTop.weekday].toLowerCase()}s` : 'kein Muster'}
                </span>
              </div>
              <LabelledBars points={profil} color="var(--exp)" highlight={profilTop ? profilMax : -1} />
              <div className="k-meta tight">
                Was an einem Wochentag typischerweise weggeht (Median bis heute). Einzelne große
                Posten wie die Miete verzerren das Bild so nicht.
              </div>
            </div>
          ) : null}

          {vermoegen && vermoegen.points.length > 1 ? (
            <div className="k-card k-pad16">
              <div className="k-row-base">
                <span className="k-label grow">Vermögen · alle Konten</span>
                <span className={`k-small-num strong ${vermoegen.end - vermoegen.start >= 0 ? 'inc' : 'exp'}`}>
                  <Money cent={vermoegen.end - vermoegen.start} sign="auto" />
                </span>
              </div>
              <div className="k-big-num">
                <Money cent={vermoegen.end} /> <span className="k-cur">€</span>
              </div>
              <Line points={vermoegen.points} color="var(--neutral)" />
              <div className="k-meta tight">
                Stand {formatDate(vermoegen.points[vermoegen.points.length - 1].label)}
                {ausserhalb.length
                  ? ` · inklusive ${ausserhalb.join(', ')} (nicht in der Gesamtbalance)`
                  : ''}
              </div>
            </div>
          ) : null}
        </>
      )}
    </Screen>
  )
}

export default Stats
