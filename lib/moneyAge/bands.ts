/**
 * The tapped bands.
 *
 * Bands rather than typed numbers because this page's whole promise is four
 * taps. Typing a balance is the moment someone leaves.
 *
 * Income bands are linear; position bands are LOG-SPACED, which is a
 * requirement rather than a preference: the accumulation curve is steep at the
 * bottom, where $5,000 moves the answer a full year, and flat at the top.
 * Even bands would put all the resolution where it does not matter.
 */

export interface Band {
  label: string
  /** Value used in the maths — the midpoint, or a representative figure. */
  value: number
}

export const INCOME_BANDS: readonly Band[] = [
  { label: 'Under $40K', value: 32_000 },
  { label: '$40–55K', value: 47_500 },
  { label: '$55–70K', value: 62_500 },
  { label: '$70–90K', value: 80_000 },
  { label: '$90–120K', value: 105_000 },
  { label: '$120K+', value: 145_000 },
]

export const POSITION_BANDS: readonly Band[] = [
  { label: 'Nothing yet', value: 0 },
  { label: 'Under $2K', value: 1_000 },
  { label: '$2–5K', value: 3_500 },
  { label: '$5–10K', value: 7_500 },
  { label: '$10–25K', value: 17_500 },
  { label: '$25–50K', value: 37_500 },
  { label: '$50K+', value: 75_000 },
]

export const DEBT_BANDS: readonly Band[] = [
  { label: 'No', value: 0 },
  { label: 'Under $2K', value: 1_000 },
  { label: '$2–5K', value: 3_500 },
  { label: '$5–10K', value: 7_500 },
  { label: '$10K+', value: 15_000 },
]

/**
 * Band labels for analytics, so a funnel groups on what was tapped rather than
 * on a midpoint that looks like a real balance in a chart.
 */
export function bandLabel(bands: readonly Band[], value: number | null): string | null {
  if (value == null) return null
  return bands.find((b) => b.value === value)?.label ?? null
}
