import { useState } from 'react'
import { IconGrid, IconImport, IconMinus, IconPlus, IconRight, IconShare } from '../icons'
import { Page, Segmented } from '../ui'
import { updateSettings } from '../store'
import { exportSnapshot, storageBytes } from '../storage'
import { dateKey } from '../util'
import { VERSION } from '../version'
import { DayStartSheet } from './Sheets'
import type { ViewProps } from '../types'

const GOAL_MIN = 5
const GOAL_MAX = 240

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`
}

function Einstellungen({ ctx }: ViewProps) {
  const { settings, backLabel, back, refresh, notify, importBackup, onExit } = ctx
  const [dayStartOpen, setDayStartOpen] = useState(false)

  const setGoal = (min: number) => {
    updateSettings({ dailyGoalMinutes: Math.min(GOAL_MAX, Math.max(GOAL_MIN, min)) })
    refresh()
  }

  // Auf dem iPhone ueber das Teilen-Menue ("In Dateien sichern"): ein
  // Download-Link ist in einer Home-Bildschirm-App unzuverlaessig. Wo es kein
  // Teilen mit Dateien gibt (Desktop), bleibt es der Download (wie Steady).
  const share = async () => {
    try {
      const file = new File([JSON.stringify(exportSnapshot(), null, 1)], `piano-backup-${dateKey()}.json`, {
        type: 'application/json',
      })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        }
      }
      const url = URL.createObjectURL(file)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1500)
    } catch {
      notify('Backup fehlgeschlagen')
    }
  }

  const dayStartLabel = settings.dayStart === 0 ? 'Mitternacht' : `${settings.dayStart}:00 Uhr`

  return (
    <Page backLabel={backLabel} onBack={back}>
      <header className="p-head tight">
        <div className="p-head-l">
          <h1 className="p-h1">Einstellungen</h1>
        </div>
      </header>

      <section className="p-sec">
        <h2 className="p-lbl p-grp">Üben</h2>
        <div className="p-list">
          <div className="p-set-row">
            <span className="p-row-main p-strong">Tagesziel</span>
            <span className="p-stepper">
              <button type="button" aria-label="5 Minuten weniger" disabled={settings.dailyGoalMinutes <= GOAL_MIN} onClick={() => setGoal(settings.dailyGoalMinutes - 5)}>
                <IconMinus />
              </button>
              <span className="p-num">{settings.dailyGoalMinutes} min</span>
              <button type="button" aria-label="5 Minuten mehr" disabled={settings.dailyGoalMinutes >= GOAL_MAX} onClick={() => setGoal(settings.dailyGoalMinutes + 5)}>
                <IconPlus />
              </button>
            </span>
          </div>
          <div className="p-set-row col">
            <span className="p-strong">Videos öffnen</span>
            <Segmented
              label="Videos öffnen"
              options={[
                { id: 'app', label: 'In der App' },
                { id: 'youtube', label: 'In YouTube' },
              ]}
              value={settings.videoMode}
              onChange={(v) => {
                updateSettings({ videoMode: v })
                refresh()
              }}
            />
            <span className="p-s3">In der YouTube-App laufen Videos mit Premium ohne Werbung. Die Uhr läuft trotzdem weiter.</span>
          </div>
          <button type="button" className="p-set-row" onClick={() => setDayStartOpen(true)}>
            <span className="p-row-main">
              <span className="p-strong">Tageswechsel</span>
              <span className="p-s3">Wer nach Mitternacht übt, zählt zum Vortag.</span>
            </span>
            <span className="p-s2 p-num">{dayStartLabel}</span>
            <IconRight className="p-chev" />
          </button>
        </div>
      </section>

      <section className="p-sec">
        <h2 className="p-lbl p-grp">Daten</h2>
        <div className="p-list">
          <button type="button" className="p-set-row" onClick={share}>
            <IconShare className="p-acc" />
            <span className="p-row-main p-strong p-acc">Backup teilen …</span>
          </button>
          <button type="button" className="p-set-row" onClick={importBackup}>
            <IconImport className="p-acc" />
            <span className="p-row-main p-strong p-acc">Backup importieren …</span>
          </button>
          <div className="p-set-row">
            <span className="p-row-main">Belegt</span>
            <span className="p-s2 p-num">{formatBytes(storageBytes())}</span>
          </div>
        </div>
        <p className="p-note p-grp">
          „Teilen“ öffnet das iOS-Menü: In Dateien sichern, AirDrop, Mail. Der Import nimmt auch Exporte der alten
          Piano-App und ersetzt alle Piano-Daten.
        </p>
      </section>

      <div className="p-list">
        <button type="button" className="p-set-row" onClick={onExit}>
          <IconGrid />
          <span className="p-row-main p-strong">Alle Apps</span>
          <IconRight className="p-chev" />
        </button>
      </div>

      <p className="p-note p-center">Piano {VERSION} · Deine Daten liegen nur auf diesem Gerät.</p>

      {dayStartOpen ? (
        <DayStartSheet value={settings.dayStart} onClose={() => setDayStartOpen(false)} onSaved={refresh} />
      ) : null}
    </Page>
  )
}

export default Einstellungen
