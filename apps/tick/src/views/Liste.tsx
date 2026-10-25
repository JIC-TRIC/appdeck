import { useEffect, useMemo, useRef, useState } from 'react'
import { IonList, IonReorder, IonReorderGroup } from '@ionic/react'
import { EINGANG_FARBE, farbe } from '../farben'
import { haptik } from '../geraet'
import { IconDown, IconGriff, IconLeft, IconMehr, IconPlus, IconRight, IconSuche, IconUp, IconX } from '../icons'
import {
  alleAbschnitte,
  ausschnitt,
  enthaelt,
  erledigteIn,
  imOrdner,
  nachTagen,
  ordnerIds,
  ordnerVon,
  suche as sucheIn,
  zaehle,
} from '../liste'
import { erledigtTitel, tagVon } from '../tage'
import { fokusBleibt, Markiert, mitFarbe, zumLauncher } from '../ui'
import { OrdnerKarten, OrdnerVerwalten } from './OrdnerKarten'
import { Schnellfeld } from './Schnellfeld'
import { Zeile } from './Zeile'
import type { Entwurf, Ordner, Todo } from '../types'

// Ordner, die der Erststart vorschlaegt, mit ihrer Farbe (Index in FARBEN).
const VORSCHLAEGE: [string, number][] = [
  ['Zuhause', 3],
  ['Einkauf', 1],
  ['Projekte', 5],
  ['Papierkram', 7],
  ['Arbeit', 0],
]

export interface ListeProps {
  /** 'start' (alle Ordner als Karten), 'alle', 'eingang' oder die id eines Ordners */
  ansicht: string
  /** Beschriftung von „‹“ auf einer Ordnerseite: die Seite darunter */
  zurueck: string
  todos: Todo[]
  ordner: Ordner[]
  heute: string
  /** gerade abgehakt, stehen noch kurz an ihrem Platz */
  haken: ReadonlySet<string>
  /** die gerade abgehakten rutschen jetzt weg */
  gehen: boolean
  /** gerade angelegt */
  neu: string | null
  /** Ordnerseite: Reihenfolge der Todos aendern, Startseite: Ordner bearbeiten */
  ordnen: boolean
  setOrdnen: (an: boolean) => void
  entwurf: Entwurf
  setEntwurf: (e: Entwurf) => void
  tastatur: boolean
  onZurueck: () => void
  /** eine Ordnerseite oeffnen */
  onOeffnen: (ansicht: string) => void
  onHaken: (t: Todo) => void
  onTodo: (id: string) => void
  onVerschieben: (id: string) => void
  onLoeschen: (id: string) => void
  onAnlegen: () => void
  onOrdnerWahl: () => void
  onNeuerOrdner: () => void
  onOrdnerBearbeiten: (id: string) => void
  onVorschlag: (name: string, farbe: number) => void
  onMenue: () => void
  onSortiert: (ids: string[]) => void
  onOrdnerSortiert: (ids: string[]) => void
  onErledigteLoeschen: (ansicht: string | null, n: number) => void
}

// Eine Seite von Tick: die Startseite mit allen Ordnern als Karten oder eine
// Liste (Alle, Eingang, ein Ordner) ueber die ganze Hoehe. Unten das
// Schnellfeld, die Lupe macht daraus die Suche. Regeln: konzept.md.
export function Liste(p: ListeProps) {
  const { todos, ordner, heute, haken } = p
  const ids = useMemo(() => ordnerIds(ordner), [ordner])
  const nachId = useMemo(() => new Map(ordner.map((o) => [o.id, o])), [ordner])
  const z = zaehle(todos, ordner, heute)

  const start = p.ansicht === 'start'
  // Fuer die Listen: 'alle', null = Eingang, sonst die id des Ordners
  const ansicht: string | null = start || p.ansicht === 'alle' ? 'alle' : p.ansicht === 'eingang' ? null : p.ansicht
  const ord = ansicht && ansicht !== 'alle' ? nachId.get(ansicht) : undefined
  const imOrdnerOffen = ansicht === 'alle' ? [] : imOrdner(todos, ansicht, ids)
  const titel = start ? 'Ordner' : ansicht === 'alle' ? 'Alle' : ansicht === null ? 'Eingang' : (ord?.name ?? 'Ordner')
  const kappe = ansicht === 'alle' ? undefined : ord ? farbe(ord.farbe) : EINGANG_FARBE
  const erledigt = start ? [] : erledigteIn(todos, ansicht, ids)
  const offenHier = ansicht === 'alle' ? z.alle : imOrdnerOffen.length

  const untertitel = (() => {
    if (start) return z.alle ? `${z.alle} offen${z.faellig ? ` · ${z.faellig} fällig` : ''}` : 'Nichts offen'
    if (!offenHier) return erledigt.length ? `Nichts offen · ${erledigt.length} erledigt` : 'Nichts offen'
    if (ansicht === 'alle') return `${z.alle} offen${z.faellig ? ` · ${z.faellig} fällig` : ''}`
    return `${offenHier} offen${erledigt.length ? ` · ${erledigt.length} erledigt` : ''}`
  })()

  const [erledigtOffen, setErledigtOffen] = useState(false)
  const [klein, setKlein] = useState(false)
  const [suche, setSuche] = useState(false)
  const [q, setQ] = useState('')
  const suchFeld = useRef<HTMLInputElement>(null)

  // Gerade angelegt: ins Bild holen (ueber dem Schnellfeld, siehe scroll-margin).
  useEffect(() => {
    if (!p.neu) return
    document.querySelector(`.t-row[data-id="${p.neu}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [p.neu])

  const sucheAn = () => {
    // Fokus noch im Tipp, sonst oeffnet iOS die Tastatur nicht.
    suchFeld.current?.focus({ preventScroll: true })
    setSuche(true)
  }
  const sucheAus = () => {
    setQ('')
    setSuche(false)
    suchFeld.current?.blur()
  }

  const zeile = (t: Todo, o: { ordnerZeigen?: boolean; suche?: boolean } = {}) => {
    const oid = ordnerVon(t, ids)
    const tOrd = oid ? nachId.get(oid) : undefined
    const f = tOrd ? farbe(tOrd.farbe) : EINGANG_FARBE
    const offen = t.erledigt === null
    const nurInNotiz = o.suche && !enthaelt(t.titel, q)
    return (
      <Zeile
        key={t.id}
        todo={t}
        farbe={f}
        heute={heute}
        an={haken.has(t.id) || !offen}
        geht={p.gehen && haken.has(t.id)}
        neu={p.neu === t.id}
        ordner={o.ordnerZeigen ? { name: tOrd?.name ?? 'Eingang', farbe: f } : undefined}
        titel={o.suche ? <Markiert text={t.titel} q={q} /> : undefined}
        ausschnitt={nurInNotiz ? <Markiert text={ausschnitt(t.notiz, q)} q={q} /> : undefined}
        onHaken={() => p.onHaken(t)}
        onOeffnen={() => p.onTodo(t.id)}
        onVerschieben={offen ? () => p.onVerschieben(t.id) : undefined}
        onLoeschen={offen ? () => p.onLoeschen(t.id) : undefined}
        onLang={
          offen && ansicht !== 'alle' && !o.suche && imOrdnerOffen.length > 1
            ? () => {
                haptik()
                p.setOrdnen(true)
              }
            : undefined
        }
      />
    )
  }

  // ---------- Startseite ----------

  const startseite = () => {
    // Erststart: noch gar nichts da. Sobald es einen Ordner oder ein Todo gibt, kommen die Karten.
    if (!todos.length && !ordner.length) {
      return (
        <div className="t-erst">
          <h2>Was steht an?</h2>
          <p>Ordner zum Start</p>
          <div className="t-erst-c">
            {VORSCHLAEGE.map(([n, f]) => (
              <button key={n} type="button" className="t-chip neu" style={mitFarbe(farbe(f))} onClick={() => p.onVorschlag(n, f)}>
                <IconPlus />
                {n}
              </button>
            ))}
          </div>
        </div>
      )
    }
    return p.ordnen ? (
      <OrdnerVerwalten ordner={ordner} zaehlung={z} onBearbeiten={p.onOrdnerBearbeiten} onNeu={p.onNeuerOrdner} onSortiert={p.onOrdnerSortiert} />
    ) : (
      <OrdnerKarten ordner={ordner} zaehlung={z} onOeffnen={p.onOeffnen} onNeu={p.onNeuerOrdner} />
    )
  }

  // ---------- Ordnerseite ----------

  const inhalt = () => {
    const leer = offenHier === 0 ? (
      <div className="t-leer">
        <h2>{erledigt.length ? 'Alles erledigt' : 'Noch nichts drin'}</h2>
        {(() => {
          const n = erledigt.filter((t) => tagVon(new Date(t.erledigt!)) === heute).length
          return n ? <p>Heute {n === 1 ? '1 Todo' : `${n} Todos`} erledigt</p> : null
        })()}
      </div>
    ) : null

    const offene =
      ansicht === 'alle' ? (
        (() => {
          const { faellig, abschnitte } = alleAbschnitte(todos, ordner, heute)
          return (
            <>
              {faellig.length ? (
                <section>
                  <h2 className="t-lab">Fällig</h2>
                  <IonList lines="none" className="t-liste">
                    {faellig.map((t) => zeile(t, { ordnerZeigen: true }))}
                  </IonList>
                </section>
              ) : null}
              {abschnitte.map((a) => {
                const o = a.ordner ? nachId.get(a.ordner) : undefined
                return (
                  <section key={a.ordner ?? 'eingang'}>
                    <button
                      type="button"
                      className="t-sh"
                      style={mitFarbe(o ? farbe(o.farbe) : EINGANG_FARBE)}
                      onClick={() => p.onOeffnen(a.ordner ?? 'eingang')}
                    >
                      <i />
                      {o?.name ?? 'Eingang'}
                      <IconRight />
                    </button>
                    <IonList lines="none" className="t-liste">
                      {a.todos.map((t) => zeile(t))}
                    </IonList>
                  </section>
                )
              })}
            </>
          )
        })()
      ) : p.ordnen ? (
        // Sortieren: Griffe rechts, am Griff ziehen. Fertig steht oben rechts.
        <IonReorderGroup
          className="t-ordnen"
          disabled={false}
          onIonReorderEnd={(e) => p.onSortiert(e.detail.complete(imOrdnerOffen.map((t) => t.id)) as string[])}
        >
          {imOrdnerOffen.map((t) => (
            <div key={t.id} className="t-row ordnen" style={mitFarbe(kappe ?? EINGANG_FARBE)}>
              <span className="t-ck" aria-hidden="true" />
              <span className="t-rt">
                <b>{t.titel}</b>
              </span>
              <IonReorder>
                <span className="t-griff" aria-label={`${t.titel} verschieben`}>
                  <IconGriff />
                </span>
              </IonReorder>
            </div>
          ))}
        </IonReorderGroup>
      ) : (
        <IonList lines="none" className="t-liste">
          {imOrdnerOffen.map((t) => zeile(t))}
        </IonList>
      )

    return (
      <>
        {leer}
        {offene}
        {erledigt.length && !p.ordnen ? (
          <div className="t-erledigt">
            <button type="button" className="t-donebar" aria-expanded={erledigtOffen} onClick={() => setErledigtOffen(!erledigtOffen)}>
              Erledigt <small>{erledigt.length}</small>
              {erledigtOffen ? <IconUp /> : <IconDown />}
            </button>
            {erledigtOffen ? (
              <>
                {nachTagen(erledigt, (ms) => erledigtTitel(ms, heute)).map((g) => (
                  <section key={g.titel}>
                    <h2 className="t-lab">{g.titel}</h2>
                    {g.todos.map((t) => zeile(t, { ordnerZeigen: ansicht === 'alle' }))}
                  </section>
                ))}
                <button type="button" className="t-wipe" onClick={() => p.onErledigteLoeschen(ansicht, erledigt.length)}>
                  Erledigte löschen
                </button>
              </>
            ) : null}
          </div>
        ) : null}
      </>
    )
  }

  const treffer = () => {
    if (!q.trim()) return null
    const r = sucheIn(todos, q)
    if (!r.offen.length && !r.erledigt.length) return <p className="t-nichts">Nichts gefunden</p>
    return (
      <>
        {r.offen.length ? (
          <section>
            <h2 className="t-lab">
              Offen <span>{r.offen.length}</span>
            </h2>
            <IonList lines="none" className="t-liste">
              {r.offen.map((t) => zeile(t, { ordnerZeigen: true, suche: true }))}
            </IonList>
          </section>
        ) : null}
        {r.erledigt.length ? (
          <section>
            <h2 className="t-lab">
              Erledigt <span>{r.erledigt.length}</span>
            </h2>
            {r.erledigt.map((t) => zeile(t, { ordnerZeigen: true, suche: true }))}
          </section>
        ) : null}
      </>
    )
  }

  // Startseite auf dem Grau, eine Ordnerseite auf einem weissen Blatt mit dem
  // Strich in der Ordnerfarbe oben (wie die Karte, aus der sie kommt).
  const flaeche = suche ? (
    <div className="t-blatt rund">{treffer()}</div>
  ) : start ? (
    <div className="t-flaeche">{startseite()}</div>
  ) : (
    <div className="t-blatt kappe" style={kappe ? mitFarbe(kappe) : undefined}>
      {inhalt()}
    </div>
  )

  return (
    <div className={`t-screen${suche ? ' sucht' : ''}${start ? ' start' : ''}`}>
      <header className={`t-bar${klein && !suche ? ' klein' : ''}`}>
        <button type="button" className="t-back" onClick={start ? zumLauncher : p.onZurueck} tabIndex={suche ? -1 : 0}>
          <IconLeft />
          {start ? 'Apps' : p.zurueck}
        </button>
        <b className="t-bar-titel" aria-hidden={!klein}>
          {titel}
        </b>
        <span className="t-bar-r">
          {p.ordnen ? (
            <button type="button" className="t-text-knopf stark" onClick={() => p.setOrdnen(false)}>
              Fertig
            </button>
          ) : (
            <>
              <button type="button" className="t-rund" aria-label="Suchen" onClick={sucheAn} tabIndex={suche ? -1 : 0}>
                <IconSuche />
              </button>
              <button type="button" className="t-rund" aria-label="Mehr" onClick={p.onMenue} tabIndex={suche ? -1 : 0}>
                <IconMehr />
              </button>
            </>
          )}
        </span>

        {/* Immer im Dokument, damit die Lupe im selben Tipp fokussieren kann. */}
        <div className="t-such" aria-hidden={!suche}>
          <label className="t-sf">
            <IconSuche />
            <input
              ref={suchFeld}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suchen"
              aria-label="Suchen"
              enterKeyHint="search"
              autoComplete="off"
              autoCapitalize="off"
              tabIndex={suche ? 0 : -1}
              onKeyDown={(e) => {
                if (e.key === 'Enter') suchFeld.current?.blur()
                if (e.key === 'Escape') sucheAus()
              }}
            />
            {q ? (
              <button type="button" className="t-sf-x" aria-label="Suche leeren" onMouseDown={fokusBleibt} onClick={() => setQ('')}>
                <IconX />
              </button>
            ) : null}
          </label>
          <button type="button" className="t-text-knopf" onClick={sucheAus} tabIndex={suche ? 0 : -1}>
            Abbrechen
          </button>
        </div>
      </header>

      <div className={`t-scroll${start && !suche ? ' grau' : ''}`} onScroll={(e) => setKlein(e.currentTarget.scrollTop > 40)}>
        {suche ? null : (
          <div className="t-lt">
            <h1>{titel}</h1>
            <p>{untertitel}</p>
          </div>
        )}
        {flaeche}
      </div>

      {suche || p.ordnen ? null : <div className="t-fade" aria-hidden="true" />}
      {suche || p.ordnen ? null : (
        <Schnellfeld
          entwurf={p.entwurf}
          setEntwurf={p.setEntwurf}
          ordner={ordner}
          heute={heute}
          tastatur={p.tastatur}
          onAnlegen={p.onAnlegen}
          onOrdnerWahl={p.onOrdnerWahl}
        />
      )}
    </div>
  )
}
