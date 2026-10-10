import { erledigt, formatDauer, formatSatz, formatTausend, formatUhr, rekordeIn, statistik } from '../trainingCalc'
import { Seite, TextKnopf, Zurueck } from '../ui'
import { dateKey, relativTag } from '../util'
import type { FormCtx } from '../types'

// Ein beendetes Training: alle Saetze kompakt, Rekorde orange. Ein Tipp auf
// eine Uebung oeffnet sie, "Bearbeiten" dieselbe Ansicht wie im Training.
function EinTraining({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { trainings, uebungById, heute, push, back } = ctx
  const t = trainings.find((x) => x.id === id)
  // Gerade geloescht: die Seite gleitet noch hinaus.
  if (!t) return <Seite links={<Zurueck label="Verlauf" onClick={back} />}>{null}</Seite>

  const st = statistik(t, uebungById)
  const pr = new Set(rekordeIn(t, trainings, uebungById).map((r) => `${r.ui}:${r.si}`))

  return (
    <Seite
      links={<Zurueck label="Verlauf" onClick={back} />}
      rechts={<TextKnopf onClick={() => push({ name: 'bearbeiten', id })}>Bearbeiten</TextKnopf>}
    >
      <header className="f-kopf">
        <p className="f-kicker">
          {relativTag(dateKey(new Date(t.start)), heute)} · {formatUhr(t.start)} – {formatUhr(t.ende ?? t.start)}
        </p>
        <h1 className="f-h1">{t.name}</h1>
      </header>
      <p className="f-statzeile">
        {formatDauer(st.dauer)} · {st.saetze} {st.saetze === 1 ? 'Satz' : 'Sätze'}
        {st.volumen > 0 ? ` · ${formatTausend(st.volumen)} kg` : ''}
      </p>

      {t.uebungen.map((tu, ui) => {
        const u = uebungById[tu.uebung]
        if (!u) return null
        return (
          <button key={`${ui}:${tu.uebung}`} type="button" className="f-ex-blatt" onClick={() => push({ name: 'uebung', id: u.id })}>
            <span className="f-ex-name">{u.name}</span>
            <span className="f-sc-reihe">
              {tu.saetze.map((s, si) =>
                erledigt(s) ? (
                  <span key={si} className={`f-sc${pr.has(`${ui}:${si}`) ? ' pr' : ''}`}>
                    {formatSatz(s, u.erfassung)}
                  </span>
                ) : null,
              )}
            </span>
          </button>
        )
      })}
    </Seite>
  )
}

export default EinTraining
