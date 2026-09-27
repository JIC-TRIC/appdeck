import { IconCheck, IconChart, IconGrid, IconRight, IconSliders, IconTransfer, IconWallet } from '../icons'
import { Money, Sheet } from '../ui'
import { PERIODS, periodRange, todayKey } from '../util'
import { totalBalance } from '../kontorStore'
import type { View, ViewProps } from '../types'

// Zeitraum waehlen. Der Anker bleibt stehen, nur die Art wechselt - wer im
// September steht und auf "Jahr" geht, landet in 2026 und nicht in 1970.
export function PeriodSheet({ ctx }: ViewProps) {
  const { period, setPeriod, settings, back, firstKey } = ctx

  return (
    <Sheet title="Zeitraum" onClose={back}>
      {(zu) => (
      <>
      <div className="k-sheet-actions">
        <button
          type="button"
          className="k-chip solid"
          onClick={() => {
            setPeriod({ ...period, anchor: todayKey() })
            zu()
          }}
        >
          Heute
        </button>
      </div>

      {PERIODS.map((p) => {
        // Vorschau und Auswahl gehen vom heutigen Tag aus, nicht vom aktuellen
        // Anker: wer "Tag" waehlt, will heute sehen und nicht den Ersten des
        // Monats, auf dem das Blaettern den Anker zuletzt abgelegt hat.
        const range = periodRange(p.id, todayKey(), settings.weekStart, firstKey)
        const on = p.id === period.kind
        return (
          <button
            key={p.id}
            type="button"
            className={`k-sheet-row${on ? ' on' : ''}`}
            onClick={() => {
              setPeriod({ kind: p.id, anchor: todayKey() })
              zu()
            }}
          >
            <span className="k-sheet-row-t">{p.label}</span>
            <span className="k-sheet-row-s">{range.label}</span>
            {on ? <span className="k-sheet-check"><IconCheck /></span> : null}
          </button>
        )
      })}

      <div className="k-meta">
        Jede Auswahl landet im heutigen Zeitraum. Wischen auf der Startseite
        blättert von dort vor oder zurück.
      </div>
      </>
      )}
    </Sheet>
  )
}

// Statt einer Tab-Leiste: alles, was nicht die Hauptansicht ist, liegt hier.
export function MenuSheet({ ctx }: ViewProps) {
  const { accounts, categories, back, replace, onExit } = ctx
  const open = accounts.filter((a) => !a.archived)
  const expenseCats = categories.filter((c) => c.kind === 'expense' && !c.archived).length
  const incomeCats = categories.filter((c) => c.kind === 'income' && !c.archived).length

  // Das Blatt wird durch die Seite ersetzt, nicht geschlossen und dann
  // ueberlagert - sonst rennt history.back() gegen den naechsten push.
  const go = (view: View) => () => replace(view)

  return (
    <Sheet title="Menü" onClose={back}>
      <button type="button" className="k-menu-row" onClick={go({ name: 'accounts' })}>
        <span className="k-menu-ic"><IconWallet /></span>
        <span className="k-menu-mid">
          <span className="k-menu-t">Konten</span>
          <span className="k-menu-s">
            {open.length} {open.length === 1 ? 'Konto' : 'Konten'} · Gesamtbalance{' '}
            <Money cent={totalBalance(accounts)} /> €
          </span>
        </span>
        <span className="k-acc-chev"><IconRight /></span>
      </button>

      <button type="button" className="k-menu-row" onClick={go({ name: 'stats' })}>
        <span className="k-menu-ic"><IconChart /></span>
        <span className="k-menu-mid">
          <span className="k-menu-t">Statistik</span>
          <span className="k-menu-s">Verlauf, Sparquote, Vergleiche</span>
        </span>
        <span className="k-acc-chev"><IconRight /></span>
      </button>

      <button type="button" className="k-menu-row" onClick={go({ name: 'categories' })}>
        <span className="k-menu-ic"><IconGrid /></span>
        <span className="k-menu-mid">
          <span className="k-menu-t">Kategorien</span>
          <span className="k-menu-s">{expenseCats} Ausgaben · {incomeCats} Einnahmen</span>
        </span>
        <span className="k-acc-chev"><IconRight /></span>
      </button>

      <button type="button" className="k-menu-row" onClick={go({ name: 'settings' })}>
        <span className="k-menu-ic"><IconSliders /></span>
        <span className="k-menu-mid">
          <span className="k-menu-t">Einstellungen</span>
          <span className="k-menu-s">Export, Berechnung, Daten</span>
        </span>
        <span className="k-acc-chev"><IconRight /></span>
      </button>

      {/* Kontor hat keine Kopfzeile, also auch keinen Platz fuer einen
          Zurueck-Knopf. Der Weg zum Launcher liegt darum hier, neben der
          Umbuchung - beides selten, beides nicht die Hauptsache. */}
      <div className="k-sheet-foot k-sheet-foot-split">
        <button type="button" className="k-ghost row" onClick={go({ name: 'transfer' })}>
          <span className="k-ghost-ic"><IconTransfer /></span> Umbuchung
        </button>
        <button type="button" className="k-ghost row" onClick={onExit}>
          <span className="k-ghost-ic"><IconGrid /></span> Alle Apps
        </button>
      </div>
    </Sheet>
  )
}
