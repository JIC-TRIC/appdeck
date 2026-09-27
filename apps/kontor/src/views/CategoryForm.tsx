import { useState } from 'react'
import { Glyph, IconClose, ICON_KEYS } from '../icons'
import { Label, Segmented, Toggle } from '../ui'
import { CATEGORY_COLORS } from '../data'
import { centToText, textToCent } from '../util'
import { addCategory, archiveCategory, updateCategory } from '../kontorStore'
import type { CategoryKind, ViewProps } from '../types'

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgabe' },
  { id: 'income', label: 'Einnahme' },
]

function CategoryForm({ ctx, view }: ViewProps) {
  const { categories, entries, back, refresh } = ctx
  const existing = view.categoryId ? categories.find((c) => c.id === view.categoryId) ?? null : null

  const [name, setName] = useState(existing?.name ?? '')
  const [kind, setKind] = useState<CategoryKind>(existing?.kind ?? view.kind ?? 'expense')
  const [icon, setIcon] = useState(existing?.icon ?? 'basket')
  const [color, setColor] = useState(
    existing?.color ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
  )
  const [budget, setBudget] = useState(existing?.budgetCent ? centToText(existing.budgetCent) : '')
  const [error, setError] = useState<string | null>(null)

  const used = existing ? entries.filter((e) => e.categoryId === existing.id).length : 0

  const save = () => {
    if (!name.trim()) {
      setError('Name fehlt')
      return
    }
    const budgetCent = kind === 'expense' && budget.trim() ? textToCent(budget) : null
    if (existing) {
      updateCategory(existing.id, { name: name.trim(), icon, color, budgetCent })
    } else {
      addCategory({ name, kind, icon, color, budgetCent })
    }
    refresh()
    back()
  }

  return (
    <div className="k-screen fixed">
      <header className="k-head">
        <button type="button" className="k-ic" onClick={back} aria-label="Abbrechen">
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
          placeholder="Lebensmittel"
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
                placeholder="z. B. 350"
                onChange={(e) => setBudget(e.target.value.replace(/[^\d,]/g, ''))}
                maxLength={10}
              />
              <span className="k-input-suffix">€</span>
            </div>
            <div className="k-meta tight">
              Budgets sind Monatsbudgets. Der Fortschritt steht im Kategoriedetail, solange der
              Zeitraum ein Monat ist.
            </div>
          </>
        ) : null}

        {existing ? (
          <div className="k-row-card">
            <div className="grow">
              <div className="k-row-title">Archiviert</div>
              <div className="k-row-hint">
                {used > 0
                  ? `${used} ${used === 1 ? 'Buchung' : 'Buchungen'} hängen daran – die bleiben erhalten.`
                  : 'Verschwindet aus Formular und Donut.'}
              </div>
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
