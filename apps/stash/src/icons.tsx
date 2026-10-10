// Linien-Icons (24er Raster). Strichstaerke und Farbe kommen aus Stash.css (.s-i).

import type { ReactNode } from 'react'

function I({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`s-i ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

type P = { className?: string }

export const IconLeft = ({ className }: P) => (
  <I className={className}>
    <path d="M15 5l-7 7 7 7" />
  </I>
)
export const IconRight = ({ className }: P) => (
  <I className={className}>
    <path d="M9 5l7 7-7 7" />
  </I>
)
export const IconZahnrad = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </I>
)
export const IconStapel = ({ className }: P) => (
  <I className={className}>
    <path d="M4 13.5l8 4 8-4" />
    <path d="M4 17.5l8 4 8-4" />
    <path d="M12 3.5l8 4-8 4-8-4z" />
  </I>
)
