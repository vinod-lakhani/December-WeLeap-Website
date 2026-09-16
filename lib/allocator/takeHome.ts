/**
 * Take-home for the Trajectory Plan.
 *
 * This file used to carry its own tax code, and it was the worst of the three
 * copies on the site. It applied a MARGINAL rate as though it were an effective
 * rate, from a 2023 bracket table, with no standard deduction, and charged FICA
 * on income net of the 401(k) — which does not escape FICA. The compounding
 * error understated take-home by $629 to $968 a month across ordinary
 * salaries.
 *
 * That mattered more here than anywhere else, because everything the Money Plan
 * produces is an allocation OF take-home. A number a thousand dollars light did
 * not just misreport one figure; it shrank the buffer, the debt payment and the
 * retirement line together, and the solvency floor in retirementTarget.ts was
 * being measured against an income nobody had.
 *
 * It now calls the same functions the tax API route and every other calculator
 * use. One tax model, one place.
 */

import { federalTax, ficaTax, stateRate, taxableIncome } from '@/lib/firstPaycheck/calculation'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'

/**
 * Total annual tax, given gross and the pre-tax money coming out of it.
 *
 * FICA is deliberately charged on gross less the HSA rather than on taxable
 * income. A 401(k) deferral escapes income tax and not FICA; an HSA
 * contribution made through payroll escapes both. Treating them alike was
 * worth 7.65 cents on every deferred dollar, in the wrong direction.
 */
export function estimateTaxAnnual(
  grossAnnual: number,
  pretax401kAnnual: number,
  pretaxHsaAnnual: number,
  stateCode: string,
): number {
  if (grossAnnual <= 0) return 0
  const pretax = pretax401kAnnual + pretaxHsaAnnual
  const federal = federalTax(taxableIncome(grossAnnual, pretax))
  const state = Math.max(0, grossAnnual - pretax - STANDARD_DEDUCTION_2026_SINGLE) * stateRate(stateCode)
  const fica = ficaTax(Math.max(0, grossAnnual - pretaxHsaAnnual))
  return Math.round(federal + state + fica)
}

export interface TakeHomeInputs {
  salaryAnnual: number;
  employee401kPct: number;
  currentHsaAnnual: number;
  stateCode: string;
}

/**
 * Net take-home monthly after 401(k), HSA, and taxes.
 * grossMonthly - pretax401k - pretaxHsa - tax(taxable) = net.
 */
export function computeNetTakeHomeMonthly(inputs: TakeHomeInputs): number {
  const { salaryAnnual, employee401kPct, currentHsaAnnual, stateCode } = inputs;
  const pretax401kAnnual = (salaryAnnual * employee401kPct) / 100;
  const pretaxHsaAnnual = currentHsaAnnual;
  const afterPretax = salaryAnnual - pretax401kAnnual - pretaxHsaAnnual;
  if (afterPretax <= 0) return 0;
  const totalTaxAnnual = estimateTaxAnnual(salaryAnnual, pretax401kAnnual, pretaxHsaAnnual, stateCode);
  return (afterPretax - totalTaxAnnual) / 12;
}
