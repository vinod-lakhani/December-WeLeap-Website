/**
 * What an internship offer is worth, for the term it covers.
 *
 * Almost nothing here is shared with the full-time offer tool, on purpose. An
 * intern is not plan-eligible for the match, has no equity, no bonus target
 * and no PTO worth valuing, and the question they are asking is not "what is
 * this package worth a year" but "what do I clear, and can I afford to live
 * there for the summer". So the inputs are the three shapes pay arrives in,
 * the term, and housing — and the headline is what is left after housing.
 *
 * TWO ACCURACY PROBLEMS THIS FILE EXISTS TO GET RIGHT.
 *
 * 1. Payroll over-withholds on a short term. Withholding tables assume each
 *    paycheck's rate continues all year, so $25/hr for twelve weeks is taxed
 *    as though it were $52,000 — while the actual liability on $12,000 of
 *    income, alone, is close to zero. Both numbers are computed below: what
 *    lands during the term, and what comes back at filing. Reporting only the
 *    first makes every offer look worse than it is; reporting only the second
 *    tells someone they have cash in June that arrives in April.
 *
 * 2. A cash housing stipend is wages. So is a relocation allowance (since
 *    2018). Both are taxed here, and the page says so, because an input that
 *    silently treats $1,500 a month as untaxed is the same error as the one
 *    above, on a different line.
 *
 * Federal brackets, the standard deduction, FICA and the per-state rate are
 * the ones every other calculator on the site reads, so two WeLeap tools cannot
 * quote different tax on the same dollars.
 */

import { federalTax, ficaTax, stateRate, hasStateRate } from '@/lib/firstPaycheck/calculation'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'

export type PayShape = 'hourly' | 'monthly' | 'lump'
export type HousingMode = 'provided' | 'stipend' | 'self'

export interface InternshipInputs {
  payShape: PayShape
  /** $/hour. Read when payShape is 'hourly'. */
  hourlyRate: number
  hoursPerWeek: number
  /** Hours above hoursPerWeek, paid at OVERTIME_MULTIPLIER. Hourly only. */
  overtimeHoursPerWeek: number
  /** $/month. Read when payShape is 'monthly'. */
  monthlyStipend: number
  /** $ for the whole term. Read when payShape is 'lump'. */
  lumpSum: number
  weeks: number
  /** Work state code, or '' when unset. */
  state: string
  housing: HousingMode
  /** $/month, paid in cash by the employer. Taxable. Read when housing is 'stipend'. */
  housingStipendMonthly: number
  /** $/month the intern pays. Read when housing is 'stipend' or 'self'. */
  rentMonthly: number
  /** One-off relocation or travel allowance. Taxable. */
  relocation: number
}

export const DEFAULT_WEEKS = 12
export const DEFAULT_HOURS_PER_WEEK = 40
export const OVERTIME_MULTIPLIER = 1.5
/** 52 / 12. Rent is monthly; terms are quoted in weeks. */
export const WEEKS_PER_MONTH = 52 / 12
/**
 * Federal flat rate on supplemental wages — a one-off allowance paid outside
 * the regular paycheck. Annualising a $2,000 lump as though it were paid every
 * week would withhold at a rate nobody is charged; the flat rate is what
 * payroll actually applies.
 */
export const SUPPLEMENTAL_FEDERAL_RATE = 0.22
/**
 * Deposit plus first month, due before the first paycheck lands. A deposit is
 * conventionally one month's rent; where it is not, the page says this is a
 * rule of thumb rather than a quote.
 */
export const UPFRONT_RENT_MONTHS = 2

export interface TaxLines {
  federal: number
  state: number
  fica: number
  total: number
}

export interface InternshipResult {
  /** Pay for the term before anything else — the figure in the offer. */
  wages: number
  housingStipend: number
  relocation: number
  /** Everything taxable, for the term. */
  gross: number
  months: number
  /**
   * Wages per week × 52. A comparison aid for holding an hourly offer up
   * against a full-time one, and the number recruiters use to make $45/hr
   * sound like $93,000. Never presented as expected earnings.
   */
  annualised: number
  /** What payroll takes during the term. */
  withheld: TaxLines
  /** What is actually owed on this income, if it is the year's only income. */
  owed: TaxLines
  /** withheld − owed, floored at zero. Arrives at filing, not during the term. */
  refund: number
  /** gross − withheld: what lands in the account across the term. */
  takeHome: number
  takeHomeMonthly: number
  /** rent × months, or zero when the employer provides housing. */
  housingCost: number
  /** The headline: takeHome − housingCost. */
  leftAfterHousing: number
  /** Deposit plus first month, before the first paycheck. Zero when provided. */
  upfrontCash: number
  /** Whether the state's rate is in the table, as opposed to a national blend. */
  stateNamed: boolean
}

function lines(federal: number, state: number, fica: number): TaxLines {
  return { federal, state, fica, total: federal + state + fica }
}

/** The pay the offer letter names, for the term. */
export function termWages(i: InternshipInputs): number {
  if (!(i.weeks > 0)) return 0
  switch (i.payShape) {
    case 'hourly': {
      const regular = Math.max(0, i.hourlyRate) * Math.max(0, i.hoursPerWeek)
      const overtime = Math.max(0, i.hourlyRate) * OVERTIME_MULTIPLIER * Math.max(0, i.overtimeHoursPerWeek)
      return (regular + overtime) * i.weeks
    }
    case 'monthly':
      return Math.max(0, i.monthlyStipend) * (i.weeks / WEEKS_PER_MONTH)
    case 'lump':
      return Math.max(0, i.lumpSum)
  }
}

export function computeInternship(i: InternshipInputs): InternshipResult | null {
  if (!(i.weeks > 0)) return null
  const wages = termWages(i)
  if (!(wages > 0)) return null

  const months = i.weeks / WEEKS_PER_MONTH
  const housingStipend = i.housing === 'stipend' ? Math.max(0, i.housingStipendMonthly) * months : 0
  const relocation = Math.max(0, i.relocation)
  const regularGross = wages + housingStipend
  const gross = regularGross + relocation

  const rate = stateRate(i.state)
  const annualised = (wages / i.weeks) * 52
  const annualisedRegular = (regularGross / i.weeks) * 52

  // What payroll takes: the regular paycheck annualised, the allowance flat.
  const share = i.weeks / 52
  const taxableAnnualised = Math.max(0, annualisedRegular - STANDARD_DEDUCTION_2026_SINGLE)
  const withheld = lines(
    federalTax(taxableAnnualised) * share + relocation * SUPPLEMENTAL_FEDERAL_RATE,
    taxableAnnualised * rate * share + relocation * rate,
    ficaTax(gross),
  )

  // What is owed, treating the term as the whole year's income.
  const taxableActual = Math.max(0, gross - STANDARD_DEDUCTION_2026_SINGLE)
  const owed = lines(federalTax(taxableActual), taxableActual * rate, ficaTax(gross))

  const refund = Math.max(0, withheld.total - owed.total)
  const takeHome = gross - withheld.total
  const rent = i.housing === 'provided' ? 0 : Math.max(0, i.rentMonthly)
  const housingCost = rent * months

  return {
    wages,
    housingStipend,
    relocation,
    gross,
    months,
    annualised,
    withheld,
    owed,
    refund,
    takeHome,
    takeHomeMonthly: takeHome / months,
    housingCost,
    leftAfterHousing: takeHome - housingCost,
    upfrontCash: rent * UPFRONT_RENT_MONTHS,
    stateNamed: hasStateRate(i.state),
  }
}

/** Blank inputs: nothing prefilled, so a result cannot exist before a number is typed. */
export function emptyInternship(): InternshipInputs {
  return {
    payShape: 'hourly',
    hourlyRate: 0,
    hoursPerWeek: DEFAULT_HOURS_PER_WEEK,
    overtimeHoursPerWeek: 0,
    monthlyStipend: 0,
    lumpSum: 0,
    weeks: DEFAULT_WEEKS,
    state: '',
    housing: 'self',
    housingStipendMonthly: 0,
    rentMonthly: 0,
    relocation: 0,
  }
}
