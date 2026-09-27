import { useState } from 'react'
import { Glyph, IconPlus, IconRight } from '../icons'
import { Money, Screen, Segmented, Toggle } from '../ui'
import { addMissingDefaultCategories, missingDefaultCategoryCount } from '../kontorStore'
import type { CategoryKind, ViewProps } from '../types'

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgaben' },
  { id: 'income', label: 'Einnahmen' },
]

function Categories({ ctx }: ViewProps) {
  const { categories, entries, back, push, refresh } = ctx
  const [kind, setKind] = useState<CategoryKind>('expense')
  const [showArchived, setShowArchived] = useState(false)
  const fehlend = missingDefaultCategoryCount()

  const list = categories
    .filter((c) => c.kind === kind && (showArchived ? true : !c.archived))
    .sort((a, b) => Number(a.archived) - Number(b.archived) || a.order - b.order)

  const archivedCount = categories.filter((c) => c.kind === kind && c.archived).length
  const usage = (id: string) => entries.filter((e) => e.categoryId === id).length

  return (
    <Screen
      title="Kategorien"
      onBack={back}
      right={
        <button type="button" className="k-ic" onClick={() => push({ name: 'categoryForm', kind })} aria-label="Kategorie anlegen">
          <IconPlus />
        </button>
      }
    >
      <div className="k-center-row">
        <Segmented options={KINDS} value={kind} onChange={setKind} />
      </div>

      <div className="k-card k-list-card">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            className={`k-cat-row${c.archived ? ' muted' : ''}`}
            onClick={() => push({ name: 'categoryForm', categoryId: c.id })}
          >
            <span className="k-cat-row-av" style={{ color: c.color, background: `${c.color}14` }}>
              <Glyph name={c.icon} />
            </span>
            <span className="k-cat-row-name">{c.name}</span>
            <span className="k-cat-row-meta">
              {c.archived
                ? 'archiviert'
                : c.budgetCent
                  ? <>Budget <Money cent={c.budgetCent} /> €</>
                  : `${usage(c.id)} ${usage(c.id) === 1 ? 'Buchung' : 'Buchungen'}`}
            </span>
            <span className="k-acc-chev"><IconRight /></span>
          </button>
        ))}
        {list.length === 0 ? <div className="k-list-empty">Keine Kategorien.</div> : null}
      </div>

      <div className="k-stack">
        {archivedCount > 0 ? (
          <div className="k-row-card">
            <div className="grow">
              <div className="k-row-title">Archivierte anzeigen</div>
              <div className="k-row-hint">
                {archivedCount} {archivedCount === 1 ? 'archivierte Kategorie' : 'archivierte Kategorien'}
              </div>
            </div>
            <Toggle on={showArchived} onChange={setShowArchived} label="Archivierte anzeigen" />
          </div>
        ) : null}
        <button type="button" className="k-dashed" onClick={() => push({ name: 'categoryForm', kind })}>
          <IconPlus /> Kategorie anlegen
        </button>
        {/* Nach einer geaenderten Voreinstellung kommt die neue Liste so auch
            in einen Bestand, ohne dass man Daten loeschen muss. */}
        {fehlend > 0 ? (
          <button
            type="button"
            className="k-ghost"
            onClick={() => {
              addMissingDefaultCategories()
              refresh()
            }}
          >
            {fehlend} fehlende Standardkategorien anlegen
          </button>
        ) : null}
      </div>
    </Screen>
  )
}

export default Categories
