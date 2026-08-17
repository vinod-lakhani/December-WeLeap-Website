'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import type { AllocatorIntent } from '@/lib/leapImpact/allocatorLink';
import { buildLeaps } from '@/lib/allocator/buildLeaps';
import { computeAnnualContributionIncrease401k, estimateHsaImpact30yr } from '@/lib/leapImpact/trajectory';
import type { AllocatorUnlockData } from '@/lib/allocator/leapModel';
import { selectPrimaryLeap, getSupportingLeaps } from '@/lib/allocator/selectPrimaryLeap';
import { computeNetTakeHomeMonthly } from '@/lib/allocator/takeHome';
import { getRecommendedLeap } from '@/lib/leapImpact/leapDecision';
import { runTrajectory, costOfDelay } from '@/lib/leapImpact/trajectory';
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants';
import { US_STATES } from '@/lib/states';
import { K401_EMPLOYEE_CAP_2025 } from '@/lib/allocator/constants';
import { formatPct, formatCurrency } from '@/lib/format';
import { SavingsStackSummary } from '@/components/allocator/SavingsStackSummary';
import { AppCta } from '@/components/AppCta';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';

export interface AllocatorPrefillFromUrl {
  salaryAnnual: number;
  state: string;
  payFrequency?: string;
  employerMatchEnabled: boolean;
  employerMatchPct: number;
  matchRatePct?: number;
  matchCapPct?: number;
  current401kPct: number;
  recommended401kPct: number;
  estimatedNetMonthlyIncome?: number;
  leapDelta30yr?: number;
  costOfDelay12Mo?: number;
  hsaEligible?: boolean;
  currentHsaAnnual?: number;
  hsaCoverageType?: 'single' | 'family';
  intent: AllocatorIntent;
  source: string;
}

function parsePrefillFromSearchParams(params: URLSearchParams): AllocatorPrefillFromUrl | null {
  const salaryAnnual = params.get('salaryAnnual');
  const state = params.get('state');
  const intent = params.get('intent') as AllocatorIntent | null;
  const source = params.get('source');
  if (!salaryAnnual || !state || !intent || (intent !== 'lock_plan' && intent !== 'unlock_full_stack')) {
    return null;
  }
  const salaryNum = parseFloat(salaryAnnual);
  if (Number.isNaN(salaryNum) || salaryNum <= 0) return null;
  const employerMatchPct = Math.max(0, parseFloat(params.get('employerMatchPct') ?? '0') || 0);
  const matchCapPct = params.has('matchCapPct') ? Math.max(0, parseFloat(params.get('matchCapPct')!) || 0) : employerMatchPct || 5;
  const matchRatePct = params.has('matchRatePct') ? Math.max(0, parseFloat(params.get('matchRatePct')!) || 0) : 100;
  return {
    salaryAnnual: salaryNum,
    state,
    payFrequency: params.get('payFrequency') ?? 'monthly',
    employerMatchEnabled: params.get('employerMatchEnabled') === '1',
    employerMatchPct,
    matchRatePct,
    matchCapPct,
    current401kPct: Math.max(0, parseFloat(params.get('current401kPct') ?? '0') || 0),
    recommended401kPct: Math.max(0, parseFloat(params.get('recommended401kPct') ?? '0') || 0) || matchCapPct,
    estimatedNetMonthlyIncome: params.has('estimatedNetMonthlyIncome') ? parseFloat(params.get('estimatedNetMonthlyIncome')!) : undefined,
    leapDelta30yr: params.has('leapDelta30yr') ? parseFloat(params.get('leapDelta30yr')!) : undefined,
    costOfDelay12Mo: params.has('costOfDelay12Mo') ? parseFloat(params.get('costOfDelay12Mo')!) : undefined,
    hsaEligible: params.get('hsaEligible') === '1',
    currentHsaAnnual: params.has('currentHsaAnnual') ? parseFloat(params.get('currentHsaAnnual')!) : undefined,
    hsaCoverageType: (params.get('hsaCoverageType') === 'family' ? 'family' : 'single') as 'single' | 'family',
    intent,
    source: source ?? 'leap_impact_tool',
  };
}

const STACK_STEPS = [
  { id: 'ef', name: 'Safety Buffer', title: 'Safety Buffer' },
  { id: 'debt', name: 'Debt', title: 'Debt' },
  { id: 'hsa', name: 'HSA', title: 'HSA' },
  { id: 'summary', name: 'Summary', title: 'Summary' },
] as const;

function AllocatorContent() {
  const searchParams = useSearchParams();
  const [prefill, setPrefill] = useState<AllocatorPrefillFromUrl | null>(null);
  const [prefillLoadedTracked, setPrefillLoadedTracked] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [efMonthly, setEfMonthly] = useState('');
  const [hasHighAprDebt, setHasHighAprDebt] = useState<boolean | null>(null);
  const [debtBalance, setDebtBalance] = useState<string>('');
  const [retirementFocus] = useState<'high' | 'medium' | 'low'>('medium');
  const [hsaEligible, setHsaEligible] = useState<boolean | null>(null);
  const [currentHsaAnnual, setCurrentHsaAnnual] = useState('');
  const [hsaCoverageType, setHsaCoverageType] = useState<'single' | 'family'>('single');
  const prevNextLeapIdRef = useRef<string | null>(null);
  const leapStackRenderedTrackedRef = useRef(false);
  const [actionIntent, setActionIntent] = useState<boolean | null>(null);

  // Cold-start wedge. The allocator used to require prefill from the Leap
  // simulator, so arriving directly gave a plan with no capital figure and an
  // empty split. These collect the same four things that simulator asked for,
  // so the page can start from nothing.
  const [wSalary, setWSalary] = useState('');
  const [wState, setWState] = useState('');
  const [wCurrent401k, setWCurrent401k] = useState('0');
  const [wHasMatch, setWHasMatch] = useState<boolean | null>(null);
  const [wMatchCap, setWMatchCap] = useState('5');
  const [wMatchRate, setWMatchRate] = useState('100');
  const [wError, setWError] = useState<string | null>(null);
  /**
   * The simulator's whole value was the staged reveal: give us four numbers,
   * here is free money you are not taking. Folding it into the allocator moved
   * that moment behind three more questions, which turned "you're leaving
   * $3,400 a year behind" into "401(k) contribution (target) 5%". This holds it
   * back until the reveal has been seen.
   */
  const [wedgeLeap, setWedgeLeap] = useState<{ label: string; from: number; to: number; annual: number; thirtyYear: number; delay: number } | null>(null);
  const [revealSeen, setRevealSeen] = useState(false);

  const prefillFromUrl = useMemo(() => searchParams ? parsePrefillFromSearchParams(searchParams) : null, [searchParams]);

  useEffect(() => {
    if (prefillFromUrl && !prefill) {
      setPrefill(prefillFromUrl);
    }
  }, [prefillFromUrl, prefill]);

  useEffect(() => {
    if (prefill?.hsaEligible != null && hsaEligible === null) {
      setHsaEligible(prefill.hsaEligible);
    }
    if (prefill?.currentHsaAnnual != null && !currentHsaAnnual.trim()) {
      setCurrentHsaAnnual(String(Math.round(prefill.currentHsaAnnual)));
    }
    if (prefill?.hsaCoverageType && prefill.hsaCoverageType === 'family') {
      setHsaCoverageType('family');
    }
  }, [prefill?.hsaEligible, prefill?.currentHsaAnnual, prefill?.hsaCoverageType, hsaEligible, currentHsaAnnual]);

  useEffect(() => {
    if (prefill && prefill.source && !prefillLoadedTracked) {
      setPrefillLoadedTracked(true);
      // Wait for gtag on page load so events reach GA4 (allocator loads after redirect)
      track('allocator_prefill_loaded', { source: prefill.source, intent: prefill.intent }, true);
      track('leap_stack_started', { source: prefill.source }, true);
    }
  }, [prefill, prefillLoadedTracked]);

  const unlockData: AllocatorUnlockData | null = useMemo(() => {
    const essentialNum = efMonthly.trim() ? parseFloat(efMonthly) : undefined;
    const balanceNum = debtBalance.trim() ? parseFloat(debtBalance) : undefined;
    const hsaNum = currentHsaAnnual.trim() ? parseFloat(currentHsaAnnual) : undefined;
    const hasAny = essentialNum != null || hasHighAprDebt != null || retirementFocus != null || hsaEligible != null;
    if (!hasAny) return null;
    return {
      essentialMonthly: essentialNum != null && !Number.isNaN(essentialNum) && essentialNum > 0 ? essentialNum : undefined,
      carriesBalance: hasHighAprDebt ?? undefined,
      debtAprRange: undefined,
      debtBalance: balanceNum != null && !Number.isNaN(balanceNum) && balanceNum > 0 ? balanceNum : undefined,
      retirementFocus: retirementFocus ?? undefined,
      hsaEligible: hsaEligible ?? undefined,
      currentHsaAnnual: hsaNum != null && !Number.isNaN(hsaNum) && hsaNum >= 0 ? hsaNum : undefined,
      hsaCoverageType: hsaCoverageType,
    };
  }, [efMonthly, hasHighAprDebt, debtBalance, retirementFocus, hsaEligible, currentHsaAnnual, hsaCoverageType]);

  const prefillForLeaps = useMemo(() => prefill ? {
    salaryAnnual: prefill.salaryAnnual,
    state: prefill.state,
    employerMatchEnabled: prefill.employerMatchEnabled,
    matchRatePct: prefill.matchRatePct ?? 100,
    matchCapPct: prefill.matchCapPct ?? prefill.employerMatchPct ?? 5,
    employerMatchPct: prefill.matchCapPct ?? prefill.employerMatchPct,
    current401kPct: prefill.current401kPct,
    recommended401kPct: prefill.recommended401kPct,
    estimatedNetMonthlyIncome: prefill.estimatedNetMonthlyIncome,
    leapDelta30yr: prefill.leapDelta30yr,
    hsaEligible: unlockData?.hsaEligible ?? prefill.hsaEligible,
    currentHsaAnnual: unlockData?.currentHsaAnnual ?? prefill.currentHsaAnnual,
    hsaCoverageType: unlockData?.hsaCoverageType ?? prefill.hsaCoverageType,
  } : null, [prefill, unlockData?.hsaEligible, unlockData?.currentHsaAnnual, unlockData?.hsaCoverageType]);

  const matchCapPct = prefill?.matchCapPct ?? prefill?.employerMatchPct ?? 5;
  const current401kPct = prefill?.current401kPct ?? 0;

  // Effective target 401k % for display and routing (same logic as selectPrimaryLeap)
  // Use prefill.recommended401kPct when from Leap Impact; otherwise compute toward IRS cap
  const effectiveTarget401kPct = useMemo(() => {
    if (!prefill?.salaryAnnual) return current401kPct;
    const matchNotCaptured = prefill?.employerMatchEnabled && current401kPct < matchCapPct;
    if (matchNotCaptured) return matchCapPct;
    const current401kAnnual = (prefill.salaryAnnual * current401kPct) / 100;
    if (current401kAnnual >= K401_EMPLOYEE_CAP_2025) return current401kPct;
    const capPct = (K401_EMPLOYEE_CAP_2025 / prefill.salaryAnnual) * 100;
    // Prefill from Leap Impact has recommended401kPct (e.g. 23.5%); use it instead of capping at 15%
    if (prefill?.recommended401kPct != null && prefill.recommended401kPct > current401kPct) {
      return Math.min(prefill.recommended401kPct, capPct);
    }
    return capPct;
  }, [prefill?.salaryAnnual, prefill?.employerMatchEnabled, prefill?.recommended401kPct, current401kPct, matchCapPct]);

  const netTakeHomeMonthly = useMemo(() => {
    if (!prefill?.salaryAnnual || !prefill.state) return 0;
    return computeNetTakeHomeMonthly({
      salaryAnnual: prefill.salaryAnnual,
      employee401kPct: prefill.current401kPct,
      currentHsaAnnual: unlockData?.currentHsaAnnual ?? prefill.currentHsaAnnual ?? 0,
      stateCode: prefill.state,
    });
  }, [prefill?.salaryAnnual, prefill?.state, prefill?.current401kPct, prefill?.currentHsaAnnual, unlockData?.currentHsaAnnual]);

  // Monthly capital for routing uses TARGET 401k (after applying recommendation) — increases in 401k reduce take-home
  const netTakeHomeAtTarget401k = useMemo(() => {
    if (!prefill?.salaryAnnual || !prefill.state) return 0;
    return computeNetTakeHomeMonthly({
      salaryAnnual: prefill.salaryAnnual,
      employee401kPct: effectiveTarget401kPct,
      currentHsaAnnual: unlockData?.currentHsaAnnual ?? prefill.currentHsaAnnual ?? 0,
      stateCode: prefill.state,
    });
  }, [prefill?.salaryAnnual, prefill?.state, effectiveTarget401kPct, prefill?.currentHsaAnnual, unlockData?.currentHsaAnnual]);

  const monthlyCapitalAtTarget401k = useMemo(() => {
    const essentials = unlockData?.essentialMonthly ?? 0;
    return Math.max(0, netTakeHomeAtTarget401k - essentials);
  }, [netTakeHomeAtTarget401k, unlockData?.essentialMonthly]);

  const { leaps, nextLeapId, flowSummary, matchCaptured, k401AtCap, routing } = useMemo(
    () => buildLeaps(prefillForLeaps, unlockData, { monthlyCapitalAvailable: prefill ? monthlyCapitalAtTarget401k : undefined }),
    [prefillForLeaps, unlockData, prefill, monthlyCapitalAtTarget401k]
  );

  const hasUnlockData = !!(unlockData?.essentialMonthly != null || unlockData?.retirementFocus != null || (unlockData?.carriesBalance === false) || (unlockData?.carriesBalance === true && unlockData?.debtBalance != null));

  useEffect(() => {
    if (leaps.length > 0 && nextLeapId !== prevNextLeapIdRef.current) {
      if (prevNextLeapIdRef.current != null) {
        track('leap_stack_next_leap_changed', { fromLeapId: prevNextLeapIdRef.current, toLeapId: nextLeapId ?? '' });
      }
      prevNextLeapIdRef.current = nextLeapId;
    }
  }, [leaps.length, nextLeapId]);

  useEffect(() => {
    // Was `currentStep === 4`, but STACK_STEPS has four entries so the index
    // caps at 3 — none of these summary events had ever fired.
    if (currentStep === STACK_STEPS.length - 1 && leaps.length > 0 && !leapStackRenderedTrackedRef.current) {
      leapStackRenderedTrackedRef.current = true;
      // Wait for gtag so Summary view events reach GA4
      track('leap_stack_rendered', { hasUnlockData, numLeaps: leaps.length, nextLeapId: nextLeapId ?? '' }, true);
      track('leap_stack_plan_viewed', {
        numLeaps: leaps.length,
        hasDebt: unlockData?.carriesBalance === true,
        retirementFocus: unlockData?.retirementFocus ?? undefined,
      }, true);
      track('summary_viewed', { numLeaps: leaps.length }, true);
      track('leap_stack_summary_viewed', { numLeaps: leaps.length }, true);
    }
  }, [currentStep, leaps.length, hasUnlockData, nextLeapId, unlockData?.carriesBalance, unlockData?.retirementFocus]);

  /**
   * Turn the wedge answers into the same prefill object the URL params build,
   * so everything downstream is identical whether you arrived from the Leap
   * simulator or straight off a search result. recommended401kPct, the 30-year
   * delta and the cost of delay all come from the same lib the simulator used —
   * this is a new front door onto the existing engine, not a second engine.
   */
  const handleWedgeSubmit = useCallback(() => {
    const salary = parseFloat(wSalary);
    if (!salary || salary <= 0) { setWError('Enter your annual salary.'); return; }
    if (!wState) { setWError('Pick your state so we can estimate tax.'); return; }
    if (wHasMatch === null) { setWError('Let us know whether your employer matches.'); return; }
    setWError(null);

    const current401k = Math.max(0, parseFloat(wCurrent401k) || 0);
    const matchCap = wHasMatch ? Math.max(0, parseFloat(wMatchCap) || 0) : 0;
    const matchRate = wHasMatch ? Math.max(0, parseFloat(wMatchRate) || 100) : 0;

    const leap = getRecommendedLeap(wHasMatch, matchCap, current401k, salary);
    const traj = runTrajectory({
      grossAnnual: salary,
      current401kPct: current401k,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchCap,
      matchRatePct: matchRate,
      hasEmployerMatch: wHasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
    const delay = costOfDelay({
      grossAnnual: salary,
      current401kPct: current401k,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchCap,
      matchRatePct: matchRate,
      hasEmployerMatch: wHasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    }, 12);

    setPrefill({
      salaryAnnual: salary,
      state: wState,
      payFrequency: 'monthly',
      employerMatchEnabled: wHasMatch,
      employerMatchPct: matchCap,
      matchRatePct: matchRate,
      matchCapPct: matchCap,
      current401kPct: current401k,
      recommended401kPct: leap.optimized401kPct,
      estimatedNetMonthlyIncome: computeNetTakeHomeMonthly({
        salaryAnnual: salary,
        employee401kPct: leap.optimized401kPct,
        currentHsaAnnual: 0,
        stateCode: wState,
      }),
      leapDelta30yr: traj.delta30yr,
      costOfDelay12Mo: delay,
      intent: 'unlock_full_stack',
      source: 'allocator_direct',
    });
    const trajInputs = {
      grossAnnual: salary,
      current401kPct: current401k,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchCap,
      matchRatePct: matchRate,
      hasEmployerMatch: wHasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    };
    if (leap.optimized401kPct > current401k) {
      setWedgeLeap({
        label: leap.label,
        from: current401k,
        to: leap.optimized401kPct,
        annual: computeAnnualContributionIncrease401k(trajInputs),
        thirtyYear: traj.delta30yr,
        delay,
      });
    }
    track('allocator_wedge_completed', { salary: Math.round(salary / 10000) * 10000, state: wState, hasMatch: wHasMatch });
  }, [wSalary, wState, wCurrent401k, wHasMatch, wMatchCap, wMatchRate]);

  const stepToSpecName: Record<string, string> = {
    emergency_fund: 'safety',
    high_apr_debt: 'debt',
    retirement_focus: 'retirement',
    hsa: 'hsa',
  };

  const handleStepComplete = useCallback((stepName: string) => {
    const specName = stepToSpecName[stepName] ?? stepName;
    track('allocator_stack_step_completed', { stepName });
    track(`full_stack_step_completed_${specName}`, { stepName });
    track('leap_stack_input_completed', { stepName });
    track('leap_stack_step_completed', { stepName });
    setCurrentStep((s) => Math.min(s + 1, STACK_STEPS.length - 1));
  }, []);

  const handleStackComplete = useCallback(() => {
    track('allocator_stack_completed', {});
  }, []);

  const nextLeap = useMemo(
    () => (nextLeapId ? leaps.find((l) => l.id === nextLeapId) : null),
    [leaps, nextLeapId]
  );
  const nextLeapTitle = nextLeap?.title ?? null;
  const impact401kAtYear30 = prefill?.leapDelta30yr ?? null;
  const costOfDelay12Mo = prefill?.costOfDelay12Mo ?? null;
  const annualContributionIncrease401k = useMemo(() => {
    if (!prefill?.salaryAnnual || prefill.current401kPct >= effectiveTarget401kPct) return null;
    return computeAnnualContributionIncrease401k({
      grossAnnual: prefill.salaryAnnual,
      current401kPct: prefill.current401kPct,
      optimized401kPct: effectiveTarget401kPct,
      matchPct: prefill.matchCapPct ?? prefill.employerMatchPct ?? 5,
      matchRatePct: prefill.matchRatePct ?? 100,
      hasEmployerMatch: prefill.employerMatchEnabled ?? false,
    });
  }, [prefill?.salaryAnnual, prefill?.current401kPct, prefill?.employerMatchEnabled, prefill?.matchCapPct, prefill?.employerMatchPct, prefill?.matchRatePct, effectiveTarget401kPct]);

  const primaryResult = useMemo(
    () =>
      selectPrimaryLeap({
        employerMatchEnabled: prefill?.employerMatchEnabled ?? false,
        current401kPct: prefill?.current401kPct ?? 0,
        matchCapPct,
        k401AtCap,
        salaryAnnual: prefill?.salaryAnnual,
        unlock: unlockData,
        leaps,
      }),
    [prefill?.employerMatchEnabled, prefill?.current401kPct, prefill?.salaryAnnual, matchCapPct, k401AtCap, unlockData, leaps]
  );
  const supportingLeaps = useMemo(
    () => getSupportingLeaps(leaps, primaryResult.kind),
    [leaps, primaryResult.kind]
  );
  const payrollLeaps = useMemo(
    () => leaps.filter((l) => l.category === 'match' || l.category === 'hsa'),
    [leaps]
  );

  const hsaLeap = leaps.find((l) => l.category === 'hsa');
  const annualContributionIncreaseHsa = hsaLeap?.deltaValue ?? null;
  const impactHsaAtYear30 = useMemo(() => {
    const annual = annualContributionIncreaseHsa;
    if (annual == null || annual <= 0) return null;
    return estimateHsaImpact30yr(annual);
  }, [annualContributionIncreaseHsa]);

  /** Next move for email: prefer 401k rec when from Leap Impact, else nextLeap title, else primary. */
  const nextMoveForEmail = useMemo(() => {
    if (nextLeapTitle) return nextLeapTitle;
    if (prefill?.current401kPct != null && prefill?.recommended401kPct != null && prefill.current401kPct < prefill.recommended401kPct) {
      return `Increase 401(k) from ${formatPct(prefill.current401kPct)} → ${formatPct(prefill.recommended401kPct)}`;
    }
    const primary = primaryResult;
    if (primary.kind === 'retirement_15' && primary.retirement15) {
      return `Increase 401(k) from ${formatPct(primary.retirement15.currentPct)} → ${formatPct(primary.retirement15.targetPct)}`;
    }
    if (primary.kind === 'match' && primary.leap?.title) return primary.leap.title;
    if (primary.kind === 'hsa' && primary.leap?.title) return primary.leap.title;
    if (primary.kind === 'debt' && primary.leap?.title) return primary.leap.title;
    if (primary.kind === 'growth_split' && primary.leap?.title) return primary.leap.title;
    return '';
  }, [nextLeapTitle, prefill?.current401kPct, prefill?.recommended401kPct, primaryResult]);

  const intent = prefill?.intent ?? null;
  const showBanner = !!prefill && !!intent;

  return (
    <>
      <Section variant="canvas" className="pt-28 md:pt-36 pb-8">
        <Container maxWidth="narrow">
          {showBanner && (
            <div
              className={cn(
                'rounded-xl border p-4 md:p-5 mb-8',
                intent === 'lock_plan'
                  ? 'bg-brand-50 border-brand-100'
                  : 'bg-canvas border-hairline'
              )}
            >
              {intent === 'lock_plan' ? (
                <>
                  <p className="font-semibold text-ink">Your first Leap is locked: 401(k) match update</p>
                  <p className="text-subtle mt-1">Now let’s finish your plan.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-ink">Let’s finish your full plan.</p>
                  <p className="text-subtle mt-1">Takes ~2 minutes.</p>
                </>
              )}
            </div>
          )}

          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink mb-3">
            Here&apos;s how your money should flow
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed mb-8')}>
            {prefill
              ? 'Complete your money plan. We’ve prefilled what we know from your Leap Impact result.'
              : 'Complete your money plan. Enter your details below.'}
          </p>

          {prefill && !(wedgeLeap && !revealSeen) && (
            <Card className="border-[#D1D5DB] bg-white mb-8">
              <CardHeader>
                <CardTitle className="text-lg text-[#111827]">Income & 401(k)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[#111827]">Annual salary</Label>
                    <p className="text-lg font-medium text-[#111827]">
                      ${prefill.salaryAnnual.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    {/* Shows take-home at the TARGET 401(k), because that is what the
                        routing below actually spends. It previously showed take-home at
                        the CURRENT rate while the summary routed the target — two correct
                        numbers describing different scenarios on one screen, which read as
                        a $100 arithmetic error to anyone who subtracted essentials from
                        this figure. Raising the contribution genuinely lowers take-home, so
                        the drop is stated rather than hidden. */}
                    <Label className="text-[#111827]">Estimated take-home (monthly)</Label>
                    <p className="text-lg font-medium text-[#111827]">
                      {netTakeHomeAtTarget401k > 0
                        ? `$${Math.round(netTakeHomeAtTarget401k).toLocaleString()}`
                        : prefill.estimatedNetMonthlyIncome != null
                          ? `$${Math.round(prefill.estimatedNetMonthlyIncome).toLocaleString()}`
                          : '—'}
                    </p>
                    {netTakeHomeAtTarget401k > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        At your {formatPct(prefill.recommended401kPct)} 401(k) target
                        {netTakeHomeMonthly > netTakeHomeAtTarget401k
                          ? ` — $${Math.round(netTakeHomeMonthly - netTakeHomeAtTarget401k).toLocaleString()} less than today, because more of your pay goes in pre-tax.`
                          : '.'}
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <Label className="text-[#111827]">401(k) contribution (target)</Label>
                  <p className="text-lg font-medium text-[#3F6B42]">{formatPct(prefill.recommended401kPct)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {prefill.employerMatchEnabled && prefill.recommended401kPct <= (prefill.matchCapPct ?? 0) + 0.01
                      ? `The point where your employer stops matching. Below this you leave their money behind.`
                      : prefill.source === 'allocator_direct'
                        ? 'Where we think your contribution should get to, based on what you told us.'
                        : 'We prefilled your 401(k) target based on your Leap Impact result.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cold start. Everything below needs salary and state to compute a
              capital figure or an allocation split, so we ask for them first
              rather than rendering a plan full of blanks. Skipped entirely when
              the Leap simulator has already sent them through the URL. */}
          {!prefill && (
            <Card className="border-[#D1D5DB] bg-white">
              <CardHeader>
                <CardTitle className="text-lg text-[#111827]">Start with your income</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="w-salary" className="text-[#111827]">Annual salary (USD)</Label>
                    <Input
                      id="w-salary"
                      type="number"
                      min="0"
                      inputMode="decimal"
                      placeholder="e.g. 85000"
                      value={wSalary}
                      onChange={(e) => setWSalary(e.target.value)}
                      className="mt-1 border-[#D1D5DB] placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <Label htmlFor="w-state" className="text-[#111827]">State</Label>
                    <select
                      id="w-state"
                      value={wState}
                      onChange={(e) => setWState(e.target.value)}
                      className="mt-1 w-full rounded-md border border-[#D1D5DB] bg-white px-3 py-2 text-sm text-[#111827]"
                    >
                      <option value="">Select state</option>
                      {US_STATES.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="w-current" className="text-[#111827]">
                    Your current 401(k) contribution (% of salary)
                  </Label>
                  <Input
                    id="w-current"
                    type="number"
                    min="0"
                    max="100"
                    inputMode="decimal"
                    value={wCurrent401k}
                    onChange={(e) => setWCurrent401k(e.target.value)}
                    className="mt-1 w-32 border-[#D1D5DB]"
                  />
                </div>

                <div>
                  <Label className="text-[#111827]">Does your employer match?</Label>
                  <div className="mt-2 flex gap-2">
                    <Button
                      type="button"
                      variant={wHasMatch === true ? 'default' : 'outline'}
                      onClick={() => setWHasMatch(true)}
                      className={wHasMatch === true ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90' : ''}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant={wHasMatch === false ? 'default' : 'outline'}
                      onClick={() => setWHasMatch(false)}
                      className={wHasMatch === false ? 'bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90' : ''}
                    >
                      No
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { setWHasMatch(false); }}
                      className="text-gray-600"
                    >
                      Not sure
                    </Button>
                  </div>
                </div>

                {wHasMatch === true && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="w-rate" className="text-[#111827]">They match (% of what you put in)</Label>
                      <Input
                        id="w-rate"
                        type="number"
                        min="0"
                        max="200"
                        inputMode="decimal"
                        value={wMatchRate}
                        onChange={(e) => setWMatchRate(e.target.value)}
                        className="mt-1 border-[#D1D5DB]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="w-cap" className="text-[#111827]">Up to (% of salary)</Label>
                      <Input
                        id="w-cap"
                        type="number"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        value={wMatchCap}
                        onChange={(e) => setWMatchCap(e.target.value)}
                        className="mt-1 border-[#D1D5DB]"
                      />
                    </div>
                  </div>
                )}

                {wError && <p className="text-sm text-red-600">{wError}</p>}

                <Button
                  onClick={handleWedgeSubmit}
                  className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                >
                  Continue →
                </Button>
                <p className="text-xs text-gray-500">
                  Used to estimate your take-home and your match. Nothing leaves your browser.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Restores the moment the simulator led with. Cold start only —
              anyone arriving with URL prefill came from a surface that already
              showed them this. */}
          {prefill && wedgeLeap && !revealSeen && (
            <Card className="border-2 border-[#3F6B42] bg-white">
              <CardContent className="pt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
                  Your biggest money move right now
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#111827]">{wedgeLeap.label}</h2>
                <p className="mt-2 text-base font-semibold text-[#111827]">
                  Move from {formatPct(wedgeLeap.from)} → {formatPct(wedgeLeap.to)} in your 401(k)
                </p>
                {prefill.employerMatchEnabled && (
                  <p className="mt-1 text-sm text-gray-600">
                    That is the point your employer stops matching. Anything below it is their
                    money you are choosing not to take.
                  </p>
                )}

                {wedgeLeap.annual > 0 && (
                  <p className="mt-4 text-3xl font-bold text-[#3F6B42]">
                    +{formatCurrency(wedgeLeap.annual)} per year
                  </p>
                )}
                {wedgeLeap.thirtyYear > 0 && (
                  <p className="mt-1 text-sm text-gray-700">
                    If invested consistently: ~{formatCurrency(wedgeLeap.thirtyYear)} over 30 years
                  </p>
                )}
                {wedgeLeap.delay > 0 && (
                  <p className="mt-1 text-sm text-red-700">
                    Waiting 12 months could cost ~{formatCurrency(wedgeLeap.delay)}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">Assumes 7% real return.</p>

                <Button
                  onClick={() => {
                    setRevealSeen(true);
                    track('allocator_wedge_reveal_continued', {});
                  }}
                  className="mt-6 w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                >
                  Now let&apos;s finish your plan →
                </Button>
                <p className="mt-2 text-xs text-gray-500">
                  Three more questions and we will show you where every dollar should go.
                </p>
              </CardContent>
            </Card>
          )}

          {prefill && !(wedgeLeap && !revealSeen) && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {STACK_STEPS.map((step, i) => (
                  <span
                    key={step.id}
                    className={cn(
                      'text-sm font-medium',
                      i === currentStep ? 'text-[#3F6B42]' : i < currentStep ? 'text-gray-500' : 'text-gray-400'
                    )}
                  >
                    {step.name}
                    {i < STACK_STEPS.length - 1 && <span className="mx-1">·</span>}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                We'll ask a few questions so we can split your money the right way.
              </p>
            </div>

            {currentStep === 0 && (
              <Card className="border-[#D1D5DB] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#111827]">{STACK_STEPS[0].title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    What’s your essential monthly spend (rent + bills + groceries)? Rough estimate is fine.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="ef-monthly">Essential monthly spend (USD)</Label>
                    <Input
                      id="ef-monthly"
                      type="number"
                      placeholder="e.g. 3500"
                      value={efMonthly}
                      onChange={(e) => setEfMonthly(e.target.value)}
                      className="border-[#D1D5DB] max-w-xs"
                    />
                  </div>
                  {efMonthly.trim() && parseFloat(efMonthly) > 0 && (
                    <p className="text-sm text-gray-600">
                      1-month: ${Math.round(parseFloat(efMonthly)).toLocaleString()} · 3-month target: ${Math.round(parseFloat(efMonthly) * 3).toLocaleString()} · 6-month: ${Math.round(parseFloat(efMonthly) * 6).toLocaleString()}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    We'll put 40% of what you save each month toward your buffer until you hit the target.
                  </p>
                  <Button
                    onClick={() => handleStepComplete('emergency_fund')}
                    className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    Next
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 1 && (
              <Card className="border-[#D1D5DB] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#111827]">{STACK_STEPS[1].title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Do you carry a credit card balance month-to-month?
                  </p>
                  <p className="text-xs text-gray-500">
                    We'll send 40% of what's left (after your safety buffer) to high-APR debt until it's gone.
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="highApr"
                        checked={hasHighAprDebt === true}
                        onChange={() => setHasHighAprDebt(true)}
                        className="accent-[#3F6B42]"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="highApr"
                        checked={hasHighAprDebt === false}
                        onChange={() => setHasHighAprDebt(false)}
                        className="accent-[#3F6B42]"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {hasHighAprDebt === true && (
                    <div className="space-y-2">
                      <Label htmlFor="debt-balance">Approx balance ($)</Label>
                      <Input
                        id="debt-balance"
                        type="number"
                        placeholder="e.g. 5000"
                        value={debtBalance}
                        onChange={(e) => setDebtBalance(e.target.value)}
                        className="border-[#D1D5DB] max-w-xs"
                      />
                    </div>
                  )}
                  <Button
                    onClick={() => handleStepComplete('high_apr_debt')}
                    className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    Next
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="border-[#D1D5DB] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#111827]">
                    {hsaEligible === true && (!currentHsaAnnual.trim() || parseFloat(currentHsaAnnual) === 0)
                      ? 'HSA (recommended)'
                      : STACK_STEPS[2].title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Do you have an HSA-eligible health plan? (HSA = triple tax advantage for long-term investing.)
                  </p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hsaEligible"
                        checked={hsaEligible === true}
                        onChange={() => setHsaEligible(true)}
                        className="accent-[#3F6B42]"
                      />
                      <span>Yes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="hsaEligible"
                        checked={hsaEligible === false}
                        onChange={() => setHsaEligible(false)}
                        className="accent-[#3F6B42]"
                      />
                      <span>No</span>
                    </label>
                  </div>
                  {hsaEligible === true && (
                    <div className="space-y-4">
                      <p className="text-xs text-gray-500">Pre-tax. Lowers your taxable income.</p>
                      <div className="space-y-2">
                        <Label htmlFor="hsa-annual">Current HSA annual contribution ($)</Label>
                        <Input
                          id="hsa-annual"
                          type="number"
                          placeholder="e.g. 2000"
                          value={currentHsaAnnual}
                          onChange={(e) => setCurrentHsaAnnual(e.target.value)}
                          className="border-[#D1D5DB] max-w-xs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Coverage type</Label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={hsaCoverageType === 'single' ? 'default' : 'outline'}
                            size="sm"
                            className={hsaCoverageType === 'single' ? 'bg-[#3F6B42] hover:bg-[#3F6B42]/90' : ''}
                            onClick={() => setHsaCoverageType('single')}
                          >
                            Single ($4,300 limit)
                          </Button>
                          <Button
                            type="button"
                            variant={hsaCoverageType === 'family' ? 'default' : 'outline'}
                            size="sm"
                            className={hsaCoverageType === 'family' ? 'bg-[#3F6B42] hover:bg-[#3F6B42]/90' : ''}
                            onClick={() => setHsaCoverageType('family')}
                          >
                            Family ($8,550 limit)
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={() => handleStepComplete('hsa')}
                    className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    Next
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <>
                <Card className="border-[#D1D5DB] bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#111827]">{STACK_STEPS[3].title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <SavingsStackSummary
                      primary={primaryResult}
                      payrollLeaps={payrollLeaps}
                      supportingLeaps={supportingLeaps}
                      flowSummary={flowSummary}
                      hasUnlockData={hasUnlockData}
                      hasEmployerMatch={prefill?.employerMatchEnabled ?? false}
                      routing={routing}
                      monthlyCapitalAvailable={prefill ? monthlyCapitalAtTarget401k : null}
                      preTax401k={prefill ? { currentPct: prefill.current401kPct, targetPct: effectiveTarget401kPct, matchRatePct: prefill.matchRatePct ?? 100, matchCapPct: prefill.matchCapPct ?? prefill.employerMatchPct } : null}
                      primaryTarget401kPct={primaryResult.kind === 'retirement_15' ? primaryResult.retirement15?.targetPct : primaryResult.kind === 'match' && primaryResult.leap ? (primaryResult.leap.targetValue as number) : undefined}
                      acknowledge401kFirst={primaryResult.kind === 'hsa' && prefill?.current401kPct != null && prefill?.recommended401kPct != null && prefill.current401kPct < prefill.recommended401kPct}
                      impact401kAtYear30={impact401kAtYear30}
                      annualContributionIncrease401k={annualContributionIncrease401k}
                      costOfDelay12Mo={costOfDelay12Mo}
                      impactHsaAtYear30={impactHsaAtYear30}
                      annualContributionIncreaseHsa={payrollLeaps.find((l) => l.category === 'hsa')?.deltaValue ?? null}
                      costOfDelayHsa12Mo={null}
                      onUnlockDetailsClick={() => setCurrentStep(0)}
                      ctaSlot={
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm text-gray-700">
                              Your income changes. Expenses shift. Contributions stall.
                            </p>
                            <p className="text-sm font-medium text-[#111827] mt-1">
                              Without automation, this drifts.
                            </p>
                          </div>
                          {monthlyCapitalAtTarget401k > 0 && (
                            <p className="text-sm text-gray-700">
                              Based on your inputs, this stack reallocates ~{formatCurrency(monthlyCapitalAtTarget401k)}/month. Automation ensures it stays aligned.
                            </p>
                          )}
                          <p className="text-sm text-gray-600">
                            Right now, this is just a recommendation. We can turn it into execution.
                          </p>
                          {/* Was an email capture promising "launching the MVP in ~2
                              weeks" — a waitlist for an app that is already live, and the
                              one place on the site with the deepest intent was firing
                              mvp_apply_clicked instead of the shared funnel event. */}
                          <AppCta
                            tool="allocator"
                            prefill={{
                              salary: prefill ? Math.round(prefill.salaryAnnual) : undefined,
                              state: prefill?.state,
                              recommended_401k_pct: prefill?.recommended401kPct,
                            }}
                            headline="Put this on autopilot."
                            body="We'll recalculate when your income or expenses change, and tell you when the next move is worth making."
                            bullets={[
                              'This plan carried over, so you start where you left off',
                              'Your buffer, debt and retirement tracked as the balances actually move',
                              'A weekly focus, so the next move is never the thing you forgot',
                            ]}
                            image={{
                              src: '/images/product/setup-checklist.png',
                              alt: 'WeLeap setup checklist showing a plan being built',
                              width: 1720,
                              height: 680,
                            }}
                            buttonLabel="Put this on autopilot →"
                          />
                        </div>
                      }
                    />
                  </CardContent>
                </Card>

              </>
            )}
          </div>
          )}
        </Container>
      </Section>
    </>
  );
}

function AllocatorFallback() {
  return (
    <Section variant="canvas" className="pt-28 md:pt-36 pb-8">
      <Container maxWidth="narrow">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-32 bg-gray-100 rounded mt-6" />
        </div>
      </Container>
    </Section>
  );
}

/**
 * The ordering the tool applies, written out.
 *
 * "What order should my money go in" is one of the most-asked personal finance
 * questions there is, and this page — the tool that answers it — carried no
 * text answering it at all.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Employer match first, because nothing else pays 100%',
    d: 'A dollar-for-dollar 401(k) match up to 5% of salary is an immediate 100% return on the money you contribute. Contributing below the match cap is the only situation in a normal financial life where money is unambiguously being left behind, so it goes to the front of the queue regardless of everything else.',
  },
  {
    t: 'Then a safety buffer, funded by 40% of what’s left',
    d: 'Forty per cent of your monthly surplus goes to a three-month buffer until it is funded. Not because three months is magic, but because with no buffer at all, the next unexpected expense becomes credit card debt and undoes the step after this one.',
  },
  {
    t: 'Then high-interest debt, funded by 40% of the remainder',
    d: 'Clearing a balance at 22% APR is a guaranteed 22% return, which beats any expected market return. Forty per cent of what is left after the buffer goes here while any high-APR balance exists, and this step switches itself off once it is clear.',
  },
  {
    t: 'Then tax-advantaged accounts — HSA, then retirement',
    d: 'An HSA is untaxed going in, untaxed as it grows and untaxed coming out for medical costs, which no other US account does. The 2025 limits this tool uses are $4,300 for self-only cover and $8,550 for family, with the 401(k) employee deferral capped at $23,500.',
  },
  {
    t: 'Then whatever is left, split between retirement and investing',
    d: 'Only at this point does the answer become "invest the rest", and by then the four higher-return moves above have already been made. The split is shown as percentages of your actual surplus, not of gross salary — two people on the same salary in different states with different rents have very different amounts to allocate.',
  },
];

export default function AllocatorPage() {
  return (
    /* The tool reads useSearchParams, so its subtree is client-rendered and the
       Suspense fallback is what a crawler gets on first paint. Everything
       explanatory therefore sits outside the boundary, where it is in the
       served HTML unconditionally. */
    <PageShell className="bg-canvas">
      <Suspense fallback={<AllocatorFallback />}>
        <AllocatorContent />
      </Suspense>

      <MethodSteps
        heading="What order should your money go in?"
        intro="Five steps, applied in order of what each one returns. The tool runs them against your salary, state and current contributions; the logic itself is below so you can apply it without entering anything."
        steps={STEPS}
      />

      <Caveat label="What this can’t see:">
        the balances you actually hold, what you already contribute, and the goals you are part-way through. Those
        change the order, and they need your real accounts rather than five answers. WeLeap is not a registered
        investment adviser and nothing here is personalised advice.
      </Caveat>

      <ToolFaq href="/allocator" />

      <SiteFooter />
    </PageShell>
  );
}
