import { useState } from 'react'
import { IconPlus, IconRight, IconSuche } from '../icons'
import { alphabetisch } from '../trainingStore'
import { Seite, Zurueck } from '../ui'
import type { FormCtx, Uebung } from '../types'

// Alle Uebungen alphabetisch, mit Suche. Archivierte ganz unten.
function Uebungen({ ctx }: { ctx: FormCtx }) {
  const { uebungen, push, back } = ctx
  const [suche, setSuche] = useState('')
  const [archivOffen, setArchivOffen] = useState(false)

  const klein = suche.trim().toLocaleLowerCase('de')
  const passt = (u: Uebung) => !klein || u.name.toLocaleLowerCase('de').includes(klein)
  const aktiv = uebungen.filter((u) => !u.archiviert && passt(u)).sort(alphabetisch)
  const archiv = uebungen.filter((u) => u.archiviert && passt(u)).sort(alphabetisch)

  const zeile = (u: Uebung) => (
    <button key={u.id} type="button" className="f-zeile" onClick={() => push({ name: 'uebung', id: u.id })}>
      <span>{u.name}</span>
      <span className="f-zeile-r">
        <IconRight />
      </span>
    </button>
  )

  return (
    <Seite
      links={<Zurueck label="Training" onClick={back} />}
      titel="Übungen"
      rechts={
        <button type="button" className="f-rund" onClick={() => push({ name: 'uebungForm' })} aria-label="Neue Übung">
          <IconPlus />
        </button>
      }
    >
      {uebungen.length ? (
        <label className="f-suche">
          <IconSuche />
          <input type="search" value={suche} placeholder="Suchen" autoComplete="off" onChange={(e) => setSuche(e.target.value)} />
        </label>
      ) : (
        <p className="f-leer-t f-leer-klein">Noch keine Übung.</p>
      )}

      {aktiv.length ? <div className="f-gruppe">{aktiv.map(zeile)}</div> : null}

      {archiv.length ? (
        <>
          <button type="button" className="f-h2-zeile f-h2-knopf" onClick={() => setArchivOffen((o) => !o)} aria-expanded={archivOffen}>
            <span className="f-h2">Archiviert</span>
            <span className="f-textlink">{archivOffen ? 'Ausblenden' : archiv.length}</span>
          </button>
          {archivOffen ? <div className="f-gruppe">{archiv.map(zeile)}</div> : null}
        </>
      ) : null}
    </Seite>
  )
}

export default Uebungen
