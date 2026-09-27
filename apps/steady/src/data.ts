// Die zehn Gewohnheitsfarben - gleiche Helligkeit, damit keine Gewohnheit
// lauter ist als die andere. Gespeichert wird der Schluessel, nicht der
// Farbwert: so laesst sich ein Ton spaeter nachstellen, ohne die Daten
// anzufassen.
export const PALETTE = [
  { id: 'coral', name: 'Koralle', hex: '#F2785C' },
  { id: 'orange', name: 'Orange', hex: '#F59E45' },
  { id: 'yellow', name: 'Gelb', hex: '#E9C84A' },
  { id: 'lime', name: 'Limette', hex: '#A5CF5A' },
  { id: 'green', name: 'Grün', hex: '#5DC486' },
  { id: 'teal', name: 'Türkis', hex: '#45C2C0' },
  { id: 'sky', name: 'Himmel', hex: '#5AAEF0' },
  { id: 'indigo', name: 'Indigo', hex: '#8190F5' },
  { id: 'violet', name: 'Violett', hex: '#B58AF0' },
  { id: 'pink', name: 'Rosa', hex: '#EE80B5' },
] as const

const HEX: Record<string, string> = Object.fromEntries(PALETTE.map((p) => [p.id, p.hex]))

export function colorOf(key: string) {
  return HEX[key] ?? PALETTE[0].hex
}

export const UNIT_SUGGESTIONS = ['g', 'kcal', 'min', 'km', 'Seiten']

export const MAX_NAME = 40
