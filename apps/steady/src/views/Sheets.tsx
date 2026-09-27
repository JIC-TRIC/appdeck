import { useRef } from 'react'
import { isArchived } from '../calc'
import { IconCheck, IconRight } from '../icons'
import { Sheet } from '../ui'
import { updateSettings } from '../store'
import type { View, ViewProps } from '../types'

// Statt einer Tab-Leiste: alles, was nicht Raster oder Statistik ist.
export function MenuSheet({ ctx }: ViewProps) {
  const { habits, back, replace, onExit } = ctx
  const archived = habits.filter(isArchived).length
  const active = habits.length - archived

  // Erst schliesst das Blatt (mit Animation), dann ersetzt die gewaehlte Seite
  // seinen Platz im Stapel - ersetzt, nicht zurueck und neu, sonst rennt
  // history.back() gegen den naechsten push (wie Kontor).
  const ziel = useRef<View | null>(null)
  const onClose = () => (ziel.current ? replace(ziel.current) : back())

  return (
    <Sheet label="Menü" onClose={onClose}>
      {(zu) => {
        const go = (view: View) => () => {
          ziel.current = view
          zu()
        }
        return (
          <div className="s-menu-wrap">
            <div className="s-menu">
              <button type="button" className="s-mi" onClick={go({ name: 'archive' })}>
                Archiv
                <em>
                  {archived || ''}
                  <IconRight />
                </em>
              </button>
              <button type="button" className="s-mi" onClick={go({ name: 'reorder' })} disabled={active < 2}>
                Reihenfolge ändern
                <em>
                  <IconRight />
                </em>
              </button>
              <button type="button" className="s-mi" onClick={go({ name: 'settings' })}>
                Einstellungen
                <em>
                  <IconRight />
                </em>
              </button>
            </div>
            <div className="s-menu">
              <button type="button" className="s-mi" onClick={onExit}>
                Alle Apps
                <em>
                  <IconRight />
                </em>
              </button>
            </div>
          </div>
        )
      }}
    </Sheet>
  )
}

const HOURS = [0, 1, 2, 3, 4, 5, 6]

// Tageswechsel: bis zu dieser Uhrzeit gilt noch der Vortag.
export function DayStartSheet({ ctx }: ViewProps) {
  const { settings, back, refresh } = ctx
  return (
    <Sheet label="Tageswechsel" onClose={back}>
      {(zu) => (
        <div className="s-menu-wrap">
          <div className="s-sheet-title">Tageswechsel</div>
          <div className="s-menu">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                className="s-mi"
                onClick={() => {
                  updateSettings({ dayStart: h })
                  refresh()
                  zu()
                }}
              >
                {h === 0 ? 'Mitternacht' : `${h}:00 Uhr`}
                <em>{settings.dayStart === h ? <IconCheck /> : null}</em>
              </button>
            ))}
          </div>
          <p className="s-note">
            Bis zu dieser Uhrzeit zählt noch der Vortag. Wer nach Mitternacht liest, hakt „Lesen“ so für den richtigen
            Tag ab.
          </p>
        </div>
      )}
    </Sheet>
  )
}
