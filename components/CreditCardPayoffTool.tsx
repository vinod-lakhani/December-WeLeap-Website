'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import {
  runPayoffScenario,
  getMinTotalPayment,
  type CreditCard,
} from '@/lib/creditCardPayoff/calculation';
import { formatCurrency } from '@/lib/rounding';
import { AppCta } from '@/components/AppCta';
import { computeInvestingImpact } from '@/lib/networthImpact/math';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { track } from '@/lib/analytics';
import { useQuietReveal } from '@/lib/feedback-reveal';
import { cn } from '@/lib/utils';

const PAGE = '/credit-card-payoff';

const EXTRA_MAX = 500;
const EXTRA_STEP = 10;

function formatBalanceShort(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return formatCurrency(value);
}

function generateId(): string {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CreditCardPayoffTool() {
  const [card, setCard] = useState<CreditCard>({
    id: generateId(),
    name: '',
    balance: 0,
    apr: 0,
  });
  const [extraPayment, setExtraPayment] = useState(0);
  const formStartedRef = useRef(false);
  const resultsViewedRef = useRef(false);

  const updateCard = useCallback((field: keyof CreditCard, value: string | number) => {
    setCard((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validCards = useMemo(() => {
    const balance = Number(card.balance) || 0;
    const apr = Number(card.apr);
    if (balance <= 0 || apr < 0 || isNaN(apr)) return [];
    return [{ ...card, name: 'Credit card', balance, apr }];
  }, [card]);

  const minPaymentTotal = useMemo(
    () => getMinTotalPayment(validCards),
    [validCards]
  );

  const baseResult = useMemo(
    () => runPayoffScenario(validCards, 0),
    [validCards]
  );

  const withExtraResult = useMemo(
    () => runPayoffScenario(validCards, extraPayment),
    [validCards, extraPayment]
  );

  const interestSaved = baseResult.totalInterest - withExtraResult.totalInterest;
  const monthsSaved = baseResult.months - withExtraResult.months;
  const maxInterestSaved = baseResult.totalInterest;
  const interestSavedPct =
    maxInterestSaved > 0 ? (interestSaved / maxInterestSaved) * 100 : 0;

  // The Leap here isn't the interest saved — it's what the payment becomes once
  // the card is gone. Paying it off frees `freedMonthly` every month; the
  // 30-year figure is what that same money does invested instead of servicing
  // an APR. Same framing as the rent tool's cheaper-apartment spread.
  const freedMonthly = minPaymentTotal + extraPayment;
  const freedThirtyYear =
    freedMonthly > 0 ? Math.round(computeInvestingImpact(freedMonthly, 0.07, 30)) : 0;

  const chartData = useMemo(() => {
    const baseMap = new Map(
      baseResult.balanceHistory.map((h) => [h.month, h.totalBalance])
    );
    const extraMap = new Map(
      withExtraResult.balanceHistory.map((h) => [h.month, h.totalBalance])
    );
    const maxMonth = Math.max(
      ...baseResult.balanceHistory.map((h) => h.month),
      ...withExtraResult.balanceHistory.map((h) => h.month)
    );
    const points: { month: number; base: number; withExtra: number }[] = [];
    for (let m = 0; m <= maxMonth; m++) {
      points.push({
        month: m,
        base: baseMap.get(m) ?? 0,
        withExtra: extraMap.get(m) ?? 0,
      });
    }
    return points;
  }, [baseResult.balanceHistory, withExtraResult.balanceHistory]);

  const xAxisTicks = useMemo(() => {
    const maxMonth = chartData.length > 0 ? chartData[chartData.length - 1]!.month : 0;
    if (maxMonth <= 0) return [0];
    const targetTickCount = 6;
    const rawInterval = maxMonth / (targetTickCount - 1);
    const niceIntervals = [1, 2, 3, 5, 6, 10, 12, 15, 18, 20, 24, 30, 36, 60, 120];
    const interval = niceIntervals.find((n) => n >= rawInterval) ?? niceIntervals[niceIntervals.length - 1]!;
    const ticks: number[] = [];
    for (let m = 0; m <= maxMonth; m += interval) {
      ticks.push(m);
    }
    if (ticks[ticks.length - 1] !== maxMonth) {
      ticks.push(maxMonth);
    }
    return ticks;
  }, [chartData]);

  const hasValidInput = validCards.length > 0;
  const hasBalance = validCards.some((c) => c.balance > 0);

  /**
   * The feedback prompt waits for the extra-payment slider to go quiet.
   *
   * Most people who reach a result then spend a while on that slider, trying
   * numbers and watching the payoff date move. The question this tool asks is
   * whether the timeline feels achievable, and that is unanswerable until they
   * have settled on a figure. Fifteen seconds is long enough to survive a pause
   * between drags and short enough that they are still on the page.
   */
  const feedbackRevealed = useQuietReveal(extraPayment, {
    quietMs: 15_000,
    enabled: hasValidInput && hasBalance,
  });

  // Second step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
  // tool_cta_clicked -> cta_click_signup. `credit_card_payoff_form_start`
  // already fired once per visit but under a tool-specific name, so it could
  // not be the middle step of a funnel keyed on the shared events. Both fire
  // from the same guard, so the counts stay identical.
  const handleFormStart = useCallback((field: string) => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      track('tool_engaged', { tool: 'credit_card_payoff', first_field: field });
      track('credit_card_payoff_form_start', { page: PAGE, tool_version: 'credit_card_payoff_v1' });
    }
  }, []);

  /**
   * Third step of the funnel, fired once.
   *
   * Deliberately NOT `hasValidInput`, which is what
   * `credit_card_payoff_calculated` uses: an APR of 0 passes validation, so
   * that condition is already true on the first digit of the balance — the same
   * moment as engagement, and showing a payoff date computed at 0% interest,
   * which is not this calculator's answer. A payoff date and a total-interest
   * figure only mean anything once both the balance and the rate are real, so
   * that is the gate here. The legacy event keeps its own (looser) condition so
   * its history stays comparable.
   */
  const payoffResultReady = hasBalance && (Number(card.apr) || 0) > 0;
  const toolCompletedRef = useRef(false);
  useEffect(() => {
    if (payoffResultReady && !toolCompletedRef.current) {
      toolCompletedRef.current = true;
      track('tool_completed', { tool: 'credit_card_payoff' });
    }
  }, [payoffResultReady]);

  useEffect(() => {
    if (hasValidInput && hasBalance && validCards[0] && !resultsViewedRef.current) {
      resultsViewedRef.current = true;
      const c = validCards[0]!;
      track('credit_card_payoff_calculated', {
        page: PAGE,
        tool_version: 'credit_card_payoff_v1',
        balance: Math.round(c.balance),
        apr: c.apr,
        months_to_payoff: withExtraResult.months,
        total_interest: Math.round(withExtraResult.totalInterest),
      });
    }
  }, [hasValidInput, hasBalance, validCards, withExtraResult.months, withExtraResult.totalInterest]);

  return (
    <div className="space-y-8">
      {/* Card Input */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">
            What do you owe?
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter the balance—the amount you owe on your credit card—and the interest rate (APR). We&apos;ll map out your payoff timeline.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-28 space-y-1">
              <Label className="text-xs text-gray-500">Balance owed ($)</Label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                value={card.balance || ''}
                onChange={(e) => {
                  updateCard('balance', parseFloat(e.target.value) || 0);
                  handleFormStart('balance');
                }}
                onFocus={() => handleFormStart('balance')}
                className="border-[#D1D5DB]"
              />
            </div>
            <div className="w-24 space-y-1">
              <Label className="text-xs text-gray-500">APR (%)</Label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                step={0.1}
                value={card.apr || ''}
                onChange={(e) => {
                  updateCard('apr', parseFloat(e.target.value) || 0);
                  handleFormStart('apr');
                }}
                onFocus={() => handleFormStart('apr')}
                className="border-[#D1D5DB]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {hasValidInput && hasBalance && (
        <>
          {/* Extra Payment Slider */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardHeader>
              <CardTitle className="text-xl text-[#111827]">
                Extra payment
              </CardTitle>
              <p className="text-sm text-gray-600">
                Add extra each month to pay down faster
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-[#111827]">
                  Minimum payment:
                </span>{' '}
                {formatCurrency(minPaymentTotal)}/month
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[#111827]">
                    Extra per month
                  </Label>
                  <span className="text-lg font-semibold text-[#3F6B42]">
                    {formatCurrency(extraPayment)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={EXTRA_MAX}
                  step={EXTRA_STEP}
                  value={extraPayment}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setExtraPayment(val);
                    if (val > 0) {
                      track('credit_card_payoff_extra_slider_changed', {
                        page: PAGE,
                        tool_version: 'credit_card_payoff_v1',
                        extra_payment: val,
                      });
                    }
                  }}
                  className="w-full h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-[#3F6B42]"
                />
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-[#111827]">
                    Minimum plus extra payment:
                  </span>{' '}
                  {formatCurrency(minPaymentTotal + extraPayment)}/month
                </p>
              </div>
              <div className="space-y-1">
                <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full bg-[#3F6B42] rounded-full transition-all"
                    style={{ width: `${interestSavedPct}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">
                  {extraPayment > 0 && interestSaved > 0
                    ? `Saving ${formatCurrency(interestSaved)} in interest`
                    : 'Add extra to see savings'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Debt-Free Banner */}
          <div
            className={cn(
              'rounded-xl px-6 py-6 flex flex-wrap justify-between items-center gap-4',
              extraPayment > 0 ? 'bg-[#4ade80] text-[#0d0f14]' : 'bg-gray-100'
            )}
          >
            <div>
              <p className="text-sm uppercase tracking-wider text-[#111827]/70 font-medium">
                Debt-free date
              </p>
              <p className="text-3xl md:text-4xl font-serif font-bold mt-1">
                {withExtraResult.debtFreeDate.toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm uppercase tracking-wider text-[#111827]/70 font-medium">
                Total interest
              </p>
              <p className="text-3xl md:text-4xl font-serif font-bold mt-1">
                {formatCurrency(withExtraResult.totalInterest)}
              </p>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-[#D1D5DB] bg-white">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                  Months left
                </p>
                <p className="text-3xl font-serif font-bold text-[#111827] mt-1">
                  {withExtraResult.months}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Until paid off
                </p>
              </CardContent>
            </Card>
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-red-700/80 font-medium">
                  Interest paid
                </p>
                <p className="text-3xl font-serif font-bold text-red-800 mt-1">
                  {formatCurrency(withExtraResult.totalInterest)}
                </p>
                <p className="text-sm text-red-700/70 mt-1">
                  Total interest
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-6">
                <p className="text-xs uppercase tracking-wider text-green-800/80 font-medium">
                  You save
                </p>
                <p className="text-3xl font-serif font-bold text-green-800 mt-1">
                  {formatCurrency(interestSaved)}
                </p>
                <p className="text-sm text-green-800/70 mt-1">
                  {monthsSaved} months faster
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payoff Timeline Chart */}
          <Card className="border-[#D1D5DB] bg-[#1a1d24] overflow-hidden">
            <CardContent className="pt-6 pb-4">
              <div className="flex gap-6 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 border-t-2 border-red-500 border-dashed"
                    style={{ height: 2 }}
                  />
                  <span className="text-sm text-gray-400">
                    Min payment only
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-0.5 bg-[#3F6B42] block" />
                  <span className="text-sm text-gray-400">
                    With extra payments
                  </span>
                </div>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                    <XAxis
                      dataKey="month"
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      ticks={xAxisTicks}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={formatBalanceShort}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#9ca3af' }}
                      formatter={(value: number) => [formatCurrency(value), '']}
                      labelFormatter={(m) => `Month ${m}`}
                    />
                    <Line
                      type="monotone"
                      dataKey="base"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Min payment"
                    />
                    <Line
                      type="monotone"
                      dataKey="withExtra"
                      stroke="#3F6B42"
                      strokeWidth={2}
                      dot={false}
                      name="With extra"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* The Leap. This used to go through the early-access dialog: same
              app destination, but an extra interstitial click, no prefill, and
              no `tool_cta_clicked` event — so this tool never appeared in the
              funnel at all. It now links straight through with the card
              prefilled, and leads with what the payment is worth after the debt
              is gone: the payoff date is the answer, this is the reason to act
              on it. */}
          {freedThirtyYear > 0 && (
            <div className="rounded-2xl bg-[#3F6B42]/5 p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
                What that payment is worth once the card is gone
              </p>
              <p className="mt-1 text-[30px] font-extrabold leading-none tabular-nums text-[#111827]">
                {formatCurrency(freedThirtyYear)}
              </p>
              <p className="mt-1.5 text-xs text-gray-500">
                The {formatCurrency(freedMonthly)}/mo you free up, invested over 30 years at 7% a
                year instead of servicing {card.apr}% APR.
              </p>
            </div>
          )}

          <AppCta
            tool="credit_card_payoff"
            /* The button used to read "Get my first Leap" while the Leap was
               already on screen above it — promising the thing the reader
               already had. It carries the computed number instead, so it reads
               as a continuation of what they just worked out rather than an
               offer of it. */
            buttonLabel={`Show me where my ${formatCurrency(freedMonthly)}/mo should go \u2192`}
            prefill={{
              debt_balance: Math.round(Number(card.balance) || 0),
              debt_apr: card.apr,
              extra_payment: extraPayment,
            }}
            headline="Want help actually getting there?"
            body="A payoff date only helps if the extra payment actually happens every month. That's the part WeLeap keeps on track."
            bullets={[
              'Your payoff date, tracked as the balance actually moves',
              'A plan that funds the extra payment without wrecking the rest',
              'When the card clears, the payment gets redirected \u2014 not absorbed',
            ]}
            image={{
              // The debt Leap, not the 401(k) match one — a match screenshot on a
              // credit card page previews the wrong thing. Copy mirrors the
              // liability_paydown leap the engine actually emits.
              src: '/images/product/debt-payoff-leap.jpg',
              alt: 'WeLeap showing this week\u2019s focus: pay down high-interest debt faster',
              width: 1400,
              height: 529,
            }}
          />

          {feedbackRevealed && (
          <ToolFeedbackQuestionnaire
            page="/credit-card-payoff"
            eventName="credit_card_payoff_feedback_submitted"
            question="Does this payoff timeline feel achievable?"
            buttonLabels={{
              yes: '✅ Yes — this feels right',
              not_sure: '🤔 Not sure',
              no: "❌ Doesn't feel relevant",
            }}
            feedbackResponseMessages={{
              yes: "Great — let's build the rest of your plan.",
              not_sure: 'No worries — your full plan will show the tradeoffs and alternatives.',
              no: "Got it — your full plan will show the next best move.",
            }}
            onFeedbackSubmitted={() => {}}
          />
          )}
        </>
      )}
    </div>
  );
}
