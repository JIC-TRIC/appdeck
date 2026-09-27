import { useRef, useState } from 'react'
import NumPad, { useBetrag } from './NumPad'
import { Amount, Label, Toggle } from '../ui'
import { ACCOUNT_COLORS } from '../data'
import { textToCent } from '../util'
import { addAccount, importFile, isOnboarded, seedCategories, updateSettings } from '../kontorStore'
import type { KontorCtx } from '../types'

// Erststart: nur das erste Konto. Ohne Konto kann man nichts buchen, darum
// wird es hier und nicht spaeter abgefragt. Alles Erklaerende ist raus - der
// Bildschirm muss ohne Scrollen auf ein Handy passen, und die App erklaert
// sich beim ersten Buchen von selbst.
//
// Wer schon Daten hat (neues Geraet, neu installiert), stellt sie hier aus
// einer Exportdatei wieder her - statt erst ein Wegwerf-Konto anzulegen, nur
// um an die Einstellungen zu kommen.
function Onboarding({ ctx }: { ctx: KontorCtx }) {
  const { refresh } = ctx
  const [name, setName] = useState('Girokonto')
  const [includeInTotal, setInclude] = useState(true)
  const betrag = useBetrag()
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const restore = async (file: File) => {
    try {
      await importFile(file)
      if (!isOnboarded()) {
        setError('In der Datei ist kein Konto.')
        return
      }
      refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const start = () => {
    seedCategories()
    addAccount({
      name: name.trim() || 'Girokonto',
      color: ACCOUNT_COLORS[0],
      includeInTotal,
      balanceCent: textToCent(betrag.text),
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
        <Amount text={betrag.text} signal={betrag.signal} variant="small" />

        <div className="k-row-card">
          <div className="grow">
            <div className="k-row-title">Zur Gesamtbalance zählen</div>
            <div className="k-row-hint">Später pro Konto änderbar</div>
          </div>
          <Toggle on={includeInTotal} onChange={setInclude} label="Zur Gesamtbalance zählen" />
        </div>

        <button type="button" className="k-textlink" onClick={() => fileRef.current?.click()}>
          Aus Exportdatei wiederherstellen
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) restore(f)
            e.target.value = ''
          }}
        />
      </div>

      {error ? <div className="k-error">{error}</div> : null}

      <div className="k-pad-wrap">
        <NumPad
          text={betrag.text}
          onText={betrag.setText}
          onReject={betrag.ablehnen}
          onSubmit={start}
          accent="var(--ink)"
          submitLabel="Los geht's"
        />
        <button type="button" className="k-primary" onClick={start}>Los geht&apos;s</button>
      </div>
    </div>
  )
}

export default Onboarding
