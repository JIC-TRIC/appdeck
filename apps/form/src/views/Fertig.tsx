import { useState, type CSSProperties } from 'react'
import { IconPokal, IconTeilen } from '../icons'
import {
  abweichung,
  dieseWoche,
  formatDauer,
  formatSatz,
  formatTausend,
  meilensteine,
  nummerVon,
  rekordeIn,
  soSchwerWie,
  statistik,
  voriges,
  vorlageAus,
  zumTeilen,
} from '../trainingCalc'
import { speichereVorlage } from '../trainingStore'
import { REKORD_TEXT, Seite } from '../ui'
import { useAlsVorlage } from './alsVorlage'
import { WocheKarte } from './Woche'
import type { FormCtx } from '../types'

// Nach "Beenden" - der Moment zum Feiern: das wievielte Training, Dauer,
// Volumen (verglichen mit dem letzten Mal derselben Vorlage) und Saetze, die
// Woche mit Ziel und Serie, Meilensteine, die Rekorde. Dazu etwas Konfetti.
// Weicht das Training von seiner Vorlage ab, die Frage, ob sie mitgehen soll;
// ein leeres Training laesst sich hier als Vorlage speichern. "Teilen"
// schickt es als Text weiter.
function Fertig({ ctx, id }: { ctx: FormCtx; id: string }) {
  const { trainings, vorlagen, uebungById, heute, einstellungen, refresh, back, melde } = ctx
  const [erledigt, setErledigt] = useState(false)
  const alsVorlage = useAlsVorlage(ctx)
  const t = trainings.find((x) => x.id === id)
  if (!t) return <Seite>{null}</Seite>

  const st = statistik(t, uebungById)
  const davor = voriges(trainings, t)
  const volDavor = davor ? statistik(davor, uebungById).volumen : 0
  const prozent = volDavor > 0 && st.volumen > 0 ? Math.round(((st.volumen - volDavor) / volDavor) * 100) : null
  const rekorde = rekordeIn(t, trainings, uebungById)
  const steine = meilensteine(trainings, t, uebungById)
  const schwer = soSchwerWie(st.volumen)
  const vorlage = t.vorlage ? vorlagen.find((v) => v.id === t.vorlage) : undefined
  const abw = vorlage ? abweichung(t, vorlage) : null
  const ziel = einstellungen.wochenziel
  const dieseZahl = dieseWoche(trainings, heute).reduce((n, d) => n + d.anzahl, 0)
  // Erst mit diesem Training erreicht - dann wird es gesagt.
  const zielJetzt = ziel !== null && dieseZahl === ziel
  const namen = (ids: string[]) => {
    const n = ids.map((x) => uebungById[x]?.name ?? 'Übung')
    return n.length > 1 ? `${n.slice(0, -1).join(', ')} und ${n[n.length - 1]}` : n[0]
  }

  let warum = ''
  if (abw) {
    const teile: string[] = []
    if (abw.fehlt.length) teile.push(`${namen(abw.fehlt)} ${abw.fehlt.length > 1 ? 'fehlten' : 'fehlte'}`)
    if (abw.neu.length) teile.push(`${namen(abw.neu)} ${abw.neu.length > 1 ? 'kamen' : 'kam'} dazu`)
    warum = teile.length ? `${teile.join(', ')}.` : 'Andere Sätze oder Reihenfolge.'
  }

  const anpassen = () => {
    if (!vorlage) return
    speichereVorlage({ name: vorlage.name, uebungen: vorlageAus(t, vorlage.uebungen) }, vorlage.id)
    refresh()
    setErledigt(true)
    melde(`${vorlage.name} angepasst`)
  }

  // Teilen-Blatt, wo es geht (iPhone: Nachrichten, WhatsApp ...), sonst in die Zwischenablage.
  const teilen = async () => {
    const text = zumTeilen(t, uebungById, rekorde, heute)
    try {
      if (navigator.share) {
        await navigator.share({ title: t.name, text })
        return
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
    try {
      await navigator.clipboard.writeText(text)
      melde('In die Zwischenablage kopiert')
    } catch {
      melde('Teilen geht hier nicht')
    }
  }

  return (
    <Seite
      unten={
        <div className="f-fertig-unten">
          <button type="button" className="f-knopf f-teilen" onClick={() => void teilen()} aria-label="Training teilen">
            <IconTeilen />
          </button>
          <button type="button" className="f-haupt" onClick={back}>
            Fertig
          </button>
        </div>
      }
    >
      <Konfetti viel={rekorde.length > 0 || steine.length > 0 || zielJetzt} />
      <header className="f-kopf">
        <p className="f-kicker">{nummerVon(trainings, t)}. Training · geschafft</p>
        <h1 className="f-h1">{t.name}</h1>
      </header>

      <div className="f-kacheln f-kacheln-drei">
        <div className="f-kachel">
          <small>Dauer</small>
          <em className="f-diff gleich">{formatDauer(st.dauer)}</em>
        </div>
        <div className="f-kachel">
          <small>Volumen</small>
          <em className="f-diff gleich">{st.volumen > 0 ? `${formatTausend(st.volumen)} kg` : '–'}</em>
          {prozent !== null ? (
            <span className={prozent > 0 ? 'f-gut' : ''}>
              {prozent > 0 ? `+${prozent}` : prozent === 0 ? '±0' : `−${-prozent}`} % zum letzten Mal
            </span>
          ) : null}
        </div>
        <div className="f-kachel">
          <small>Sätze</small>
          <em className="f-diff gleich">{st.saetze}</em>
          {rekorde.length ? (
            <span className="f-gut">
              {rekorde.length} {rekorde.length === 1 ? 'Rekord' : 'Rekorde'}
            </span>
          ) : null}
        </div>
      </div>
      {schwer ? <p className="f-note f-schwer">Heute bewegt: mehr als {schwer}.</p> : null}

      {steine.length || zielJetzt ? (
        <div className="f-gruppe">
          {zielJetzt ? (
            <div className="f-stein">
              <IconPokal />
              <span>
                <b>Wochenziel erreicht</b>
                <small>
                  {ziel} {ziel === 1 ? 'Training' : 'Trainings'} diese Woche
                </small>
              </span>
            </div>
          ) : null}
          {steine.map((x) => (
            <div key={x} className="f-stein">
              <IconPokal />
              <span>
                <b>{x}</b>
                <small>Meilenstein</small>
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <WocheKarte ctx={ctx} />

      {rekorde.length ? (
        <>
          <h2 className="f-h2">Rekorde</h2>
          <div className="f-gruppe">
            {rekorde.map((r) => {
              const u = uebungById[r.uebung]
              return (
                <div key={`${r.ui}:${r.si}`} className="f-rek">
                  <div>
                    <b>{u?.name ?? 'Übung'}</b>
                    <small>{REKORD_TEXT[r.art]}</small>
                  </div>
                  <em>{formatSatz(r.satz, u?.erfassung ?? 'gewicht')}</em>
                </div>
              )
            })}
          </div>
        </>
      ) : null}

      {!erledigt && (abw || !vorlage) ? (
        <>
          <h2 className="f-h2">Vorlage</h2>
          <div className="f-karte-flach">
            {vorlage ? (
              <>
                <p className="f-frage">
                  {vorlage.name} anpassen?
                  <small>{warum}</small>
                </p>
                <div className="f-zwei">
                  <button type="button" className="f-knopf" onClick={() => setErledigt(true)}>
                    So lassen
                  </button>
                  <button type="button" className="f-knopf stark" onClick={anpassen}>
                    Anpassen
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="f-frage">
                  Beim nächsten Mal genauso?
                  <small>Als Vorlage startet es mit diesen Übungen und Sätzen.</small>
                </p>
                <button type="button" className="f-knopf stark" onClick={() => alsVorlage(t, () => setErledigt(true))}>
                  Als Vorlage speichern
                </button>
              </>
            )}
          </div>
        </>
      ) : null}
    </Seite>
  )
}

// Konfetti in Kreide und Orange, einmal von oben - mehr bei Rekord,
// Meilenstein oder erreichtem Wochenziel. Faellt durch, ohne Tipps
// abzufangen; bei "Bewegung reduzieren" bleibt es aus (Form.css).
function Konfetti({ viel }: { viel: boolean }) {
  const [teile] = useState(() =>
    Array.from({ length: viel ? 44 : 22 }, (_, i) => ({
      x: Math.round(Math.random() * 100),
      verzug: Math.round(Math.random() * 500),
      dauer: 1500 + Math.round(Math.random() * 1100),
      dreh: Math.round(Math.random() * 720 - 360),
      drift: Math.round(Math.random() * 60 - 30),
      art: i % 3,
    })),
  )
  return (
    <div className="f-konfetti" aria-hidden="true">
      {teile.map((k, i) => (
        <i
          key={i}
          className={`k${k.art}`}
          style={
            {
              left: `${k.x}%`,
              animationDelay: `${k.verzug}ms`,
              animationDuration: `${k.dauer}ms`,
              '--dreh': `${k.dreh}deg`,
              '--drift': `${k.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

export default Fertig
