/**
 * Select exactly ONE primary (highest-leverage) leap for the trajectory plan.
 * Used by Full Leap Stack Summary. No HSA. Logic is deterministic.
 */

import type { Leap } from './leapModel';

const TARGET_RETIREMENT_PCT = 15;

export type PrimaryKind = 'match' | 'retirement_15' | 'debt' | 'growth_split';

export interface PrimaryLeapResult {
  kind: PrimaryKind;
  /** The leap to show as primary (for match, debt, growth_split). Null for retirement_15. */
  leap: Leap | null;
  /** For retirement_15: current 401k % and target 15%. */
  retirement15?: { currentPct: number; targetPct: number };
}

/** APR range implies APR >= 10 (10-14, 15-19, 20+). */
function hasHighAprDebt(unlock: {
  carriesBalance?: boolean;
  debtBalance?: number;
  debtAprRange?: string;
} | null): boolean {
  if (!unlock?.carriesBalance || unlock.debtBalance == null || unlock.debtBalance <= 0) return false;
  return !!unlock.debtAprRange; // 10-14, 15-19, 20+ all imply >= 10
}

export interface SelectPrimaryLeapInputs {
  employerMatchEnabled: boolean;
  current401kPct: number;
  recommended401kPct: number;
  unlock: {
    carriesBalance?: boolean;
    debtBalance?: number;
    debtAprRange?: string;
  } | null;
  leaps: Leap[];
}

/**
 * Returns the single primary leap and kind. Supporting leaps are all other
 * structure items (EF, debt, retirement_split) excluding the primary category.
 */
export function selectPrimaryLeap(inputs: SelectPrimaryLeapInputs): PrimaryLeapResult {
  const {
    employerMatchEnabled,
    current401kPct,
    recommended401kPct,
    unlock,
    leaps,
  } = inputs;

  const matchCapPct = recommended401kPct;
  const matchNotCaptured = employerMatchEnabled && current401kPct < matchCapPct;

  // 1) Match not captured → primary = capture employer match
  if (matchNotCaptured) {
    const matchLeap = leaps.find((l) => l.category === 'match' && l.isPayroll);
    return { kind: 'match', leap: matchLeap ?? null };
  }

  // 2) Match captured or no match → consider retirement toward 15%, then debt, then growth split
  if (current401kPct < TARGET_RETIREMENT_PCT) {
    return {
      kind: 'retirement_15',
      leap: null,
      retirement15: { currentPct: current401kPct, targetPct: TARGET_RETIREMENT_PCT },
    };
  }

  // 3) Already at/above 15%: high-APR debt → primary = eliminate debt
  if (hasHighAprDebt(unlock)) {
    const debtLeap = leaps.find((l) => l.category === 'debt' && l.allocationBadge !== '0% (inactive)');
    return { kind: 'debt', leap: debtLeap ?? null };
  }

  // 4) Else → primary = optimize growth split (retirement/brokerage)
  const splitLeap = leaps.find((l) => l.category === 'retirement_split');
  return { kind: 'growth_split', leap: splitLeap ?? null };
}

/**
 * Supporting structure = EF + debt + retirement_split, excluding the category that is primary.
 */
export function getSupportingLeaps(leaps: Leap[], primaryKind: PrimaryKind): Leap[] {
  const supportingCategories = ['emergency_fund', 'debt', 'retirement_split'] as const;
  const excludeCategory =
    primaryKind === 'debt' ? 'debt' : primaryKind === 'growth_split' ? 'retirement_split' : null;
  return leaps.filter((l) => {
    if (!supportingCategories.includes(l.category as typeof supportingCategories[number])) return false;
    if (excludeCategory && l.category === excludeCategory) return false;
    return true;
  });
}
