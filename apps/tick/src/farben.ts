// Zehn Ordnerfarben auf gleicher Hoehe, abgestimmt auf Weiss (konzept.md,
// Mockups unter „Farben und Zeichen“). Gespeichert wird nur der Index.

export const FARBEN = [
  { name: 'Rot', wert: '#E5484D' },
  { name: 'Orange', wert: '#EF7A1C' },
  { name: 'Gelb', wert: '#E2A800' },
  { name: 'Grün', wert: '#2F9E5B' },
  { name: 'Petrol', wert: '#0E9384' },
  { name: 'Blau', wert: '#2E7CF6' },
  { name: 'Indigo', wert: '#5B5FE0' },
  { name: 'Violett', wert: '#9B51E0' },
  { name: 'Pink', wert: '#E0457B' },
  { name: 'Braun', wert: '#A0714F' },
] as const

/** Der Eingang ist kein Ordner und hat keine der zehn Farben. */
export const EINGANG_FARBE = '#8E959E'

export const farbe = (i: number) => FARBEN[i]?.wert ?? FARBEN[0].wert
