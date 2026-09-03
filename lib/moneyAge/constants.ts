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
 * Real income growth for the reference saver's career.
 *
 * PROVISIONAL. This is the one parameter still carrying a picked number rather
 * than a citation, and it changes the answer for older users most. Treat it the
 * way B was treated: source it before this leaves beta.
 */
export const REAL_INCOME_GROWTH = 0.03

/** The reference career begins here. */
export const CAREER_START_AGE = 22

/** Below this the number stops being meaningful; see spec §1.5. */
export const MIN_MONEY_AGE = 20
