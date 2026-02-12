/**
 * Leap Impact Simulator — single highest-impact Leap selection.
 *
 * MVP Leap decision rules (Savings Stack aligned):
 * - If employer match === Yes AND current_401k_pct < match_pct:
 *     Leap = "Capture full employer match"
 * - Else if at 401(k) employee cap ($23,500) → do not recommend increase
 * - Else:
 *     Leap = "Increase retirement contribution" (capped at 401k cap % and 15%)
 */

import { K401_EMPLOYEE_CAP_2025 } from '@/lib/allocator/constants';

export interface RecommendedLeap {
  /** Short label for the Leap, e.g. "Capture your full employer match" */
  label: string;
  /** One-line explanation, e.g. "Increase 401(k) from 5% → 8%" */
  summary: string;
  /** 401(k) contribution % after applying the Leap */
  optimized401kPct: number;
  /** Whether the recommendation was "capture match" vs "increase" vs "at cap" */
  type: 'capture_match' | 'increase_contribution' | 'at_cap';
}

/**
 * Returns the single highest-impact Leap and the optimized 401(k) %.
 * @param salaryAnnual - Used to check 401(k) cap ($23,500). Pass 0 to skip cap check.
 */
export function getRecommendedLeap(
  hasEmployerMatch: boolean,
  matchPct: number,
  current401kPct: number,
  salaryAnnual: number = 0
): RecommendedLeap {
  // Rule 1: Not capturing full match → recommend capturing match
  if (hasEmployerMatch && current401kPct < matchPct) {
    return {
      label: 'Capture your full employer match',
      summary: `Increase 401(k) from ${current401kPct}% → ${matchPct}%`,
      optimized401kPct: matchPct,
      type: 'capture_match',
    };
  }

  // Rule 2: At 401(k) employee cap ($23,500) → do not recommend increase
  if (salaryAnnual > 0) {
    const current401kAnnual = (salaryAnnual * current401kPct) / 100;
    if (current401kAnnual >= K401_EMPLOYEE_CAP_2025) {
      return {
        label: '401(k) at employee cap',
        summary: `You're at the $${(K401_EMPLOYEE_CAP_2025 / 1000).toFixed(0)}K cap. Consider brokerage for excess savings.`,
        optimized401kPct: current401kPct,
        type: 'at_cap',
      };
    }
  }

  // Rule 3: Already at match (or no match) → recommend toward 15% (Savings Stack target), capped at 401k cap
  const RETIREMENT_TARGET_PCT = 15;
  let targetPct = RETIREMENT_TARGET_PCT;
  if (salaryAnnual > 0) {
    const capPct = (K401_EMPLOYEE_CAP_2025 / salaryAnnual) * 100;
    targetPct = Math.min(targetPct, capPct);
  }
  if (targetPct <= current401kPct) {
    targetPct = current401kPct;
  }

  return {
    label: 'Increase retirement contribution',
    summary: `Increase 401(k) from ${current401kPct}% → ${Math.round(targetPct * 10) / 10}%`,
    optimized401kPct: targetPct,
    type: 'increase_contribution',
  };
}
