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
import { STORE_AVAILABLE, WEB_APP_URL, appStoreUrl, cleanUtm, playStoreUrl } from '@/lib/stores';
import { appLink } from '@/lib/app-link';
import { fbq } from '@/lib/meta-pixel';
import { getUtmParams, parseUtm } from '@/lib/utm-storage';

import { StoreBadges } from './StoreBadges';

function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function GetRedirect() {
  // null until the client detects the device (also the SSR value).
  const [device, setDevice] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const [hrefs, setHrefs] = useState<{ appStore: string; googlePlay: string }>({
    appStore: appStoreUrl({}),
    googlePlay: playStoreUrl({}),
  });

  /**
   * The web-app link, with attribution.
   *
   * It used to be a bare WEB_APP_URL — the one route to the app on this whole
   * site that carried nothing. No UTMs and no ph_did, so anybody who took it
   * arrived as a new anonymous person and the campaign that produced them was
   * lost at the final hop. Every other path to weleap.app goes through
   * appLink; this link was simply missed.
   *
   * It matters more now the bio page exists: utm_term says whose audience
   * produced the visit, and dropping it here loses exactly the people furthest
   * down the funnel — the ones who used a tool, reached /get, and chose the
   * web app over the store.
   *
   * Resolved in an effect for the same reason the store hrefs are: appLink
   * reads sessionStorage and the PostHog id, neither of which exists on the
   * server. It starts as the bare URL so the markup is valid before hydration
   * and the link works whether or not JavaScript ever arrives.
   */
  const [webHref, setWebHref] = useState(WEB_APP_URL);
  useEffect(() => {
    setWebHref(appLink(''));
  }, []);

  useEffect(() => {
    // Live URL merged over the per-tab store (lib/utm-storage), so a same-tab
    // reload without a query string still carries the arrival's UTMs. Nothing
    // stored and nothing on the URL → no tags at all; we never invent
    // "direct"/"none" placeholders, they would pollute the store reports.
    const utm = cleanUtm(parseUtm(getUtmParams()));
    const source = utm.utm_source ?? '';
    const campaign = utm.utm_campaign ?? '';
    const ua = navigator.userAgent || '';
    const isIOS = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && 'ontouchend' in document);
    const isAndroid = /Android/i.test(ua);
    const dev = isIOS ? 'ios' : isAndroid ? 'android' : 'desktop';
    setDevice(dev);

    const playLive = STORE_AVAILABLE.googlePlay;
    const store = isIOS ? 'app_store' : isAndroid ? (playLive ? 'google_play' : 'google_play_coming_soon') : 'none';
    const target = isIOS ? appStoreUrl(utm) : isAndroid && playLive ? playStoreUrl(utm) : '';
    setHrefs({ appStore: appStoreUrl(utm), googlePlay: playStoreUrl(utm) });

    // One id shared by the PostHog event and the Meta pixel event, so a
    // server-side (Conversions API) copy can be deduped later.
    const eventId = newEventId();

    // Fire on every device (desktop included, so desktop /get hits still
    // count). Awaits gtag; failures are swallowed. Event name and the original
    // properties are unchanged on purpose — saved insights read them.
    track(
      'store_link_clicked',
      {
        store,
        source,
        campaign,
        device: dev,
        medium: utm.utm_medium ?? '',
        content: utm.utm_content ?? '',
        // Named `term` to sit alongside source/medium/campaign/content, which
        // already drop the utm_ prefix on this event.
        term: utm.utm_term ?? '',
        store_url: target,
        event_id: eventId,
      },
      true,
    ).catch(() => {});

    // Meta: on phones this fires on load, before the redirect, so it means
    // "ad click reached the page", not a tap. The dataset is in Meta's
    // "Financial service" category, which runs in restricted (core) setup:
    // custom events are suppressed client-side ("unverified event") and
    // custom parameters plus the URL path are stripped. So this is the
    // standard `Lead` event with no parameters — the event id still goes
    // through, which is what a Conversions API copy would dedupe on. The
    // per-platform / per-UTM detail lives on PostHog's store_link_clicked.
    fbq('track', 'Lead', {}, { eventID: eventId });

    // Desktop stays on the page and shows the card — nothing to redirect to.
    // Android does the same while the Play listing isn't live yet.
    if (!target) return;
    // Redirect immediately. The pixel request is already dispatched; holding
    // the visitor to be sure it landed would be paying for our own friction.
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

      {showBadges && <StoreBadges placement="get_page" className="justify-center" hrefs={hrefs} />}

      <a
        href={webHref}
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
