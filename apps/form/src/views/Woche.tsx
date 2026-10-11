import { IconX } from '../icons'
import { dieseWoche, serie } from '../trainingCalc'
import { setzeEinstellungen } from '../trainingStore'
import { Blatt } from '../ui'
import type { FormCtx } from '../types'

const KURZ = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Die laufende Woche auf einen Blick: Montag bis Sonntag, Trainingstage in
// Kreide, dazu wie viele es sind - mit Wochenziel "2/3", erreicht in Orange -
// und die Serie (Wochen in Folge mit Training). Auf der Startseite oeffnet
// ein Tipp das Wochenziel.
export function WocheKarte({ ctx, onClick }: { ctx: FormCtx; onClick?: () => void }) {
  const { trainings, heute, einstellungen } = ctx
  const ziel = einstellungen.wochenziel
  const tage = dieseWoche(trainings, heute)
  const n = tage.reduce((x, d) => x + d.anzahl, 0)
  const inFolge = serie(trainings, heute)
  const geschafft = ziel !== null && n >= ziel

  const inhalt = (
    <>
      <span className="f-woche-kopf">
        <span>Diese Woche</span>
        {inFolge > 1 ? <span className="f-woche-serie">{inFolge} Wochen in Folge</span> : null}
      </span>
      <span className="f-woche-mitte">
        <span className="f-woche-tage">
          {tage.map((d, i) => (
            <span
              key={d.tag}
              className={`f-woche-tag${d.anzahl ? ' an' : ''}${d.tag === heute ? ' heute' : ''}${d.tag > heute ? ' bald' : ''}`}
            >
              <small>{KURZ[i]}</small>
              <i />
            </span>
          ))}
        </span>
        <span className="f-woche-stand">
          <b>
            {n}
            {ziel !== null ? <em>/{ziel}</em> : null}
          </b>
          <small>{geschafft ? 'Ziel erreicht' : ziel !== null ? 'Ziel' : onClick ? 'Ziel setzen' : n === 1 ? 'Training' : 'Trainings'}</small>
        </span>
      </span>
    </>
  )

  return onClick ? (
    <button type="button" className={`f-woche${geschafft ? ' geschafft' : ''}`} onClick={onClick} aria-label={`Diese Woche ${n} Trainings – Wochenziel ändern`}>
      {inhalt}
    </button>
  ) : (
    <div className={`f-woche${geschafft ? ' geschafft' : ''}`}>{inhalt}</div>
  )
}

/** Wochenziel: aus oder 1 bis 7 Trainings pro Woche. */
export function ZielBlatt({ ctx, onClose }: { ctx: FormCtx; onClose: () => void }) {
  const { einstellungen, refresh } = ctx
  const waehle = (wochenziel: number | null, schliessen: () => void) => {
    setzeEinstellungen({ ...einstellungen, wochenziel })
    refresh()
    schliessen()
  }
  return (
    <Blatt label="Wochenziel" onClose={onClose}>
      {(schliessen) => (
        <>
          <div className="f-sheet-kopf">
            <div>
              <b>Wochenziel</b>
              <small>Wie oft willst du pro Woche trainieren?</small>
            </div>
            <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
              <IconX />
            </button>
          </div>
          <div className="f-chips f-ziel-chips" role="radiogroup" aria-label="Trainings pro Woche">
            {[null, 1, 2, 3, 4, 5, 6, 7].map((z) => (
              <button
                key={z ?? 'aus'}
                type="button"
                role="radio"
                aria-checked={einstellungen.wochenziel === z}
                className={`f-chip${einstellungen.wochenziel === z ? ' an' : ''}`}
                onClick={() => waehle(z, schliessen)}
              >
                {z ?? 'Aus'}
              </button>
            ))}
          </div>
        </>
      )}
    </Blatt>
  )
}
