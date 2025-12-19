/**
 * Layout constants for consistent spacing and typography
 */

export const TYPOGRAPHY = {
  h1: "text-4xl md:text-6xl font-bold",
  h2: "text-3xl md:text-5xl font-bold",
  h3: "text-2xl md:text-3xl font-bold",
  body: "text-base md:text-lg",
  subtext: "text-sm md:text-base",
} as const

export const SPACING = {
  sectionPadding: "py-16 md:py-20",
  containerPadding: "px-6",
  sectionGap: "mb-10 md:mb-12",
  cardGap: "gap-6",
} as const

export const CARD_STYLES = {
  base: "rounded-2xl border border-gray-200 shadow-sm",
  padding: "p-6 md:p-8",
  white: "bg-white",
  muted: "bg-gray-50",
} as const
