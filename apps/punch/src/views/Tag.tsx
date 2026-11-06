import { useRef } from 'react'
import { farbe } from '../farben'
import { datumLang, hm, hms, plusTage, postenAm, tagEnde, uhr, type Posten } from '../zeit'
import { Bon, haptik, IconBereiche, IconLinks, IconRechts, IconStatistik, IconStopp, Kopf, mitFarbe, Strich, Zurueck, zumLauncher } from '../ui'
import type { Bereich, Block, Laeuft } from '../types'

interface Props {
  tag: string
  heute: string
  jetzt: number
  bereiche: Bereich[]
  bloecke: Block[]
  laeuft: Laeuft | null
  /** Als Seite ueber der Statistik: Beschriftung des Zurueck-Knopfs. Ohne = Startseite. */
  zurueck?: string
  onZurueck?: () => void
  /** Nur auf der Startseite: blaettern zwischen den Tagen */
  onTag?: (tag: string) => void
  onStatistik?: () => void
  onBereiche?: () => void
  onPosten: (p: Posten) => void
  onNachtragen: () => void
  onStart?: (bereich: string) => void
  onLang?: (bereich: string) => void
  onStopp?: () => void
  onNeuerBereich?: () => void
}

/** Name eines Bereichs, mit Taetigkeit: „UNI/STATISTIK“. */
export function postenName(bereiche: Bereich[], bereich: string, taetigkeit: string | null) {
  const b = bereiche.find((x) => x.id === bereich)
  const t = taetigkeit ? b?.taetigkeiten.find((x) => x.id === taetigkeit) : undefined
  return `${b?.name ?? '?'}${t ? `/${t.name}` : ''}`
}

const LANG_MS = 450

/** Ein Knopf fuer einen Bereich: Tipp startet, langer Druck zeigt die Taetigkeiten. */
function Taste({ bereich, an, onTipp, onLang }: { bereich: Bereich; an: boolean; onTipp: () => void; onLang: () => void }) {
  const timer = useRef(0)
  const lang = useRef(false)
  const weg = () => window.clearTimeout(timer.current)
  return (
    <button
      type="button"
      className={`p-taste${an ? ' an' : ''}`}
      style={mitFarbe(farbe(bereich.farbe))}
      aria-pressed={an}
      onPointerDown={() => {
        lang.current = false
        weg()
        timer.current = window.setTimeout(() => {
          lang.current = true
          haptik()
          onLang()
        }, LANG_MS)
      }}
      onPointerUp={weg}
      onPointerLeave={weg}
      onPointerCancel={weg}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        if (lang.current) {
          lang.current = false
          return
        }
        onTipp()
      }}
    >
      <i />
      <span>{bereich.name}</span>
    </button>
  )
}

// Ein Tag als Kassenbon: jede Zeile ein Block, unten die Summe. Auf der
// Startseite und nur heute darunter die Knoepfe der Bereiche und Stopp.
export function Tag(p: Props) {
  const { tag, heute, jetzt, bereiche, bloecke, laeuft } = p
  const posten = postenAm(bloecke, laeuft, tag, jetzt)
  const summe = posten.reduce((s, x) => s + x.dauer, 0)
  const istHeute = tag === heute
  const start = !p.zurueck
  const aktiv = bereiche.filter((b) => !b.archiviert)

  return (
    <div className="p-seite">
      <Kopf
        links={start ? <Zurueck label="Apps" onClick={zumLauncher} /> : <Zurueck label={p.zurueck!} onClick={p.onZurueck!} />}
        rechts={
          start ? (
            <>
              <button type="button" className="p-ic" aria-label="Statistik" onClick={p.onStatistik}>
                <IconStatistik />
              </button>
              <button type="button" className="p-ic" aria-label="Bereiche" onClick={p.onBereiche}>
                <IconBereiche />
              </button>
            </>
          ) : null
        }
      />
      <div className="p-scroll">
        <Bon>
          <div className="p-bon-kopf">
            <b className="p-marke">PUNCH</b>
            <div className="p-datum">
              {p.onTag ? (
                <button type="button" className="p-pfeil" aria-label="Tag davor" onClick={() => p.onTag!(plusTage(tag, -1))}>
                  <IconLinks />
                </button>
              ) : null}
              <button type="button" className="p-dat" disabled={!p.onTag || istHeute} onClick={() => p.onTag?.(heute)}>
                {datumLang(tag)}
              </button>
              {p.onTag ? (
                <button type="button" className={`p-pfeil${istHeute ? ' weg' : ''}`} aria-label="Tag danach" disabled={istHeute} onClick={() => p.onTag!(plusTage(tag, 1))}>
                  <IconRechts />
                </button>
              ) : null}
            </div>
          </div>
          <Strich />
          {posten.map((x) => {
            const live = x.id === null
            const bis = live ? '     ' : x.bis === tagEnde(tag) ? '24:00' : uhr(x.bis)
            return (
              <button type="button" key={x.id ?? 'laeuft'} className={`p-posten${live ? ' live' : ''}`} onClick={() => p.onPosten(x)}>
                <span className="z">{`${uhr(x.von)}–${bis}`}</span>
                <span className="n">
                  <i style={mitFarbe(farbe(bereiche.find((b) => b.id === x.bereich)?.farbe ?? 0))} />
                  {postenName(bereiche, x.bereich, x.taetigkeit)}
                </span>
                <span className="d">{live ? hms(x.dauer) : hm(x.dauer)}</span>
              </button>
            )
          })}
          {bereiche.length ? (
            <button type="button" className="p-nach" onClick={p.onNachtragen}>
              + Nachtragen
            </button>
          ) : null}
          {posten.length || bereiche.length ? <Strich /> : null}
          <div className="p-summe">
            <span>Summe</span>
            <b>{hm(summe)} h</b>
          </div>
          <div className="p-doppel" />
        </Bon>

        {start && istHeute ? (
          aktiv.length ? (
            <>
              <div className="p-tasten">
                {aktiv.map((b) => (
                  <Taste
                    key={b.id}
                    bereich={b}
                    an={laeuft?.bereich === b.id}
                    onTipp={() => p.onStart?.(b.id)}
                    onLang={() => p.onLang?.(b.id)}
                  />
                ))}
              </div>
              {laeuft ? (
                <button type="button" className="p-stopp" onClick={p.onStopp}>
                  <IconStopp />
                  Stopp
                </button>
              ) : null}
            </>
          ) : (
            <div className="p-erst">
              <p>Was zählt für dich als produktiv?</p>
              <button type="button" className="p-neu" onClick={p.onNeuerBereich}>
                + Bereich anlegen
              </button>
            </div>
          )
        ) : null}
      </div>
    </div>
  )
}
