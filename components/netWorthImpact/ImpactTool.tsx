'use client';

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberCard } from './NumberCard';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { EarlyAccessDialog } from '@/components/early-access-dialog';
import { AppCta } from '@/components/AppCta';
import { computeImpacts } from '@/lib/networthImpact/math';
import type { ImpactInputs, UseCase } from '@/lib/networthImpact/types';
import { formatCurrencySigned, formatPercent } from '@/lib/format';
import { track } from '@/lib/analytics';
import { nextRunIndex } from '@/lib/run-index';
import { trackLeapShown } from '@/lib/leap-shown';
import { cn } from '@/lib/utils';

/**
 * NOT the current route — the route is /what-is-saving-monthly-worth.
 *
 * This is the `page` value `net_worth_impact_tool_start`,
 * `networth_tool_feedback_submitted` and this tool's `waitlist_modal_opened`
 * have always sent, and all three predate the rename. Their history is recorded
 * under this string, so a saved report filtering on it would quietly drop to
 * zero if this moved. Same arrangement as `legacyPage` on ToolPageView and
 * `PAGE` in SmartPurchaseTool: the shared funnel events report the real URL,
 * the legacy per-tool events keep their own past.
 */
const NET_WORTH_IMPACT_PAGE = '/net-worth-impact';

const MONTHLY_MIN = -1000;
const MONTHLY_MAX = 1000;
const MONTHLY_STEP = 10;
const MONTHLY_DEFAULT = 150;
const APR_MIN = 5;
const APR_MAX = 30;
const APR_DEFAULT = 18;

/**
 * How long an input has to hold still before the result counts as one the
 * visitor chose. Long enough to swallow a slider drag and the keystrokes of a
 * three-digit number, short enough that it fires while they are still reading.
 */
const RESULT_SETTLE_MS = 800;

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
  const [monthlyInputStr, setMonthlyInputStr] = useState<string | null>(null); // null = show monthlyDelta, string = user is typing
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

  /**
   * Second step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
   * tool_cta_clicked -> cta_click_signup. Fires once per visit, on the first
   * input touched, carrying that field.
   *
   * Kept separate from `net_worth_impact_tool_start` rather than folded into
   * it: that event's triggers (the two sliders and the amount field) are the
   * shape its history was recorded in, and the use-of-funds control is an input
   * the funnel should count. Same guard style, its own ref.
   *
   */
  const engagedRef = useRef(false);
  /**
   * Mirrors `engagedRef` as state, purely so the feedback prompt can depend on
   * it. The ref stays the guard for the analytics event — it must fire exactly
   * once — while this drives a re-render. Setting it repeatedly is a no-op.
   *
   * This is the reveal condition on its own: it only ever goes false -> true,
   * so it is already sticky and needs none of the machinery in
   * lib/feedback-reveal.ts. The other three tools have a threshold or a timer
   * to hold; this one just has "did they touch anything".
   */
  const [hasInteracted, setHasInteracted] = useState(false);
  const markEngaged = useCallback((field: string) => {
    setHasInteracted(true);
    if (engagedRef.current) return;
    engagedRef.current = true;
    track('tool_engaged', { tool: 'net_worth_impact', first_field: field });
  }, []);

  const clampMonthly = useCallback((v: number) => {
    return Math.max(MONTHLY_MIN, Math.min(MONTHLY_MAX, Math.round(v / MONTHLY_STEP) * MONTHLY_STEP));
  }, []);

  const handleMonthlyInputFocus = useCallback(() => {
    markEngaged('monthly_delta');
    trackToolStart();
    setMonthlyInputStr(String(monthlyDelta));
  }, [monthlyDelta, markEngaged, trackToolStart]);

  const handleMonthlyInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setMonthlyInputStr(raw);
      const parsed = parseInt(raw, 10);
      if (!Number.isNaN(parsed)) {
        setMonthlyDelta(clampMonthly(parsed));
      }
    },
    [clampMonthly]
  );

  const handleMonthlyInputBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      const raw = e.target.value.trim();
      const parsed = parseInt(raw, 10);
      if (raw === '' || Number.isNaN(parsed)) {
        setMonthlyDelta(MONTHLY_DEFAULT);
      } else {
        setMonthlyDelta(clampMonthly(parsed));
      }
      setMonthlyInputStr(null);
    },
    [clampMonthly]
  );

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

  /**
   * Third step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
   * tool_cta_clicked -> cta_click_signup.
   *
   * This tool used to have no `tool_completed` at all, on the grounds that it
   * computes synchronously from defaults — $150/month, invested — so all three
   * horizon cards are correct and final before anyone touches anything. That
   * reasoning was right about the moment it rejected and wrong to stop there:
   * firing "a result rendered" on mount would have put the entire tool_viewed
   * population into the completed step and measured nothing.
   *
   * The defaults are staying. They are what makes the page useful to a visitor
   * who scrolled in from a search result and never interacts, and what puts a
   * real answer in the served HTML. So completion is defined as the other
   * honest moment available here: the visitor has moved at least one input off
   * its default, and the recomputed result has been on screen long enough to
   * read. That is genuinely narrower than `tool_engaged`, which fires on the
   * first touch — focusing the amount field, or nudging the slider back to
   * where it started, engages without ever producing a result that is theirs.
   *
   * The settle delay does real work rather than being a throttle. Typing "300"
   * into the amount field passes through 0 and 30 on its way, and every one of
   * those intermediate states differs from the default; without the delay the
   * event would fire on the first keystroke and report an amount nobody chose.
   * Each change cancels the pending timer, so what gets counted is a result
   * that stopped moving.
   */
  const completedRef = useRef(false);
  useEffect(() => {
    if (completedRef.current) return;
    const isDefault =
      monthlyDelta === MONTHLY_DEFAULT && useCase === 'investing' && debtApr === APR_DEFAULT;
    if (isDefault) return;

    const timer = setTimeout(() => {
      completedRef.current = true;
      track('tool_completed', { tool: 'net_worth_impact', run_index: nextRunIndex('net_worth_impact') });
      trackLeapShown({ tool: 'net_worth_impact', leapType: 'monthly_saving', leapValueUsd: monthlyDelta });
    }, RESULT_SETTLE_MS);
    return () => clearTimeout(timer);
  }, [monthlyDelta, useCase, debtApr]);

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
                  markEngaged('monthly_delta');
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
                value={monthlyInputStr !== null ? monthlyInputStr : String(monthlyDelta)}
                onFocus={handleMonthlyInputFocus}
                onChange={handleMonthlyInputChange}
                onBlur={handleMonthlyInputBlur}
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
                  onClick={() => {
                    markEngaged('use_case');
                    setUseCase(uc);
                  }}
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
                    markEngaged('debt_apr');
                    trackToolStart();
                    setDebtApr(Number(e.target.value));
                  }}
                  className="flex-1 max-w-xs h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-[#3F6B42]"
                />
                <span className="text-sm font-medium tabular-nums w-10">{formatPercent(debtApr, 2)}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Output: 3 NumberCards */}
      <div>
        {/* h2, not h3: this is the calculator's answer, and it is the first
            heading after the page H1. As an h3 it left the served document with
            an h3 before any h2 — a structural gap for anything reading the page
            by its outline. Styling is unchanged. */}
        {/* "Net worth impact" was the pre-rename route name leaking into a
            heading on /what-is-saving-monthly-worth. Headings are read as page
            vocabulary, so this one now describes its section. */}
        <h2 className="text-lg font-semibold text-[#111827] mb-4">What this is worth over time</h2>
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

      {/* This tool had no call to action at all — the only route onward was the
          dialog behind a "yes" on the feedback question, which most people
          never answer. The CTA now sits directly under the answer, the way it
          does on rent and offer, and carries the monthly amount forward so the
          number they just chose becomes the plan. */}
      {monthlyDelta !== 0 && (
        <AppCta
          tool="net_worth_impact"
            /* The button used to read "Get my first Leap" while the Leap was
               already on screen above it — promising the thing the reader
               already had. It carries the computed number instead, so it reads
               as a continuation of what they just worked out rather than an
               offer of it. */
          buttonLabel={`Show me where my ${formatCurrencySigned(monthlyDelta)}/mo should go \u2192`}
          prefill={{
            monthly_delta: Math.round(monthlyDelta),
            use_case: useCase,
            debt_apr: useCase === 'debt' ? debtApr : undefined,
          }}
          eyebrow="Make it real"
          headline={
            monthlyDelta > 0
              ? `Turn that ${formatCurrencySigned(monthlyDelta)}/month into a plan`
              : 'See what that change does to the rest of your plan'
          }
          body="A number on a slider is a hypothetical. The same amount, set up once and tracked every month, is a Leap."
          bullets={[
            'This amount set up as a real, tracked monthly move',
            'A savings, debt and retirement plan it fits inside',
            'A weekly nudge when it slips, not a yearly reckoning',
          ]}
          image={{
            // Was the 401(k) match Leap, which has nothing to do with "what does
            // one monthly change do". The net-worth tile with its what-if
            // scenarios is the same question this tool asks.
            src: '/images/product/net-worth-projection.jpg',
            alt: 'WeLeap net worth today, the monthly increase, the 40-year projection and what-if scenarios',
            width: 1400,
            height: 529,
          }}
        />
      )}

      {/* Tool Feedback Questionnaire — Yes / Maybe opens the signup dialog */}
      {/* The prompt waits for one interaction — a slider move or a change of
          use-of-funds.

          This tool is the extreme case for asking too early: it renders a full
          result from its defaults, so a prompt tied to "a result exists" would
          be on screen before the visitor had contributed anything. The question
          asks whether this would change what they save, which only means
          something once the number on screen is theirs. */}
      {hasInteracted && (
      <ToolFeedbackQuestionnaire
        page={NET_WORTH_IMPACT_PAGE}
              tool="net_worth_impact"
        eventName="networth_tool_feedback_submitted"
        // This was the only tool left on the component's generic defaults
        // ("Was this helpful?" / Yes / Not sure / No), which asks about the
        // page rather than the result. This tool projects what a monthly
        // amount becomes, so the honest test is whether it changes what the
        // person actually saves — the same yes/not_sure/no axis every other
        // tool uses, so the responses still pool.
        question="Would this change what you save each month?"
        buttonLabels={{
          yes: "Yes — I'd save more",
          not_sure: 'Maybe',
          no: 'No change',
        }}
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
      )}

      {/* Assumptions footer */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
        <p className="font-medium text-[#111827] mb-1">Assumptions</p>
        <ul className="list-disc list-inside space-y-0.5 text-gray-600">
          <li>Investing assumes a 7% real (inflation-adjusted) return — an assumption, not a guarantee.</li>
          <li>Cash uses 0% real — no growth, just deposits.</li>
          <li>Debt uses APR avoided (simplified estimate, not a payoff schedule).</li>
        </ul>
        <p className="mt-2 text-xs text-gray-500">Estimates only. Not financial advice.</p>
      </div>

      {/* Join Waitlist modal (same as site-wide) — opened when user taps Yes or Not sure */}
      <EarlyAccessDialog
        signupType="net_worth_tool_feedback"
        placement="tool"
        open={showWaitlistModal}
        onOpenChange={setShowWaitlistModal}
      />
    </div>
  );
}
