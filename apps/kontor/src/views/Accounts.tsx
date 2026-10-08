import { Glyph, IconPlus, IconRight, IconTransfer } from '../icons'
import { Money, Screen } from '../ui'
import { ACCOUNT_ICON } from '../data'
import { totalBalance } from '../kontorStore'
import type { Account, Entry, ViewProps } from '../types'

function AccountRow({
  account,
  entries,
  onClick,
  muted,
}: {
  account: Account
  entries: Entry[]
  onClick: () => void
  muted?: boolean
}) {
  const count = entries.filter(
    (e) => e.accountId === account.id || e.toAccountId === account.id,
  ).length
  return (
    <button type="button" className={`k-acc${muted ? ' muted' : ''}`} onClick={onClick}>
      <span className="k-acc-av" style={{ color: account.color, background: `${account.color}14` }}>
        <Glyph name={ACCOUNT_ICON} />
      </span>
      <span className="k-acc-mid">
        <span className="k-acc-name">{account.name}</span>
        <span className="k-acc-meta">
          {count} {count === 1 ? 'Buchung' : 'Buchungen'}
          {account.archived ? ' · archiviert' : ''}
          {!account.includeInTotal && !account.archived ? ' · zählt nicht mit' : ''}
        </span>
      </span>
      <span className="k-acc-bal"><Money cent={account.balanceCent} /></span>
      <span className="k-acc-chev"><IconRight /></span>
    </button>
  )
}

function Accounts({ ctx }: ViewProps) {
  const { accounts, entries, back, push } = ctx
  const open = accounts.filter((a) => !a.archived)
  const counted = open.filter((a) => a.includeInTotal)
  const excluded = open.filter((a) => !a.includeInTotal)
  const archived = accounts.filter((a) => a.archived)

  return (
    <Screen
      title="Konten"
      onBack={back}
      right={
        <button type="button" className="k-ic" onClick={() => push({ name: 'accountForm' })} aria-label="Konto hinzufügen">
          <IconPlus />
        </button>
      }
    >
      <div className="k-card k-pad20">
        <div className="k-label">Gesamtbalance</div>
        <div className="k-big-num">
          <Money cent={totalBalance(accounts)} /> <span className="k-cur">€</span>
        </div>
        <div className="k-meta tight">
          aus {counted.length} von {open.length} {open.length === 1 ? 'Konto' : 'Konten'}
        </div>
      </div>

      {counted.length ? (
        <>
          <div className="k-label k-section">In der Gesamtbalance</div>
          <div className="k-card k-list-card">
            {counted.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                entries={entries}
                onClick={() => push({ name: 'accountDetail', accountId: a.id })}
              />
            ))}
          </div>
        </>
      ) : null}

      {excluded.length ? (
        <>
          <div className="k-label k-section">Nicht in der Gesamtbalance</div>
          <div className="k-card k-list-card">
            {excluded.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                entries={entries}
                muted
                onClick={() => push({ name: 'accountDetail', accountId: a.id })}
              />
            ))}
          </div>
        </>
      ) : null}

      {archived.length ? (
        <>
          <div className="k-label k-section">Archiviert</div>
          <div className="k-card k-list-card">
            {archived.map((a) => (
              <AccountRow
                key={a.id}
                account={a}
                entries={entries}
                muted
                onClick={() => push({ name: 'accountDetail', accountId: a.id })}
              />
            ))}
          </div>
        </>
      ) : null}

      <div className="k-stack">
        <button type="button" className="k-dashed" onClick={() => push({ name: 'accountForm' })}>
          <IconPlus /> Konto hinzufügen
        </button>
        {open.length >= 2 ? (
          <button type="button" className="k-ghost row" onClick={() => push({ name: 'transfer' })}>
            <span className="k-ghost-ic"><IconTransfer /></span> Umbuchung
          </button>
        ) : null}
      </div>
    </Screen>
  )
}

export default Accounts
