/**
 * What the first student loan payment does to a paycheck.
 *
 * The balance is the number a borrower already knows. The payment is the number
 * they can look up. The one nobody has told them is what lands in the account
 * afterwards, and that is the whole tool.
 *
 * Federal brackets, the standard deduction, FICA and the state table all come
 * from the first-paycheck module rather than a second copy. Two WeLeap tools
 * quoting different take-home for the same salary is the kind of error nobody
 * catches until a user does, and the mock this was built from had already
 * drifted: it carried a $15,750 standard deduction against the site's $16,100.
 */

import {
  federalTax,
  ficaTax,
  stateRate,
  taxableIncome,
} from '@/lib/firstPaycheck/calculation'

/**
 * Standard repayment, and deliberately the only plan here.
 *
 * It is what a federal borrower is placed on unless they choose otherwise, so
 * it answers "what happens if I do nothing" — which is the question somebody
 * three weeks from the end of a grace period is actually asking. Income-driven
 * plans changed under 2025 legislation and quoting one that a 2026 borrower
 * cannot enrol in would be worse than not offering the comparison at all.
 */
export const STANDARD_TERM_MONTHS = 120

/**
 * Above this the loan is worth attacking before anything optional. Matches the
 * threshold the allocator uses, so the free tool and the app cannot disagree
 * about the same debt.
 */
export const HIGH_APR_THRESHOLD = 0.10

/** A default 401(k) deferral, only used to price what keeping a match costs. */
export const MATCH_DEFERRAL_PCT = 4

/**
 * Assumed dollar for dollar, up to the same cap.
 *
 * This tool does not ask for match terms, because it has one screen and the
 * grace period is the thing it is about. A full match to about 4% is the
 * commonest arrangement, and the page says it is assuming it rather than
 * presenting it as a reading of anybody's benefits.
 */
export const ASSUMED_MATCH_RATE_PCT = 100

export interface LoanPaymentInputs {
  /** Loan balance in dollars. */
  balance: number
  /** Annual interest rate as a percentage, e.g. 6.5. */
  aprPct: number
  /** Gross annual salary. */
  salary: number
  /** Two-letter state code, or '' for the blended national estimate. */
  state: string
  /** Percent of salary deferred to a 401(k) to capture the match. */
  deferralPct: number
  /**
   * Monthly take-home from /api/tax, when it has answered. The flat state
   * table is a national average; the API knows the actual schedule, and
   * California alone ranges from 1.5% of gross to 3.5% across the salaries
   * this tool sees. Absent, the local estimate stands.
   */
  takeHomeBeforeOverride?: number
  /** The same figure with the recommended deferral running. */
  takeHomeWithDeferralOverride?: number
}

export interface LoanPaymentResult {
  /** Monthly payment on the standard ten-year plan. */
  payment: number
  /** Monthly take-home before the loan, and before any 401(k). */
  takeHomeBefore: number
  /** Take-home once the loan payment is made. The headline. */
  takeHomeAfter: number
  /** And once the 401(k) deferral the tool recommends is also running. */
  takeHomeWithMatch: number
  /** Monthly cost of that deferral out of take-home, after the tax it saves. */
  deferralCostMonthly: number
  /** Gross, tax and payment, for the ledger. */
  grossMonthly: number
  taxMonthly: number
  /** The recommended deferral, monthly. */
  deferralMonthly: number
  /** What the employer adds for making it, monthly. */
  employerMatchMonthly: number
  /** Deferral plus match: what actually reaches retirement each month. */
  retirementMonthly: number
  /**
   * Tax with the deferral running, so a ledger that includes the contribution
   * reconciles to takeHomeWithMatch rather than to the figure somebody gets by
   * ignoring the advice above it.
   */
  taxWithDeferralMonthly: number
  /** True when the rate is high enough to attack before optional saving. */
  highApr: boolean
  /** Total interest over the standard term, if nothing changes. */
  interestTotal: number
}

/**
 * Standard amortization. `r = 0` divides evenly rather than dividing by zero,
 * which is not a rate any real loan carries but is a value a text input can
 * hold for as long as somebody is mid-keystroke.
 */
export function monthlyPayment(balance: number, aprPct: number, months = STANDARD_TERM_MONTHS): number {
  if (!(balance > 0) || !(months > 0)) return 0
  const r = aprPct / 100 / 12
  if (r <= 0) return balance / months
  return (balance * r) / (1 - Math.pow(1 + r, -months))
}

/**
 * Monthly take-home for a salary, with an optional pre-tax deferral.
 *
 * Exported because the same arithmetic is the instant answer and the fallback:
 * the tool shows this immediately and replaces it with /api/tax when that
 * returns, which knows the real state schedule rather than one flat rate.
 */
export function localTakeHomeMonthly(salary: number, state: string, deferralAnnual: number): number {
  if (!(salary > 0)) return 0
  const pretax = Math.min(Math.max(deferralAnnual, 0), salary)
  const federal = federalTax(taxableIncome(salary, pretax))
  // FICA is charged on gross: a 401(k) deferral does not escape it, which is
  // the difference between a 401(k) and an HSA and the reason the cost of
  // deferring is not simply the marginal rate.
  const fica = ficaTax(salary)
  // On taxable income, the same base the federal figure above uses and the
  // one the rates in STATE_RATES are calibrated against. This charged it on
  // gross-less-deferrals, which was a third formula for the same quantity —
  // the allocator and the paycheck tool both used the taxable base — and it
  // overstated state tax by the standard deduction times the rate, about $700
  // a year in a 4.4% state.
  const stateTax = taxableIncome(salary, pretax) * stateRate(state)
  return (salary - pretax - federal - fica - stateTax) / 12
}

export function computeLoanPayment(inputs: LoanPaymentInputs): LoanPaymentResult | null {
  const { balance, aprPct, salary, state, deferralPct } = inputs
  if (!(salary > 0)) return null

  const payment = monthlyPayment(balance, aprPct)

  const takeHomeBefore = inputs.takeHomeBeforeOverride ?? localTakeHomeMonthly(salary, state, 0)
  const takeHomeAfter = takeHomeBefore - payment

  const deferralAnnual = salary * (Math.max(deferralPct, 0) / 100)
  const takeHomeWithDeferral =
    inputs.takeHomeWithDeferralOverride ?? localTakeHomeMonthly(salary, state, deferralAnnual)
  const takeHomeWithMatch = takeHomeWithDeferral - payment

  const grossMonthly = salary / 12
  const taxMonthly = grossMonthly - takeHomeBefore

  const deferralMonthly = deferralAnnual / 12
  const employerMatchMonthly = deferralMonthly * (ASSUMED_MATCH_RATE_PCT / 100)
  const taxWithDeferralMonthly = grossMonthly - deferralMonthly - takeHomeWithDeferral

  return {
    deferralMonthly,
    employerMatchMonthly,
    retirementMonthly: deferralMonthly + employerMatchMonthly,
    taxWithDeferralMonthly,
    payment,
    takeHomeBefore,
    takeHomeAfter,
    takeHomeWithMatch,
    deferralCostMonthly: takeHomeAfter - takeHomeWithMatch,
    grossMonthly,
    taxMonthly,
    highApr: aprPct / 100 >= HIGH_APR_THRESHOLD,
    interestTotal: Math.max(0, payment * STANDARD_TERM_MONTHS - balance),
  }
}
