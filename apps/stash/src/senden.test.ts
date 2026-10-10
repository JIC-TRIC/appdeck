import { describe, expect, it } from 'vitest'
import { base64, fehlerText, inboxDatei, isoLokal, istRepo, pruefe, sende } from './senden'
import type { Notiz } from './types'

// Ortszeit, wie auf dem iPhone
const ms = (y: number, mo: number, d: number, h = 12, mi = 0) => new Date(y, mo - 1, d, h, mi).getTime()
const JETZT = ms(2026, 10, 10, 14, 32)
const INBOX = { repo: 'JIC-TRIC/stash-inbox', token: 'github_pat_test' }

const notiz = (id: string, titel: string, text: string, erstellt: number): Notiz => ({ id, titel, text, erstellt })

describe('istRepo', () => {
  it('besitzer/name', () => {
    expect(istRepo('JIC-TRIC/stash-inbox')).toBe(true)
    expect(istRepo('a.b/c_d')).toBe(true)
    expect(istRepo('stash-inbox')).toBe(false)
    expect(istRepo('a/b/c')).toBe(false)
    expect(istRepo('https://github.com/a/b')).toBe(false)
  })
})

describe('isoLokal', () => {
  it('Ortszeit mit Versatz, meint denselben Zeitpunkt', () => {
    const s = isoLokal(ms(2026, 10, 5, 14, 32))
    expect(s).toMatch(/^2026-10-05T14:32:00[+-]\d\d:\d\d$/)
    expect(Date.parse(s)).toBe(ms(2026, 10, 5, 14, 32))
  })
})

describe('inboxDatei', () => {
  it('Pfad mit Datum, Uhrzeit und Kuerzel, Inhalt als JSON, aelteste zuerst', () => {
    const notizen = [notiz('a', 'Kontor', 'CSV-Export bauen', ms(2026, 10, 5, 14, 32)), notiz('b', '', 'Anrufen', ms(2026, 10, 6, 9, 10))]
    const { pfad, inhalt } = inboxDatei(notizen, JETZT, () => 0)
    expect(pfad).toBe('inbox/2026-10-10-1432-0000.json')
    const json = JSON.parse(inhalt)
    expect(Date.parse(json.gesendet)).toBe(JETZT)
    expect(json.notizen.map((n: { id: string; titel: string; text: string }) => [n.id, n.titel, n.text])).toEqual([
      ['a', 'Kontor', 'CSV-Export bauen'],
      ['b', '', 'Anrufen'],
    ])
    expect(Date.parse(json.notizen[1].erstellt)).toBe(ms(2026, 10, 6, 9, 10))
  })

  it('Kuerzel aus vier Zeichen', () => {
    expect(inboxDatei([], JETZT, () => 0.999999).pfad).toMatch(/-[0-9a-z]{4}\.json$/)
  })
})

describe('base64', () => {
  it('kann Umlaute, Gedankenstriche und Emoji', () => {
    const text = 'Grüße – 🚀\nZeile zwei'
    const zurueck = new TextDecoder().decode(Uint8Array.from(atob(base64(text)), (c) => c.charCodeAt(0)))
    expect(zurueck).toBe(text)
  })
})

describe('fehlerText', () => {
  it('die haeufigen Faelle in Worten', () => {
    expect(fehlerText(401)).toMatch(/Token/)
    expect(fehlerText(404)).toMatch(/Repo/)
    expect(fehlerText(500)).toBe('GitHub meldet Fehler 500.')
  })
})

describe('sende und pruefe', () => {
  const antwort = (status: number) => (async () => new Response('{}', { status })) as typeof fetch

  it('legt eine neue Datei per PUT an, mit Token', async () => {
    let url = ''
    let init: RequestInit = {}
    const f = (async (u: string, i: RequestInit) => {
      url = u
      init = i
      return new Response('{}', { status: 201 })
    }) as typeof fetch
    const r = await sende(INBOX, [notiz('a', 'Kontor', 'x', JETZT)], JETZT, f)
    expect(r).toEqual({ ok: true })
    expect(url).toMatch(/^https:\/\/api\.github\.com\/repos\/JIC-TRIC\/stash-inbox\/contents\/inbox\/2026-10-10-1432-[0-9a-z]{4}\.json$/)
    expect(init.method).toBe('PUT')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer github_pat_test')
    const body = JSON.parse(init.body as string)
    expect(body.message).toBe('stash: 1 Notiz')
    expect(JSON.parse(atob(body.content)).notizen[0].titel).toBe('Kontor')
  })

  it('Fehler von GitHub und ohne Netz: nicht ok, mit Meldung', async () => {
    expect(await sende(INBOX, [], JETZT, antwort(401))).toEqual({ ok: false, meldung: fehlerText(401) })
    const offline = (async () => {
      throw new TypeError('Failed to fetch')
    }) as typeof fetch
    expect(await sende(INBOX, [], JETZT, offline)).toEqual({ ok: false, meldung: 'Keine Verbindung.' })
  })

  it('pruefe fragt das Repo ab', async () => {
    expect(await pruefe(INBOX, antwort(200))).toEqual({ ok: true })
    expect(await pruefe(INBOX, antwort(404))).toEqual({ ok: false, meldung: fehlerText(404) })
  })
})
