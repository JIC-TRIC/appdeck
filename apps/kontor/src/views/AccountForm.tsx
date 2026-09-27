import { useState } from 'react'
import NumPad from './NumPad'
import { Glyph, IconClose } from '../icons'
import { Label, Money, Toggle } from '../ui'
import { ACCOUNT_COLORS, ACCOUNT_ICON } from '../data'
import { textToCent } from '../util'
import { addAccount, updateAccount } from '../kontorStore'
import type { ViewProps } from '../types'

function AccountForm({ ctx, view }: ViewProps) {
  const { accounts, back, refresh } = ctx
  const existing = view.accountId ? accounts.find((a) => a.id === view.accountId) ?? null : null

  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length])
  const [includeInTotal, setInclude] = useState(existing?.includeInTotal ?? true)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const save = () => {
    if (!name.trim()) {
      setError('Name fehlt')
      return
    }
    if (existing) {
      updateAccount(existing.id, { name: name.trim(), color, includeInTotal })
    } else {
      addAccount({ name, color, includeInTotal, balanceCent: textToCent(text) })
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
          placeholder="Girokonto"
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
            <div className="k-row-hint">
              Aus, wenn das Konto in der Übersicht nicht mitgezählt werden soll
            </div>
          </div>
          <Toggle on={includeInTotal} onChange={setInclude} label="Zur Gesamtbalance zählen" />
        </div>

        {existing ? (
          <div className="k-meta">
            Den Saldo änderst du im Kontodetail über „Korrigieren" – so bleibt die Änderung als
            Korrektur nachvollziehbar.
          </div>
        ) : (
          <>
            <Label>Aktueller Saldo</Label>
            <div className="k-amount small">
              <Money cent={textToCent(text)} />
              <span className="k-amount-cur">€</span>
            </div>
            <div className="k-meta tight">
              Wird als Buchung „Anfangssaldo" protokolliert, damit Saldo und Buchungen von Anfang an
              zusammenpassen.
            </div>
          </>
        )}
      </div>

      {error ? <div className="k-error">{error}</div> : null}

      <div className="k-pad-wrap">
        {existing ? (
          <button type="button" className="k-primary" onClick={save}>Speichern</button>
        ) : (
          <NumPad text={text} onText={setText} onSubmit={save} accent="var(--ink)" />
        )}
      </div>
    </div>
  )
}

export default AccountForm
