import { useMemo } from 'react'
import EntryRow from './EntryRow'
import { LabelledBars } from '../charts'
import { categoryHistory, entryFlow } from '../calc'
import { Glyph, IconPencil } from '../icons'
import { Money, Screen } from '../ui'
import { ID_OTHER, ID_TRANSFER } from '../data'
import { formatDate, inRange, periodRange } from '../util'
import { sortedEntries } from '../kontorStore'
import type { KontorCtx, Segment, ViewProps } from '../types'

// Ohne Segment gibt es nichts zu zeigen - aussen nur die Pruefung, damit die
// Hooks innen nicht bedingt laufen.
function CategoryDetail({ ctx, view }: ViewProps) {
  if (!view.segment) {
    return (
      <Screen title="Kategorie" onBack={ctx.back}>
        <div className="k-meta">Diese Kategorie gibt es nicht mehr.</div>
      </Screen>
    )
  }
  return <CategoryDetailInner ctx={ctx} seg={view.segment} kind={view.kind ?? 'expense'} />
}

function CategoryDetailInner({ ctx, seg, kind }: { ctx: KontorCtx; seg: Segment; kind: 'expense' | 'income' }) {
  const { entries, accById, catById, categories, settings, period, back, push, firstKey } = ctx
  const isGroup = seg.id === ID_OTHER
  const isTransfer = seg.id === ID_TRANSFER
  const category = categories.find((c) => c.id === seg.id) ?? null

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  const members = useMemo(() => (isGroup ? new Set(seg.members ?? []) : null), [isGroup, seg.members])

  const matching = useMemo(
    () =>
      sortedEntries(entries).filter((e) => {
        if (!inRange(e.date, range)) return false
        const f = entryFlow(e, accById, settings.countBoundaryTransfers)
        if (!f.bucket) return false
        if (kind === 'expense' ? !f.exp : !f.inc) return false
        return members ? members.has(f.bucket) : f.bucket === seg.id
      }),
    [entries, range, accById, settings.countBoundaryTransfers, seg.id, kind, members],
  )

  const history = useMemo(() => {
    if (isGroup || isTransfer) return null
    return categoryHistory({
      entries,
      categoryId: seg.id,
      kind: period.kind,
      anchor: period.anchor,
      weekStart: settings.weekStart,
      accById,
      countBoundary: settings.countBoundaryTransfers,
    })
  }, [entries, seg.id, period, settings, accById, isGroup, isTransfer])

  const avg = history && history.length
    ? Math.round(history.reduce((s, p) => s + p.value, 0) / history.length)
    : null
  const biggest = matching.reduce((m, e) => Math.max(m, e.amountCent), 0)

  const budget = category?.budgetCent ?? null
  const showBudget = !!budget && kind === 'expense' && period.kind === 'month'
  const used = showBudget ? seg.value : 0
  const pct = showBudget ? Math.min(999, Math.round((used / budget) * 100)) : 0

  return (
    <Screen
      title={
        <div className="k-head-with-icon">
          <span style={{ color: seg.color }}><Glyph name={seg.icon} /></span>
          <span className="k-head-title">{seg.name}</span>
        </div>
      }
      onBack={back}
      right={
        category ? (
          <button
            type="button"
            className="k-ic"
            onClick={() => push({ name: 'categoryForm', categoryId: category.id })}
            aria-label="Kategorie bearbeiten"
          >
            <IconPencil />
          </button>
        ) : undefined
      }
    >
      <div className="k-hero" style={{ color: seg.color }}>
        <Money cent={seg.value} />
        <span className="k-hero-cur">€</span>
      </div>
      <div className="k-hero-sub">
        {Math.round(seg.share * 100)} % {kind === 'expense' ? 'der Ausgaben' : 'der Einnahmen'} ·{' '}
        {range.label}
      </div>

      {isGroup ? (
        <div className="k-note-box plain">
          <div>
            „Sonstiges" bündelt die kleinsten Kategorien, damit der Ring lesbar bleibt. Hier stehen
            die Buchungen aller {seg.members?.length ?? 0} gebündelten Kategorien.
          </div>
        </div>
      ) : null}

      {isTransfer ? (
        <div className="k-note-box plain">
          <div>
            Umbuchungen auf Konten außerhalb der Gesamtbalance. Es ist keine echte Ausgabe – das
            Geld liegt weiter auf einem deiner Konten, nur nicht im gezählten Teil.
          </div>
        </div>
      ) : null}

      {showBudget ? (
        <div className="k-card k-pad16">
          <div className="k-row-base">
            <span className="k-label grow">Monatsbudget</span>
            <span className="k-small-num">
              <Money cent={used} /> / <Money cent={budget} /> €
            </span>
          </div>
          <div className="k-track">
            <span
              className="k-track-fill"
              style={{ width: `${Math.min(100, pct)}%`, background: pct > 100 ? 'var(--exp)' : seg.color }}
            />
          </div>
          <div className="k-row-base spread">
            <span className="k-small-num strong">{pct} % genutzt</span>
            <span className="k-small-num muted">
              {budget - used >= 0 ? (
                <><Money cent={budget - used} /> € übrig</>
              ) : (
                <><Money cent={used - budget} /> € über Budget</>
              )}
            </span>
          </div>
        </div>
      ) : null}

      {history ? (
        <div className="k-card k-pad16">
          <div className="k-label">Letzte 6 Zeiträume (in €)</div>
          <LabelledBars points={history} color={seg.color} />
        </div>
      ) : null}

      <div className="k-kpis">
        <div className="k-card k-kpi">
          <div className="k-kpi-num">{avg === null ? '–' : <Money cent={avg} />}</div>
          <div className="k-kpi-lbl">Ø pro Zeitraum</div>
        </div>
        <div className="k-card k-kpi">
          <div className="k-kpi-num"><Money cent={biggest} einzel /></div>
          <div className="k-kpi-lbl">größte Buchung</div>
        </div>
        <div className="k-card k-kpi">
          <div className="k-kpi-num">{matching.length}</div>
          <div className="k-kpi-lbl">Buchungen</div>
        </div>
      </div>

      <div className="k-card k-list-card">
        <div className="k-label k-list-label">Buchungen · {range.label}</div>
        {matching.length === 0 ? (
          <div className="k-list-empty">Keine Buchungen in diesem Zeitraum.</div>
        ) : (
          <div className="k-list">
            {matching.map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                catById={catById}
                accById={accById}
                showDate
                onClick={() => push({ name: 'entry', entryId: e.id })}
              />
            ))}
          </div>
        )}
      </div>

      {range.from && range.to ? <div className="k-meta">Zeitraum {formatDate(range.from)} – {formatDate(range.to)}</div> : null}
    </Screen>
  )
}

export default CategoryDetail
