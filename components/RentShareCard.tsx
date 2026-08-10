'use client';

/**
 * Rent Share Card — downloadable card for sharing safe rent range.
 */

import { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { formatCurrency, formatCurrencyRange } from '@/lib/rounding';
import { track } from '@/lib/analytics';

/**
 * Short, retypeable URL shown on the card — people photograph these, so the
 * link has to be short enough to type from memory. `/rent` redirects to
 * /how-much-rent-can-i-afford (see next.config.mjs).
 */
const SHARE_URL = 'https://weleap.ai/rent'

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

  const generatePngBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob ?? null), 'image/png');
    });
  };

  const handleDownload = async () => {
    try {
      const blob = await generatePngBlob();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'weleap-rent-range.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      track('rent_share_card_downloaded', { page: '/how-much-rent-can-i-afford' });
      setOpen(false);
    } catch (err) {
      console.error('Failed to download card:', err);
    }
  };

  const handleShare = async () => {
    try {
      const blob = await generatePngBlob();
      if (!blob) return;
      const file = new File([blob], 'weleap-rent-range.png', { type: 'image/png' });
      // `url` matters as much as the image: without it the link doesn't survive
      // the share sheet, and the recipient has no way back to the tool. The ref
      // param is what makes sharing measurable.
      const shareData: ShareData = {
        title: 'My rent range',
        text: "I worked out the rent I can actually afford on my salary — after tax, not before. Took 60 seconds:",
        url: `${SHARE_URL}?ref=rent_card`,
        files: [file],
      };
      if (typeof navigator !== 'undefined' && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        track('rent_share_card_shared', { page: '/how-much-rent-can-i-afford', method: 'native' });
        setOpen(false);
      } else {
        // Fallback: download on desktop or unsupported browsers
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'weleap-rent-range.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        track('rent_share_card_shared', { page: '/how-much-rent-can-i-afford', method: 'download' });
        setOpen(false);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // User cancelled
      console.error('Failed to share card:', err);
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
              Rent range you can afford
            </p>
            <p className="text-2xl font-bold text-[#111827] mb-4">{rentRange}</p>

            {upfrontRange && (
              <>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-1">
                  Cash you need upfront
                </p>
                <p className="text-lg font-semibold text-[#111827] mb-4">{upfrontRange}</p>
              </>
            )}

            {netWorthProtection > 0 && (
              <p className="text-sm text-[#111827]/90 mb-4">
                Choosing within this range protects ~{formatCurrency(netWorthProtection)} of future
                money.
              </p>
            )}

            {/* The URL has to live IN the image. A screenshot is how this
                actually travels, and without it the card is a dead end for
                anyone who sees it second-hand. */}
            <div className="mt-5 border-t border-[#E5E7EB] pt-3">
              <p className="text-sm font-bold text-[#3F6B42]">weleap.ai/rent</p>
              <p className="text-xs text-[#9CA3AF]">Find your range free in 60 seconds</p>
            </div>
          </div>

          {/* Share & Download buttons */}
          <div className="border-t border-[#E5E7EB] px-4 py-3 flex gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 rounded-md bg-[#3F6B42] px-4 py-2 text-sm font-medium text-white hover:bg-[#3F6B42]/90"
            >
              Share
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 rounded-md border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#111827] hover:bg-[#F9FAFB]"
            >
              Download PNG
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
