import { useState } from 'react'
import { Wochen } from '../charts'
import { IconRight } from '../icons'
import {
  alsCsv,
  formatDauer,
  formatSatz,
  formatTausend,
  haeufigste,
  letzteRekorde,
  serie,
  wochenWerte,
  type WochenArt,
} from '../trainingCalc'
import { REKORD_TEXT, Segment, Seite, Zurueck, zumLauncher } from '../ui'
import { dateKey, relativTag } from '../util'
import type { FormCtx } from '../types'

const ARTEN: { id: WochenArt; label: string }[] = [
  { id: 'anzahl', label: 'Trainings' },
  { id: 'volumen', label: 'Volumen' },
  { id: 'dauer', label: 'Dauer' },
]

// Wie eine Wochenzahl dasteht: '3', '12.450 kg', '2:10 h'.
const zeige = (art: WochenArt, v: number) =>
  art === 'anzahl' ? v.toFixed(v % 1 ? 1 : 0).replace('.', ',') : art === 'volumen' ? `${formatTausend(v)} kg` : formatDauer(v * 60000)

// Tab "Statistik": oben die letzten 12 Wochen als Balken - Trainings,
// Volumen oder Dauer -, dazu "Diese Woche" und der Schnitt der Wochen davor;
// bei den Trainings mit dem Wochenziel. Darunter Trainings insgesamt, die
// Serie (Wochen in Folge mit Training) und die Dauer, die juengsten Rekorde
// und die haeufigsten Uebungen - ein Tipp oeffnet die Uebung. Ganz unten der
// Export als CSV.
function Statistik({ ctx }: { ctx: FormCtx }) {
  const { trainings, uebungById, heute, push, melde, einstellungen } = ctx
  const [art, setArt] = useState<WochenArt>('anzahl')
  const w = wochenWerte(trainings, heute, art, uebungById)
  const schnitt = w.slice(0, -1).reduce((n, x) => n + x.wert, 0) / (w.length - 1)
  const ziel = art === 'anzahl' ? einstellungen.wochenziel : null
  const inFolge = serie(trainings, heute)
  const diesesJahr = trainings.filter((t) => dateKey(new Date(t.start)).startsWith(heute.slice(0, 4))).length
  const dauer = trainings.reduce((n, t) => n + ((t.ende ?? t.start) - t.start), 0)
  const rekorde = letzteRekorde(trainings, uebungById)
  const oft = haeufigste(trainings).filter((x) => uebungById[x.uebung])

  // Teilen-Blatt, wo es geht (iPhone: "In Dateien sichern"), sonst Download.
  // Mit BOM, damit Excel die Umlaute erkennt.
  const exportieren = async () => {
    const datei = new File([`﻿${alsCsv(trainings, uebungById)}`], `form-training-${heute}.csv`, { type: 'text/csv' })
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

  return (
    <Seite links={<Zurueck label="Apps" onClick={zumLauncher} />}>
      <header className="f-kopf tab">
        <h1 className="f-marke">Statistik</h1>
      </header>

      {!trainings.length ? (
        <p className="f-leer-t f-leer-klein">Noch kein Training.</p>
      ) : (
        <>
          <section className="f-karte-flach">
            <Segment label="Pro Woche" optionen={ARTEN} wert={art} onWahl={setArt} />
            <div className="f-wochen-kopf">
              <span>
                Diese Woche <b>{zeige(art, w[w.length - 1].wert)}</b>
                {ziel !== null ? <em> von {ziel}</em> : null}
              </span>
              <span>
                Schnitt <b>{zeige(art, art === 'anzahl' ? Math.round(schnitt * 10) / 10 : Math.round(schnitt))}</b>
              </span>
            </div>
            <Wochen wochen={w} ziel={ziel} label={`${ARTEN.find((a) => a.id === art)!.label} pro Woche`} />
          </section>

          <div className="f-kacheln">
            <div className="f-kachel">
              <small>Trainings</small>
              <em className="f-diff gleich">{trainings.length}</em>
              <span>
                {diesesJahr} in {heute.slice(0, 4)}
              </span>
            </div>
            <div className="f-kachel">
              <small>Serie</small>
              <em className={`f-diff ${inFolge > 1 ? 'gut' : 'gleich'}`}>
                {inFolge} {inFolge === 1 ? 'Woche' : 'Wochen'}
              </em>
              <span>in Folge</span>
            </div>
            <div className="f-kachel">
              <small>Dauer</small>
              <em className="f-diff gleich">{formatDauer(dauer / trainings.length)}</em>
              <span>im Schnitt</span>
            </div>
          </div>

          {rekorde.length ? (
            <>
              <h2 className="f-h2">Letzte Rekorde</h2>
              <div className="f-gruppe">
                {rekorde.map(({ training, rekord }) => {
                  const u = uebungById[rekord.uebung]
                  if (!u) return null
                  return (
                    <button
                      key={`${training.id}:${rekord.ui}:${rekord.si}`}
                      type="button"
                      className="f-rek f-rek-knopf"
                      onClick={() => push({ name: 'uebung', id: u.id })}
                    >
                      <span>
                        <b>{u.name}</b>
                        <small>
                          {REKORD_TEXT[rekord.art]} · {relativTag(dateKey(new Date(training.start)), heute)}
                        </small>
                      </span>
                      <em>{formatSatz(rekord.satz, u.erfassung)}</em>
                    </button>
                  )
                })}
              </div>
            </>
          ) : null}

          {oft.length ? (
            <>
              <h2 className="f-h2">Am häufigsten</h2>
              <div className="f-gruppe">
                {oft.map(({ uebung, anzahl }) => (
                  <button key={uebung} type="button" className="f-zeile" onClick={() => push({ name: 'uebung', id: uebung })}>
                    <span>{uebungById[uebung].name}</span>
                    <span className="f-zeile-r">
                      <b>{anzahl}×</b>
                      <IconRight />
                    </span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <button type="button" className="f-loeschen neutral" onClick={() => void exportieren()}>
            Als CSV exportieren
          </button>
        </>
      )}
    </Seite>
  )
}

export default Statistik
