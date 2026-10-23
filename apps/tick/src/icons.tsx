// Linien-Icons (24er Raster). Strichstaerke und Farbe kommen aus Tick.css (.t-i).

import type { ReactNode } from 'react'

function I({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`t-i ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

type P = { className?: string }

export const IconLeft = ({ className }: P) => (
  <I className={className}>
    <path d="M15 4.5 7.5 12l7.5 7.5" />
  </I>
)
export const IconRight = ({ className }: P) => (
  <I className={className}>
    <path d="m9 5 7 7-7 7" />
  </I>
)
export const IconDown = ({ className }: P) => (
  <I className={className}>
    <path d="m5 9 7 7 7-7" />
  </I>
)
export const IconUp = ({ className }: P) => (
  <I className={className}>
    <path d="m5 15 7-7 7 7" />
  </I>
)
export const IconSuche = ({ className }: P) => (
  <I className={className}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m15.5 15.5 5 5" />
  </I>
)
export const IconMehr = ({ className }: P) => (
  <I className={`voll ${className ?? ''}`}>
    <circle cx="5" cy="12" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
  </I>
)
export const IconPlus = ({ className }: P) => (
  <I className={className}>
    <path d="M12 5v14M5 12h14" />
  </I>
)
export const IconHaken = ({ className }: P) => (
  <I className={className}>
    <path d="m5.5 12.5 4 4 9-9.5" />
  </I>
)
export const IconNotiz = ({ className }: P) => (
  <I className={className}>
    <path d="M5 7h14M5 12h14M5 17h8" />
  </I>
)
export const IconKalender = ({ className }: P) => (
  <I className={className}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
    <path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" />
  </I>
)
export const IconOrdner = ({ className }: P) => (
  <I className={className}>
    <path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  </I>
)
export const IconMuell = ({ className }: P) => (
  <I className={className}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />
  </I>
)
export const IconGriff = ({ className }: P) => (
  <I className={className}>
    <path d="M5 8h14M5 12h14M5 16h14" />
  </I>
)
export const IconX = ({ className }: P) => (
  <I className={className}>
    <path d="m7 7 10 10M17 7 7 17" />
  </I>
)
