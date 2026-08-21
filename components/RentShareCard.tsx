'use client';

/**
 * Rent Share Card — downloadable card for sharing safe rent range.
 */

import { useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { formatCurrency, formatCurrencyRange } from '@/lib/rounding';
import { track } from '@/lib/analytics';

/**
 * Two URLs, because the card has two audiences and they want opposite things.
 *
 * PRINTED_URL is what a human reads off a screenshot, so it has to be short
 * enough to retype from memory. `/rent` redirects to
 * /how-much-rent-can-i-afford (see next.config.mjs).
 *
 * CANONICAL_URL is what goes into `navigator.share`, where nobody types it and
 * a machine follows it. The short form cost two redirects there — apex 307s to
 * www, then /rent 307s to the real path — which loses referrer data on some
 * clients and passes nothing on to the destination. The full canonical URL
 * lands in one hop.
 */
const PRINTED_URL = 'weleap.ai/rent'
const CANONICAL_URL = 'https://www.weleap.ai/how-much-rent-can-i-afford'

interface RentShareCardProps {
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  upfrontCashLow?: number;
  upfrontCashHigh?: number;
  netWorthProtection: number;
  trigger: React.ReactNode;
  /**
   * The /s/rent/... URL for this result. Built in ResultsCards, which is where
   * the market comparison lives.
   *
   * This is what makes the share worth anything. A PNG is a dead end — no
   * platform accepts an image from a web page, so the sharer downloads a file
   * and uploads it by hand, and whoever sees it has no route back. A link with
   * an OG image is rendered as a card by X, LinkedIn, Facebook, Slack and
   * iMessage, and it is clickable.
   */
  shareUrl: string;
  /** The claim the link asserts, used as the share text. */
  shareText: string;
}

export function RentShareCard({
  shareUrl,
  shareText,
  rentRange,
  rentRangeLow,
  rentRangeHigh,
  upfrontCashLow,
  upfrontCashHigh,
  netWorthProtection,
  trigger,
}: RentShareCardProps) {
  const [open, setOpen] = useState(false);
  /** Desktop has no share sheet, so the link is copied and the button says so. */
  const [copied, setCopied] = useState(false);
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
      /**
       * The link is the payload; the image is a companion for the apps that
       * cannot render one.
       *
       * `url` points at /s/rent/<claim>, which carries its own OG image — so
       * anywhere that renders a link preview draws the card itself, with no
       * download step, and the recipient can click through to the calculator.
       * That is the whole difference: an image is a dead end, a link is a
       * doorway.
       *
       * The file still rides along because Instagram and TikTok accept no link
       * preview at all, and on mobile the OS share sheet lets someone pick
       * either. Where the sheet is unavailable — desktop, mostly — the fallback
       * below now copies the link rather than downloading a PNG nobody asked
       * for.
       */
      const shareData: ShareData = {
        title: 'My rent reality check',
        text: shareText,
        url: shareUrl,
        files: [file],
      };
      if (typeof navigator !== 'undefined' && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        track('rent_share_card_shared', { page: '/how-much-rent-can-i-afford', method: 'native' });
        setOpen(false);
      } else if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        track('rent_share_card_shared', { page: '/how-much-rent-can-i-afford', method: 'copy_link' });
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
              <p className="text-sm font-bold text-[#3F6B42]">{PRINTED_URL}</p>
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
              {copied ? 'Link copied ✓' : 'Share'}
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
