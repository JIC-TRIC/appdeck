import { useCallback, useRef, useState } from 'react'
import { IonModal } from '@ionic/react'
import { vorladen } from '../bilder'
import { KARTEN, bestzeiten, mische, wertung, type Antworten } from '../karten'
import { getVersuche, kartenZuruecksetzen, speichereVersuch } from '../store'
import type { Einstellungen, Versuch } from '../types'
import KartenStart from './KartenStart'
import Merken from './Merken'
import Wiedergeben from './Wiedergeben'
import Auswertung, { type Ergebnis } from './Auswertung'

// Reiter Karten: Start oder Auswertung im Reiter, Merken und Wiedergeben als
// Vollbild darueber (ohne Tab-Leiste).

interface Lauf {
  deck: string[]
  takt: number | null
  merkStart: number
  merkZeit: number
  wiederStart: number
}

type Phase = 'start' | 'merken' | 'wiedergabe' | 'auswertung'

export default function Karten({
  aktiv,
  einst,
  aendere,
}: {
  aktiv: boolean
  einst: Einstellungen
  aendere: (patch: Partial<Einstellungen>) => void
}) {
  const [versuche, setVersuche] = useState(getVersuche)
  const [phase, setPhase] = useState<Phase>('start')
  const [lauf, setLauf] = useState<Lauf | null>(null)
  const [ergebnis, setErgebnis] = useState<Ergebnis | null>(null)

  const starte = () => {
    const deck = mische(KARTEN.map((k) => k.id)).slice(0, einst.deck.anzahl)
    vorladen(deck)
    setLauf({ deck, takt: einst.deck.taktAn ? einst.deck.takt : null, merkStart: Date.now(), merkZeit: 0, wiederStart: 0 })
    setPhase('merken')
  }

  const gemerkt = useCallback(() => {
    const jetzt = Date.now()
    setLauf((l) => l && { ...l, merkZeit: jetzt - l.merkStart, wiederStart: jetzt })
    setPhase('wiedergabe')
  }, [])

  const abgeben = (antworten: Antworten) => {
    if (!lauf) return
    const jetzt = Date.now()
    const w = wertung(lauf.deck, antworten)
    const bisher = bestzeiten(versuche)[w.n]
    const versuch: Versuch = {
      zeit: jetzt,
      n: w.n,
      bisFehler: w.bisFehler,
      richtig: w.richtig,
      merk: Math.round(lauf.merkZeit),
      wieder: Math.round(jetzt - lauf.wiederStart),
      takt: lauf.takt,
    }
    setVersuche(speichereVersuch(versuch))
    setErgebnis({ versuch, deck: lauf.deck, antworten, neuerRekord: w.richtig === w.n && (bisher === null || versuch.merk < bisher) })
    setPhase('auswertung')
  }

  const abbrechen = useCallback(() => setPhase('start'), [])

  // Waehrend das Vollbild zugeht, bleibt sein letzter Inhalt stehen.
  const vollbild = phase === 'merken' || phase === 'wiedergabe'
  const zuletzt = useRef<'merken' | 'wiedergabe'>('merken')
  if (vollbild) zuletzt.current = phase
  const sicht = vollbild ? phase : zuletzt.current

  return (
    <div className="l-screen" hidden={!aktiv}>
      {phase === 'auswertung' && ergebnis ? (
        <Auswertung ergebnis={ergebnis} onNeu={starte} onEinstellungen={() => setPhase('start')} />
      ) : (
        <KartenStart
          einst={einst}
          aendere={aendere}
          versuche={versuche}
          onStart={starte}
          onReset={() => setVersuche(kartenZuruecksetzen())}
        />
      )}

      <IonModal isOpen={vollbild} className="l-full-modal" aria-label="Kartendeck">
        {lauf && sicht === 'merken' ? (
          <Merken
            key={`m:${lauf.merkStart}`}
            deck={lauf.deck}
            start={lauf.merkStart}
            uhrAn={einst.uhr}
            takt={lauf.takt}
            onFertig={gemerkt}
            onAbbrechen={abbrechen}
          />
        ) : null}
        {lauf && sicht === 'wiedergabe' ? (
          <Wiedergeben
            key={`w:${lauf.merkStart}`}
            n={lauf.deck.length}
            start={lauf.wiederStart}
            uhrAn={einst.uhr}
            onAbgeben={abgeben}
            onAbbrechen={abbrechen}
          />
        ) : null}
      </IonModal>
    </div>
  )
}
