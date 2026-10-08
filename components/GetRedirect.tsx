'use client';

/**
 * /get — a landing page on every device. It used to redirect.
 *
 * WHY IT STOPPED REDIRECTING. Campaign 2 sent 45 US visitors here on 6-7 Oct.
 * On phones the page redirected to the store on load, and Apple counted 2
 * product page views from 13 redirects — the other 11 never arrived. A
 * script-driven navigation out of Meta's in-app browser lands on Apple's web
 * PREVIEW of the listing rather than the App Store app, so the campaign token
 * is lost and most people swipe back.
 *
 * A real anchor is what makes Instagram and Facebook hand off to the App Store
 * app. So: no auto-redirect, no timer, no interstitial. One <a href> with the
 * store URL already in it, and the href is resolved on the SERVER from the
 * request's User-Agent and query string, because an href that only appears
 * after hydration is a script navigation for anybody who taps immediately.
 *
 * It also moves the events. `Lead` and `store_link_clicked` used to fire on
 * load, which meant Meta was optimising for "tapped the ad" rather than
 * "intended to install" — the two are very different populations and only one
 * of them is worth paying for. Both now fire on the tap.
 *
 * Desktop is unchanged: a QR to scan, the store badges, and a link to the web
 * app. There is no store to send a computer to.
 */
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { track } from '@/lib/analytics';
import {
  STORE_AVAILABLE,
  WEB_APP_URL,
  appStoreCampaignToken,
  appStoreUrl,
  cleanUtm,
  playStoreUrl,
  type StoreUtm,
} from '@/lib/stores';
import { appLink } from '@/lib/app-link';
import { fbq } from '@/lib/meta-pixel';
import { getUtmParams, parseUtm } from '@/lib/utm-storage';

import { StoreBadges } from './StoreBadges';

export type GetDevice = 'ios' | 'android' | 'desktop';

function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const hasAnyUtm = (u: StoreUtm) => Object.values(u).some(Boolean);

export interface GetRedirectProps {
  /** Device from the request User-Agent, so the button is right in the HTML. */
  initialDevice: GetDevice;
  /** UTMs from the request URL. The client adds the sessionStorage fallback. */
  initialUtm: StoreUtm;
}

export function GetRedirect({ initialDevice, initialUtm }: GetRedirectProps) {
  const device = initialDevice;

  /**
   * URL first, then the per-tab store.
   *
   * Every paid click arrives tagged, so the server render is already correct
   * for the traffic this page exists to serve. The fallback matters for a
   * same-tab return with no query string — somebody who came through /bio,
   * read a tool, and then came back here.
   */
  const [utm, setUtm] = useState<StoreUtm>(initialUtm);
  useEffect(() => {
    if (hasAnyUtm(initialUtm)) return;
    const stored = cleanUtm(parseUtm(getUtmParams()));
    if (hasAnyUtm(stored)) setUtm(stored);
  }, [initialUtm]);

  /** The web-app link, with attribution. Client-only: appLink reads storage. */
  const [webHref, setWebHref] = useState(WEB_APP_URL);
  useEffect(() => {
    setWebHref(appLink(''));
  }, []);

  const playLive = STORE_AVAILABLE.googlePlay;
  const hrefs = { appStore: appStoreUrl(utm), googlePlay: playStoreUrl(utm) };
  const androidWaiting = device === 'android' && !playLive;
  const isPhone = device === 'ios' || device === 'android';

  const storeHref = device === 'ios' ? hrefs.appStore : playLive ? hrefs.googlePlay : '';
  const storeName: 'app_store' | 'google_play' | 'google_play_coming_soon' | 'none' =
    device === 'ios'
      ? 'app_store'
      : device === 'android'
        ? playLive
          ? 'google_play'
          : 'google_play_coming_soon'
        : 'none';

  /**
   * One tap, two events, one id.
   *
   * Neither call blocks the navigation. The anchor's default action is what
   * opens the store app, and holding it back to be sure a beacon landed would
   * be paying for our own friction — the same mistake the old redirect made in
   * the other direction.
   */
  const onStoreTap = (store: typeof storeName, href: string) => {
    const eventId = newEventId();

    /**
     * content_name carries campaign_content so Meta can tell the ad sets
     * apart. The dataset is in Meta's "Financial service" category, which runs
     * restricted: custom parameters may be stripped client-side. The eventID
     * survives regardless, which is what a Conversions API copy dedupes on,
     * and the per-UTM detail is on PostHog's event below either way.
     */
    fbq('track', 'Lead', { content_name: appStoreCampaignToken(utm) }, { eventID: eventId });

    // Property names unchanged from the load-time version on purpose — saved
    // insights read them. `trigger` and `platform` are added, not swapped in.
    track('store_link_clicked', {
      store,
      source: utm.utm_source ?? '',
      campaign: utm.utm_campaign ?? '',
      device,
      platform: device,
      medium: utm.utm_medium ?? '',
      content: utm.utm_content ?? '',
      term: utm.utm_term ?? '',
      store_url: href,
      event_id: eventId,
      trigger: 'tap',
    }).catch(() => {});
  };

  /* ── Phones: one screen, one button ──────────────────────────────────── */
  if (isPhone && !androidWaiting) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col px-5 pb-10 pt-5">
        <Image
          src="/images/weleap-logo.png"
          alt="WeLeap"
          width={2972}
          height={845}
          sizes="104px"
          priority
          className="h-[30px] w-auto self-start"
        />

        <h1 className="mt-7 text-[30px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink">
          The one money move to make next.
        </h1>

        <p className="mt-4 text-[16.5px] leading-relaxed text-subtle">Connect your accounts.</p>
        <p className="mt-1.5 text-[16.5px] leading-relaxed text-subtle">
          WeLeap ranks what matters and hands you the next move, ready to approve.
        </p>

        {/* A real anchor with a real href. This is the whole point: an in-app
            browser hands off to the store app on a genuine link activation and
            does not when script navigates. */}
        <a
          href={storeHref}
          onClick={() => onStoreTap(storeName, storeHref)}
          className="mt-8 block w-full rounded-xl bg-[#386641] px-6 py-4 text-center text-[17px] font-bold text-white shadow-card active:bg-[#2d5235]"
        >
          {device === 'ios' ? 'Get the app' : 'Get it on Google Play'}
        </a>
        <p className="mt-2.5 text-center text-[13.5px] text-faint">Free to start.</p>
      </main>
    );
  }

  /* ── Desktop, and Android while Play is not live ─────────────────────── */
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

      {!androidWaiting && (
        <StoreBadges
          placement="get_page"
          className="justify-center"
          hrefs={hrefs}
          onStoreClick={onStoreTap}
        />
      )}

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
