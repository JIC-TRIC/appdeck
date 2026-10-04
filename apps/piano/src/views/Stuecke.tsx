import { useMemo, useState } from 'react'
import { IconList, IconPlus, IconSearch, IconSort } from '../icons'
import { Heading, IconButton, Keys, ListSheet, TabPage, Thumb } from '../ui'
import { pieceTotal, sortPieces } from '../calc'
import { filterOf, isArchived, type Filter } from '../model'
import { updateSettings } from '../store'
import { formatTotal } from '../util'
import type { PianoCtx, SortBy } from '../types'

// Archiv ist kein Lernstand, sondern ein eigener Stapel: nur sichtbar, wenn es etwas gibt.
type Chip = Filter | 'archiv'

const FILTERS: { id: Chip; label: string }[] = [
  { id: 'alle', label: 'Alle' },
  { id: 'arbeit', label: 'In Arbeit' },
  { id: 'gelernt', label: 'Gelernt' },
  { id: 'auswendig', label: 'Auswendig' },
  { id: 'archiv', label: 'Archiv' },
]

export const SORTS: { id: SortBy; label: string }[] = [
  { id: 'trending', label: 'Im Trend' },
  { id: 'lastPracticed', label: 'Zuletzt geübt' },
  { id: 'practiceTime', label: 'Übezeit' },
  { id: 'progress', label: 'Lernstand' },
  { id: 'difficulty', label: 'Schwierigkeit' },
  { id: 'title', label: 'Titel' },
  { id: 'default', label: 'Hinzugefügt' },
  { id: 'random', label: 'Zufall' },
]

function Stuecke({ ctx }: { ctx: PianoCtx }) {
  const { pieces, sessions, settings, now, push, openForm, refresh } = ctx
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Chip>('alle')
  const [sortOpen, setSortOpen] = useState(false)
  // "Zufall" mischt beim Waehlen neu, nicht bei jedem Zeichnen.
  const [seed, setSeed] = useState(() => Date.now())

  const counts = useMemo(() => {
    const c: Record<Chip, number> = { alle: 0, arbeit: 0, gelernt: 0, auswendig: 0, archiv: 0 }
    for (const p of pieces) {
      if (isArchived(p)) c.archiv += 1
      else {
        c.alle += 1
        c[filterOf(p.progress)] += 1
      }
    }
    return c
  }, [pieces])

  // Archivierte nur unter "Archiv" - oder wenn unter "Alle" gesucht wird:
  // die Suche soll alles finden.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (p: (typeof pieces)[number]) =>
      !q || p.title.toLowerCase().includes(q) || p.artist.toLowerCase().includes(q)
    const sorted = sortPieces(pieces, sessions, settings.sort, now, seed).filter(matches)
    if (filter === 'archiv') return sorted.filter(isArchived)
    const aktiv = sorted.filter((p) => !isArchived(p) && (filter === 'alle' || filterOf(p.progress) === filter))
    return filter === 'alle' && q ? [...aktiv, ...sorted.filter(isArchived)] : aktiv
  }, [pieces, sessions, settings.sort, now, seed, query, filter])

  const sortLabel = SORTS.find((s) => s.id === settings.sort.by)?.label ?? 'Im Trend'
  const setSort = (by: SortBy, reverse = settings.sort.reverse) => {
    if (by === 'random') setSeed(Date.now())
    updateSettings({ sort: { by, reverse } })
    refresh()
  }

  return (
    <TabPage>
      <Heading
        title="Stücke"
        right={
          <>
            <IconButton label="Setlists" onClick={() => push({ name: 'setlists' })}>
              <IconList />
            </IconButton>
            <IconButton label="Stück hinzufügen" onClick={() => openForm()}>
              <IconPlus />
            </IconButton>
          </>
        }
      />

      {pieces.length ? (
        <>
          <div className="p-hstack" style={{ gap: 8 }}>
            <label className="p-search">
              <IconSearch />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Titel oder Interpret"
                aria-label="Suchen"
                enterKeyHint="search"
              />
            </label>
            <IconButton label={`Sortierung: ${sortLabel}`} onClick={() => setSortOpen(true)}>
              <IconSort />
            </IconButton>
          </div>

          <div className="p-chips scroll" role="group" aria-label="Filter">
            {FILTERS.filter((f) => f.id !== 'archiv' || counts.archiv > 0 || filter === 'archiv').map((f) => (
              <button
                key={f.id}
                type="button"
                className={`p-chip${filter === f.id ? ' on' : ''}`}
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label} <span className="n">{counts[f.id]}</span>
              </button>
            ))}
          </div>

          {shown.length ? (
            <div className="p-grid">
              {shown.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`p-card p-tile${isArchived(p) ? ' archived' : ''}`}
                  onClick={() => push({ name: 'stueck', pieceId: p.id })}
                >
                  <Thumb piece={p} className="tile" tag={formatTotal(pieceTotal(sessions, p.id))} />
                  <span className="p-tile-body">
                    <span className="p-tile-t">{p.title}</span>
                    <span className="p-s3 p-ell">{p.artist || ' '}</span>
                    <Keys progress={p.progress} />
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-note p-center">{filter === 'archiv' && !query ? 'Das Archiv ist leer.' : 'Nichts gefunden.'}</p>
          )}
        </>
      ) : (
        <div className="p-empty small">
          <p className="p-sub p-center">Noch keine Stücke. Leg das erste mit einem YouTube-Link an.</p>
          <button type="button" className="p-btn" onClick={() => openForm()}>
            <IconPlus />
            Stück hinzufügen
          </button>
        </div>
      )}

      {sortOpen ? (
        <ListSheet
          label="Sortierung"
          title="Sortieren nach"
          onClose={() => setSortOpen(false)}
          items={[
            ...SORTS.map((s) => ({
              key: s.id,
              label: s.label,
              checked: settings.sort.by === s.id,
              onPick: () => setSort(s.id),
            })),
            {
              key: 'reverse',
              label: 'Reihenfolge umkehren',
              checked: settings.sort.reverse,
              disabled: settings.sort.by === 'random',
              keepOpen: true,
              onPick: () => setSort(settings.sort.by, !settings.sort.reverse),
            },
          ]}
        />
      ) : null}
    </TabPage>
  )
}

export default Stuecke
