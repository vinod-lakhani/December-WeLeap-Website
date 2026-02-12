/**
 * Select exactly ONE primary (highest-leverage) leap for the trajectory plan.
 * Order: 1) Capture match, 2) Increase HSA (if eligible and not maxed), 3) Retirement toward 15%.
 */

import type { Leap } from './leapModel';

const TARGET_RETIREMENT_PCT = 15;

export type PrimaryKind = 'match' | 'hsa' | 'retirement_15' | 'debt' | 'growth_split';

export interface PrimaryLeapResult {
  kind: PrimaryKind;
  /** The leap to show as primary (for match, hsa, debt, growth_split). Null for retirement_15. */
  leap: Leap | null;
  /** For retirement_15: current 401k % and target 15%. */
  retirement15?: { currentPct: number; targetPct: number };
}

export interface SelectPrimaryLeapInputs {
  employerMatchEnabled: boolean;
  current401kPct: number;
  recommended401kPct: number;
  /** HSA eligible and current < max. */
  hsaNotMaxed?: boolean;
  unlock: {
    carriesBalance?: boolean;
    debtBalance?: number;
    debtAprRange?: string;
  } | null;
  leaps: Leap[];
}

/**
 * Returns the single primary leap and kind.
 * 1) Match not captured → match
 * 2) Else HSA eligible and not maxed → hsa
 * 3) Else current 401k < 15% → retirement_15
 * 4) Else debt or growth_split (existing logic)
 */
export function selectPrimaryLeap(inputs: SelectPrimaryLeapInputs): PrimaryLeapResult {
  const {
    employerMatchEnabled,
    current401kPct,
    recommended401kPct,
    hsaNotMaxed = false,
    unlock,
    leaps,
  } = inputs;

  const matchCapPct = recommended401kPct;
  const matchNotCaptured = employerMatchEnabled && current401kPct < matchCapPct;

  if (matchNotCaptured) {
    const matchLeap = leaps.find((l) => l.category === 'match' && l.isPayroll);
    return { kind: 'match', leap: matchLeap ?? null };
  }

  if (hsaNotMaxed) {
    const hsaLeap = leaps.find((l) => l.category === 'hsa');
    return { kind: 'hsa', leap: hsaLeap ?? null };
  }

  if (current401kPct < TARGET_RETIREMENT_PCT) {
    return {
      kind: 'retirement_15',
      leap: null,
      retirement15: { currentPct: current401kPct, targetPct: TARGET_RETIREMENT_PCT },
    };
  }

  const hasHighAprDebt = unlock?.carriesBalance === true && (unlock.debtBalance ?? 0) > 0 && !!unlock.debtAprRange;
  if (hasHighAprDebt) {
    const debtLeap = leaps.find((l) => l.category === 'debt' && l.allocationBadge !== '0% (inactive)');
    return { kind: 'debt', leap: debtLeap ?? null };
  }

  const splitLeap = leaps.find((l) => l.category === 'retirement_split');
  return { kind: 'growth_split', leap: splitLeap ?? null };
}

/**
 * Supporting structure = EF + debt + retirement_split (post-tax framework only).
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
