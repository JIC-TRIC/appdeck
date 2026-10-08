import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { isArchived, isDueWeekly, isRestToday, ruleAt, statesBetween } from '../calc'
import { IconRight } from '../icons'
import { DayBox, Dot, Screen, Segmented, TextButton, hue, ruleShort } from '../ui'
import { MAX_NAME, PALETTE, UNIT_SUGGESTIONS, colorOf } from '../data'
import { entwurfLesen, entwurfLoeschen, entwurfSchreiben } from '../entwurf'
import { addHabit, archiveHabit, buildHabit, hasEntries, nextHabit, restoreHabit, updateHabit, type HabitInput } from '../store'
import { addDays, formatDate, formatValue, isoWeek, mondayOf, parseKey, parseNumber, relativeDay, weekdayIndex, WEEKDAYS_SHORT } from '../util'
import type { GoalDir, HabitKind, ViewProps } from '../types'

interface FormData {
  name: string
  color: string
  kind: HabitKind
  unit: string
  weekly: boolean
  n: number // x-mal pro Woche, 1-6 - bleibt stehen, wenn man kurz auf "Täglich" tippt
  target: string
  dir: GoalDir
  start: string
}

const rhythmText = (perWeek: number) => (perWeek < 7 ? `${perWeek}× pro Woche` : 'täglich')

function HabitForm({ ctx, view }: ViewProps) {
  const { habits, byId, log, today, back, refresh, notify } = ctx
  const editing = view.habitId ? byId[view.habitId] : undefined
  const key = `habitForm:${view.habitId ?? 'neu'}`
  const locked = !!editing && hasEntries(editing.id)

  // Stand der Gewohnheit, wie er heute gilt - Grundlage fuer das Formular und
  // fuer die Frage, ob sich Rhythmus oder Ziel geaendert haben.
  const current = useMemo(() => {
    if (!editing) return null
    return {
      perWeek: ruleAt(editing.rhythm, addDays(mondayOf(today), 6))?.perWeek ?? 7,
      goal: ruleAt(editing.goal, today),
    }
  }, [editing, today])

  const [f, setF] = useState<FormData>(() => {
    const draft = entwurfLesen<FormData>(key)
    if (draft) return draft
    if (editing && current) {
      return {
        name: editing.name,
        color: editing.color,
        kind: editing.kind,
        unit: editing.unit,
        weekly: current.perWeek < 7,
        n: current.perWeek < 7 ? current.perWeek : 3,
        target: current.goal ? formatValue(current.goal.target) : '',
        dir: current.goal?.dir ?? 'min',
        start: editing.start,
      }
    }
    // Vorgewaehlt: die erste Farbe, die noch keine aktive Gewohnheit traegt.
    const used = new Set(habits.filter((h) => !isArchived(h)).map((h) => h.color))
    return {
      name: '',
      color: (PALETTE.find((p) => !used.has(p.id)) ?? PALETTE[0]).id,
      kind: 'check',
      unit: '',
      weekly: false,
      n: 3,
      target: '',
      dir: 'min',
      start: today,
    }
  })
  const [tried, setTried] = useState(false)

  useEffect(() => {
    entwurfSchreiben(key, f)
  }, [key, f])

  const set = (patch: Partial<FormData>) => setF((cur) => ({ ...cur, ...patch }))

  const perWeek = f.weekly ? f.n : 7
  const target = parseNumber(f.target)
  const input: HabitInput = {
    name: f.name,
    color: f.color,
    kind: locked && editing ? editing.kind : f.kind,
    unit: f.unit,
    perWeek,
    target: target ?? 0,
    dir: f.dir,
    start: f.start,
  }

  // Pruefen. Fehler erscheinen erst nach dem ersten "Sichern".
  const name = f.name.trim()
  const errName = !name
    ? 'Ohne Namen geht es nicht.'
    : habits.some((h) => h.id !== editing?.id && !isArchived(h) && h.name.trim().toLowerCase() === name.toLowerCase())
      ? 'Diese Gewohnheit gibt es schon.'
      : null
  const errTarget =
    input.kind !== 'amount'
      ? null
      : target === null
        ? 'Bitte ein Ziel eintragen.'
        : f.dir === 'min' && target <= 0
          ? 'Das Ziel muss größer als 0 sein.'
          : target < 0
            ? 'Das Ziel darf nicht negativ sein.'
            : null
  const valid = !errName && !errTarget

  const save = () => {
    setTried(true)
    if (!valid) return
    if (editing) updateHabit(editing.id, input, today)
    else addHabit(input)
    entwurfLoeschen(key)
    refresh()
    back()
  }

  const cancel = () => {
    entwurfLoeschen(key)
    back()
  }

  const archive = () => {
    if (!editing) return
    archiveHabit(editing.id, today)
    entwurfLoeschen(key)
    refresh()
    back()
    notify(`Archiviert: ${editing.name}`, () => restoreHabit(editing.id, today, false))
  }

  // Vorschau: die Rasterzeile, wie sie nach dem Sichern aussieht.
  const preview = useMemo(() => {
    const built = editing ? nextHabit(editing, input, today, locked) : buildHabit(input, 'vorschau', 0)
    // Noch kein Ziel getippt: dann auch keins anzeigen (sonst stuende "≥ 0" da).
    const h = built.kind === 'amount' && target === null ? { ...built, goal: [] } : built
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
    const st = statesBetween(h, log[h.id], days[0], today, today)
    return { h, days, states: days.map((d) => st[d]), due: isDueWeekly(h, log, today), frei: isRestToday(h, log, today) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(input), editing, locked, log, today])

  const rhythmChanged = !!current && locked && current.perWeek !== perWeek
  const goalChanged =
    !!current && locked && input.kind === 'amount' && (!current.goal || current.goal.target !== target || current.goal.dir !== f.dir)

  return (
    <Screen
      title={editing ? 'Bearbeiten' : 'Neue Gewohnheit'}
      left={<TextButton onClick={cancel}>Abbrechen</TextButton>}
      right={
        <TextButton strong onClick={save} disabled={!name}>
          Sichern
        </TextButton>
      }
      className="s-form"
    >
      <div className="s-form-body" style={hue(f.color)}>
        <input
          className="s-inp"
          value={f.name}
          maxLength={MAX_NAME}
          placeholder="Name"
          autoFocus={!editing}
          enterKeyHint="done"
          aria-label="Name"
          onChange={(e) => set({ name: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
          }}
        />
        {tried && errName ? <p className="s-err">{errName}</p> : null}

        <div className="s-label">Farbe</div>
        <div className="s-swatches" role="radiogroup" aria-label="Farbe">
          {PALETTE.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={f.color === p.id}
              aria-label={p.name}
              className={f.color === p.id ? 'on' : ''}
              style={{ '--c': p.hex } as CSSProperties}
              onClick={() => set({ color: p.id })}
            />
          ))}
        </div>

        <div className="s-label">Messart</div>
        <Segmented
          options={[
            { id: 'check', label: 'Abhaken' },
            { id: 'amount', label: 'Menge' },
          ]}
          value={input.kind}
          onChange={(kind) => set({ kind })}
          disabled={locked}
        />
        {locked ? <p className="s-hint">Nach dem ersten Eintrag fest. Für eine andere Messart archivieren und neu anlegen.</p> : null}

        {input.kind === 'amount' ? (
          <>
            <div className="s-label">Ziel</div>
            <Segmented
              options={[
                { id: 'min', label: 'mindestens' },
                { id: 'max', label: 'höchstens' },
              ]}
              value={f.dir}
              onChange={(dir) => set({ dir })}
            />
            <div className="s-row2">
              <input
                className="s-box"
                value={f.target}
                inputMode="decimal"
                placeholder="Zahl"
                aria-label="Zielwert"
                onChange={(e) => set({ target: e.target.value })}
              />
              <input
                className="s-box"
                value={f.unit}
                maxLength={12}
                placeholder="Einheit"
                aria-label="Einheit"
                onChange={(e) => set({ unit: e.target.value })}
              />
            </div>
            <div className="s-chips">
              {UNIT_SUGGESTIONS.map((u) => (
                <button key={u} type="button" className={f.unit === u ? 'on' : ''} onClick={() => set({ unit: u })}>
                  {u}
                </button>
              ))}
            </div>
            {tried && errTarget ? <p className="s-err">{errTarget}</p> : null}
          </>
        ) : null}

        <div className="s-label">Rhythmus</div>
        <Segmented
          options={[
            { id: 'daily', label: 'Täglich' },
            { id: 'weekly', label: 'Pro Woche' },
          ]}
          value={f.weekly ? 'weekly' : 'daily'}
          onChange={(v) => set({ weekly: v === 'weekly' })}
        />
        {f.weekly ? (
          <>
            <div className="s-stepper">
              <button type="button" onClick={() => set({ n: Math.max(1, f.n - 1) })} disabled={f.n <= 1} aria-label="Weniger">
                −
              </button>
              <b>{f.n}× pro Woche</b>
              <button type="button" onClick={() => set({ n: Math.min(6, f.n + 1) })} disabled={f.n >= 6} aria-label="Mehr">
                +
              </button>
            </div>
            <p className="s-hint">
              {7 - f.n} {7 - f.n === 1 ? 'Ruhetag' : 'Ruhetage'} pro Woche. Sie halten eine laufende Serie, solange sie
              reichen. Ohne Serie zählt ein freier Tag als verpasst.
            </p>
          </>
        ) : null}
        {rhythmChanged && current ? (
          <p className="s-hint box">
            Gilt ab dieser Woche (KW {isoWeek(today)}). Frühere Wochen bleiben bei {rhythmText(current.perWeek)}.
          </p>
        ) : null}
        {goalChanged ? <p className="s-hint box">Das neue Ziel gilt ab heute. Frühere Tage behalten ihr Ziel.</p> : null}

        <div className="s-label">Beginnt</div>
        <label className="s-list s-date">
          <span className="s-li">
            {f.start === today || f.start === addDays(today, -1) ? `${relativeDay(f.start, today)}, ${formatDate(f.start).replace(/ \d{4}$/, '')}` : formatDate(f.start)}
            <span className="v">
              <IconRight />
            </span>
          </span>
          <input
            type="date"
            value={f.start}
            max={today}
            aria-label="Beginn"
            // Am Rechner oeffnet ein Klick ins unsichtbare Feld sonst nichts.
            onClick={(e) => {
              try {
                e.currentTarget.showPicker()
              } catch {
                // iOS oeffnet den Kalender ohnehin selbst
              }
            }}
            onChange={(e) => {
              if (e.target.value) set({ start: e.target.value > today ? today : e.target.value })
            }}
          />
        </label>
        {f.start < today ? <p className="s-hint">Ab diesem Tag lässt sich nachtragen.</p> : null}

        <div className="s-label">Vorschau</div>
        <div className="s-card s-preview">
          <div className="s-row s-head">
            <span />
            {preview.days.map((d, i) => (
              <span key={d} className={`s-hd${i === 6 ? ' last' : ''}${weekdayIndex(d) === 0 ? ' mon' : ''}`}>
                <span className="wd">{i === 6 ? 'Heute' : WEEKDAYS_SHORT[weekdayIndex(d)]}</span>
                <span className="dn">{parseKey(d).getDate()}</span>
              </span>
            ))}
            <span />
          </div>
          <div className="s-row" style={hue(f.color)}>
            <span className="s-nm">
              <b style={{ color: colorOf(f.color) }}>{name || 'Name'}</b>
              {ruleShort(preview.h, today) ? <small>{ruleShort(preview.h, today)}</small> : null}
            </span>
            {preview.days.slice(0, 6).map((d, i) => (
              <span key={d} className={`s-cell${weekdayIndex(d) === 0 ? ' mon' : ''}`}>
                <Dot state={preview.states[i]} eintrag={log[preview.h.id]?.[d]} menge={preview.h.kind === 'amount'} />
              </span>
            ))}
            <span className={`s-wide${weekdayIndex(today) === 0 ? ' mon' : ''}`}>
              <DayBox habit={preview.h} state={preview.states[6]} value={log[preview.h.id]?.[today]} day={today} due={preview.due} frei={preview.frei} />
            </span>
            <span className="s-strk" />
          </div>
        </div>

        {editing ? (
          <>
            <button type="button" className="s-btn block" onClick={archive}>
              Archivieren
            </button>
            <p className="s-hint center">Verschwindet aus dem Raster, die Historie bleibt. Löschen geht nur im Archiv.</p>
          </>
        ) : null}
      </div>
    </Screen>
  )
}

export default HabitForm
