'use client';

/**
 * Rent Share Card — downloadable card for sharing safe rent range.
 */

import { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { formatCurrency, formatCurrencyRange } from '@/lib/rounding';
import { track } from '@/lib/analytics';

interface RentShareCardProps {
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  upfrontCashLow?: number;
  upfrontCashHigh?: number;
  netWorthProtection: number;
  trigger: React.ReactNode;
}

export function RentShareCard({
  rentRange,
  rentRangeLow,
  rentRangeHigh,
  upfrontCashLow,
  upfrontCashHigh,
  netWorthProtection,
  trigger,
}: RentShareCardProps) {
  const [open, setOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const upfrontRange =
    upfrontCashLow != null && upfrontCashHigh != null
      ? formatCurrencyRange(upfrontCashLow, upfrontCashHigh)
      : null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weleap-rent-range.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
      track('rent_share_card_downloaded', { page: '/how-much-rent-can-i-afford' });
      setOpen(false);
    } catch (err) {
      console.error('Failed to download card:', err);
    }
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>{trigger}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          className="z-[100] w-auto rounded-lg border border-[#E5E7EB] bg-white p-0 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          sideOffset={8}
          align="start"
        >
          <div ref={cardRef} className="min-w-[320px] max-w-[400px] p-6">
            {/* Card content — matches Builder spec */}
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
              Safe Rent Range
            </p>
            <p className="text-2xl font-bold text-[#111827] mb-4">{rentRange}</p>

            {upfrontRange && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                  Upfront cash needed
                </p>
                <p className="text-lg font-semibold text-[#111827] mb-4">{upfrontRange}</p>
              </>
            )}

            {netWorthProtection > 0 && (
              <p className="text-sm text-[#111827]/90 mb-4">
                Choosing within this range protects ~{formatCurrency(netWorthProtection)} of future
                net worth.
              </p>
            )}

            <p className="text-xs text-[#9CA3AF] mb-6">WeLeap — From clutter to clarity.</p>
          </div>

          {/* Download button */}
          <div className="border-t border-[#E5E7EB] px-4 py-3">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full rounded-md bg-[#3F6B42] px-4 py-2 text-sm font-medium text-white hover:bg-[#3F6B42]/90"
            >
              Download PNG
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
