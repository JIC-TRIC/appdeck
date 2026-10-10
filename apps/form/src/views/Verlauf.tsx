import { Wochen } from '../charts'
import { IconPlus, IconRight } from '../icons'
import { alleRekorde, alsCsv, formatDauer, wochen } from '../trainingCalc'
import { Seite, Zurueck } from '../ui'
import { dateKey, relativTag } from '../util'
import type { FormCtx, Training } from '../types'

const MONATE = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

// Oben die Trainings pro Woche (12 Wochen), darunter alle Trainings, neueste
// oben, eine Zeile pro Training, nach Monaten. "PR": In diesem Training gab es
// einen Rekord. "+" traegt eins nach, ganz unten der Export als CSV.
function Verlauf({ ctx }: { ctx: FormCtx }) {
  const { trainings, uebungById, heute, push, back, melde } = ctx
  const rekorde = alleRekorde(trainings, uebungById)
  const w = wochen(trainings, heute)
  const schnitt = w.slice(0, -1).reduce((n, x) => n + x.anzahl, 0) / (w.length - 1)

  // Teilen-Blatt, wo es geht (iPhone: "In Dateien sichern"), sonst Download.
  // Mit BOM, damit Excel die Umlaute erkennt.
  const exportieren = async () => {
    const datei = new File([`\uFEFF${alsCsv(trainings, uebungById)}`], `form-training-${heute}.csv`, { type: 'text/csv' })
    try {
      if (navigator.canShare?.({ files: [datei] })) {
        await navigator.share({ files: [datei], title: 'Form – Training' })
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    const url = URL.createObjectURL(datei)
    const a = document.createElement('a')
    a.href = url
    a.download = datei.name
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 2000)
    melde('Export gesichert')
  }

  const monate: { key: string; titel: string; liste: Training[] }[] = []
  for (let i = trainings.length - 1; i >= 0; i -= 1) {
    const t = trainings[i]
    const tag = dateKey(new Date(t.start))
    const key = tag.slice(0, 7)
    let m = monate[monate.length - 1]
    if (!m || m.key !== key) {
      const jahr = key.slice(0, 4) === heute.slice(0, 4) ? '' : ` ${key.slice(0, 4)}`
      m = { key, titel: `${MONATE[Number(key.slice(5, 7)) - 1]}${jahr}`, liste: [] }
      monate.push(m)
    }
    m.liste.push(t)
  }

  return (
    <Seite
      links={<Zurueck label="Training" onClick={back} />}
      titel="Verlauf"
      rechts={
        <button type="button" className="f-rund" onClick={() => push({ name: 'nachtragen' })} aria-label="Training nachtragen">
          <IconPlus />
        </button>
      }
    >
      {!trainings.length ? <p className="f-leer-t f-leer-klein">Noch kein Training.</p> : null}
      {trainings.length ? (
        <section className="f-karte-flach">
          <div className="f-wochen-kopf">
            <span>
              Diese Woche <b>{w[w.length - 1].anzahl}</b>
            </span>
            <span>
              Schnitt <b>{schnitt.toFixed(1).replace('.', ',')}</b> pro Woche
            </span>
          </div>
          <Wochen wochen={w} />
        </section>
      ) : null}
      {monate.map((m) => (
        <section key={m.key} className="f-abschnitt">
          <h2 className="f-h2">{m.titel}</h2>
          <div className="f-gruppe">
            {m.liste.map((t) => (
              <button key={t.id} type="button" className="f-tr" onClick={() => push({ name: 'training', id: t.id })}>
                <span className="f-tr-tag">{relativTag(dateKey(new Date(t.start)), heute)}</span>
                <b>{t.name}</b>
                <span className="f-tr-r">
                  {rekorde.get(t.id)?.length ? <span className="f-tag-pr">PR</span> : null}
                  {formatDauer((t.ende ?? t.start) - t.start)}
                  <IconRight />
                </span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {trainings.length ? (
        <button type="button" className="f-loeschen neutral" onClick={() => void exportieren()}>
          Als CSV exportieren
        </button>
      ) : null}
    </Seite>
  )
}

export default Verlauf
