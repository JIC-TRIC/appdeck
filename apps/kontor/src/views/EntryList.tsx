import { useMemo, useState } from 'react'
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonList } from '@ionic/react'
import EntryRow, { entrySearchText } from './EntryRow'
import { entryFlow, totalsInRange } from '../calc'
import { IconClose, IconSearch } from '../icons'
import { Empty, Money, Screen } from '../ui'
import { formatDayHeading, inRange, periodRange } from '../util'
import { sortedEntries } from '../kontorStore'
import type { Entry, ViewProps } from '../types'

// Kein Zeitraum: die Suche geht ueber alles. Wer "Pizza" sucht, will wissen,
// wann es die letzte gab - nicht nur, ob in diesem Monat.
const ALLE = { from: null, to: null }

function EntryList({ ctx }: ViewProps) {
  const { entries, accById, catById, settings, period, back, push, firstKey, removeEntry } = ctx
  const [query, setQuery] = useState('')
  const needle = query.trim().toLowerCase()
  const searching = needle.length > 0

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  // Alle Woerter muessen vorkommen, egal wo: "pizza bar" findet die Pizza,
  // die vom Bargeldkonto bezahlt wurde.
  const shown = useMemo(() => {
    if (!needle) return entries.filter((e) => inRange(e.date, range))
    const words = needle.split(/\s+/)
    return entries.filter((e) => {
      const text = entrySearchText(e, catById, accById)
      return words.every((w) => text.includes(w))
    })
  }, [entries, range, needle, catById, accById])

  // Beim Suchen stehen oben die Summen der Treffer - "wie viel ging insgesamt
  // fuer Pizza weg" ist genau die Frage, die man damit meist stellt.
  const totals = totalsInRange(shown, ALLE, accById, settings.countBoundaryTransfers)

  // Nach Tagen gruppieren. Die Tagessumme ist der Nettofluss des Tages, damit
  // eine Gutschrift eine Ausgabe im Kopf auch wirklich ausgleicht.
  const groups = useMemo(() => {
    const out: { date: string; sum: number; items: Entry[] }[] = []
    for (const e of sortedEntries(shown)) {
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
  }, [shown, accById, settings.countBoundaryTransfers])

  const open = (e: Entry) =>
    e.type === 'adjustment'
      ? push({ name: 'accountDetail', accountId: e.accountId })
      : push({ name: 'entry', entryId: e.id })

  return (
    <Screen
      title="Buchungen"
      sub={
        searching
          ? `Alle Zeiträume · ${shown.length} Treffer`
          : `${range.label} · Alle Konten`
      }
      onBack={back}
    >
      <label className="k-search">
        <span className="k-search-ic"><IconSearch /></span>
        <input
          type="search"
          enterKeyHint="search"
          value={query}
          placeholder="Notiz, Kategorie, Konto, Betrag"
          aria-label="Buchungen durchsuchen"
          onChange={(e) => setQuery(e.target.value)}
        />
        {query ? (
          <button type="button" className="k-search-clear" onClick={() => setQuery('')} aria-label="Suche leeren">
            <IconClose />
          </button>
        ) : null}
      </label>

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
        searching ? (
          <Empty
            title="Nichts gefunden"
            hint="Gesucht wird in Notiz, Kategorie, Konto und Betrag – über alle Zeiträume."
          />
        ) : (
          <Empty
            title="Keine Buchungen in diesem Zeitraum"
            hint="Mit − und + auf der Startseite erfasst du die erste."
            action={
              <button type="button" className="k-primary" onClick={() => push({ name: 'entry', type: 'expense' })}>
                Ausgabe erfassen
              </button>
            }
          />
        )
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
              {/* Nach links wischen loescht - ganz durchgewischt sofort, sonst
                  ueber den Knopf. Korrekturen nicht: die gehoeren zum Saldo und
                  werden im Kontodetail korrigiert. */}
              <IonList className="k-list" lines="none">
                {g.items.map((e) => (
                  <IonItemSliding key={e.id} className="k-slide" disabled={e.type === 'adjustment'}>
                    <IonItem className="k-slide-item" lines="none">
                      <EntryRow entry={e} catById={catById} accById={accById} onClick={() => open(e)} />
                    </IonItem>
                    <IonItemOptions side="end" onIonSwipe={() => removeEntry(e)}>
                      <IonItemOption className="k-slide-del" expandable onClick={() => removeEntry(e)}>
                        Löschen
                      </IonItemOption>
                    </IonItemOptions>
                  </IonItemSliding>
                ))}
              </IonList>
            </section>
          ))}
        </div>
      )}

    </Screen>
  )
}

export default EntryList
