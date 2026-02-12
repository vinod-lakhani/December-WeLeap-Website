/**
 * Build ranked Leap list from prefill + optional unlock data.
 * Pre-tax: match → HSA. Post-tax: EF (40%) → debt (40% remaining) → retirement/brokerage split.
 */

import type { Leap, AllocatorUnlockData, AllocatorPrefillForLeaps, FlowSummary, CapitalRoutingResult } from './leapModel';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';
import { DEFAULT_MATCH_RATE_PCT, DEFAULT_MATCH_CAP_PCT, K401_EMPLOYEE_CAP_2025, HSA_LIMIT_SINGLE, HSA_LIMIT_FAMILY, EF_TARGET_MONTHS, HSA_RECOMMENDED_START } from './constants';
import { computeCapitalRouting } from './capitalRouting';
import { formatPct } from '@/lib/format';

const REAL_RETURN = REAL_RETURN_DEFAULT;
const MONTHS_30 = 30 * 12;

function fvMonthly(monthlyP: number, monthlyRate: number, numMonths: number): number {
  if (monthlyRate === 0) return monthlyP * numMonths;
  return monthlyP * (Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate;
}

/** Employer match $ = salary * min(empPct, matchCapPct)/100 * (matchRatePct/100). */
function employerMatchMonthly(salaryAnnual: number, employeePct: number, matchRatePct: number, matchCapPct: number): number {
  const empPctCapped = Math.min(employeePct, matchCapPct);
  const employerPctOfSalary = (empPctCapped * matchRatePct) / 100;
  return (salaryAnnual * (employerPctOfSalary / 100)) / 12;
}

/** Estimate 30-year impact of extra monthly retirement contribution (employee + match). */
function estimateMatchImpact30yr(
  salaryAnnual: number,
  currentPct: number,
  recommendedPct: number,
  matchRatePct: number,
  matchCapPct: number,
  hasMatch: boolean
): number {
  const monthlyRate = REAL_RETURN / 12;
  const empCur = (salaryAnnual * (currentPct / 100)) / 12;
  const empRec = (salaryAnnual * (recommendedPct / 100)) / 12;
  const matchCur = hasMatch ? employerMatchMonthly(salaryAnnual, currentPct, matchRatePct, matchCapPct) : 0;
  const matchRec = hasMatch ? employerMatchMonthly(salaryAnnual, recommendedPct, matchRatePct, matchCapPct) : 0;
  const deltaMonthly = (empRec - empCur) + (matchRec - matchCur);
  if (deltaMonthly <= 0) return 0;
  return Math.round(fvMonthly(deltaMonthly, monthlyRate, MONTHS_30));
}

/** Parse APR range to numeric (use midpoint for display). */
function aprRangeToPercent(range: string): number | null {
  if (range === '10-14' || range === '10-15') return 12;
  if (range === '15-19' || range === '15-20') return 17;
  if (range === '20+') return 22;
  return null;
}

export type DebtAprRange = '10-14' | '15-19' | '20+';

/** Approximate interest saved in 12 months by paying extra each month (simplified). */
function interestSaved12mo(balance: number, apr: number, extraPerMonth: number): number {
  const r = apr / 100 / 12;
  let remaining = balance;
  let totalInterest = 0;
  for (let m = 0; m < 12 && remaining > 0; m++) {
    const interest = remaining * r;
    totalInterest += interest;
    const payment = extraPerMonth + (remaining * 0.02); // min + extra
    remaining = Math.max(0, remaining + interest - Math.min(payment, remaining + interest));
  }
  return Math.round(totalInterest);
}

/** Retirement vs brokerage split from focus (High 80/20, Medium 60/40, Low 20/80). */
function getRetirementBrokerageSplit(focus: 'high' | 'medium' | 'low'): { retirementPct: number; brokeragePct: number } {
  switch (focus) {
    case 'high': return { retirementPct: 80, brokeragePct: 20 };
    case 'medium': return { retirementPct: 60, brokeragePct: 40 };
    case 'low': return { retirementPct: 20, brokeragePct: 80 };
    default: return { retirementPct: 60, brokeragePct: 40 };
  }
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `~$${(n / 1000).toFixed(0)}K`;
  return `~$${Math.round(n).toLocaleString()}`;
}

export interface BuildLeapsOptions {
  /** When set, use this as the post-tax capital pool for routing (adaptive take-home model). */
  monthlyCapitalAvailable?: number;
}

export function buildLeaps(
  prefill: AllocatorPrefillForLeaps | null,
  unlock: AllocatorUnlockData | null,
  options?: BuildLeapsOptions
): { leaps: Leap[]; nextLeapId: string | null; flowSummary: FlowSummary; matchCaptured: boolean; k401AtCap: boolean; routing: CapitalRoutingResult | null } {
  const leaps: Leap[] = [];
  const hasUnlockData = !!(
    unlock &&
    (unlock.essentialMonthly != null || unlock.retirementFocus != null) &&
    (unlock.carriesBalance === false || (unlock.carriesBalance === true && unlock.debtAprRange && unlock.debtBalance != null))
  );
  const matchCapPct = prefill?.matchCapPct ?? prefill?.employerMatchPct ?? DEFAULT_MATCH_CAP_PCT;
  const matchRatePct = prefill?.matchRatePct ?? DEFAULT_MATCH_RATE_PCT;
  const recommended401k = prefill?.recommended401kPct ?? matchCapPct;
  // Match captured = contributing at or above employer match cap (not recommended401k, which may be 12% post-match)
  const matchCaptured = !prefill?.employerMatchEnabled || (prefill.current401kPct >= matchCapPct);
  // 401(k) at employee cap — don't recommend increase
  const salaryAnnual = prefill?.salaryAnnual ?? 0;
  const current401kAnnual = salaryAnnual > 0 ? (salaryAnnual * (prefill?.current401kPct ?? 0) / 100) : 0;
  const k401AtCap = salaryAnnual > 0 && current401kAnnual >= K401_EMPLOYEE_CAP_2025;
  const netMonthly = prefill?.estimatedNetMonthlyIncome ?? 0;
  const essentialsMonthly = unlock?.essentialMonthly ?? 0;
  const postTaxSavingsMonthly =
    options?.monthlyCapitalAvailable != null
      ? Math.max(0, options.monthlyCapitalAvailable)
      : Math.max(0, netMonthly - essentialsMonthly);

  const routing: CapitalRoutingResult | null =
    postTaxSavingsMonthly > 0 || essentialsMonthly > 0 || (options?.monthlyCapitalAvailable != null && options.monthlyCapitalAvailable >= 0)
      ? computeCapitalRouting({ postTaxSavingsMonthly, efCurrent: 0, unlock })
      : null;

  // 1) 401(k) Match (payroll)
  if (prefill?.employerMatchEnabled) {
    const impact30 = matchCaptured ? 0 : (prefill.leapDelta30yr ?? estimateMatchImpact30yr(
      prefill.salaryAnnual,
      prefill.current401kPct,
      recommended401k,
      matchRatePct,
      matchCapPct,
      true
    ));
    leaps.push({
      id: 'match',
      title: matchCaptured
        ? '401(k) match captured'
        : `Increase 401(k) from ${formatPct(prefill.current401kPct)} → ${formatPct(recommended401k)}`,
      subtitle: matchCaptured ? undefined : 'Unlocks employer match (free money).',
      status: matchCaptured ? 'complete' : 'next',
      category: 'match',
      targetValue: recommended401k,
      currentValue: prefill.current401kPct,
      deltaValue: matchCaptured ? 0 : recommended401k - prefill.current401kPct,
      timelineText: matchCaptured ? undefined : 'Start next paycheck',
      impactText: matchCaptured ? undefined : `Adds ${formatCurrency(impact30)} over 30 years`,
      requiresUnlock: false,
      cta: undefined,
      isPayroll: true,
    });
  } else {
    leaps.push({
      id: 'match',
      title: 'No employer match',
      status: 'complete',
      category: 'match',
      isPayroll: true,
    });
  }

  // 2) HSA (payroll lever — after match; recommend min(max, $2500) when current = 0)
  const hsaEligible = unlock?.hsaEligible ?? prefill?.hsaEligible ?? false;
  const currentHsa = unlock?.currentHsaAnnual ?? prefill?.currentHsaAnnual ?? 0;
  const hsaCoverage = unlock?.hsaCoverageType ?? prefill?.hsaCoverageType ?? 'single';
  const hsaMax = hsaCoverage === 'family' ? HSA_LIMIT_FAMILY : HSA_LIMIT_SINGLE;
  const hsaRecommendedTarget = currentHsa === 0 ? Math.min(hsaMax, HSA_RECOMMENDED_START) : hsaMax;
  const hsaMaxed = currentHsa >= hsaMax;
  const hsaGap = hsaEligible && !hsaMaxed ? hsaRecommendedTarget - currentHsa : 0;
  if (hsaEligible) {
    leaps.push({
      id: 'hsa',
      title: hsaMaxed ? 'HSA maxed' : 'Contribute to HSA',
      subtitle: hsaMaxed ? undefined : (currentHsa === 0 ? `Start HSA toward $${hsaRecommendedTarget.toLocaleString()}/year` : `Increase HSA toward $${hsaMax.toLocaleString()} (${hsaCoverage})`),
      status: hsaMaxed ? 'complete' : 'queued',
      category: 'hsa',
      targetValue: hsaRecommendedTarget,
      currentValue: currentHsa,
      deltaValue: hsaMaxed ? 0 : hsaGap,
      impactText: hsaMaxed ? undefined : 'Tax-free in, tax-free growth, tax-free out for health.',
      requiresUnlock: false,
      isPayroll: true,
      isPreTax: true,
      hsaCurrentAnnual: currentHsa,
      hsaMaxAnnual: hsaMax,
    });
  } else {
    leaps.push({
      id: 'hsa',
      title: 'HSA',
      subtitle: 'No HSA-eligible plan.',
      status: 'complete',
      category: 'hsa',
      requiresUnlock: false,
      isPayroll: true,
      isPreTax: true,
    });
  }

  // 3) Emergency Fund — 3-month target, 40% of post-tax savings until target
  const efTarget = essentialsMonthly > 0 ? essentialsMonthly * EF_TARGET_MONTHS : 0;
  const monthsToEf = routing?.monthsToEfTarget;
  leaps.push({
    id: 'emergency_fund',
    title: efTarget > 0
      ? `Build a 3-month safety cushion — $${Math.round(efTarget).toLocaleString()} target`
      : 'Build a 3-month safety cushion',
    subtitle: efTarget > 0 ? 'Milestone: 1 month → 3 months.' : 'Unlock to see your target.',
    status: 'queued',
    category: 'emergency_fund',
    targetValue: efTarget || undefined,
    currentValue: 0,
    deltaValue: efTarget || undefined,
    timelineText: monthsToEf != null ? `~${monthsToEf} months to 3-month buffer` : (hasUnlockData ? undefined : 'Unlock for estimate'),
    impactText: 'Lowers the chance you need high-interest credit.',
    requiresUnlock: !unlock?.essentialMonthly,
    cta: !unlock?.essentialMonthly ? { label: 'Unlock details', action: 'unlock' } : undefined,
    allocationBadge: '40%',
    isPayroll: false,
  });

  // 3) High-APR Debt
  const hasDebt = unlock?.carriesBalance === true && unlock.debtBalance != null && unlock.debtBalance > 0;
  const aprPct = unlock?.debtAprRange ? aprRangeToPercent(unlock.debtAprRange) : null;
  const isHighApr = aprPct != null && aprPct >= 10;
  const debtActive = hasDebt && isHighApr;
  if (debtActive && unlock.debtBalance != null && aprPct != null) {
    const extraDefault = 100;
    const saved = interestSaved12mo(unlock.debtBalance, aprPct, extraDefault);
    leaps.push({
      id: 'debt',
      title: `High-APR debt — $${Math.round(unlock.debtBalance).toLocaleString()} at ${formatPct(aprPct)} APR`,
      status: 'queued',
      category: 'debt',
      targetValue: 0,
      currentValue: unlock.debtBalance,
      deltaValue: -unlock.debtBalance,
      impactText: `Paying +$${extraDefault}/mo saves ~$${saved} interest in 12 months.`,
      whyNowText: 'Guaranteed return equal to APR.',
      requiresUnlock: false,
      cta: undefined,
      allocationBadge: '40% of remaining',
      isPayroll: false,
      debtAprPct: aprPct,
    });
  } else {
    const noHighAprDebt = unlock?.carriesBalance === false || (hasDebt && !isHighApr);
    const needsUnlock = unlock?.carriesBalance === undefined || (unlock?.carriesBalance === true && !debtActive && (unlock.debtBalance == null || !unlock.debtAprRange));
    leaps.push({
      id: 'debt',
      title: noHighAprDebt ? 'High-APR debt' : needsUnlock ? 'High-APR debt (≥10% APR)' : 'High-APR debt',
      status: noHighAprDebt ? 'complete' : needsUnlock ? 'queued' : 'complete',
      category: 'debt',
      requiresUnlock: needsUnlock,
      cta: needsUnlock ? { label: 'Unlock details', action: 'unlock' } : undefined,
      allocationBadge: '0% (inactive)',
      isPayroll: false,
    });
  }

  // 4) Retirement vs Brokerage (split of remaining)
  const focus = unlock?.retirementFocus ?? null;
  const split = focus != null ? getRetirementBrokerageSplit(focus) : { retirementPct: 60, brokeragePct: 40 };
  const splitLabel = `${split.retirementPct}/${split.brokeragePct}`;
  leaps.push({
    id: 'retirement_split',
    title: focus != null
      ? `Retirement vs Brokerage — ${formatPct(split.retirementPct)} retirement / ${formatPct(split.brokeragePct)} brokerage`
      : 'Retirement vs Brokerage (split of remaining)',
    subtitle: focus != null ? undefined : 'Set your retirement focus to see your split.',
    status: 'queued',
    category: 'retirement_split',
    impactText: 'Improves tax-advantaged compounding.',
    requiresUnlock: !focus,
    cta: !focus ? { label: 'Unlock details', action: 'unlock' } : undefined,
    allocationBadge: `${splitLabel} of remaining`,
    isPayroll: false,
    splitRetirementPct: split.retirementPct,
    splitBrokeragePct: split.brokeragePct,
  });

  // 5) Brokerage (included in split above; keep for data/compat)
  leaps.push({
    id: 'brokerage',
    title: 'Brokerage (part of split above)',
    status: 'queued',
    category: 'brokerage',
    cta: undefined,
    allocationBadge: 'included in split',
    isPayroll: false,
  });

  // Flow summary: percent-only (we don't have postTaxSavingsAmount yet)
  const debtSegment = debtActive ? 'Debt: 40% of remaining' : 'Debt: 0% (inactive)';
  const flowSummary: FlowSummary = {
    percentOnly: `EF: 40% → ${debtSegment} → Remaining split ${splitLabel} (retirement/brokerage)`,
  };

  const nextLeap = leaps.find((l) => l.status === 'next');
  const nextLeapId = nextLeap?.id ?? null;

  return { leaps, nextLeapId, flowSummary, matchCaptured, k401AtCap, routing };
}
