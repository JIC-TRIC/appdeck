/*
 * Ansichtsstapel an der Browser-History: jeder push haengt einen Eintrag an,
 * damit die Zurueck-Geste des Handys Schritt fuer Schritt zurueckgeht - der
 * Pfad bleibt dabei gleich. Zusammen mit PageStage (Seitenwechsel).
 * Entstanden in Kontor, genutzt von Kontor und Piano.
 *
 *   const { stack, push, back } = useHistoryStack<View>(() => [])
 */
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react'

export interface HistoryStack<V> {
  stack: V[]
  /** Stapel direkt aendern, ohne History (z. B. eine Seite unter ein Blatt legen) */
  setStack: Dispatch<SetStateAction<V[]>>
  push: (view: V) => void
  /** oberste Ansicht ersetzen, ohne neuen History-Eintrag */
  replace: (view: V) => void
  back: () => void
  /** alles vom Stapel, zurueck zur Startseite */
  toRoot: () => void
}

export function useHistoryStack<V>(initial: () => V[]): HistoryStack<V> {
  const [stack, setStack] = useState<V[]>(initial)
  const depth = useRef(0)
  // back() nimmt die Seite sofort vom Stapel - das folgende popstate gehoert
  // dazu und wird uebersprungen.
  const popIgnorieren = useRef(0)

  // Fuer jeden wiederhergestellten Eintrag einen History-Eintrag - sonst
  // fuehrt "Zurueck" nicht Schritt fuer Schritt, sondern gleich zur Startseite.
  // Die Ref verhindert, dass React im StrictMode das doppelt macht.
  const wiederhergestellt = useRef(false)
  useEffect(() => {
    if (wiederhergestellt.current) return
    wiederhergestellt.current = true
    for (let i = 0; i < stack.length; i += 1) window.history.pushState({ stack: i + 1 }, '')
    depth.current = stack.length
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onPop = () => {
      if (popIgnorieren.current > 0) {
        popIgnorieren.current -= 1
        return
      }
      setStack((s) => {
        if (!s.length) return s
        depth.current = Math.max(0, depth.current - 1)
        return s.slice(0, -1)
      })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((view: V) => {
    window.history.pushState({ stack: depth.current + 1 }, '')
    depth.current += 1
    setStack((s) => [...s, view])
  }, [])

  const replace = useCallback((view: V) => {
    setStack((s) => (s.length ? [...s.slice(0, -1), view] : [view]))
  }, [])

  // Sofort vom Stapel statt erst auf popstate zu warten: so wechselt die Seite
  // im selben Moment, in dem sich nach Speichern oder Loeschen die Daten
  // aendern - und die hinausgleitende Seite zeigt noch ihren letzten Stand.
  const back = useCallback(() => {
    if (depth.current > 0) {
      depth.current -= 1
      popIgnorieren.current += 1
      setStack((s) => s.slice(0, -1))
      window.history.back()
    } else setStack([])
  }, [])

  const toRoot = useCallback(() => {
    if (depth.current > 0) {
      popIgnorieren.current += 1
      window.history.go(-depth.current)
      depth.current = 0
    }
    setStack([])
  }, [])

  return { stack, setStack, push, replace, back, toRoot }
}
