'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberCard } from './NumberCard';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { EarlyAccessDialog } from '@/components/early-access-dialog';
import { computeImpacts } from '@/lib/networthImpact/math';
import type { ImpactInputs, UseCase } from '@/lib/networthImpact/types';
import { formatCurrencySigned, formatPercent } from '@/lib/format';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const NET_WORTH_IMPACT_PAGE = '/net-worth-impact';

const MONTHLY_MIN = -1000;
const MONTHLY_MAX = 1000;
const MONTHLY_STEP = 10;
const MONTHLY_DEFAULT = 150;
const APR_MIN = 5;
const APR_MAX = 30;
const APR_DEFAULT = 18;

function getSentence(
  useCase: UseCase,
  years: number,
  monthlyDelta: number,
  impact: number
): string {
  const absX = Math.abs(monthlyDelta);
  const absY = Math.abs(impact);
  const signedY = formatCurrencySigned(impact);

  if (monthlyDelta >= 0) {
    switch (useCase) {
      case 'investing':
        return `If you invest $${absX.toLocaleString()}/month, future-you gains about ${signedY}.`;
      case 'cash':
        return `If you stash $${absX.toLocaleString()}/month, you'll have ${signedY} saved.`;
      case 'debt':
        return `If you pay $${absX.toLocaleString()}/month extra, you could save about ${signedY} in interest.`;
      default:
        return `Future impact: ${signedY}.`;
    }
  }

  // Negative delta — gentle warning
  switch (useCase) {
    case 'investing':
      return `If you pull out $${absX.toLocaleString()}/month, future-you is about ${signedY} lower.`;
    case 'cash':
      return `If you spend $${absX.toLocaleString()}/month more from savings, you'll have ${signedY} less.`;
    case 'debt':
      return `Paying $${absX.toLocaleString()}/month less could cost you about ${signedY} in extra interest.`;
    default:
      return `Future impact: ${signedY}.`;
  }
}

export function ImpactTool() {
  const [monthlyDelta, setMonthlyDelta] = useState(MONTHLY_DEFAULT);
  const [useCase, setUseCase] = useState<UseCase>('investing');
  const [debtApr, setDebtApr] = useState(APR_DEFAULT);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const toolStartedRef = useRef(false);

  const trackToolStart = useCallback(() => {
    if (!toolStartedRef.current) {
      toolStartedRef.current = true;
      track('net_worth_impact_tool_start', {
        page: NET_WORTH_IMPACT_PAGE,
        tool_version: 'net_worth_impact_v1',
      });
    }
  }, []);

  const clampMonthly = useCallback((v: number) => {
    return Math.max(MONTHLY_MIN, Math.min(MONTHLY_MAX, Math.round(v / MONTHLY_STEP) * MONTHLY_STEP));
  }, []);

  const handleMonthlyFromInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    trackToolStart();
    const parsed = parseInt(e.target.value, 10);
    if (!Number.isNaN(parsed)) setMonthlyDelta(clampMonthly(parsed));
  };

  const inputs: ImpactInputs = useMemo(
    () => ({
      monthlyDelta,
      useCase,
      realReturn: 0.07,
      debtApr: debtApr / 100,
    }),
    [monthlyDelta, useCase, debtApr]
  );

  const horizons = useMemo(() => computeImpacts(inputs), [inputs]);

  return (
    <div className="space-y-8">
      <Card className="border-gray-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">Your monthly change</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Monthly Delta: slider + number input */}
          <div className="space-y-2">
            <Label htmlFor="monthly-delta" className="text-[#111827]">
              Monthly delta ($/month)
            </Label>
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <input
                id="monthly-delta"
                type="range"
                min={MONTHLY_MIN}
                max={MONTHLY_MAX}
                step={MONTHLY_STEP}
                value={monthlyDelta}
                onChange={(e) => {
                  trackToolStart();
                  setMonthlyDelta(Number(e.target.value));
                }}
                className="flex-1 w-full sm:min-w-[200px] h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-[#3F6B42]"
              />
              <Input
                type="number"
                min={MONTHLY_MIN}
                max={MONTHLY_MAX}
                step={MONTHLY_STEP}
                value={monthlyDelta}
                onChange={handleMonthlyFromInput}
                onBlur={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (Number.isNaN(v)) setMonthlyDelta(MONTHLY_DEFAULT);
                  else setMonthlyDelta(clampMonthly(v));
                }}
                className="w-28 shrink-0 border-gray-300"
                aria-label="Monthly delta dollars"
              />
            </div>
            <p className="text-xs text-gray-500">
              Use a negative number if you're spending more or saving less.
            </p>
          </div>

          {/* Use of funds: segmented control */}
          <div className="space-y-2">
            <Label className="text-[#111827]">Use of funds</Label>
            <div
              className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5"
              role="group"
              aria-label="Use of funds"
            >
              {(['investing', 'cash', 'debt'] as const).map((uc) => (
                <button
                  key={uc}
                  type="button"
                  onClick={() => setUseCase(uc)}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                    useCase === uc
                      ? 'bg-white text-[#111827] shadow-sm border border-gray-200'
                      : 'text-gray-600 hover:text-[#111827]'
                  )}
                >
                  {uc === 'investing' && 'Investing'}
                  {uc === 'cash' && 'Cash'}
                  {uc === 'debt' && 'Debt payoff'}
                </button>
              ))}
            </div>
          </div>

          {/* APR when debt */}
          {useCase === 'debt' && (
            <div className="space-y-2">
              <Label htmlFor="debt-apr" className="text-[#111827]">
                Assumed APR on debt ({formatPercent(debtApr)})
              </Label>
              <div className="flex items-center gap-4">
                <input
                  id="debt-apr"
                  type="range"
                  min={APR_MIN}
                  max={APR_MAX}
                  step={1}
                  value={debtApr}
                  onChange={(e) => {
                    trackToolStart();
                    setDebtApr(Number(e.target.value));
                  }}
                  className="flex-1 max-w-xs h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-[#3F6B42]"
                />
                <span className="text-sm font-medium tabular-nums w-10">{debtApr}%</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output: 3 NumberCards */}
      <div>
        <h3 className="text-lg font-semibold text-[#111827] mb-4">Net worth impact</h3>
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-3">
          {horizons.map((h) => (
            <NumberCard
              key={h.years}
              years={h.years}
              impact={h.impact}
              sentence={getSentence(useCase, h.years, monthlyDelta, h.impact)}
            />
          ))}
        </div>
      </div>

      {/* Tool Feedback Questionnaire — Yes / Maybe opens Join Waitlist modal */}
      <ToolFeedbackQuestionnaire
        page={NET_WORTH_IMPACT_PAGE}
        onFeedbackSubmitted={(feedback) => {
          if (feedback === 'yes' || feedback === 'not_sure') {
            track('waitlist_modal_opened', {
              page: NET_WORTH_IMPACT_PAGE,
              source: 'tool_feedback',
              feedback,
            });
            setShowWaitlistModal(true);
          }
        }}
      />

      {/* Assumptions footer */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <p className="font-medium text-[#111827] mb-1">Assumptions</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
          <li>Investing uses 7% real return (inflation-adjusted).</li>
          <li>Cash uses 0% real — no growth, just deposits.</li>
          <li>Debt uses APR avoided (simplified estimate).</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">Estimates only. Not financial advice.</p>
      </div>

      {/* Join Waitlist modal (same as site-wide) — opened when user taps Yes or Not sure */}
      <EarlyAccessDialog
        signupType="net_worth_tool_feedback"
        open={showWaitlistModal}
        onOpenChange={setShowWaitlistModal}
      />
    </div>
  );
}
