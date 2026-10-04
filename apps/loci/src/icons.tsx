// Linien-Icons (24er Raster). Strichstaerke und Farbe kommen aus Loci.css (.l-i).

import type { ReactNode } from 'react'

function I({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`l-i ${className}`} viewBox="0 0 24 24" aria-hidden="true">
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
export const IconDown = ({ className }: P) => (
  <I className={className}>
    <path d="M6 9l6 6 6-6" />
  </I>
)
export const IconClose = ({ className }: P) => (
  <I className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
)
export const IconClock = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </I>
)
export const IconBulb = ({ className }: P) => (
  <I className={className}>
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.2h5c0-.9.4-1.7 1.1-2.2A6 6 0 0 0 12 3z" />
  </I>
)
export const IconKalender = ({ className }: P) => (
  <I className={className}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </I>
)
export const IconKarten = ({ className }: P) => (
  <I className={className}>
    <rect x="3.5" y="6.5" width="10" height="14" rx="2" transform="rotate(-10 8.5 13.5)" />
    <rect x="10.5" y="3.5" width="10" height="14" rx="2" />
  </I>
)
export const IconLoeschen = ({ className }: P) => (
  <I className={className}>
    <path d="M9 5h11a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9l-6-7z" />
    <path d="M12 9.5l5 5M17 9.5l-5 5" />
  </I>
)
export const IconMischen = ({ className }: P) => (
  <I className={className}>
    <path d="M3 7h3.5c2 0 3.2 1 4.3 2.6l2.4 3.8c1.1 1.6 2.3 2.6 4.3 2.6H21M18 4l3 3-3 3M3 17h3.5c1.3 0 2.2-.4 3-1.1M14 8.1c.8-.7 1.7-1.1 3-1.1M18 14l3 3-3 3" />
  </I>
)
export const IconTakt = ({ className }: P) => (
  <I className={className}>
    <path d="M8 21h8l-2.6-17h-2.8z" />
    <path d="M12 15l5.5-8" />
  </I>
)
