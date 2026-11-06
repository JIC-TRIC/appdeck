import { useState } from 'react'
import { farbe } from '../farben'
import { auswahl, NOTIZ_MAX, type Eingabe } from '../store'
import {
  datumKurz,
  endeDavor,
  endeNach,
  hm,
  istTag,
  LAEUFT,
  MIN,
  minuten,
  plusTage,
  pruefeBlock,
  pruefeStart,
  startDanach,
  tagStart,
  tagVon,
  uhr,
  uhrMinuten,
  zeitpunkt,
  type Fehler,
} from '../zeit'
import { Blatt, BlattKopf, Feld, mitFarbe } from '../ui'
import { postenName } from './Tag'
import type { Bereich, Block, Laeuft } from '../types'

export type Modus = { art: 'neu'; tag: string } | { art: 'block'; block: Block } | { art: 'laeuft'; laeuft: Laeuft }

interface Props {
  modus: Modus
  bereiche: Bereich[]
  bloecke: Block[]
  laeuft: Laeuft | null
  heute: string
  jetzt: number
  onClose: () => void
  /** Sichern - zurueck kommt der Fehler, sonst null */
  onSichern: (e: Eingabe) => Fehler | null
  onLoeschen: () => void
  onStoppen: () => void
  onNeueTaetigkeit: (bereich: string) => Promise<string | null>
}

const TAG_MS = 24 * 60 * MIN

/** Vorschlag fuer einen neuen Block: Anschluss an den letzten Block des Tages (sonst 8 Uhr), eine Stunde lang, hoechstens bis jetzt. */
function vorschlag(tag: string, bloecke: Block[], jetzt: number) {
  const davor = endeDavor(bloecke, tagStart(plusTage(tag, 1)), null)
  const start = davor !== null && tagVon(davor) === tag ? davor : zeitpunkt(tag, 8 * 60)
  const jetztMinute = Math.floor(jetzt / MIN) * MIN
  return { start, ende: Math.min(start + 60 * MIN, Math.max(start, jetztMinute)) }
}

// Ein Block als Blatt: Bereich, Taetigkeit, Notiz, Tag und Uhrzeiten. Fuer den
// laufenden Block nur der Start - er laeuft bis jetzt. Ueberschneidungen
// zeigt es sofort, Sichern geht dann nicht.
export function BlockBlatt({ modus, bereiche, bloecke, laeuft, heute, jetzt, onClose, onSichern, onLoeschen, onStoppen, onNeueTaetigkeit }: Props) {
  const quelle = modus.art === 'block' ? modus.block : modus.art === 'laeuft' ? modus.laeuft : null
  const erst = modus.art === 'neu' ? vorschlag(modus.tag, bloecke, jetzt) : null
  const [bereich, setBereich] = useState(quelle?.bereich ?? bereiche.find((b) => !b.archiviert)?.id ?? '')
  const [taetigkeit, setTaetigkeit] = useState<string | null>(quelle?.taetigkeit ?? null)
  const [notiz, setNotiz] = useState(quelle?.notiz ?? '')
  const [start, setStart] = useState(modus.art === 'block' ? modus.block.start : modus.art === 'laeuft' ? modus.laeuft.start : erst!.start)
  const [ende, setEnde] = useState(modus.art === 'block' ? modus.block.ende : (erst?.ende ?? 0))

  const lauf = modus.art === 'laeuft'
  const ohne = modus.art === 'block' ? modus.block.id : lauf ? LAEUFT : null
  const tag = tagVon(start)

  const b = bereiche.find((x) => x.id === bereich)
  const wahlBereiche = bereiche.filter((x) => !x.archiviert || x.id === bereich)
  const wahlTaet = b ? [...auswahl(b), ...b.taetigkeiten.filter((t) => t.archiviert && t.id === taetigkeit)] : []

  const fehler = !b ? { art: 'text' as const, text: 'Erst einen Bereich wählen' } : lauf ? pruefeStart(bloecke, start, jetzt) : pruefeBlock(bloecke, laeuft, start, ende, ohne, jetzt)
  const fehlerText =
    fehler?.art === 'konflikt'
      ? `Überschneidet sich mit ${postenName(bereiche, fehler.mit.bereich, fehler.mit.taetigkeit)} ${uhr(fehler.mit.start)}–${'ende' in fehler.mit ? uhr(fehler.mit.ende) : 'jetzt'}`
      : fehler?.text

  // Getippte Minuten treffen den Rand eines Timer-Blocks nur auf die Minute -
  // liegt er in derselben Minute, gilt sein genauer Rand.
  const randVon = (ms: number) => {
    const d = endeDavor(bloecke, ms + MIN, ohne)
    return d !== null && d > ms && d < ms + MIN ? d : ms
  }
  const randBis = (ms: number) => {
    const n = startDanach(bloecke, laeuft, ms - MIN, ohne)
    return n !== null && n < ms && n > ms - MIN ? n : ms
  }

  const setzeVon = (neu: number) => {
    setStart(neu)
    if (!lauf && !(ende > neu && ende - neu < TAG_MS)) setEnde(endeNach(neu, uhrMinuten(ende)))
  }
  const setzeTag = (t: string) => {
    if (!istTag(t)) return
    const neu = zeitpunkt(t, uhrMinuten(start))
    setStart(neu)
    setEnde(endeNach(neu, uhrMinuten(ende)))
  }

  // Schnellknoepfe: an den Block davor anschliessen, bis zum naechsten oder bis jetzt.
  const davor = endeDavor(bloecke, start, ohne)
  const anschluss = davor !== null && davor !== start && tagVon(davor) === tag && (lauf ? davor <= jetzt : davor < ende) ? davor : null
  const danach = lauf ? null : startDanach(bloecke, laeuft, start, ohne)
  const bisNaechster = danach !== null && danach !== ende && danach - start < TAG_MS ? danach : null
  const jetztMinute = Math.floor(jetzt / MIN) * MIN
  const bisJetzt = !lauf && danach === null && jetztMinute > start && jetztMinute !== ende && jetztMinute - start < TAG_MS ? jetztMinute : null
  const plusTag = Math.round((tagStart(tagVon(ende)) - tagStart(tag)) / TAG_MS)

  const gestern = plusTage(heute, -1)
  const anderer = tag !== heute && tag !== gestern

  return (
    <Blatt label={lauf ? 'Laufender Block' : modus.art === 'neu' ? 'Nachtragen' : 'Block'} onClose={onClose}>
      {(zu) => (
        <>
          <BlattKopf
            titel={lauf ? 'Läuft' : modus.art === 'neu' ? 'Nachtragen' : 'Block'}
            onAbbrechen={zu}
            rechts="Sichern"
            aus={!!fehler}
            onRechts={() => {
              if (!onSichern({ bereich, taetigkeit, notiz, start, ende })) zu()
            }}
          />
          <Feld titel="Bereich">
            <div className="p-chips">
              {wahlBereiche.map((x) => (
                <button
                  type="button"
                  key={x.id}
                  className={`p-chip${x.id === bereich ? ' an' : ''}`}
                  style={mitFarbe(farbe(x.farbe))}
                  aria-pressed={x.id === bereich}
                  onClick={() => {
                    if (x.id === bereich) return
                    setBereich(x.id)
                    setTaetigkeit(null)
                  }}
                >
                  <i />
                  {x.name}
                </button>
              ))}
            </div>
          </Feld>
          {b ? (
            <Feld titel="Tätigkeit">
              <div className="p-chips">
                {wahlTaet.map((t) => (
                  <button
                    type="button"
                    key={t.id}
                    className={`p-chip${t.id === taetigkeit ? ' an' : ''}`}
                    aria-pressed={t.id === taetigkeit}
                    onClick={() => setTaetigkeit(t.id === taetigkeit ? null : t.id)}
                  >
                    {t.name}
                  </button>
                ))}
                <button
                  type="button"
                  className="p-chip leise"
                  onClick={async () => {
                    const id = await onNeueTaetigkeit(b.id)
                    if (id) setTaetigkeit(id)
                  }}
                >
                  + Neu
                </button>
              </div>
            </Feld>
          ) : null}
          <Feld titel="Notiz">
            <input className="p-input" value={notiz} maxLength={NOTIZ_MAX} enterKeyHint="done" onChange={(e) => setNotiz(e.target.value)} />
          </Feld>
          {!lauf ? (
            <Feld titel="Tag">
              <div className="p-chips">
                <button type="button" className={`p-chip${tag === heute ? ' an' : ''}`} onClick={() => setzeTag(heute)}>
                  Heute
                </button>
                <button type="button" className={`p-chip${tag === gestern ? ' an' : ''}`} onClick={() => setzeTag(gestern)}>
                  Gestern
                </button>
                <label className={`p-chip p-datum-chip${anderer ? ' an' : ''}`}>
                  {anderer ? datumKurz(tag) + tag.slice(0, 4) : 'Datum'}
                  <input type="date" value={tag} max={heute} aria-label="Tag" onChange={(e) => setzeTag(e.target.value)} />
                </label>
              </div>
            </Feld>
          ) : null}
          <div className="p-zeiten">
            <label className={`p-zeit${fehler?.art === 'konflikt' ? ' fehler' : ''}`}>
              <span className="p-l">Von</span>
              <input
                type="time"
                value={uhr(start)}
                onChange={(e) => {
                  const m = minuten(e.target.value)
                  if (m !== null) setzeVon(randVon(zeitpunkt(tag, m)))
                }}
              />
            </label>
            {lauf ? (
              <div className="p-zeit still">
                <span className="p-l">Bis</span>
                <span className="p-laeuft">läuft</span>
              </div>
            ) : (
              <label className={`p-zeit${fehler?.art === 'konflikt' ? ' fehler' : ''}`}>
                <span className="p-l">Bis{plusTag > 0 ? ` · +${plusTag} Tag` : ''}</span>
                <input
                  type="time"
                  value={uhr(ende)}
                  onChange={(e) => {
                    const m = minuten(e.target.value)
                    if (m !== null) setEnde(randBis(endeNach(start, m)))
                  }}
                />
              </label>
            )}
          </div>
          {anschluss !== null || bisNaechster !== null || bisJetzt !== null ? (
            <div className="p-chips p-schnell">
              {anschluss !== null ? (
                <button type="button" className="p-chip leise" onClick={() => setzeVon(anschluss)}>
                  Anschließen {uhr(anschluss)}
                </button>
              ) : null}
              {bisNaechster !== null ? (
                <button type="button" className="p-chip leise" onClick={() => setEnde(bisNaechster)}>
                  Bis {uhr(bisNaechster)}
                </button>
              ) : null}
              {bisJetzt !== null ? (
                <button type="button" className="p-chip leise" onClick={() => setEnde(bisJetzt)}>
                  Bis jetzt
                </button>
              ) : null}
            </div>
          ) : null}
          {fehlerText ? <p className="p-fehler">{fehlerText}</p> : null}
          <div className="p-dauer">
            <span>Dauer</span>
            <b>{hm((lauf ? jetzt : ende) - start)}</b>
          </div>
          {modus.art === 'block' ? (
            <button
              type="button"
              className="p-weg"
              onClick={() => {
                onLoeschen()
                zu()
              }}
            >
              Block löschen
            </button>
          ) : null}
          {lauf ? (
            <button
              type="button"
              className="p-weg still"
              onClick={() => {
                onStoppen()
                zu()
              }}
            >
              Stopp
            </button>
          ) : null}
        </>
      )}
    </Blatt>
  )
}
