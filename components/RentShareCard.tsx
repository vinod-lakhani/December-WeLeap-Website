'use client';

/**
 * Rent Share Card — downloadable card for sharing safe rent range.
 */

import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { track } from '@/lib/analytics';

/**
 * Two URLs, because the card has two audiences and they want opposite things.
 *
 * PRINTED_URL is what a human reads off a screenshot, so it has to be short
 * enough to retype from memory. `/rent` redirects to
 * /how-much-rent-can-i-afford (see next.config.mjs).
 *
 * The machine-followed URL is no longer built here — `shareUrl` arrives as a
 * prop pointing at /s/rent/<claim>, which is what carries the OG card. Only
 * the printed short form remains, and it is read by humans off an image.
 */
const PRINTED_URL = 'weleap.ai/rent'

interface RentShareCardProps {
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
  trigger,
}: RentShareCardProps) {
  const [open, setOpen] = useState(false);
  /** Desktop has no share sheet, so the link is copied and the button says so. */
  const [copied, setCopied] = useState(false);

  /** Host stripped, because the visible link is for recognition, not reading. */
  const displayUrl = shareUrl.replace(/^https?:\/\/(www\.)?/, '');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track('rent_share_card_shared', { page: '/how-much-rent-can-i-afford', method: 'copy_link' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard denied — the link is on screen and selectable either way.
    }
  };
  /**
   * The image is fetched, not screenshotted.
   *
   * This used to rasterise the popover with html2canvas: a 400px-wide DOM node
   * at scale 2, so the export was ~800px against Instagram's 1080 minimum, and
   * its aspect ratio moved with the length of the city name. Instagram had no
   * ratio to fit it to.
   *
   * The server renders a real 1080x1350 (4:5) card instead — the tallest a feed
   * post accepts, so it fits there exactly and letterboxes in Stories — drawn
   * by the same component as the link preview, so the two cannot drift.
   *
   * html2canvas was already a lazy import, so this does not change first-load
   * JS. What it removes is the 44KB gzipped chunk that downloaded the moment
   * someone opened the share flow, which is the worst possible time to spend
   * it. The dependency itself stays until OfferShareCard moves too.
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

  const handleDownload = async () => {
    try {
      const blob = await fetchPngBlob();
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
      const blob = await fetchPngBlob();
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
          {/* The image carries the same claim as the link.
              It used to print the rent range, the upfront cash and the
              protected-net-worth figure — three absolute amounts, under a
              button promising to share "without showing your salary". A rent
              range at ~30% of take-home divides straight back to an income, so
              the card was leaking the one number the mechanic exists to
              protect. Same sentence as the link now, from the same helper, so
              the two cannot drift. */}
          <div className="min-w-[320px] max-w-[400px] p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] mb-2">
              Rent reality check
            </p>
            <p className="text-xl font-bold leading-snug text-[#111827] mb-4">{shareText}</p>
            <p className="text-sm text-[#111827]/80 mb-1">
              Worked out on take-home pay, not gross.
            </p>

            {/* The URL has to live IN the image. A screenshot is how this
                actually travels, and without it the card is a dead end for
                anyone who sees it second-hand. */}
            <div className="mt-5 border-t border-[#E5E7EB] pt-3">
              <p className="text-sm font-bold text-[#3F6B42]">{PRINTED_URL}</p>
              <p className="text-xs text-[#9CA3AF]">Find your range free in 60 seconds</p>
            </div>
          </div>

          {/* The link, shown rather than hidden behind the button.
              This is the payload — it renders its own preview card on every
              surface that accepts a link, and it is clickable, which the image
              never is. It was previously invisible until you pressed Share and
              guessed what had happened. */}
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
