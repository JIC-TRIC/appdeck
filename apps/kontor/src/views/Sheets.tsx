import { useRef, type ReactNode } from 'react'
import { IconCheck, IconChart, IconGrid, IconRight, IconSliders, IconTransfer, IconWallet } from '../icons'
import { Money, Sheet } from '../ui'
import { PERIODS, imZeitraum, periodRange, todayKey } from '../util'
import { budgetUsage, monthRangeOf, totalsInRange } from '../calc'
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

// Eine Kachel im Menue: Symbol, Name, die wichtigste Zahl und eine Zeile
// dazu. So ist das Menue selbst schon ein kleiner Ueberblick.
function MenuTile({
  icon,
  color,
  title,
  value,
  sub,
  onClick,
}: {
  icon: ReactNode
  color: string
  title: string
  value?: ReactNode
  sub: ReactNode
  onClick: () => void
}) {
  return (
    <button type="button" className="k-menu-tile" onClick={onClick}>
      <span className="k-menu-tile-top">
        <span className="k-menu-ic" style={{ color, background: `color-mix(in srgb, ${color} 13%, transparent)` }}>
          {icon}
        </span>
        <span className="k-menu-tile-chev"><IconRight /></span>
      </span>
      <span className="k-menu-tile-t">{title}</span>
      {value ? <span className="k-menu-tile-v">{value}</span> : null}
      <span className="k-menu-tile-s">{sub}</span>
    </button>
  )
}

// Statt einer Tab-Leiste: alles, was nicht die Hauptansicht ist, liegt hier.
export function MenuSheet({ ctx }: ViewProps) {
  const { accounts, categories, entries, accById, settings, period, firstKey, back, unterlegen, blattWeg, onExit } = ctx
  const open = accounts.filter((a) => !a.archived)
  const outside = open.filter((a) => !a.includeInTotal).length
  const cats = categories.filter((c) => !c.archived)
  const countBoundary = settings.countBoundaryTransfers

  // Sparquote des Zeitraums, den die Startseite gerade zeigt - gerechnet wie
  // in der Statistik.
  const range = periodRange(period.kind, period.anchor, settings.weekStart, firstKey)
  const totals = totalsInRange(entries, range, accById, countBoundary)
  const savings = totals.inc > 0 ? (totals.inc - totals.exp) / totals.inc : null

  // Budgets sind Monatsbudgets: gezaehlt wird im Monat, in dem die Startseite
  // gerade steht.
  const month = monthRangeOf(period.anchor)
  const budgeted = cats.filter((c) => c.kind === 'expense' && c.budgetCent)
  const over = budgeted.filter(
    (c) => budgetUsage(entries, month, c.id, accById, countBoundary) > (c.budgetCent ?? 0),
  ).length

  // Die gewaehlte Seite faehrt sofort herein und liegt dabei unter dem Blatt,
  // das gleichzeitig nach unten gleitet - frueher schloss erst das Blatt, und
  // dann sprang die Seite um. Ist das Blatt zu, nimmt es nur sich selbst vom
  // Stapel; sein History-Eintrag gehoert ab dann der Seite.
  const ziel = useRef<View | null>(null)
  const onClose = () => (ziel.current ? blattWeg() : back())

  return (
    <Sheet title="Menü" onClose={onClose}>
      {(zu) => {
        const go = (view: View) => () => {
          ziel.current = view
          unterlegen(view)
          zu()
        }
        return (
          <>
            <div className="k-menu-tiles">
              <MenuTile
                icon={<IconWallet />}
                color="var(--neutral)"
                title="Konten"
                value={<><Money cent={totalBalance(accounts)} /> <span className="k-cur">€</span></>}
                sub={`${open.length} ${open.length === 1 ? 'Konto' : 'Konten'}${outside ? ` · ${outside} außerhalb` : ''}`}
                onClick={go({ name: 'accounts' })}
              />
              <MenuTile
                icon={<IconChart />}
                color="var(--inc)"
                title="Statistik"
                value={savings === null ? '–' : `${(savings * 100).toFixed(1).replace('-', '−').replace('.', ',')} %`}
                sub={savings === null ? 'Verlauf und Auswertungen' : `gespart ${imZeitraum(period.kind, range)}`}
                onClick={go({ name: 'stats' })}
              />
              <MenuTile
                icon={<IconGrid />}
                color="#c4623d"
                title="Kategorien"
                value={String(cats.length)}
                sub={
                  budgeted.length
                    ? `${budgeted.length} mit Budget${over ? ` · ${over} drüber` : ''}`
                    : `${cats.filter((c) => c.kind === 'expense').length} Ausgaben · ${cats.filter((c) => c.kind === 'income').length} Einnahmen`
                }
                onClick={go({ name: 'categories' })}
              />
              <MenuTile
                icon={<IconSliders />}
                color="var(--muted)"
                title="Einstellungen"
                sub="Export, Wochenstart, Daten"
                onClick={go({ name: 'settings' })}
              />
            </div>

            {/* Der schnelle Weg zum Launcher ist der Knopf links in der
                Zeitraumzeile. Hier steht er noch einmal, neben der Umbuchung -
                beides selten, beides nicht die Hauptsache. */}
            <div className="k-sheet-foot k-sheet-foot-split">
              <button type="button" className="k-ghost row" onClick={go({ name: 'transfer' })}>
                <span className="k-ghost-ic"><IconTransfer /></span> Umbuchung
              </button>
              <button type="button" className="k-ghost row" onClick={onExit}>
                <span className="k-ghost-ic"><IconGrid /></span> Alle Apps
              </button>
            </div>
          </>
        )
      }}
    </Sheet>
  )
}
