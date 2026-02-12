'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Leap } from '@/lib/allocator/leapModel';
import type { FlowSummary, CapitalRoutingResult } from '@/lib/allocator/leapModel';
import type { PrimaryLeapResult } from '@/lib/allocator/selectPrimaryLeap';
import { track } from '@/lib/analytics';

interface SavingsStackSummaryProps {
  /** Exactly one primary (highest-leverage) move. */
  primary: PrimaryLeapResult;
  /** EF, debt, split — excluding the one that is primary. */
  supportingLeaps: Leap[];
  flowSummary: FlowSummary;
  hasUnlockData: boolean;
  hasEmployerMatch?: boolean;
  /** Dollar routing (for "See exact dollar routing" toggle). */
  routing?: CapitalRoutingResult | null;
  /** 401(k) impact at Year 30. Only for primary when kind === 'match'. */
  impact401kAtYear30?: number | null;
  /** Cost of delay if user waits 12 months. Only for primary when kind === 'match'. */
  costOfDelay12Mo?: number | null;
  /** HSA long-term impact (by retirement). Only for primary when kind === 'hsa'. */
  impactHsaAtYear30?: number | null;
  onUnlockDetailsClick?: () => void;
}

function formatCurrencyShort(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}

/** Dominant primary card: one highest-leverage move. */
function PrimaryCard({
  primary,
  impact401kAtYear30,
  costOfDelay12Mo,
  impactHsaAtYear30,
  onUnlockDetailsClick,
}: {
  primary: PrimaryLeapResult;
  impact401kAtYear30?: number | null;
  costOfDelay12Mo?: number | null;
  impactHsaAtYear30?: number | null;
  onUnlockDetailsClick?: () => void;
}) {
  const { kind, leap, retirement15 } = primary;

  if (kind === 'match' && leap) {
    return (
      <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
            Your highest-leverage move
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111827]">
            Capture free money from your employer
          </p>
          <p className="mt-1 text-[#111827]">
            Increase 401(k) from {leap.currentValue}% → {leap.targetValue}%
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Unlocks employer match — free money that compounds for decades.
          </p>
          {impact401kAtYear30 != null && impact401kAtYear30 > 0 && (
            <p className="mt-2 text-sm font-medium text-[#3F6B42]">
              Impact: +{formatCurrencyShort(impact401kAtYear30)} by retirement
            </p>
          )}
          {costOfDelay12Mo != null && costOfDelay12Mo > 0 && (
            <p className="text-xs text-gray-600 mt-0.5">
              If you wait 12 months: –{formatCurrencyShort(costOfDelay12Mo)}
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Assumes 7% real return.</p>
        </CardContent>
      </Card>
    );
  }

  if (kind === 'hsa' && leap) {
    const currentStr = leap.hsaCurrentAnnual != null ? Math.round(leap.hsaCurrentAnnual).toLocaleString() : '0';
    const maxStr = leap.hsaMaxAnnual != null ? leap.hsaMaxAnnual.toLocaleString() : '';
    return (
      <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
            Your highest-leverage move
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111827]">
            Use HSA for triple tax advantage
          </p>
          <p className="mt-1 text-[#111827]">
            Increase HSA from ${currentStr}/yr → ${maxStr}/yr
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Tax-free in, tax-free growth, tax-free out for health. Long-term investing vehicle.
          </p>
          {impactHsaAtYear30 != null && impactHsaAtYear30 > 0 && (
            <p className="mt-2 text-sm font-medium text-[#3F6B42]">
              Impact: +{formatCurrencyShort(impactHsaAtYear30)} by retirement
            </p>
          )}
          <p className="text-xs text-gray-400 mt-1">Assumes 7% real return.</p>
        </CardContent>
      </Card>
    );
  }

  if (kind === 'retirement_15' && retirement15) {
    const { currentPct, targetPct } = retirement15;
    return (
      <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
            Your highest-leverage move
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111827]">
            Boost long-term compounding
          </p>
          <p className="mt-1 text-[#111827]">
            Increase 401(k) from {currentPct}% → {targetPct}%
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Getting to 15% of pay into retirement dramatically improves your trajectory.
          </p>
          <p className="mt-2 text-sm text-[#3F6B42]">
            Impact: improves long-term compounding.
          </p>
          <p className="text-xs text-gray-400 mt-1">Assumes 7% real return.</p>
        </CardContent>
      </Card>
    );
  }

  if (kind === 'debt' && leap) {
    const aprStr = leap.debtAprPct != null ? `${leap.debtAprPct}%` : '';
    const balanceStr = leap.currentValue != null
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(leap.currentValue)
      : '';
    return (
      <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
            Your highest-leverage move
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111827]">
            Eliminate expensive debt
          </p>
          <p className="mt-1 text-[#111827]">
            Pay down ${balanceStr} at {aprStr} APR
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Paying this off is a guaranteed return equal to the APR.
          </p>
          {aprStr && (
            <p className="mt-2 text-sm font-medium text-[#3F6B42]">
              Impact: guaranteed {aprStr} return
            </p>
          )}
          {leap.impactText && (
            <p className="text-xs text-gray-600 mt-0.5">{leap.impactText}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (kind === 'growth_split' && leap) {
    const ret = leap.splitRetirementPct ?? 60;
    const bro = leap.splitBrokeragePct ?? 40;
    return (
      <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
        <CardContent className="p-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
            Your highest-leverage move
          </p>
          <p className="mt-2 text-lg font-semibold text-[#111827]">
            Invest surplus for growth
          </p>
          <p className="mt-1 text-[#111827]">
            Your split: {ret}% retirement / {bro}% brokerage
          </p>
          <p className="mt-1 text-sm text-gray-600">
            Balances tax-advantaged growth with flexibility.
          </p>
          <p className="mt-2 text-sm text-[#3F6B42]">
            Impact: improves tax-advantaged compounding.
          </p>
          {leap.cta?.action === 'unlock' && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                track('leap_stack_item_clicked', { leapId: leap.id, action: 'unlock' });
                onUnlockDetailsClick?.();
              }}
            >
              {leap.cta.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback (e.g. primary kind with missing leap)
  return (
    <Card className="border-2 border-[#3F6B42] bg-white shadow-md">
      <CardContent className="p-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#3F6B42]">
          Your highest-leverage move
        </p>
        <p className="mt-2 text-lg font-semibold text-[#111827]">
          Start with your next best move
        </p>
        <p className="mt-1 text-sm text-gray-600">
          Unlock your details above to see your personalized trajectory plan.
        </p>
      </CardContent>
    </Card>
  );
}

/** Human label for framework bucket (Protect / Eliminate / Grow). */
function frameworkLabel(category: string): string {
  if (category === 'emergency_fund') return 'Protect';
  if (category === 'debt') return 'Eliminate';
  if (category === 'retirement_split') return 'Grow';
  return '';
}

/** Compact supporting-structure card (outcome-first; no status pills). */
function SupportingCard({
  leap,
  showAllocationBadge,
  showFrameworkLabel,
  onUnlockDetailsClick,
}: {
  leap: Leap;
  showAllocationBadge: boolean;
  showFrameworkLabel: boolean;
  onUnlockDetailsClick?: () => void;
}) {
  const isInactive = leap.allocationBadge === '0% (inactive)';
  const label = frameworkLabel(leap.category);

  if (leap.category === 'emergency_fund') {
    const targetStr = leap.targetValue != null
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(leap.targetValue)
      : null;
    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-3">
          {showFrameworkLabel && label && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label} (Emergency Fund)</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {showAllocationBadge && leap.allocationBadge && (
              <span className="rounded-full text-[10px] font-semibold px-1.5 py-0.5 bg-[#3F6B42]/10 text-[#3F6B42]">
                {leap.allocationBadge}
              </span>
            )}
            <span className="font-medium text-sm text-[#111827]">Build a 3-month safety cushion</span>
          </div>
          {targetStr ? (
            <p className="text-xs text-gray-700 mt-0.5">Target: ${targetStr} (3 months of essentials)</p>
          ) : (
            <p className="text-xs text-gray-700 mt-0.5">Target: 3 months of essentials</p>
          )}
          <p className="text-[10px] text-gray-500 mt-0.5">
            Lowers the chance you need high-interest credit.
          </p>
          {leap.timelineText && (
            <p className="text-[10px] text-gray-400 mt-0.5">On pace: {leap.timelineText}</p>
          )}
          {leap.cta?.action === 'unlock' && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 h-7 text-xs"
              onClick={() => {
                track('leap_stack_item_clicked', { leapId: leap.id, action: 'unlock' });
                onUnlockDetailsClick?.();
              }}
            >
              {leap.cta.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (leap.category === 'debt') {
    if (isInactive) {
      return (
        <Card className="border border-gray-200 bg-white opacity-90">
          <CardContent className="p-3">
            {showFrameworkLabel && label && (
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label} (High-APR debt)</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5">
              {showAllocationBadge && leap.allocationBadge && (
                <span className="rounded-full text-[10px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-600">
                  {leap.allocationBadge}
                </span>
              )}
              <span className="font-medium text-sm text-[#111827]">Eliminate expensive debt</span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">None detected.</p>
          </CardContent>
        </Card>
      );
    }
    const balanceStr = leap.currentValue != null
      ? new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(leap.currentValue)
      : '';
    const aprStr = leap.debtAprPct != null ? `${leap.debtAprPct}%` : '';
    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-3">
          {showFrameworkLabel && label && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label} (High-APR debt)</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {showAllocationBadge && leap.allocationBadge && (
              <span className="rounded-full text-[10px] font-semibold px-1.5 py-0.5 bg-[#3F6B42]/10 text-[#3F6B42]">
                {leap.allocationBadge}
              </span>
            )}
            <span className="font-medium text-sm text-[#111827]">Eliminate expensive debt</span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Pay down ${balanceStr} at {aprStr} APR</p>
          {leap.impactText && (
            <p className="text-[10px] text-[#3F6B42] mt-0.5">{leap.impactText}</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (leap.category === 'retirement_split') {
    const ret = leap.splitRetirementPct ?? 60;
    const bro = leap.splitBrokeragePct ?? 40;
    return (
      <Card className="border border-gray-200 bg-white">
        <CardContent className="p-3">
          {showFrameworkLabel && label && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1">{label} (Retirement + Brokerage)</p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            {showAllocationBadge && leap.allocationBadge && (
              <span className="rounded-full text-[10px] font-semibold px-1.5 py-0.5 bg-[#3F6B42]/10 text-[#3F6B42]">
                {leap.allocationBadge}
              </span>
            )}
            <span className="font-medium text-sm text-[#111827]">Grow long-term wealth (retirement + flexibility)</span>
          </div>
          <p className="text-xs text-gray-700 mt-0.5">Your split: {ret}% retirement / {bro}% brokerage</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Improves tax-advantaged compounding.</p>
          {leap.cta?.action === 'unlock' && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-1.5 h-7 text-xs"
              onClick={() => {
                track('leap_stack_item_clicked', { leapId: leap.id, action: 'unlock' });
                onUnlockDetailsClick?.();
              }}
            >
              {leap.cta.label}
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}

function formatDollars(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

export function SavingsStackSummary({
  primary,
  supportingLeaps,
  flowSummary,
  hasUnlockData,
  hasEmployerMatch = false,
  routing = null,
  impact401kAtYear30 = null,
  costOfDelay12Mo = null,
  impactHsaAtYear30 = null,
  onUnlockDetailsClick,
}: SavingsStackSummaryProps) {
  const [showDollarRouting, setShowDollarRouting] = useState(false);
  const [showAllocationLogic, setShowAllocationLogic] = useState(false);
  const hasRouting = routing != null && routing.postTaxSavingsMonthly > 0;

  return (
    <div className="space-y-6">
      {/* One-liner: trajectory, not budgeting */}
      <p className="text-sm text-gray-600">
        Right now, one move shifts your wealth trajectory the most. Start there.
      </p>

      {/* Primary: single dominant card */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-3">
          Highest-leverage move
        </h2>
        <PrimaryCard
          primary={primary}
          impact401kAtYear30={impact401kAtYear30}
          costOfDelay12Mo={costOfDelay12Mo}
          impactHsaAtYear30={impactHsaAtYear30}
          onUnlockDetailsClick={onUnlockDetailsClick}
        />
      </div>

      {/* Capital Allocation Framework */}
      <div>
        <h2 className="text-base font-semibold text-[#111827] mb-1">
          Capital Allocation Framework
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          We route your monthly savings so you stay stable while compounding long-term.
        </p>
        {hasRouting && (
          <button
            type="button"
            onClick={() => setShowDollarRouting((v) => !v)}
            className="text-xs text-[#3F6B42] hover:underline mb-2"
          >
            {showDollarRouting ? 'Hide exact dollar routing' : 'See exact dollar routing'}
          </button>
        )}
        {showDollarRouting && hasRouting && routing && (
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 mb-2 text-xs text-gray-700 space-y-1">
            <p className="font-medium">From your {formatDollars(routing.postTaxSavingsMonthly)} monthly savings:</p>
            <p>{formatDollars(routing.efAlloc)} → EF · {formatDollars(routing.debtAlloc)} → debt · {formatDollars(routing.retirementAlloc)} → retirement · {formatDollars(routing.brokerageAlloc)} → brokerage</p>
            <button
              type="button"
              onClick={() => setShowAllocationLogic((v) => !v)}
              className="text-[#3F6B42] hover:underline mt-1"
            >
              {showAllocationLogic ? 'Hide allocation logic' : 'See allocation logic'}
            </button>
            {showAllocationLogic && (
              <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                <p>• Emergency fund: 40% of monthly savings (until 3-month target)</p>
                <p>• High-APR debt: 40% of remaining (APR ≥ 10%)</p>
                <p>• Retirement vs brokerage: split of remaining by your focus (e.g. 80/20)</p>
              </div>
            )}
          </div>
        )}
        <div className="space-y-2">
          {supportingLeaps.map((leap) => (
            <SupportingCard
              key={leap.id}
              leap={leap}
              showAllocationBadge={showAllocationLogic}
              showFrameworkLabel={true}
              onUnlockDetailsClick={onUnlockDetailsClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
