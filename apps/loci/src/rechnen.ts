// Multiplizieren im Kopf. Zwei Rechenwege fuer dieselbe Aufgabe:
//   Zerlegen    47 × 86 = 47 × 80 + 47 × 6 = 3760 + 282 = 4042
//   Ueberkreuz  Spalte fuer Spalte von rechts: 7·6, dann 4·6 + 7·8, dann 4·8
// Reine Rechnung ohne Oberflaeche, getestet in rechnen.test.ts.

import type { Hinweis, Zeile } from './wochentag'
import type { Methode, Stufe } from './types'

export const STUFEN: { id: Stufe; name: string; x: number; y: number; info: string }[] = [
  { id: '2x1', name: '2 × 1', x: 2, y: 1, info: 'z. B. 47 × 6 – zum Aufwärmen' },
  { id: '3x1', name: '3 × 1', x: 3, y: 1, info: 'z. B. 347 × 6' },
  { id: '2x2', name: '2 × 2', x: 2, y: 2, info: 'z. B. 47 × 86 – der Klassiker' },
  { id: '3x2', name: '3 × 2', x: 3, y: 2, info: 'z. B. 347 × 86' },
  { id: '3x3', name: '3 × 3', x: 3, y: 3, info: 'z. B. 347 × 286 – viel im Kopf behalten' },
]

export const METHODEN: { id: Methode; name: string; info: string }[] = [
  { id: 'zerlegen', name: 'Zerlegen', info: 'Teilprodukte von links, Antwort von links eintippen' },
  { id: 'ueberkreuz', name: 'Überkreuz', info: 'Spalten von rechts, Antwort von rechts eintippen' },
]

export const stufeName = (s: Stufe) => STUFEN.find((x) => x.id === s)!.name

const SPALTE = ['Einer', 'Zehner', 'Hunderter', 'Tausender', 'Zehntausender', 'Hunderttausender']

/**
 * Zufallszahl mit `stellen` Stellen: einstellig 2-9, sonst ohne Null am Ende.
 * Gleich verteilt ohne Verwerfen: vorderer Teil und letzte Ziffer (1-9) getrennt.
 */
function zahl(stellen: number, zufall: () => number) {
  if (stellen === 1) return 2 + Math.floor(zufall() * 8)
  const vorneMin = 10 ** (stellen - 2)
  const k = Math.floor(zufall() * 9 * vorneMin * 9)
  return (vorneMin + Math.floor(k / 9)) * 10 + (k % 9) + 1
}

/** Neue Aufgabe der Stufe, nie zweimal dieselbe hintereinander. */
export function zufallsaufgabe(stufe: Stufe, vorher: { x: number; y: number } | null = null, zufall = Math.random) {
  const s = STUFEN.find((x) => x.id === stufe)!
  let a: { x: number; y: number }
  do a = { x: zahl(s.x, zufall), y: zahl(s.y, zufall) }
  while (vorher && a.x === vorher.x && a.y === vorher.y)
  return a
}

/** 347 → [300, 40, 7]; Nullen fallen weg. */
const stellenwerte = (n: number) =>
  [...String(n)].map((d, i, alle) => Number(d) * 10 ** (alle.length - 1 - i)).filter((t) => t > 0)

const nullenText = (n: number) => (n === 1 ? 'eine Null' : n === 2 ? 'zwei Nullen' : `${n} Nullen`)

export interface Rechenweg {
  schritte: Zeile[]
  summe: Zeile
}

/** Zerlegen: bei einstelligem y die grosse Zahl nach Stellen, sonst y nach Stellen. */
export function zerlegen(x: number, y: number): Rechenweg {
  let schritte: Zeile[]
  if (y < 10) {
    schritte = stellenwerte(x).map((t) => ({ text: `${t} × ${y}`, wert: String(t * y) }))
  } else {
    schritte = stellenwerte(y).map((t) => {
      const ziffer = Number(String(t)[0])
      const nullen = String(t).length - 1
      return {
        text: `${x} × ${t}`,
        klein: nullen ? `${x} × ${ziffer} = ${x * ziffer}, ${nullenText(nullen)} dran` : undefined,
        wert: String(x * t),
      }
    })
  }
  return {
    schritte,
    summe: { text: schritte.length > 1 ? schritte.map((s) => s.wert).join(' + ') : `${x} × ${y}`, wert: String(x * y) },
  }
}

/** Ueberkreuz: Spalte k bekommt alle Ziffernpaare mit Stellen i + j = k, plus Uebertrag. */
export function ueberkreuz(x: number, y: number): Rechenweg {
  const a = [...String(x)].reverse().map(Number)
  const b = [...String(y)].reverse().map(Number)
  const letzte = a.length + b.length - 2
  const schritte: Zeile[] = []
  let uebertrag = 0
  for (let k = 0; k <= letzte; k++) {
    const paare: [number, number][] = []
    for (let i = Math.min(k, a.length - 1); i >= 0; i--) {
      const j = k - i
      if (j < b.length) paare.push([a[i], b[j]])
    }
    const produkt = paare.reduce((s, [p, q]) => s + p * q, 0)
    const gesamt = produkt + uebertrag
    const teile: string[] = []
    if (uebertrag) teile.push(`+ ${uebertrag} = ${gesamt}`)
    let wert: string
    if (k === letzte) {
      wert = String(gesamt)
      teile.push(`schreibe ${gesamt}`)
    } else {
      const ziffer = gesamt % 10
      uebertrag = Math.floor(gesamt / 10)
      wert = String(ziffer)
      teile.push(uebertrag ? `schreibe ${ziffer}, merke ${uebertrag}` : `schreibe ${ziffer}`)
    }
    schritte.push({
      text: `${SPALTE[k]}: ${paare.map(([p, q]) => `${p}·${q}`).join(' + ')} = ${produkt}`,
      klein: teile.join(' → '),
      wert,
    })
  }
  return { schritte, summe: { text: 'Von unten nach oben gelesen', wert: String(x * y) } }
}

export const rechenweg = (x: number, y: number, methode: Methode) => (methode === 'zerlegen' ? zerlegen(x, y) : ueberkreuz(x, y))

/** Nur fuer falsche Antworten: steckt ein typischer Fehler dahinter? */
export function hinweisRechnen(richtig: number, eingabe: number): Hinweis | null {
  const r = String(richtig)
  const e = String(eingabe)
  if (r.length === e.length) {
    const anders = [...r].map((_, i) => i).filter((i) => r[i] !== e[i])
    if (anders.length === 1 && Math.abs(Number(r[anders[0]]) - Number(e[anders[0]])) === 1) {
      const stelle = SPALTE[r.length - 1 - anders[0]]
      return { kurz: 'Übertrag vergessen?', text: `Nur die ${stelle}stelle ist um 1 daneben.` }
    }
  }
  if (r.length > 1 && e !== r && e === [...r].reverse().join('')) {
    return { kurz: 'Ziffern verdreht?', text: 'Das ist das Ergebnis rückwärts. Beim Überkreuz-Rechnen von rechts eintippen.' }
  }
  return null
}

/** Hoechstens so viele Ziffern kann das Ergebnis haben. */
export const maxStellen = (x: number, y: number) => String(x).length + String(y).length
