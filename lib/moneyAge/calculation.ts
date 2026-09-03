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
  wageGrowthAt,
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
 * What the reference saver earned at age `t`, given the user's income now.
 *
 * Walks year by year from the user's age using the BLS band rates, so the path
 * lands exactly on the user's income at the user's age and follows the real
 * shape of a career on the way there — steep in the twenties, nearly flat after
 * forty. A single growth rate cannot do that, and averaging the bands into one
 * number is least accurate for the older users whose answer moves most.
 */
export function referenceIncomeAt(t: number, income: number, age: number): number {
  if (income <= 0) return 0
  let value = income
  if (t < age) {
    // Step backwards: undo each year's growth.
    for (let a = age; a > t; a--) value /= 1 + wageGrowthAt(a - 1)
  } else {
    for (let a = age; a < t; a++) value *= 1 + wageGrowthAt(a)
  }
  return value
}

/**
 * What the yardstick holds at age `t`.
 *
 * Accumulated year by year rather than in closed form. The growing-annuity
 * formula this replaced needed a single constant growth rate, and the whole
 * point of the band schedule is that a single rate misstates the career shape.
 * Twenty-odd iterations of arithmetic is a cheap price for not having to pick
 * one number, and it also disposes of the r === g edge case the closed form
 * carried.
 *
 * Fractional ages are interpolated so the result stays continuous, which the
 * bisection below relies on.
 */
export function yardstickBalance(t: number, income: number, age: number): number {
  if (t <= CAREER_START_AGE || income <= 0) return 0

  const whole = Math.floor(t)
  const balanceAt = (target: number): number => {
    let balance = 0
    for (let a = CAREER_START_AGE; a < target; a++) {
      balance = balance * (1 + r) + REFERENCE_SAVINGS_RATE * referenceIncomeAt(a, income, age)
    }
    return balance
  }

  const lower = balanceAt(whole)
  const frac = t - whole
  if (frac === 0) return lower
  return lower + (balanceAt(whole + 1) - lower) * frac
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
