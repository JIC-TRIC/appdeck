import { useMemo, useRef, useState, type TouchEvent } from 'react'
import { Donut } from '../charts'
import { breakdown, totalsInRange } from '../calc'
import { IconMinus, IconMore, IconPlus, IconRight } from '../icons'
import { Money, PeriodBar, Segmented } from '../ui'
import { periodRange, shiftPeriod } from '../util'
import { totalBalance } from '../kontorStore'
import type { CategoryKind, KontorCtx } from '../types'

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgaben' },
  { id: 'income', label: 'Einnahmen' },
]

function Main({ ctx }: { ctx: KontorCtx }) {
  const [kind, setKind] = useState<CategoryKind>('expense')
  // Angetippte Kategorie: nur ihr Segment bleibt farbig, und in der Mitte
  // steht ihr Betrag statt der Gesamtsumme. Nochmal tippen hebt es auf.
  const [picked, setPicked] = useState<string | null>(null)
  const { entries, accounts, accById, catById, settings, period, setPeriod, push, firstKey } = ctx

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  const totals = useMemo(
    () => totalsInRange(entries, range, accById, settings.countBoundaryTransfers),
    [entries, range, accById, settings.countBoundaryTransfers],
  )

  const bd = useMemo(
    () =>
      breakdown({
        entries,
        range,
        kind,
        catById,
        accById,
        countBoundary: settings.countBoundaryTransfers,
      }),
    [entries, range, kind, catById, accById, settings.countBoundaryTransfers],
  )

  // Beim Wechsel von Zeitraum oder Typ passt die Auswahl nicht mehr.
  const clearPick = () => setPicked(null)

  // Richtung des letzten Wechsels: danach fliegt der neue Zeitraum von der
  // passenden Seite herein.
  const [richtung, setRichtung] = useState(0)
  // Versatz waehrend des Ziehens - der Ring folgt dem Finger, sonst passiert
  // beim Wischen sichtbar nichts, bis es ploetzlich umspringt.
  const [zug, setZug] = useState(0)

  const move = (dir: number) => {
    clearPick()
    setRichtung(dir)
    setZug(0)
    setPeriod({ ...period, anchor: shiftPeriod(period.kind, period.anchor, dir, settings.weekStart) })
  }

  const touch = useRef<{ x: number; y: number; quer: boolean } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    if (period.kind === 'all') return
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, quer: false }
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!touch.current) return
    const dx = e.touches[0].clientX - touch.current.x
    const dy = e.touches[0].clientY - touch.current.y
    if (!touch.current.quer && Math.abs(dx) < 12) return
    if (Math.abs(dx) < Math.abs(dy)) return
    touch.current.quer = true
    // Gedaempft: die Geste soll sich fuehren lassen, nicht rutschen.
    setZug(dx * 0.45)
  }

  const onTouchEnd = (e: TouchEvent) => {
    if (!touch.current) return
    const dx = e.changedTouches[0].clientX - touch.current.x
    const quer = touch.current.quer
    touch.current = null
    if (quer && Math.abs(dx) > 60) move(dx < 0 ? 1 : -1)
    else setZug(0)
  }

  // Von unten hochwischen oeffnet das Menue. Der Startpunkt muss deutlich ueber
  // dem unteren Rand liegen - direkt am Rand gehoert die Geste dem System
  // (iOS verlaesst dort die App) - und die Strecke lang genug sein, damit es
  // nicht beim Scrollen versehentlich aufgeht.
  const hoch = useRef<{ x: number; y: number } | null>(null)
  const onMainTouchStart = (e: TouchEvent) => {
    const y = e.touches[0].clientY
    const h = window.innerHeight
    hoch.current = y > h - 260 && y < h - 90 ? { y, x: e.touches[0].clientX } : null
  }
  const onMainTouchEnd = (e: TouchEvent) => {
    if (!hoch.current) return
    const dy = e.changedTouches[0].clientY - hoch.current.y
    const dx = Math.abs(e.changedTouches[0].clientX - hoch.current.x)
    hoch.current = null
    if (dy < -90 && dx < 60) push({ name: 'menu', sheet: true })
  }

  const balance = totalBalance(accounts)

  return (
    <div className="k-main" onTouchStart={onMainTouchStart} onTouchEnd={onMainTouchEnd}>
      {/* Keine Kopfzeile mehr: die Wortmarke stand auf jedem Start dieselbe
          halbe Zeile lang da und kostete die Hoehe, die der Ring braucht. Der
          Menueknopf haengt jetzt am rechten Rand der Zeitraumzeile. */}
      <PeriodBar
        range={range}
        gesamt={period.kind === 'all'}
        dir={richtung}
        onPrev={() => move(-1)}
        onNext={() => move(1)}
        onOpen={() => push({ name: 'period', sheet: true })}
        right={
          <button type="button" className="k-ic" onClick={() => push({ name: 'menu', sheet: true })} aria-label="Menü">
            <IconMore />
          </button>
        }
      />

      <div className="k-center-row">
        <Segmented options={KINDS} value={kind} onChange={(k) => { clearPick(); setKind(k) }} />
      </div>

      <div
        className={`k-donut-hold${zug ? ' dragging' : ''}`}
        key={`d-${range.label}`}
        data-dir={richtung}
        style={zug ? { transform: `translateX(${zug}px)` } : undefined}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <Donut
          segments={bd.segments}
          total={bd.total}
          incCent={totals.inc}
          expCent={totals.exp}
          kind={kind}
          picked={picked}
          onPick={(seg) => setPicked((cur) => (cur === seg.id ? null : seg.id))}
          onSelect={(seg) => push({ name: 'categoryDetail', segment: seg, kind })}
        />
      </div>

      {/* Keine schwebende Karte mehr - eine Haarlinie und zwei Zeilen. Der
          Betrag ist hier die Hauptsache und steht darum allein auf seiner
          Zeile, die Einordnung darueber klein und leise. */}
      <button type="button" className="k-balance" onClick={() => push({ name: 'entries' })}>
        <span className="k-balance-top">
          <span className="k-label">Gesamtbalance</span>
          {/* Der Pfeil steht bei der Buchungszahl, nicht unter ihr: was hinter
              dem Tipp liegt, sind genau diese Buchungen. */}
          <span className="k-balance-side">
            {totals.count} {totals.count === 1 ? 'Buchung' : 'Buchungen'}
          </span>
          <span className="k-balance-chev"><IconRight /></span>
        </span>
        <span className={`k-balance-num${balance < 0 ? ' neg' : ''}`}>
          <Money cent={balance} /> <span className="k-cur">€</span>
        </span>
      </button>

      <div className="k-actions">
        <button
          type="button"
          className="k-action-btn exp"
          onClick={() => push({ name: 'entry', type: 'expense' })}
        >
          <IconMinus />
          <span>Ausgabe</span>
        </button>
        <button
          type="button"
          className="k-action-btn inc"
          onClick={() => push({ name: 'entry', type: 'income' })}
        >
          <IconPlus />
          <span>Einnahme</span>
        </button>
      </div>
    </div>
  )
}

export default Main
