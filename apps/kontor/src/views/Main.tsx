import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { Donut } from '../charts'
import { breakdown, totalsInRange } from '../calc'
import { IconEye, IconEyeOff, IconGrid, IconMinus, IconMore, IconPlus, IconRight } from '../icons'
import { Money, PeriodBar } from '../ui'
import { imZeitraum, periodRange, shiftPeriod } from '../util'
import { totalBalance } from '../kontorStore'
import type { CategoryKind, KontorCtx } from '../types'

const KINDS: { id: CategoryKind; label: string }[] = [
  { id: 'expense', label: 'Ausgaben' },
  { id: 'income', label: 'Einnahmen' },
]

// Wie lange ein Zeitraum zum Einrasten gleitet (muss zu .k-swipe.gleitet passen).
const GLEITEN_MS = 300

// Ab wann ein Wisch umblaettert: ein Viertel der Breite - oder ein kurzer,
// schneller Schubs. Ohne den Schwung muesste man fuer jeden Monat weit ziehen.
const SCHWELLE_ANTEIL = 0.25
const SCHWUNG_PX_MS = 0.45
const SCHWUNG_MIN_PX = 24

function Main({ ctx }: { ctx: KontorCtx }) {
  const [kind, setKind] = useState<CategoryKind>('expense')
  // Angetippte Kategorie: nur ihr Segment bleibt farbig, und in der Mitte
  // steht ihr Betrag statt der Gesamtsumme. Nochmal tippen hebt es auf.
  const [picked, setPicked] = useState<string | null>(null)
  const { entries, accounts, accById, catById, settings, period, setPeriod, push, firstKey, onExit, diskret, setDiskret } = ctx
  const countBoundary = settings.countBoundaryTransfers
  const blaetterbar = period.kind !== 'all'

  const range = useMemo(
    () => periodRange(period.kind, period.anchor, settings.weekStart, firstKey),
    [period, settings.weekStart, firstKey],
  )

  const totals = useMemo(
    () => totalsInRange(entries, range, accById, countBoundary),
    [entries, range, accById, countBoundary],
  )

  // Karussell: der Zeitraum davor und danach liegen links und rechts neben
  // dem sichtbaren Ring bereit. Beim Wischen zieht man sie ins Bild, statt
  // dass einer verschwindet und der naechste aus dem Nichts auftaucht.
  const seiten = useMemo(() => {
    const versaetze = blaetterbar ? [-1, 0, 1] : [0]
    return versaetze.map((v) => {
      const anchor = v === 0 ? period.anchor : shiftPeriod(period.kind, period.anchor, v, settings.weekStart)
      const r = v === 0 ? range : periodRange(period.kind, anchor, settings.weekStart, firstKey)
      return {
        versatz: v,
        range: r,
        totals: v === 0 ? totals : totalsInRange(entries, r, accById, countBoundary),
        bd: breakdown({ entries, range: r, kind, catById, accById, countBoundary }),
      }
    })
  }, [blaetterbar, period, range, totals, settings.weekStart, firstKey, entries, kind, catById, accById, countBoundary])

  // Beim Wechsel von Zeitraum oder Typ passt die Auswahl nicht mehr.
  const clearPick = () => setPicked(null)

  // Richtung des letzten Wechsels - der Zeitraum in der Kopfzeile kommt von
  // der passenden Seite herein.
  const [richtung, setRichtung] = useState(0)
  // Versatz in px, solange der Finger zieht.
  const [zug, setZug] = useState(0)
  // Laufender Wechsel: 1 = zum naechsten Zeitraum, -1 = zum vorigen.
  const [fahrt, setFahrt] = useState(0)
  // Uebergang an: beim Einrasten und Zurueckfedern, nicht waehrend des Ziehens.
  const [gleitet, setGleitet] = useState(false)
  const hold = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const ruhig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // Blaettern mit Animation - fuer Wisch und Pfeile gleich. Erst gleitet das
  // Karussell eine Seite weiter, dann wird der Zeitraum umgestellt und das
  // Karussell ohne Uebergang zurueck in die Mitte gesetzt. Weil die neue Mitte
  // genau das zeigt, was eben daneben lag, sieht man davon nichts.
  const blaettern = (dir: number) => {
    if (fahrt) return
    clearPick()
    setRichtung(dir)
    const umstellen = () => {
      setPeriod((p) => ({ ...p, anchor: shiftPeriod(p.kind, p.anchor, dir, settings.weekStart) }))
      setGleitet(false)
      setFahrt(0)
      setZug(0)
    }
    if (!blaetterbar || ruhig()) {
      umstellen()
      return
    }
    setGleitet(true)
    setZug(0)
    setFahrt(dir)
    timer.current = window.setTimeout(umstellen, GLEITEN_MS)
  }

  // Start, Richtung und Tempo (px/ms, geglaettet) der laufenden Geste.
  const touch = useRef<{ x: number; y: number; quer: boolean; lastX: number; lastT: number; v: number } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    if (!blaetterbar || fahrt) return
    const x = e.touches[0].clientX
    touch.current = { x, y: e.touches[0].clientY, quer: false, lastX: x, lastT: performance.now(), v: 0 }
  }

  const onTouchMove = (e: TouchEvent) => {
    const t = touch.current
    if (!t) return
    const x = e.touches[0].clientX
    const dx = x - t.x
    const dy = e.touches[0].clientY - t.y
    if (!t.quer && Math.abs(dx) < 10) return
    if (!t.quer && Math.abs(dx) < Math.abs(dy)) {
      // Senkrecht gemeint - das gehoert dem Scrollen.
      touch.current = null
      return
    }
    t.quer = true
    const now = performance.now()
    t.v = 0.7 * ((x - t.lastX) / Math.max(1, now - t.lastT)) + 0.3 * t.v
    t.lastX = x
    t.lastT = now
    setGleitet(false)
    // Der Ring folgt dem Finger 1:1 - so fuehlt es sich an wie Umblaettern.
    setZug(dx)
  }

  const onTouchEnd = (e: TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t || !t.quer) return
    const dx = e.changedTouches[0].clientX - t.x
    // Schwung zaehlt nur, wenn der Finger bis zuletzt in Bewegung war - wer
    // erst zieht, dann anhaelt und loslaesst, will nicht weiterblaettern.
    const tempo = performance.now() - t.lastT < 100 ? t.v : 0
    const breite = hold.current?.clientWidth ?? 390
    const weit = Math.abs(dx) > breite * SCHWELLE_ANTEIL
    const schnell = Math.abs(tempo) > SCHWUNG_PX_MS && Math.abs(dx) > SCHWUNG_MIN_PX
    if (weit || schnell) {
      blaettern(dx < 0 ? 1 : -1)
    } else {
      setGleitet(true)
      setZug(0)
    }
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
  const offen = accounts.filter((a) => !a.archived).length
  // Kopfzeile und Kacheln springen schon beim Loslassen auf den neuen
  // Zeitraum, nicht erst, wenn der Ring eingerastet ist - sonst hinken sie
  // hinterher.
  const ziel = fahrt ? seiten.find((s) => s.versatz === fahrt) : undefined
  const kopf = ziel?.range ?? range
  const summen = ziel?.totals ?? totals
  // Budgets sind Monatsbudgets - in jedem anderen Zeitraum waere der
  // Vergleich schief, also steht er dann auch nicht in der Ringmitte.
  const budgetOf = (id: string) =>
    period.kind === 'month' && kind === 'expense' ? catById[id]?.budgetCent ?? null : null
  const spur = blaetterbar ? `translateX(calc(${-100 - fahrt * 100}% + ${zug}px))` : undefined

  return (
    <div className="k-main" onTouchStart={onMainTouchStart} onTouchEnd={onMainTouchEnd}>
      {/* Keine Kopfzeile mehr: die Wortmarke stand auf jedem Start dieselbe
          halbe Zeile lang da und kostete die Hoehe, die der Ring braucht. Der
          Menueknopf haengt jetzt am rechten Rand der Zeitraumzeile, der Weg
          zu allen Apps gegenueber am linken - ein Tipp, wie in Stash. */}
      <PeriodBar
        range={kopf}
        gesamt={!blaetterbar}
        dir={richtung}
        onPrev={() => blaettern(-1)}
        onNext={() => blaettern(1)}
        onOpen={() => push({ name: 'period', sheet: true })}
        left={
          <button type="button" className="k-ic" onClick={onExit} aria-label="Alle Apps">
            <IconGrid />
          </button>
        }
        right={
          <button type="button" className="k-ic" onClick={() => push({ name: 'menu', sheet: true })} aria-label="Menü">
            <IconMore />
          </button>
        }
      />

      {/* Die Summen sind zugleich der Umschalter fuer den Ring: wer wissen
          will, woraus die Ausgaben bestehen, tippt auf die Ausgaben. */}
      <div className="k-kinds" role="group" aria-label="Der Ring zeigt">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            className={`k-kind ${k.id === 'expense' ? 'exp' : 'inc'}${kind === k.id ? ' on' : ''}`}
            aria-pressed={kind === k.id}
            onClick={() => {
              clearPick()
              setKind(k.id)
            }}
          >
            <span className="k-kind-label">
              <span className="k-kind-dot" />
              {k.label}
            </span>
            <span className="k-kind-num">
              <Money cent={k.id === 'expense' ? summen.exp : summen.inc} /> <span className="k-cur">€</span>
            </span>
          </button>
        ))}
      </div>

      <div
        className="k-donut-hold"
        ref={hold}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className={`k-swipe${gleitet ? ' gleitet' : ''}`} style={spur ? { transform: spur } : undefined}>
          {seiten.map((s) => (
            <div className="k-swipe-page" key={s.versatz} aria-hidden={s.versatz !== 0 || undefined}>
              {s.versatz === 0 ? (
                <Donut
                  segments={s.bd.segments}
                  total={s.bd.total}
                  count={s.totals.count}
                  diff={s.totals.diff}
                  zeitraum={imZeitraum(period.kind, s.range)}
                  kind={kind}
                  picked={picked}
                  budgetOf={budgetOf}
                  onPick={(seg) => setPicked((cur) => (!seg || cur === seg.id ? null : seg.id))}
                  onSelect={(seg) => push({ name: 'categoryDetail', segment: seg, kind })}
                  onCenter={() => push({ name: 'entries' })}
                />
              ) : (
                <Donut
                  segments={s.bd.segments}
                  total={s.bd.total}
                  count={s.totals.count}
                  diff={s.totals.diff}
                  zeitraum={imZeitraum(period.kind, s.range)}
                  kind={kind}
                  picked={null}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Keine schwebende Karte - eine Haarlinie und der Betrag. Die
          Gesamtbalance ist die Summe der Konten, also fuehrt sie auch dorthin;
          die Buchungen liegen hinter der Ringmitte. */}
      <div className="k-balance-row">
        {/* Betraege verbergen, z. B. in der Bahn: ein kleines Auge hinter dem
            Wort, leise wie die Beschriftung selbst. Gilt fuer alle Ansichten,
            bleibt gespeichert. */}
        <div className="k-balance-head">
          <span className="k-label">Gesamtbalance</span>
          <button
            type="button"
            className="k-eye"
            aria-pressed={diskret.an}
            aria-label={diskret.an ? 'Beträge zeigen' : 'Beträge verbergen'}
            onClick={() => setDiskret(!diskret.an)}
          >
            {diskret.an ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        <button type="button" className="k-balance" onClick={() => push({ name: 'accounts' })}>
          <span className={`k-balance-num${balance < 0 ? ' neg' : ''}`}>
            <Money cent={balance} /> <span className="k-cur">€</span>
          </span>
          <span className="k-balance-side">
            {offen} {offen === 1 ? 'Konto' : 'Konten'}
            <span className="k-balance-chev"><IconRight /></span>
          </span>
        </button>
      </div>

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
