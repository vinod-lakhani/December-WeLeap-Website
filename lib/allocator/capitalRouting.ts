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
  /** Current EF balance (0 if unknown). */
  efCurrent?: number;
  unlock: AllocatorUnlockData | null;
}

/**
 * Routing: efAlloc = 40% until target; debtAlloc = 40% of remaining if high-APR debt; split rest.
 */
export function computeCapitalRouting(inputs: CapitalRoutingInputs): CapitalRoutingResult {
  const { postTaxSavingsMonthly, efCurrent = 0, unlock } = inputs;
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
  const retirementAlloc = remaining2 * (split.retirementPct / 100);
  const brokerageAlloc = remaining2 * (split.brokeragePct / 100);

  let monthsToEfTarget: number | undefined;
  if (efTarget > 0 && efAlloc > 0 && efCurrent < efTarget) {
    const gap = efTarget - efCurrent;
    monthsToEfTarget = Math.ceil(gap / efAlloc);
  }

  return {
    postTaxSavingsMonthly,
    efAlloc,
    debtAlloc,
    retirementAlloc,
    brokerageAlloc,
    efTarget,
    monthsToEfTarget,
  };
}
