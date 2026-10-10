import { useState } from 'react'
import { IconPlus, IconRight, IconSuche } from '../icons'
import { alphabetisch } from '../trainingStore'
import { Seite, Umschalter, Zurueck, zumLauncher } from '../ui'
import type { FormCtx, Uebung } from '../types'

// Tab "Uebungen": alle Uebungen alphabetisch, mit Suche. Archivierte ganz unten.
function Uebungen({ ctx }: { ctx: FormCtx }) {
  const { uebungen, push, bereich, setzeBereich } = ctx
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
      links={<Zurueck label="Apps" onClick={zumLauncher} />}
      titel={<Umschalter wert={bereich} onWahl={setzeBereich} />}
      rechts={
        <button type="button" className="f-rund" onClick={() => push({ name: 'uebungForm' })} aria-label="Neue Übung">
          <IconPlus />
        </button>
      }
    >
      <header className="f-kopf tab">
        <h1 className="f-marke">Übungen</h1>
      </header>

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
