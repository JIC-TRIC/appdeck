// Die 52 Kartenbilder (karten/LIZENZ.md). Ueber import.meta.glob landen sie im
// Build und damit auch im Offline-Speicher des Service Workers.

const DATEIEN = import.meta.glob<string>('./karten/*.webp', { eager: true, query: '?url', import: 'default' })

export const bild = (id: string) => DATEIEN[`./karten/${id}.webp`]

/** Beim Mischen alle Bilder des Decks laden, damit beim Blaettern nichts nachlaedt. */
export function vorladen(ids: string[]) {
  for (const id of ids) {
    const img = new Image()
    img.src = bild(id)
  }
}
