// Zahlen und Zeiten - an einer Stelle formatiert, damit alle Ansichten gleich schreiben.

const komma1 = { minimumFractionDigits: 1, maximumFractionDigits: 1 }

/** 4213 → "4,2 s" */
export const sekunden = (ms: number) => `${(ms / 1000).toLocaleString('de-DE', komma1)} s`

/** 4213 → "4,2" (fuer die Punkte im Verlauf) */
export const sekundenZahl = (ms: number) => (ms / 1000).toLocaleString('de-DE', komma1)

/** 84000 → "1:24" */
export function uhr(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** 3 → "3,0 s" */
export const taktText = (s: number) => `${s.toLocaleString('de-DE', komma1)} s`

const zeitText = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const MONAT_KURZ = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.']

/** "heute, 21:14" · "gestern, 19:02" · "2. Okt., 18:40" · "2. Okt. 2025" */
export function wann(ms: number, jetzt = Date.now()) {
  const d = new Date(ms)
  const heute = new Date(jetzt)
  const tag = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const abstand = Math.round((tag(heute) - tag(d)) / 864e5)
  if (abstand === 0) return `heute, ${zeitText(d)}`
  if (abstand === 1) return `gestern, ${zeitText(d)}`
  const datum = `${d.getDate()}. ${MONAT_KURZ[d.getMonth()]}`
  return d.getFullYear() === heute.getFullYear() ? `${datum}, ${zeitText(d)}` : `${datum} ${d.getFullYear()}`
}
