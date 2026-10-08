import { useRef, useState } from 'react'
import { IconRight } from '../icons'
import { Screen } from '../ui'
import { clearAll, exportSnapshot, importFile } from '../store'
import { dateKey } from '../util'
import type { ViewProps } from '../types'

function Settings({ ctx }: ViewProps) {
  const { settings, habits, back, push, refresh } = ctx
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const [armed, setArmed] = useState(false)

  // Auf dem iPhone ueber das Teilen-Menue ("In Dateien sichern"): ein
  // Download-Link ist in einer Home-Bildschirm-App unzuverlaessig. Wo es kein
  // Teilen mit Dateien gibt (Desktop), bleibt es der Download (wie Kontor).
  const doExport = async () => {
    try {
      const file = new File([JSON.stringify(exportSnapshot(), null, 1)], `steady-${dateKey()}.json`, {
        type: 'application/json',
      })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setStatus({ text: 'Export gesichert.' })
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
      setStatus({ text: 'Export gestartet.' })
    } catch {
      setStatus({ text: 'Export fehlgeschlagen.', error: true })
    }
  }

  const doImport = async (file: File) => {
    try {
      await importFile(file)
      refresh()
      setStatus({ text: 'Daten ersetzt.' })
    } catch (err) {
      setStatus({ text: `Import fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`, error: true })
    }
  }

  return (
    <Screen title="Einstellungen" onBack={back}>
      <div className="s-label">Tag</div>
      <div className="s-list">
        <button type="button" className="s-li" onClick={() => push({ name: 'dayStart', sheet: true })}>
          Tageswechsel
          <span className="v">
            {settings.dayStart === 0 ? 'Mitternacht' : `${settings.dayStart}:00 Uhr`}
            <IconRight />
          </span>
        </button>
      </div>

      <div className="s-label">Daten</div>
      <div className="s-list">
        <button type="button" className="s-li" onClick={doExport}>
          Export als JSON
          <span className="v">
            {habits.length} {habits.length === 1 ? 'Gewohnheit' : 'Gewohnheiten'}
            <IconRight />
          </span>
        </button>
        <button type="button" className="s-li" onClick={() => fileRef.current?.click()}>
          Import aus JSON
          <span className="v">
            ersetzt alles
            <IconRight />
          </span>
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) doImport(f)
          e.target.value = ''
        }}
      />

      <div className="s-list">
        <button
          type="button"
          className="s-li danger"
          onClick={() => {
            if (!armed) {
              setArmed(true)
              return
            }
            clearAll()
            refresh()
            back()
          }}
        >
          {armed ? 'Wirklich alles löschen?' : 'Alle Daten löschen'}
          {armed ? <span className="v danger">Tippen bestätigt</span> : null}
        </button>
      </div>

      {status ? <p className={`s-status${status.error ? ' error' : ''}`}>{status.text}</p> : null}

      <div className="s-label">Hilfe</div>
      <div className="s-list">
        <button type="button" className="s-li" onClick={() => push({ name: 'rules' })}>
          So zählt Steady
          <span className="v">
            <IconRight />
          </span>
        </button>
      </div>

      <div className="s-footer">
        <div className="s-wordmark small">steady</div>
      </div>
    </Screen>
  )
}

export default Settings
