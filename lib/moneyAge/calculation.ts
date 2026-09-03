/**
 * Money Age — how old your money is.
 *
 * The whole idea in one sentence: we build one imaginary saver, and report the
 * age at which they would have held what you hold.
 *
 * The imaginary saver — the yardstick — has a career rather than a salary. They
 * start at 22 earning less than you do, their pay grows, and it equals yours at
 * your age. The draft version had them earning your CURRENT salary every year
 * since 22, which measured a 35-year-old on $120k against someone who earned
 * $120k at 22 — an impossible person, and a bar that rose with seniority. That
 * error reached 3.4 years by age 40 and was pure artefact.
 *
 * See docs/specs/money-age-v2.md for the derivation and the numbers.
 */

import {
  REAL_RETURN as r,
  REFERENCE_SAVINGS_RATE,
  RATE_CREDIT_PER_UNIT,
  RATE_CREDIT_CLAMP_YEARS,
  REAL_INCOME_GROWTH,
  CAREER_START_AGE,
  MIN_MONEY_AGE,
} from './constants'

export interface MoneyAgeInputs {
  /** Your age. */
  age: number
  /** Gross annual income. */
  income: number
  /**
   * Net position: retirement + investments + cash, minus high-APR balances.
   * May be negative — a card balance larger than savings is a real state.
   */
  position: number
  /**
   * Annual savings rate as a fraction of gross, counting BOTH your own
   * contributions and your employer's. See constants: this must count what
   * REFERENCE_SAVINGS_RATE counts.
   */
  savingsRate: number
}

export interface MoneyAgeResult {
  /** The headline, whole years. */
  moneyAge: number
  /** Positive = ahead of your real age. THIS is what the page leads with. */
  deltaYears: number
  /** Years attributable to what you hold. */
  positionYears: number
  /** Years attributable to what you're putting away. */
  rateCredit: number
  /** What the yardstick holds at your age — the "on track" figure. */
  onTrackPosition: number
  /** True when the position term is floored, i.e. nothing (or less) saved. */
  atFloor: boolean
}

/**
 * What the yardstick holds at age `t`.
 *
 * A growing annuity: contributions rise with income at `g`, and each one
 * compounds at `r` until age `t`. The (1+g)^(START−A) factor rebases their pay
 * so it equals the user's income at the user's age rather than at 22.
 */
export function yardstickBalance(t: number, income: number, age: number): number {
  const n = t - CAREER_START_AGE
  if (n <= 0 || income <= 0) return 0
  const g = REAL_INCOME_GROWTH
  const firstYearContribution =
    REFERENCE_SAVINGS_RATE * income * Math.pow(1 + g, CAREER_START_AGE - age)
  // r === g would divide by zero. Not reachable with the shipped constants,
  // but this file outlives its constants.
  if (Math.abs(r - g) < 1e-9) {
    return firstYearContribution * n * Math.pow(1 + r, n - 1)
  }
  return (firstYearContribution * (Math.pow(1 + r, n) - Math.pow(1 + g, n))) / (r - g)
}

/**
 * The age at which the yardstick held `position`.
 *
 * Bisection, because the growing-annuity inverse has no closed form. Sixty
 * iterations of arithmetic is not worth an approximation that would then need
 * its own error bound.
 */
function yardstickAgeAt(position: number, income: number, age: number): number {
  if (position <= 0 || income <= 0) return CAREER_START_AGE
  let lo = CAREER_START_AGE
  let hi = 100
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2
    if (yardstickBalance(mid, income, age) < position) lo = mid
    else hi = mid
  }
  return lo
}

/**
 * Credit or debit for saving above or below the reference rate.
 *
 * Clamped, because this term is driven by a self-reported number — on the tool
 * it is a slider people drag rather than a figure they look up — and it should
 * not be able to swamp the balance they actually hold.
 */
export function rateCredit(savingsRate: number): number {
  const B = REFERENCE_SAVINGS_RATE
  const raw = (RATE_CREDIT_PER_UNIT * (savingsRate - B)) / B
  return Math.max(-RATE_CREDIT_CLAMP_YEARS, Math.min(RATE_CREDIT_CLAMP_YEARS, raw))
}

export function computeMoneyAge(inputs: MoneyAgeInputs): MoneyAgeResult {
  const { age, income, position, savingsRate } = inputs
  const positionAge = yardstickAgeAt(position, income, age)
  const positionYears = positionAge - CAREER_START_AGE
  const credit = rateCredit(savingsRate)

  const raw = CAREER_START_AGE + positionYears + credit
  const moneyAge = Math.max(MIN_MONEY_AGE, Math.round(raw))

  return {
    moneyAge,
    // Computed from the ROUNDED age so the two numbers on screen agree. A
    // delta derived from the unrounded value can read "+3" beside an age that
    // is 4 years above the user's own, which looks like a bug.
    deltaYears: moneyAge - age,
    positionYears,
    rateCredit: credit,
    onTrackPosition: yardstickBalance(age, income, age),
    atFloor: position <= 0,
  }
}

/**
 * The same number after a move, for pricing a recommendation in years.
 *
 * Returns null when the move changes nothing, so callers cannot accidentally
 * render "+0 years" as though it were a result. Some correct moves genuinely do
 * not move this number — shifting idle cash to a high-yield account is the
 * obvious one — and saying so is what makes the non-zero cases believable.
 */
export function priceMove(
  before: MoneyAgeInputs,
  after: Partial<MoneyAgeInputs>
): { before: number; after: number; gain: number } | null {
  const a = computeMoneyAge(before)
  const b = computeMoneyAge({ ...before, ...after })
  if (b.moneyAge === a.moneyAge) return null
  return { before: a.moneyAge, after: b.moneyAge, gain: b.moneyAge - a.moneyAge }
}
