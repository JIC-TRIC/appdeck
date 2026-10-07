import { useMemo, useState } from 'react'
import { IconFilter, IconList, IconPlus, IconSearch, IconSort } from '../icons'
import { Heading, IconButton, Keys, ListSheet, Sheet, TabPage, Thumb } from '../ui'
import { pieceTotal, sortPieces } from '../calc'
import {
  DIFFICULTIES,
  STATUSES,
  STATUS_LABEL,
  difficultyInfo,
  filterOf,
  filterSize,
  isArchived,
  matchesFilter,
  statusOf,
  type Filter,
} from '../model'
import { updateSettings } from '../store'
import { formatTotal } from '../util'
import type { Difficulty, PianoCtx, Piece, PieceFilter, SortBy, Status } from '../types'

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

// Im Filter-Blatt von leicht nach schwer, "Offen" am Ende.
const DIFF_OPTIONS = [...DIFFICULTIES.filter((d) => d.color), ...DIFFICULTIES.filter((d) => !d.color)]

const NO_FILTER: PieceFilter = { difficulty: [], status: [] }

/** "Leicht, Mittel · Zusammen" - fuer die Zeile unter den Chips */
function filterSummary(f: PieceFilter) {
  const diff = DIFF_OPTIONS.filter((d) => f.difficulty.includes(d.id)).map((d) => d.label)
  const status = STATUSES.filter((s) => f.status.includes(s)).map((s) => STATUS_LABEL[s])
  return [diff.join(', '), status.join(', ')].filter(Boolean).join(' · ')
}

function Stuecke({ ctx }: { ctx: PianoCtx }) {
  const { pieces, sessions, settings, now, push, openForm, refresh } = ctx
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Chip>('alle')
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  // "Zufall" mischt beim Waehlen neu, nicht bei jedem Zeichnen.
  const [seed, setSeed] = useState(() => Date.now())

  // Schwierigkeit und Lernstand aus dem Filter-Blatt - gespeichert wie die Sortierung.
  const pf = settings.filter
  const pfSize = filterSize(pf)
  const setPf = (next: PieceFilter) => {
    updateSettings({ filter: next })
    refresh()
  }

  // Die Zahlen an den Chips zaehlen nur, was der Filter durchlaesst.
  const counts = useMemo(() => {
    const c: Record<Chip, number> = { alle: 0, arbeit: 0, gelernt: 0, auswendig: 0, archiv: 0 }
    for (const p of pieces) {
      if (!matchesFilter(p, pf)) continue
      if (isArchived(p)) c.archiv += 1
      else {
        c.alle += 1
        c[filterOf(p.progress)] += 1
      }
    }
    return c
  }, [pieces, pf])

  // Archivierte nur unter "Archiv" - oder wenn unter "Alle" gesucht wird:
  // die Suche soll alles finden.
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const matches = (p: Piece) =>
      matchesFilter(p, pf) && (!q || p.title.toLowerCase().includes(q) || p.artist.toLowerCase().includes(q))
    const sorted = sortPieces(pieces, sessions, settings.sort, now, seed).filter(matches)
    if (filter === 'archiv') return sorted.filter(isArchived)
    const aktiv = sorted.filter((p) => !isArchived(p) && (filter === 'alle' || filterOf(p.progress) === filter))
    return filter === 'alle' && q ? [...aktiv, ...sorted.filter(isArchived)] : aktiv
  }, [pieces, sessions, settings.sort, now, seed, query, filter, pf])

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
            <button
              type="button"
              className={`p-ib${pfSize ? ' on' : ''}`}
              aria-label={pfSize ? `Filter: ${filterSummary(pf)}` : 'Filter'}
              onClick={() => setFilterOpen(true)}
            >
              <IconFilter />
              {pfSize ? <span className="p-ib-badge">{pfSize}</span> : null}
            </button>
            <IconButton label={`Sortierung: ${sortLabel}`} onClick={() => setSortOpen(true)}>
              <IconSort />
            </IconButton>
          </div>

          <div className="p-chips scroll" role="group" aria-label="Lernstand">
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

          {/* Ein gesetzter Filter bleibt gespeichert - deshalb immer sichtbar, mit einem Tipp weg. */}
          {pfSize ? (
            <div className="p-filter-line">
              <button type="button" className="p-filter-what" onClick={() => setFilterOpen(true)}>
                <IconFilter />
                <span className="p-ell">{filterSummary(pf)}</span>
              </button>
              <button type="button" className="p-filter-clear" onClick={() => setPf(NO_FILTER)}>
                Aufheben
              </button>
            </div>
          ) : null}

          {shown.length ? (
            <>
              <div className="p-grid">
                {shown.map((p) => {
                  const diff = difficultyInfo(p.difficulty)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`p-card p-tile${isArchived(p) ? ' archived' : ''}`}
                      onClick={() => push({ name: 'stueck', pieceId: p.id })}
                    >
                      <Thumb piece={p} className="tile" tag={formatTotal(pieceTotal(sessions, p.id))}>
                        {/* Schwierigkeit als farbige Ecke oben im Bild, der Lernstand unten - zwei verschiedene Dinge */}
                        {diff.color ? (
                          <span
                            className="p-thumb-corner"
                            style={{ background: diff.color }}
                            role="img"
                            aria-label={`Schwierigkeit: ${diff.label}`}
                          />
                        ) : null}
                      </Thumb>
                      <span className="p-tile-body">
                        <span className="p-tile-t">{p.title}</span>
                        <span className="p-s3 p-ell">{p.artist || ' '}</span>
                        <Keys progress={p.progress} />
                      </span>
                    </button>
                  )
                })}
              </div>
              {shown.some((p) => difficultyInfo(p.difficulty).color) ? <DifficultyLegend /> : null}
            </>
          ) : (
            <div className="p-stack p-center" style={{ alignItems: 'center', gap: 12 }}>
              <p className="p-note">{filter === 'archiv' && !query && !pfSize ? 'Das Archiv ist leer.' : 'Nichts gefunden.'}</p>
              {pfSize ? (
                <button type="button" className="p-btn sec sm" onClick={() => setPf(NO_FILTER)}>
                  Filter aufheben
                </button>
              ) : null}
            </div>
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

      {filterOpen ? (
        <FilterSheet
          pieces={pieces}
          filter={pf}
          shownCount={shown.length}
          onChange={setPf}
          onClose={() => setFilterOpen(false)}
        />
      ) : null}
    </TabPage>
  )
}

// Filter nach Schwierigkeit und Lernstand, mehrere auf einmal (wie in der alten
// App). Jeder Tipp wirkt sofort, die Kacheln dahinter ziehen mit. Die Zahl an
// einer Option sagt, wie viele Stuecke dazukaemen - die andere Gruppe schon
// eingerechnet.
function FilterSheet({
  pieces,
  filter,
  shownCount,
  onChange,
  onClose,
}: {
  pieces: Piece[]
  filter: PieceFilter
  shownCount: number
  onChange: (f: PieceFilter) => void
  onClose: () => void
}) {
  const aktiv = pieces.filter((p) => !isArchived(p))
  const diffCount = (d: Difficulty) =>
    aktiv.filter((p) => p.difficulty === d && matchesFilter(p, { ...filter, difficulty: [] })).length
  const statusCount = (s: Status) =>
    aktiv.filter((p) => statusOf(p.progress) === s && matchesFilter(p, { ...filter, status: [] })).length

  const toggleDiff = (d: Difficulty) =>
    onChange({
      ...filter,
      difficulty: filter.difficulty.includes(d) ? filter.difficulty.filter((x) => x !== d) : [...filter.difficulty, d],
    })
  const toggleStatus = (s: Status) =>
    onChange({
      ...filter,
      status: filter.status.includes(s) ? filter.status.filter((x) => x !== s) : [...filter.status, s],
    })

  return (
    <Sheet label="Filter" onClose={onClose}>
      {(zu) => (
        <div className="p-sheet-pad">
          <div className="p-sheet-title">Filtern</div>

          <div className="p-sec">
            <p className="p-lbl">Schwierigkeit</p>
            <div className="p-chips" role="group" aria-label="Schwierigkeit">
              {DIFF_OPTIONS.map((d) => {
                const on = filter.difficulty.includes(d.id)
                const n = diffCount(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    className={`p-chip${on ? ' on' : ''}${!n && !on ? ' zero' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleDiff(d.id)}
                  >
                    {d.color ? <i className="p-chip-corner" style={{ background: d.color }} aria-hidden="true" /> : null}
                    {d.label} <span className="n">{n}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="p-sec">
            <p className="p-lbl">Lernstand</p>
            <div className="p-chips" role="group" aria-label="Lernstand">
              {STATUSES.map((s) => {
                const on = filter.status.includes(s)
                const n = statusCount(s)
                return (
                  <button
                    key={s}
                    type="button"
                    className={`p-chip${on ? ' on' : ''}${!n && !on ? ' zero' : ''}`}
                    aria-pressed={on}
                    onClick={() => toggleStatus(s)}
                  >
                    {STATUS_LABEL[s]} <span className="n">{n}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <p className="p-note">
            Mehrere in einer Gruppe: eins davon reicht. In beiden Gruppen gewählt: beides muss passen.
          </p>

          <div className="p-hstack">
            <button
              type="button"
              className="p-btn sec"
              style={{ flex: 1 }}
              disabled={!filterSize(filter)}
              onClick={() => onChange(NO_FILTER)}
            >
              Zurücksetzen
            </button>
            <button type="button" className="p-btn" style={{ flex: 1 }} onClick={zu}>
              {shownCount ? `${shownCount} ${shownCount === 1 ? 'Stück' : 'Stücke'} zeigen` : 'Fertig'}
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}

// Legende zu den farbigen Ecken - ganz unten, wo sie nicht stoert.
function DifficultyLegend() {
  const scale = DIFFICULTIES.filter((d) => d.color)
  return (
    <p className="p-legend">
      Schwierigkeit: leicht
      <span className="p-legend-scale" role="img" aria-label={scale.map((d) => d.label).join(', ')}>
        {scale.map((d) => (
          <i key={d.id} style={{ background: d.color ?? undefined }} />
        ))}
      </span>
      schwer
    </p>
  )
}

export default Stuecke
