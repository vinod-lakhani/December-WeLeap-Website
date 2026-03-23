'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { EarlyAccessDialog } from '@/components/early-access-dialog';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-8">
      {/* Card Input */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">
            Your card
          </CardTitle>
          <p className="text-sm text-gray-600">
            Enter balance and APR to see your payoff timeline
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-28 space-y-1">
              <Label className="text-xs text-gray-500">Balance ($)</Label>
              <Input
                type="number"
                placeholder="0"
                min={0}
                value={card.balance || ''}
                onChange={(e) =>
                  updateCard('balance', parseFloat(e.target.value) || 0)
                }
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
                onChange={(e) =>
                  updateCard('apr', parseFloat(e.target.value) || 0)
                }
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
                  onChange={(e) =>
                    setExtraPayment(parseFloat(e.target.value) || 0)
                  }
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

          {/* WeLeap Waitlist CTA */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardContent className="py-8 space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">
                Want help actually getting there?
              </h3>
              <p className="text-base text-gray-600">
                WeLeap tracks your money and tells you exactly what to do next — automatically.
              </p>
              <EarlyAccessDialog signupType="credit_card_payoff_tool">
                <Button className="bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90">
                  Join the waitlist →
                </Button>
              </EarlyAccessDialog>
            </CardContent>
          </Card>

          <ToolFeedbackQuestionnaire
            page="/credit-card-payoff"
            eventName="credit_card_payoff_feedback_submitted"
            question="Does this payoff plan make sense for you?"
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
        </>
      )}
    </div>
  );
}
