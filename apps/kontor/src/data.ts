// Startdaten und feste Listen.

// Kategoriefarben: gleiche Saettigung und Helligkeit, nur der Farbton
// wechselt - nebeneinander im Donut bleibt so alles gleich stark.
export const CATEGORY_COLORS = [
  '#C4623D', '#D99A2B', '#4A6FA5', '#5B9E8F', '#B4577D', '#7E6BB0',
  '#3F7F8C', '#E0864A', '#6D8C3F', '#C77CA0', '#8A8377', '#A4523A',
  '#9C5C8F', '#3E8FB0', '#2F8B5E', '#C0455C',
]

export const ACCOUNT_COLORS = ['#4A6FA5', '#5B9E8F', '#C4623D', '#7E6BB0', '#6D8C3F', '#8A8377']

// Konten haben keine Art. Sie brachte nur Auswahl ohne Nutzen - was ein Konto
// ist, sagt sein Name. Unterschieden werden sie ueber Name und Farbe.
export const ACCOUNT_ICON = 'bank'

export interface CategoryTemplate {
  name: string
  icon: string
  color: string
}

// Ohne Startkategorien muesste man vor der ersten Buchung erst Listen pflegen -
// das macht niemand. Alles hier ist aenderbar und archivierbar.
export const DEFAULT_EXPENSE_CATEGORIES: CategoryTemplate[] = [
  { name: 'Wohnen', icon: 'house', color: '#4A6FA5' },
  { name: 'Abos & Verträge', icon: 'monitor', color: '#3F7F8C' },
  { name: 'Bildung', icon: 'book', color: '#6D8C3F' },
  { name: 'Lebensmittel', icon: 'basket', color: '#C4623D' },
  { name: 'Mobilität', icon: 'bus', color: '#5B9E8F' },
  { name: 'Persönliches', icon: 'person', color: '#B4577D' },
  { name: 'Essen gehen', icon: 'cutlery', color: '#D99A2B' },
  { name: 'Trinken', icon: 'cocktail', color: '#E0864A' },
  { name: 'Freizeit & Kultur', icon: 'ticket', color: '#9C5C8F' },
  { name: 'Reisen', icon: 'plane', color: '#3E8FB0' },
  { name: 'Konsum', icon: 'tag', color: '#C77CA0' },
  { name: 'Geschenke', icon: 'gift', color: '#C0455C' },
  { name: 'Spenden', icon: 'heart', color: '#7E6BB0' },
  { name: 'Sonstiges', icon: 'dots', color: '#8A8377' },
]

export const DEFAULT_INCOME_CATEGORIES: CategoryTemplate[] = [
  { name: 'Gehalt', icon: 'briefcase', color: '#2E9E6B' },
  { name: 'Unterstützung', icon: 'person', color: '#5B9E8F' },
  { name: 'Verkäufe', icon: 'tag', color: '#4A6FA5' },
  { name: 'Geschenke', icon: 'gift', color: '#C77CA0' },
  { name: 'Sonstiges', icon: 'dots', color: '#8A8377' },
]

// Notiz der Korrektur, mit der ein neues Konto seinen Startsaldo bekommt.
// Die Auswertungen erkennen daran, dass es kein echter Zuwachs ist.
export const NOTE_ANFANGSSALDO = 'Anfangssaldo'

// Segmentfarben fuer die Sammelposten im Donut.
export const COLOR_OTHER = '#A9A29A'
export const COLOR_TRANSFER = '#4A6FA5'

// Sammel-IDs: keine echten Kategorien, aber im Donut und in der Liste
// ansprechbar wie eine.
export const ID_OTHER = '__other__'
export const ID_TRANSFER = '__transfer__'
