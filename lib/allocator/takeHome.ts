/**
 * Realistic take-home model for the Trajectory Plan.
 * Take-home = gross − 401(k) − HSA − tax(taxable income).
 * Taxable income = gross − 401(k) − HSA.
 * Uses same simplified effective-rate logic as API fallback.
 */

/** Federal effective rates by bracket (simplified). */
function federalEffectiveRate(annualIncome: number): number {
  if (annualIncome > 578125) return 0.37;
  if (annualIncome > 231250) return 0.35;
  if (annualIncome > 182050) return 0.32;
  if (annualIncome > 95350) return 0.24;
  if (annualIncome > 44725) return 0.22;
  if (annualIncome > 11000) return 0.12;
  return 0.10;
}

const STATE_RATES: Record<string, number> = {
  CA: 0.09,
  NY: 0.06,
  TX: 0,
  WA: 0,
  MA: 0.05,
  IL: 0.0495,
};

const FICA_RATE = 0.062 + 0.0145; // Social Security + Medicare

/**
 * Estimate total annual tax from taxable income (after 401k and HSA).
 */
export function estimateTaxAnnual(taxableIncomeAnnual: number, stateCode: string): number {
  if (taxableIncomeAnnual <= 0) return 0;
  const federal = taxableIncomeAnnual * federalEffectiveRate(taxableIncomeAnnual);
  const stateRate = STATE_RATES[stateCode] ?? 0.04;
  const state = taxableIncomeAnnual * stateRate;
  const fica = taxableIncomeAnnual * FICA_RATE;
  return Math.round(federal + state + fica);
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
  const grossAnnual = salaryAnnual;
  const pretax401kAnnual = (grossAnnual * employee401kPct) / 100;
  const pretaxHsaAnnual = currentHsaAnnual;
  const taxableIncomeAnnual = grossAnnual - pretax401kAnnual - pretaxHsaAnnual;
  if (taxableIncomeAnnual <= 0) return 0;
  const totalTaxAnnual = estimateTaxAnnual(taxableIncomeAnnual, stateCode);
  const netAnnual = taxableIncomeAnnual - totalTaxAnnual;
  return netAnnual / 12;
}
