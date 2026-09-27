import { Glyph } from '../icons'
import { Money, type MoneySign } from '../ui'
import { COLOR_OTHER, COLOR_TRANSFER } from '../data'
import { formatCent, formatDayShort } from '../util'
import type { Account, Category, Entry } from '../types'

// Eine Buchungszeile. Umbuchung und Korrektur behalten ihre neutrale Farbe -
// sie sollen nie wie eine echte Ausgabe aussehen.
export function entryLook(
  entry: Entry,
  catById: Record<string, Category>,
  accById: Record<string, Account>,
): { color: string; icon: string; title: string; detail: string; amountClass: string; sign: MoneySign } {
  if (entry.type === 'transfer') {
    const to = entry.toAccountId ? accById[entry.toAccountId] : undefined
    return {
      color: COLOR_TRANSFER,
      icon: 'transfer',
      title: 'Umbuchung',
      detail: `${accById[entry.accountId]?.name ?? '?'} → ${to?.name ?? '?'}`,
      amountClass: 'neutral',
      sign: 'none',
    }
  }
  if (entry.type === 'adjustment') {
    return {
      color: COLOR_OTHER,
      icon: 'adjust',
      title: entry.note?.trim() || 'Saldokorrektur',
      detail: accById[entry.accountId]?.name ?? '?',
      amountClass: 'muted',
      sign: 'auto',
    }
  }
  const cat = entry.categoryId ? catById[entry.categoryId] : undefined
  const account = accById[entry.accountId]?.name ?? '?'
  return {
    color: cat?.color ?? COLOR_OTHER,
    icon: cat?.icon ?? 'dots',
    title: cat?.name ?? 'Gelöschte Kategorie',
    detail: entry.note ? `${entry.note} · ${account}` : account,
    amountClass: entry.type === 'income' ? 'inc' : 'exp',
    sign: entry.type === 'income' ? 'plus' : 'minus',
  }
}

// Wonach die Suche in einer Buchung sucht: was in der Zeile steht (Kategorie,
// Notiz, Konto) plus der Betrag - einmal wie angezeigt ('1.234,56') und
// einmal ohne Tausenderpunkt, so wie man ihn tippt ('1234,56').
export function entrySearchText(
  entry: Entry,
  catById: Record<string, Category>,
  accById: Record<string, Account>,
) {
  const look = entryLook(entry, catById, accById)
  const abs = Math.abs(entry.amountCent)
  const plain = `${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`
  return `${look.title} ${look.detail} ${formatCent(abs)} ${plain}`.toLowerCase()
}

function EntryRow({
  entry,
  catById,
  accById,
  onClick,
  showDate,
}: {
  entry: Entry
  catById: Record<string, Category>
  accById: Record<string, Account>
  onClick: () => void
  showDate?: boolean
}) {
  const look = entryLook(entry, catById, accById)
  return (
    <button type="button" className="k-entry" onClick={onClick}>
      <span className="k-entry-av" style={{ color: look.color, background: `${look.color}14` }}>
        <Glyph name={look.icon} />
      </span>
      <span className="k-entry-mid">
        <span className="k-entry-title">{look.title}</span>
        <span className="k-entry-detail">
          {showDate ? `${formatDayShort(entry.date)} · ` : ''}
          {look.detail}
        </span>
      </span>
      <span className={`k-entry-amount ${look.amountClass}`}>
        <Money cent={entry.amountCent} sign={look.sign} />
      </span>
    </button>
  )
}

export default EntryRow
