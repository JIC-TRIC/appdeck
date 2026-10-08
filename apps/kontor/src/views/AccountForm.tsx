import { useEffect, useState } from 'react'
import NumPad, { useBetrag } from './NumPad'
import { Glyph, IconClose } from '../icons'
import { Amount, Label, Toggle } from '../ui'
import { ACCOUNT_COLORS, ACCOUNT_ICON } from '../data'
import { padToCent } from '../util'
import { addAccount, updateAccount } from '../kontorStore'
import type { ViewProps } from '../types'
import { entwurfKey, entwurfLesen, entwurfLoeschen, entwurfSchreiben } from '../entwurf'

interface AccountDraft {
  name: string
  color: string
  includeInTotal: boolean
  text: string
}

function AccountForm({ ctx, view }: ViewProps) {
  const { accounts, back, refresh } = ctx
  const existing = view.accountId ? accounts.find((a) => a.id === view.accountId) ?? null : null

  const draftKey = entwurfKey(view)
  const [draft] = useState(() => entwurfLesen<AccountDraft>(draftKey))
  const [name, setName] = useState(draft?.name ?? existing?.name ?? '')
  const [color, setColor] = useState(
    draft?.color ?? existing?.color ?? ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
  )
  const [includeInTotal, setInclude] = useState(draft?.includeInTotal ?? existing?.includeInTotal ?? true)
  const betrag = useBetrag(draft?.text ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    entwurfSchreiben(draftKey, { name, color, includeInTotal, text: betrag.text } satisfies AccountDraft)
  }, [draftKey, name, color, includeInTotal, betrag.text])

  const abbrechen = () => {
    entwurfLoeschen(draftKey)
    back()
  }

  const save = () => {
    if (!name.trim()) {
      setError('Name fehlt')
      return
    }
    entwurfLoeschen(draftKey)
    if (existing) {
      updateAccount(existing.id, { name: name.trim(), color, includeInTotal })
    } else {
      addAccount({ name, color, includeInTotal, balanceCent: padToCent(betrag.text) })
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
          <div className="k-head-title">{existing ? 'Konto bearbeiten' : 'Neues Konto'}</div>
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
          maxLength={40}
        />

        <Label>Farbe</Label>
        <div className="k-swatches">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`k-swatch${c === color ? ' on' : ''}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
              aria-label={`Farbe ${c}`}
            >
              <span className="k-swatch-ic" style={{ color: '#fff' }}>
                <Glyph name={ACCOUNT_ICON} />
              </span>
            </button>
          ))}
        </div>

        <div className="k-row-card">
          <div className="grow">
            <div className="k-row-title">Zur Gesamtbalance zählen</div>
          </div>
          <Toggle on={includeInTotal} onChange={setInclude} label="Zur Gesamtbalance zählen" />
        </div>

        {existing ? null : (
          <>
            <Label>Aktueller Saldo</Label>
            <Amount text={betrag.text} signal={betrag.signal} variant="small" />
          </>
        )}
      </div>

      {error ? <div className="k-error">{error}</div> : null}

      <div className="k-pad-wrap">
        {existing ? (
          <button type="button" className="k-primary" onClick={save}>Speichern</button>
        ) : (
          <NumPad text={betrag.text} onText={betrag.setText} onReject={betrag.ablehnen} onSubmit={save} accent="var(--ink)" />
        )}
      </div>
    </div>
  )
}

export default AccountForm
