import { useMemo, useState } from 'react'
import { IonItem, IonItemOption, IonItemOptions, IonItemSliding, IonList } from '@ionic/react'
import EntryRow, { entrySearchText } from './EntryRow'
import { entryFlow, totalsInRange } from '../calc'
import { IconClose, IconSearch } from '../icons'
import { Empty, Money, Screen } from '../ui'
import { formatDayHeading, inRange, periodRange } from '../util'
import { sortedEntries } from '../kontorStore'
import type { Entry, EntryType, ViewProps } from '../types'

// Kein Zeitraum: die Suche geht ueber alles. Wer "Pizza" sucht, will wissen,
// wann es die letzte gab - nicht nur, ob in diesem Monat.
const ALLE = { from: null, to: null }

// Schnellfilter nach Art. Korrekturen stehen nur unter "Alle": sie sind kein
// Geldfluss, sondern ein Nachtrag zum Saldo.
type Filter = 'all' | Exclude<EntryType, 'adjustment'>
const FILTERS: { id: Filter; label: string; leer: string }[] = [
  { id: 'all', label: 'Alle', leer: 'Keine Buchungen' },
  { id: 'expense', label: 'Ausgaben', leer: 'Keine Ausgaben' },
  { id: 'income', label: 'Einnahmen', leer: 'Keine Einnahmen' },
  { id: 'transfer', label: 'Umbuchungen', leer: 'Keine Umbuchungen' },
]

function EntryList({ ctx }: ViewProps) {
  const { entries, accById, catById, settings, period, back, push, firstKey, removeEntry } = ctx
  const [query, setQuery] = useState('')
  // Die Suche liegt hinter der Lupe: meist schaut man nur durch, und das
  // Feld kostete dafuer jedes Mal eine Zeile.
  const [suche, setSuche] = useState(false)
  const [filter, setFilter] = useState<Filter>('all')
  const needle = query.trim().toLowerCase()
  const searching = needle.length > 0

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  // Alle Woerter muessen vorkommen, egal wo: "pizza bar" findet die Pizza,
  // die vom Bargeldkonto bezahlt wurde.
  const found = useMemo(() => {
    if (!needle) return entries.filter((e) => inRange(e.date, range))
    const words = needle.split(/\s+/)
    return entries.filter((e) => {
      const text = entrySearchText(e, catById, accById)
      return words.every((w) => text.includes(w))
    })
  }, [entries, range, needle, catById, accById])

  const shown = useMemo(
    () => (filter === 'all' ? found : found.filter((e) => e.type === filter)),
    [found, filter],
  )

  // Die Summen oben gehen ueber alles Gefundene, nicht nur ueber den Filter:
  // sie sollen nicht auf null springen, wenn man kurz nur die Einnahmen
  // ansieht. Beim Suchen sind es die Summen der Treffer - "wie viel ging
  // insgesamt fuer Pizza weg" ist genau die Frage, die man damit meist stellt.
  const totals = totalsInRange(found, ALLE, accById, settings.countBoundaryTransfers)

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

  const zu = () => {
    setQuery('')
    setSuche(false)
  }

  return (
    <Screen
      title="Buchungen"
      sub={
        searching
          ? `Alle Zeiträume · ${found.length} Treffer`
          : `${range.label} · alle Konten`
      }
      onBack={back}
      right={
        <button
          type="button"
          className={`k-ic${suche ? ' on' : ''}`}
          onClick={() => (suche ? zu() : setSuche(true))}
          aria-label={suche ? 'Suche schließen' : 'Buchungen durchsuchen'}
          aria-pressed={suche}
        >
          <IconSearch />
        </button>
      }
    >
      {suche ? (
        <label className="k-search">
          <span className="k-search-ic"><IconSearch /></span>
          <input
            type="search"
            enterKeyHint="search"
            value={query}
            aria-label="Buchungen durchsuchen"
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className="k-search-clear" onClick={zu} aria-label="Suche schließen">
            <IconClose />
          </button>
        </label>
      ) : null}

      {/* Drei Zahlen ohne Karte - die Liste darunter ist die Hauptsache. */}
      <div className="k-sum3">
        <div>
          <div className="k-label">Einnahmen</div>
          <div className="k-sum3-num inc"><Money cent={totals.inc} sign={totals.inc ? 'plus' : 'none'} /></div>
        </div>
        <div>
          <div className="k-label">Ausgaben</div>
          <div className="k-sum3-num"><Money cent={totals.exp} sign={totals.exp ? 'minus' : 'none'} /></div>
        </div>
        <div>
          <div className="k-label">Übrig</div>
          <div className={`k-sum3-num${totals.diff < 0 ? ' exp' : ''}`}>
            <Money cent={totals.diff} sign={totals.diff ? 'auto' : 'none'} />
          </div>
        </div>
      </div>

      <div className="k-chips k-filter" role="group" aria-label="Zeigen">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`k-chip${filter === f.id ? ' on' : ''}`}
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        searching ? (
          <Empty title="Nichts gefunden" />
        ) : filter !== 'all' ? (
          <Empty title={`${FILTERS.find((f) => f.id === filter)?.leer} in diesem Zeitraum`} />
        ) : (
          <Empty
            title="Keine Buchungen in diesem Zeitraum"
            action={
              <button type="button" className="k-primary" onClick={() => push({ name: 'entry', type: 'expense' })}>
                Ausgabe erfassen
              </button>
            }
          />
        )
      ) : (
        <div className="k-groups flat">
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
              <IonList className="k-list flat" lines="none">
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
