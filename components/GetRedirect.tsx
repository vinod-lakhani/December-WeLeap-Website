'use client';

/**
 * Client handler for the /get smart link (the trackable launch link + the
 * desktop QR target). Behaviour splits by device:
 *
 *   iOS:
 *     1. detect the device,
 *     2. fire `store_link_clicked` (PostHog + GA4 + Vercel via track()) with the
 *        utm_source / utm_campaign so we get per-channel click counts,
 *     3. redirect to the App Store with the `ct` campaign token so the INSTALL
 *        is attributed too (shows in App Store Connect App Analytics).
 *
 *   Android:
 *     Same, redirecting to Google Play with an Install Referrer `referrer` —
 *     BUT only once Play is live (STORE_AVAILABLE.googlePlay). While the Play
 *     listing is still in review, a redirect would land on a 404, so instead we
 *     stay on the page and show a "coming soon" card that points at the web
 *     app. The click is still tracked (store: google_play_coming_soon) so we
 *     can see Android demand during the gap.
 *
 *   Desktop/unknown:
 *     There's no store to send a desktop to. Rather than bounce to the homepage
 *     (which just flashed and lost the intent), we stay on /get and render a
 *     purpose-built "Get the mobile app" card: a QR to scan with a phone, plus a
 *     secondary "Or open WeLeap on the web →" link for people who'd rather use
 *     the web app right now. Same `store_link_clicked` fires (device: desktop).
 *
 * SSR renders the generic card, so no-JS users get the QR + badges + web link;
 * on iOS the effect then redirects away from it. Manual store links stay as a
 * fallback if the redirect is slow.
 */
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { track } from '@/lib/analytics';
import { APP_STORE_URL, PLAY_STORE_URL, STORE_AVAILABLE, WEB_APP_URL } from '@/lib/stores';

import { StoreBadges } from './StoreBadges';

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

    const playLive = STORE_AVAILABLE.googlePlay;
    const store = isIOS ? 'app_store' : isAndroid ? (playLive ? 'google_play' : 'google_play_coming_soon') : 'none';
    // Fire the click event on every device (desktop included, so desktop /get
    // hits still count). Awaits gtag; failures are swallowed.
    track('store_link_clicked', { store, source, campaign, device: dev }, true).catch(() => {});

    // Desktop stays on the page and shows the card — nothing to redirect to.
    // Android does the same while the Play listing isn't live yet.
    if (!isIOS && !(isAndroid && playLive)) return;

    let target: string;
    if (isIOS) {
      const ct = sanitizeToken([campaign, source].filter(Boolean).join('_')) || 'launch';
      target = `${APP_STORE_URL}?ct=${encodeURIComponent(ct)}&mt=8`;
    } else {
      const ref = new URLSearchParams();
      if (source) ref.set('utm_source', source);
      if (campaign) ref.set('utm_campaign', campaign);
      ref.set('utm_medium', 'smartlink');
      target = `${PLAY_STORE_URL}&referrer=${encodeURIComponent(ref.toString())}`;
    }
    window.location.replace(target);
  }, []);

  const androidWaiting = device === 'android' && !STORE_AVAILABLE.googlePlay;

  // Badges are the useful fallback on iOS (no-JS, or if the redirect stalls).
  // On desktop the QR is the primary path, so once we've confirmed desktop we
  // drop the badges (they'd dead-end on a computer). On a waiting Android
  // phone neither badge helps, so the web link is the call to action instead.
  const showBadges = device !== 'desktop' && !androidWaiting;

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          {androidWaiting ? 'WeLeap for Android is coming soon' : 'Get the mobile app'}
        </h1>
        <p className="max-w-sm text-[15px] leading-relaxed text-subtle">
          {androidWaiting
            ? 'The Android app is in Google Play review. Use WeLeap on the web for now — same account, same plan — and it will carry straight over to the app.'
            : 'Scan the code with your phone’s camera to download WeLeap.'}
        </p>
      </div>

      {!androidWaiting && (
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
      )}

      {showBadges && <StoreBadges placement="get_page" className="justify-center" />}

      <a
        href={WEB_APP_URL}
        className={
          androidWaiting
            ? 'inline-flex items-center justify-center rounded-xl bg-brand-700 px-6 py-3.5 text-[15px] font-bold text-white hover:bg-brand-800'
            : 'text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-brand-800'
        }
      >
        {androidWaiting ? 'Open WeLeap on the web' : 'Or open WeLeap on the web →'}
      </a>
    </main>
  );
}
