/**
 * Money Age parameters.
 *
 * Two of these decide the shape of every answer the tool gives, so both are
 * sourced rather than chosen. See docs/specs/money-age-v2.md.
 */

/** Real return on the reference saver's balance. */
export const REAL_RETURN = 0.05

/**
 * The reference savings rate — the bar.
 *
 * Vanguard, How America Saves 2026 (2025 plan year, ~5M participants): the
 * average total participant contribution rate, employee plus employer, is
 * 12.1%. Employee-only is 7.6%.
 *
 * TOTAL is the right one here because our own savings rate counts employer
 * contributions. That pairing is not cosmetic: the draft excluded employer
 * money from the rate while benchmarking against a guessed 6%, which made an
 * employer match worth exactly zero years — on a site whose money plan is built
 * on capturing the match first.
 *
 * The rule, if this is ever revisited: B and the user's rate must count the
 * same things. A mismatched pair is a silent wrong answer, not a rounding
 * difference.
 */
export const REFERENCE_SAVINGS_RATE = 0.121

/**
 * Years of credit per 100% of the reference rate.
 *
 * Safe to tune for feel, and it has to be tuned alongside B: B sits in the
 * denominator of the rate credit, so raising B from the draft's 6% to a sourced
 * 12.1% halves the slider's travel (12.5 years to 6.2) unless c rises with it.
 * The slider is the whole hook, so that would have been a silent cost of being
 * honest about B.
 *
 * 8.9 restores the original range. Tuning this cannot break the meaning of the
 * number: at s = B the credit is zero for any c, so "saving the reference rate
 * puts you at your own age" holds regardless.
 */
export const RATE_CREDIT_PER_UNIT = 8.9

/** Rate credit is clamped here so one guessed input cannot dominate. */
export const RATE_CREDIT_CLAMP_YEARS = 10

/**
 * Real income growth over a career, by age band.
 *
 * Source: US Bureau of Labor Statistics, "Baby boomer earnings grew fastest
 * during their late teens and early twenties", TED, 3 April 2015, from the
 * National Longitudinal Surveys (cohort born 1957-1964). Real hourly earnings
 * growth per year.
 *
 * A SCHEDULE RATHER THAN ONE NUMBER, and the honest reason is provenance, not
 * precision. Averaged across this tool's age range these bands come to 3.14%,
 * so a flat 3% turns out to be a good approximation: switching to the schedule
 * moves the money age by at most half a year anywhere in range, and by nothing
 * at all at 44. The on-track dollar figure the page prints moves more — about
 * 5%, e.g. $180,433 to $171,117 for a 35-year-old on $105k — and that one is
 * shown to users.
 *
 * The reason to keep the schedule anyway is that 3% was a number somebody
 * chose, and these are numbers somebody published. The bands are also the real
 * shape of a career — 6.2% in the early twenties, 0.7% after forty — which is
 * worth being right about on a method page that invites checking.
 *
 * DIRECTION MATTERS. A higher g means the reference saver earned less early,
 * so saved less, so the bar is lower and the user's money age is higher. Left
 * as a single tunable number it is a flattery dial exactly like the reference
 * rate, which is why it is a published schedule instead.
 *
 * Caveat worth keeping in view: this is one cohort, followed from 1979. It is
 * the best public age-banded series available and it is cited on the page, but
 * it is not this decade's twenty-somethings.
 */
export const REAL_WAGE_GROWTH_BANDS: readonly { from: number; to: number; rate: number }[] = [
  { from: 0, to: 24, rate: 0.062 },
  { from: 25, to: 29, rate: 0.041 },
  { from: 30, to: 34, rate: 0.033 },
  { from: 35, to: 39, rate: 0.031 },
  { from: 40, to: 200, rate: 0.007 },
]

/** The band rate covering a given age. */
export function wageGrowthAt(age: number): number {
  const band = REAL_WAGE_GROWTH_BANDS.find((b) => age >= b.from && age <= b.to)
  return band?.rate ?? 0.007
}

/** The reference career begins here. */
export const CAREER_START_AGE = 22

/** Below this the number stops being meaningful; see spec §1.5. */
export const MIN_MONEY_AGE = 20
