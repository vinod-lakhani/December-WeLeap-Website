/**
 * Net Worth Impact — math module
 * Implements FV for investing (compound), cash (linear), and debt (interest-saved estimate).
 */

import type { HorizonImpact, ImpactInputs } from "./types";

const HORIZONS = [1, 10, 30] as const;

/** Future value of monthly contributions, compounding at monthly rate i. Edge case: r=0 → FV = P * nMonths */
export function computeInvestingImpact(P: number, r: number, years: number): number {
  const nMonths = years * 12;
  const absP = Math.abs(P);
  const sign = P >= 0 ? 1 : -1;

  if (r === 0) {
    return sign * (absP * nMonths);
  }
  const i = r / 12;
  const fv = absP * ((Math.pow(1 + i, nMonths) - 1) / i);
  return sign * fv;
}

/** Cash: no growth — FV = P * nMonths */
export function computeCashImpact(P: number, years: number): number {
  const nMonths = years * 12;
  return P * nMonths;
}

/**
 * Debt payoff: simplified interest-saved estimate.
 * principalExtra = P * nMonths; interestSaved ≈ principalExtra * (apr * years) / 2
 * Net worth impact = interestSaved (positive if P > 0).
 */
export function computeDebtImpact(P: number, apr: number, years: number): number {
  const nMonths = years * 12;
  const principalExtra = P * nMonths;
  const interestSaved = principalExtra * (apr * years) / 2;
  return P >= 0 ? interestSaved : -interestSaved;
}

export function computeImpacts(inputs: ImpactInputs): HorizonImpact[] {
  const r = inputs.realReturn ?? 0.07;
  const apr = inputs.debtApr ?? 0.18;
  const P = inputs.monthlyDelta;

  return HORIZONS.map((years) => {
    let impact: number;
    switch (inputs.useCase) {
      case "investing":
        impact = computeInvestingImpact(P, r, years);
        break;
      case "cash":
        impact = computeCashImpact(P, years);
        break;
      case "debt":
        impact = computeDebtImpact(P, apr, years);
        break;
      default:
        impact = computeInvestingImpact(P, r, years);
    }
    return { years, impact };
  });
}
