'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getRecommendedLeap } from '@/lib/leapImpact/leapDecision';
import { runTrajectory, costOfDelay } from '@/lib/leapImpact/trajectory';
import { REAL_RETURN_DEFAULT, DEFAULT_MATCH_PCT, DEFAULT_CURRENT_401K_PCT } from '@/lib/leapImpact/constants';
import { buildAllocatorUrl, buildAllocatorPrefillUrl, type AllocatorIntent } from '@/lib/leapImpact/allocatorLink';
import { formatCurrency } from '@/lib/rounding';
import { track } from '@/lib/analytics';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { EarlyAccessDialog } from '@/components/early-access-dialog';

const PAGE = '/leap-impact-simulator';

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
];

interface TaxResult {
  netIncomeAnnual: number;
}

export function LeapImpactTool() {
  const searchParams = useSearchParams();
  const [salary, setSalary] = useState('');
  const [state, setState] = useState('');
  const [prefillFromRent, setPrefillFromRent] = useState(false);
  const [hasMatch, setHasMatch] = useState(true);
  const [matchRatePct, setMatchRatePct] = useState('100');
  const [matchCapPct, setMatchCapPct] = useState(String(DEFAULT_MATCH_PCT));
  const [current401kPct, setCurrent401kPct] = useState(String(DEFAULT_CURRENT_401K_PCT));
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccessIntent, setEmailSuccessIntent] = useState<AllocatorIntent | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rentPrefillAppliedRef = useRef(false);

  // Prefill from rent tool when src=rent
  useEffect(() => {
    if (!searchParams || rentPrefillAppliedRef.current) return;
    if (searchParams.get('src') !== 'rent') return;
    rentPrefillAppliedRef.current = true;
    const salaryAnnual = searchParams.get('salaryAnnual');
    const stateParam = searchParams.get('state');
    if (salaryAnnual && parseFloat(salaryAnnual) > 0) {
      setSalary(String(Math.round(parseFloat(salaryAnnual))));
    }
    if (stateParam) {
      setState(stateParam);
    }
    setPrefillFromRent(true);
  }, [searchParams]);

  const salaryNum = useMemo(() => {
    const n = parseFloat(salary);
    return Number.isNaN(n) || n <= 0 ? 0 : n;
  }, [salary]);
  const matchRatePctNum = useMemo(() => {
    const n = parseFloat(matchRatePct);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  }, [matchRatePct]);
  const matchCapPctNum = useMemo(() => {
    const n = parseFloat(matchCapPct);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  }, [matchCapPct]);
  const current401kNum = useMemo(() => {
    const n = parseFloat(current401kPct);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  }, [current401kPct]);

  const leap = useMemo(
    () => getRecommendedLeap(hasMatch, matchCapPctNum, current401kNum, salaryNum),
    [hasMatch, matchCapPctNum, current401kNum, salaryNum]
  );

  const trajectoryResult = useMemo(() => {
    if (!taxResult || salaryNum <= 0) return null;
    return runTrajectory({
      grossAnnual: salaryNum,
      current401kPct: current401kNum,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchCapPctNum,
      matchRatePct: matchRatePctNum,
      hasEmployerMatch: hasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
  }, [taxResult, salaryNum, current401kNum, leap.optimized401kPct, matchCapPctNum, matchRatePctNum, hasMatch]);

  const costOfDelayAmount = useMemo(() => {
    if (!trajectoryResult || trajectoryResult.delta30yr <= 0) return 0;
    return costOfDelay({
      grossAnnual: salaryNum,
      current401kPct: current401kNum,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchCapPctNum,
      matchRatePct: matchRatePctNum,
      hasEmployerMatch: hasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
  }, [trajectoryResult, salaryNum, current401kNum, leap.optimized401kPct, matchCapPctNum, matchRatePctNum, hasMatch]);

  const chartData = useMemo(() => {
    if (!trajectoryResult) return [];
    return trajectoryResult.yearLabels.map((year, i) => ({
      year,
      Baseline: trajectoryResult.baselineByYear[i] ?? 0,
      Optimized: trajectoryResult.optimizedByYear[i] ?? 0,
    }));
  }, [trajectoryResult]);

  const handleCalculate = useCallback(async () => {
    setError(null);
    if (!salary.trim() || !state) {
      setError('Please enter your annual salary and select your state.');
      return;
    }
    if (salaryNum <= 0) {
      setError('Please enter a valid annual salary.');
      return;
    }
    setIsCalculating(true);
    try {
      const res = await fetch('/api/tax', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ salaryAnnual: salaryNum, state }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to estimate take-home pay');
      }
      const data = await res.json();
      setTaxResult({ netIncomeAnnual: data.netIncomeAnnual });

      const traj = runTrajectory({
        grossAnnual: salaryNum,
        current401kPct: current401kNum,
        optimized401kPct: leap.optimized401kPct,
        matchPct: matchCapPctNum,
        matchRatePct: matchRatePctNum,
        hasEmployerMatch: hasMatch,
        realReturn: REAL_RETURN_DEFAULT,
        years: 30,
      });
      track('landing_cta_click_show_next_move', { page: PAGE });
      track('leap_impact_calculated', {
        page: PAGE,
        salary: salaryNum,
        state,
        match_yesno: hasMatch,
        current_pct: current401kNum,
        match_cap_pct: matchCapPctNum,
        match_rate_pct: matchRatePctNum,
        recommended_pct: leap.optimized401kPct,
        delta_30yr: traj.delta30yr,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsCalculating(false);
    }
  }, [salary, salaryNum, state, hasMatch, matchCapPctNum, matchRatePctNum, current401kNum, leap.optimized401kPct]);

  const handleContinueToAllocator = useCallback(() => {
    const intent = emailSuccessIntent ?? 'lock_plan';
    track('leap_redirect_to_allocator', { intent });
    const netMonthlyVal = taxResult ? taxResult.netIncomeAnnual / 12 : undefined;
    const url = buildAllocatorPrefillUrl({
      salaryAnnual: salaryNum,
      state,
      payFrequency: 'monthly',
      employerMatchEnabled: hasMatch,
      employerMatchPct: matchCapPctNum,
      matchRatePct: matchRatePctNum,
      matchCapPct: matchCapPctNum,
      current401kPct: current401kNum,
      recommended401kPct: leap.optimized401kPct,
      estimatedNetMonthlyIncome: netMonthlyVal,
      leapDelta30yr: trajectoryResult?.delta30yr,
      intent,
      source: 'leap_impact_tool',
    });
    window.location.href = url;
  }, [emailSuccessIntent, taxResult, salaryNum, state, hasMatch, matchCapPctNum, matchRatePctNum, current401kNum, leap.optimized401kPct, trajectoryResult?.delta30yr]);

  const handleLockPlan = useCallback(async (e: React.FormEvent, intent: AllocatorIntent) => {
    e.preventDefault();
    setEmailError(null);
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailSubmitting(true);
    try {
      const waitlistRes = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          signupType: 'leap_impact_lock_plan',
          page: PAGE,
        }),
      });
      if (!waitlistRes.ok) {
        const data = await waitlistRes.json();
        throw new Error(data.error || 'Failed to save');
      }
      const netMonthlyVal = taxResult ? taxResult.netIncomeAnnual / 12 : undefined;
      const planData = {
        salary: salaryNum,
        state,
        netMonthly: netMonthlyVal,
        recommended401kPct: leap.optimized401kPct,
        delta30yr: trajectoryResult?.delta30yr,
        leapSummary: leap.summary,
      };
      const emailRes = await fetch('/api/email-leap-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), planData }),
      });
      if (!emailRes.ok) {
        const data = await emailRes.json();
        throw new Error(data.error || 'Failed to send email');
      }
      track('leap_impact_email_submitted', { page: PAGE });
      track('leap_email_submit_success', {
        intent,
        salary: salaryNum,
        state,
        current401kPct: current401kNum,
        recommended401kPct: leap.optimized401kPct,
        delta30yr: trajectoryResult?.delta30yr ?? undefined,
      });
      setEmailSubmitted(true);
      setEmailSuccessIntent(intent);
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    } catch (e) {
      setEmailError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setEmailSubmitting(false);
    }
  }, [email, taxResult, salaryNum, state, hasMatch, matchCapPctNum, matchRatePctNum, current401kNum, leap.optimized401kPct, leap.summary, trajectoryResult?.delta30yr]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const showResultsRef = useRef(false);
  const [chartExpanded, setChartExpanded] = useState(false);
  const fullStackSectionRef = useRef<HTMLDivElement>(null);
  const nextMoveCardRef = useRef<HTMLDivElement>(null);

  const netMonthly = taxResult ? taxResult.netIncomeAnnual / 12 : 0;
  const showResults = taxResult && trajectoryResult;
  const is401kMaxed = leap.type === 'at_cap';

  const scrollToFullStackCTA = useCallback(() => {
    const target = is401kMaxed ? nextMoveCardRef.current : fullStackSectionRef.current;
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [is401kMaxed]);


  useEffect(() => {
    if (showResults && !showResultsRef.current) {
      showResultsRef.current = true;
      track('results_viewed', { page: PAGE });
      if (is401kMaxed) {
        const current401kAnnual = salaryNum > 0 ? (salaryNum * current401kNum) / 100 : 0;
        track('leap_401k_maxed_shown', {
          page: PAGE,
          salary: salaryNum,
          current401kPct: current401kNum,
          current401kAnnual: Math.round(current401kAnnual),
          hasMatch,
          matchCapPct: matchCapPctNum,
        });
      }
    }
  }, [showResults, is401kMaxed, salaryNum, current401kNum, hasMatch, matchCapPctNum]);

  const handleUnlockFullStack = useCallback((fromMaxed401k = false) => {
    try {
      if (!state?.trim()) {
        setError('Please select your state before continuing to the allocation plan.');
        return;
      }
      if (salaryNum <= 0) {
        setError('Please enter a valid salary before continuing.');
        return;
      }
      setError(null);
      if (fromMaxed401k) {
        track('leap_401k_maxed_continue_to_fullstack_clicked', {
          page: PAGE,
          salary: salaryNum,
          current401kPct: current401kNum,
        });
      }
      track('full_stack_expand_clicked', { page: PAGE });
      track('leap_stack_unlock_clicked', { page: PAGE });
      track('leap_redirect_to_allocator', { intent: 'unlock_full_stack' });
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('leap_clicked_build_full_stack', 'true');
      }
      const netMonthlyVal = taxResult ? taxResult.netIncomeAnnual / 12 : undefined;
      const url = buildAllocatorPrefillUrl({
        salaryAnnual: salaryNum,
        state: state.trim(),
        payFrequency: 'monthly',
        employerMatchEnabled: hasMatch,
        employerMatchPct: matchCapPctNum,
        matchRatePct: matchRatePctNum,
        matchCapPct: matchCapPctNum,
        current401kPct: current401kNum,
        recommended401kPct: leap.optimized401kPct,
        estimatedNetMonthlyIncome: netMonthlyVal,
        leapDelta30yr: trajectoryResult?.delta30yr,
        costOfDelay12Mo: costOfDelayAmount > 0 ? costOfDelayAmount : undefined,
        intent: 'unlock_full_stack',
        source: 'leap_impact_tool',
      });
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    }
  }, [salaryNum, state, hasMatch, matchCapPctNum, matchRatePctNum, current401kNum, leap.optimized401kPct, trajectoryResult?.delta30yr, costOfDelayAmount, taxResult]);

  return (
    <div className="space-y-8">
      {prefillFromRent && (
        <div className="rounded-lg border border-[#3F6B42]/30 bg-[#3F6B42]/5 px-4 py-3 text-sm text-[#111827]">
          Prefilled from your rent results.
        </div>
      )}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">Income & Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="leap-salary" className="text-[#111827]">
              Annual gross salary (USD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="leap-salary"
              type="number"
              placeholder="e.g. 85000"
              value={salary}
              onChange={(e) => setSalary(e.target.value)}
              className="border-[#D1D5DB]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leap-state" className="text-[#111827]">
              State <span className="text-red-500">*</span>
            </Label>
            <Select value={state} onValueChange={setState}>
              <SelectTrigger id="leap-state" className="border-[#D1D5DB]">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-[#111827]">Employer 401(k) match?</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="match"
                  checked={hasMatch}
                  onChange={() => setHasMatch(true)}
                  className="accent-[#3F6B42]"
                />
                <span className="text-[#111827]">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="match"
                  checked={!hasMatch}
                  onChange={() => setHasMatch(false)}
                  className="accent-[#3F6B42]"
                />
                <span className="text-[#111827]">No</span>
              </label>
            </div>
          </div>
          {hasMatch && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="leap-match-rate" className="text-[#111827]">
                  Employer matches (% of your contributions)
                </Label>
                <Input
                  id="leap-match-rate"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="100"
                  value={matchRatePct}
                  onChange={(e) => setMatchRatePct(e.target.value)}
                  className="border-[#D1D5DB] w-24"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leap-match-cap" className="text-[#111827]">
                  Up to (% of salary)
                </Label>
                <Input
                  id="leap-match-cap"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="5"
                  value={matchCapPct}
                  onChange={(e) => setMatchCapPct(e.target.value)}
                  className="border-[#D1D5DB] w-24"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="leap-401k" className="text-[#111827]">
              Your current 401(k) contribution (% of salary)
            </Label>
            <p className="text-xs text-gray-500">
              We compare this to your employer match and optimal target.
            </p>
            <Input
              id="leap-401k"
              type="number"
              min={0}
              max={100}
              placeholder="5"
              value={current401kPct}
              onChange={(e) => setCurrent401kPct(e.target.value)}
              className="border-[#D1D5DB] w-24"
            />
          </div>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="assumptions" className="border-none">
              <AccordionTrigger className="py-1 text-xs text-gray-500 hover:no-underline">
                Assumptions
              </AccordionTrigger>
              <AccordionContent className="text-xs text-gray-500 pb-0">
                Assumes {(REAL_RETURN_DEFAULT * 100).toFixed(0)}% real return. You can change later.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}
          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
          >
            {isCalculating ? 'Calculating...' : 'Show my highest-impact move'}
          </Button>
          <p className="text-center text-xs text-gray-500 mt-2">
            No email required. You&apos;ll see your #1 move immediately.
          </p>
        </CardContent>
      </Card>

      {showResults && trajectoryResult && (
        <div className="space-y-8">
          {/* 1. THE HOOK — Your next move */}
          <Card ref={nextMoveCardRef} className="border-2 border-[#3F6B42] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">
                {is401kMaxed ? '401(k) is maxed ✅' : 'Your next move'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-[#6B7280]">
                Step 1: Your highest-impact move
              </p>
              <p className="font-semibold text-[#111827]">{leap.summary}</p>
              <p className="text-sm text-gray-600">
                {leap.type === 'capture_match'
                  ? 'This unlocks more employer match — free money that compounds.'
                  : leap.type === 'at_cap'
                    ? "Nice — you're already hitting the annual 401(k) limit. Let's optimize the next lever."
                    : 'Tax-advantaged compounding. Same 7% assumption; benefit is taxes + discipline.'}
              </p>
              <p className="text-sm text-gray-600">
                Next: we&apos;ll structure your Emergency Fund + HSA + Debt + Investing.
              </p>
              <p className="text-sm text-gray-600">
                Most people stop here. The real optimization happens across the full stack.
              </p>
              {!is401kMaxed && (
                <>
                  <p className="text-lg font-bold text-[#3F6B42]">
                    30-year upside: +{formatCurrency(trajectoryResult.delta30yr)}
                  </p>
                  {costOfDelayAmount > 0 && (
                    <p className="text-sm text-gray-600">
                      Waiting 12 months costs ~{formatCurrency(costOfDelayAmount)}
                    </p>
                  )}
                </>
              )}
              {is401kMaxed ? (
                <div className="pt-2">
                  <Button
                    onClick={() => handleUnlockFullStack(true)}
                    className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    See my next best move
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">Takes ~2 minutes. No email required.</p>
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">Assumes 7% real return.</p>
              )}
            </CardContent>
          </Card>

          {/* 2. Chart — collapsed by default, expand to see curve */}
          {!is401kMaxed && (
            <Card className="border-[#D1D5DB] bg-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setChartExpanded((v) => !v)}
                    className="text-sm text-[#3F6B42] hover:underline font-medium flex items-center gap-1"
                  >
                    See the 30-year curve
                    <span className="text-gray-500">{chartExpanded ? '▼' : '→'}</span>
                  </button>
                  <span className="text-sm text-gray-500">{chartExpanded ? 'collapse' : 'expand'}</span>
                </div>
                {chartExpanded && (
                  <>
                    <div className="h-[280px] w-full mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                          <XAxis
                            dataKey="year"
                            tickFormatter={(v) => (v === 0 ? '0' : v % 10 === 0 ? `${v}` : '')}
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                          />
                          <YAxis
                            tickFormatter={(v) => {
                              if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                              if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                              return `$${v}`;
                            }}
                            stroke="#6B7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            formatter={(value: number) => [formatCurrency(value), '']}
                            labelFormatter={(label) => `Year ${label}`}
                            contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB' }}
                          />
                          <ReferenceLine x={10} stroke="#9CA3AF" strokeDasharray="2 2" />
                          <ReferenceLine x={30} stroke="#9CA3AF" strokeDasharray="2 2" />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="Baseline"
                            stroke="#94A3B8"
                            strokeWidth={2}
                            dot={false}
                            name="Current"
                          />
                          <Line
                            type="monotone"
                            dataKey="Optimized"
                            stroke="#3F6B42"
                            strokeWidth={2}
                            dot={false}
                            name="After this move"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      Same income. Different setup.
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* 2.5. Build full stack CTA — moved up, primary action */}
          {!is401kMaxed && (
            <div ref={fullStackSectionRef}>
              <Card className="border-2 border-[#3F6B42] bg-white">
                <CardContent className="pt-6">
                  <p className="text-sm text-gray-600 mb-4">
                    We&apos;ll size your safety buffer, check debt, add HSA, and set your routing rules.
                  </p>
                  <Button
                    onClick={() => handleUnlockFullStack(false)}
                    className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                  >
                    Build my full stack → (2 min)
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2.6. Feedback questionnaire */}
          <ToolFeedbackQuestionnaire
            page={PAGE}
            eventName="leap_impact_feedback_submitted"
            question="Does this next move make sense for you?"
            buttonLabels={{
              yes: '✅ Yes — this feels right',
              not_sure: '🤔 Not sure',
              no: "❌ Doesn't feel relevant",
            }}
            feedbackResponseMessages={{
              yes: "Great — let's build the rest of your stack.",
              not_sure: 'No worries — the full stack will show tradeoffs and alternatives.',
              no: "Got it — the full stack will surface the best alternative lever.",
            }}
            onFeedbackSubmitted={scrollToFullStackCTA}
          />

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <p className="font-medium text-[#111827] mb-1">Assumptions</p>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600">
              <li>Take-home pay uses the same tax estimate as our rent tool.</li>
              <li>Real return {(REAL_RETURN_DEFAULT * 100).toFixed(2)}% (inflation-adjusted).</li>
              <li>Net worth = 401(k) + employer match growth only (no other assets/debt for this view).</li>
            </ul>
            <p className="mt-2 text-xs text-gray-500">Estimates only. Not financial advice.</p>
          </div>
        </div>
      )}

    </div>
  );
}
