/**
 * What to type into the benefits forms, in the first week of a new job.
 *
 * Everything here is per PAYCHECK rather than per year, because that is the
 * unit the payroll portal asks for and the unit the reader can check against
 * the deposit that lands. An annual figure is the right answer to a different
 * question, and converting it in your head at the moment of entry is where
 * people get it wrong.
 */

import {
  FEDERAL_BRACKETS_2026_SINGLE,
  STANDARD_DEDUCTION_2026_SINGLE,
  ROTH_BREAKEVEN_RATE,
  FICA_TOTAL,
  FICA_MEDICARE,
  SS_WAGE_BASE_2026,
  TYPICAL_ENROLLMENT_WINDOW_DAYS,
} from './constants'
import { PAY_FREQUENCIES, type PayFrequency } from '@/lib/offer-parse/fields'
import {
  K401_EMPLOYEE_CAP,
  HSA_LIMIT_SINGLE,
  HSA_LIMIT_FAMILY,
  HSA_RECOMMENDED_START,
} from '@/lib/allocator/constants'

export interface FirstPaycheckInputs {
  salaryAnnual: number
  stateCode: string
  payFrequency: PayFrequency
  /** Employer match rate: 100 = dollar-for-dollar. */
  matchRatePct: number
  /** Percentage of salary the match runs up to. */
  matchCapPct: number
  /** Whether the offered plan is HSA-eligible. */
  hsaEligible: boolean
  hsaCoverage?: 'single' | 'family'
  /** ISO date the job starts. Used only for the enrollment window. */
  startDate?: string | null
  /**
   * Annual take-home from /api/tax, when it has answered. The state table here
   * is one flat rate per state; the API knows the real schedule. Absent, the
   * local figure stands and nothing waits.
   */
  takeHomeAnnualOverride?: number
}

/** Taxable income after the standard deduction and any pre-tax deferrals. */
export function taxableIncome(salaryAnnual: number, pretaxAnnual: number): number {
  return Math.max(0, salaryAnnual - pretaxAnnual - STANDARD_DEDUCTION_2026_SINGLE)
}

/**
 * The rate the NEXT dollar is taxed at.
 *
 * Marginal, not effective. "What does one more dollar of deferral save me" is
 * the only question that decides Roth versus pre-tax, and an effective rate
 * answers it wrongly in both directions.
 */
export function marginalFederalRate(taxable: number): number {
  for (const b of FEDERAL_BRACKETS_2026_SINGLE) {
    if (taxable <= b.upTo) return b.rate
  }
  return FEDERAL_BRACKETS_2026_SINGLE[FEDERAL_BRACKETS_2026_SINGLE.length - 1]!.rate
}

/** Federal tax owed, summed bracket by bracket. */
export function federalTax(taxable: number): number {
  let owed = 0
  let floor = 0
  for (const b of FEDERAL_BRACKETS_2026_SINGLE) {
    if (taxable <= floor) break
    owed += (Math.min(taxable, b.upTo) - floor) * b.rate
    floor = b.upTo
  }
  return owed
}

/** FICA on gross wages, respecting the Social Security wage base. */
export function ficaTax(grossWages: number): number {
  const ss = Math.min(grossWages, SS_WAGE_BASE_2026) * 0.062
  return ss + grossWages * FICA_MEDICARE
}

/**
 * Effective state income tax, charged on the same base the federal figure
 * uses: gross, less pre-tax deferrals, less the standard deduction.
 *
 * CALIBRATED AGAINST /api/tax (API Ninjas) ON 18 SEPTEMBER 2026, at $55,000,
 * $70,000 and $95,000 for a single filer — the range these tools serve. Each
 * rate is the one that minimises the worst dollar error across those three
 * incomes, then snapped to the statutory figure wherever that costs under $5
 * a year, so a flat-tax state reads as its real rate rather than a fitted
 * approximation of it.
 *
 * The previous table mixed two incompatible kinds of number. Some entries were
 * statutory flat rates, which belong on a taxable base and were correct. The
 * rest were effective rates measured against GROSS — the old comment recorded
 * California at "1.48% of gross at $50,000" and New York at "3.40%" — and were
 * then charged on taxable income anyway, understating both badly. Thirty-one
 * of fifty-one states were out, the worst by $1908 a year, and no test
 * covered any of it because the table was only ever checked for coverage.
 *
 * WHAT A FLAT RATE CANNOT DO. A graduated schedule is not a line through the
 * origin, so one number cannot fit a whole salary range: fitted to the middle,
 * it reads high at the bottom and low at the top. The residual worst cases are
 * CA $653, NJ $504, HI $353, VT $335, DC $258 a year. Every tool that reads this labels its output an estimate and
 * swaps in /api/tax when that answers, so this governs the first paint and the
 * offline fallback rather than the number anybody acts on. Per-state bracket
 * tables are the real fix and a much larger change.
 */
const STATE_RATES: Record<string, number> = {
  // No tax on wages.
  AK: 0, FL: 0, NH: 0, NV: 0, SD: 0, TN: 0, TX: 0,
  WA: 0, WY: 0,

  // Flat-rate states. The statutory rate reproduces the API to the cent.
  AZ: 0.025, CO: 0.044, GA: 0.0519, IA: 0.038, IL: 0.0495, IN: 0.0295, KY: 0.035,
  LA: 0.03, MA: 0.05, MI: 0.0425, NC: 0.0399, PA: 0.0307, RI: 0.0375, UT: 0.045,

  // Graduated schedules that one rate still tracks to within about $100 a year
  // across the range.
  AL: 0.0493, AR: 0.0376, ID: 0.0488, KS: 0.0543, MD: 0.0466, ME: 0.0637, MO: 0.044,
  MT: 0.0531, NE: 0.0405, NY: 0.0522, OR: 0.0823, VA: 0.0531,

  // Graduated schedules steep enough that one rate cannot follow them.
  // California is both the worst fit and the largest audience on this site.
  CA: 0.0409, CT: 0.0432, DC: 0.0615, DE: 0.0506, HI: 0.0575, MN: 0.06, MS: 0.0332,
  ND: 0.0034, NJ: 0.0304, NM: 0.0403, OH: 0.0153, OK: 0.0365, SC: 0.0505, VT: 0.0421,
  WI: 0.0439, WV: 0.0337,
}

export function stateRate(stateCode: string): number {
  return STATE_RATES[stateCode] ?? 0.04
}

/**
 * Whether the table names this state, as opposed to blending it at 4%.
 *
 * Needed as its own question because several states genuinely are 4% — reading
 * the rate back cannot tell "Kentucky, which is flat 4%" apart from "a code we
 * have never heard of".
 */
export function hasStateRate(stateCode: string): boolean {
  return Object.prototype.hasOwnProperty.call(STATE_RATES, stateCode)
}

export interface FirstPaycheckPlan {
  periodsPerYear: number
  /** What to type in the 401(k) box, as a percentage of pay. */
  contributionPct: number
  /** That percentage, per paycheck, before tax. */
  contributionPerCheck: number
  /** What it actually costs out of take-home, after the tax it saves. */
  contributionCostPerCheck: number
  /** The employer's half, per year. */
  employerMatchAnnual: number
  /** Roth or traditional, and the reason. */
  rothOrTraditional: 'Roth' | 'Traditional'
  marginalRate: number
  /** HSA per check, and the annual figure it comes from. */
  hsaPerCheck: number
  hsaAnnualTarget: number
  /** The legal maximum, so the page can say what the starting point is short of. */
  hsaCeilingAnnual: number
  hsaCostPerCheck: number
  /** Estimated take-home for one full period once everything is set. */
  takeHomePerCheck: number
  /** Salary divided by the number of periods, before anything comes out. */
  grossPerCheck: number
  /** Best guess at the enrollment deadline, ISO. Null without a start date. */
  enrollmentDeadline: string | null
}

/**
 * The whole recommendation.
 *
 * The 401(k) percentage is the match cap and nothing more. This tool answers
 * the first week of a job, where the only unambiguous move is capturing the
 * match — everything above it is a question about debt, buffer and priorities
 * that the money plan exists to answer, and guessing at it here would be
 * inventing a plan from four fields.
 */
export function computeFirstPaycheck(inputs: FirstPaycheckInputs): FirstPaycheckPlan {
  const { salaryAnnual, stateCode, payFrequency, matchRatePct, matchCapPct, hsaEligible } = inputs
  const periodsPerYear = PAY_FREQUENCIES[payFrequency]
  const grossPerCheck = salaryAnnual / periodsPerYear

  // Capture the match, and never recommend past the IRS limit.
  const cappedPct = salaryAnnual > 0
    ? Math.min(matchCapPct, (K401_EMPLOYEE_CAP / salaryAnnual) * 100)
    : matchCapPct
  const contributionPct = Math.max(0, cappedPct)
  const contributionAnnual = (salaryAnnual * contributionPct) / 100
  const contributionPerCheck = contributionAnnual / periodsPerYear

  /**
   * A starting point, not the legal maximum.
   *
   * Filling the whole HSA limit is the right answer eventually and the wrong
   * one in week one: this is somebody's first job, the deductible is the thing
   * the HSA exists to cover, and telling them to divert the maximum before
   * they have any cash buffer is advice that breaks the first time a tyre goes.
   * HSA_RECOMMENDED_START is the figure the money plan already uses for
   * somebody starting from zero, so the two tools cannot tell the same person
   * different numbers. Capped by the real limit for completeness.
   */
  const hsaCeiling = inputs.hsaCoverage === 'family' ? HSA_LIMIT_FAMILY : HSA_LIMIT_SINGLE
  const hsaAnnualTarget = hsaEligible ? Math.min(HSA_RECOMMENDED_START, hsaCeiling) : 0
  const hsaCeilingAnnual = hsaEligible ? hsaCeiling : 0
  const hsaPerCheck = hsaAnnualTarget / periodsPerYear

  // Marginal rate is read AFTER the deferrals, because they are what move you
  // between brackets — and moving is exactly the case worth knowing about.
  const pretaxAnnual = contributionAnnual + hsaAnnualTarget
  const taxable = taxableIncome(salaryAnnual, pretaxAnnual)
  const marginalRate = marginalFederalRate(taxable)
  const sRate = stateRate(stateCode)

  /**
   * What a pre-tax dollar costs out of take-home.
   *
   * A 401(k) deferral escapes income tax but NOT FICA, so it costs
   * (1 - fed - state). An HSA through payroll escapes both, so it costs
   * (1 - fed - state - FICA) — about 7.65 cents less on the dollar. Treating
   * them identically is the most common error in this arithmetic.
   */
  const contributionCostPerCheck = contributionPerCheck * (1 - marginalRate - sRate)
  const hsaCostPerCheck = hsaPerCheck * (1 - marginalRate - sRate - FICA_TOTAL)

  const employerMatchAnnual = (salaryAnnual * Math.min(contributionPct, matchCapPct) * (matchRatePct / 100)) / 100

  const annualFederal = federalTax(taxable)
  // On taxable income, the same base the federal figure and /api/tax use.
  // Charging it on gross-less-pretax overstated it by the deduction times the
  // rate, which is small but it is the kind of small that makes two of our own
  // numbers disagree.
  const annualState = taxable * sRate
  // FICA is on wages less the HSA only; the 401(k) does not reduce it.
  const annualFica = ficaTax(Math.max(0, salaryAnnual - hsaAnnualTarget))
  const takeHomeAnnual =
    inputs.takeHomeAnnualOverride ??
    salaryAnnual - pretaxAnnual - annualFederal - annualState - annualFica
  const takeHomePerCheck = takeHomeAnnual / periodsPerYear

  return {
    periodsPerYear,
    contributionPct,
    contributionPerCheck,
    contributionCostPerCheck,
    employerMatchAnnual,
    rothOrTraditional: marginalRate >= ROTH_BREAKEVEN_RATE ? 'Traditional' : 'Roth',
    marginalRate,
    hsaPerCheck,
    hsaAnnualTarget,
    hsaCeilingAnnual,
    hsaCostPerCheck,
    takeHomePerCheck,
    enrollmentDeadline: enrollmentDeadline(inputs.startDate ?? null),
    grossPerCheck,
  }
}

/**
 * The likely enrollment deadline.
 *
 * Thirty days from the start date, and presented as a guess everywhere it is
 * shown. Plans set their own windows and some are shorter; being confidently
 * wrong here costs somebody a year of coverage, so the number exists to prompt
 * a check rather than to be relied on.
 */
export function enrollmentDeadline(startDate: string | null): string | null {
  if (!startDate) return null
  const d = new Date(startDate + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  d.setDate(d.getDate() + TYPICAL_ENROLLMENT_WINDOW_DAYS)
  return d.toISOString().slice(0, 10)
}
