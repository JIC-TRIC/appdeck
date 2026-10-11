import { useEffect, useState } from 'react'
import { IconLeft, IconPlus, IconRight } from '../icons'
import { alleRekorde, formatDauer, formatUhr } from '../trainingCalc'
import { Seite, Zurueck, zumLauncher } from '../ui'
import { addMonths, dateKey, formatMonat, formatTagLang, monatsBlatt, relativTag } from '../util'
import type { FormCtx, Training } from '../types'

const WOCHENTAGE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

// Unter einer geoeffneten Seite wird der Kalender ausgehaengt (PageStage) -
// ohne das stuende man nach "Zurück" wieder im aktuellen Monat. Gilt nur fuer
// den Tag, an dem es gemerkt wurde.
let gemerkt: { heute: string; monat: string; tag: string | null } | null = null

// Tab "Kalender": ein Monat als Blatt ab Montag, Trainingstage in Kreide, mit
// Rekord ein oranger Punkt. Darunter die Trainings des Monats, neueste oben -
// nach einem Tipp auf einen Tag nur die dieses Tages; an einem Tag ohne
// Training laesst sich dort nachtragen. "+" traegt fuer den gewaehlten Tag
// nach, sonst fuer gestern. Blaettern vom ersten Monat mit Training bis heute.
function Kalender({ ctx }: { ctx: FormCtx }) {
  const { trainings, uebungById, heute, push } = ctx
  const dieser = `${heute.slice(0, 7)}-01`
  const erster = trainings.length ? `${dateKey(new Date(trainings[0].start)).slice(0, 7)}-01` : dieser
  const frisch = gemerkt?.heute === heute ? gemerkt : null
  const [monat, setMonat] = useState(() => {
    const m = frisch?.monat ?? dieser
    return m < erster ? erster : m > dieser ? dieser : m
  })
  const [gewaehlt, setGewaehlt] = useState<string | null>(() => (frisch?.tag?.startsWith(monat.slice(0, 7)) ? frisch.tag : null))
  useEffect(() => {
    gemerkt = { heute, monat, tag: gewaehlt }
  }, [heute, monat, gewaehlt])

  const tagVon = (t: Training) => dateKey(new Date(t.start))
  const proTag = new Map<string, Training[]>()
  for (const t of trainings) proTag.set(tagVon(t), [...(proTag.get(tagVon(t)) ?? []), t])
  const rekorde = alleRekorde(trainings, uebungById)
  const mitPr = (t: Training) => !!rekorde.get(t.id)?.length

  const { leer, tage } = monatsBlatt(monat)
  const imMonat = trainings.filter((t) => tagVon(t).startsWith(monat.slice(0, 7))).reverse()
  const liste = gewaehlt ? (proTag.get(gewaehlt) ?? []) : imMonat

  const blaettern = (n: number) => {
    setMonat(addMonths(monat, n))
    setGewaehlt(null)
  }
  const anzahl = (n: number) => `${n} ${n === 1 ? 'Training' : 'Trainings'}`

  return (
    <Seite
      links={<Zurueck label="Apps" onClick={zumLauncher} />}
      rechts={
        <button
          type="button"
          className="f-rund"
          onClick={() => push({ name: 'nachtragen', tag: gewaehlt ?? undefined })}
          aria-label="Training nachtragen"
        >
          <IconPlus />
        </button>
      }
    >
      <header className="f-kopf tab">
        <h1 className="f-marke">Kalender</h1>
      </header>

      <section className="f-karte-flach">
        <div className="f-tag">
          <button type="button" className="f-rund" onClick={() => blaettern(-1)} disabled={monat <= erster} aria-label="Monat davor">
            <IconLeft />
          </button>
          <div className="f-tag-mitte">
            <b>{formatMonat(monat, heute)}</b>
            <small>{imMonat.length ? anzahl(imMonat.length) : 'Kein Training'}</small>
          </div>
          <button type="button" className="f-rund" onClick={() => blaettern(1)} disabled={monat >= dieser} aria-label="Monat danach">
            <IconRight />
          </button>
        </div>
        <div className="f-kal">
          {WOCHENTAGE.map((w) => (
            <span key={w} className="f-kal-wt" aria-hidden="true">
              {w}
            </span>
          ))}
          {Array.from({ length: leer }, (_, i) => (
            <span key={`l${i}`} />
          ))}
          {tage.map((tag) => {
            const n = Number(tag.slice(8))
            if (tag > heute) {
              return (
                <span key={tag} className="f-kal-tag zukunft">
                  {n}
                </span>
              )
            }
            const an = proTag.get(tag)
            const klasse = `f-kal-tag${an ? ' trainiert' : ''}${an?.some(mitPr) ? ' pr' : ''}${tag === heute ? ' heute' : ''}${
              tag === gewaehlt ? ' gewaehlt' : ''
            }`
            return (
              <button
                key={tag}
                type="button"
                className={klasse}
                aria-pressed={tag === gewaehlt}
                aria-label={`${formatTagLang(tag)}: ${an ? anzahl(an.length) : 'kein Training'}`}
                onClick={() => setGewaehlt((g) => (g === tag ? null : tag))}
              >
                {n}
              </button>
            )
          })}
        </div>
      </section>

      {gewaehlt ? (
        <div className="f-h2-zeile">
          <h2 className="f-h2">{relativTag(gewaehlt, heute)}</h2>
          <button type="button" className="f-textlink" onClick={() => setGewaehlt(null)}>
            Ganzer Monat
          </button>
        </div>
      ) : null}
      {liste.length ? (
        <div className="f-gruppe">
          {liste.map((t) => (
            <button key={t.id} type="button" className="f-tr" onClick={() => push({ name: 'training', id: t.id })}>
              <span className="f-tr-tag">{gewaehlt ? formatUhr(t.start) : relativTag(tagVon(t), heute)}</span>
              <b>{t.name}</b>
              <span className="f-tr-r">
                {mitPr(t) ? <span className="f-tag-pr">PR</span> : null}
                {formatDauer((t.ende ?? t.start) - t.start)}
                <IconRight />
              </span>
            </button>
          ))}
        </div>
      ) : gewaehlt ? (
        <button type="button" className="f-leerbtn" onClick={() => push({ name: 'nachtragen', tag: gewaehlt })}>
          <IconPlus />
          Training nachtragen
        </button>
      ) : null}
    </Seite>
  )
}

export default Kalender
