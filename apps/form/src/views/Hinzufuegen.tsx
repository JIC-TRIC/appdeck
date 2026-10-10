import { useState } from 'react'
import { IconCheck, IconPlus, IconRight, IconSuche } from '../icons'
import { NAME_MAX, sauber } from '../store'
import { PAUSE_STANDARD, alphabetisch, speichereUebung } from '../trainingStore'
import { TextKnopf, Vollbild } from '../ui'
import type { FormCtx, Uebung } from '../types'

// Uebungen auswaehlen - fuers Training und fuer Vorlagen. Mehrere auf einmal,
// beim Tauschen genau eine (ein Tipp genuegt). Oben die zuletzt trainierten,
// die noch nicht dabei sind. Findet die Suche nichts, legt ein Tipp die Uebung
// an (Gewicht x Wdh, der Rest spaeter unter Uebungen).
export function Hinzufuegen({
  ctx,
  mehrfach,
  ohne,
  onWahl,
  onClose,
}: {
  ctx: FormCtx
  mehrfach: boolean
  /** Schon dabei - taucht nicht auf. */
  ohne: string[]
  onWahl: (ids: string[]) => void
  onClose: () => void
}) {
  const { uebungen, uebungById, trainings, refresh } = ctx
  const [suche, setSuche] = useState('')
  const [gewaehlt, setGewaehlt] = useState<string[]>([])

  const aktiv = uebungen.filter((u) => !u.archiviert && !ohne.includes(u.id)).sort(alphabetisch)
  const zuletzt: Uebung[] = []
  for (let i = trainings.length - 1; i >= 0 && zuletzt.length < 5; i -= 1) {
    for (const tu of trainings[i].uebungen) {
      const u = uebungById[tu.uebung]
      if (u && !u.archiviert && !ohne.includes(u.id) && !zuletzt.includes(u) && zuletzt.length < 5) zuletzt.push(u)
    }
  }

  const name = sauber(suche, NAME_MAX)
  const klein = name.toLocaleLowerCase('de')
  const treffer = klein ? aktiv.filter((u) => u.name.toLocaleLowerCase('de').includes(klein)) : aktiv
  const gibtEs = uebungen.some((u) => !u.archiviert && u.name.toLocaleLowerCase('de') === klein)

  const waehle = (id: string, schliessen: () => void) => {
    if (!mehrfach) {
      onWahl([id])
      schliessen()
      return
    }
    setGewaehlt((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]))
  }

  const anlegen = (schliessen: () => void) => {
    const u = speichereUebung({ name, erfassung: 'gewicht', pause: PAUSE_STANDARD, notiz: '' })
    if (!u) return
    refresh()
    setSuche('')
    if (mehrfach) setGewaehlt((g) => [...g, u.id])
    else {
      onWahl([u.id])
      schliessen()
    }
  }

  const zeile = (u: Uebung, schliessen: () => void) => {
    const an = gewaehlt.includes(u.id)
    return (
      <button key={u.id} type="button" className="f-zeile f-wahlzeile" onClick={() => waehle(u.id, schliessen)} aria-pressed={mehrfach ? an : undefined}>
        <span>{u.name}</span>
        {mehrfach ? (
          <span className={`f-haken${an ? ' an' : ''}`}>{an ? <IconCheck /> : null}</span>
        ) : (
          <span className="f-zeile-r">
            <IconRight />
          </span>
        )}
      </button>
    )
  }

  return (
    <Vollbild label="Übung hinzufügen" onClose={onClose}>
      {(schliessen) => (
        <>
          <header className="f-bar">
            <div className="f-bar-l">
              <TextKnopf onClick={schliessen}>Abbrechen</TextKnopf>
            </div>
            <div className="f-bar-mid">{mehrfach ? 'Übungen' : 'Tauschen gegen'}</div>
            <div className="f-bar-r">
              {mehrfach ? (
                <TextKnopf
                  stark
                  disabled={!gewaehlt.length}
                  onClick={() => {
                    onWahl(gewaehlt)
                    schliessen()
                  }}
                >
                  {gewaehlt.length > 1 ? `${gewaehlt.length} hinzufügen` : 'Hinzufügen'}
                </TextKnopf>
              ) : null}
            </div>
          </header>
          <div className="f-voll-body">
            <label className="f-suche">
              <IconSuche />
              <input
                type="search"
                value={suche}
                placeholder={aktiv.length ? 'Suchen' : 'Name der Übung'}
                autoComplete="off"
                enterKeyHint="done"
                onChange={(e) => setSuche(e.target.value)}
              />
            </label>

            {name ? (
              <div className="f-gruppe">
                {!gibtEs ? (
                  <button type="button" className="f-zeile f-anlegen" onClick={() => anlegen(schliessen)}>
                    <span>„{name}“ anlegen</span>
                    <span className="f-zeile-r">
                      <IconPlus />
                    </span>
                  </button>
                ) : null}
                {treffer.map((u) => zeile(u, schliessen))}
              </div>
            ) : (
              <>
                {zuletzt.length ? (
                  <>
                    <h2 className="f-h2">Zuletzt</h2>
                    <div className="f-gruppe">{zuletzt.map((u) => zeile(u, schliessen))}</div>
                  </>
                ) : null}
                {aktiv.length ? (
                  <>
                    <h2 className="f-h2">Alle</h2>
                    <div className="f-gruppe">{aktiv.map((u) => zeile(u, schliessen))}</div>
                  </>
                ) : null}
              </>
            )}
          </div>
        </>
      )}
    </Vollbild>
  )
}
