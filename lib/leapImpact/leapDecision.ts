/**
 * Leap Impact Simulator — single highest-impact Leap selection.
 *
 * MVP Leap decision rules (Savings Stack aligned):
 * - If employer match === Yes AND current_401k_pct < match_pct:
 *     Leap = "Capture full employer match"
 * - Else if at 401(k) employee cap ($23,500) OR already at target (no increase possible) → at_cap
 * - Else:
 *     Leap = "Increase retirement contribution" (target = % to hit $23,500 cap)
 */

import { K401_EMPLOYEE_CAP_2025 } from '@/lib/allocator/constants';
import { compute401kStatus } from './leverPriority';

function formatPct(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}

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
 * Never returns "Increase 401(k) from X → X" (from==to). Uses at_cap when maxed or no room.
 * @param salaryAnnual - Used to check 401(k) cap ($23,500). Pass 0 to skip cap check.
 */
export function getRecommendedLeap(
  hasEmployerMatch: boolean,
  matchPct: number,
  current401kPct: number,
  salaryAnnual: number = 0
): RecommendedLeap {
  // Rule 1: Not capturing full match → recommend capturing match (capped at IRS limit)
  if (hasEmployerMatch && current401kPct < matchPct) {
    let optimizedPct = matchPct;
    if (salaryAnnual > 0) {
      const capPct = (K401_EMPLOYEE_CAP_2025 / salaryAnnual) * 100;
      optimizedPct = Math.min(matchPct, capPct);
    }
    return {
      label: 'Capture your full employer match',
      summary: `Increase 401(k) from ${formatPct(current401kPct)} → ${formatPct(optimizedPct)}`,
      optimized401kPct: optimizedPct,
      type: 'capture_match',
    };
  }

  // Rule 2: At 401(k) employee cap ($23,500) → do not recommend increase
  const { is401kMaxed } = compute401kStatus({
    salaryAnnual,
    current401kPct,
    hasEmployerMatch,
    matchCapPct: matchPct,
  });
  if (is401kMaxed) {
    return {
      label: '401(k) is maxed',
      summary: "Nice — you're already hitting the annual 401(k) limit. Let's optimize the next lever.",
      optimized401kPct: current401kPct,
      type: 'at_cap',
    };
  }

  // Rule 3: Already at match (or no match) → recommend toward IRS cap ($23,500)
  // Target = whatever % gets to the cap (e.g. 23.5% for 100k, 11.75% for 200k)
  let targetPct: number;
  if (salaryAnnual > 0) {
    const capPct = (K401_EMPLOYEE_CAP_2025 / salaryAnnual) * 100;
    targetPct = Math.min(capPct, 100); // Cap at 100% for very low salaries
  } else {
    targetPct = 15; // Fallback when no salary
  }

  // No increase possible (already at or above cap) → at_cap to avoid "from X → X"
  if (targetPct <= current401kPct) {
    return {
      label: '401(k) is maxed',
      summary: "Nice — you're already hitting the annual 401(k) limit. Let's optimize the next lever.",
      optimized401kPct: current401kPct,
      type: 'at_cap',
    };
  }

  return {
    label: 'Increase retirement contribution',
    summary: `Increase 401(k) from ${formatPct(current401kPct)} → ${formatPct(targetPct)}`,
    optimized401kPct: targetPct,
    type: 'increase_contribution',
  };
}
