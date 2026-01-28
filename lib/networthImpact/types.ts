/**
 * Net Worth Impact tool — type definitions
 * Delta-to-net-worth translator (one monthly change → future impact).
 */

export type UseCase = "investing" | "cash" | "debt";

export interface ImpactInputs {
  monthlyDelta: number; // can be negative
  useCase: UseCase;
  realReturn?: number; // default 0.07 for investing
  debtApr?: number; // default 0.18 for debt payoff
}

export interface HorizonImpact {
  years: number;
  impact: number; // currency dollars, can be negative
}
