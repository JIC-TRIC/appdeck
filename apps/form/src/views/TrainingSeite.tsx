import { useEffect, useMemo, useRef, useState } from 'react'
import { IonReorder, IonReorderGroup, useIonAlert } from '@ionic/react'
import { IconCheck, IconGriff, IconMehr, IconPlus, IconRight, IconUp, IconX } from '../icons'
import {
  abschliessen,
  besser,
  effektiv,
  erledigt,
  formatBereich,
  formatSatz,
  formatStoppuhr,
  formatUhr,
  kurzSaetze,
  letzterHaken,
  nurNoetige,
  offeneSaetze,
  platzhalter,
  rekordeIn,
  vollstaendig,
  vorgabe,
  type Zahlen,
} from '../trainingCalc'
import {
  PAUSE_MAX,
  PAUSE_MIN,
  PAUSE_STANDARD,
  SAETZE_MAX,
  getLaufend,
  leererSatz,
  loescheTraining,
  setzeLaufend,
  setzeUebung,
  speichereTraining,
} from '../trainingStore'
import { Blatt, Seite, Stepper, TextKnopf } from '../ui'
import { dateKey, formatZahl, relativTag } from '../util'
import { Hinzufuegen } from './Hinzufuegen'
import { FELDNAME, Tastenfeld, type Feld } from './Tastenfeld'
import type { Erfassung, FormCtx, Satz, Training, TrainingsUebung, Uebung, VorlagenUebung } from '../types'

// Ein Training. Laufend ist es die Startseite (kein Umschalter, kein Zurueck)
// und jeder Tipp wird sofort gesichert. Als Entwurf aendert es ein beendetes
// oder macht ein nachgetragenes fertig - erst "Sichern" schreibt.
//
// Grau steht in jedem Feld das letzte Mal aus derselben Vorlage, sonst das
// letzte Mal ueberhaupt (trainingCalc.ts, vorgabe). Der Haken uebernimmt es.
// Oben die Pause: jetzt minus Uhrzeit des letzten Hakens - nichts zaehlt im
// Hintergrund, darum stimmt sie auch, wenn die App zwischendurch zu war.

const NEIN = { kg: false, wdh: false, sek: false }

const zeige = (f: Feld, v: number) => (f === 'kg' ? formatZahl(v) : f === 'sek' ? `${v} s` : String(v))

function TrainingSeite({ ctx, entwurf, neu }: { ctx: FormCtx; entwurf?: Training; neu?: boolean }) {
  const { laufend, trainings, uebungById, vorlagen, heute, refresh, melde, push, back, toRoot } = ctx
  const istLaufend = !entwurf
  const [lokal, setLokal] = useState<Training | null>(entwurf ?? null)
  const t = istLaufend ? laufend : lokal

  // Fertige Uebungen sind zugeklappt - ausser denen, die man aufgemacht hat.
  const [offen, setOffen] = useState<ReadonlySet<number>>(() => new Set())
  const [eingabe, setEingabe] = useState<{ ui: number; si: number; feld: Feld } | null>(null)
  const [blatt, setBlatt] = useState<number | null>(null)
  const [menue, setMenue] = useState(false)
  const [hinzu, setHinzu] = useState<{ tauschen?: number } | null>(null)
  const [ordnen, setOrdnen] = useState(false)
  // Was nach dem Schliessen eines Blatts kommt - zwei Blaetter gleichzeitig
  // vertraegt Ionic schlecht.
  const danach = useRef<(() => void) | null>(null)
  const nachDemBlatt = () => {
    const f = danach.current
    danach.current = null
    f?.()
  }
  const [frage] = useIonAlert()

  const vorgaben = useMemo(
    () => (t ? t.uebungen.map((tu) => vorgabe(trainings, tu.uebung, t.vorlage, t.start, t.id)) : []),
    [t, trainings],
  )
  const rekorde = useMemo(() => {
    const r = new Set<string>()
    if (t) for (const x of rekordeIn(t, trainings, uebungById)) r.add(`${x.ui}:${x.si}`)
    return r
  }, [t, trainings, uebungById])

  // Gerade beendet oder verworfen - die Seite gleitet noch hinaus.
  if (!t) return <Seite>{null}</Seite>

  const vorlage = t.vorlage ? vorlagen.find((v) => v.id === t.vorlage) : undefined
  const erfVon = (tu: TrainingsUebung): Erfassung => uebungById[tu.uebung]?.erfassung ?? 'gewicht'

  // Laufend frisch aus dem Speicher - zwei schnelle Tipps vor dem naechsten
  // Zeichnen sollen sich nicht gegenseitig ueberschreiben.
  const aendere = (fn: (x: Training) => Training) => {
    if (istLaufend) {
      const aktuell = getLaufend()
      if (!aktuell) return
      setzeLaufend(fn(aktuell))
      refresh()
    } else setLokal((x) => (x ? fn(x) : x))
  }

  const aendereUebung = (ui: number, fn: (tu: TrainingsUebung) => TrainingsUebung) =>
    aendere((x) => ({ ...x, uebungen: x.uebungen.map((tu, i) => (i === ui ? fn(tu) : tu)) }))

  const setzeSatz = (ui: number, si: number, fn: (s: Satz) => Satz) =>
    aendereUebung(ui, (tu) => ({ ...tu, saetze: tu.saetze.map((s, j) => (j === si ? fn(s) : s)) }))

  const hakenZeit = () => (istLaufend ? Date.now() : (t.ende ?? Date.now()))

  const haken = (ui: number, si: number) => {
    const tu = t.uebungen[ui]
    const s = tu.saetze[si]
    const erf = erfVon(tu)
    if (erledigt(s)) {
      setzeSatz(ui, si, (x) => ({ ...x, fertig: null }))
      return
    }
    const z = effektiv(vorgaben[ui]?.saetze ?? null, tu.saetze, si)
    if (!z || !vollstaendig(z, erf)) {
      const feld: Feld = erf === 'gewicht' ? (z?.kg == null ? 'kg' : 'wdh') : erf === 'wdh' ? 'wdh' : 'sek'
      setEingabe({ ui, si, feld })
      return
    }
    setzeSatz(ui, si, () => ({ ...nurNoetige(z, erf), fertig: hakenZeit() }))
  }

  const plusSatz = (ui: number) =>
    aendereUebung(ui, (tu) => (tu.saetze.length >= SAETZE_MAX ? tu : { ...tu, saetze: [...tu.saetze, leererSatz()] }))

  const satzZahl = (uebung: string) => vorgabe(trainings, uebung, t.vorlage, t.start, t.id)?.saetze.length ?? 3

  const fuegeHinzu = (ids: string[]) =>
    aendere((x) => ({
      ...x,
      uebungen: [...x.uebungen, ...ids.map((id) => ({ uebung: id, saetze: Array.from({ length: satzZahl(id) }, leererSatz) }))],
    }))

  const tausche = (ui: number, id: string) => {
    aendereUebung(ui, (tu) => ({ uebung: id, saetze: tu.saetze.map(() => leererSatz()) }))
    setOffen(new Set())
  }

  const nimmRaus = (ui: number) => {
    const weg = () => {
      aendere((x) => ({ ...x, uebungen: x.uebungen.filter((_, i) => i !== ui) }))
      setOffen(new Set())
    }
    const n = t.uebungen[ui]?.saetze.filter(erledigt).length ?? 0
    if (!n) return weg()
    frage({
      header: `${uebungById[t.uebungen[ui].uebung]?.name ?? 'Übung'} herausnehmen?`,
      message: `${n === 1 ? 'Ein abgehakter Satz geht' : `${n} abgehakte Sätze gehen`} mit.`,
      cssClass: 'f-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Herausnehmen', role: 'destructive', handler: weg },
      ],
    })
  }

  // ---------- Beenden, Sichern, Verwerfen ----------

  const verwerfen = () => {
    setzeLaufend(null)
    refresh()
    melde('Training verworfen')
  }

  const abschluss = (offene: 'verwerfen' | 'abhaken') => {
    const aktuell = istLaufend ? getLaufend() : t
    if (!aktuell) return
    const fertig = abschliessen(aktuell, istLaufend ? Date.now() : (aktuell.ende ?? Date.now()), offene, uebungById, trainings)
    if (!fertig.uebungen.length) {
      melde('Kein Satz abgehakt')
      return
    }
    speichereTraining(fertig)
    if (istLaufend) {
      setzeLaufend(null)
      refresh()
      push({ name: 'fertig', id: fertig.id })
    } else {
      refresh()
      back()
      melde(neu ? 'Training nachgetragen' : 'Gespeichert')
    }
  }

  const fertigMachen = () => {
    const abgehakt = t.uebungen.reduce((n, tu) => n + tu.saetze.filter(erledigt).length, 0)
    const offen = offeneSaetze(t)
    if (istLaufend && !abgehakt) {
      frage({
        header: 'Noch kein Satz abgehakt',
        message: 'Training verwerfen?',
        cssClass: 'f-alert',
        buttons: [
          { text: 'Weiter trainieren', role: 'cancel' },
          { text: 'Verwerfen', role: 'destructive', handler: verwerfen },
        ],
      })
      return
    }
    if (offen) {
      frage({
        header: `${offen} ${offen === 1 ? 'Satz' : 'Sätze'} ohne Haken`,
        message: 'Abhaken nimmt, was grau dasteht.',
        cssClass: 'f-alert',
        buttons: [
          { text: 'Verwerfen', handler: () => abschluss('verwerfen') },
          { text: 'Abhaken', handler: () => abschluss('abhaken') },
          { text: istLaufend ? 'Weiter trainieren' : 'Abbrechen', role: 'cancel' },
        ],
      })
      return
    }
    abschluss('verwerfen')
  }

  const loeschen = () =>
    frage({
      header: 'Training löschen?',
      message: 'Das lässt sich nicht rückgängig machen.',
      cssClass: 'f-alert',
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        {
          text: 'Löschen',
          role: 'destructive',
          handler: () => {
            loescheTraining(t.id)
            refresh()
            toRoot()
            melde('Training gelöscht')
          },
        },
      ],
    })

  // ---------- Seite ----------

  // Stabile Schluessel, auch wenn eine Uebung zweimal drin ist.
  const gezaehlt: Record<string, number> = {}
  const schluessel = t.uebungen.map((tu) => {
    gezaehlt[tu.uebung] = (gezaehlt[tu.uebung] ?? 0) + 1
    return `${tu.uebung}:${gezaehlt[tu.uebung]}`
  })

  const tag = dateKey(new Date(t.start))

  return (
    <>
      <Seite
        links={
          istLaufend ? (
            <button type="button" className="f-rund" onClick={() => setMenue(true)} aria-label="Menü">
              <IconMehr />
            </button>
          ) : (
            <TextKnopf onClick={back}>Abbrechen</TextKnopf>
          )
        }
        titel={istLaufend ? <PauseAnzeige t={t} uebungById={uebungById} /> : t.name}
        rechts={
          <TextKnopf stark onClick={fertigMachen}>
            {istLaufend ? 'Beenden' : 'Sichern'}
          </TextKnopf>
        }
      >
        {!istLaufend ? (
          <p className="f-kicker f-kicker-zeile">
            {relativTag(tag, heute)} · {formatUhr(t.start)}
            {t.ende !== null ? ` – ${formatUhr(t.ende)}` : ''}
          </p>
        ) : null}

        {t.uebungen.map((tu, ui) => {
          const u = uebungById[tu.uebung]
          if (!u) return null
          const fertig = tu.saetze.length > 0 && tu.saetze.every(erledigt)
          return (
            <UebungBlock
              key={schluessel[ui]}
              tu={tu}
              ui={ui}
              u={u}
              ref_={vorgaben[ui]?.saetze ?? null}
              vu={vorlage?.uebungen.find((v) => v.uebung === tu.uebung)}
              rekorde={rekorde}
              zu={fertig && !offen.has(ui)}
              aktiv={eingabe && eingabe.ui === ui ? eingabe : null}
              onKlappen={() =>
                setOffen((o) => {
                  const n = new Set(o)
                  if (n.has(ui)) n.delete(ui)
                  else n.add(ui)
                  return n
                })
              }
              onFeld={(si, feld) => setEingabe({ ui, si, feld })}
              onHaken={(si) => haken(ui, si)}
              onPlus={() => plusSatz(ui)}
              onMehr={() => setBlatt(ui)}
            />
          )
        })}

        {!t.uebungen.length ? <p className="f-leer-t f-leer-klein">Noch keine Übung.</p> : null}

        <button type="button" className="f-leerbtn" onClick={() => setHinzu({})}>
          <IconPlus />
          Übung
        </button>

        {entwurf && !neu ? (
          <button type="button" className="f-loeschen" onClick={loeschen}>
            Training löschen
          </button>
        ) : null}
      </Seite>

      {eingabe
        ? (() => {
            const { ui, si } = eingabe
            const tu = t.uebungen[ui]
            const s = tu?.saetze[si]
            const u = tu ? uebungById[tu.uebung] : undefined
            if (!s || !u) return null
            const ref = vorgaben[ui]
            const refSatz = ref?.saetze[si]
            return (
              <Tastenfeld
                key={`${ui}:${si}`}
                titel={u.name}
                untertitel={`Satz ${si + 1}`}
                erf={u.erfassung}
                start={eingabe.feld}
                werte={s}
                platzhalter={platzhalter(ref?.saetze ?? null, tu.saetze, si)}
                info={ref && refSatz ? `Zuletzt bei ${ref.training.name}: ${formatSatz(refSatz, u.erfassung)}` : null}
                erledigt={erledigt(s)}
                melde={melde}
                onFeld={(feld) => setEingabe((e) => (e ? { ...e, feld } : e))}
                onAendern={(z) => setzeSatz(ui, si, (x) => ({ ...x, ...z }))}
                onAbhaken={(z) => setzeSatz(ui, si, () => ({ ...nurNoetige(z, u.erfassung), fertig: hakenZeit() }))}
                onClose={() => setEingabe(null)}
              />
            )
          })()
        : null}

      {blatt !== null && t.uebungen[blatt] && uebungById[t.uebungen[blatt].uebung]
        ? (() => {
            const ui = blatt
            const tu = t.uebungen[ui]
            const u = uebungById[tu.uebung]
            const pause = (s: number) => {
              setzeUebung(u.id, { pause: s })
              refresh()
            }
            return (
              <Blatt
                label={u.name}
                onClose={() => {
                  setBlatt(null)
                  nachDemBlatt()
                }}
              >
                {(schliessen) => {
                  const dann = (f: () => void) => () => {
                    danach.current = f
                    schliessen()
                  }
                  return (
                    <>
                      <div className="f-sheet-kopf">
                        <div>
                          <b>{u.name}</b>
                          {u.notiz ? <small>{u.notiz}</small> : null}
                        </div>
                        <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
                          <IconX />
                        </button>
                      </div>
                      <div className="f-gruppe">
                        <div className="f-zeile">
                          <span>Pause</span>
                          <Stepper
                            label="Pause"
                            text={formatStoppuhr(u.pause)}
                            onMinus={() => pause(u.pause - 15)}
                            onPlus={() => pause(u.pause + 15)}
                            minusAus={u.pause <= PAUSE_MIN}
                            plusAus={u.pause >= PAUSE_MAX}
                          />
                        </div>
                      </div>
                      <div className="f-gruppe">
                        {istLaufend ? (
                          <button type="button" className="f-zeile" onClick={dann(() => push({ name: 'uebung', id: u.id }))}>
                            <span>Verlauf ansehen</span>
                            <span className="f-zeile-r">
                              <IconRight />
                            </span>
                          </button>
                        ) : null}
                        <button type="button" className="f-zeile" onClick={dann(() => setHinzu({ tauschen: ui }))}>
                          <span>Übung tauschen</span>
                          <span className="f-zeile-r">
                            <IconRight />
                          </span>
                        </button>
                        {t.uebungen.length > 1 ? (
                          <button type="button" className="f-zeile" onClick={dann(() => setOrdnen(true))}>
                            <span>Verschieben</span>
                          </button>
                        ) : null}
                        {tu.saetze.length ? (
                          <button
                            type="button"
                            className="f-zeile"
                            onClick={() => aendereUebung(ui, (x) => ({ ...x, saetze: x.saetze.slice(0, -1) }))}
                          >
                            <span>Letzten Satz entfernen</span>
                          </button>
                        ) : null}
                      </div>
                      <div className="f-gruppe">
                        <button type="button" className="f-zeile gefahr" onClick={dann(() => nimmRaus(ui))}>
                          <span>Aus dem Training nehmen</span>
                        </button>
                      </div>
                    </>
                  )
                }}
              </Blatt>
            )
          })()
        : null}

      {menue ? (
        <Blatt
          label="Menü"
          onClose={() => {
            setMenue(false)
            nachDemBlatt()
          }}
        >
          {(schliessen) => (
            <>
              <div className="f-gruppe">
                <label className="f-zeile">
                  <span>Beginn</span>
                  <input
                    type="time"
                    className="f-zeit"
                    value={formatUhr(t.start).padStart(5, '0')}
                    onChange={(e) => {
                      const [h, m] = e.target.value.split(':').map(Number)
                      if (!Number.isFinite(h) || !Number.isFinite(m)) return
                      const d = new Date(t.start)
                      d.setHours(h, m, 0, 0)
                      if (d.getTime() > Date.now()) melde('Der Beginn liegt in der Zukunft')
                      else aendere((x) => ({ ...x, start: d.getTime() }))
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="f-zeile"
                  onClick={() => {
                    danach.current = () => push({ name: 'werte' })
                    schliessen()
                  }}
                >
                  <span>Werte ansehen</span>
                  <span className="f-zeile-r">
                    <IconRight />
                  </span>
                </button>
              </div>
              <div className="f-gruppe">
                <button
                  type="button"
                  className="f-zeile gefahr"
                  onClick={() => {
                    danach.current = () =>
                      frage({
                        header: 'Training verwerfen?',
                        message: 'Alle Sätze dieses Trainings gehen verloren.',
                        cssClass: 'f-alert',
                        buttons: [
                          { text: 'Abbrechen', role: 'cancel' },
                          { text: 'Verwerfen', role: 'destructive', handler: verwerfen },
                        ],
                      })
                    schliessen()
                  }}
                >
                  <span>Training verwerfen</span>
                </button>
              </div>
            </>
          )}
        </Blatt>
      ) : null}

      {ordnen ? (
        <Blatt label="Reihenfolge" onClose={() => setOrdnen(false)}>
          {(schliessen) => (
            <>
              <div className="f-sheet-kopf">
                <div>
                  <b>Reihenfolge</b>
                </div>
                <TextKnopf stark onClick={schliessen}>
                  Fertig
                </TextKnopf>
              </div>
              <IonReorderGroup
                className="f-gruppe f-ordnen"
                disabled={false}
                onIonReorderEnd={(e) => {
                  const liste = e.detail.complete(t.uebungen) as TrainingsUebung[]
                  aendere((x) => ({ ...x, uebungen: liste }))
                  setOffen(new Set())
                }}
              >
                {t.uebungen.map((tu, ui) => (
                  <div key={schluessel[ui]} className="f-zeile">
                    <span>{uebungById[tu.uebung]?.name ?? 'Übung'}</span>
                    <IonReorder>
                      <span className="f-griff" aria-label="Verschieben">
                        <IconGriff />
                      </span>
                    </IonReorder>
                  </div>
                ))}
              </IonReorderGroup>
            </>
          )}
        </Blatt>
      ) : null}

      {hinzu ? (
        <Hinzufuegen
          ctx={ctx}
          mehrfach={hinzu.tauschen === undefined}
          ohne={t.uebungen.map((tu) => tu.uebung)}
          onWahl={(ids) => (hinzu.tauschen === undefined ? fuegeHinzu(ids) : ids[0] && tausche(hinzu.tauschen, ids[0]))}
          onClose={() => setHinzu(null)}
        />
      ) : null}
    </>
  )
}

// Pause seit dem letzten Haken, gegen die Pause der Uebung - ab da orange.
// Vor dem ersten Haken steht dort, wie lange das Training schon laeuft.
function PauseAnzeige({ t, uebungById }: { t: Training; uebungById: Record<string, Uebung> }) {
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setJetzt(Date.now())
    const id = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const h = letzterHaken(t)
  if (!h) {
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
  const sek = Math.max(0, (jetzt - h.zeit) / 1000)
  const marke = uebungById[h.uebung]?.pause ?? PAUSE_STANDARD
  const um = sek >= marke
  return (
    <div className={`f-pz${um ? ' um' : ''}`} role="timer">
      <span className="f-pz-z">
        <small>Pause</small>
        <b>{formatStoppuhr(sek)}</b>
      </span>
      <i>
        <u style={{ width: `${Math.min(100, (sek / marke) * 100)}%` }} />
      </i>
    </div>
  )
}

function UebungBlock({
  tu,
  ui,
  u,
  ref_,
  vu,
  rekorde,
  zu,
  aktiv,
  onKlappen,
  onFeld,
  onHaken,
  onPlus,
  onMehr,
}: {
  tu: TrainingsUebung
  ui: number
  u: Uebung
  /** Die Saetze vom letzten Mal (vorgabe) */
  ref_: Satz[] | null
  vu: VorlagenUebung | undefined
  rekorde: Set<string>
  zu: boolean
  aktiv: { si: number; feld: Feld } | null
  onKlappen: () => void
  onFeld: (si: number, feld: Feld) => void
  onHaken: (si: number) => void
  onPlus: () => void
  onMehr: () => void
}) {
  const fertig = tu.saetze.length > 0 && tu.saetze.every(erledigt)
  const pr = tu.saetze.some((_, si) => rekorde.has(`${ui}:${si}`))

  if (zu) {
    return (
      <button type="button" className="f-ex-fertig" onClick={onKlappen} aria-expanded={false}>
        <span className="f-haken an">
          <IconCheck />
        </span>
        <b>{u.name}</b>
        <small>{kurzSaetze(tu.saetze, u.erfassung)}</small>
        {pr ? <span className="f-tag-pr">PR</span> : null}
      </button>
    )
  }

  const bereich = vu ? formatBereich(vu) : ''
  return (
    <section className="f-ex">
      <div className="f-ex-kopf">
        <button type="button" className="f-ex-name" onClick={onMehr}>
          {u.name}
        </button>
        {bereich ? <span className="f-ex-ziel">{bereich}</span> : null}
        {fertig ? (
          <button type="button" className="f-ex-mehr" onClick={onKlappen} aria-label="Zuklappen">
            <IconUp />
          </button>
        ) : null}
        <button type="button" className="f-ex-mehr" onClick={onMehr} aria-label={`${u.name}: mehr`}>
          <IconMehr />
        </button>
      </div>
      {u.notiz ? <p className="f-ex-notiz">{u.notiz}</p> : null}
      <div className="f-saetze">
        {tu.saetze.map((s, si) => (
          <SatzZeile
            key={si}
            s={s}
            si={si}
            erf={u.erfassung}
            ph={platzhalter(ref_, tu.saetze, si)}
            refSatz={ref_?.[si]}
            pr={rekorde.has(`${ui}:${si}`)}
            aktivFeld={aktiv && aktiv.si === si ? aktiv.feld : null}
            onFeld={(feld) => onFeld(si, feld)}
            onHaken={() => onHaken(si)}
          />
        ))}
      </div>
      <button type="button" className="f-plus-satz" onClick={onPlus}>
        <IconPlus />
        Satz
      </button>
    </section>
  )
}

function SatzZeile({
  s,
  si,
  erf,
  ph,
  refSatz,
  pr,
  aktivFeld,
  onFeld,
  onHaken,
}: {
  s: Satz
  si: number
  erf: Erfassung
  ph: Zahlen | null
  refSatz: Satz | undefined
  pr: boolean
  aktivFeld: Feld | null
  onFeld: (f: Feld) => void
  onHaken: () => void
}) {
  const fertig = erledigt(s)
  const gut = fertig ? besser(s, refSatz, erf) : NEIN

  const zelle = (f: Feld) => {
    const v = s[f]
    const grau = ph?.[f] ?? null
    const text = v !== null ? zeige(f, v) : grau !== null ? zeige(f, grau) : '–'
    const art = fertig ? (gut[f] ? ' fest gut' : ' fest') : v === null ? ' ph' : ''
    return (
      <button
        type="button"
        className={`f-z${art}${aktivFeld === f ? ' aktiv' : ''}`}
        onClick={() => onFeld(f)}
        aria-label={`Satz ${si + 1}, ${FELDNAME[f]} ${text}`}
      >
        {text}
      </button>
    )
  }

  return (
    <div className={`f-satz${erf === 'gewicht' ? '' : ' einzeln'}`}>
      <span className="f-nr">{pr ? <span className="f-pr">PR</span> : si + 1}</span>
      {erf === 'gewicht' ? (
        <>
          {zelle('kg')}
          <span className="f-mal">×</span>
          {zelle('wdh')}
        </>
      ) : (
        zelle(erf === 'wdh' ? 'wdh' : 'sek')
      )}
      <button
        type="button"
        className={`f-haken${fertig ? ' an' : ''}`}
        onClick={onHaken}
        aria-pressed={fertig}
        aria-label={fertig ? `Satz ${si + 1} wieder öffnen` : `Satz ${si + 1} abhaken`}
      >
        {fertig ? <IconCheck /> : null}
      </button>
    </div>
  )
}

export default TrainingSeite
