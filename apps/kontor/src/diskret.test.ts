import { describe, expect, it } from 'vitest'
import { betragOderMaske, diskretAus, MASKE, verdeckt } from './diskret'

describe('Beträge verbergen', () => {
  it('ist aus, solange nichts eingestellt ist', () => {
    expect(diskretAus({})).toEqual({ an: false })
    expect(verdeckt(diskretAus({}))).toBe(false)
  })

  it('verdeckt Summen', () => {
    expect(verdeckt(diskretAus({ diskret: true }))).toBe(true)
  })

  it('laesst einzelne Buchungen immer offen', () => {
    expect(verdeckt(diskretAus({ diskret: true }), true)).toBe(false)
  })

  it('setzt im Text die Maske statt der Summe', () => {
    expect(betragOderMaske(diskretAus({ diskret: true }), '3,50')).toBe(MASKE)
    expect(betragOderMaske(diskretAus({}), '3,50')).toBe('3,50')
  })
})
