'use client';

/**
 * Offer Share Card — shareable card for the offer analysis.
 *
 * Deliberately shows NO absolute dollars. Salary is the one number people
 * won't post, so the card shares the *insight* (the % gap between total
 * package and the base they were quoted) rather than the amount. That keeps
 * it postable, which is the whole point.
 *
 * Mirrors RentShareCard's download/native-share behaviour.
 */

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { track } from '@/lib/analytics';

/**
 * Two URLs, and they deliberately no longer point at the same path.
 *
 * PRINTED_URL is short because people photograph the card and retype it. The
 * tool now lives at /what-is-my-job-offer-worth, which is a fine slug and an
 * impossible thing to retype off a phone screen, so the card keeps printing
 * /offer — that path is a permanent redirect to the new one (see the redirects
 * block in next.config.mjs), exactly the role /rent plays for the rent tool.
 *
 * CANONICAL_URL is what `navigator.share` hands to a machine, so it points
 * straight at the real route and skips the redirect hop.
 */
const PRINTED_URL = 'weleap.ai/offer';

interface OfferShareCardProps {
  /** Total package as a % above the quoted base, e.g. 23 for +23%. */
  upliftPct: number;
  /** How many of the 7 numbers the offer actually carries. */
  componentsCounted?: number;
  /**
   * The /s/offer/... URL for this result.
   *
   * The card was previously a PNG and nothing else, so a share was a dead end:
   * no platform accepts an image from a web page, and whoever saw the result
   * had no route back to the tool. A link renders its own preview card
   * everywhere that accepts one, and it is clickable.
   */
  shareUrl: string;
  /** The claim the link asserts, used as the share text. */
  shareText: string;
  trigger: React.ReactNode;
}

export function OfferShareCard({
  upliftPct,
  componentsCounted,
  shareUrl,
  shareText,
  trigger,
}: OfferShareCardProps) {
  const [open, setOpen] = useState(false);
  /** Desktop has no share sheet, so the link is copied and the button says so. */
  const [copied, setCopied] = useState(false);

  /** Host stripped, because the visible link is for recognition, not reading. */
  const displayUrl = shareUrl.replace(/^https?:\/\/(www\.)?/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('offer_share_card_shared', { page: '/offer', method: 'copy_link', uplift_pct: Math.round(upliftPct) });
      track('tool_shared', { tool: 'offer', method: 'copy_link' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — the link is on screen and selectable either way.
    }
  };

  /**
   * Fetched, not screenshotted. See RentShareCard: html2canvas rasterised this
   * popover, so the export was ~800px against Instagram's 1080 minimum with an
   * aspect ratio that moved with the text. The server renders a real 1080x1350
   * (4:5) card from the same component as the link preview.
   */
  const fetchPngBlob = async (): Promise<Blob | null> => {
    try {
      const res = await fetch(`${new URL(shareUrl, window.location.origin).pathname}/share-image`);
      if (!res.ok) return null;
      return await res.blob();
    } catch {
      return null;
    }
  };

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weleap-offer.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownload = async () => {
    try {
      const blob = await fetchPngBlob();
      if (!blob) return;
      downloadBlob(blob);
      track('offer_share_card_downloaded', { page: '/offer', uplift_pct: Math.round(upliftPct) });
      setOpen(false);
    } catch (err) {
      console.error('Failed to download card:', err);
    }
  };

  const handleShare = async () => {
    try {
      const blob = await fetchPngBlob();
      if (!blob) return;
      const file = new File([blob], 'weleap-offer.png', { type: 'image/png' });
      /**
       * The link is the payload; the image is a companion for the apps that
       * cannot render a preview. Instagram and TikTok take no link card at all,
       * and on mobile the OS share sheet lets someone pick either. Where the
       * sheet is unavailable — desktop, mostly — the fallback copies the link
       * rather than downloading a PNG nobody asked for.
       */
      const shareData: ShareData = {
        title: 'My offer, all 7 numbers',
        text: shareText,
        url: shareUrl,
        files: [file],
      };
      if (typeof navigator !== 'undefined' && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
        track('offer_share_card_shared', { page: '/offer', method: 'native', uplift_pct: Math.round(upliftPct) });
        track('tool_shared', { tool: 'offer', method: 'native' });
        setOpen(false);
      } else if (typeof navigator !== 'undefined' && typeof navigator.clipboard?.writeText === 'function') {
        await handleCopy();
      } else {
        downloadBlob(blob);
        track('offer_share_card_shared', { page: '/offer', method: 'download', uplift_pct: Math.round(upliftPct) });
        track('tool_shared', { tool: 'offer', method: 'download' });
        setOpen(false);
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') return; // user cancelled
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
          <div className="min-w-[320px] max-w-[400px] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
              My offer is worth
            </p>
            <p className="text-4xl font-extrabold text-[#386641] leading-none mb-1">
              +{Math.round(upliftPct)}%
            </p>
            <p className="text-sm text-[#111827] mb-4">more than the base salary they quoted me.</p>

            <p className="text-sm text-[#111827]/80">
              An offer has <strong>7 numbers</strong>
              {componentsCounted ? <> — mine had {componentsCounted}</> : null}. Most people only read one.
            </p>

            {/* URL lives in the image: a screenshot is how this actually travels. */}
            <div className="mt-5 border-t border-[#E5E7EB] pt-3">
              <p className="text-sm font-bold text-[#386641]">{PRINTED_URL}</p>
              <p className="text-xs text-[#9CA3AF]">Check yours free in 60 seconds</p>
            </div>
          </div>

          {/* The link, shown rather than hidden behind the button. */}
          <div className="border-t border-[#E5E7EB] px-4 pt-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Your link
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 truncate rounded border border-[#E5E7EB] bg-[#F9FAFB] px-2 py-1.5 text-xs text-[#374151]">
                {displayUrl}
              </code>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 rounded-md border border-[#E5E7EB] px-3 py-1.5 text-xs font-medium text-[#111827] hover:bg-[#F9FAFB]"
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="border-t border-[#E5E7EB] px-4 py-3 flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleShare}
              className="flex-1 rounded-md bg-[#386641] px-4 py-2 text-sm font-medium text-white hover:bg-[#386641]/90"
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
