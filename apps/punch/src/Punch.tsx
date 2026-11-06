import { useCallback, useEffect, useMemo, useState } from 'react'
import { useIonActionSheet, useIonAlert, useIonToast, type ActionSheetButton } from '@ionic/react'
import { PageStage } from '@lib/PageStage'
import { useHistoryStack } from '@lib/useHistoryStack'
import {
  aendereLaeuft,
  auswahl,
  belegt,
  bereicheSortieren,
  getBereiche,
  getBloecke,
  getLaeuft,
  loescheBlock,
  NAME_MAX,
  schnappschuss,
  speichereBlock,
  starte,
  stelleHer,
  stoppe,
  taetigkeitAnlegen,
  type Gestoppt,
} from './store'
import { datumKurz, hm, periodeVon, tagVon, wochentag, type Posten } from './zeit'
import { haptik } from './ui'
import { BereichBlatt } from './views/BereichBlatt'
import { Bereiche } from './views/Bereiche'
import { BlockBlatt } from './views/BlockBlatt'
import { Statistik } from './views/Statistik'
import { Tag } from './views/Tag'
import type { View } from './types'

type Offen = { art: 'neu'; tag: string } | { art: 'block'; id: string } | { art: 'laeuft' } | { art: 'bereich'; id: string | null }

/** Die Uhr: jede Sekunde, solange ein Timer laeuft, sonst alle 30 Sekunden - und sofort beim Zurueckkommen. */
function useJetzt(schnell: boolean) {
  const [jetzt, setJetzt] = useState(() => Date.now())
  useEffect(() => {
    const neu = () => setJetzt(Date.now())
    neu()
    const id = window.setInterval(neu, schnell ? 1000 : 30_000)
    document.addEventListener('visibilitychange', neu)
    window.addEventListener('focus', neu)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', neu)
      window.removeEventListener('focus', neu)
    }
  }, [schnell])
  return jetzt
}

const titelVon = (v: View) => (v.name === 'statistik' ? 'Statistik' : v.name === 'bereiche' ? 'Bereiche' : `${wochentag(v.tag)} ${datumKurz(v.tag)}`)

// Startseite ist der Tag als Bon, darueber Seiten fuer Statistik, Bereiche und
// einzelne Tage aus der Statistik - Seitenwechsel mit Zurueckwischen wie in
// Kontor und Tick (lib/PageStage.tsx). Blaetter von unten fuer Bloecke und Bereiche.
function Punch() {
  // Ein Zaehler statt einzelner Zustaende: nach jeder Aenderung wird alles neu
  // aus dem Speicher gelesen (wie bei den anderen Apps).
  const [rev, setRev] = useState(0)
  const refresh = useCallback(() => setRev((r) => r + 1), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const daten = useMemo(() => ({ bereiche: getBereiche(), bloecke: getBloecke(), laeuft: getLaeuft() }), [rev])
  const jetzt = useJetzt(daten.laeuft !== null)
  const heute = tagVon(jetzt)

  // Der Tag auf der Startseite. Steht er auf heute, bleibt er nach Mitternacht auf heute.
  const [tag, setTag] = useState(heute)
  const [warHeute, setWarHeute] = useState(heute)
  if (warHeute !== heute) {
    setWarHeute(heute)
    if (tag === warHeute) setTag(heute)
  }

  const { stack, push, replace, back } = useHistoryStack<View>(() => [])
  const [offen, setOffen] = useState<Offen | null>(null)

  const [zeigeToast, schliesseToast] = useIonToast()
  const melde = useCallback(
    (message: string, rueckgaengig?: () => void) => {
      schliesseToast().catch(() => {})
      zeigeToast({
        message,
        duration: rueckgaengig ? 5000 : 2000,
        position: 'top',
        cssClass: 'p-toast',
        swipeGesture: 'vertical',
        buttons: rueckgaengig ? [{ text: 'Rückgängig', handler: rueckgaengig }] : undefined,
      })
    },
    [zeigeToast, schliesseToast],
  )
  const [frage] = useIonAlert()
  const [aktion] = useIonActionSheet()

  const name = (id: string) => daten.bereiche.find((b) => b.id === id)?.name ?? '?'

  /** Meldung nach Stoppen oder Wechseln, mit Rueckgaengig. */
  const meldeGestoppt = (g: Gestoppt, s: ReturnType<typeof schnappschuss>) =>
    melde(g.block ? `${name(g.war.bereich)} gestoppt · ${hm(g.block.ende - g.block.start)}` : `${name(g.war.bereich)} unter 1 Minute, nicht gezählt`, () => {
      stelleHer(s)
      refresh()
    })

  // ---------- Timer ----------

  const starten = (bereich: string, taetigkeit: string | null) => {
    const s = schnappschuss()
    const g = starte(bereich, taetigkeit)
    haptik()
    refresh()
    if (g) meldeGestoppt(g, s)
  }

  const stoppen = () => {
    const s = schnappschuss()
    const g = stoppe()
    refresh()
    if (g) meldeGestoppt(g, s)
  }

  const neueTaetigkeit = (bereich: string) =>
    new Promise<string | null>((fertig) => {
      let id: string | null = null
      frage({
        header: 'Neue Tätigkeit',
        cssClass: 'p-alert',
        inputs: [{ name: 'name', placeholder: 'z. B. Statistik', attributes: { maxlength: NAME_MAX, autocapitalize: 'sentences' } }],
        buttons: [
          { text: 'Abbrechen', role: 'cancel' },
          {
            text: 'Anlegen',
            handler: (v: { name: string }) => {
              id = taetigkeitAnlegen(bereich, v.name)
              // Leer: Frage bleibt offen.
              if (!id) return false
              refresh()
              return true
            },
          },
        ],
        onDidDismiss: () => fertig(id),
      })
    })

  // Langer Druck: mit welcher Taetigkeit starten (zuletzt genutzte zuerst).
  const lang = (bereich: string) => {
    const b = daten.bereiche.find((x) => x.id === bereich)
    if (!b) return
    const buttons: ActionSheetButton[] = auswahl(b).map((t) => ({ text: t.name, handler: () => starten(b.id, t.id) }))
    buttons.push(
      { text: 'Ohne Tätigkeit', handler: () => starten(b.id, null) },
      {
        text: 'Neue Tätigkeit',
        handler: () => {
          neueTaetigkeit(b.id).then((id) => {
            if (id) starten(b.id, id)
          })
        },
      },
      { text: 'Abbrechen', role: 'cancel' },
    )
    aktion({ header: `${b.name} starten mit`, cssClass: 'p-as', buttons })
  }

  // ---------- Bloecke ----------

  const loeschen = (id: string) => {
    const s = schnappschuss()
    loescheBlock(id)
    refresh()
    melde('Block gelöscht', () => {
      stelleHer(s)
      refresh()
    })
  }

  const posten = (p: Posten) => setOffen(p.id === null ? { art: 'laeuft' } : { art: 'block', id: p.id })

  // ---------- Seiten ----------

  const tagSeite = (t: string, zurueck?: string) => (
    <Tag
      tag={t}
      heute={heute}
      jetzt={jetzt}
      bereiche={daten.bereiche}
      bloecke={daten.bloecke}
      laeuft={daten.laeuft}
      zurueck={zurueck}
      onZurueck={back}
      onTag={zurueck ? undefined : setTag}
      onStatistik={() => push({ name: 'statistik', periode: periodeVon('woche', heute) })}
      onBereiche={() => push({ name: 'bereiche' })}
      onPosten={posten}
      onNachtragen={() => setOffen({ art: 'neu', tag: t })}
      onStart={(b) => {
        if (daten.laeuft?.bereich !== b) starten(b, null)
      }}
      onLang={lang}
      onStopp={stoppen}
      onNeuerBereich={() => setOffen({ art: 'bereich', id: null })}
    />
  )

  const seite = (view: View | null, i: number) => {
    if (!view) return tagSeite(tag)
    const zurueck = i > 0 ? titelVon(stack[i - 1]) : 'Punch'
    if (view.name === 'tag') return tagSeite(view.tag, zurueck)
    if (view.name === 'bereiche')
      return (
        <Bereiche
          bereiche={daten.bereiche}
          zurueck={zurueck}
          onZurueck={back}
          onBearbeiten={(id) => setOffen({ art: 'bereich', id })}
          onNeu={() => setOffen({ art: 'bereich', id: null })}
          onSortiert={(ids) => {
            bereicheSortieren(ids)
            refresh()
          }}
        />
      )
    return (
      <Statistik
        periode={view.periode}
        heute={heute}
        jetzt={jetzt}
        bereiche={daten.bereiche}
        bloecke={daten.bloecke}
        laeuft={daten.laeuft}
        zurueck={zurueck}
        onZurueck={back}
        onPeriode={(periode) => replace({ name: 'statistik', periode })}
        onTag={(t) => push({ name: 'tag', tag: t })}
        onOeffnen={(periode) => push({ name: 'statistik', periode })}
      />
    )
  }

  // ---------- Blaetter ----------

  const blatt = () => {
    if (!offen) return null
    const zu = () => setOffen(null)
    if (offen.art === 'bereich') {
      const b = offen.id ? daten.bereiche.find((x) => x.id === offen.id) : null
      if (offen.id && !b) return null
      return (
        <BereichBlatt
          key={offen.id ?? 'neu'}
          bereich={b ?? null}
          alle={daten.bereiche}
          belegt={belegt()}
          onClose={zu}
          onGeaendert={refresh}
          onMeldung={(t) => melde(t)}
        />
      )
    }
    const block = offen.art === 'block' ? daten.bloecke.find((x) => x.id === offen.id) : undefined
    if (offen.art === 'block' && !block) return null
    if (offen.art === 'laeuft' && !daten.laeuft) return null
    const modus =
      offen.art === 'neu' ? { art: 'neu' as const, tag: offen.tag } : block ? { art: 'block' as const, block } : { art: 'laeuft' as const, laeuft: daten.laeuft! }
    return (
      <BlockBlatt
        key={offen.art === 'block' ? offen.id : offen.art}
        modus={modus}
        bereiche={daten.bereiche}
        bloecke={daten.bloecke}
        laeuft={daten.laeuft}
        heute={heute}
        jetzt={jetzt}
        onClose={zu}
        onSichern={(e) => {
          const f = modus.art === 'laeuft' ? aendereLaeuft(e) : speichereBlock(e, block?.id ?? null)
          if (!f) refresh()
          return f
        }}
        onLoeschen={() => block && loeschen(block.id)}
        onStoppen={stoppen}
        onNeueTaetigkeit={neueTaetigkeit}
      />
    )
  }

  return (
    <div className="punch">
      <PageStage
        className="p-buehne"
        pages={stack}
        rootKey="tag"
        // Statistik und Tage wechseln den Zeitraum auf derselben Seite - ohne Fahrt.
        pageKey={(v, i) => `${i}:${v.name}`}
        render={seite}
        onBack={back}
        swipe={!offen}
      />
      {blatt()}
    </div>
  )
}

export default Punch
