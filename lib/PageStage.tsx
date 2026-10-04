/*
 * Seitenwechsel wie auf dem iPhone: eine neue Seite faehrt von rechts herein,
 * die alte rueckt ein Stueck nach links und dunkelt ab; zurueck laeuft es
 * umgekehrt. Vom linken Rand laesst sich die Seite mit dem Finger
 * zurueckwischen. Waehrend eines Wechsels stehen zwei Ebenen uebereinander -
 * danach ist wieder nur die oberste eingehaengt. Entstanden in Kontor, genutzt
 * von Kontor und Piano (zusammen mit useHistoryStack).
 *
 *   <PageStage
 *     className="k-buehne"            Hoehe und Farben setzt die App (stage.css)
 *     pages={seiten}                  der Stapel ohne Blaetter, unten zuerst
 *     rootKey="start"                 Schluessel der Startseite
 *     pageKey={(v, i) => `${i}:${v.name}`}
 *     render={(view, index) => view ? <Seite view={view} /> : <Start />}
 *     onBack={back}
 *   />
 */
import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type TouchEvent,
} from 'react'
import './stage.css'

// Ab hier am linken Rand beginnt ein Zurueckwischen.
const RAND_PX = 24
// So weit (Anteil der Breite) oder so schnell, dann geht es zurueck.
const ZURUECK_AB = 0.35
const ZURUECK_TEMPO = 0.5
// So weit rueckt die Seite darunter nach links (wie iOS).
const VERSATZ = 28

const ruhig = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

// Eine Ebene: eine Seite aus dem Stapel oder die Startseite (view null, index -1).
// Der Schluessel haengt an ihrer Lage im Stapel, damit React dieselbe Seite
// waehrend des Wechsels nicht neu aufbaut.
interface Ebene<V> {
  key: string
  view: V | null
  index: number
}

interface Fahrt<V> {
  art: 'vor' | 'zurueck'
  alt: Ebene<V>
  /** Wie weit der Finger die Seite schon gezogen hatte (px). */
  ab: number
}

// Die gehende Seite bleibt stehen, wie sie zuletzt aussah: nach Speichern
// oder Loeschen aendern sich die Daten im selben Moment - ohne das saehe man
// beim Hinausgleiten kurz ein umspringendes Formular.
const Standbild = memo(
  function Standbild({ children }: { still: boolean; children: ReactNode }) {
    return <>{children}</>
  },
  (_vorher, jetzt) => jetzt.still,
)

export interface PageStageProps<V> {
  pages: V[]
  rootKey: string
  pageKey: (view: V, index: number) => string
  /** view null = Startseite (index -1) */
  render: (view: V | null, index: number) => ReactNode
  onBack: () => void
  /** Zurueckwischen erlaubt (z. B. nicht, waehrend ein Blatt offen ist) */
  swipe?: boolean
  /** Wird diese Ebene die oberste, springt sie ohne Fahrt (z. B. Tab-Wechsel). */
  instantFor?: string
  className?: string
}

export function PageStage<V>({
  pages,
  rootKey,
  pageKey,
  render,
  onBack,
  swipe = true,
  instantFor,
  className = '',
}: PageStageProps<V>) {
  const ebeneAn = (i: number): Ebene<V> =>
    i < 0 ? { key: rootKey, view: null, index: -1 } : { key: pageKey(pages[i], i), view: pages[i], index: i }
  const oben = ebeneAn(pages.length - 1)
  const drunter = pages.length ? ebeneAn(pages.length - 2) : null

  const [fahrt, setFahrt] = useState<Fahrt<V> | null>(null)
  const [ziehen, setZiehen] = useState(false)
  const buehne = useRef<HTMLDivElement>(null)
  const obenRef = useRef<HTMLDivElement>(null)
  const drunterRef = useRef<HTMLDivElement>(null)
  const zug = useRef<{ x: number; y: number; dx: number; quer: boolean; lastX: number; lastT: number; v: number } | null>(null)
  // Wie weit die Seite beim Loslassen schon gezogen war.
  const zugWeg = useRef(0)

  // Wechselt die oberste Seite, beginnt die Fahrt - noch in diesem Render,
  // damit die alte Seite gar nicht erst ausgehaengt wird.
  const [zuletzt, setZuletzt] = useState({ key: oben.key, ebene: oben, tiefe: pages.length })
  if (zuletzt.key !== oben.key) {
    setZuletzt({ key: oben.key, ebene: oben, tiefe: pages.length })
    setFahrt(
      ruhig() || oben.key === instantFor
        ? null
        : { art: pages.length < zuletzt.tiefe ? 'zurueck' : 'vor', alt: zuletzt.ebene, ab: zugWeg.current },
    )
    zugWeg.current = 0
    if (ziehen) setZiehen(false)
  }

  // Was der Finger direkt an die Elemente geschrieben hat, muss weg, sobald
  // die Animation uebernimmt - sonst stuende die Seite danach wieder dort.
  useLayoutEffect(() => {
    if (ziehen) return
    buehne.current?.querySelectorAll<HTMLElement>(':scope > .stage-layer').forEach((el) => {
      el.style.transform = ''
      el.style.removeProperty('--dunkel')
    })
  }, [fahrt, ziehen])

  // ---------- Zurueckwischen vom linken Rand ----------

  const onZugStart = (e: TouchEvent) => {
    if (!pages.length || fahrt || !swipe) return
    const t = e.touches[0]
    if (t.clientX > RAND_PX) return
    zug.current = { x: t.clientX, y: t.clientY, dx: 0, quer: false, lastX: t.clientX, lastT: performance.now(), v: 0 }
  }

  const onZugMove = (e: TouchEvent) => {
    const z = zug.current
    if (!z) return
    const t = e.touches[0]
    const dx = t.clientX - z.x
    const dy = t.clientY - z.y
    if (!z.quer) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      // Senkrecht oder nach links gemeint - das gehoert dem Inhalt.
      if (Math.abs(dy) > Math.abs(dx) || dx < 0) {
        zug.current = null
        return
      }
      z.quer = true
      setZiehen(true)
    }
    const now = performance.now()
    z.v = 0.7 * ((t.clientX - z.lastX) / Math.max(1, now - z.lastT)) + 0.3 * z.v
    z.lastX = t.clientX
    z.lastT = now
    z.dx = Math.max(0, dx)
    const breite = buehne.current?.clientWidth || 390
    const p = Math.min(1, z.dx / breite)
    if (obenRef.current) obenRef.current.style.transform = `translateX(${z.dx}px)`
    if (drunterRef.current) {
      drunterRef.current.style.transform = `translateX(${-VERSATZ + VERSATZ * p}%)`
      drunterRef.current.style.setProperty('--dunkel', String(1 - p))
    }
  }

  const onZugEnde = () => {
    const z = zug.current
    zug.current = null
    if (!z?.quer) return
    const breite = buehne.current?.clientWidth || 390
    const schnell = performance.now() - z.lastT < 100 && z.v > ZURUECK_TEMPO && z.dx > 30
    if (z.dx > breite * ZURUECK_AB || schnell) {
      zugWeg.current = z.dx
      onBack()
      return
    }
    // Nicht weit genug: zurueckfedern, dann die Seite darunter wieder weg.
    const dauer = ruhig() ? 0 : 220
    const federn = { duration: dauer, easing: 'cubic-bezier(0.32, 0.72, 0, 1)', fill: 'forwards' as const }
    drunterRef.current?.animate([{ transform: `translateX(-${VERSATZ}%)` }], federn)
    const a = obenRef.current?.animate([{ transform: 'translateX(0)' }], federn)
    const fertig = () => {
      if (obenRef.current) obenRef.current.style.transform = ''
      obenRef.current?.getAnimations().forEach((x) => x.cancel())
      setZiehen(false)
    }
    if (a) a.onfinish = fertig
    else fertig()
  }

  // ---------- Welche Ebenen gerade stehen und wie sie sich bewegen ----------

  const breite = buehne.current?.clientWidth || 390
  const ebenen: { e: Ebene<V>; rolle: string; still?: boolean; style?: CSSProperties; ref?: typeof obenRef }[] = []
  if (fahrt?.art === 'vor') {
    ebenen.push({ e: fahrt.alt, rolle: 'weg-links', still: true }, { e: oben, rolle: 'rein-rechts', ref: obenRef })
  } else if (fahrt?.art === 'zurueck') {
    const p = Math.min(1, fahrt.ab / breite)
    ebenen.push(
      {
        e: oben,
        rolle: 'rein-links',
        ref: obenRef,
        style: { '--von': `${-VERSATZ + VERSATZ * p}%`, '--dunkel-von': String(1 - p) } as CSSProperties,
      },
      { e: fahrt.alt, rolle: 'raus-rechts', still: true, style: { '--ab': `${fahrt.ab}px` } as CSSProperties },
    )
  } else if (ziehen && drunter) {
    ebenen.push({ e: drunter, rolle: 'drunter', ref: drunterRef }, { e: oben, rolle: 'zieht', ref: obenRef })
  } else {
    ebenen.push({ e: oben, rolle: '', ref: obenRef })
  }

  return (
    <div className={`stage ${className}`} ref={buehne}>
      {ebenen.map(({ e, rolle, still, style, ref }) => {
        const aktiv = e.key === oben.key
        return (
          <div
            key={e.key}
            ref={ref}
            className={`stage-layer${rolle ? ` ${rolle}` : ''}`}
            style={style}
            inert={!aktiv || undefined}
            onAnimationEnd={(ev) => {
              // Nur die Fahrt der Seite selbst, nicht die Abdunklung (::after)
              // oder eine Animation irgendwo darin.
              if (ev.target === ev.currentTarget && aktiv && ev.animationName.startsWith('stage-seite')) setFahrt(null)
            }}
            onTouchStart={aktiv ? onZugStart : undefined}
            onTouchMove={aktiv ? onZugMove : undefined}
            onTouchEnd={aktiv ? onZugEnde : undefined}
            onTouchCancel={aktiv ? onZugEnde : undefined}
          >
            <Standbild still={!!still}>{render(e.view, e.index)}</Standbild>
          </div>
        )
      })}
    </div>
  )
}
