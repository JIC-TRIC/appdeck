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
export const IconKopie = ({ className }: P) => (
  <I className={className}>
    <rect x="8.5" y="8.5" width="11" height="12" rx="2" />
    <path d="M15.5 5.5V5a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 5v10A1.5 1.5 0 0 0 6 16.5h.5" />
  </I>
)
export const IconStapel = ({ className }: P) => (
  <I className={className}>
    <path d="M4 13.5l8 4 8-4" />
    <path d="M4 17.5l8 4 8-4" />
    <path d="M12 3.5l8 4-8 4-8-4z" />
  </I>
)
