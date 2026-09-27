import { useState } from 'react'
import NumPad from './NumPad'
import { Label, Money, Toggle } from '../ui'
import { ACCOUNT_COLORS } from '../data'
import { textToCent } from '../util'
import { addAccount, seedCategories, updateSettings } from '../kontorStore'
import type { KontorCtx } from '../types'

// Erststart: nur das erste Konto. Ohne Konto kann man nichts buchen, darum
// wird es hier und nicht spaeter abgefragt. Alles Erklaerende ist raus - der
// Bildschirm muss ohne Scrollen auf ein Handy passen, und die App erklaert
// sich beim ersten Buchen von selbst.
function Onboarding({ ctx }: { ctx: KontorCtx }) {
  const { refresh } = ctx
  const [name, setName] = useState('Girokonto')
  const [includeInTotal, setInclude] = useState(true)
  const [text, setText] = useState('')

  const start = () => {
    seedCategories()
    addAccount({
      name: name.trim() || 'Girokonto',
      color: ACCOUNT_COLORS[0],
      includeInTotal,
      balanceCent: textToCent(text),
    })
    updateSettings({ onboarded: true })
    refresh()
  }

  return (
    <div className="k-screen fixed">
      <header className="k-head">
        <div className="k-head-mid">
          <div className="k-brand">Kontor</div>
        </div>
      </header>

      <div className="k-form">
        <Label>Erstes Konto</Label>
        <input
          className="k-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={40}
        />

        <Label>Aktueller Saldo</Label>
        <div className="k-amount small">
          <Money cent={textToCent(text)} />
          <span className="k-amount-cur">€</span>
        </div>

        <div className="k-row-card">
          <div className="grow">
            <div className="k-row-title">Zur Gesamtbalance zählen</div>
            <div className="k-row-hint">Später pro Konto änderbar</div>
          </div>
          <Toggle on={includeInTotal} onChange={setInclude} label="Zur Gesamtbalance zählen" />
        </div>
      </div>

      <div className="k-pad-wrap">
        <NumPad text={text} onText={setText} onSubmit={start} accent="var(--ink)" submitLabel="Los geht's" />
        <button type="button" className="k-primary" onClick={start}>Los geht&apos;s</button>
      </div>
    </div>
  )
}

export default Onboarding
