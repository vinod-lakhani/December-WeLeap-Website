/**
 * Leap Impact Simulator — single highest-impact Leap selection.
 *
 * MVP Leap decision rules (explicit):
 * - If employer match === Yes AND current_401k_pct < match_pct:
 *     Leap = "Capture full employer match"
 *     optimized_401k_pct = match_pct
 * - Else:
 *     Leap = "Increase retirement contribution by +2% (or to 12% min)"
 *     optimized_401k_pct = min(current + 2, 12)
 */

export interface RecommendedLeap {
  /** Short label for the Leap, e.g. "Capture your full employer match" */
  label: string;
  /** One-line explanation, e.g. "Increase 401(k) from 5% → 8%" */
  summary: string;
  /** 401(k) contribution % after applying the Leap */
  optimized401kPct: number;
  /** Whether the recommendation was "capture match" vs "increase toward builder target" */
  type: 'capture_match' | 'increase_contribution';
}

/**
 * Returns the single highest-impact Leap and the optimized 401(k) %.
 */
export function getRecommendedLeap(
  hasEmployerMatch: boolean,
  matchPct: number,
  current401kPct: number
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

  // Rule 2: Already at match (or no match) → recommend +2% or to 12% cap
  const step = 2;
  const targetPct = Math.min(current401kPct + step, 12);

  return {
    label: 'Increase retirement contribution',
    summary: `Increase 401(k) from ${current401kPct}% → ${targetPct}%`,
    optimized401kPct: targetPct,
    type: 'increase_contribution',
  };
}
