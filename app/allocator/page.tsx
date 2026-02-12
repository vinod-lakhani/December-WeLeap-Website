'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { PageShell, Section, Container } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import type { AllocatorIntent } from '@/lib/leapImpact/allocatorLink';
import { buildLeaps } from '@/lib/allocator/buildLeaps';
import type { AllocatorUnlockData } from '@/lib/allocator/leapModel';
import { selectPrimaryLeap, getSupportingLeaps } from '@/lib/allocator/selectPrimaryLeap';
import { computeNetTakeHomeMonthly } from '@/lib/allocator/takeHome';
import { SavingsStackSummary } from '@/components/allocator/SavingsStackSummary';

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
  { id: 'retirement_focus', name: 'Retirement Split', title: 'Retirement Split' },
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
  const [debtAprRange, setDebtAprRange] = useState<string>('');
  const [debtBalance, setDebtBalance] = useState<string>('');
  const [retirementFocus, setRetirementFocus] = useState<'high' | 'medium' | 'low' | null>(null);
  const [hsaEligible, setHsaEligible] = useState<boolean | null>(null);
  const [currentHsaAnnual, setCurrentHsaAnnual] = useState('');
  const [hsaCoverageType, setHsaCoverageType] = useState<'single' | 'family'>('single');
  const prevNextLeapIdRef = useRef<string | null>(null);
  const leapStackRenderedTrackedRef = useRef(false);
  const [earlyAccessModalOpen, setEarlyAccessModalOpen] = useState(false);
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [earlyAccessSubmitting, setEarlyAccessSubmitting] = useState(false);
  const [earlyAccessError, setEarlyAccessError] = useState<string | null>(null);
  const [earlyAccessSuccess, setEarlyAccessSuccess] = useState(false);
  const [actionIntent, setActionIntent] = useState<boolean | null>(null);

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
      track('allocator_prefill_loaded', { source: prefill.source, intent: prefill.intent });
      track('leap_stack_started', { source: prefill.source });
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
      debtAprRange: debtAprRange || undefined,
      debtBalance: balanceNum != null && !Number.isNaN(balanceNum) && balanceNum > 0 ? balanceNum : undefined,
      retirementFocus: retirementFocus ?? undefined,
      hsaEligible: hsaEligible ?? undefined,
      currentHsaAnnual: hsaNum != null && !Number.isNaN(hsaNum) && hsaNum >= 0 ? hsaNum : undefined,
      hsaCoverageType: hsaCoverageType,
    };
  }, [efMonthly, hasHighAprDebt, debtAprRange, debtBalance, retirementFocus, hsaEligible, currentHsaAnnual, hsaCoverageType]);

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

  const netTakeHomeMonthly = useMemo(() => {
    if (!prefill?.salaryAnnual || !prefill.state) return 0;
    return computeNetTakeHomeMonthly({
      salaryAnnual: prefill.salaryAnnual,
      employee401kPct: prefill.current401kPct,
      currentHsaAnnual: unlockData?.currentHsaAnnual ?? prefill.currentHsaAnnual ?? 0,
      stateCode: prefill.state,
    });
  }, [prefill?.salaryAnnual, prefill?.state, prefill?.current401kPct, prefill?.currentHsaAnnual, unlockData?.currentHsaAnnual]);

  const monthlyCapitalAvailable = useMemo(() => {
    const essentials = unlockData?.essentialMonthly ?? 0;
    return Math.max(0, netTakeHomeMonthly - essentials);
  }, [netTakeHomeMonthly, unlockData?.essentialMonthly]);

  const { leaps, nextLeapId, flowSummary, matchCaptured, routing } = useMemo(
    () => buildLeaps(prefillForLeaps, unlockData, { monthlyCapitalAvailable: prefill ? monthlyCapitalAvailable : undefined }),
    [prefillForLeaps, unlockData, prefill, monthlyCapitalAvailable]
  );

  const hasUnlockData = !!(unlockData?.essentialMonthly != null || unlockData?.retirementFocus != null || (unlockData?.carriesBalance === false) || (unlockData?.carriesBalance === true && unlockData?.debtBalance != null && unlockData?.debtAprRange));

  useEffect(() => {
    if (leaps.length > 0 && nextLeapId !== prevNextLeapIdRef.current) {
      if (prevNextLeapIdRef.current != null) {
        track('leap_stack_next_leap_changed', { fromLeapId: prevNextLeapIdRef.current, toLeapId: nextLeapId ?? '' });
      }
      prevNextLeapIdRef.current = nextLeapId;
    }
  }, [leaps.length, nextLeapId]);

  useEffect(() => {
    if (currentStep === 4 && leaps.length > 0 && !leapStackRenderedTrackedRef.current) {
      leapStackRenderedTrackedRef.current = true;
      track('leap_stack_rendered', { hasUnlockData, numLeaps: leaps.length, nextLeapId: nextLeapId ?? '' });
      track('leap_stack_plan_viewed', {
        numLeaps: leaps.length,
        hasDebt: unlockData?.carriesBalance === true,
        retirementFocus: unlockData?.retirementFocus ?? undefined,
      });
      track('summary_viewed', { numLeaps: leaps.length });
      track('leap_stack_summary_viewed', { numLeaps: leaps.length });
    }
  }, [currentStep, leaps.length, hasUnlockData, nextLeapId, unlockData?.carriesBalance, unlockData?.retirementFocus]);

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

  const hsaNotMaxed = useMemo(
    () => leaps.some((l) => l.category === 'hsa' && l.hsaCurrentAnnual != null && l.hsaMaxAnnual != null && l.hsaCurrentAnnual < l.hsaMaxAnnual),
    [leaps]
  );
  const primaryResult = useMemo(
    () =>
      selectPrimaryLeap({
        employerMatchEnabled: prefill?.employerMatchEnabled ?? false,
        current401kPct: prefill?.current401kPct ?? 0,
        recommended401kPct: prefill?.recommended401kPct ?? 0,
        hsaNotMaxed,
        unlock: unlockData,
        leaps,
      }),
    [prefill?.employerMatchEnabled, prefill?.current401kPct, prefill?.recommended401kPct, hsaNotMaxed, unlockData, leaps]
  );
  const supportingLeaps = useMemo(
    () => getSupportingLeaps(leaps, primaryResult.kind),
    [leaps, primaryResult.kind]
  );
  const payrollLeaps = useMemo(
    () => leaps.filter((l) => l.category === 'match' || l.category === 'hsa'),
    [leaps]
  );

  const handleMvpApplyClick = useCallback(() => {
    track('mvp_apply_clicked', {});
    track('early_access_modal_viewed', {});
    setEarlyAccessError(null);
    setEarlyAccessModalOpen(true);
  }, []);

  const handleEarlyAccessSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setEarlyAccessError(null);
      if (!earlyAccessEmail.trim() || !earlyAccessEmail.includes('@')) {
        setEarlyAccessError('Please enter a valid email address.');
        return;
      }
      setEarlyAccessSubmitting(true);
      try {
        const res = await fetch('/api/early-access-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: earlyAccessEmail.trim(),
            source: 'leap_stack',
            salaryAnnual: prefill?.salaryAnnual,
            state: prefill?.state,
            employerMatchEnabled: prefill?.employerMatchEnabled,
            matchPct: prefill?.employerMatchPct,
            current401kPct: prefill?.current401kPct,
            recommended401kPct: prefill?.recommended401kPct,
            essentialsMonthly: unlockData?.essentialMonthly,
            carriesBalance: unlockData?.carriesBalance,
            debtAprRange: unlockData?.debtAprRange,
            debtBalance: unlockData?.debtBalance,
            retirementFocus: unlockData?.retirementFocus,
            nextLeapTitle: nextLeapTitle ?? '',
            impactAtYear30: impact401kAtYear30 ?? undefined,
            costOfDelay12Mo: costOfDelay12Mo ?? undefined,
            actionIntent: actionIntent ?? undefined,
            leapTitles: leaps.map((l) => l.title),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to submit');
        }
        track('plan_saved_or_waitlist_joined', { source: 'leap_stack' });
        track('early_access_submitted', {
          source: 'leap_stack',
          actionIntent: actionIntent ?? undefined,
          nextLeapTitle: nextLeapTitle ?? '',
          impactAtYear30: impact401kAtYear30 ?? undefined,
        });
        track('early_access_email_send_success', {});
        setEarlyAccessSuccess(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Something went wrong';
        setEarlyAccessError(message);
        track('early_access_email_send_failed', { error: message });
      } finally {
        setEarlyAccessSubmitting(false);
      }
    },
    [
      earlyAccessEmail,
      actionIntent,
      prefill,
      unlockData,
      leaps,
      nextLeapTitle,
      impact401kAtYear30,
      costOfDelay12Mo,
    ]
  );

  const intent = prefill?.intent ?? null;
  const showBanner = !!prefill && !!intent;

  return (
    <PageShell>
      <Section variant="white" className="pt-28 md:pt-36 pb-8">
        <Container maxWidth="narrow">
          {showBanner && (
            <div
              className={cn(
                'rounded-xl border p-4 md:p-5 mb-8',
                intent === 'lock_plan'
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-gray-50 border-gray-200'
              )}
            >
              {intent === 'lock_plan' ? (
                <>
                  <p className="font-semibold text-[#111827]">Your first Leap is locked: 401(k) match update</p>
                  <p className="text-gray-600 mt-1">Now let’s complete your stack.</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[#111827]">Let’s complete your full Leap stack.</p>
                  <p className="text-gray-600 mt-1">Takes ~2 minutes.</p>
                </>
              )}
            </div>
          )}

          <h1 className={cn(TYPOGRAPHY.h1, 'text-[#111827] mb-2')}>Full Leap stack</h1>
          <p className={cn(TYPOGRAPHY.body, 'text-gray-600 mb-8')}>
            {prefill
              ? 'Complete your allocation plan. We’ve prefilled what we know from your Leap Impact result.'
              : 'Complete your allocation plan. Enter your details below.'}
          </p>

          {prefill && (
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
                    <Label className="text-[#111827]">Estimated take-home (monthly)</Label>
                    <p className="text-lg font-medium text-[#111827]">
                      {netTakeHomeMonthly > 0
                        ? `$${Math.round(netTakeHomeMonthly).toLocaleString()}`
                        : prefill.estimatedNetMonthlyIncome != null
                          ? `$${Math.round(prefill.estimatedNetMonthlyIncome).toLocaleString()}`
                          : '—'}
                    </p>
                    {netTakeHomeMonthly > 0 && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Recalculated from your 401(k) and HSA. Updates when you change contributions.
                      </p>
                    )}
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200">
                  <Label className="text-[#111827]">401(k) contribution (target)</Label>
                  <p className="text-lg font-medium text-[#3F6B42]">{prefill.recommended401kPct}%</p>
                  <p className="text-xs text-gray-500 mt-1">
                    We prefilled your 401(k) target based on your Leap Impact result.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                This is a parallel routing system. We ask a few inputs so we can allocate correctly.
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
                    We'll route 40% of your monthly savings toward your buffer until you hit the target.
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
                    We route 40% of what's left (after your buffer allocation) to high-APR debt until it's gone.
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Approx APR</Label>
                        <div className="flex flex-wrap gap-2">
                          {(['10-14', '15-19', '20+'] as const).map((range) => (
                            <Button
                              key={range}
                              type="button"
                              variant={debtAprRange === range ? 'default' : 'outline'}
                              size="sm"
                              className={debtAprRange === range ? 'bg-[#3F6B42] hover:bg-[#3F6B42]/90' : ''}
                              onClick={() => setDebtAprRange(range)}
                            >
                              {range === '10-14' ? '10–14%' : range === '15-19' ? '15–19%' : '20%+'}
                            </Button>
                          ))}
                        </div>
                      </div>
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
                  <CardTitle className="text-xl text-[#111827]">{STACK_STEPS[2].title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    How much do you want to prioritize retirement accounts vs flexible (brokerage) investing?
                  </p>
                  <div className="space-y-2">
                    {(['high', 'medium', 'low'] as const).map((focus) => (
                      <label key={focus} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="retirementFocus"
                          checked={retirementFocus === focus}
                          onChange={() => setRetirementFocus(focus)}
                          className="accent-[#3F6B42]"
                        />
                        <span className="text-[#111827]">
                          {focus === 'high' && 'Grow faster (80/20 Retirement/Brokerage)'}
                          {focus === 'medium' && 'Balanced (60/40 Retirement/Brokerage)'}
                          {focus === 'low' && 'More flexibility (20/80 Retirement/Brokerage)'}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button
                    onClick={() => handleStepComplete('retirement_focus')}
                    disabled={!retirementFocus}
                    className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    Next
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="border-[#D1D5DB] bg-white">
                <CardHeader>
                  <CardTitle className="text-xl text-[#111827]">
                    {hsaEligible === true && (!currentHsaAnnual.trim() || parseFloat(currentHsaAnnual) === 0)
                      ? 'HSA (recommended)'
                      : STACK_STEPS[3].title}
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

            {currentStep === 4 && (
              <>
                <Card className="border-[#D1D5DB] bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-[#111827]">{STACK_STEPS[4].title}</CardTitle>
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
                      monthlyCapitalAvailable={prefill ? monthlyCapitalAvailable : null}
                      preTax401k={prefill ? { currentPct: prefill.current401kPct, targetPct: prefill.recommended401kPct, matchRatePct: prefill.matchRatePct ?? 100, matchCapPct: prefill.matchCapPct ?? prefill.employerMatchPct } : null}
                      impact401kAtYear30={impact401kAtYear30}
                      costOfDelay12Mo={costOfDelay12Mo}
                      impactHsaAtYear30={null}
                      costOfDelayHsa12Mo={null}
                      onUnlockDetailsClick={() => setCurrentStep(0)}
                    />
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                      <Button
                        onClick={handleMvpApplyClick}
                        className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                      >
                        Save my plan + get MVP access
                      </Button>
                      <p className="text-xs text-gray-500">
                        Early access to execution and automatic recalibration as your situation evolves.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={earlyAccessModalOpen} onOpenChange={setEarlyAccessModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-[#111827]">Execution is coming.</DialogTitle>
                    </DialogHeader>
                    {!earlyAccessSuccess ? (
                      <form onSubmit={handleEarlyAccessSubmit} className="space-y-3">
                        <p className="text-sm text-gray-600">
                          We’re launching the MVP in ~2 weeks. Enter your email to get early access and apply this plan.
                        </p>
                        <Label htmlFor="allocator-early-access-email" className="text-[#111827]">
                          Email
                        </Label>
                        <Input
                          id="allocator-early-access-email"
                          type="email"
                          placeholder="you@example.com"
                          value={earlyAccessEmail}
                          onChange={(e) => setEarlyAccessEmail(e.target.value)}
                          className="border-[#D1D5DB]"
                        />
                        {prefill?.employerMatchEnabled && prefill?.recommended401kPct != null && (
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={actionIntent === true}
                              onChange={(e) => setActionIntent(e.target.checked)}
                              className="mt-1 accent-[#3F6B42]"
                            />
                            <span className="text-sm text-[#111827]">
                              I would increase my 401(k) to {prefill.recommended401kPct}% if this were automated.
                            </span>
                          </label>
                        )}
                        {earlyAccessError && (
                          <p className="text-sm text-red-600">{earlyAccessError}</p>
                        )}
                        <Button
                          type="submit"
                          disabled={earlyAccessSubmitting}
                          className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                        >
                          {earlyAccessSubmitting ? 'Submitting...' : 'Get early access'}
                        </Button>
                      </form>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-[#111827] font-medium">You’re on the early access list.</p>
                        <p className="text-sm text-gray-600">
                          We’ll email you when execution goes live.
                        </p>
                        <Button
                          onClick={() => {
                            setEarlyAccessModalOpen(false);
                            handleStackComplete();
                          }}
                          className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                        >
                          Done
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </Container>
      </Section>
    </PageShell>
  );
}

function AllocatorFallback() {
  return (
    <PageShell>
      <Section variant="white" className="pt-28 md:pt-36 pb-8">
        <Container maxWidth="narrow">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-100 rounded w-full" />
            <div className="h-4 bg-gray-100 rounded w-5/6" />
            <div className="h-32 bg-gray-100 rounded mt-6" />
          </div>
        </Container>
      </Section>
    </PageShell>
  );
}

export default function AllocatorPage() {
  return (
    <Suspense fallback={<AllocatorFallback />}>
      <AllocatorContent />
    </Suspense>
  );
}
