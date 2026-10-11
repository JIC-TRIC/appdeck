import { useEffect, useState } from 'react'
import { IconRight, IconX } from '../icons'
import { piep } from '../geraet'
import { formatStoppuhr, formatTausend, pauseStand, statistik, type PausenKorrektur } from '../trainingCalc'
import { PAUSE_MAX, PAUSE_STANDARD } from '../trainingStore'
import { Blatt } from '../ui'
import type { Training, Uebung } from '../types'

// Die Pause eines laufenden Trainings: oben im Training und in der Leiste
// ueber den Tabs, wenn man woanders ist. Sie wird nie gezaehlt, sondern aus dem
// letzten Haken berechnet (trainingCalc.ts, pauseStand) - darum stimmt sie
// auch, wenn die App zwischendurch zu war. Von Hand geaendert (+-15 s,
// Ueberspringen) gilt nur fuer die Pause nach diesem einen Haken.

/**
 * Jetzt, viermal pro Sekunde neu - so springen Kopf, Blatt und Leiste
 * gemeinsam auf die naechste Sekunde - und sofort, wenn die App wieder
 * sichtbar wird.
 */
function useJetzt() {
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setJetzt(Date.now())
    const id = window.setInterval(tick, 250)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return jetzt
}

/** Restzeit aufgerundet - "0:00" erst, wenn sie wirklich um ist. */
const rest = (sek: number) => formatStoppuhr(Math.ceil(sek))

interface PauseProps {
  t: Training
  uebungById: Record<string, Uebung>
  korrektur: PausenKorrektur | null
}

// Oben im laufenden Training: vor dem ersten Haken die Trainingsdauer, dann
// die Pause als Countdown (der Strich fuellt sich), danach orange "Los" und
// wie lange die Pause schon drueber ist. Ein Tipp oeffnet das Pausen-Blatt.
export function PauseAnzeige({ t, uebungById, korrektur, onClick }: PauseProps & { onClick: () => void }) {
  const jetzt = useJetzt()
  const p = pauseStand(t, uebungById, jetzt, PAUSE_STANDARD, korrektur)

  if (!p) {
    return (
      <div className="f-pz still" role="timer">
        <span className="f-pz-z">
          <small>Training</small>
          <b>{formatStoppuhr((jetzt - t.start) / 1000)}</b>
        </span>
        <i />
      </div>
    )
  }
  return (
    <button
      type="button"
      className={`f-pz${p.um ? ' um' : ''}`}
      role="timer"
      onClick={onClick}
      aria-label={p.um ? 'Pause um – Pause ändern' : `Pause, noch ${rest(p.rest)} – Pause ändern`}
    >
      <span className="f-pz-z">
        <small>{p.um ? 'Los' : 'Pause'}</small>
        <b>{p.um ? `+${formatStoppuhr(p.sek - p.marke)}` : rest(p.rest)}</b>
      </span>
      <i>
        <u style={{ width: `${Math.min(100, (p.sek / p.marke) * 100)}%` }} />
      </i>
    </button>
  )
}

// Die Pause gross, mit -15 s, Ueberspringen und +15 s (wie Strong und Hevy).
// Das aendert nur diese eine Pause; die Pause der Uebung steht in ihrem Blatt.
export function PauseBlatt({
  t,
  uebungById,
  korrektur,
  onKorrektur,
  onClose,
}: PauseProps & { onKorrektur: (k: PausenKorrektur) => void; onClose: () => void }) {
  const jetzt = useJetzt()
  const p = pauseStand(t, uebungById, jetzt, PAUSE_STANDARD, korrektur)
  const u = p ? uebungById[p.uebung] : undefined

  return (
    <Blatt label="Pause" onClose={onClose}>
      {(schliessen) =>
        p ? (
          <>
            <div className="f-sheet-kopf">
              <div>
                <b>Pause</b>
                <small>
                  nach {u?.name ?? 'der Übung'} · {formatStoppuhr(p.marke)}
                </small>
              </div>
              <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
                <IconX />
              </button>
            </div>
            <div className={`f-pause-gross${p.um ? ' um' : ''}`} role="timer">
              <small>{p.um ? 'Los geht’s' : 'noch'}</small>
              <b>{p.um ? `+${formatStoppuhr(p.sek - p.marke)}` : rest(p.rest)}</b>
              <i>
                <u style={{ width: `${Math.min(100, (p.sek / p.marke) * 100)}%` }} />
              </i>
            </div>
            <div className="f-pause-knoepfe">
              <button
                type="button"
                className="f-knopf"
                onClick={() => onKorrektur({ haken: p.haken, sek: Math.max(0, p.marke - 15) })}
                disabled={p.um}
              >
                −15 s
              </button>
              <button
                type="button"
                className="f-knopf stark"
                onClick={() => {
                  onKorrektur({ haken: p.haken, sek: Math.floor(p.sek) })
                  schliessen()
                }}
                disabled={p.um}
              >
                Überspringen
              </button>
              <button
                type="button"
                className="f-knopf"
                onClick={() => onKorrektur({ haken: p.haken, sek: Math.min(PAUSE_MAX * 2, Math.max(p.marke, Math.ceil(p.sek)) + 15) })}
              >
                +15 s
              </button>
            </div>
          </>
        ) : null
      }
    </Blatt>
  )
}

// Unter der Kopfleiste des laufenden Trainings: Dauer, Volumen und Saetze -
// das Volumen waechst mit jedem Haken. Der Strich zeigt, wie viel geschafft ist.
export function LiveZahlen({ t, uebungById }: { t: Training; uebungById: Record<string, Uebung> }) {
  const jetzt = useJetzt()
  const st = statistik(t, uebungById, jetzt)
  let alle = 0
  let arbeit = 0
  let fertig = 0
  for (const tu of t.uebungen) {
    for (const s of tu.saetze) {
      alle += 1
      if (s.fertig !== null) fertig += 1
      if (!s.aufwaermen) arbeit += 1
    }
  }
  return (
    <div className="f-live">
      <div className="f-live-zahlen">
        <span>
          <small>Dauer</small>
          <b>{formatStoppuhr(st.dauer / 1000)}</b>
        </span>
        <span>
          <small>Volumen</small>
          <b>
            {formatTausend(st.volumen)}
            <em> kg</em>
          </b>
        </span>
        <span>
          <small>Sätze</small>
          <b>
            {st.saetze}
            <em>/{arbeit}</em>
          </b>
        </span>
      </div>
      <i className="f-live-strich" aria-hidden="true">
        <u style={{ width: `${alle ? (fertig / alle) * 100 : 0}%` }} />
      </i>
    </div>
  )
}

// Ueber der Tab-Leiste, solange ein Training laeuft und man nicht auf ihm
// steht: Name, Dauer und Saetze, rechts die Pause. Ein Tipp fuehrt zurueck.
export function LaufLeiste({ t, uebungById, korrektur, onClick }: PauseProps & { onClick: () => void }) {
  const jetzt = useJetzt()
  const p = pauseStand(t, uebungById, jetzt, PAUSE_STANDARD, korrektur)
  const st = statistik(t, uebungById, jetzt)
  const alle = t.uebungen.reduce((n, tu) => n + tu.saetze.filter((s) => !s.aufwaermen).length, 0)

  return (
    <button type="button" className="f-lauf" onClick={onClick} aria-label={`${t.name} läuft – zurück zum Training`}>
      <span className="f-lauf-punkt" aria-hidden="true" />
      <span className="f-lauf-text">
        <b>{t.name}</b>
        <small>
          {formatStoppuhr(st.dauer / 1000)} · {st.saetze}/{alle} Sätze
        </small>
      </span>
      {p ? (
        <span className={`f-lauf-pause${p.um ? ' um' : ''}`}>
          <small>{p.um ? 'Los' : 'Pause'}</small>
          <b>{p.um ? `+${formatStoppuhr(p.sek - p.marke)}` : rest(p.rest)}</b>
        </span>
      ) : null}
      <IconRight />
    </button>
  )
}

/**
 * Ton am Ende der Pause - genau beim Uebergang, egal auf welchem Tab man
 * steht. Nicht, wenn iOS den Timer erst nach dem Zurueckkommen nachholt (dann
 * ist die Pause laengst um, der Ton kaeme zu spaet).
 */
export function usePausenTon(
  t: Training | null,
  uebungById: Record<string, Uebung>,
  korrektur: PausenKorrektur | null,
  ton: boolean,
) {
  const p = t ? pauseStand(t, uebungById, Date.now(), PAUSE_STANDARD, korrektur) : null
  const ende = ton && p && !p.um ? p.ende : null
  useEffect(() => {
    if (ende === null) return
    const id = window.setTimeout(() => {
      if (document.visibilityState === 'visible' && Date.now() - ende < 1500) piep()
    }, ende - Date.now())
    return () => window.clearTimeout(id)
  }, [ende])
}
