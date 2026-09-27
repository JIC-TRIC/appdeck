// Entwuerfe: die offene Ansicht und ein halb ausgefuelltes Formular
// ueberleben einen Neustart der App (wie bei Kontor). iOS beendet Web-Apps im
// Hintergrund gern - ohne Entwurf waere die Eingabe weg. Alles verfaellt nach
// drei Stunden: am naechsten Tag soll kein vergessener Name im Formular stehen.

import type { View } from './types'

export const ENTWURF_KEY = 'steady:entwurf'
export const MAX_ALTER_MS = 3 * 60 * 60 * 1000

interface Gespeichert {
  stack?: { views: View[]; savedAt: number }
  forms: Record<string, { data: unknown; savedAt: number }>
}

const frisch = (savedAt: number) => Date.now() - savedAt < MAX_ALTER_MS

function lesen(): Gespeichert {
  try {
    const raw = localStorage.getItem(ENTWURF_KEY)
    const g = raw ? (JSON.parse(raw) as Partial<Gespeichert>) : null
    if (!g || typeof g !== 'object') return { forms: {} }
    const forms: Gespeichert['forms'] = {}
    for (const [k, v] of Object.entries(g.forms ?? {})) if (v && frisch(v.savedAt)) forms[k] = v
    const stack = g.stack && frisch(g.stack.savedAt) ? g.stack : undefined
    return { stack, forms }
  } catch {
    return { forms: {} }
  }
}

function schreiben(g: Gespeichert) {
  try {
    if (!g.stack && !Object.keys(g.forms).length) localStorage.removeItem(ENTWURF_KEY)
    else localStorage.setItem(ENTWURF_KEY, JSON.stringify(g))
  } catch {
    // Ein Entwurf ist Komfort - scheitert das Speichern, geht es ohne weiter.
  }
}

export function entwurfLesen<T>(key: string): T | null {
  return (lesen().forms[key]?.data as T) ?? null
}

export function entwurfSchreiben(key: string, data: unknown) {
  const g = lesen()
  g.forms[key] = { data, savedAt: Date.now() }
  schreiben(g)
}

export function entwurfLoeschen(key: string) {
  const g = lesen()
  if (!(key in g.forms)) return
  delete g.forms[key]
  schreiben(g)
}

// Blaetter (Menue, Menge, Tageswechsel) kommen nicht wieder - das sind
// kurze Handgriffe, keine Arbeit, die verloren gehen koennte.
export function stapelLesen(): View[] {
  return lesen().stack?.views ?? []
}

export function stapelSchreiben(views: View[]) {
  const g = lesen()
  const behalten = views.filter((v) => !v.sheet)
  g.stack = behalten.length ? { views: behalten, savedAt: Date.now() } : undefined
  schreiben(g)
}
