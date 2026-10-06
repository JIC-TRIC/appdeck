// Die wenigen Strich-Symbole der Oberflaeche. Gewohnheiten selbst haben keine
// Symbole - Name und Farbe genuegen (konzept.md).

import type { ReactNode } from 'react'

function Stroke({ children, width = 2 }: { children: ReactNode; width?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const IconStats = () => <Stroke><path d="M6 20v-7M12 20V5M18 20v-10" /></Stroke>
export const IconPlus = () => <Stroke><path d="M12 5v14M5 12h14" /></Stroke>
export const IconLeft = () => <Stroke width={2.2}><path d="M15 5l-7 7 7 7" /></Stroke>
export const IconRight = () => <Stroke width={2.2}><path d="M9 5l7 7-7 7" /></Stroke>
export const IconCheck = () => <Stroke width={3}><path d="M5 12.5l4.5 4.5L19 7.5" /></Stroke>
export const IconGrip = () => <Stroke><path d="M5 9h14M5 15h14" /></Stroke>
export const IconClose = () => <Stroke><path d="M7 7l10 10M17 7L7 17" /></Stroke>
export const IconGrid = () => (
  <Stroke width={1.8}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
  </Stroke>
)
export const IconBackspace = () => (
  <Stroke width={1.8}>
    <path d="M9 5h11v14H9l-6-7z" />
    <path d="M12.5 9.5l5 5M17.5 9.5l-5 5" />
  </Stroke>
)

export function IconMore() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5.5" cy="12" r="1.9" fill="currentColor" />
      <circle cx="12" cy="12" r="1.9" fill="currentColor" />
      <circle cx="18.5" cy="12" r="1.9" fill="currentColor" />
    </svg>
  )
}

export function IconFlame() {
  return (
    <svg viewBox="0 0 12 14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M6.2.4c.3 2.3 4.3 4 4.3 8A4.5 4.5 0 0 1 1.5 8.6c0-1.9 1-3.2 2.2-4 .1 1.4.7 2.3 1.6 2.7C5.7 5.1 5.3 2.6 6.2.4z"
      />
    </svg>
  )
}
