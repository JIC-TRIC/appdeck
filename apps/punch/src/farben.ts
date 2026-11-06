// Zehn Bereichsfarben: die Ordnerfarben von Tick (apps/tick/src/farben.ts),
// statt Petrol Schiefer - Petrol ist die Farbe des Symbols.

export const FARBEN: readonly { name: string; wert: string }[] = [
  { name: 'Rot', wert: '#E5484D' },
  { name: 'Orange', wert: '#EF7A1C' },
  { name: 'Gelb', wert: '#E2A800' },
  { name: 'Grün', wert: '#2F9E5B' },
  { name: 'Schiefer', wert: '#5E6B7A' },
  { name: 'Blau', wert: '#2E7CF6' },
  { name: 'Indigo', wert: '#5B5FE0' },
  { name: 'Violett', wert: '#9B51E0' },
  { name: 'Pink', wert: '#E0457B' },
  { name: 'Braun', wert: '#A0714F' },
]

export const farbe = (i: number) => (FARBEN[i] ?? FARBEN[0]).wert
