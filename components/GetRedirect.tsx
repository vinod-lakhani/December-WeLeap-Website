'use client';

/**
 * Client interstitial for the /get smart link (the trackable launch link + the
 * desktop QR target). It:
 *   1. detects the device,
 *   2. fires `store_link_clicked` (PostHog + GA4 + Vercel via track()) with the
 *      utm_source / utm_campaign so we get per-channel click counts,
 *   3. redirects to the right store, appending store-native attribution so the
 *      INSTALL is attributed too:
 *        • Android → Play `referrer` (delivered to the app via Install Referrer,
 *          shows in Play Console acquisition reports)
 *        • iOS → App Store `ct` campaign token (shows in App Store Connect App
 *          Analytics)
 *   4. desktop/unknown → home, which has the QR + badges.
 *
 * A server redirect can't run client analytics, hence the ~instant interstitial.
 * Manual links below cover no-JS / slow redirects.
 */
import { useEffect, useState } from 'react';

import { track } from '@/lib/analytics';

const APP_STORE = 'https://apps.apple.com/app/id6801673529';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=ai.weleap.app';

/** App Store `ct` / Play referrer values must be tidy: alphanumerics, _ and -, ≤40 chars. */
function sanitizeToken(s: string): string {
  return s.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
}

export function GetRedirect() {
  const [dest, setDest] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source') || '';
    const campaign = params.get('utm_campaign') || '';
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
    const isAndroid = /Android/i.test(ua);

    let target: string;
    if (isIOS) {
      const ct = sanitizeToken([campaign, source].filter(Boolean).join('_')) || 'launch';
      target = `${APP_STORE}?ct=${encodeURIComponent(ct)}&mt=8`;
    } else if (isAndroid) {
      const ref = new URLSearchParams();
      if (source) ref.set('utm_source', source);
      if (campaign) ref.set('utm_campaign', campaign);
      ref.set('utm_medium', 'smartlink');
      target = `${PLAY_STORE}&referrer=${encodeURIComponent(ref.toString())}`;
    } else {
      target = '/';
    }
    setDest(target);

    const device = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    const store = isIOS ? 'app_store' : isAndroid ? 'google_play' : 'none';

    let done = false;
    const go = () => {
      if (done) return;
      done = true;
      window.location.replace(target);
    };
    // Fire the click event (awaits gtag), then redirect. Safety timeout in case
    // an analytics call hangs so the user is never stuck on this screen.
    track('store_link_clicked', { store, source, campaign, device }, true).catch(() => {}).finally(go);
    const t = setTimeout(go, 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-lg font-semibold text-ink">Taking you to the app…</p>
      <p className="text-sm text-faint">
        Not redirected?{' '}
        <a href={dest || APP_STORE} className="font-bold text-brand-700 underline underline-offset-4">
          Continue
        </a>
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-faint">
        <a href={APP_STORE} className="font-medium text-brand-700 underline underline-offset-4">App Store</a>
        <a href={PLAY_STORE} className="font-medium text-brand-700 underline underline-offset-4">Google Play</a>
      </div>
    </main>
  );
}
