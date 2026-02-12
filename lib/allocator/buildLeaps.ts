/**
 * Build ranked Leap list from prefill + optional unlock data.
 * Stack order: match → emergency_fund → debt → retirement_split → brokerage.
 * No HSA.
 */

import type { Leap, AllocatorUnlockData, AllocatorPrefillForLeaps, FlowSummary } from './leapModel';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';

const REAL_RETURN = REAL_RETURN_DEFAULT;
const MONTHS_30 = 30 * 12;

function fvMonthly(monthlyP: number, monthlyRate: number, numMonths: number): number {
  if (monthlyRate === 0) return monthlyP * numMonths;
  return monthlyP * (Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate;
}

/** Estimate 30-year impact of extra monthly retirement contribution (employee + match). */
function estimateMatchImpact30yr(
  salaryAnnual: number,
  currentPct: number,
  recommendedPct: number,
  matchPct: number,
  hasMatch: boolean
): number {
  const monthlyRate = REAL_RETURN / 12;
  const empCur = (salaryAnnual * (currentPct / 100)) / 12;
  const empRec = (salaryAnnual * (recommendedPct / 100)) / 12;
  const matchCur = hasMatch ? (salaryAnnual * (Math.min(currentPct, matchPct) / 100)) / 12 : 0;
  const matchRec = hasMatch ? (salaryAnnual * (Math.min(recommendedPct, matchPct) / 100)) / 12 : 0;
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

export function buildLeaps(
  prefill: AllocatorPrefillForLeaps | null,
  unlock: AllocatorUnlockData | null
): { leaps: Leap[]; nextLeapId: string | null; flowSummary: FlowSummary; matchCaptured: boolean } {
  const leaps: Leap[] = [];
  const hasUnlockData = !!(
    unlock &&
    (unlock.essentialMonthly != null || unlock.retirementFocus != null) &&
    (unlock.carriesBalance === false || (unlock.carriesBalance === true && unlock.debtAprRange && unlock.debtBalance != null))
  );
  const matchCaptured = !prefill?.employerMatchEnabled || (prefill.current401kPct >= prefill.recommended401kPct);
  const netMonthly = prefill?.estimatedNetMonthlyIncome ?? 0;

  // 1) 401(k) Match (payroll — not part of post-tax stack)
  if (prefill?.employerMatchEnabled) {
    const status: Leap['status'] = matchCaptured ? 'complete' : 'next';
    const impact30 = matchCaptured ? 0 : (prefill.leapDelta30yr ?? estimateMatchImpact30yr(
      prefill.salaryAnnual,
      prefill.current401kPct,
      prefill.recommended401kPct,
      prefill.employerMatchPct,
      true
    ));
    leaps.push({
      id: 'match',
      title: matchCaptured
        ? '401(k) match captured'
        : `Increase 401(k) from ${prefill.current401kPct}% → ${prefill.recommended401kPct}%`,
      subtitle: matchCaptured ? undefined : 'Unlocks employer match (free money).',
      status,
      category: 'match',
      targetValue: prefill.recommended401kPct,
      currentValue: prefill.current401kPct,
      deltaValue: matchCaptured ? 0 : prefill.recommended401kPct - prefill.current401kPct,
      timelineText: matchCaptured ? undefined : 'Start next paycheck',
      impactText: matchCaptured ? undefined : `Adds ${formatCurrency(impact30)} over 30 years`,
      whyNowText: undefined,
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
      whyNowText: 'N/A',
      isPayroll: true,
    });
  }

  // 2) Emergency Fund (1-month buffer first)
  const efTarget1mo = unlock?.essentialMonthly != null ? unlock.essentialMonthly : undefined;
  const efTarget3mo = efTarget1mo != null ? efTarget1mo * 3 : undefined;
  const efTarget6mo = efTarget1mo != null ? efTarget1mo * 6 : undefined;
  const defaultEfMonthly = netMonthly > 0 ? Math.round(netMonthly * 0.05) : 200;
  const monthsTo1mo = efTarget1mo != null && efTarget1mo > 0 && defaultEfMonthly > 0
    ? Math.ceil(efTarget1mo / defaultEfMonthly)
    : undefined;
  leaps.push({
    id: 'emergency_fund',
    title: efTarget1mo != null
      ? `Emergency Fund — $${Math.round(efTarget1mo).toLocaleString()} target (1 month essentials)`
      : 'Emergency Fund (1 month essentials)',
    subtitle: efTarget1mo != null ? 'Then we\'ll extend toward 3–6 months.' : 'Unlock to see your target.',
    status: matchCaptured ? (efTarget1mo != null ? 'next' : 'queued') : 'queued',
    category: 'emergency_fund',
    targetValue: efTarget1mo ?? undefined,
    currentValue: 0,
    deltaValue: efTarget1mo ?? undefined,
    timelineText: monthsTo1mo != null ? `~${monthsTo1mo} months to 1-month buffer` : (hasUnlockData ? undefined : 'Unlock for estimate'),
    impactText: 'Reduces risk of credit card debt during surprises.',
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
      title: `High-APR debt — $${Math.round(unlock.debtBalance).toLocaleString()} at ${aprPct}% APR`,
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
      ? `Retirement vs Brokerage — ${split.retirementPct}% retirement / ${split.brokeragePct}% brokerage`
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

  return { leaps, nextLeapId, flowSummary, matchCaptured };
}
