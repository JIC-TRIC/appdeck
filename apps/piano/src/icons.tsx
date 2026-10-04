// Linien-Icons (24er Raster). Strichstaerke und Farbe kommen aus Piano.css
// (.p-i), gefuellte Teile tragen die Klasse "f".

import type { ReactNode } from 'react'

function I({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <svg className={`p-i ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  )
}

type P = { className?: string }

export const IconToday = ({ className }: P) => (
  <I className={className}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
    <circle className="f" cx="12" cy="15" r="1.7" />
  </I>
)
export const IconNote = ({ className }: P) => (
  <I className={className}>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </I>
)
export const IconBars = ({ className }: P) => (
  <I className={className}>
    <path d="M5 20v-8M12 20V5M19 20v-5" />
  </I>
)
export const IconSliders = ({ className }: P) => (
  <I className={className}>
    <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
    <circle cx="15" cy="7" r="2" />
    <circle cx="9" cy="17" r="2" />
  </I>
)
export const IconPlus = ({ className }: P) => (
  <I className={className}>
    <path d="M12 5v14M5 12h14" />
  </I>
)
export const IconMinus = ({ className }: P) => (
  <I className={className}>
    <path d="M6 12h12" />
  </I>
)
export const IconPlay = ({ className }: P) => (
  <I className={className}>
    <path className="f" d="M8 5.5v13l10.5-6.5z" />
  </I>
)
export const IconPause = ({ className }: P) => (
  <I className={`thick ${className ?? ''}`}>
    <path d="M9 6v12M15 6v12" />
  </I>
)
export const IconCheck = ({ className }: P) => (
  <I className={className}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </I>
)
export const IconRight = ({ className }: P) => (
  <I className={className}>
    <path d="M9 6l6 6-6 6" />
  </I>
)
export const IconLeft = ({ className }: P) => (
  <I className={className}>
    <path d="M15 6l-6 6 6 6" />
  </I>
)
export const IconClose = ({ className }: P) => (
  <I className={className}>
    <path d="M6 6l12 12M18 6L6 18" />
  </I>
)
export const IconRefresh = ({ className }: P) => (
  <I className={className}>
    <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" />
  </I>
)
export const IconSearch = ({ className }: P) => (
  <I className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M20 20l-4.2-4.2" />
  </I>
)
export const IconSort = ({ className }: P) => (
  <I className={className}>
    <path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3" />
  </I>
)
export const IconList = ({ className }: P) => (
  <I className={className}>
    <path d="M9 6h11M9 12h11M9 18h11" />
    <circle className="f" cx="4.5" cy="6" r="1.3" />
    <circle className="f" cx="4.5" cy="12" r="1.3" />
    <circle className="f" cx="4.5" cy="18" r="1.3" />
  </I>
)
export const IconPencil = ({ className }: P) => (
  <I className={className}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </I>
)
export const IconMore = ({ className }: P) => (
  <I className={className}>
    <circle className="f" cx="5" cy="12" r="1.6" />
    <circle className="f" cx="12" cy="12" r="1.6" />
    <circle className="f" cx="19" cy="12" r="1.6" />
  </I>
)
export const IconExternal = ({ className }: P) => (
  <I className={className}>
    <path d="M14 5h5v5M19 5l-8 8M17 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h4" />
  </I>
)
export const IconLock = ({ className }: P) => (
  <I className={className}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </I>
)
export const IconShare = ({ className }: P) => (
  <I className={className}>
    <path d="M12 3v12M8 7l4-4 4 4M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" />
  </I>
)
export const IconImport = ({ className }: P) => (
  <I className={className}>
    <path d="M12 4v11M8 11l4 4 4-4M5 19h14" />
  </I>
)
export const IconGrid = ({ className }: P) => (
  <I className={className}>
    <rect x="4" y="4" width="7" height="7" rx="2" />
    <rect x="13" y="4" width="7" height="7" rx="2" />
    <rect x="4" y="13" width="7" height="7" rx="2" />
    <rect x="13" y="13" width="7" height="7" rx="2" />
  </I>
)
export const IconClipboard = ({ className }: P) => (
  <I className={className}>
    <rect x="6" y="5" width="12" height="16" rx="2" />
    <path d="M9 5V3.5h6V5" />
  </I>
)
export const IconArchive = ({ className }: P) => (
  <I className={className}>
    <rect x="3" y="4" width="18" height="5" rx="1.5" />
    <path d="M5 9v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9M10 13h4" />
  </I>
)
export const IconClock = ({ className }: P) => (
  <I className={className}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </I>
)
