import { useRef, useState } from 'react'
import { ListSheet, Sheet, SheetHead } from '../ui'
import { updateSettings } from '../store'
import { backupSummary, restoreBackup, type Values } from '../storage'

// Name fuer eine neue Setlist oder zum Umbenennen.
export function SetlistNameSheet({
  initial = '',
  title,
  onSave,
  onClose,
}: {
  initial?: string
  title: string
  onSave: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial)
  const after = useRef<(() => void) | null>(null)
  return (
    <Sheet
      label={title}
      onClose={() => {
        const f = after.current
        after.current = null
        onClose()
        f?.()
      }}
    >
      {(zu) => {
        const done = () => {
          if (!name.trim()) return
          after.current = () => onSave(name.trim())
          zu()
        }
        return (
          <form
            className="p-sheet-pad p-form"
            onSubmit={(e) => {
              e.preventDefault()
              done()
            }}
          >
            <SheetHead title={title} onCancel={zu} onDone={done} doneDisabled={!name.trim()} />
            <div className="p-field">
              <label className="p-lbl" htmlFor="setlist-name">
                Name
              </label>
              <input
                id="setlist-name"
                className="p-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="z. B. Vorspiel im Januar"
                enterKeyHint="done"
              />
            </div>
          </form>
        )
      }}
    </Sheet>
  )
}

const HOURS = [0, 1, 2, 3, 4, 5, 6]

// Tageswechsel: bis zu dieser Uhrzeit gilt noch der Vortag (wie Steady).
export function DayStartSheet({ value, onClose, onSaved }: { value: number; onClose: () => void; onSaved: () => void }) {
  return (
    <ListSheet
      label="Tageswechsel"
      title="Tageswechsel"
      onClose={onClose}
      note="Bis zu dieser Uhrzeit zählt noch der Vortag. Wer nach Mitternacht übt, übt so noch für den Abend davor – Serie und Tagesziel stimmen."
      items={HOURS.map((h) => ({
        key: String(h),
        label: h === 0 ? 'Mitternacht' : `${h}:00 Uhr`,
        checked: value === h,
        onPick: () => {
          updateSettings({ dayStart: h })
          onSaved()
        },
      }))}
    />
  )
}

// Rueckfrage vor dem Import - er ersetzt alle Piano-Daten.
export function ImportSheet({ values, onClose, onDone }: { values: Values; onClose: () => void; onDone: () => void }) {
  const sum = backupSummary(values)
  const after = useRef<(() => void) | null>(null)
  return (
    <Sheet
      label="Backup importieren"
      onClose={() => {
        const f = after.current
        after.current = null
        onClose()
        f?.()
      }}
    >
      {(zu) => (
        <div className="p-sheet-pad">
          <div className="p-stack" style={{ gap: 6 }}>
            <div className="p-sheet-title">Backup importieren?</div>
            <p className="p-sub">
              Die Datei enthält <b className="p-ink">{sum.pieces}</b> {sum.pieces === 1 ? 'Stück' : 'Stücke'} und{' '}
              <b className="p-ink">{sum.sessions}</b> {sum.sessions === 1 ? 'Sitzung' : 'Sitzungen'}
              {values.setlists ? ' samt Setlists' : ''}. Sie ersetzt, was Piano gerade gespeichert hat.
            </p>
          </div>
          <div className="p-stack" style={{ gap: 6 }}>
            <button
              type="button"
              className="p-btn"
              onClick={() => {
                after.current = () => {
                  restoreBackup(values)
                  onDone()
                }
                zu()
              }}
            >
              Ersetzen
            </button>
            <button type="button" className="p-btn ghost" onClick={zu}>
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
