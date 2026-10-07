// Ein Strich-Set, alles auf 24er-Raster, gleiche Strichstaerke. Kein Emoji:
// Emoji sehen auf jedem System anders aus und lassen sich nicht umfaerben.

import type { ReactNode, SVGProps } from 'react'

const S: SVGProps<SVGSVGElement> = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" {...S} aria-hidden="true">
      {children}
    </svg>
  )
}

// ---------- Kategorie- und Kontosymbole ----------
// Der Schluessel steht am Datensatz, darum darf er sich nie aendern.

const GLYPHS: Record<string, ReactNode> = {
  basket: (
    <>
      <path d="M4 9h16l-1.6 10.5H5.6z" />
      <path d="M8.6 9 11 3.8" />
      <path d="M15.4 9 13 3.8" />
    </>
  ),
  cutlery: (
    <>
      <path d="M7.5 3.5v5.5a2 2 0 0 0 4 0V3.5" />
      <path d="M9.5 9v11.5" />
      <path d="M16 3.5c2 2.2 2 6.3 0 8.2" />
      <path d="M16 11.7v8.8" />
    </>
  ),
  house: (
    <>
      <path d="M4 10.5 12 4.5l8 6V20H4z" />
      <path d="M10 20v-5.5h4V20" />
    </>
  ),
  bus: (
    <>
      <path d="M5 5.5h14v10H5z" />
      <path d="M5 10.5h14" />
      <circle cx="8.5" cy="18.5" r="1.4" />
      <circle cx="15.5" cy="18.5" r="1.4" />
    </>
  ),
  tag: (
    <>
      <path d="M4 11.5 11.5 4H20v8.5L12.5 20z" />
      <circle cx="16" cy="8" r="1.3" />
    </>
  ),
  health: <path d="M10 4.5h4v5.5h5.5v4H14v5.5h-4V14H4.5v-4H10z" />,
  monitor: (
    <>
      <path d="M3.5 5h17v10.5h-17z" />
      <path d="M12 15.5V20" />
      <path d="M8.5 20h7" />
    </>
  ),
  cocktail: (
    <>
      <path d="M5.5 5h13l-6.5 8z" />
      <path d="M12 13v6" />
      <path d="M8 19.5h8" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 4.5 7 4.5 4.5 5.2v13C7 17.5 10 17.5 12 19.5c2-2 5-2 7.5-1.3v-13C17 4.5 14 4.5 12 6.5z" />
      <path d="M12 6.5v13" />
    </>
  ),
  gift: (
    <>
      <path d="M4.5 10h15v9.5h-15z" />
      <path d="M4.5 10 6.5 6h11l2 4" />
      <path d="M12 6v13.5" />
    </>
  ),
  dots: (
    <>
      <circle cx="6.5" cy="12" r="1.4" />
      <circle cx="12" cy="12" r="1.4" />
      <circle cx="17.5" cy="12" r="1.4" />
    </>
  ),
  briefcase: (
    <>
      <path d="M4 8h16v11H4z" />
      <path d="M9 8V5.5h6V8" />
      <path d="M4 12.5h16" />
    </>
  ),
  wrench: <path d="M14.5 4.5a3.8 3.8 0 0 0 5 5l-10 10-4.5 1 1-4.5z" />,
  refund: (
    <>
      <path d="M9 6.5 5 10.5l4 4" />
      <path d="M5 10.5h9.5a4 4 0 0 1 0 8H12" />
    </>
  ),
  trend: (
    <>
      <path d="M4 17.5 10 11.5l3 3 7-7" />
      <path d="M15 7.5h5v5" />
    </>
  ),
  bank: (
    <>
      <path d="M4 7h16v12H4z" />
      <path d="M4 7V4.5h12V7" />
      <path d="M15.5 13H18" />
    </>
  ),
  cash: (
    <>
      <path d="M3.5 7.5h17v9h-17z" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  piggy: (
    <>
      <path d="M4 13a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v5H4z" />
      <path d="M8 7V5.5" />
      <circle cx="16" cy="12" r="1" />
    </>
  ),
  card: (
    <>
      <path d="M3.5 6h17v12h-17z" />
      <path d="M3.5 10h17" />
      <path d="M7 14.5h4" />
    </>
  ),
  phone: <path d="M6 4.5h3l1.5 4-2 1.5a10 10 0 0 0 5.5 5.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.7 1.5A15 15 0 0 1 4.5 6.2 1.5 1.5 0 0 1 6 4.5z" />,
  shirt: <path d="M9 4.5 5 6.5l1 4 2-.7V20h8V9.8l2 .7 1-4-4-2a3 3 0 0 1-6 0z" />,
  pet: (
    <>
      <circle cx="7" cy="9" r="1.8" />
      <circle cx="12" cy="7" r="1.8" />
      <circle cx="17" cy="9" r="1.8" />
      <path d="M12 11c3 0 5 2 5 4.5S15 19 12 19s-5-1-5-3.5S9 11 12 11z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3.6 5 6.3v5.4c0 4 2.9 7.2 7 8.7 4.1-1.5 7-4.7 7-8.7V6.3z" />
      <path d="M9.5 11.8 11.5 14l3.2-3.6" />
    </>
  ),
  person: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5.5 19.8c0-3.6 2.9-5.6 6.5-5.6s6.5 2 6.5 5.6" />
    </>
  ),
  ticket: (
    <>
      <path d="M4 8.5h16v2.2a1.8 1.8 0 0 0 0 3.6v2.2H4v-2.2a1.8 1.8 0 0 0 0-3.6z" />
      <path d="M13.5 8.5v2M13.5 13v2M13.5 17.5v-1" />
    </>
  ),
  plane: <path d="M10.6 3.8a1.4 1.4 0 0 1 2.8 0V9l6.6 3.8v2.1l-6.6-1.8v3.6l2.3 1.8v1.5L12 19l-3.7 1v-1.5l2.3-1.8v-3.6L4 14.9v-2.1L10.6 9z" />,
  heart: <path d="M12 19.6C12 19.6 4.6 15.1 4.6 10a3.7 3.7 0 0 1 7.4-2 3.7 3.7 0 0 1 7.4 2c0 5.1-7.4 9.6-7.4 9.6z" />,
  transfer: (
    <>
      <path d="M4 9h14l-3-3" />
      <path d="M20 15H6l3 3" />
    </>
  ),
  adjust: (
    <>
      <path d="M4 8h9M18.5 8H20" />
      <path d="M4 16h3.5M12.5 16H20" />
      <circle cx="15.5" cy="8" r="2.2" />
      <circle cx="10" cy="16" r="2.2" />
    </>
  ),
}

// Die Auswahl, die im Kategorie-Formular angeboten wird.
export const ICON_KEYS = [
  'basket', 'cutlery', 'house', 'bus', 'tag', 'health', 'shield', 'monitor',
  'cocktail', 'ticket', 'plane', 'book', 'gift', 'heart', 'person', 'briefcase',
  'wrench', 'refund', 'trend', 'phone', 'shirt', 'pet', 'card', 'piggy', 'dots',
]

export function Glyph({ name }: { name: string }) {
  return <Svg>{GLYPHS[name] ?? GLYPHS.dots}</Svg>
}

// Nur die Pfade, ohne eigenes <svg> darum. Der Donut zeichnet seine
// Beschriftung im selben Koordinatensystem wie den Ring - nur so stimmen
// Kollisionspruefung und Fuehrungsstrich auf jedem Schirm mit dem ueberein,
// was zu sehen ist.
export function GlyphPath({ name }: { name: string }) {
  return GLYPHS[name] ?? GLYPHS.dots
}

// ---------- Bedien-Symbole ----------

export const IconFilter = () => <Svg><path d="M4 6h16l-6 7v6l-4-2v-4z" /></Svg>
export const IconEye = () => (
  <Svg>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="3" />
  </Svg>
)
export const IconEyeOff = () => (
  <Svg>
    <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4" />
    <path d="M6.3 7.4C3.9 9.1 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    <path d="M4 4l16 16" />
  </Svg>
)
export const IconSearch = () => <Svg><circle cx="11" cy="11" r="6" /><path d="M15.5 15.5 20 20" /></Svg>
export const IconTransfer = () => <Svg>{GLYPHS.transfer}</Svg>
export const IconMore = () => (
  <Svg>
    <circle cx="12" cy="5.5" r="1.3" />
    <circle cx="12" cy="12" r="1.3" />
    <circle cx="12" cy="18.5" r="1.3" />
  </Svg>
)
export const IconLeft = () => <Svg><path d="M14 6l-6 6 6 6" /></Svg>
export const IconRight = () => <Svg><path d="M10 6l6 6-6 6" /></Svg>
export const IconDown = () => <Svg><path d="M6 10l6 6 6-6" /></Svg>
export const IconPlus = () => <Svg><path d="M12 5.5v13M5.5 12h13" /></Svg>
export const IconMinus = () => <Svg><path d="M5 12h14" /></Svg>
export const IconCheck = () => <Svg><path d="M5 13l4 4L19 7" /></Svg>
export const IconClose = () => <Svg><path d="M6 6l12 12M18 6 6 18" /></Svg>
export const IconPencil = () => <Svg><path d="M4 20h4L20 8l-4-4L4 16z" /></Svg>
export const IconTrash = () => (
  <Svg>
    <path d="M5 7h14" />
    <path d="M9.5 7V4.8h5V7" />
    <path d="M6.5 7 7.6 20h8.8L17.5 7" />
  </Svg>
)
export const IconCalendar = () => (
  <Svg>
    <path d="M4 6.5h16V20H4z" />
    <path d="M4 11h16" />
    <path d="M8 3.5v4M16 3.5v4" />
  </Svg>
)
export const IconBackspace = () => (
  <Svg>
    <path d="M20 6H9L4 12l5 6h11z" />
    <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
  </Svg>
)
export const IconChart = () => <Svg><path d="M5 19.5V9.5" /><path d="M11 19.5V4.5" /><path d="M17 19.5v-7" /></Svg>
export const IconGrid = () => (
  <Svg>
    <path d="M4.5 5.5h6v6h-6z" />
    <path d="M13.5 5.5h6v6h-6z" />
    <path d="M4.5 14.5h6v4h-6z" />
    <path d="M13.5 14.5h6v4h-6z" />
  </Svg>
)
export const IconSliders = () => <Svg>{GLYPHS.adjust}</Svg>
export const IconWallet = () => <Svg>{GLYPHS.bank}</Svg>
export const IconWarn = () => (
  <Svg>
    <path d="M12 4.5 21 19.5H3z" />
    <path d="M12 10v4" />
    <circle cx="12" cy="16.7" r=".9" fill="currentColor" stroke="none" />
  </Svg>
)
export const IconInfo = () => (
  <Svg>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5" />
    <circle cx="12" cy="7.8" r=".9" fill="currentColor" stroke="none" />
  </Svg>
)
export const IconDownload = () => <Svg><path d="M12 4.5v11" /><path d="M8 11.5l4 4 4-4" /><path d="M5 19.5h14" /></Svg>
export const IconUpload = () => <Svg><path d="M12 15.5v-11" /><path d="M8 8.5l4-4 4 4" /><path d="M5 19.5h14" /></Svg>
export const IconSwap = () => <Svg><path d="M9 4.5 5 8.5h14" /><path d="M15 19.5 19 15.5H5" /></Svg>
export const IconArchive = () => (
  <Svg>
    <path d="M3.5 5h17v4h-17z" />
    <path d="M5 9v10h14V9" />
    <path d="M9.5 13h5" />
  </Svg>
)
