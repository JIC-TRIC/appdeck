import { useEffect, useMemo, useRef, useState } from 'react'
import { IonReorder, IonReorderGroup, useIonAlert } from '@ionic/react'
import { IconCheck, IconGriff, IconMehr, IconPlus, IconRight, IconX } from '../icons'
import { kannWach, piep, tonBereit, useWach } from '../geraet'
import {
  abschliessen,
  besser,
  effektiv,
  endeFuer,
  erledigt,
  formatBereich,
  formatDauer,
  formatSatz,
  formatSek,
  formatStoppuhr,
  formatUhr,
  gleicherSatz,
  letzterHaken,
  nurNoetige,
  offeneSaetze,
  platzhalter,
  rekordeIn,
  steigerung,
  vollstaendig,
  vorgabe,
  type Steigerung,
  type Zahlen,
} from '../trainingCalc'
import {
  NOTIZ_TRAINING_MAX,
  PAUSE_MAX,
  PAUSE_MIN,
  PAUSE_STANDARD,
  SAETZE_MAX,
  getEinstellungen,
  getLaufend,
  leererSatz,
  loescheTraining,
  saetzeFuer,
  setzeEinstellungen,
  setzeLaufend,
  setzeUebung,
  speichereTraining,
} from '../trainingStore'
import { NAME_MAX, sauber } from '../store'
import { Blatt, Schalter, Seite, Stepper, TextKnopf } from '../ui'
import { dateKey, formatZahl, relativTag } from '../util'
import { Hinzufuegen } from './Hinzufuegen'
import { FELDNAME, Tastenfeld, type Feld } from './Tastenfeld'
import type { Einstellungen, Erfassung, FormCtx, Satz, Training, TrainingsUebung, Uebung, VorlagenUebung } from '../types'

// Ein Training. Laufend ist es die Startseite (kein Umschalter, kein Zurueck)
// und jeder Tipp wird sofort gesichert. Als Entwurf aendert es ein beendetes
// oder macht ein nachgetragenes fertig - mit Name, Zeit und Notiz, erst
// "Sichern" schreibt. Fertige Uebungen bleiben offen.
//
// Grau steht in jedem Feld das letzte Mal aus derselben Vorlage, sonst das
// letzte Mal ueberhaupt (trainingCalc.ts, vorgabe) - samt Vorschlag fuers
// naechste Gewicht, wenn beim letzten Mal alles oben im Bereich lag
// (steigerung). Der Haken uebernimmt es. Ein Tipp auf die Satznummer macht
// einen Aufwaermsatz daraus oder entfernt den Satz.
//
// Oben die Pause: jetzt minus Uhrzeit des letzten Hakens - nichts zaehlt im
// Hintergrund, darum stimmt sie auch, wenn die App zwischendurch zu war.

const NEIN = { kg: false, wdh: false, sek: false }

const zeige = (f: Feld, v: number) => (f === 'kg' ? formatZahl(v) : f === 'sek' ? formatSek(v) : String(v))

/** Aufwaermsaetze zuerst, sonst bleibt die Reihenfolge. */
const sortiert = (saetze: Satz[]) => [...saetze.filter((s) => s.aufwaermen), ...saetze.filter((s) => !s.aufwaermen)]

/** Nummer eines Arbeitssatzes (Aufwaermsaetze zaehlen nicht mit). */
const nummer = (saetze: Satz[], si: number) => saetze.slice(0, si + 1).filter((s) => !s.aufwaermen).length

function TrainingSeite({ ctx, entwurf, neu }: { ctx: FormCtx; entwurf?: Training; neu?: boolean }) {
  const { laufend, trainings, uebungById, vorlagen, heute, refresh, melde, push, back, toRoot } = ctx
  const istLaufend = !entwurf
  const [lokal, setLokal] = useState<Training | null>(entwurf ?? null)
  const t = istLaufend ? laufend : lokal

  const [eingabe, setEingabe] = useState<{ ui: number; si: number; feld: Feld } | null>(null)
  const [blatt, setBlatt] = useState<number | null>(null)
  const [satzBlatt, setSatzBlatt] = useState<{ ui: number; si: number } | null>(null)
  const [menue, setMenue] = useState(false)
  // Ein leeres Training beginnt mit der Auswahl der Uebungen.
  const [hinzu, setHinzu] = useState<{ tauschen?: number } | null>(() =>
    istLaufend && laufend && !laufend.uebungen.length ? {} : null,
  )
  const [ordnen, setOrdnen] = useState(false)
  const [einst, setEinst] = useState<Einstellungen>(getEinstellungen)
  // Was nach dem Schliessen eines Blatts kommt - zwei Blaetter gleichzeitig
  // vertraegt Ionic schlecht.
  const danach = useRef<(() => void) | null>(null)
  const nachDemBlatt = () => {
    const f = danach.current
    danach.current = null
    f?.()
  }
  const [frage] = useIonAlert()

  useWach(istLaufend && einst.wach && t !== null)

  const vorlage = t?.vorlage ? vorlagen.find((v) => v.id === t.vorlage) : undefined
  const vorgaben = useMemo(
    () => (t ? t.uebungen.map((tu) => vorgabe(trainings, tu.uebung, t.vorlage, t.start, t.id)) : []),
    [t, trainings],
  )
  const plusse = useMemo<(Steigerung | null)[]>(
    () =>
      t
        ? t.uebungen.map((tu, ui) => {
            const u = uebungById[tu.uebung]
            const vu = vorlage?.uebungen.find((v) => v.uebung === tu.uebung)
            return u ? steigerung(vorgaben[ui]?.saetze ?? null, vu, u.erfassung, u.schritt) : null
          })
        : [],
    [t, vorgaben, vorlage, uebungById],
  )
  const rekorde = useMemo(() => {
    const r = new Set<string>()
    if (t) for (const x of rekordeIn(t, trainings, uebungById)) r.add(`${x.ui}:${x.si}`)
    return r
  }, [t, trainings, uebungById])

  // Gerade beendet oder verworfen - die Seite gleitet noch hinaus.
  if (!t) return <Seite>{null}</Seite>

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
    tonBereit()
    const tu = t.uebungen[ui]
    const s = tu.saetze[si]
    const erf = erfVon(tu)
    if (erledigt(s)) {
      setzeSatz(ui, si, (x) => ({ ...x, fertig: null }))
      return
    }
    const z = effektiv(vorgaben[ui]?.saetze ?? null, tu.saetze, si, plusse[ui])
    if (!z || !vollstaendig(z, erf)) {
      const feld: Feld = erf === 'gewicht' ? (z?.kg == null ? 'kg' : 'wdh') : erf === 'wdh' ? 'wdh' : 'sek'
      setEingabe({ ui, si, feld })
      return
    }
    setzeSatz(ui, si, (x) => ({ ...nurNoetige(z, erf), fertig: hakenZeit(), aufwaermen: x.aufwaermen }))
  }

  const plusSatz = (ui: number, aufwaermen = false) =>
    aendereUebung(ui, (tu) =>
      tu.saetze.length >= SAETZE_MAX ? tu : { ...tu, saetze: sortiert([...tu.saetze, leererSatz(aufwaermen)]) },
    )

  const entferneSatz = (ui: number, si: number) =>
    aendereUebung(ui, (tu) => ({ ...tu, saetze: tu.saetze.filter((_, j) => j !== si) }))

  const aufwaermenUmschalten = (ui: number, si: number) =>
    aendereUebung(ui, (tu) => ({
      ...tu,
      saetze: sortiert(tu.saetze.map((s, j) => (j === si ? { ...s, aufwaermen: !s.aufwaermen } : s))),
    }))

  // Neue Uebung: so viele Saetze wie beim letzten Mal (Aufwaermen getrennt), sonst drei.
  const saetzeNeu = (uebung: string) => {
    const ref = vorgabe(trainings, uebung, t.vorlage, t.start, t.id)?.saetze
    if (!ref) return saetzeFuer({ saetze: 3, aufwaermen: 0 })
    const auf = ref.filter((s) => s.aufwaermen).length
    return saetzeFuer({ saetze: Math.max(1, ref.length - auf), aufwaermen: auf })
  }

  const fuegeHinzu = (ids: string[]) =>
    aendere((x) => ({ ...x, uebungen: [...x.uebungen, ...ids.map((id) => ({ uebung: id, saetze: saetzeNeu(id) }))] }))

  const tausche = (ui: number, id: string) =>
    aendereUebung(ui, (tu) => ({ uebung: id, saetze: tu.saetze.map((s) => leererSatz(s.aufwaermen)) }))

  const nimmRaus = (ui: number) => {
    const weg = () => aendere((x) => ({ ...x, uebungen: x.uebungen.filter((_, i) => i !== ui) }))
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

  const schalte = (k: keyof Einstellungen) => {
    const neuE = { ...einst, [k]: !einst[k] }
    setzeEinstellungen(neuE)
    setEinst(neuE)
    if (k === 'ton' && neuE.ton) tonBereit()
  }

  const notizFragen = () =>
    frage({
      header: 'Notiz',
      cssClass: 'f-alert',
      inputs: [{ name: 'notiz', type: 'textarea', value: t.notiz, placeholder: 'Schulter zwickt, Studio voll …', attributes: { maxlength: NOTIZ_TRAINING_MAX } }],
      buttons: [
        { text: 'Abbrechen', role: 'cancel' },
        { text: 'Sichern', handler: (d: { notiz?: string }) => aendere((x) => ({ ...x, notiz: (d.notiz ?? '').trim() })) },
      ],
    })

  // ---------- Beenden, Sichern, Verwerfen ----------

  const verwerfen = () => {
    setzeLaufend(null)
    refresh()
    melde('Training verworfen')
  }

  const abschluss = (offene: 'verwerfen' | 'abhaken') => {
    const roh = istLaufend ? getLaufend() : t
    if (!roh) return
    const aktuell = { ...roh, name: sauber(roh.name, NAME_MAX) || 'Training', notiz: roh.notiz.trim() }
    const ende = istLaufend ? endeFuer(aktuell, Date.now()) : (aktuell.ende ?? Date.now())
    const fertig = abschliessen(aktuell, ende, offene, uebungById, trainings, vorlage)
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

  // Beginn als 'HH:MM' auf denselben Tag setzen - nicht in die Zukunft. Beim
  // Entwurf wandert das Ende mit (die Dauer bleibt).
  const setzeBeginn = (wert: string) => {
    const [h, m] = wert.split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return
    const d = new Date(t.start)
    d.setHours(h, m, 0, 0)
    const start = d.getTime()
    if (start > Date.now()) return melde('Der Beginn liegt in der Zukunft')
    aendere((x) => ({ ...x, start, ende: x.ende === null ? null : start + (x.ende - x.start) }))
  }

  // ---------- Seite ----------

  // Stabile Schluessel, auch wenn eine Uebung zweimal drin ist.
  const gezaehlt: Record<string, number> = {}
  const schluessel = t.uebungen.map((tu) => {
    gezaehlt[tu.uebung] = (gezaehlt[tu.uebung] ?? 0) + 1
    return `${tu.uebung}:${gezaehlt[tu.uebung]}`
  })

  const tag = dateKey(new Date(t.start))
  const dauerMin = t.ende !== null ? Math.round((t.ende - t.start) / 60000) : 0

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
        titel={istLaufend ? <PauseAnzeige t={t} uebungById={uebungById} ton={einst.ton} /> : neu ? 'Nachtragen' : 'Bearbeiten'}
        rechts={
          <TextKnopf stark onClick={fertigMachen}>
            {istLaufend ? 'Beenden' : 'Sichern'}
          </TextKnopf>
        }
      >
        {!istLaufend ? (
          <div className="f-felder">
            <label className="f-feld">
              <span className="f-label">Name</span>
              <input
                type="text"
                value={t.name}
                maxLength={NAME_MAX}
                autoComplete="off"
                onChange={(e) => {
                  const name = e.target.value
                  setLokal((x) => (x ? { ...x, name } : x))
                }}
              />
            </label>
            <div className="f-zwei-felder">
              <label className="f-feld">
                <span className="f-label">Beginn · {relativTag(tag, heute)}</span>
                <input type="time" value={formatUhr(t.start).padStart(5, '0')} onChange={(e) => setzeBeginn(e.target.value)} />
              </label>
              <label className="f-feld">
                <span className="f-label">Dauer (min)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={dauerMin ? String(dauerMin) : ''}
                  autoComplete="off"
                  onChange={(e) => {
                    const min = Math.min(600, Math.max(0, Math.round(Number(e.target.value.replace(/\D/g, '')) || 0)))
                    setLokal((x) => (x ? { ...x, ende: x.start + min * 60000 } : x))
                  }}
                />
              </label>
            </div>
          </div>
        ) : null}

        {t.uebungen.map((tu, ui) => {
          const u = uebungById[tu.uebung]
          if (!u) return null
          return (
            <UebungBlock
              key={schluessel[ui]}
              tu={tu}
              ui={ui}
              u={u}
              ref_={vorgaben[ui]?.saetze ?? null}
              plus={plusse[ui]}
              vu={vorlage?.uebungen.find((v) => v.uebung === tu.uebung)}
              rekorde={rekorde}
              aktiv={eingabe && eingabe.ui === ui ? eingabe : null}
              onFeld={(si, feld) => setEingabe({ ui, si, feld })}
              onHaken={(si) => haken(ui, si)}
              onNummer={(si) => setSatzBlatt({ ui, si })}
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

        {!istLaufend ? (
          <label className="f-feld">
            <span className="f-label">Notiz</span>
            <textarea
              value={t.notiz}
              maxLength={NOTIZ_TRAINING_MAX}
              rows={2}
              onChange={(e) => {
                const notiz = e.target.value
                setLokal((x) => (x ? { ...x, notiz } : x))
              }}
            />
          </label>
        ) : t.notiz ? (
          <button type="button" className="f-notiz-training" onClick={notizFragen}>
            {t.notiz}
          </button>
        ) : null}

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
            const refSatz = gleicherSatz(ref?.saetze ?? null, tu.saetze, si)
            return (
              <Tastenfeld
                key={`${ui}:${si}`}
                titel={u.name}
                untertitel={s.aufwaermen ? 'Aufwärmsatz' : `Satz ${nummer(tu.saetze, si)}`}
                erf={u.erfassung}
                schritt={u.schritt}
                stange={u.stange}
                start={eingabe.feld}
                werte={s}
                platzhalter={platzhalter(ref?.saetze ?? null, tu.saetze, si, plusse[ui])}
                info={ref && refSatz ? `Zuletzt bei ${ref.training.name}: ${formatSatz(refSatz, u.erfassung)}` : null}
                erledigt={erledigt(s)}
                melde={melde}
                onFeld={(feld) => setEingabe((e) => (e ? { ...e, feld } : e))}
                onAendern={(z) => setzeSatz(ui, si, (x) => ({ ...x, ...z }))}
                onAbhaken={(z) => {
                  tonBereit()
                  setzeSatz(ui, si, (x) => ({ ...nurNoetige(z, u.erfassung), fertig: hakenZeit(), aufwaermen: x.aufwaermen }))
                }}
                onClose={() => setEingabe(null)}
              />
            )
          })()
        : null}

      {satzBlatt && t.uebungen[satzBlatt.ui]?.saetze[satzBlatt.si]
        ? (() => {
            const { ui, si } = satzBlatt
            const tu = t.uebungen[ui]
            const s = tu.saetze[si]
            const name = uebungById[tu.uebung]?.name ?? 'Übung'
            return (
              <Blatt label={`${name}, Satz`} onClose={() => setSatzBlatt(null)}>
                {(schliessen) => (
                  <>
                    <div className="f-sheet-kopf">
                      <div>
                        <b>{name}</b>
                        <small>{s.aufwaermen ? 'Aufwärmsatz' : `Satz ${nummer(tu.saetze, si)}`}</small>
                      </div>
                      <button type="button" className="f-rund klein" onClick={schliessen} aria-label="Schließen">
                        <IconX />
                      </button>
                    </div>
                    <div className="f-gruppe">
                      <button
                        type="button"
                        className="f-zeile"
                        aria-pressed={s.aufwaermen}
                        onClick={() => {
                          aufwaermenUmschalten(ui, si)
                          schliessen()
                        }}
                      >
                        <span>Aufwärmsatz</span>
                        <Schalter an={s.aufwaermen} />
                      </button>
                    </div>
                    <div className="f-gruppe">
                      <button
                        type="button"
                        className="f-zeile gefahr"
                        onClick={() => {
                          entferneSatz(ui, si)
                          schliessen()
                        }}
                      >
                        <span>Satz entfernen</span>
                      </button>
                    </div>
                  </>
                )}
              </Blatt>
            )
          })()
        : null}

      {blatt !== null && t.uebungen[blatt] && uebungById[t.uebungen[blatt].uebung]
        ? (() => {
            const ui = blatt
            const u = uebungById[t.uebungen[ui].uebung]
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
                        <button
                          type="button"
                          className="f-zeile"
                          onClick={() => {
                            plusSatz(ui, true)
                            schliessen()
                          }}
                        >
                          <span>Aufwärmsatz hinzufügen</span>
                        </button>
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
                  <span className="f-zeile-r">
                    {formatDauer(Date.now() - t.start)}
                    <input
                      type="time"
                      className="f-zeit"
                      value={formatUhr(t.start).padStart(5, '0')}
                      onChange={(e) => setzeBeginn(e.target.value)}
                    />
                  </span>
                </label>
                <button
                  type="button"
                  className="f-zeile"
                  onClick={() => {
                    danach.current = notizFragen
                    schliessen()
                  }}
                >
                  <span>Notiz</span>
                  <span className="f-zeile-r f-zeile-kurz">
                    {t.notiz || 'keine'}
                    <IconRight />
                  </span>
                </button>
              </div>
              <div className="f-gruppe">
                <button type="button" className="f-zeile" aria-pressed={einst.ton} onClick={() => schalte('ton')}>
                  <span>Ton am Pausenende</span>
                  <Schalter an={einst.ton} />
                </button>
                {kannWach ? (
                  <button type="button" className="f-zeile" aria-pressed={einst.wach} onClick={() => schalte('wach')}>
                    <span>Bildschirm bleibt an</span>
                    <Schalter an={einst.wach} />
                  </button>
                ) : null}
              </div>
              <div className="f-gruppe">
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

// Pause seit dem letzten Haken, gegen die Pause der Uebung - ab da orange
// (und mit Ton, wenn eingeschaltet). Vor dem ersten Haken steht dort, wie
// lange das Training schon laeuft.
function PauseAnzeige({ t, uebungById, ton }: { t: Training; uebungById: Record<string, Uebung>; ton: boolean }) {
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
  const sek = h ? Math.max(0, (jetzt - h.zeit) / 1000) : 0
  const marke = h ? (uebungById[h.uebung]?.pause ?? PAUSE_STANDARD) : 0
  const um = h !== null && sek >= marke

  // Ton nur beim Uebergang - nicht, wenn die App erst nach der Pause wieder
  // aufgemacht wird.
  const vorher = useRef<boolean | null>(null)
  useEffect(() => {
    if (vorher.current === false && um && ton && document.visibilityState === 'visible') piep()
    vorher.current = um
  }, [um, ton])

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
  plus,
  vu,
  rekorde,
  aktiv,
  onFeld,
  onHaken,
  onNummer,
  onPlus,
  onMehr,
}: {
  tu: TrainingsUebung
  ui: number
  u: Uebung
  /** Die Saetze vom letzten Mal (vorgabe) */
  ref_: Satz[] | null
  plus: Steigerung | null
  vu: VorlagenUebung | undefined
  rekorde: Set<string>
  aktiv: { si: number; feld: Feld } | null
  onFeld: (si: number, feld: Feld) => void
  onHaken: (si: number) => void
  onNummer: (si: number) => void
  onPlus: () => void
  onMehr: () => void
}) {
  const bereich = vu ? formatBereich(vu) : ''
  return (
    <section className="f-ex">
      <div className="f-ex-kopf">
        <button type="button" className="f-ex-name" onClick={onMehr}>
          {u.name}
        </button>
        {plus ? <span className="f-ex-plus">+{formatZahl(plus.kg)} kg</span> : null}
        {bereich ? <span className="f-ex-ziel">{bereich}</span> : null}
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
            nr={nummer(tu.saetze, si)}
            erf={u.erfassung}
            ph={platzhalter(ref_, tu.saetze, si, plus)}
            refSatz={gleicherSatz(ref_, tu.saetze, si)}
            pr={rekorde.has(`${ui}:${si}`)}
            aktivFeld={aktiv && aktiv.si === si ? aktiv.feld : null}
            onFeld={(feld) => onFeld(si, feld)}
            onHaken={() => onHaken(si)}
            onNummer={() => onNummer(si)}
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
  nr,
  erf,
  ph,
  refSatz,
  pr,
  aktivFeld,
  onFeld,
  onHaken,
  onNummer,
}: {
  s: Satz
  nr: number
  erf: Erfassung
  ph: Zahlen | null
  refSatz: Satz | undefined
  pr: boolean
  aktivFeld: Feld | null
  onFeld: (f: Feld) => void
  onHaken: () => void
  onNummer: () => void
}) {
  const fertig = erledigt(s)
  const gut = fertig && !s.aufwaermen ? besser(s, refSatz, erf) : NEIN
  const name = s.aufwaermen ? 'Aufwärmsatz' : `Satz ${nr}`

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
        aria-label={`${name}, ${FELDNAME[f]} ${text}`}
      >
        {text}
      </button>
    )
  }

  return (
    <div className={`f-satz${erf === 'gewicht' ? '' : ' einzeln'}${s.aufwaermen ? ' auf' : ''}`}>
      <button type="button" className="f-nr" onClick={onNummer} aria-label={`${name}: Aufwärmsatz oder entfernen`}>
        {pr ? <span className="f-pr">PR</span> : s.aufwaermen ? 'A' : nr}
      </button>
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
        aria-label={fertig ? `${name} wieder öffnen` : `${name} abhaken`}
      >
        {fertig ? <IconCheck /> : null}
      </button>
    </div>
  )
}

export default TrainingSeite
