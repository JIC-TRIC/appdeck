import { useRef, useState } from 'react'
import { IconDownload, IconInfo, IconRight, IconTrash, IconUpload } from '../icons'
import { Label, Screen, Toggle } from '../ui'
import { dateKey } from '../util'
import { clearAll, exportSnapshot, importFile, updateSettings } from '../kontorStore'
import { DISKRET_GRENZEN, MASKE } from '../diskret'
import type { Settings as SettingsData, ViewProps } from '../types'

function Settings({ ctx }: ViewProps) {
  const { settings, entries, accounts, back, push, refresh, onExit, diskret, setDiskret } = ctx
  const fileRef = useRef<HTMLInputElement>(null)
  // Erfolg gruen, Fehler rot - vorher sahen beide gleich aus.
  const [status, setStatus] = useState<{ text: string; error?: boolean } | null>(null)
  const [armed, setArmed] = useState(false)

  const set = (patch: Partial<SettingsData>) => {
    updateSettings(patch)
    refresh()
  }

  // Auf dem iPhone ueber das Teilen-Menue ("In Dateien sichern", AirDrop, …):
  // ein Download-Link ist in einer Home-Bildschirm-App unzuverlaessig. Wo es
  // kein Teilen mit Dateien gibt (Desktop), bleibt es der Download.
  const doExport = async () => {
    try {
      const file = new File([JSON.stringify(exportSnapshot(), null, 2)], `kontor-${dateKey()}.json`, {
        type: 'application/json',
      })
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
          setStatus({ text: 'Export gesichert.' })
          return
        } catch (err) {
          // Abbrechen im Teilen-Menue ist kein Fehler.
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
      <Label>Anzeige</Label>
      <div className="k-card k-list-card">
        <div className="k-set-row">
          <span className="grow">Woche beginnt</span>
          <div className="k-mini-seg">
            <button
              type="button"
              className={settings.weekStart === 1 ? 'on' : ''}
              onClick={() => set({ weekStart: 1 })}
            >
              Montag
            </button>
            <button
              type="button"
              className={settings.weekStart === 0 ? 'on' : ''}
              onClick={() => set({ weekStart: 0 })}
            >
              Sonntag
            </button>
          </div>
        </div>
      </div>

      <Label>Beträge verbergen</Label>
      <div className="k-card k-pad16 k-diskret-card">
        <div className="k-row-card bare">
          <div className="grow">
            <div className="k-row-title">Beträge verbergen</div>
            <div className="k-row-hint">
              Summen, Salden und Budgets stehen als {MASKE}. Schneller: das Auge neben der Gesamtbalance.
            </div>
          </div>
          <Toggle on={diskret.an} label="Beträge verbergen" onChange={setDiskret} />
        </div>
        <div className="k-row-card bare">
          <div className="grow">
            <div className="k-row-title">Beim Öffnen verbergen</div>
            <div className="k-row-hint">Jedes Mal, wenn Kontor startet oder aus dem Hintergrund zurückkommt.</div>
          </div>
          <Toggle
            on={settings.diskretBeimStart === true}
            label="Beim Öffnen verbergen"
            onChange={(on) => set({ diskretBeimStart: on })}
          />
        </div>
        <div>
          <div className="k-row-title">Einzelne Buchungen verbergen ab</div>
          <div className="k-row-hint">Ein Kaffee verrät nichts, das Gehalt schon. Summen sind immer verborgen.</div>
          <div className="k-mini-seg wide" role="radiogroup" aria-label="Einzelne Buchungen verbergen ab">
            {DISKRET_GRENZEN.map((g) => (
              <button
                key={g.label}
                type="button"
                role="radio"
                aria-checked={diskret.abCent === g.cent}
                className={diskret.abCent === g.cent ? 'on' : ''}
                onClick={() => set({ diskretAbCent: g.cent })}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Label>Berechnung</Label>
      <div className="k-card k-pad16">
        <div className="k-row-card bare">
          <div className="grow">
            <div className="k-row-title">Umbuchungen über die Grenze zählen</div>
            <div className="k-row-hint">
              An: Geld auf ein Konto außerhalb der Gesamtbalance zählt als Ausgabe.
            </div>
          </div>
          <Toggle
            on={settings.countBoundaryTransfers}
            label="Umbuchungen über die Grenze zählen"
            onChange={(on) => set({ countBoundaryTransfers: on })}
          />
        </div>
      </div>

      <Label>Daten</Label>
      <div className="k-card k-list-card">
        <button type="button" className="k-set-row press" onClick={doExport}>
          <span className="k-set-ic"><IconDownload /></span>
          <span className="grow">Export als JSON</span>
          <span className="k-set-val">
            {entries.length} {entries.length === 1 ? 'Buchung' : 'Buchungen'}
          </span>
        </button>
        <button type="button" className="k-set-row press" onClick={() => fileRef.current?.click()}>
          <span className="k-set-ic"><IconUpload /></span>
          <span className="grow">Import aus JSON</span>
          <span className="k-set-val">ersetzt alles</span>
        </button>
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
      </div>

      <div className="k-card k-list-card">
        <button type="button" className="k-set-row press" onClick={() => push({ name: 'about' })}>
          <span className="k-set-ic"><IconInfo /></span>
          <span className="grow">Über Kontor</span>
          <span className="k-set-chev"><IconRight /></span>
        </button>
      </div>

      <div className="k-card k-list-card">
        <button
          type="button"
          className="k-set-row press danger"
          onClick={() => {
            if (!armed) {
              setArmed(true)
              return
            }
            clearAll()
            refresh()
          }}
        >
          <span className="k-set-ic"><IconTrash /></span>
          <span className="grow">{armed ? 'Wirklich alles löschen?' : 'Alle Daten löschen'}</span>
          {armed ? <span className="k-set-val danger">Tippen bestätigt</span> : null}
        </button>
      </div>

      {status ? <div className={`${status.error ? 'k-error' : 'k-saved'} static`}>{status.text}</div> : null}

      <div className="k-stack">
        <button type="button" className="k-ghost" onClick={onExit}>
          Zurück zu allen Apps
        </button>
      </div>

      <div className="k-footer">
        <div className="k-brand small">Kontor</div>
        <div className="k-meta center">
          {accounts.length} {accounts.length === 1 ? 'Konto' : 'Konten'} · alles liegt nur auf diesem
          Gerät. Kein Konto, keine Cloud, kein Sync. Gesichert wird über das Backup im Launcher
          (Zahnrad) oder den Export hier.
        </div>
      </div>
    </Screen>
  )
}

export default Settings
