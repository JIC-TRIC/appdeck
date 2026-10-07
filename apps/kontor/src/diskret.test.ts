import { describe, expect, it } from 'vitest'
import { betragOderMaske, DISKRET_AB_STANDARD, diskretAus, MASKE, verdeckt } from './diskret'

describe('Beträge verbergen', () => {
  it('ist aus, solange nichts eingestellt ist - Grenze dann 100 €', () => {
    expect(diskretAus({})).toEqual({ an: false, abCent: DISKRET_AB_STANDARD })
    expect(verdeckt(diskretAus({}), 123456)).toBe(false)
  })

  it('verdeckt Summen immer, egal wie klein', () => {
    const d = diskretAus({ diskret: true })
    expect(verdeckt(d, 0)).toBe(true)
    expect(verdeckt(d, 350)).toBe(true)
    expect(verdeckt(d, -250000)).toBe(true)
  })

  it('verdeckt Einzelbuchungen erst ab der Grenze, auch negative', () => {
    const d = diskretAus({ diskret: true, diskretAbCent: 10000 })
    expect(verdeckt(d, 9999, true)).toBe(false)
    expect(verdeckt(d, 10000, true)).toBe(true)
    expect(verdeckt(d, -320000, true)).toBe(true)
  })

  it('"Nie" laesst alle Einzelbuchungen offen, "Alle" verdeckt jede', () => {
    expect(verdeckt(diskretAus({ diskret: true, diskretAbCent: null }), 999999, true)).toBe(false)
    expect(verdeckt(diskretAus({ diskret: true, diskretAbCent: 0 }), 1, true)).toBe(true)
  })

  it('nimmt fuer kaputte Grenzen den Standard', () => {
    expect(diskretAus({ diskret: true, diskretAbCent: -5 }).abCent).toBe(DISKRET_AB_STANDARD)
  })

  it('setzt im Text die Maske statt des Betrags', () => {
    const d = diskretAus({ diskret: true })
    expect(betragOderMaske(d, 350, '3,50', true)).toBe('3,50')
    expect(betragOderMaske(d, 350, '3,50')).toBe(MASKE)
  })
})
