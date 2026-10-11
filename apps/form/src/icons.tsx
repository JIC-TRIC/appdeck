// Die wenigen Strich-Symbole der Oberflaeche (24er Raster). Strichstaerke und
// Farbe kommen aus Form.css (.f-i).

import type { ReactNode } from 'react'

function I({ children }: { children: ReactNode }) {
  return (
    <svg className="f-i" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconLeft = () => (
  <I>
    <path d="M15 5l-7 7 7 7" />
  </I>
)
export const IconRight = () => (
  <I>
    <path d="M9 5l7 7-7 7" />
  </I>
)
export const IconPlus = () => (
  <I>
    <path d="M12 5v14M5 12h14" />
  </I>
)
export const IconCheck = () => (
  <I>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </I>
)
export const IconMinus = () => (
  <I>
    <path d="M5 12h14" />
  </I>
)
export const IconX = () => (
  <I>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
)
export const IconSuche = () => (
  <I>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4 4" />
  </I>
)
export const IconGriff = () => (
  <I>
    <path d="M5 9h14M5 15h14" />
  </I>
)
export const IconLoeschTaste = () => (
  <I>
    <path d="M9 6h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5.5-6z" />
    <path d="M12 10l4 4M16 10l-4 4" />
  </I>
)
// Gefuellt statt Strich - Punkte und Dreieck waeren als Linie zu duenn.
export const IconMehr = () => (
  <I>
    <circle cx="5" cy="12" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.7" fill="currentColor" stroke="none" />
  </I>
)
export const IconPlay = () => (
  <I>
    <path d="M7.5 5.5v13l11-6.5z" fill="currentColor" stroke="none" />
  </I>
)

// ---------- Tab-Leiste ----------

export const IconListe = () => (
  <I>
    <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
    <circle cx="5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" />
    <circle cx="5" cy="17.5" r="1.5" fill="currentColor" stroke="none" />
  </I>
)
export const IconKalender = () => (
  <I>
    <rect x="4" y="5" width="16" height="15" rx="2.5" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </I>
)
export const IconStatistik = () => (
  <I>
    <path d="M5 20v-8M12 20V5M19 20v-5" />
  </I>
)
export const IconHantel = () => (
  <I>
    <path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </I>
)
// Verlauf mit Ziellinie - wie das Symbol von Form.
export const IconWerte = () => (
  <I>
    <path d="M4 8.5h16" strokeDasharray="2 3" />
    <path d="M4 18l5-5 4 3 7-7" />
  </I>
)
export const IconPokal = () => (
  <I>
    <path d="M7.5 4.5h9v5a4.5 4.5 0 0 1-9 0z" />
    <path d="M7.5 6.5H4.5a3 3 0 0 0 3 4M16.5 6.5h3a3 3 0 0 1-3 4M12 14v4M8.5 20h7" />
  </I>
)
export const IconTeilen = () => (
  <I>
    <path d="M12 15V4M8 7.5L12 3.5l4 4" />
    <path d="M8 11H6.5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5v-6a1.5 1.5 0 0 0-1.5-1.5H16" />
  </I>
)
