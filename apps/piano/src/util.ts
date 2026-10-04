// Datum, Zeitformate und YouTube - wird ueberall gebraucht und hat genau eine
// Wahrheit.

// ---------- Datum ----------

// Datumsschluessel sind lokal ('YYYY-MM-DD'), nie UTC: mit toISOString()
// rutschen Sitzungen kurz nach Mitternacht in den falschen Tag (so war es in
// der alten App bei der Serie).
export function dateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// Ueber das Datum gerechnet, nicht ueber Millisekunden: an der
// Sommerzeitumstellung hat ein Tag 23 oder 25 Stunden.
export function addDays(key: string, n: number) {
  const d = parseKey(key)
  d.setDate(d.getDate() + n)
  return dateKey(d)
}

/** Tage von a nach b (b - a), mittags gerechnet wegen der Zeitumstellung. */
export function diffDays(a: string, b: string) {
  const da = parseKey(a)
  const db = parseKey(b)
  da.setHours(12)
  db.setHours(12)
  return Math.round((db.getTime() - da.getTime()) / 86400000)
}

/** 0 = Montag … 6 = Sonntag */
export function weekdayIndex(key: string) {
  return (parseKey(key).getDay() + 6) % 7
}

export function mondayOf(key: string) {
  return addDays(key, -weekdayIndex(key))
}

// Der "logische" Tag eines Zeitpunkts: bis zum Tageswechsel (Standard 3 Uhr)
// zaehlt noch der Vortag. Wer um 1:30 Uhr uebt, meint den Abend davor.
export function dayOf(t: Date | number | string, dayStart: number) {
  const d = new Date(t)
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() - dayStart, d.getMinutes()))
}

export const WEEKDAYS_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
export const WEEKDAYS_LONG = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
export const MONTHS = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]
export const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

/** "Sonntag, 4. Oktober" */
export function formatDateLong(key: string) {
  const d = parseKey(key)
  return `${WEEKDAYS_LONG[weekdayIndex(key)]}, ${d.getDate()}. ${MONTHS[d.getMonth()]}`
}

/** Ueberschrift im Verlauf: "Heute", "Gestern", "Freitag, 2. Oktober" (anderes Jahr mit Jahreszahl) */
export function formatDayHeading(key: string, today: string) {
  const diff = diffDays(key, today)
  if (diff === 0) return 'Heute'
  if (diff === 1) return 'Gestern'
  const long = formatDateLong(key)
  return key.slice(0, 4) === today.slice(0, 4) ? long : `${long} ${key.slice(0, 4)}`
}

/** "heute", "gestern", "Fr" (diese Woche), "12. Sep." – kurz fuer Listen */
export function formatRelativeDay(key: string | null, today: string) {
  if (!key) return 'noch nie'
  const diff = diffDays(key, today)
  if (diff <= 0) return 'heute'
  if (diff === 1) return 'gestern'
  if (diff < 7) return WEEKDAYS_SHORT[weekdayIndex(key)]
  const d = parseKey(key)
  const s = `${d.getDate()}. ${MONTHS_SHORT[d.getMonth()]}.`
  return key.slice(0, 4) === today.slice(0, 4) ? s : `${s} ${key.slice(0, 4)}`
}

// ---------- Zeit ----------

/** Uhr beim Ueben: "12:48", ab einer Stunde "1:02:03" */
export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** Gesamtzeiten: "3:46 h", unter einer Stunde "42 min" */
export function formatTotal(seconds: number) {
  const min = Math.round(seconds / 60)
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} h`
}

/** Kurze Dauern: "12 min" (unter einer Minute "< 1 min") */
export function formatMinutes(seconds: number) {
  if (seconds > 0 && seconds < 60) return '< 1 min'
  return `${Math.round(seconds / 60)} min`
}

/** Nach dem Ueben: "12 min 48 s" */
export function formatDurationLong(seconds: number) {
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  return m ? `${m} min ${s % 60} s` : `${s} s`
}

/** Bis zum naechsten Meilenstein: "22 h 29 min" */
export function formatHoursMinutes(seconds: number) {
  const min = Math.max(0, Math.round(seconds / 60))
  const h = Math.floor(min / 60)
  return h ? `${h} h ${min % 60} min` : `${min} min`
}

/** Uhrzeit einer Sitzung: "17:05" */
export function formatTimeOfDay(iso: string) {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

// ---------- YouTube ----------

// Die Muster der alten App plus Shorts, Live und Mobil-Links.
const VIDEO_PATTERNS = [
  /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/)([\w-]{6,})/,
  /youtube\.com\/(?:embed|v|shorts|live)\/([\w-]{6,})/,
]

export function extractVideoId(url: string | undefined | null) {
  if (!url) return null
  for (const p of VIDEO_PATTERNS) {
    const m = url.match(p)
    if (m?.[1]) return m[1]
  }
  return null
}

export function thumbnailUrl(url: string | undefined | null) {
  const id = extractVideoId(url)
  return id ? `https://img.youtube.com/vi/${id}/mqdefault.jpg` : null
}

// youtube-nocookie: setzt erst beim Abspielen Cookies. playsinline, sonst
// springt das Video auf dem iPhone sofort ins Vollbild.
export function embedUrl(url: string | undefined | null) {
  const id = extractVideoId(url)
  return id ? `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0&modestbranding=1` : null
}

export function youtubeSearchUrl(query: string) {
  const q = query.trim() || 'piano tutorial'
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`
}

/** Farbton fuer den Platzhalter eines Stuecks ohne Vorschaubild - fest pro Stueck. */
export function hueOf(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i += 1) h = (h * 31 + id.charCodeAt(i)) % 360
  return h
}
