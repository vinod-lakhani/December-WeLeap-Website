/**
 * What a job offer is worth, as a pure function.
 *
 * This was a useMemo inside OfferAnalysisTool, which was fine while there was
 * exactly one offer on the page. Comparing two means running the same
 * arithmetic against two sets of inputs, and a hook cannot be called twice with
 * different arguments — so the arithmetic moves here and the component keeps
 * only the state.
 *
 * Nothing about the numbers changed in the move. The one difference is that
 * this file can be tested directly, which the calculation had never been: every
 * figure the tool has ever shown was produced by fifty lines that no test
 * touched, including the match cap below, which a real benefits guide broke.
 */

import { K401_EMPLOYEE_CAP } from '@/lib/allocator/constants'

/** US market average, and the baseline PTO is measured against. */
export const MARKET_PTO_DAYS = 15

/** Long-run nominal return used for the 40-year projection. */
const ANNUAL_RETURN = 0.07

/** Working days in a year, for valuing a day of PTO against salary. */
const WORKING_DAYS = 260

/** Effective rate assumed while /api/tax has not answered yet. */
const FALLBACK_EFFECTIVE_TAX_RATE = 0.28

/** Take-home assumed while /api/tax has not answered yet. */
const FALLBACK_TAKE_HOME_RATE = 0.72

/** What /api/tax returns for one salary in one state. */
export interface TaxResult {
  netIncomeAnnual: number
  federalTaxAnnual: number
  stateTaxAnnual: number
  ficaTaxAnnual: number
}

/**
 * Everything about one offer that affects its value.
 *
 * Deliberately one object rather than a long argument list: the compare feature
 * holds a second one of these in a single piece of state, where the component's
 * own fields are still fourteen separate scalars.
 */
export interface OfferInputs {
  /** Base salary, annual. */
  salary: number
  /** Bonus at target, as a percentage of base. */
  bonusPct: number
  /** Employer match rate — 100 means a dollar per dollar. */
  matchRatePct: number
  /** Employee deferral the match applies up to, as a percentage of base. */
  matchUpToPct: number
  /** Employer HSA contribution, monthly. */
  hsaMonthly: number
  /** Employee healthcare premium, monthly. Subtracts from the package. */
  healthcarePremium: number
  /** Equity vesting per year, in dollars. */
  rsuAnnual: number
  /** Whether the offer includes an ESPP worth counting. */
  showEspp: boolean
  /** Share of salary contributed to the ESPP. */
  esppContrib: number
  /** ESPP purchase discount. */
  esppDiscount: number
  /** Paid time off, in days. */
  ptoDays: number
  /** Rent for this offer's location, monthly. */
  rentMonthly: number
  /** Share of take-home saved, from the 50/30/20 split. */
  savingsPct: number
}

export interface OfferValue {
  takeHomeMonthly: number
  effectiveTaxRate: number
  annualBonus: number
  annual401kMatch: number
  annualHsa: number
  annualHealthcare: number
  annualEspp: number
  annualBonusAfterTax: number
  annualRsuAfterTax: number
  annualEsppAfterTax: number
  ptoValue: number
  totalPackage: number
  monthlyWealth: number
  nw40yr: number
  /** Rent as a share of take-home, or null when either is unknown. */
  rentPct: number | null
}

/**
 * @param tax Result from /api/tax, or null while it is in flight. The estimate
 *   degrades rather than failing: a flat 72% take-home and a 28% effective rate
 *   stand in, so the package number means something before the call returns.
 */
export function computeOfferValue(inputs: OfferInputs, tax: TaxResult | null): OfferValue | null {
  const {
    salary, bonusPct, matchRatePct, matchUpToPct, hsaMonthly, healthcarePremium,
    rsuAnnual, showEspp, esppContrib, esppDiscount, ptoDays, rentMonthly, savingsPct,
  } = inputs

  if (salary <= 0) return null

  const takeHomeMonthly = tax
    ? Math.round(tax.netIncomeAnnual / 12)
    : Math.round((salary * FALLBACK_TAKE_HOME_RATE) / 12)

  // Effective tax rate on the base salary — used to approximate tax on
  // bonus/equity. RSUs, bonuses, and ESPP are taxed as ordinary income
  // (supplemental withholding), so applying the same effective rate is a
  // reasonable estimate.
  const effectiveTaxRate = tax
    ? (tax.federalTaxAnnual + tax.stateTaxAnnual + tax.ficaTaxAnnual) / salary
    : FALLBACK_EFFECTIVE_TAX_RATE

  const annualBonus = (salary * bonusPct) / 100

  /**
   * Capped at the IRS employee deferral limit.
   *
   * An employer matches what the employee actually defers, and above the cap
   * they cannot defer any more — so the match stops growing. Without this the
   * formula is salary x cap% x rate% with nothing to stop it, which held up
   * only because the defaults are 100% up to 6% and 6% of a salary is rarely
   * near the limit.
   *
   * A real benefits guide broke it: "Company match is $0.30 on every $1
   * employee deferral up to 60% of salary." Read faithfully — and it is
   * faithful, those are the document's words — that is 18% of pay in employer
   * match, $27,000 on a $150,000 salary against a true maximum of $7,350.
   * The same guard already exists in lib/hero/matchLeap.ts for the homepage.
   */
  const matchedDeferral = Math.min(salary * (matchUpToPct / 100), K401_EMPLOYEE_CAP)
  const annual401kMatch = matchedDeferral * (matchRatePct / 100)

  const annualHsa = hsaMonthly * 12
  const annualHealthcare = -(healthcarePremium * 12)
  const annualEspp = showEspp
    ? Math.round(((salary * esppContrib) / 100) * (esppDiscount / 100))
    : 0

  // totalPackage is pre-tax total comp — industry standard for comp discussions
  const totalPackage =
    salary + annualBonus + annual401kMatch + annualHsa + annualHealthcare + rsuAnnual + annualEspp
  const ptoValue = Math.round((salary / WORKING_DAYS) * Math.max(0, ptoDays - MARKET_PTO_DAYS))

  // After-tax values for wealth-building — bonus and equity are taxed before
  // you keep them
  const annualBonusAfterTax = annualBonus * (1 - effectiveTaxRate)
  const annualRsuAfterTax = rsuAnnual * (1 - effectiveTaxRate)
  const annualEsppAfterTax = annualEspp * (1 - effectiveTaxRate)

  // Monthly wealth = after-tax savings rate + employer contributions (pre-tax
  // benefit) + after-tax equity
  const monthlyWealth =
    Math.round((takeHomeMonthly * savingsPct) / 100) +
    (annual401kMatch + annualHsa) / 12 +
    (annualBonusAfterTax + annualRsuAfterTax + annualEsppAfterTax) / 12

  const monthlyRate = ANNUAL_RETURN / 12
  const nw40yr = Math.round(monthlyWealth * ((Math.pow(1 + monthlyRate, 480) - 1) / monthlyRate))
  const rentPct =
    rentMonthly > 0 && takeHomeMonthly > 0 ? Math.round((rentMonthly / takeHomeMonthly) * 100) : null

  return {
    takeHomeMonthly, effectiveTaxRate,
    annualBonus, annual401kMatch, annualHsa, annualHealthcare, annualEspp,
    annualBonusAfterTax, annualRsuAfterTax, annualEsppAfterTax,
    ptoValue, totalPackage, monthlyWealth, nw40yr, rentPct,
  }
}
