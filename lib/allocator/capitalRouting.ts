/**
 * Capital Allocation Framework — dollar routing from post-tax savings.
 * 40% → EF (until target), 40% of remaining → debt, split rest by retirementFocus.
 */

import type { AllocatorUnlockData, CapitalRoutingResult } from './leapModel';
import { EF_TARGET_MONTHS, EF_ALLOC_PCT, DEBT_ALLOC_PCT } from './constants';

function getRetirementBrokerageSplit(focus: 'high' | 'medium' | 'low'): { retirementPct: number; brokeragePct: number } {
  switch (focus) {
    case 'high': return { retirementPct: 80, brokeragePct: 20 };
    case 'medium': return { retirementPct: 60, brokeragePct: 40 };
    case 'low': return { retirementPct: 20, brokeragePct: 80 };
    default: return { retirementPct: 60, brokeragePct: 40 };
  }
}

function aprRangeToPercent(range: string): number | null {
  if (range === '10-14' || range === '10-15') return 12;
  if (range === '15-19' || range === '15-20') return 17;
  if (range === '20+') return 22;
  return null;
}

export interface CapitalRoutingInputs {
  /** Post-tax monthly savings (take-home minus essentials; use tool's existing definition). */
  postTaxSavingsMonthly: number;
  /**
   * Current EF balance. Defaults to 0 for callers that genuinely have no
   * answer, but a caller that CAN ask should ask: this is the difference
   * between "40% of your surplus goes to a buffer for the next 20 months" and
   * "your buffer is done, all of it goes to debt".
   */
  efCurrent?: number;

  /**
   * Annual room left in tax-advantaged retirement accounts, in dollars.
   *
   * Without it this function had no idea what the law allows and split the
   * surplus by percentage alone — so on $140,000 it routed $30,073 a year to
   * "Retirement", four times the IRA limit, with nothing to say where the
   * money could actually go. Money above the room does not vanish; it moves to
   * the brokerage line, which has no limit.
   *
   * Omitted means unknown, and unknown means uncapped — the previous
   * behaviour, kept so a caller that cannot compute it is not silently handed
   * a different plan.
   */
  retirementHeadroomAnnual?: number;
  unlock: AllocatorUnlockData | null;
}

/**
 * Routing: efAlloc = 40% until target; debtAlloc = 40% of remaining if high-APR debt; split rest.
 */
export function computeCapitalRouting(inputs: CapitalRoutingInputs): CapitalRoutingResult {
  const { postTaxSavingsMonthly, efCurrent = 0, retirementHeadroomAnnual, unlock } = inputs;
  const essentialsMonthly = unlock?.essentialMonthly ?? 0;
  const efTarget = essentialsMonthly > 0 ? essentialsMonthly * EF_TARGET_MONTHS : 0;

  let efAlloc = 0;
  if (efTarget > 0 && efCurrent < efTarget) {
    efAlloc = EF_ALLOC_PCT * postTaxSavingsMonthly;
  }
  const remaining1 = Math.max(0, postTaxSavingsMonthly - efAlloc);

  const hasDebt = unlock?.carriesBalance === true && (unlock.debtBalance ?? 0) > 0;
  const aprPct = unlock?.debtAprRange ? aprRangeToPercent(unlock.debtAprRange) : (hasDebt ? 17 : null);
  const highAprDebtActive = hasDebt && aprPct != null && aprPct >= 10;

  let debtAlloc = 0;
  if (highAprDebtActive) {
    debtAlloc = DEBT_ALLOC_PCT * remaining1;
  }
  const remaining2 = Math.max(0, remaining1 - debtAlloc);

  const focus = unlock?.retirementFocus ?? 'medium';
  const split = getRetirementBrokerageSplit(focus);
  const uncappedRetirement = remaining2 * (split.retirementPct / 100);

  /**
   * The split decides the PREFERENCE; the law decides the ceiling.
   *
   * A percentage split is the right way to express "retirement before taxable
   * investing", and the wrong way to express it on its own, because there is a
   * point past which no amount of preference makes a contribution legal. The
   * overflow goes to the brokerage line rather than disappearing — it is still
   * money to invest, it just cannot go into a sheltered account this year.
   */
  const headroomMonthly =
    retirementHeadroomAnnual != null ? Math.max(0, retirementHeadroomAnnual) / 12 : Infinity;
  const retirementAlloc = Math.min(uncappedRetirement, headroomMonthly);
  const retirementCapped = retirementAlloc < uncappedRetirement - 0.005;
  const brokerageAlloc =
    remaining2 * (split.brokeragePct / 100) + (uncappedRetirement - retirementAlloc);

  // Reported rather than left to each caller to re-derive. Three surfaces need
  // "is the buffer done" and two need the gap; computing it here keeps the
  // comparison (>= target, not > target) in one place.
  const efGap = Math.max(0, efTarget - efCurrent);
  const efFunded = efTarget > 0 && efCurrent >= efTarget;

  let monthsToEfTarget: number | undefined;
  if (efTarget > 0 && efAlloc > 0 && efGap > 0) {
    // The gap, not the target. Someone with $3,000 of a $7,200 buffer is 12
    // months out at $377/mo, not the 20 months a target-based figure gives.
    monthsToEfTarget = Math.ceil(efGap / efAlloc);
  }

  return {
    postTaxSavingsMonthly,
    efAlloc,
    debtAlloc,
    retirementAlloc,
    brokerageAlloc,
    retirementCapped,
    efTarget,
    efCurrent,
    efGap,
    efFunded,
    monthsToEfTarget,
  };
}
