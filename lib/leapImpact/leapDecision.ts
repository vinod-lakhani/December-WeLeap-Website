/**
 * Leap Impact Simulator — single highest-impact Leap selection.
 *
 * MVP Leap decision rules (Savings Stack aligned):
 * - If employer match === Yes AND current_401k_pct < match_pct:
 *     Leap = "Capture full employer match"
 * - Else if at 401(k) employee cap ($23,500) → at_cap
 * - Else if already at the retirement target → at_target
 * - Else:
 *     Leap = "Increase retirement contribution" (target = 15% of gross incl. match)
 */

import { K401_EMPLOYEE_CAP } from '@/lib/allocator/constants';
import { computeRetirementTargetPct } from '@/lib/allocator/retirementTarget';
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
  /**
   * Which rule fired. `at_cap` is the IRS limit; `at_target` is the 15% goal,
   * which is a different thing and used to be reported as the limit — telling
   * someone contributing 15% on $200k that they were "hitting the annual
   * 401(k) limit" when they were $5,500 short of it.
   */
  type: 'capture_match' | 'increase_contribution' | 'at_cap' | 'at_target';
}

export interface RecommendedLeapInputs {
  hasEmployerMatch: boolean;
  /** Percentage of salary the employer matches up to. */
  matchPct: number;
  current401kPct: number;
  /** Used to check the 401(k) cap. Pass 0 (the default) to skip the cap check. */
  salaryAnnual?: number;
  /**
   * Match rate: 100 = dollar-for-dollar, 50 = fifty cents on the dollar.
   *
   * Rule 3 needs it, because the target is 15% of gross INCLUDING the match,
   * and a 50% match up to 6% contributes 3% of gross rather than 6%. Defaults
   * to dollar-for-dollar, which is what this file assumed when it had no way
   * to be told otherwise.
   */
  matchRatePct?: number;
}

/**
 * Returns the single highest-impact Leap and the optimized 401(k) %.
 * Never returns "Increase 401(k) from X → X" (from==to). Uses at_cap when maxed or no room.
 *
 * Takes an object rather than four positionals. `matchPct` and `matchRatePct`
 * are both percentages describing the same employer match, so in positional
 * form a swapped pair type-checks cleanly and quietly returns wrong advice.
 */
export function getRecommendedLeap(inputs: RecommendedLeapInputs): RecommendedLeap {
  const {
    hasEmployerMatch,
    matchPct,
    current401kPct,
    salaryAnnual = 0,
    matchRatePct = 100,
  } = inputs;
  // Rule 1: Not capturing full match → recommend capturing match (capped at IRS limit)
  if (hasEmployerMatch && current401kPct < matchPct) {
    let optimizedPct = matchPct;
    if (salaryAnnual > 0) {
      const capPct = (K401_EMPLOYEE_CAP / salaryAnnual) * 100;
      optimizedPct = Math.min(matchPct, capPct);
    }
    return {
      label: 'Capture your full employer match',
      summary: `Move toward ${formatPct(optimizedPct)} 401(k) contribution`,
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
      summary: "Nice — you're already hitting the annual 401(k) limit. Let's tackle the next one.",
      optimized401kPct: current401kPct,
      type: 'at_cap',
    };
  }

  /**
   * Rule 3: already at the match (or there is none) → head for 15% of gross
   * including the match, NOT the IRS limit.
   *
   * This used to target `K401_EMPLOYEE_CAP / salary`, which meant the smaller
   * the salary the harsher the advice — 40.8% of gross on $60k, 54.4% on $45k
   * — and the summary said "move toward max 401(k) contribution", naming the
   * ceiling as the goal. See lib/allocator/retirementTarget.ts.
   *
   * No solvency floor here: this runs before the plan asks about essentials,
   * so there is nothing to check against yet. The allocator applies it later,
   * where the answer exists.
   */
  const targetPct = computeRetirementTargetPct({
    salaryAnnual,
    current401kPct,
    hasEmployerMatch,
    matchCapPct: matchPct,
    matchRatePct,
  });

  // No increase to recommend. Distinguished from Rule 2 because the reasons
  // differ: the IRS says no, versus the plan is satisfied.
  if (targetPct <= current401kPct) {
    return {
      label: 'Retirement contribution is on track',
      summary: `You're at ${formatPct(current401kPct)}, which puts you at or past the 15% of pay this plan aims for. Let's tackle the next one.`,
      optimized401kPct: current401kPct,
      type: 'at_target',
    };
  }

  return {
    label: 'Increase retirement contribution',
    summary: `Move toward ${formatPct(targetPct)} 401(k) contribution — 15% of pay once your match is counted`,
    optimized401kPct: targetPct,
    type: 'increase_contribution',
  };
}
