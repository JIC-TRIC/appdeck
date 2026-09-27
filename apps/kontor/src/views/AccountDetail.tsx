import { useMemo } from 'react'
import EntryRow from './EntryRow'
import { Line } from '../charts'
import { IconPencil, IconWarn } from '../icons'
import { Money, Screen, Toggle } from '../ui'
import { addDays, inRange, parseKey, periodRange, todayKey } from '../util'
import {
  accountDelta,
  archiveAccount,
  balanceFromEntries,
  recalcAccountBalance,
  sortedEntries,
  updateAccount,
} from '../kontorStore'
import type { Account, KontorCtx, ViewProps } from '../types'

// Aussenherum nur die Suche, damit der Fall "Konto weg" ohne Hooks auskommt -
// ein bedingter Hook waere ein Fehler.
function AccountDetail({ ctx, view }: ViewProps) {
  const account = ctx.accounts.find((a) => a.id === view.accountId)
  if (!account) {
    return (
      <Screen title="Konto" onBack={ctx.back}>
        <div className="k-meta">Dieses Konto gibt es nicht mehr.</div>
      </Screen>
    )
  }
  return <AccountDetailInner ctx={ctx} account={account} />
}

function AccountDetailInner({ ctx, account }: { ctx: KontorCtx; account: Account }) {
  const { entries, accById, catById, settings, period, back, push, refresh, firstKey } = ctx

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  const own = useMemo(
    () => sortedEntries(entries).filter((e) => accountDelta(e, account.id) !== 0),
    [entries, account.id],
  )

  const inPeriod = own.filter((e) => inRange(e.date, range))

  // Einnahmen, Ausgaben und Umbuchungen dieses Kontos im Zeitraum. Hier zaehlt
  // die Kontosicht: was vom Konto abfliesst, ist Abfluss - unabhaengig davon,
  // wie die Gesamtstatistik eine Umbuchung bewertet.
  const flows = inPeriod.reduce(
    (acc, e) => {
      const delta = accountDelta(e, account.id)
      if (e.type === 'transfer') acc.transfer += delta
      else if (e.type === 'adjustment') acc.adjust += delta
      else if (delta > 0) acc.inc += delta
      else acc.exp += -delta
      return acc
    },
    { inc: 0, exp: 0, transfer: 0, adjust: 0 },
  )

  // Saldoverlauf: rueckwaerts vom heutigen Stand. Der gespeicherte Saldo ist
  // "jetzt", alles davor ergibt sich aus den Buchungen danach.
  const series = useMemo(() => {
    const from = range.from ?? firstKey
    const to = range.to && range.to < todayKey() ? range.to : todayKey()
    if (!from || to < from) return []
    const points: { label: string; value: number }[] = []
    const step = Math.max(1, Math.ceil((parseKey(to).getTime() - parseKey(from).getTime()) / 86400000 / 40))
    let key = from
    const after = (limit: string) =>
      entries.reduce((s, e) => (e.date > limit ? s + accountDelta(e, account.id) : s), 0)
    while (key <= to) {
      points.push({ label: key, value: account.balanceCent - after(key) })
      key = addDays(key, step)
    }
    if (points[points.length - 1]?.label !== to) {
      points.push({ label: to, value: account.balanceCent - after(to) })
    }
    return points
  }, [entries, account, range, firstKey])

  const fromEntries = balanceFromEntries(account.id, entries)
  const deviation = account.balanceCent - fromEntries

  const seriesDelta = series.length > 1 ? series[series.length - 1].value - series[0].value : 0

  return (
    <Screen
      title={
        <div className="k-head-with-icon">
          <span className="k-dot" style={{ background: account.color }} />
          <span className="k-head-title">{account.name}</span>
        </div>
      }
      onBack={back}
      right={
        <button
          type="button"
          className="k-ic"
          onClick={() => push({ name: 'accountForm', accountId: account.id })}
          aria-label="Konto bearbeiten"
        >
          <IconPencil />
        </button>
      }
    >
      <div className="k-card k-pad20">
        <div className="k-label">Saldo</div>
        <div className="k-row-end">
          <div className="k-big-num grow">
            <Money cent={account.balanceCent} /> <span className="k-cur">€</span>
          </div>
          <button
            type="button"
            className="k-chip solid"
            onClick={() => push({ name: 'balance', accountId: account.id, sheet: true })}
          >
            Korrigieren
          </button>
        </div>
        <div className="k-row-div">
          <span className="grow">Zur Gesamtbalance zählen</span>
          <Toggle
            on={account.includeInTotal}
            label="Zur Gesamtbalance zählen"
            onChange={(on) => {
              updateAccount(account.id, { includeInTotal: on })
              refresh()
            }}
          />
        </div>
      </div>

      {deviation !== 0 ? (
        <div className="k-warn">
          <span className="k-warn-ic"><IconWarn /></span>
          <div>
            <div>
              Der gespeicherte Saldo liegt <strong><Money cent={Math.abs(deviation)} /> €</strong>{' '}
              {deviation > 0 ? 'über' : 'unter'} der Summe aller Buchungen.
            </div>
            <button
              type="button"
              className="k-warn-action"
              onClick={() => {
                recalcAccountBalance(account.id)
                refresh()
              }}
            >
              Aus Buchungen neu berechnen
            </button>
          </div>
        </div>
      ) : null}

      <div className="k-card k-triple">
        <div>
          <div className="k-label">Einnahmen</div>
          <div className="k-triple-num inc"><Money cent={flows.inc} /></div>
        </div>
        <span className="k-vr" />
        <div>
          <div className="k-label">Ausgaben</div>
          <div className="k-triple-num exp"><Money cent={flows.exp} sign="minus" /></div>
        </div>
        <span className="k-vr" />
        <div>
          <div className="k-label">Umbuchung</div>
          <div className="k-triple-num neutral"><Money cent={flows.transfer} sign="auto" /></div>
        </div>
      </div>

      {series.length > 1 ? (
        <div className="k-card k-pad16">
          <div className="k-row-base">
            <span className="k-label grow">Saldoverlauf · {range.label}</span>
            <span className={`k-small-num strong ${seriesDelta >= 0 ? 'inc' : 'exp'}`}>
              <Money cent={seriesDelta} sign="auto" />
            </span>
          </div>
          <Line points={series} color={account.color} />
        </div>
      ) : null}

      <div className="k-card k-list-card">
        <div className="k-label k-list-label">Buchungen dieses Kontos</div>
        {inPeriod.length === 0 ? (
          <div className="k-list-empty">Keine Buchungen in diesem Zeitraum.</div>
        ) : (
          <div className="k-list">
            {inPeriod.slice(0, 40).map((e) => (
              <EntryRow
                key={e.id}
                entry={e}
                catById={catById}
                accById={accById}
                showDate
                onClick={() => {
                  // Korrekturen sind nicht bearbeitbar - dafuer gibt es "Korrigieren".
                  if (e.type !== 'adjustment') push({ name: 'entry', entryId: e.id })
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="k-stack">
        <button
          type="button"
          className="k-ghost"
          onClick={() => {
            archiveAccount(account.id, !account.archived)
            refresh()
            if (!account.archived) back()
          }}
        >
          {account.archived ? 'Konto wiederherstellen' : 'Konto archivieren'}
        </button>
      </div>
    </Screen>
  )
}

export default AccountDetail
