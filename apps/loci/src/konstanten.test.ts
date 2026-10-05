import { describe, expect, it } from 'vitest'
import { KONSTANTE, KONSTANTEN, mitKomma, rekorde, weiter } from './konstanten'
import { ZIFFERN } from './konstanten-ziffern'

// Die 1000 Nachkommastellen stammen aus einem Skript (mpmath). Hier rechnet
// BigInt sie unabhaengig nach - mit Festkomma-Arithmetik und 20 Schutzstellen.
const STELLEN = 1000
const SCHUTZ = 20
const SKALA = 10n ** BigInt(STELLEN + SCHUTZ)

/** Nachkommastellen einer Festkommazahl (Wert * SKALA), abgeschnitten auf 1000. */
const nachkomma = (x: bigint) => (x % SKALA).toString().padStart(STELLEN + SCHUTZ, '0').slice(0, STELLEN)

/** arctan(1/n) * SKALA ueber die Reihe 1/n - 1/(3n^3) + 1/(5n^5) - ... */
function arctanKehrwert(n: bigint) {
  let summe = 0n
  let potenz = SKALA / n
  const n2 = n * n
  for (let k = 0n; potenz !== 0n; k++) {
    const term = potenz / (2n * k + 1n)
    summe += k % 2n === 0n ? term : -term
    potenz /= n2
  }
  return summe
}

/** atanh(1/n) * SKALA ueber die Reihe 1/n + 1/(3n^3) + 1/(5n^5) + ... */
function atanhKehrwert(n: bigint) {
  let summe = 0n
  let potenz = SKALA / n
  const n2 = n * n
  for (let k = 0n; potenz !== 0n; k++) {
    summe += potenz / (2n * k + 1n)
    potenz /= n2
  }
  return summe
}

/** Prueft, dass d die ersten 1000 Nachkommastellen von sqrt(zahl) sind (mit ganzem Teil g). */
function istWurzel(zahl: bigint, g: bigint, d: string) {
  const s = 10n ** BigInt(STELLEN)
  const n = g * s + BigInt(d)
  return n * n <= zahl * s * s && zahl * s * s < (n + 1n) * (n + 1n)
}

describe('Mathematische Konstanten: alle 1000 Stellen', () => {
  it('jede hat genau 1000 Ziffern', () => {
    for (const k of KONSTANTEN.filter((x) => x.gruppe === 'mathe')) {
      expect(k.ziffern).toMatch(/^\d{1000}$/)
    }
  })

  it('π nach Machin: 16 arctan(1/5) − 4 arctan(1/239)', () => {
    const pi = 16n * arctanKehrwert(5n) - 4n * arctanKehrwert(239n)
    expect(pi / SKALA).toBe(3n)
    expect(nachkomma(pi)).toBe(ZIFFERN.pi)
  })

  it('e als Summe 1/k!', () => {
    let summe = 0n
    let term = SKALA
    for (let k = 1n; term !== 0n; k++) {
      summe += term
      term /= k
    }
    expect(summe / SKALA).toBe(2n)
    expect(nachkomma(summe)).toBe(ZIFFERN.e)
  })

  it('ln 2 = 2 atanh(1/3)', () => {
    const ln2 = 2n * atanhKehrwert(3n)
    expect(ln2 / SKALA).toBe(0n)
    expect(nachkomma(ln2)).toBe(ZIFFERN.ln2)
  })

  it('√2 und √3: Quadrat-Probe genau auf die letzte Stelle', () => {
    expect(istWurzel(2n, 1n, ZIFFERN.wurzel2)).toBe(true)
    expect(istWurzel(3n, 1n, ZIFFERN.wurzel3)).toBe(true)
    // Gegenprobe: eine Stelle mehr oder weniger faellt durch.
    const falsch = ZIFFERN.wurzel2.slice(0, -1) + String((Number(ZIFFERN.wurzel2.at(-1)) + 1) % 10)
    expect(istWurzel(2n, 1n, falsch)).toBe(false)
  })

  it('φ = (1 + √5) / 2: Quadrat-Probe ueber 2φ − 1 = √5', () => {
    const s = 10n ** BigInt(STELLEN)
    const n = s + BigInt(ZIFFERN.phi)
    const unten = 2n * n - s
    const oben = 2n * n + 2n - s
    expect(unten * unten <= 5n * s * s && 5n * s * s < oben * oben).toBe(true)
  })

  it('die bekannten Anfaenge', () => {
    expect(ZIFFERN.pi.slice(0, 20)).toBe('14159265358979323846')
    expect(ZIFFERN.e.slice(0, 20)).toBe('71828182845904523536')
    expect(ZIFFERN.phi.slice(0, 20)).toBe('61803398874989484820')
    expect(ZIFFERN.wurzel2.slice(0, 20)).toBe('41421356237309504880')
    expect(ZIFFERN.ln2.slice(0, 20)).toBe('69314718055994530941')
  })
})

describe('Physikalische Konstanten', () => {
  it('Werte wie im SI bzw. bei CODATA', () => {
    expect(`${KONSTANTE.c.vor}${mitKomma(KONSTANTE.c, KONSTANTE.c.ziffern)} ${KONSTANTE.c.einheit}`).toBe('c = 299792458 m/s')
    expect([KONSTANTE.h.exponent, KONSTANTE.ladung.exponent, KONSTANTE.g.exponent]).toEqual(['−34', '−19', '−11'])
    expect(mitKomma(KONSTANTE.h, KONSTANTE.h.ziffern)).toBe('6,62607015')
    expect(mitKomma(KONSTANTE.ladung, KONSTANTE.ladung.ziffern)).toBe('1,602176634')
    expect(mitKomma(KONSTANTE.g, KONSTANTE.g.ziffern)).toBe('6,67430')
    expect(mitKomma(KONSTANTE.nullpunkt, KONSTANTE.nullpunkt.ziffern)).toBe('273,15')
  })

  it('Komma erst, wenn die Stelle erreicht ist', () => {
    expect(mitKomma(KONSTANTE.h, '6')).toBe('6')
    expect(mitKomma(KONSTANTE.h, '66')).toBe('6,6')
    expect(mitKomma(KONSTANTE.pi, '1415')).toBe('1415')
  })
})

describe('Auswertung', () => {
  it('wie es weitergeht und Rekorde', () => {
    expect(weiter(KONSTANTE.pi, 0, 5)).toBe('14159')
    expect(weiter(KONSTANTE.c, 7)).toBe('58')
    const v = (k: string, stellen: number) => ({ k, stellen, ende: 0, dauer: 0, fehler: true })
    expect(rekorde([v('pi', 40), v('pi', 87), v('e', 12), v('pi', 50)])).toEqual({ pi: 87, e: 12 })
  })
})
