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
