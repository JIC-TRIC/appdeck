// Multiplizieren im Kopf. Zwei Rechenwege fuer dieselbe Aufgabe:
//   Zerlegen    47 × 86 = 47 × 80 + 47 × 6 = 3760 + 282 = 4042
//   Ueberkreuz  Spalte fuer Spalte von rechts: 7·6, dann 4·6 + 7·8, dann 4·8
// Dazu Trachtenbergs Regeln fuer 3 bis 12 (nur in der Anleitung erklaert).
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

// ---------- Trachtenberg (nur in der Anleitung) ----------

/**
 * Trachtenbergs Regeln fuer 3 bis 12 ohne Einmaleins: vor die Zahl eine Null,
 * dann von rechts jede Ziffer mit ihrem Nachbarn (der Ziffer rechts daneben).
 * "Halber Nachbar" heisst halbieren und abrunden, "ungerade" meint die Ziffer.
 * Einer = die Ziffer ganz rechts, Vorn = die vorgesetzte Null.
 */
export const TRACHTENBERG: { m: number; regel: string[] }[] = [
  {
    m: 3,
    regel: [
      'Einer: (10 − Ziffer) · 2, + 5 wenn ungerade',
      'Weitere: (9 − Ziffer) · 2 + halber Nachbar, + 5 wenn ungerade',
      'Vorn: halber Nachbar − 2',
    ],
  },
  {
    m: 4,
    regel: [
      'Einer: 10 − Ziffer, + 5 wenn ungerade',
      'Weitere: 9 − Ziffer + halber Nachbar, + 5 wenn ungerade',
      'Vorn: halber Nachbar − 1',
    ],
  },
  { m: 5, regel: ['Halber Nachbar, + 5 wenn ungerade'] },
  { m: 6, regel: ['Ziffer + halber Nachbar, + 5 wenn ungerade'] },
  { m: 7, regel: ['Ziffer · 2 + halber Nachbar, + 5 wenn ungerade'] },
  { m: 8, regel: ['Einer: (10 − Ziffer) · 2', 'Weitere: (9 − Ziffer) · 2 + Nachbar', 'Vorn: Nachbar − 2'] },
  { m: 9, regel: ['Einer: 10 − Ziffer', 'Weitere: 9 − Ziffer + Nachbar', 'Vorn: Nachbar − 1'] },
  { m: 11, regel: ['Ziffer + Nachbar'] },
  { m: 12, regel: ['Ziffer · 2 + Nachbar'] },
]

const mitMinus = (n: number) => (n < 0 ? `−${-n}` : String(n))

/** Trachtenberg: x mal einen Faktor aus TRACHTENBERG, Ziffer fuer Ziffer von rechts, mit Uebertrag. */
export function trachtenberg(x: number, m: number): Rechenweg {
  // Einer zuerst, zuletzt die vorgesetzte Null.
  const z = [...`0${x}`].reverse().map(Number)
  const schritte: Zeile[] = []
  let uebertrag = 0
  z.forEach((d, k) => {
    const einer = k === 0
    const vorn = k === z.length - 1
    const nb = einer ? 0 : z[k - 1]
    const h = Math.floor(nb / 2)
    const teile: [string, number][] = []
    const plus = (text: string, wert: number) => {
      teile.push([text, wert])
    }
    const ziffer = (mal: 1 | 2) => plus(mal === 1 ? String(d) : `${d}·2`, d * mal)
    // Die Ziffer ganz rechts hat keinen Nachbarn.
    const nachbar = () => {
      if (!einer) plus(String(nb), nb)
    }
    const halb = () => {
      if (!einer) plus(`${h} (halbe ${nb})`, h)
    }
    const fuenf = () => {
      if (d % 2 === 1) plus('5 (ungerade)', 5)
    }
    // Bei 3, 4, 8, 9: die Einer von 10 abziehen, weitere Ziffern von 9 (bei 3 und 8 verdoppelt) ...
    const ab = (doppelt: boolean) => {
      const von = einer ? 10 : 9
      plus(doppelt ? `(${von} − ${d})·2` : `${von} − ${d}`, (von - d) * (doppelt ? 2 : 1))
    }
    // ... und vorn der (halbe) Nachbar minus 1 oder 2.
    const vornMinus = (minus: number, halbiert: boolean) =>
      plus(`${halbiert ? `${h} (halbe ${nb})` : nb} − ${minus}`, (halbiert ? h : nb) - minus)

    switch (m) {
      case 11:
        ziffer(1)
        nachbar()
        break
      case 12:
        ziffer(2)
        nachbar()
        break
      case 6:
        ziffer(1)
        halb()
        fuenf()
        break
      case 7:
        ziffer(2)
        halb()
        fuenf()
        break
      case 5:
        halb()
        fuenf()
        break
      case 9:
      case 8:
        if (vorn) vornMinus(m === 9 ? 1 : 2, false)
        else {
          ab(m === 8)
          nachbar()
        }
        break
      case 4:
      case 3:
        if (vorn) vornMinus(m === 4 ? 1 : 2, true)
        else {
          ab(m === 3)
          halb()
          fuenf()
        }
        break
      default:
        throw new Error(`Keine Trachtenberg-Regel fuer ${m}`)
    }
    if (!teile.length) plus('0', 0)

    const roh = teile.reduce((s, [, w]) => s + w, 0)
    const ausdruck = teile.map(([t]) => t).join(' + ')
    const gesamt = roh + uebertrag
    const info: string[] = []
    if (uebertrag) info.push(`+ ${uebertrag} = ${gesamt}`)
    let wert: string
    if (vorn) {
      wert = gesamt ? String(gesamt) : ''
      info.push(gesamt ? `schreibe ${gesamt}` : 'die Null vorn fällt weg')
    } else {
      const stelle = gesamt % 10
      uebertrag = Math.floor(gesamt / 10)
      wert = String(stelle)
      info.push(uebertrag ? `schreibe ${stelle}, merke ${uebertrag}` : `schreibe ${stelle}`)
    }
    schritte.push({
      text: `${vorn ? 'Vorn' : SPALTE[k]} ${d}: ${ausdruck}${ausdruck === String(roh) ? '' : ` = ${mitMinus(roh)}`}`,
      klein: info.join(' → '),
      wert,
    })
  })
  return { schritte, summe: { text: 'Von unten nach oben gelesen', wert: String(x * m) } }
}

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
