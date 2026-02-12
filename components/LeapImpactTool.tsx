'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
import { getStackPreviewSteps } from '@/lib/leapImpact/stackPreview';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';

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
  const [salary, setSalary] = useState('');
  const [state, setState] = useState('');
  const [hasMatch, setHasMatch] = useState(true);
  const [matchPct, setMatchPct] = useState(String(DEFAULT_MATCH_PCT));
  const [current401kPct, setCurrent401kPct] = useState(String(DEFAULT_CURRENT_401K_PCT));
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [emailSubmitting, setEmailSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [stackPreviewExpandedTracked, setStackPreviewExpandedTracked] = useState(false);
  const [stackAccordionValue, setStackAccordionValue] = useState<string>('');
  const [showLockPlanSection, setShowLockPlanSection] = useState(false);
  const [emailSuccessIntent, setEmailSuccessIntent] = useState<AllocatorIntent | null>(null);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    if (mq.matches) {
      setStackAccordionValue('stack');
      setStackPreviewExpandedTracked(true);
      track('leap_stack_preview_expanded', { page: PAGE });
    }
    const handler = () => setStackAccordionValue(mq.matches ? 'stack' : '');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const salaryNum = useMemo(() => {
    const n = parseFloat(salary);
    return Number.isNaN(n) || n <= 0 ? 0 : n;
  }, [salary]);
  const matchPctNum = useMemo(() => {
    const n = parseFloat(matchPct);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  }, [matchPct]);
  const current401kNum = useMemo(() => {
    const n = parseFloat(current401kPct);
    return Number.isNaN(n) || n < 0 ? 0 : n;
  }, [current401kPct]);

  const leap = useMemo(
    () => getRecommendedLeap(hasMatch, matchPctNum, current401kNum),
    [hasMatch, matchPctNum, current401kNum]
  );

  const trajectoryResult = useMemo(() => {
    if (!taxResult || salaryNum <= 0) return null;
    return runTrajectory({
      grossAnnual: salaryNum,
      current401kPct: current401kNum,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchPctNum,
      hasEmployerMatch: hasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
  }, [taxResult, salaryNum, current401kNum, leap.optimized401kPct, matchPctNum, hasMatch]);

  const costOfDelayAmount = useMemo(() => {
    if (!trajectoryResult || trajectoryResult.delta30yr <= 0) return 0;
    return costOfDelay({
      grossAnnual: salaryNum,
      current401kPct: current401kNum,
      optimized401kPct: leap.optimized401kPct,
      matchPct: matchPctNum,
      hasEmployerMatch: hasMatch,
      realReturn: REAL_RETURN_DEFAULT,
      years: 30,
    });
  }, [trajectoryResult, salaryNum, current401kNum, leap.optimized401kPct, matchPctNum, hasMatch]);

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
        matchPct: matchPctNum,
        hasEmployerMatch: hasMatch,
        realReturn: REAL_RETURN_DEFAULT,
        years: 30,
      });
      track('leap_impact_calculated', {
        page: PAGE,
        salary: salaryNum,
        state,
        match_yesno: hasMatch,
        current_pct: current401kNum,
        match_pct: matchPctNum,
        recommended_pct: leap.optimized401kPct,
        delta_30yr: traj.delta30yr,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsCalculating(false);
    }
  }, [salary, salaryNum, state, hasMatch, matchPctNum, current401kNum, leap.optimized401kPct]);

  const handleContinueToAllocator = useCallback(() => {
    const intent = emailSuccessIntent ?? 'lock_plan';
    track('leap_redirect_to_allocator', { intent });
    const netMonthlyVal = taxResult ? taxResult.netIncomeAnnual / 12 : undefined;
    const url = buildAllocatorPrefillUrl({
      salaryAnnual: salaryNum,
      state,
      payFrequency: 'monthly',
      employerMatchEnabled: hasMatch,
      employerMatchPct: matchPctNum,
      current401kPct: current401kNum,
      recommended401kPct: leap.optimized401kPct,
      estimatedNetMonthlyIncome: netMonthlyVal,
      leapDelta30yr: trajectoryResult?.delta30yr,
      intent,
      source: 'leap_impact_tool',
    });
    window.location.href = url;
  }, [emailSuccessIntent, taxResult, salaryNum, state, hasMatch, matchPctNum, current401kNum, leap.optimized401kPct, trajectoryResult?.delta30yr]);

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
  }, [email, taxResult, salaryNum, state, hasMatch, matchPctNum, current401kNum, leap.optimized401kPct, leap.summary, trajectoryResult?.delta30yr]);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    };
  }, []);

  const netMonthly = taxResult ? taxResult.netIncomeAnnual / 12 : 0;
  const showResults = taxResult && trajectoryResult;

  const stackSteps = useMemo(
    () => getStackPreviewSteps(hasMatch, current401kNum, matchPctNum),
    [hasMatch, current401kNum, matchPctNum]
  );

  const handleStackAccordionChange = useCallback((value: string) => {
    setStackAccordionValue(value);
    if (value === 'stack' && !stackPreviewExpandedTracked) {
      setStackPreviewExpandedTracked(true);
      track('leap_stack_preview_expanded', { page: PAGE });
    }
  }, [stackPreviewExpandedTracked]);

  const handleUnlockFullStack = useCallback(() => {
    track('leap_stack_unlock_clicked', { page: PAGE });
    track('leap_redirect_to_allocator', { intent: 'unlock_full_stack' });
    const netMonthlyVal = taxResult ? taxResult.netIncomeAnnual / 12 : undefined;
    const url = buildAllocatorPrefillUrl({
      salaryAnnual: salaryNum,
      state,
      payFrequency: 'monthly',
      employerMatchEnabled: hasMatch,
      employerMatchPct: matchPctNum,
      current401kPct: current401kNum,
      recommended401kPct: leap.optimized401kPct,
      estimatedNetMonthlyIncome: netMonthlyVal,
      leapDelta30yr: trajectoryResult?.delta30yr,
      costOfDelay12Mo: costOfDelayAmount > 0 ? costOfDelayAmount : undefined,
      intent: 'unlock_full_stack',
      source: 'leap_impact_tool',
    });
    window.location.href = url;
  }, [taxResult, salaryNum, state, hasMatch, matchPctNum, current401kNum, leap.optimized401kPct, trajectoryResult?.delta30yr, costOfDelayAmount]);

  return (
    <div className="space-y-8">
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">Your numbers</CardTitle>
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
            <div className="space-y-2">
              <Label htmlFor="leap-match-pct" className="text-[#111827]">
                Match cap %
              </Label>
              <Input
                id="leap-match-pct"
                type="number"
                min={0}
                max={100}
                placeholder="5"
                value={matchPct}
                onChange={(e) => setMatchPct(e.target.value)}
                className="border-[#D1D5DB] w-24"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="leap-401k" className="text-[#111827]">
              Current 401(k) contribution %
            </Label>
            <p className="text-xs text-gray-500">
              Enter your current percentage (from your paystub). We’ll recommend the next best move.
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
            {isCalculating ? 'Calculating...' : 'Show my trajectory'}
          </Button>
        </CardContent>
      </Card>

      {showResults && trajectoryResult && (
        <div className="space-y-8">
          {/* Trajectory delta and single-Leap impact use the same value for consistency */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Your trajectory delta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl md:text-3xl font-bold text-[#3F6B42] mb-2">
                +{formatCurrency(trajectoryResult.delta30yr)}
              </p>
              <p className="text-[#111827]">
                If you apply 1 Leap today, your projected net worth at Year 30 increases by{' '}
                <strong>{formatCurrency(trajectoryResult.delta30yr)}</strong>.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Baseline vs optimized</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis
                      dataKey="year"
                      tickFormatter={(v) => (v === 0 ? '0' : v % 10 === 0 ? `${v}` : '')}
                      stroke="#6B7280"
                      fontSize={12}
                    />
                    <YAxis
                      tickFormatter={(v) => {
                        if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
                        if (v >= 1000) return `$${(v / 1000).toFixed(0)}k`;
                        return `$${v}`;
                      }}
                      stroke="#6B7280"
                      fontSize={12}
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
                      name="Current setup"
                    />
                    <Line
                      type="monotone"
                      dataKey="Optimized"
                      stroke="#3F6B42"
                      strokeWidth={2}
                      dot={false}
                      name="After this Leap"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Markers at Year 10 and Year 30. Assumptions: {(REAL_RETURN_DEFAULT * 100).toFixed(0)}% real return, contributions monthly.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Your highest-impact Leap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold text-[#111827]">{leap.summary}</p>
              <p className="text-sm text-gray-600">
                Why now: {leap.type === 'capture_match' ? 'Unlocks employer match (free money).' : 'Accelerates tax-advantaged compounding.'}
              </p>
              <p className="text-[#3F6B42] font-medium">
                Impact: +{formatCurrency(trajectoryResult.delta30yr)} at Year 30
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Cost of delay</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#111827]">
                Waiting 12 months costs roughly{' '}
                <strong>{formatCurrency(costOfDelayAmount)}</strong> in long-term net worth.
              </p>
            </CardContent>
          </Card>

          {/* Next Leaps stack preview — canonical order per Savings Stack spec; HSA omitted */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">What comes next (your Leap stack)</CardTitle>
              <p className="text-sm text-gray-600 font-normal mt-1">
                After this Leap, WeLeap always surfaces the next best move — one at a time.
              </p>
            </CardHeader>
            <CardContent>
              <Accordion
                type="single"
                collapsible
                value={stackAccordionValue}
                onValueChange={handleStackAccordionChange}
                className="w-full"
              >
                <AccordionItem value="stack" className="border-none">
                  <AccordionTrigger className="py-2 text-[#111827] hover:no-underline hover:text-[#3F6B42]">
                    <span className="text-left">Show my next Leaps (5 steps)</span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-5 pt-2">
                      {stackSteps.map((step) => (
                        <div key={step.stepNumber} className="flex gap-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                            <span className="text-sm font-semibold text-[#111827]">{step.stepNumber}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium text-[#111827]">{step.name}</span>
                              {step.badge && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                  {step.badge}
                                </span>
                              )}
                              {step.status === 'completed' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 border border-green-200">
                                  Completed
                                </span>
                              )}
                              {step.status === 'in_progress' && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 border border-primary-200">
                                  In progress
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{step.why}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleUnlockFullStack}
                        className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                      >
                        Build my full Leap plan
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        Build your ranked plan in ~2 minutes. Save it at the end to get a link by email.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>

          {/* Tool Feedback Questionnaire — same pattern as rent tool; show Lock plan only after yes/not_sure */}
          {!showLockPlanSection && (
            <ToolFeedbackQuestionnaire
              page={PAGE}
              eventName="leap_impact_feedback_submitted"
              onFeedbackSubmitted={(feedback) => {
                if (feedback === 'yes' || feedback === 'not_sure') {
                  setShowLockPlanSection(true);
                }
              }}
            />
          )}

          {/* Lock this plan — only show after positive feedback (like rent tool WaitlistForm) */}
          {showLockPlanSection && (
            <Card className="border-[#D1D5DB] bg-white border-2 border-[#3F6B42]/30">
              <CardHeader>
                <CardTitle className="text-xl text-[#111827]">Lock this plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!emailSubmitted ? (
                  <form onSubmit={(e) => handleLockPlan(e, 'lock_plan')} className="space-y-3">
                    <Label htmlFor="leap-email" className="text-[#111827]">
                      Email
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        id="leap-email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="border-[#D1D5DB] flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={emailSubmitting}
                        className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                      >
                        {emailSubmitting ? 'Sending...' : 'Lock this plan (free)'}
                      </Button>
                    </div>
                    {emailError && (
                      <p className="text-sm text-red-600">{emailError}</p>
                    )}
                  </form>
                ) : emailSuccessIntent ? (
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-[#111827]">Plan locked.</h3>
                    <p className="text-[#111827]">Next: let’s build your full Leap stack.</p>
                    <Button
                      onClick={() => {
                        if (redirectTimeoutRef.current) {
                          clearTimeout(redirectTimeoutRef.current);
                          redirectTimeoutRef.current = null;
                        }
                        handleContinueToAllocator();
                      }}
                      className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                    >
                      Continue
                    </Button>
                  </div>
                ) : (
                  <p className="text-[#111827]">
                    Plan saved. Check your email for your trajectory summary and link.
                  </p>
                )}
                {!emailSuccessIntent && (
                  <p className="text-xs text-gray-500">
                    We’ll email you a summary and open your full allocation plan with these numbers prefilled.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

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
