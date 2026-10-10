import { useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
import { hakenAm, isArchived, isRestToday, messwert, statesBetween, streaks, todayToEnter } from '../calc'
import { IconGrid, IconMore, IconPlus, IconRight, IconStats } from '../icons'
import { DayBox, Dot, Streak, hue, ruleShort } from '../ui'
import {
  WEEKDAYS_SHORT,
  addDays,
  formatDayLong,
  formatDayMedium,
  formatDayShort,
  formatValue,
  parseKey,
  rangeLabel,
  weekdayIndex,
} from '../util'
import { NICHT_GESCHAFFT, type DayState, type Habit, type SteadyCtx } from '../types'

// Wie lange ein Fenster zum Einrasten gleitet (passt zu .s-track.gleitet).
const GLEITEN_MS = 300
// Ab wann ein Wisch umblaettert: gut ein Fuenftel der Breite - oder ein
// kurzer, schneller Schubs (wie Kontors Ring).
const SCHWELLE_ANTEIL = 0.22
const SCHWUNG_PX_MS = 0.45
const SCHWUNG_MIN_PX = 24

const SAGT: Record<DayState, string> = {
  done: 'erledigt',
  rest: 'Ruhetag',
  miss: 'nichts eingetragen',
  open: 'offen',
  off: 'noch nicht begonnen',
  future: '',
}

// Fuer den Screenreader: was in der Zelle steht, nicht nur der Zustand.
function sagt(h: Habit, state: DayState, eintrag: number | undefined, frei = false) {
  // Am vergangenen Ruhetag zaehlt "nicht geschafft" nicht - dort steht nur der Ring.
  if (eintrag === NICHT_GESCHAFFT && state !== 'rest') return frei ? 'frei, nicht geschafft' : 'nicht geschafft'
  const wert = messwert(eintrag)
  if (h.kind === 'amount' && wert !== undefined) {
    const zusatz = state === 'done' ? ', Ziel erreicht' : state === 'rest' ? ', Ruhetag' : ''
    return `${formatValue(wert)} ${h.unit}`.trim() + zusatz
  }
  if (frei && state === 'open') return 'frei, sonst Ruhetag'
  return SAGT[state]
}

// Wie weit zurueckgeblaettert war, bleibt fuer die Sitzung stehen: wer aus
// dem Detail zurueckkommt, will dieselbe Woche sehen.
let merkOffset = 0

function Main({ ctx }: { ctx: SteadyCtx }) {
  const { habits, log, today, push, enter, lastChange, onExit } = ctx
  const active = useMemo(() => habits.filter((h) => !isArchived(h)), [habits])

  // Fenster: offset 0 = die letzten 7 Tage bis heute, 1 = die 7 davor, …
  const [offset, setOffsetState] = useState(merkOffset)
  const setOffset = (next: number | ((o: number) => number)) =>
    setOffsetState((o) => {
      const n = typeof next === 'function' ? next(o) : next
      merkOffset = n
      return n
    })

  const serien = useMemo(
    () => Object.fromEntries(active.map((h) => [h.id, streaks(h, log[h.id], today).current])),
    [active, log, today],
  )

  const count = useMemo(() => todayToEnter(active, log, today), [active, log, today])

  // Karussell wie in Kontor: das aeltere Fenster liegt links bereit, das
  // neuere rechts (nur, wenn man zurueckgeblaettert hat). Beim Wischen zieht
  // man es ins Bild, statt dass eins verschwindet und das naechste auftaucht.
  const pages = useMemo(() => {
    const versaetze = offset > 0 ? [-1, 0, 1] : [-1, 0]
    return versaetze.map((v) => {
      const o = offset - v
      const end = addDays(today, -7 * o)
      const days = Array.from({ length: 7 }, (_, i) => addDays(end, i - 6))
      const rows = active.map((h) => {
        const st = statesBetween(h, log[h.id], days[0], end, today)
        return {
          h,
          states: days.map((d) => st[d]),
          eintraege: days.map((d) => log[h.id]?.[d]),
          value: log[h.id]?.[end],
          // Heute noch ein Ruhetag frei: der Kasten traegt schon den Ring.
          frei: end === today && isRestToday(h, log, today),
        }
      })
      return { versatz: v, offset: o, days, end, rows }
    })
  }, [offset, active, log, today])

  const [richtung, setRichtung] = useState(0)
  const [zug, setZug] = useState(0)
  const [fahrt, setFahrt] = useState(0)
  const [gleitet, setGleitet] = useState(false)
  const hold = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  // Nach einem Wisch darf kein Tipp auf einer Zelle landen.
  const wischte = useRef(0)

  const ruhig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // dir = 1: neuer (Richtung heute), -1: aelter.
  const blaettern = (dir: number) => {
    if (fahrt || (dir > 0 && offset === 0)) return
    setRichtung(dir)
    const umstellen = () => {
      setOffset((o) => o - dir)
      setGleitet(false)
      setFahrt(0)
      setZug(0)
    }
    if (ruhig()) {
      umstellen()
      return
    }
    setGleitet(true)
    setZug(0)
    setFahrt(dir)
    timer.current = window.setTimeout(umstellen, GLEITEN_MS)
  }

  const zuHeute = () => {
    if (!offset || fahrt) return
    if (offset === 1) {
      blaettern(1)
      return
    }
    setRichtung(1)
    setOffset(0)
  }

  const touch = useRef<{ x: number; y: number; quer: boolean; lastX: number; lastT: number; v: number } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    if (fahrt) return
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
      // Senkrecht gemeint - das gehoert dem Scrollen der Liste.
      touch.current = null
      return
    }
    t.quer = true
    wischte.current = Date.now()
    const now = performance.now()
    t.v = 0.7 * ((x - t.lastX) / Math.max(1, now - t.lastT)) + 0.3 * t.v
    t.lastX = x
    t.lastT = now
    setGleitet(false)
    // Heute ist das Ende: nach links gibt es nichts Neueres, das Raster gibt
    // nur ein Stueck nach und federt zurueck.
    setZug(dx < 0 && offset === 0 ? dx * 0.25 : dx)
  }

  const onTouchEnd = (e: TouchEvent) => {
    const t = touch.current
    touch.current = null
    if (!t || !t.quer) return
    wischte.current = Date.now()
    const dx = e.changedTouches[0].clientX - t.x
    const tempo = performance.now() - t.lastT < 100 ? t.v : 0
    const breite = hold.current?.clientWidth ?? 390
    const weit = Math.abs(dx) > breite * SCHWELLE_ANTEIL
    const schnell = Math.abs(tempo) > SCHWUNG_PX_MS && Math.abs(dx) > SCHWUNG_MIN_PX
    if ((weit || schnell) && (dx > 0 || offset > 0)) {
      blaettern(dx > 0 ? -1 : 1)
    } else {
      setGleitet(true)
      setZug(0)
    }
  }

  const tap = (h: Habit, day: string, state: DayState) => {
    if (Date.now() - wischte.current < 400) return
    if (state === 'off' || state === 'future') return
    if (h.kind === 'amount') {
      push({ name: 'amount', sheet: true, habitId: h.id, day })
      return
    }
    // Leer -> geschafft -> nicht geschafft -> leer; vergangene Ruhetage nur
    // geschafft <-> leer.
    enter(h, day, hakenAm(h, log[h.id], day, today))
  }

  const openDetail = (h: Habit) => {
    if (Date.now() - wischte.current < 400) return
    push({ name: 'detail', habitId: h.id })
  }

  // Die Kopfzeile springt schon beim Loslassen auf das neue Fenster.
  const kopfOffset = offset - fahrt
  const kopfEnd = addDays(today, -7 * kopfOffset)
  const title = kopfOffset === 0 ? formatDayLong(today) : rangeLabel(addDays(kopfEnd, -6), kopfEnd)
  const sub = !count.total ? 'Heute nichts einzutragen' : !count.open ? 'Alles eingetragen' : `Noch ${count.open} einzutragen`
  const spur = `translateX(calc(${-100 - fahrt * 100}% + ${zug}px))`

  return (
    <div className="s-main">
      <header className="s-hdr">
        {/* Alle Apps mit einem Tipp, wie in Stash - frueher nur ueber das Menue. */}
        <div className="s-hdr-l">
          <button type="button" className="s-ib" onClick={onExit} aria-label="Alle Apps">
            <IconGrid />
          </button>
          <button type="button" className="s-ib" onClick={() => push({ name: 'stats' })} aria-label="Statistik">
            <IconStats />
          </button>
        </div>
        <button
          type="button"
          className="s-ttl"
          key={`t-${kopfOffset}`}
          data-dir={richtung}
          onClick={zuHeute}
          aria-label={kopfOffset ? 'Zurück zu heute' : undefined}
        >
          {kopfOffset ? (
            <b>{title}</b>
          ) : (
            <b>
              <span className="lang">{title}</span>
              <span className="kurz">{formatDayMedium(today)}</span>
            </b>
          )}
          {kopfOffset ? (
            <span className="s-pill">
              Heute <IconRight />
            </span>
          ) : (
            <small>{sub}</small>
          )}
        </button>
        <div className="s-hdr-r">
          <button type="button" className="s-ib" onClick={() => push({ name: 'habitForm' })} aria-label="Neue Gewohnheit">
            <IconPlus />
          </button>
          <button type="button" className="s-ib" onClick={() => push({ name: 'menu', sheet: true })} aria-label="Menü">
            <IconMore />
          </button>
        </div>
      </header>

      {active.length ? (
        <div
          className="s-grid-scroll"
          ref={hold}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
        >
          <div className={`s-track${gleitet ? ' gleitet' : ''}`} style={{ transform: spur }}>
            {pages.map((p) => {
              const live = p.versatz === 0
              return (
                <div className={`s-page${live ? '' : ' ghost'}`} key={p.versatz} aria-hidden={!live || undefined}>
                  <div className="s-row s-head">
                    <span />
                    {p.days.map((d, i) => {
                      const mon = weekdayIndex(d) === 0 ? ' mon' : ''
                      const last = i === 6
                      return (
                        <span key={d} className={`s-hd${last ? ' last' : ''}${mon}`}>
                          <span className="wd">{last && p.offset === 0 ? 'Heute' : WEEKDAYS_SHORT[weekdayIndex(d)]}</span>
                          <span className="dn">{parseKey(d).getDate()}</span>
                        </span>
                      )
                    })}
                  </div>
                  {p.rows.map((r) => {
                    const rule = ruleShort(r.h, p.end)
                    const serie = serien[r.h.id] ?? 0
                    const pop = (d: string) => live && lastChange?.habitId === r.h.id && lastChange.day === d
                    return (
                      <div className="s-row" style={hue(r.h)} key={r.h.id}>
                        {/* Die Serie steht neben dem Namen, nicht in einer eigenen
                            Spalte - so bleibt fuer Raster und Regel mehr Platz. */}
                        <button type="button" className="s-nm" onClick={() => openDetail(r.h)} tabIndex={live ? 0 : -1}>
                          <span className="l1">
                            <b>{r.h.name}</b>
                            <Streak n={serie} tick={live && lastChange?.habitId === r.h.id} />
                          </span>
                          {rule ? <small>{rule}</small> : null}
                        </button>
                        {p.days.slice(0, 6).map((d, i) => (
                          <button
                            key={d}
                            type="button"
                            className={`s-cell${weekdayIndex(d) === 0 ? ' mon' : ''}`}
                            disabled={r.states[i] === 'off'}
                            tabIndex={live ? 0 : -1}
                            onClick={() => tap(r.h, d, r.states[i])}
                            aria-label={`${r.h.name}, ${formatDayShort(d)}: ${sagt(r.h, r.states[i], r.eintraege[i])}`}
                          >
                            <Dot
                              state={r.states[i]}
                              eintrag={r.eintraege[i]}
                              menge={r.h.kind === 'amount'}
                              pop={pop(d)}
                              key={pop(d) ? `p${lastChange?.n}` : 'd'}
                            />
                          </button>
                        ))}
                        <button
                          type="button"
                          className={`s-wide${weekdayIndex(p.end) === 0 ? ' mon' : ''}`}
                          disabled={r.states[6] === 'off'}
                          tabIndex={live ? 0 : -1}
                          onClick={() => tap(r.h, p.end, r.states[6])}
                          aria-label={`${r.h.name}, ${formatDayShort(p.end)}: ${sagt(r.h, r.states[6], r.value, r.frei)}`}
                        >
                          <DayBox
                            habit={r.h}
                            state={r.states[6]}
                            value={r.value}
                            day={p.end}
                            frei={r.frei}
                            pop={pop(p.end)}
                            key={pop(p.end) ? `p${lastChange?.n}` : 'd'}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="s-empty">
          <p>Keine aktiven Gewohnheiten.</p>
          <button type="button" className="s-btn pri" onClick={() => push({ name: 'habitForm' })}>
            Neue Gewohnheit
          </button>
        </div>
      )}
    </div>
  )
}

export default Main
