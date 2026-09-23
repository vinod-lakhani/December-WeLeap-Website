'use client';

/**
 * Device-aware "get the app" call to action. Downloading the native app is the
 * primary goal, but a store badge is a dead end on desktop — so:
 *   • mobile  → tappable store badges (direct to the store)
 *   • desktop → store badges + a QR code that points at /get, which redirects
 *               the scanning phone to the right store
 *
 * The QR is a client-only enhancement (rendered after mount), so SSR emits the
 * badges either way and there's no hydration mismatch.
 */
import { useEffect, useState } from 'react';
import Image from 'next/image';

import { track } from '@/lib/analytics';
import { StoreBadges } from './StoreBadges';

export function AppDownloadCta({
  placement = 'home_hero',
  eyebrow = 'Get the mobile app',
  className = '',
}: {
  placement?: string;
  eyebrow?: string;
  className?: string;
}) {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
    setIsDesktop(!mobile);
    track('app_download_cta_viewed', { placement, device: mobile ? 'mobile' : 'desktop' });
  }, [placement]);

  return (
    <div className={className}>
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">{eyebrow}</p>
      {/* Purposeful per device: on desktop a store badge is a dead-end click, so
          show only the QR (scan → /get → the right store). On mobile the badges
          ARE the install, so show only those. SSR renders badges (isDesktop
          starts false); desktop swaps to the QR on mount. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        {isDesktop ? (
          <div className="flex items-center gap-3">
            <Image
              src="/badges/qr-get-app.png"
              alt="Scan to download WeLeap on your phone"
              width={72}
              height={72}
              unoptimized
              className="rounded-lg border border-hairline"
            />
            <span className="max-w-[130px] text-[13px] leading-snug text-faint">
              Scan to download on your phone
            </span>
          </div>
        ) : (
          <StoreBadges placement={placement} />
        )}
      </div>
    </div>
  );
}
