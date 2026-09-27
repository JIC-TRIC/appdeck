// Entwuerfe: die offene Ansicht und halb ausgefuellte Formulare ueberleben
// einen Neustart der App. Typischer Fall: Betrag tippen, kurz in die
// Banking-App wechseln, um nachzusehen - und iOS hat die Web-App
// inzwischen beendet. Ohne Entwurf waere die Eingabe weg.
//
// Auch innerhalb von Kontor hilft das: es ist immer nur die oberste Seite
// eingehaengt. Wer im Buchungsformular "Neu" fuer eine Kategorie tippt,
// kommt danach in ein frisch aufgebautes Formular zurueck - das seinen
// Entwurf wiederfindet.
//
// Alles liegt unter einem Schluessel und verfaellt nach ein paar Stunden:
// am naechsten Tag soll nicht ploetzlich ein vergessener Betrag im Formular
// stehen.

import type { View } from './types'

export const ENTWURF_KEY = 'kontor:entwurf'
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
    // Abgelaufenes gleich beim Lesen verwerfen.
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

// Ein Formular hat einen Entwurf je Ansicht: neue Ausgabe und neue Einnahme
// getrennt, eine bearbeitete Buchung unter ihrer ID.
export function entwurfKey(view: View) {
  const id = view.entryId ?? view.categoryId ?? view.accountId ?? 'neu'
  const art = view.name === 'entry' && !view.entryId ? `:${view.type ?? 'expense'}` : ''
  return `${view.name}:${id}${art}`
}

export function entwurfLesen<T>(key: string): T | null {
  return (lesen().forms[key]?.data as T) ?? null
}

export function entwurfSchreiben(key: string, data: unknown) {
  const g = lesen()
  g.forms[key] = { data, savedAt: Date.now() }
  schreiben(g)
}

// Einen Entwurf von aussen aendern - etwa die gerade angelegte Kategorie
// ins Buchungsformular eintragen, aus dem man gekommen ist.
export function entwurfAendern<T>(key: string, patch: Partial<T>) {
  const g = lesen()
  const alt = g.forms[key]
  if (!alt) return
  g.forms[key] = { data: { ...(alt.data as T), ...patch }, savedAt: Date.now() }
  schreiben(g)
}

export function entwurfLoeschen(key: string) {
  const g = lesen()
  if (!(key in g.forms)) return
  delete g.forms[key]
  schreiben(g)
}

// Der Ansichtsstapel. Menue und Zeitraum-Auswahl kommen nicht wieder - das
// sind Wegweiser, keine Arbeit, die verloren gehen koennte.
export function stapelLesen(): View[] {
  return lesen().stack?.views ?? []
}

export function stapelSchreiben(views: View[]) {
  const g = lesen()
  const behalten = views.filter((v) => v.name !== 'menu' && v.name !== 'period')
  g.stack = behalten.length ? { views: behalten, savedAt: Date.now() } : undefined
  schreiben(g)
}
