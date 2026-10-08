import { useEffect, useState } from 'react'
import { Glyph, IconClose, ICON_KEYS } from '../icons'
import { Label, Segmented, Toggle } from '../ui'
import { CATEGORY_COLORS } from '../data'
import { centToText, textToCent } from '../util'
import { addCategory, archiveCategory, updateCategory } from '../kontorStore'
import type { CategoryKind, ViewProps } from '../types'
import { entwurfAendern, entwurfKey, entwurfLesen, entwurfLoeschen, entwurfSchreiben } from '../entwurf'

interface CategoryDraft {
  name: string
  kind: CategoryKind
  icon: string
  color: string
  budget: string
}

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgabe' },
  { id: 'income', label: 'Einnahme' },
]

function CategoryForm({ ctx, view }: ViewProps) {
  const { categories, back, refresh } = ctx
  const existing = view.categoryId ? categories.find((c) => c.id === view.categoryId) ?? null : null

  const draftKey = entwurfKey(view)
  const [draft] = useState(() => entwurfLesen<CategoryDraft>(draftKey))
  const [name, setName] = useState(draft?.name ?? existing?.name ?? '')
  const [kind, setKind] = useState<CategoryKind>(draft?.kind ?? existing?.kind ?? view.kind ?? 'expense')
  const [icon, setIcon] = useState(draft?.icon ?? existing?.icon ?? 'basket')
  const [color, setColor] = useState(
    draft?.color ?? existing?.color ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
  )
  const [budget, setBudget] = useState(draft?.budget ?? (existing?.budgetCent ? centToText(existing.budgetCent) : ''))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    entwurfSchreiben(draftKey, { name, kind, icon, color, budget } satisfies CategoryDraft)
  }, [draftKey, name, kind, icon, color, budget])

  const abbrechen = () => {
    entwurfLoeschen(draftKey)
    back()
  }

  const save = () => {
    if (!name.trim()) {
      setError('Name fehlt')
      return
    }
    const budgetCent = kind === 'expense' && budget.trim() ? textToCent(budget) : null
    entwurfLoeschen(draftKey)
    if (existing) {
      updateCategory(existing.id, { name: name.trim(), icon, color, budgetCent })
    } else {
      const neu = addCategory({ name, kind, icon, color, budgetCent })
      // Aus dem Buchungsformular heraus angelegt: dort ist sie gleich gewaehlt.
      if (view.entwurf) entwurfAendern(view.entwurf, { categoryId: neu.id })
    }
    refresh()
    back()
  }

  return (
    <div className="k-screen fixed">
      <header className="k-head">
        <button type="button" className="k-ic" onClick={abbrechen} aria-label="Abbrechen">
          <IconClose />
        </button>
        <div className="k-head-mid">
          <div className="k-head-title">{existing ? 'Kategorie' : 'Neue Kategorie'}</div>
        </div>
        <span className="k-ic-space" />
      </header>

      <div className="k-form scroll">
        <Label>Name</Label>
        <input
          className="k-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
        />

        {existing ? null : (
          <>
            <Label>Art</Label>
            <div className="k-center-row left">
              <Segmented options={KINDS} value={kind} onChange={setKind} />
            </div>
          </>
        )}

        <Label>Symbol</Label>
        <div className="k-icon-grid">
          {ICON_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              className={`k-icon-pick${key === icon ? ' on' : ''}`}
              style={key === icon ? { color, borderColor: color } : undefined}
              onClick={() => setIcon(key)}
              aria-label={key}
            >
              <Glyph name={key} />
            </button>
          ))}
        </div>

        <Label>Farbe</Label>
        <div className="k-swatches">
          {CATEGORY_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`k-swatch${c === color ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Farbe ${c}`}
            >
              <span className="k-swatch-ic" style={{ color: '#fff' }}>
                <Glyph name={icon} />
              </span>
            </button>
          ))}
        </div>

        {kind === 'expense' ? (
          <>
            <Label>Monatsbudget (optional)</Label>
            <div className="k-input-row">
              <input
                className="k-input"
                type="text"
                inputMode="decimal"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, ''))}
                maxLength={10}
              />
              <span className="k-input-suffix">€</span>
            </div>
          </>
        ) : null}

        {existing ? (
          <div className="k-row-card">
            <div className="grow">
              <div className="k-row-title">Archiviert</div>
            </div>
            <Toggle
              on={!!existing.archived}
              label="Archiviert"
              onChange={(on) => {
                archiveCategory(existing.id, on)
                refresh()
              }}
            />
          </div>
        ) : null}
      </div>

      {error ? <div className="k-error">{error}</div> : null}

      <div className="k-pad-wrap">
        <button type="button" className="k-primary" onClick={save}>Speichern</button>
      </div>
    </div>
  )
}

export default CategoryForm
