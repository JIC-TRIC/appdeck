import { useEffect, useState } from 'react'
import NumPad, { useBetrag } from './NumPad'
import { IconRight } from '../icons'
import { Amount, Money, Sheet } from '../ui'
import { centToPad, formatDate, padToCent, todayKey } from '../util'
import { setAccountBalance } from '../kontorStore'
import type { ViewProps } from '../types'
import { entwurfKey, entwurfLesen, entwurfLoeschen, entwurfSchreiben } from '../entwurf'

// Saldo von Hand setzen. Nicht die Differenz wird eingegeben, sondern der Wert,
// der auf dem Konto stehen soll - so wie man aufs Bankkonto schaut.
function BalanceSheet({ ctx, view }: ViewProps) {
  const { accounts, back, refresh } = ctx
  const account = accounts.find((a) => a.id === view.accountId)
  // Typischer Fall fuer einen Entwurf: Kontostand in der Banking-App
  // nachsehen, zurueckkommen - und iOS hat Kontor inzwischen neu gestartet.
  const draftKey = entwurfKey(view)
  const [draft] = useState(() => entwurfLesen<{ text: string }>(draftKey))
  const betrag = useBetrag(draft?.text ?? (account ? centToPad(account.balanceCent) : ''))
  useEffect(() => {
    entwurfSchreiben(draftKey, { text: betrag.text })
  }, [draftKey, betrag.text])

  if (!account) return null

  const target = padToCent(betrag.text)
  const diff = target - account.balanceCent

  // Weggewischt oder gespeichert: der Entwurf ist erledigt.
  const schliessen = () => {
    entwurfLoeschen(draftKey)
    back()
  }

  const save = (zu: () => void) => () => {
    entwurfLoeschen(draftKey)
    setAccountBalance(account.id, target)
    refresh()
    zu()
  }

  return (
    <Sheet title="Saldo korrigieren" subtitle={account.name} onClose={schliessen}>
      {(zu) => (
      <>
      <Amount text={betrag.text} signal={betrag.signal} variant="sheet" caret />

      <div className="k-diff">
        <div>
          <div className="k-label">Bisher</div>
          {/* Korrigieren heisst vergleichen - hier steht der Saldo auch beim Verbergen offen. */}
          <div className="k-small-num strong"><Money cent={account.balanceCent} offen /> €</div>
        </div>
        <span className="k-diff-arrow"><IconRight /></span>
        <div className="right">
          <div className="k-label">Differenz</div>
          <div className={`k-small-num strong ${diff < 0 ? 'exp' : diff > 0 ? 'inc' : ''}`}>
            <Money cent={diff} sign={diff === 0 ? 'none' : 'auto'} offen /> €
          </div>
        </div>
      </div>

      <div className="k-meta">
        {diff === 0
          ? 'Noch keine Änderung.'
          : `Die Differenz wird als Korrektur vom ${formatDate(todayKey())} protokolliert. Sie zählt in keiner Einnahmen- oder Ausgabenstatistik mit.`}
      </div>

      <div className="k-pad-wrap sheet">
        <NumPad text={betrag.text} onText={betrag.setText} onReject={betrag.ablehnen} onSubmit={save(zu)} accent="var(--ink)" />
      </div>
      </>
      )}
    </Sheet>
  )
}

export default BalanceSheet
