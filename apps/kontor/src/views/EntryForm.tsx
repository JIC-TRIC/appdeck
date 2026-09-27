import { useMemo, useState } from 'react'
import { IonSelect, IonSelectOption } from '@ionic/react'
import NumPad, { useBetrag } from './NumPad'
import {
  Glyph,
  IconCalendar,
  IconClose,
  IconDown,
  IconInfo,
  IconSwap,
  IconTrash,
} from '../icons'
import { Amount, Label, Segmented } from '../ui'
import { addEntry, deleteEntry, updateEntry, updateSettings } from '../kontorStore'
import { entryLook } from './EntryRow'
import {
  addDays,
  centToText,
  formatCent,
  formatDayShort,
  inRange,
  periodRange,
  textToCent,
  todayKey,
} from '../util'
import type { CategoryKind, EntryType, ViewProps } from '../types'

const TYPES: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgabe' },
  { id: 'income', label: 'Einnahme' },
]

const ACCENT: Record<EntryType, string> = {
  expense: 'var(--exp)',
  income: 'var(--inc)',
  transfer: 'var(--neutral)',
  adjustment: 'var(--ink)',
}

// Kurze Beschriftung fuer den Datumsknopf: heute und gestern beim Namen,
// alles andere als Datum.
function dateLabel(key: string) {
  if (key === todayKey()) return 'Heute'
  if (key === addDays(todayKey(), -1)) return 'Gestern'
  return formatDayShort(key)
}

// Ein Formular fuer Ausgabe, Einnahme und Umbuchung - und fuer das Bearbeiten
// einer bestehenden Buchung. Der Aufbau ist fuers Hochformat gerechnet: Datum
// und Konto oben, Betrag und Notiz immer sichtbar, gescrollt wird nur im
// Kategorienraster, das Ziffernfeld steht fest unten.
function EntryForm({ ctx, view }: ViewProps) {
  const { categories, accounts, settings, refresh, back, push, entries, period, firstKey, removeEntry, notify } = ctx
  const existing = view.entryId ? entries.find((e) => e.id === view.entryId) ?? null : null

  const open = accounts.filter((a) => !a.archived)
  const startType: EntryType = existing?.type ?? view.type ?? 'expense'
  const lastUsedCategory = (kind: EntryType) =>
    kind === 'expense' || kind === 'income' ? settings.lastUsed?.[kind]?.categoryId ?? null : null

  // Vorbelegtes Datum: heute, wenn heute im gewaehlten Zeitraum liegt. Wer in
  // der Uebersicht im Juli blaettert und dort etwas nachtraegt, meint den Juli.
  const startDate = useMemo(() => {
    if (existing) return existing.date
    const range = periodRange(period.kind, period.anchor, settings.weekStart, firstKey)
    return inRange(todayKey(), range) ? todayKey() : range.from ?? todayKey()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [type, setType] = useState<EntryType>(startType)
  const betrag = useBetrag(existing ? centToText(existing.amountCent) : '')
  const text = betrag.text
  const [categoryId, setCategoryId] = useState<string | null>(
    existing?.categoryId ?? lastUsedCategory(view.type ?? 'expense'),
  )
  const [accountId, setAccountId] = useState<string | null>(
    existing?.accountId ?? settings.lastUsed?.accountId ?? open[0]?.id ?? null,
  )
  const [toAccountId, setToAccountId] = useState<string | null>(
    existing?.toAccountId ?? open.find((a) => a.id !== (existing?.accountId ?? open[0]?.id))?.id ?? null,
  )
  const [date, setDate] = useState(startDate)
  const [note, setNote] = useState(existing?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const isTransfer = type === 'transfer'
  const cats = useMemo(
    () => categories.filter((c) => !c.archived && c.kind === type).sort((a, b) => a.order - b.order),
    [categories, type],
  )
  const cent = textToCent(text)
  const accent = ACCENT[type]

  // Beim Typwechsel passt die alte Kategorie nicht mehr - Ausgaben- und
  // Einnahmenkategorien sind getrennte Listen.
  const switchType = (next: CategoryKind) => {
    setType(next)
    const keep = categories.find((c) => c.id === categoryId)
    if (!keep || keep.kind !== next) {
      setCategoryId(lastUsedCategory(next))
    }
  }

  const from = open.find((a) => a.id === accountId)
  const to = open.find((a) => a.id === toAccountId)
  const crossesBoundary =
    isTransfer && from && to && from.includeInTotal !== to.includeInTotal && settings.countBoundaryTransfers

  const validate = () => {
    if (cent <= 0) return 'Betrag fehlt'
    if (!accountId) return 'Konto fehlt'
    if (isTransfer) {
      if (!toAccountId) return 'Zielkonto fehlt'
      if (accountId === toAccountId) return 'Zwei verschiedene Konten wählen'
      return null
    }
    if (!categoryId) return 'Kategorie fehlt'
    return null
  }

  const save = () => {
    const problem = validate()
    if (problem || !accountId) {
      setError(problem)
      return
    }
    const payload = {
      type,
      amountCent: cent,
      date,
      categoryId: isTransfer ? null : categoryId,
      accountId,
      toAccountId: isTransfer ? toAccountId : null,
      note,
    }
    if (existing) {
      updateEntry(existing.id, payload)
      refresh()
      back()
      return
    }
    const neu = addEntry(payload)
    updateSettings({
      lastUsed: isTransfer
        ? { ...settings.lastUsed, accountId }
        : { ...settings.lastUsed, [type]: { categoryId }, accountId },
    })
    refresh()
    back()
    // Das Formular ist sofort zu - die Meldung sagt, was gebucht wurde, und
    // laesst einen Vertipper ein paar Sekunden lang zuruecknehmen.
    const vorzeichen = type === 'expense' ? '−' : type === 'income' ? '+' : ''
    notify(
      `Gebucht: ${entryLook(neu, ctx.catById, ctx.accById).title}, ${vorzeichen}${formatCent(cent)} €`,
      () => deleteEntry(neu.id),
      { hoch: true },
    )
  }

  // Ohne Rueckfrage - die Meldung danach bietet "Rueckgaengig" an.
  const remove = () => {
    if (!existing) return
    removeEntry(existing)
    back()
  }

  // Ionics Auswahl als iOS-Aktionsblatt von unten. Das Kaestchen selbst sieht
  // aus wie vorher; Ionics eigener Pfeil ist per CSS aus, Kontors bleibt.
  const accountSelect = (value: string | null, onChange: (id: string) => void, label: string) => (
    <span className="k-select">
      <IonSelect
        value={value ?? undefined}
        onIonChange={(e) => onChange(String(e.detail.value))}
        interface="action-sheet"
        interfaceOptions={{ header: label, cssClass: 'k-action-sheet' }}
        cancelText="Abbrechen"
        aria-label={label}
      >
        {open.map((a) => (
          <IonSelectOption key={a.id} value={a.id}>
            {a.name}
          </IonSelectOption>
        ))}
      </IonSelect>
      <span className="k-select-ic"><IconDown /></span>
    </span>
  )

  return (
    <div className="k-screen fixed">
      <header className="k-head">
        <button type="button" className="k-ic" onClick={back} aria-label="Abbrechen">
          <IconClose />
        </button>
        <div className="k-head-mid">
          {isTransfer || type === 'adjustment' ? (
            <div className="k-head-title">Umbuchung</div>
          ) : (
            <Segmented options={TYPES} value={type} onChange={switchType} tone={accent} />
          )}
        </div>
        {existing ? (
          <button type="button" className="k-ic danger" onClick={remove} aria-label="Buchung löschen">
            <IconTrash />
          </button>
        ) : (
          <span className="k-ic-space" />
        )}
      </header>

      {/* Datum und Konto ganz oben - beides ist bei jeder Buchung gesetzt und
          soll ohne Scrollen sichtbar und aenderbar sein. */}
      <div className="k-entry-top">
        <label className="k-date-btn">
          <span className="k-date-ic"><IconCalendar /></span>
          <span>{dateLabel(date)}</span>
          <input
            type="date"
            value={date}
            aria-label="Datum"
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </label>
        {isTransfer ? null : accountSelect(accountId, setAccountId, 'Konto')}
      </div>

      <Amount
        text={text}
        signal={betrag.signal}
        sign={type === 'expense' ? 'minus' : type === 'income' ? 'plus' : 'none'}
        color={accent}
        caret
      />

      {/* Die Notiz steht bewusst weit oben: die Kategorie sagt "Lebensmittel",
          die Notiz sagt, was es war. Ohne sie ist eine Buchung spaeter nicht
          mehr zuzuordnen. */}
      <label className="k-note big">
        <input
          type="text"
          value={note}
          placeholder={isTransfer ? 'Notiz (optional)' : 'Wofür?'}
          onChange={(e) => setNote(e.target.value)}
          maxLength={140}
        />
      </label>

      {isTransfer ? (
        <div className="k-transfer">
          <Label>Von</Label>
          {accountSelect(accountId, setAccountId, 'Von Konto')}
          <div className="k-swap-row">
            <span className="k-hr" />
            <button
              type="button"
              className="k-swap"
              onClick={() => {
                setAccountId(toAccountId)
                setToAccountId(accountId)
              }}
              aria-label="Konten tauschen"
            >
              <IconSwap />
            </button>
            <span className="k-hr" />
          </div>
          <Label>Nach</Label>
          {accountSelect(toAccountId, setToAccountId, 'Nach Konto')}
          {crossesBoundary ? (
            <div className="k-note-box">
              <span className="k-note-ic"><IconInfo /></span>
              <div>
                <strong>{from.includeInTotal ? to.name : from.name}</strong> zählt nicht zur
                Gesamtbalance. Diese Umbuchung wirkt in der Statistik darum wie eine{' '}
                <strong>{from.includeInTotal ? 'Ausgabe' : 'Einnahme'}</strong>.
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <>
          <Label>Kategorie</Label>
          {/* Nur hier wird gescrollt, und das Scrollen bleibt im Raster. */}
          <div className="k-cat-scroll">
            <div className="k-cat-grid">
              {cats.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`k-cat${c.id === categoryId ? ' on' : ''}`}
                  style={
                    c.id === categoryId
                      ? { color: c.color, borderColor: c.color, boxShadow: `inset 0 0 0 1px ${c.color}` }
                      : { color: c.color }
                  }
                  onClick={() => setCategoryId(c.id)}
                >
                  <span className="k-cat-ic"><Glyph name={c.icon} /></span>
                  <span className="k-cat-name">{c.name}</span>
                </button>
              ))}
              <button
                type="button"
                className="k-cat dashed"
                onClick={() => push({ name: 'categoryForm', kind: type === 'income' ? 'income' : 'expense' })}
              >
                <span className="k-cat-ic"><Glyph name="dots" /></span>
                <span className="k-cat-name">Neu</span>
              </button>
            </div>
          </div>
        </>
      )}

      {error ? <div className="k-error">{error}</div> : null}

      <div className="k-pad-wrap">
        <NumPad text={text} onText={betrag.setText} onReject={betrag.ablehnen} onSubmit={save} accent={accent} />
      </div>
    </div>
  )
}

export default EntryForm
