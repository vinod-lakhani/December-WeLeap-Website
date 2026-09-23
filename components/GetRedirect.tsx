'use client';

/**
 * Client handler for the /get smart link (the trackable launch link + the
 * desktop QR target). Behaviour splits by device:
 *
 *   Mobile (iOS/Android):
 *     1. detect the device,
 *     2. fire `store_link_clicked` (PostHog + GA4 + Vercel via track()) with the
 *        utm_source / utm_campaign so we get per-channel click counts,
 *     3. redirect to the right store, appending store-native attribution so the
 *        INSTALL is attributed too:
 *          • Android → Play `referrer` (delivered via Install Referrer, shows in
 *            Play Console acquisition reports)
 *          • iOS → App Store `ct` campaign token (shows in App Store Connect App
 *            Analytics)
 *
 *   Desktop/unknown:
 *     There's no store to send a desktop to. Rather than bounce to the homepage
 *     (which just flashed and lost the intent), we stay on /get and render a
 *     purpose-built "Get the mobile app" card: a QR to scan with a phone, plus a
 *     secondary "Or open WeLeap on the web →" link for people who'd rather use
 *     the web app right now. Same `store_link_clicked` fires (device: desktop).
 *
 * SSR renders the same card, so no-JS users get the QR + badges + web link; on
 * mobile the effect then redirects away from it. Manual store links stay as a
 * fallback if the redirect is slow.
 */
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { track } from '@/lib/analytics';

import { StoreBadges } from './StoreBadges';

const APP_STORE = 'https://apps.apple.com/app/id6801673529';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=ai.weleap.app';
const WEB_APP = 'https://weleap.app';

/** App Store `ct` / Play referrer values must be tidy: alphanumerics, _ and -, ≤40 chars. */
function sanitizeToken(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
}

export function GetRedirect() {
  // null until the client detects the device (also the SSR value).
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop' | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source') || '';
    const campaign = params.get('utm_campaign') || '';
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
    const isAndroid = /Android/i.test(ua);
    const dev = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    setDevice(dev);

    const store = isIOS ? 'app_store' : isAndroid ? 'google_play' : 'none';
    // Fire the click event on every device (desktop included, so desktop /get
    // hits still count). Awaits gtag; failures are swallowed.
    track('store_link_clicked', { store, source, campaign, device: dev }, true).catch(() => {});

    // Desktop stays on the page and shows the card — nothing to redirect to.
    if (!isIOS && !isAndroid) return;

    let target: string;
    if (isIOS) {
      const ct = sanitizeToken([campaign, source].filter(Boolean).join('_')) || 'launch';
      target = `${APP_STORE}?ct=${encodeURIComponent(ct)}&mt=8`;
    } else {
      const ref = new URLSearchParams();
      if (source) ref.set('utm_source', source);
      if (campaign) ref.set('utm_campaign', campaign);
      ref.set('utm_medium', 'smartlink');
      target = `${PLAY_STORE}&referrer=${encodeURIComponent(ref.toString())}`;
    }
    window.location.replace(target);
  }, []);

  // Badges are the useful fallback on mobile (no-JS, or if the redirect stalls).
  // On desktop the QR is the primary path, so once we've confirmed desktop we
  // drop the badges (they'd dead-end on a computer).
  const showBadges = device !== 'desktop';

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Get the mobile app</h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-subtle">
          Scan the code with your phone’s camera to download WeLeap.
        </p>
      </div>

      <div className="rounded-2xl border border-hairline bg-white p-4 shadow-sm">
        <Image
          src="/badges/qr-get-app.png"
          alt="Scan to download the WeLeap app"
          width={200}
          height={200}
          className="h-44 w-44"
          unoptimized
          priority
        />
      </div>

      {showBadges && <StoreBadges placement="get_page" className="justify-center" />}

      <a
        href={WEB_APP}
        className="text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800"
      >
        Or open WeLeap on the web →
      </a>
    </main>
  );
}
