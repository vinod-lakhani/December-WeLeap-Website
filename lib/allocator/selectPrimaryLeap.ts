/**
 * Select exactly ONE primary (highest-leverage) leap for the trajectory plan.
 * Follows stack allocation order: 1) Match, 2) HSA (if eligible & not maxed), 3) Retirement 15%,
 * 4) Debt, 5) Growth split. Skips non-actionable items (e.g. no HSA → go to next).
 */

import type { Leap } from './leapModel';
import { K401_EMPLOYEE_CAP_2025 } from './constants';

const TARGET_RETIREMENT_PCT = 15;

export type PrimaryKind = 'match' | 'hsa' | 'retirement_15' | 'debt' | 'growth_split';

export interface PrimaryLeapResult {
  kind: PrimaryKind;
  /** The leap to show as primary (for match, hsa, debt, growth_split). Null for retirement_15. */
  leap: Leap | null;
  /** For retirement_15: current 401k % and target (capped at 401k employee limit). */
  retirement15?: { currentPct: number; targetPct: number };
}

export interface SelectPrimaryLeapInputs {
  employerMatchEnabled: boolean;
  current401kPct: number;
  /** % needed to capture full employer match (e.g. 7%). */
  matchCapPct: number;
  /** 401(k) at employee cap ($23,500) — do not recommend increase. */
  k401AtCap?: boolean;
  /** Salary annual — used to cap retirement target at 401k limit. */
  salaryAnnual?: number;
  unlock: {
    carriesBalance?: boolean;
    debtBalance?: number;
    debtAprRange?: string;
  } | null;
  leaps: Leap[];
}

/** HSA leap is actionable when eligible, not maxed, and has current < max. */
function hasActionableHsa(leaps: Leap[]): boolean {
  const hsaLeap = leaps.find((l) => l.category === 'hsa');
  if (!hsaLeap || hsaLeap.status === 'complete') return false;
  if (hsaLeap.hsaCurrentAnnual == null || hsaLeap.hsaMaxAnnual == null) return false;
  return hsaLeap.hsaCurrentAnnual < hsaLeap.hsaMaxAnnual;
}

/**
 * Returns the single primary leap and kind.
 * 1) Match not captured → match
 * 2) Else HSA actionable (eligible, not maxed) → hsa
 * 3) Else current 401k < cap % (to hit $23,500) AND not at cap → retirement_15
 * 4) Else debt or growth_split
 */
export function selectPrimaryLeap(inputs: SelectPrimaryLeapInputs): PrimaryLeapResult {
  const {
    employerMatchEnabled,
    current401kPct,
    matchCapPct,
    k401AtCap = false,
    unlock,
    leaps,
  } = inputs;

  const matchNotCaptured = employerMatchEnabled && current401kPct < matchCapPct;

  if (matchNotCaptured) {
    const matchLeap = leaps.find((l) => l.category === 'match' && l.isPayroll);
    return { kind: 'match', leap: matchLeap ?? null };
  }

  if (hasActionableHsa(leaps)) {
    const hsaLeap = leaps.find((l) => l.category === 'hsa');
    return { kind: 'hsa', leap: hsaLeap ?? null };
  }

  // 401(k) at cap → skip retirement increase, go to brokerage
  if (k401AtCap) {
    const splitLeap = leaps.find((l) => l.category === 'retirement_split');
    return { kind: 'growth_split', leap: splitLeap ?? null };
  }

  // Target = whatever % gets to IRS cap ($23,500), not fixed 15%
  const capPct =
    (inputs.salaryAnnual ?? 0) > 0
      ? Math.min((K401_EMPLOYEE_CAP_2025 / inputs.salaryAnnual!) * 100, 100)
      : TARGET_RETIREMENT_PCT;
  if (current401kPct < capPct) {
    return {
      kind: 'retirement_15',
      leap: null,
      retirement15: { currentPct: current401kPct, targetPct: capPct },
    };
  }

  const hasHighAprDebt = unlock?.carriesBalance === true && (unlock.debtBalance ?? 0) > 0;
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
