/**
 * Leap data model for Wealth Trajectory Correction + Capital Allocation Framework.
 * Pre-tax: match → HSA. Post-tax routing: EF (40%) → debt (40% of remaining) → retirement/brokerage split.
 */

export type LeapStatus = 'next' | 'queued' | 'complete' | 'locked';

export type LeapCategory =
  | 'match'
  | 'hsa'
  | 'emergency_fund'
  | 'debt'
  | 'retirement_split'
  | 'brokerage';

export type LeapCtaAction = 'unlock' | 'edit' | 'apply' | 'learn_more';

export interface Leap {
  id: string;
  title: string;
  subtitle?: string;
  status: LeapStatus;
  category: LeapCategory;
  targetValue?: number;
  currentValue?: number;
  deltaValue?: number;
  timelineText?: string;
  impactText?: string;
  /** Annual contribution increase (employee + match) for 401k; HSA gap for HSA. Used for transparent framing. */
  annualContributionIncrease?: number;
  whyNowText?: string;
  requiresUnlock?: boolean;
  cta?: { label: string; action: LeapCtaAction };
  /** Parallel allocation stack: e.g. "40%", "40% of remaining", "80/20 of remaining", "0% (inactive)" */
  allocationBadge?: string;
  /** True for payroll (401k match); false for post-tax stack items */
  isPayroll?: boolean;
  /** For retirement_split: retirement share of remaining (e.g. 80) */
  splitRetirementPct?: number;
  /** For retirement_split: brokerage share of remaining (e.g. 20) */
  splitBrokeragePct?: number;
  /** For debt (active): APR used for display */
  debtAprPct?: number;
  /** True for payroll (HSA). */
  isPreTax?: boolean;
  /** HSA: current annual contribution; HSA max for coverage type. */
  hsaCurrentAnnual?: number;
  hsaMaxAnnual?: number;
}

/** Flow summary for post-tax stack (percent or dollar version). */
export interface FlowSummary {
  percentOnly: string;
  /** When we have monthly post-tax savings amount */
  withDollars?: string;
}

/** Result of capital allocation routing (40% EF, 40% remaining to debt, split rest). */
export interface CapitalRoutingResult {
  postTaxSavingsMonthly: number;
  efAlloc: number;
  debtAlloc: number;
  retirementAlloc: number;
  brokerageAlloc: number;
  efTarget: number;
  /** Savings already banked, as routed against the target. */
  efCurrent: number;
  /** What is still missing from the target. Zero once funded. */
  efGap: number;
  /** The buffer is already at or above target, so nothing routes to it. */
  efFunded: boolean;
  /** Months to reach EF target at current efAlloc (undefined if already at target or no target). */
  monthsToEfTarget?: number;
}

/** Inputs collected after email unlock (steps). */
export interface AllocatorUnlockData {
  /** Essential monthly spend (rent + bills + groceries, etc.) */
  essentialMonthly?: number;
  /**
   * Savings already available for an emergency — the buffer's starting point.
   *
   * Without it the routing has to assume zero, which is not a vaguer answer
   * than the truth but a different one: it sends 40% of the monthly surplus to
   * a buffer that may already be full, and takes that 40% away from debt and
   * retirement, where it should have gone. Undefined means unanswered, and 0
   * means answered with nothing — the routing treats them the same, but the
   * copy does not have to.
   */
  cashOnHand?: number;
  /** Carries credit card balance month-to-month */
  carriesBalance?: boolean;
  /** APR range: "10-14" | "15-19" | "20+" */
  debtAprRange?: string;
  /** Approx credit card (or high-APR) balance in dollars */
  debtBalance?: number;
  /** Retirement vs brokerage priority */
  retirementFocus?: 'high' | 'medium' | 'low';
  /** HSA-eligible health plan? */
  hsaEligible?: boolean;
  /** Current HSA annual contribution ($). */
  currentHsaAnnual?: number;
  /** HSA coverage type for limit (default single). */
  hsaCoverageType?: 'single' | 'family';
}

/** Prefill from Leap Impact tool (URL or state). */
export interface AllocatorPrefillForLeaps {
  salaryAnnual: number;
  state: string;
  employerMatchEnabled: boolean;
  /** Employer match rate (X): e.g. 100 = 100% match, 50 = 50% match. */
  matchRatePct?: number;
  /** Employer match cap (Y): e.g. 5 = up to 5% of salary. */
  matchCapPct?: number;
  /** Legacy: employer match cap (same as matchCapPct). */
  employerMatchPct?: number;
  current401kPct: number;
  /** Recommended 401k % to capture full match = matchCapPct when match enabled. */
  recommended401kPct: number;
  estimatedNetMonthlyIncome?: number;
  leapDelta30yr?: number;
  /** HSA eligible (from allocator step or URL). */
  hsaEligible?: boolean;
  currentHsaAnnual?: number;
  hsaCoverageType?: 'single' | 'family';
}
