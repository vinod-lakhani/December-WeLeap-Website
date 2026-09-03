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
 *
 * ON OPEN TOP BANDS. The first version stopped at "$50K+" and scored everyone
 * in it as $75,000. Measured on a 32-year-old earning $105,000, that told
 * someone holding $350,000 their money age was 29 when it was 41 — twelve years
 * understated, and understated for precisely the people whose result is worth
 * sharing. Income had the same shape of problem running the other way, since
 * understating income flatters, and the two compound rather than cancel for a
 * high earner with high savings.
 *
 * Extending the bands narrows that but cannot close it: each doubling of
 * savings is worth two to three years of money age, so any band wide enough to
 * be worth having carries years of error at the top. That is why the position
 * question also accepts an exact figure — the bands stay the fast path, and
 * nobody is forced into a bucket that cannot represent them.
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
  // Was a single '$120K+' scored at $145,000, which handed a $300,000 earner a
  // money age four years better than the truth. Understating income lowers the
  // bar, so this error was always the flattering one.
  { label: '$120–150K', value: 135_000 },
  { label: '$150–200K', value: 175_000 },
  { label: '$200K+', value: 250_000 },
]

export const POSITION_BANDS: readonly Band[] = [
  { label: 'Nothing yet', value: 0 },
  { label: 'Under $2K', value: 1_000 },
  { label: '$2–5K', value: 3_500 },
  { label: '$5–10K', value: 7_500 },
  { label: '$10–25K', value: 17_500 },
  { label: '$25–50K', value: 37_500 },
  { label: '$50–100K', value: 72_500 },
  { label: '$100–250K', value: 165_000 },
  { label: '$250K+', value: 400_000 },
]

export const DEBT_BANDS: readonly Band[] = [
  { label: 'No', value: 0 },
  { label: 'Under $2K', value: 1_000 },
  { label: '$2–5K', value: 3_500 },
  { label: '$5–10K', value: 7_500 },
  { label: '$10–25K', value: 15_000 },
  { label: '$25K+', value: 40_000 },
]

/**
 * Band labels for analytics, so a funnel groups on what was tapped rather than
 * on a midpoint that looks like a real balance in a chart.
 */
export function bandLabel(bands: readonly Band[], value: number | null): string | null {
  if (value == null) return null
  // 'exact' rather than null when a typed figure lands between bands, so a
  // funnel can tell "did not answer" from "answered precisely".
  return bands.find((b) => b.value === value)?.label ?? 'exact'
}

/** The largest figure the bands can represent, above which typing is the only honest option. */
export const POSITION_BAND_CEILING = 250_000
