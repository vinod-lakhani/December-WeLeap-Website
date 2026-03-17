'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
  calculateEmergencyFundTarget,
  getMilestones,
  monthsToReach,
  suggestMonthlySavings,
  type EmergencyFundInputs,
  type IncomeStability,
  type CreditCardDebt,
} from '@/lib/emergencyFund/calculation';
import { formatCurrency } from '@/lib/rounding';
import { track } from '@/lib/analytics';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { EarlyAccessDialog } from '@/components/early-access-dialog';

const PAGE = '/emergency-fund-target';

const INCOME_STABILITY_OPTIONS: { value: IncomeStability; label: string }[] = [
  { value: 'very_stable', label: 'Very stable salary' },
  { value: 'mostly_stable', label: 'Mostly stable salary' },
  { value: 'somewhat_variable', label: 'Somewhat variable' },
  { value: 'freelance', label: 'Freelance / unpredictable' },
];

const CREDIT_CARD_OPTIONS: { value: CreditCardDebt; label: string }[] = [
  { value: 'no', label: 'No' },
  { value: 'occasionally', label: 'Occasionally' },
  { value: 'yes', label: 'Yes' },
];

const SCENARIO_TRADEOFFS: Record<number, { pros: string; cons?: string }> = {
  2: { pros: 'Frees up money for investing sooner', cons: 'Less protection if income is disrupted' },
  2.5: { pros: 'Light buffer, frees up money sooner', cons: 'Less protection if income is disrupted' },
  3: { pros: 'Safer than average early-career users', cons: 'Frees up money for investing sooner' },
  3.5: { pros: 'Solid early-career buffer', cons: 'Takes a bit longer to reach' },
  4: { pros: 'Strong buffer for most situations', cons: 'Takes longer to reach' },
  4.5: { pros: 'Strong protection for most situations', cons: 'Takes longer to reach' },
  5: { pros: 'Stronger protection if income disruption occurs', cons: 'Takes longer to reach' },
  5.5: { pros: 'Very strong protection', cons: 'Longer time to reach' },
  6: { pros: 'Maximum protection for variable income or dependents', cons: 'Longest time to reach' },
};

export function EmergencyFundTool() {
  const [step, setStep] = useState<'landing' | 'form' | 'results'>('landing');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlyExpenses, setMonthlyExpenses] = useState('');
  const [incomeStability, setIncomeStability] = useState<IncomeStability>('mostly_stable');
  const [hasDependents, setHasDependents] = useState<'yes' | 'no'>('no');
  const [currentSavings, setCurrentSavings] = useState('');
  const [creditCardDebt, setCreditCardDebt] = useState<CreditCardDebt>('no');
  const [monthlySavings, setMonthlySavings] = useState('');
  const [scenarioMonths, setScenarioMonths] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formStartedRef = useRef(false);
  const resultsViewedRef = useRef(false);

  const incomeNum = useMemo(() => parseFloat(monthlyIncome) || 0, [monthlyIncome]);
  const expensesNum = useMemo(() => parseFloat(monthlyExpenses) || 0, [monthlyExpenses]);
  const savingsNum = useMemo(() => parseFloat(currentSavings) || 0, [currentSavings]);
  const savingsRateNum = useMemo(() => parseFloat(monthlySavings) || 0, [monthlySavings]);

  const inputs: EmergencyFundInputs = useMemo(
    () => ({
      monthlyIncome: incomeNum,
      monthlyExpenses: expensesNum,
      incomeStability,
      hasDependents: hasDependents === 'yes',
      currentSavings: savingsNum,
      creditCardDebt,
    }),
    [incomeNum, expensesNum, incomeStability, hasDependents, savingsNum, creditCardDebt]
  );

  const result = useMemo(() => {
    if (incomeNum <= 0 || expensesNum <= 0) return null;
    return calculateEmergencyFundTarget(inputs);
  }, [inputs, incomeNum, expensesNum]);

  const suggestedSavings = useMemo(
    () => suggestMonthlySavings(incomeNum, expensesNum),
    [incomeNum, expensesNum]
  );

  const displayMonths = scenarioMonths ?? result?.targetMonths ?? 3;
  const displayTarget = expensesNum * displayMonths;
  const hasMetTarget = savingsNum >= displayTarget && displayTarget > 0;
  const milestones = useMemo(
    () => getMilestones(expensesNum, displayMonths),
    [expensesNum, displayMonths]
  );

  const monthsToTarget = useMemo(() => {
    if (!result || savingsRateNum <= 0) return null;
    const target = scenarioMonths ? expensesNum * scenarioMonths : result.targetDollars;
    return monthsToReach(savingsNum, target, savingsRateNum);
  }, [result, savingsNum, savingsRateNum, expensesNum, scenarioMonths]);

  const firstMilestone = milestones[0];
  const monthsToFirstMilestone =
    firstMilestone && savingsRateNum > 0
      ? monthsToReach(savingsNum, firstMilestone.targetDollars, savingsRateNum)
      : null;

  const handleFormStart = useCallback(() => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      track('emergency_fund_form_start', { page: PAGE, tool_version: 'emergency_fund_v1' });
    }
  }, []);

  const handleFindTarget = useCallback(() => {
    track('emergency_fund_cta_click', { page: PAGE, tool_version: 'emergency_fund_v1' });
    setStep('form');
  }, []);

  // Track results viewed (once when user first sees results)
  useEffect(() => {
    if (step === 'results' && result && !resultsViewedRef.current) {
      resultsViewedRef.current = true;
      track('emergency_fund_results_viewed', {
        page: PAGE,
        tool_version: 'emergency_fund_v1',
        target_months: result.targetMonths,
        target_dollars: result.targetDollars,
        progress_pct: Math.round(result.progressPct),
      });
    }
  }, [step, result]);

  const handleCalculate = useCallback(() => {
    setError(null);
    if (!monthlyIncome.trim() || !monthlyExpenses.trim()) {
      setError('Please enter your monthly income and expenses.');
      return;
    }
    if (incomeNum <= 0 || expensesNum <= 0) {
      setError('Please enter valid numbers for income and expenses.');
      return;
    }

    track('emergency_fund_calculated', {
      page: PAGE,
      tool_version: 'emergency_fund_v1',
      target_months: result?.targetMonths ?? 0,
      target_dollars: result?.targetDollars ?? 0,
      progress_pct: Math.round(result?.progressPct ?? 0),
    });
    setStep('results');
  }, [monthlyIncome, monthlyExpenses, incomeNum, expensesNum, result]);

  const effectiveMonthlySavings = savingsRateNum > 0 ? savingsRateNum : suggestedSavings;

  return (
    <div className="space-y-8">
      {/* Step 1: Landing CTA */}
      {step === 'landing' && (
        <Card className="border-[#D1D5DB] bg-white text-center py-12 md:py-16">
          <CardContent className="space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#111827]">
              How big should your emergency fund be?
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto">
              We&apos;ll estimate the right buffer for your situation based on income stability,
              expenses, and financial risk.
            </p>
            <Button
              onClick={handleFindTarget}
              className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90 px-8 py-6 text-lg"
            >
              Find my target
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Form */}
      {step === 'form' && (
        <Card className="border-[#D1D5DB] bg-white">
          <CardHeader>
            <CardTitle className="text-xl text-[#111827]">Quick questions</CardTitle>
            <p className="text-sm text-gray-600">5–6 questions, about 30 seconds</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="income" className="text-[#111827]">
                Monthly take-home income
              </Label>
              <Input
                id="income"
                type="number"
                placeholder="e.g. 4,200"
                value={monthlyIncome}
                onChange={(e) => {
                  setMonthlyIncome(e.target.value);
                  handleFormStart();
                }}
                onFocus={handleFormStart}
                className="border-[#D1D5DB] placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expenses" className="text-[#111827]">
                Monthly essential expenses
              </Label>
              <p className="text-xs text-gray-500">
                Rent, groceries, utilities, minimum debt payments, transportation
              </p>
              <Input
                id="expenses"
                type="number"
                placeholder="e.g. 2,900"
                value={monthlyExpenses}
                onChange={(e) => {
                  setMonthlyExpenses(e.target.value);
                  handleFormStart();
                }}
                onFocus={handleFormStart}
                className="border-[#D1D5DB] placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#111827]">How stable is your income?</Label>
              <Select
                value={incomeStability}
                onValueChange={(v) => {
                  setIncomeStability(v as IncomeStability);
                  handleFormStart();
                }}
              >
                <SelectTrigger className="border-[#D1D5DB]" onFocus={handleFormStart}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INCOME_STABILITY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[#111827]">Do you have dependents?</Label>
              <Select
                value={hasDependents}
                onValueChange={(v) => {
                  setHasDependents(v as 'yes' | 'no');
                  handleFormStart();
                }}
              >
                <SelectTrigger className="border-[#D1D5DB]" onFocus={handleFormStart}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="savings" className="text-[#111827]">
                How much emergency savings do you currently have?
              </Label>
              <Input
                id="savings"
                type="number"
                placeholder="e.g. 1,200"
                value={currentSavings}
                onChange={(e) => {
                  setCurrentSavings(e.target.value);
                  handleFormStart();
                }}
                onFocus={handleFormStart}
                className="border-[#D1D5DB] placeholder:text-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#111827]">
                Do you currently carry credit card debt month to month?
              </Label>
              <Select
                value={creditCardDebt}
                onValueChange={(v) => {
                  setCreditCardDebt(v as CreditCardDebt);
                  handleFormStart();
                }}
              >
                <SelectTrigger className="border-[#D1D5DB]" onFocus={handleFormStart}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CREDIT_CARD_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}

            <Button
              onClick={handleCalculate}
              className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
            >
              Get my target
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Results */}
      {step === 'results' && result && (
        <div className="space-y-8">
          {/* Target & Progress */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">
                Your Emergency Fund Target
              </CardTitle>
              <p className="text-sm text-gray-600">Recommended buffer</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {hasMetTarget && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                  <p className="text-sm font-semibold text-green-800 mb-1">
                    Congratulations — you&apos;ve hit your target.
                  </p>
                  <p className="text-sm text-green-700">
                    You have{' '}
                    <strong>
                      {expensesNum > 0
                        ? (savingsNum / expensesNum).toFixed(1) === '1.0'
                          ? '1 month'
                          : `${(savingsNum / expensesNum).toFixed(1)} months`
                        : 'a solid buffer'}
                    </strong>{' '}
                    of expenses saved. Keep it up — your emergency fund is in good shape.
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-6">
                <div>
                  <p className="text-sm text-gray-500">Target months</p>
                  <p className="text-3xl font-bold text-[#111827]">
                    {displayMonths} {displayMonths === 1 ? 'month' : 'months'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target savings</p>
                  <p className="text-3xl font-bold text-[#3F6B42]">
                    {formatCurrency(displayTarget)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Your current position</p>
                <p className="text-lg text-[#111827]">
                  Savings today: <strong>{formatCurrency(savingsNum)}</strong>
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#3F6B42] rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (savingsNum / displayTarget) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#111827]">
                    {Math.round((savingsNum / displayTarget) * 100)}%
                  </span>
                </div>
              </div>

              {result.reasons.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-[#111827] mb-2">
                    Why this is your target
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Your emergency fund recommendation is{' '}
                    {result.targetMonths >= 4 ? 'higher' : 'adjusted'} because:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    {result.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* The Leap */}
          <Card className="border-2 border-[#3F6B42] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">
                {hasMetTarget ? "You're on track" : 'Your next Leap'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasMetTarget ? (
                <>
                  <p className="text-base text-gray-700">
                    You&apos;ve reached your emergency fund target. Keep it up — maintaining this
                    buffer is just as important as building it.
                  </p>
                  <div className="rounded-lg bg-gray-50 p-4 space-y-2">
                    <p className="text-sm text-gray-700">
                      <strong>Your current fund:</strong> {formatCurrency(savingsNum)} (
                      {expensesNum > 0
                        ? (savingsNum / expensesNum).toFixed(1) === '1.0'
                          ? '1 month'
                          : `${(savingsNum / expensesNum).toFixed(1)} months`
                        : '—'}
                      {' '}of expenses)
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>Your target:</strong> {formatCurrency(displayTarget)} ({displayMonths}{' '}
                      {displayMonths === 1 ? 'month' : 'months'} of expenses)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base text-gray-700">
                    Save <strong>{formatCurrency(effectiveMonthlySavings)}/month</strong> toward your
                    emergency fund.
                  </p>
                  {monthsToTarget !== null && monthsToTarget > 0 && (
                    <p className="text-base text-gray-700">
                      At this pace you will reach your target in{' '}
                      <strong>
                        {monthsToTarget >= 12
                          ? `${Math.round(monthsToTarget / 12)} years`
                          : `${monthsToTarget} ${monthsToTarget === 1 ? 'month' : 'months'}`}
                      </strong>
                      .
                    </p>
                  )}
                  {firstMilestone && monthsToFirstMilestone !== null && monthsToFirstMilestone > 0 && (
                    <p className="text-sm text-gray-600">
                      But your first milestone is{' '}
                      <strong>
                        1 month of expenses ({formatCurrency(firstMilestone.targetDollars)})
                      </strong>{' '}
                      — which you could reach in{' '}
                      <strong>
                        {monthsToFirstMilestone >= 12
                          ? `${Math.round(monthsToFirstMilestone / 12)} year${Math.round(monthsToFirstMilestone / 12) > 1 ? 's' : ''}`
                          : `${monthsToFirstMilestone} ${monthsToFirstMilestone === 1 ? 'month' : 'months'}`}
                      </strong>
                      .
                    </p>
                  )}
                  <div className="pt-2">
                    <Label className="text-sm text-gray-600">
                      Enter how much you can save per month toward your emergency fund
                    </Label>
                    <Input
                      type="number"
                      placeholder={`e.g. ${suggestedSavings}`}
                      value={monthlySavings}
                      onChange={(e) => setMonthlySavings(e.target.value)}
                      className="mt-1 w-32 border-[#D1D5DB] placeholder:text-gray-400"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* WeLeap Waitlist CTA */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardContent className="py-8 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">
                Want help actually getting there?
              </h3>
              <p className="text-base text-gray-600">
                WeLeap tracks your money and tells you exactly what to do next — automatically.
              </p>
              <EarlyAccessDialog signupType="emergency_fund_tool">
                <Button className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90">
                  Join the waitlist →
                </Button>
              </EarlyAccessDialog>
            </CardContent>
          </Card>

          {/* Milestone Progress */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Milestone progress</CardTitle>
              <p className="text-sm text-gray-600">Break the journey into stages</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {milestones.map((m) => {
                  const reached = savingsNum >= m.targetDollars;
                  return (
                    <div
                      key={m.months}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        reached ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <span className="font-medium text-[#111827]">
                          {m.months} {m.months === 1 ? 'month' : 'months'}
                        </span>
                        <span className="text-gray-600 ml-2">— {m.label}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-[#111827]">
                          {formatCurrency(m.targetDollars)}
                        </span>
                        {reached && (
                          <span className="text-sm text-green-600 font-medium">✓ Reached</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Scenario Slider */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">Explore scenarios</CardTitle>
              <p className="text-sm text-gray-600">
                See how different targets change your timeline
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>2 months</span>
                  <span>6 months</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={0.5}
                  value={displayMonths}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setScenarioMonths(v);
                    track('emergency_fund_scenario_slider_changed', {
                      page: PAGE,
                      tool_version: 'emergency_fund_v1',
                      scenario_months: v,
                      target_dollars: expensesNum * v,
                    });
                  }}
                  className="w-full h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-[#3F6B42]"
                />
                <p className="text-center font-medium text-[#111827]">
                  {displayMonths} months → {formatCurrency(displayTarget)}
                </p>
              </div>
              {(() => {
                const tradeoff = SCENARIO_TRADEOFFS[displayMonths] ?? SCENARIO_TRADEOFFS[Math.round(displayMonths)];
                return tradeoff ? (
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Pros:</strong> {tradeoff.pros}
                    </p>
                    {tradeoff.cons && (
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>Tradeoff:</strong> {tradeoff.cons}
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                track('emergency_fund_recalculate_clicked', {
                  page: PAGE,
                  tool_version: 'emergency_fund_v1',
                });
                setStep('form');
                setScenarioMonths(null);
              }}
              className="border-[#D1D5DB]"
            >
              Recalculate with different inputs
            </Button>
          </div>

          <ToolFeedbackQuestionnaire
            page={PAGE}
            eventName="emergency_fund_feedback_submitted"
            variant="inline"
            onFeedbackSubmitted={() => {}}
          />
        </div>
      )}
    </div>
  );
}
