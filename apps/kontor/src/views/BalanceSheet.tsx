import { useState } from 'react'
import NumPad from './NumPad'
import { IconRight } from '../icons'
import { Money, Sheet } from '../ui'
import { centToText, formatDate, textToCent, todayKey } from '../util'
import { setAccountBalance } from '../kontorStore'
import type { ViewProps } from '../types'

// Saldo von Hand setzen. Nicht die Differenz wird eingegeben, sondern der Wert,
// der auf dem Konto stehen soll - so wie man aufs Bankkonto schaut.
function BalanceSheet({ ctx, view }: ViewProps) {
  const { accounts, back, refresh } = ctx
  const account = accounts.find((a) => a.id === view.accountId)
  const [text, setText] = useState(account ? centToText(account.balanceCent) : '')

  if (!account) return null

  const target = textToCent(text)
  const diff = target - account.balanceCent

  const save = (zu: () => void) => () => {
    setAccountBalance(account.id, target)
    refresh()
    zu()
  }

  return (
    <Sheet title="Saldo korrigieren" subtitle={account.name} onClose={back}>
      {(zu) => (
      <>
      <div className="k-amount sheet">
        <Money cent={target} />
        <span className="k-amount-cur">€</span>
        <span className="k-caret" style={{ background: 'var(--ink)' }} />
      </div>

      <div className="k-diff">
        <div>
          <div className="k-label">Bisher</div>
          <div className="k-small-num strong"><Money cent={account.balanceCent} /> €</div>
        </div>
        <span className="k-diff-arrow"><IconRight /></span>
        <div className="right">
          <div className="k-label">Differenz</div>
          <div className={`k-small-num strong ${diff < 0 ? 'exp' : diff > 0 ? 'inc' : ''}`}>
            <Money cent={diff} sign={diff === 0 ? 'none' : 'auto'} /> €
          </div>
        </div>
      </div>

      <div className="k-meta">
        {diff === 0
          ? 'Noch keine Änderung.'
          : `Die Differenz wird als Korrektur vom ${formatDate(todayKey())} protokolliert. Sie zählt in keiner Einnahmen- oder Ausgabenstatistik mit.`}
      </div>

      <div className="k-pad-wrap sheet">
        <NumPad text={text} onText={setText} onSubmit={save(zu)} accent="var(--ink)" />
      </div>
      </>
      )}
    </Sheet>
  )
}

export default BalanceSheet
