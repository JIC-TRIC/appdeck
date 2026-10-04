import { useState } from 'react'
import { Blatt, BlattKopf, Schalter } from '../ui'
import { FRUEHESTES_JAHR, ZEITRAEUME, diesesJahr, jahre, pruefeEigenen } from '../wochentag'
import type { Einstellungen, ZeitraumId } from '../types'

// Zeitraum und Uhr. Jede Wahl gilt sofort; der Wochentag zieht dann ein neues Datum.
export default function ZeitraumBlatt({
  einst,
  aendere,
  onClose,
}: {
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
  onClose: () => void
}) {
  const jahr = new Date().getFullYear()
  const z = einst.zeitraum
  const jetzt = jahre(z, jahr)
  const [von, setVon] = useState(String(jetzt.von))
  const [bis, setBis] = useState(String(jetzt.bis))
  const [eigenOffen, setEigenOffen] = useState(z.id === 'eigen')
  const [fehler, setFehler] = useState<string | null>(null)
  const dj = diesesJahr(jahr)

  const unterzeile: Record<ZeitraumId, string> = {
    jahr: `${jahr} · du rechnest nur Tag + Monat${dj.rest ? ` + ${dj.rest}` : ''}`,
    '1900': 'Jahrhundertzahl 0 oder 6',
    '1600': 'alle acht Jahrhundertzahlen',
    eigen: `beliebige Jahre ab ${FRUEHESTES_JAHR}`,
  }

  const uebernimmEigenen = () => {
    const v = Number(von)
    const b = Number(bis)
    const f = pruefeEigenen(v, b)
    setFehler(f)
    if (!f) aendere({ zeitraum: { id: 'eigen', von: v, bis: b } })
  }

  const waehle = (id: ZeitraumId) => {
    if (id === 'eigen') {
      setEigenOffen(true)
      uebernimmEigenen()
      return
    }
    const v = ZEITRAEUME.find((x) => x.id === id)!
    aendere({ zeitraum: { id, von: v.von ?? jahr, bis: v.bis ?? jahr } })
    setEigenOffen(false)
    setFehler(null)
  }

  return (
    <Blatt label="Zeitraum" onClose={onClose}>
      {(zu) => (
        <div className="l-sheet-pad">
          <BlattKopf titel="Zeitraum" onClose={zu} />
          <div role="radiogroup" aria-label="Zeitraum" className="l-radios">
            {ZEITRAEUME.map((v) => {
              const an = z.id === v.id
              return (
                <div key={v.id} className="l-radio-block">
                  <button type="button" role="radio" aria-checked={an} className={`l-radio${an ? ' an' : ''}`} onClick={() => waehle(v.id)}>
                    <span className="l-radio-punkt" />
                    <span className="l-radio-text">
                      <span className={v.id === '1900' || v.id === '1600' ? 'l-num' : ''}>{v.name}</span>
                      <small>{unterzeile[v.id]}</small>
                    </span>
                  </button>
                  {v.id === 'eigen' && eigenOffen ? (
                    <div className="l-eigen">
                      <div className="l-eigen-felder">
                        <label>
                          von
                          <input
                            type="number"
                            inputMode="numeric"
                            min={FRUEHESTES_JAHR}
                            max={9999}
                            value={von}
                            onChange={(e) => setVon(e.target.value)}
                            onBlur={uebernimmEigenen}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          />
                        </label>
                        <span className="l-bis">–</span>
                        <label>
                          bis
                          <input
                            type="number"
                            inputMode="numeric"
                            min={FRUEHESTES_JAHR}
                            max={9999}
                            value={bis}
                            onChange={(e) => setBis(e.target.value)}
                            onBlur={uebernimmEigenen}
                            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                          />
                        </label>
                      </div>
                      {fehler ? <p className="l-fehler">{fehler}</p> : null}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="l-zeile-schalter">
            <span>
              <span className="l-zs-titel">Uhr anzeigen</span>
              <small>Gemessen wird trotzdem. Gilt auch fürs Kartendeck.</small>
            </span>
            <Schalter an={einst.uhr} label="Uhr anzeigen" onChange={(uhr) => aendere({ uhr })} />
          </div>
        </div>
      )}
    </Blatt>
  )
}
