import { useMemo } from 'react'
import EntryRow from './EntryRow'
import { entryFlow, totalsInRange } from '../calc'
import { Empty, Money, Screen } from '../ui'
import { formatDayHeading, inRange, periodRange } from '../util'
import { sortedEntries } from '../kontorStore'
import type { Entry, ViewProps } from '../types'

function EntryList({ ctx }: ViewProps) {
  const { entries, accById, catById, settings, period, back, push, firstKey } = ctx

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  const totals = totalsInRange(entries, range, accById, settings.countBoundaryTransfers)

  // Nach Tagen gruppieren. Die Tagessumme ist der Nettofluss des Tages, damit
  // eine Gutschrift eine Ausgabe im Kopf auch wirklich ausgleicht.
  const groups = useMemo(() => {
    const list = sortedEntries(entries).filter((e) => inRange(e.date, range))
    const out: { date: string; sum: number; items: Entry[] }[] = []
    for (const e of list) {
      let g = out[out.length - 1]
      if (!g || g.date !== e.date) {
        g = { date: e.date, sum: 0, items: [] }
        out.push(g)
      }
      const f = entryFlow(e, accById, settings.countBoundaryTransfers)
      g.sum += f.inc - f.exp
      g.items.push(e)
    }
    return out
  }, [entries, range, accById, settings.countBoundaryTransfers])

  return (
    <Screen
      title="Buchungen"
      sub={`${range.label} · Alle Konten`}
      onBack={back}
    >
      <div className="k-card k-triple">
        <div>
          <div className="k-label">Einnahmen</div>
          <div className="k-triple-num inc"><Money cent={totals.inc} /></div>
        </div>
        <span className="k-vr" />
        <div>
          <div className="k-label">Ausgaben</div>
          <div className="k-triple-num exp"><Money cent={totals.exp} sign="minus" /></div>
        </div>
        <span className="k-vr" />
        <div>
          <div className="k-label">Differenz</div>
          <div className="k-triple-num"><Money cent={totals.diff} sign="auto" /></div>
        </div>
      </div>

      {groups.length === 0 ? (
        <Empty
          title="Keine Buchungen in diesem Zeitraum"
          hint="Mit − und + auf der Startseite erfasst du die erste."
          action={
            <button type="button" className="k-primary" onClick={() => push({ name: 'entry', type: 'expense' })}>
              Ausgabe erfassen
            </button>
          }
        />
      ) : (
        <div className="k-groups">
          {groups.map((g) => (
            <section key={g.date}>
              <div className="k-group-head">
                <span>{formatDayHeading(g.date)}</span>
                <span className="k-group-sum">
                  <Money cent={g.sum} sign={g.sum === 0 ? 'none' : 'auto'} />
                </span>
              </div>
              <div className="k-list">
                {g.items.map((e) => (
                  <EntryRow
                    key={e.id}
                    entry={e}
                    catById={catById}
                    accById={accById}
                    onClick={() =>
                      e.type === 'adjustment'
                        ? push({ name: 'accountDetail', accountId: e.accountId })
                        : push({ name: 'entry', entryId: e.id })
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

    </Screen>
  )
}

export default EntryList
