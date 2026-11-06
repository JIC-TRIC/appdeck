import { useState } from 'react'
import { farbe } from '../farben'
import {
  enthaelt,
  hm,
  periodeEnde,
  periodeTitel,
  periodeVon,
  summe,
  tagStart,
  vergleich,
  verschiebe,
  zeilen,
} from '../zeit'
import { Bon, IconLinks, IconRechts, Kopf, mitFarbe, Strich, Zurueck } from '../ui'
import type { Art, Bereich, Block, Laeuft, Periode } from '../types'

interface Props {
  periode: Periode
  heute: string
  jetzt: number
  bereiche: Bereich[]
  bloecke: Block[]
  laeuft: Laeuft | null
  zurueck: string
  onZurueck: () => void
  /** anderer Zeitraum auf derselben Seite (Segment, Pfeile) */
  onPeriode: (p: Periode) => void
  /** eine Zeile antippen: ein Tag oder ein kleinerer Zeitraum als neue Seite */
  onTag: (tag: string) => void
  onOeffnen: (p: Periode) => void
}

const ARTEN: [Art, string][] = [
  ['woche', 'Woche'],
  ['monat', 'Monat'],
  ['jahr', 'Jahr'],
]
const VGL: Record<Art, string> = { woche: 'zur Vorwoche', monat: 'zum Vormonat', jahr: 'zum Vorjahr' }
const prozent = (teil: number, ganz: number) => `${Math.round((teil / ganz) * 100)} %`

// Ein Zeitraum als Bon: eine Zeile je Tag, Woche oder Monat mit Balken nach
// Bereichen, darunter Summe, Vergleich und die Verteilung.
export function Statistik({ periode, heute, jetzt, bereiche, bloecke, laeuft, zurueck, onZurueck, onPeriode, onTag, onOeffnen }: Props) {
  const [offen, setOffen] = useState<string | null>(null)
  const rang = new Map(bereiche.map((b, i) => [b.id, i]))
  const ordnen = (ids: Iterable<string>) => [...ids].sort((a, b) => (rang.get(a) ?? 1e9) - (rang.get(b) ?? 1e9))
  const bereich = (id: string) => bereiche.find((b) => b.id === id)

  const zs = zeilen(periode, heute).map((z) => ({ ...z, s: summe(bloecke, laeuft, tagStart(z.von), tagStart(z.bis), jetzt) }))
  const ges = summe(bloecke, laeuft, tagStart(periode.tag), tagStart(periodeEnde(periode)), jetzt)
  const max = Math.max(1, ...zs.map((z) => z.s.tot))
  const vgl = vergleich(bloecke, laeuft, periode, jetzt)
  const weiter = verschiebe(periode, 1).tag <= heute
  const anteile = [...ges.je.entries()].sort((a, b) => b[1] - a[1])

  return (
    <div className="p-seite">
      <Kopf links={<Zurueck label={zurueck} onClick={onZurueck} />} mitte="Statistik" />
      <div className="p-seg" role="tablist">
        {ARTEN.map(([a, t]) => (
          <button
            type="button"
            key={a}
            role="tab"
            aria-selected={a === periode.art}
            className={a === periode.art ? 'an' : ''}
            onClick={() => onPeriode(periodeVon(a, enthaelt(periode, heute) ? heute : periode.tag))}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-scroll">
        <Bon>
          <div className="p-bon-kopf">
            <div className="p-datum">
              <button type="button" className="p-pfeil" aria-label="Davor" onClick={() => onPeriode(verschiebe(periode, -1))}>
                <IconLinks />
              </button>
              <span className="p-dat">{periodeTitel(periode)}</span>
              <button type="button" className={`p-pfeil${weiter ? '' : ' weg'}`} aria-label="Danach" disabled={!weiter} onClick={() => onPeriode(verschiebe(periode, 1))}>
                <IconRechts />
              </button>
            </div>
          </div>
          <Strich />
          {zs.map((z) => (
            <button
              type="button"
              key={z.von}
              className={`p-zeile${z.zukunft ? ' zukunft' : ''}`}
              disabled={z.zukunft}
              onClick={() => (z.ziel.art === 'tag' ? onTag(z.ziel.tag) : onOeffnen(z.ziel.periode))}
            >
              <span>{z.label}</span>
              <span className="p-balken">
                {ordnen(z.s.je.keys()).map((id) => (
                  <i key={id} style={{ ...mitFarbe(farbe(bereich(id)?.farbe ?? 0)), width: `${(z.s.je.get(id)! / max) * 100}%` }} />
                ))}
              </span>
              <span className="d">{z.s.tot ? hm(z.s.tot) : '–'}</span>
            </button>
          ))}
          <Strich />
          <div className="p-summe">
            <span>Summe</span>
            <b>{hm(ges.tot)} h</b>
          </div>
          <div className="p-doppel" />
          {vgl !== null ? (
            <p className="p-vgl">
              {vgl >= 0 ? '+' : '−'}
              {hm(Math.abs(vgl))} {VGL[periode.art]}
            </p>
          ) : null}
          {anteile.length ? <Strich /> : null}
          {anteile.map(([id, ms]) => {
            const b = bereich(id)
            const taet = [...(ges.taet.get(id) ?? new Map<string | null, number>()).entries()].sort((x, y) => y[1] - x[1])
            const teilbar = taet.length > 1 || (taet.length === 1 && taet[0][0] !== null)
            const auf = offen === id && teilbar
            return (
              <div key={id}>
                <button
                  type="button"
                  className={`p-anteil${teilbar ? ' teilbar' : ''}${auf ? ' auf' : ''}`}
                  aria-expanded={teilbar ? auf : undefined}
                  onClick={() => teilbar && setOffen(auf ? null : id)}
                >
                  <span className="n">
                    <i style={mitFarbe(farbe(b?.farbe ?? 0))} />
                    {b?.name ?? '?'}
                  </span>
                  <span>{prozent(ms, ges.tot)}</span>
                  <span className="d">{hm(ms)}</span>
                </button>
                {auf
                  ? taet.map(([tid, tms]) => (
                      <div key={tid ?? 'ohne'} className="p-anteil kind">
                        <span className="n">{tid ? (b?.taetigkeiten.find((t) => t.id === tid)?.name ?? '?') : 'ohne Tätigkeit'}</span>
                        <span>{prozent(tms, ms)}</span>
                        <span className="d">{hm(tms)}</span>
                      </div>
                    ))
                  : null}
              </div>
            )
          })}
        </Bon>
      </div>
    </div>
  )
}
