/*
 * Senden an die Inbox: Der Stapel geht als eine JSON-Datei in ein privates
 * GitHub-Repo (inbox/2026-10-10-1432-x7k2.json), am Laptop holt sie `/stash`
 * in Claude Code ab. Ein Aufruf der GitHub-API pro Senden, mit einem
 * Fine-grained Token, der nur in diesem Repo Inhalte schreiben darf.
 * Alles ausser dem Aufruf selbst ist getestet in senden.test.ts.
 */
import { anzahl } from './text'
import type { Inbox, Notiz } from './types'

export const REPO_VORSCHLAG = 'JIC-TRIC/stash-inbox'

/** „besitzer/name“, so wie GitHub es schreibt. */
export const istRepo = (s: string) => /^[\w.-]+\/[\w.-]+$/.test(s)

const zwei = (n: number) => String(n).padStart(2, '0')
const datum = (d: Date) => `${d.getFullYear()}-${zwei(d.getMonth() + 1)}-${zwei(d.getDate())}`

/** Ortszeit mit Versatz, z. B. „2026-10-05T14:32:00+02:00“ - eindeutig und trotzdem lesbar. */
export function isoLokal(ms: number): string {
  const d = new Date(ms)
  const v = -d.getTimezoneOffset()
  const a = Math.abs(v)
  return (
    `${datum(d)}T${zwei(d.getHours())}:${zwei(d.getMinutes())}:${zwei(d.getSeconds())}` +
    `${v < 0 ? '-' : '+'}${zwei(Math.floor(a / 60))}:${zwei(a % 60)}`
  )
}

/** Pfad und Inhalt der Datei fuer die Inbox. Das Kuerzel am Ende haelt zwei Sendungen einer Minute auseinander. */
export function inboxDatei(notizen: Notiz[], jetzt = Date.now(), zufall = Math.random) {
  const d = new Date(jetzt)
  const kuerzel = Math.floor(zufall() * 36 ** 4)
    .toString(36)
    .padStart(4, '0')
  const pfad = `inbox/${datum(d)}-${zwei(d.getHours())}${zwei(d.getMinutes())}-${kuerzel}.json`
  const inhalt = {
    gesendet: isoLokal(jetzt),
    notizen: notizen.map((n) => ({ id: n.id, titel: n.titel, text: n.text, erstellt: isoLokal(n.erstellt) })),
  }
  return { pfad, inhalt: `${JSON.stringify(inhalt, null, 2)}\n` }
}

/** UTF-8 als Base64 - btoa allein kann nur Latin-1. */
export function base64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

/** Was in der Meldung steht, wenn GitHub ablehnt. */
export function fehlerText(status: number): string {
  if (status === 401) return 'Token ungültig oder abgelaufen.'
  if (status === 403) return 'Der Token darf dort nicht schreiben.'
  if (status === 404) return 'Repo nicht gefunden oder für den Token nicht freigegeben.'
  return `GitHub meldet Fehler ${status}.`
}

export type Ergebnis = { ok: true } | { ok: false; meldung: string }

type Fetch = typeof fetch

async function github(inbox: Inbox, pfad: string, init: RequestInit, f: Fetch): Promise<Ergebnis> {
  const abbruch = new AbortController()
  const uhr = setTimeout(() => abbruch.abort(), 20_000)
  try {
    const r = await f(`https://api.github.com/repos/${inbox.repo}${pfad}`, {
      ...init,
      signal: abbruch.signal,
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${inbox.token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    })
    return r.ok ? { ok: true } : { ok: false, meldung: fehlerText(r.status) }
  } catch {
    return { ok: false, meldung: 'Keine Verbindung.' }
  } finally {
    clearTimeout(uhr)
  }
}

/** Legt den Stapel als neue Datei in der Inbox ab. */
export function sende(inbox: Inbox, notizen: Notiz[], jetzt = Date.now(), f: Fetch = fetch): Promise<Ergebnis> {
  const { pfad, inhalt } = inboxDatei(notizen, jetzt)
  const body = JSON.stringify({ message: `stash: ${anzahl(notizen.length)}`, content: base64(inhalt) })
  return github(inbox, `/contents/${pfad}`, { method: 'PUT', body }, f)
}

/** Kommt der Token an das Repo heran? Schreibrechte zeigt erst das Senden. */
export const pruefe = (inbox: Inbox, f: Fetch = fetch) => github(inbox, '', { method: 'GET' }, f)
