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
 * State rate. Deliberately the same table the rest of the site uses, so two
 * WeLeap tools cannot quote different state tax for the same person.
 */
const STATE_RATES: Record<string, number> = {
  CA: 0.09, NY: 0.06, TX: 0, WA: 0, MA: 0.05, IL: 0.0495, FL: 0, NV: 0, TN: 0, WY: 0, SD: 0, AK: 0, NH: 0,
}
export function stateRate(stateCode: string): number {
  return STATE_RATES[stateCode] ?? 0.04
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
  const annualState = Math.max(0, salaryAnnual - pretaxAnnual) * sRate
  // FICA is on wages less the HSA only; the 401(k) does not reduce it.
  const annualFica = ficaTax(Math.max(0, salaryAnnual - hsaAnnualTarget))
  const takeHomeAnnual = salaryAnnual - pretaxAnnual - annualFederal - annualState - annualFica
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
  } as FirstPaycheckPlan & { grossPerCheck: number }
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
