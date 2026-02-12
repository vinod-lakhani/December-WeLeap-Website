'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Leap } from '@/lib/allocator/leapModel';
import { track } from '@/lib/analytics';
import { formatPct } from '@/lib/format';

interface NextLeapsListProps {
  leaps: Leap[];
  nextLeapId: string | null;
  hasUnlockData: boolean;
  onLeapClick?: (leapId: string, action: string) => void;
  /** When user clicks "Unlock details", scroll to stepper (e.g. go to step 0) */
  onUnlockDetailsClick?: () => void;
}

function formatDelta(leap: Leap): string | null {
  if (leap.deltaValue == null) return null;
  if (leap.category === 'match' && leap.deltaValue > 0) return `Gap: +${formatPct(leap.deltaValue)}`;
  if (leap.category === 'emergency_fund' && leap.targetValue != null) return `Gap: $${Math.round(leap.targetValue).toLocaleString()}`;
  if (leap.category === 'debt' && leap.currentValue != null) return `Balance: $${Math.round(leap.currentValue).toLocaleString()}`;
  return null;
}

export function NextLeapsList({ leaps, nextLeapId, hasUnlockData, onLeapClick, onUnlockDetailsClick }: NextLeapsListProps) {
  return (
    <div className="space-y-3">
      <p className="text-gray-600 text-sm">
        Ranked capital allocation plan. First item is your <strong>Next</strong> move.
      </p>
      {leaps.map((leap) => {
        const isNext = leap.status === 'next';
        const deltaLine = formatDelta(leap);
        return (
          <Card
            key={leap.id}
            className={cn(
              'border-[#D1D5DB] bg-white',
              isNext && 'ring-2 ring-[#3F6B42]/30',
              leap.category === 'brokerage' && 'opacity-90 border-gray-200'
            )}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full text-xs font-semibold px-2 py-0.5 shrink-0',
                        leap.status === 'next' && 'bg-[#3F6B42] text-white',
                        leap.status === 'queued' && 'bg-gray-200 text-gray-700',
                        leap.status === 'complete' && 'bg-green-100 text-green-800',
                        leap.status === 'locked' && 'bg-amber-100 text-amber-800'
                      )}
                    >
                      {leap.status === 'next' ? 'Next' : leap.status === 'queued' ? 'Queued' : leap.status === 'complete' ? 'Complete' : 'Locked'}
                    </span>
                    <span className="font-medium text-[#111827]">{leap.title}</span>
                  </div>
                  {leap.subtitle && (
                    <p className="text-sm text-gray-600 mt-1">{leap.subtitle}</p>
                  )}
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-gray-500">
                    {deltaLine && <span>{deltaLine}</span>}
                    {leap.timelineText && <span>Timeline: {leap.timelineText}</span>}
                    {leap.impactText && <span>Impact: {leap.impactText}</span>}
                  </div>
                  {leap.whyNowText && leap.status !== 'complete' && leap.category !== 'match' && (
                    <p className="text-xs text-[#3F6B42] mt-1">{leap.whyNowText}</p>
                  )}
                </div>
                {leap.cta?.action === 'unlock' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      track('leap_stack_item_clicked', { leapId: leap.id, action: 'unlock' });
                      onLeapClick?.(leap.id, 'unlock');
                      onUnlockDetailsClick?.();
                    }}
                  >
                    {leap.cta.label}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
