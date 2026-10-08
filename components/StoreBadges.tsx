'use client';

/**
 * Native-app download badges (App Store + Google Play).
 *
 * Mirrors AppCta's analytics: each tap fires `store_badge_clicked` with the
 * store and a `placement`, so we can see which surface drives installs.
 *
 * Assets are the OFFICIAL badges: public/badges/app-store.svg (Apple "Download
 * on the App Store", US/UK black) and public/badges/google-play.svg (Google
 * "Get it on Google Play", English color). Keep to Apple/Google brand
 * guidelines (min size, clear space) if resizing.
 *
 * Pass `comingSoon` for a store to render its badge disabled (for deploying the
 * badges before a store is live); omit it once the store publishes.
 */
import Image from 'next/image';

import { track } from '@/lib/analytics';
import { APP_STORE_URL, PLAY_STORE_URL, STORE_AVAILABLE } from '@/lib/stores';

export interface StoreBadgesProps {
  /** Where the badges are shown, e.g. 'hero' | 'footer'. Sent with the event. */
  placement?: string;
  /** Render a store's badge disabled ("Coming soon"). Defaults to whatever is
      not live in lib/stores.ts, so callers never need to pass this. */
  comingSoon?: { appStore?: boolean; googlePlay?: boolean };
  className?: string;
  /** Attributed links (from lib/stores appStoreUrl/playStoreUrl). Defaults to
      the bare listing URLs, so only /get needs to pass them. */
  hrefs?: { appStore?: string; googlePlay?: string };
  /**
   * Extra work on a badge tap, on top of the badge's own event.
   *
   * /get passes its store-tap handler so a desktop badge fires the same Lead
   * and store_link_clicked a phone's button does. Without it the two surfaces
   * would report the same action under different events, and a desktop install
   * would be missing from the funnel the phone one appears in.
   */
  onStoreClick?: (store: 'app_store' | 'google_play', href: string) => void;
}

export function StoreBadges({
  placement = 'hero',
  comingSoon = { appStore: !STORE_AVAILABLE.appStore, googlePlay: !STORE_AVAILABLE.googlePlay },
  className = '',
  hrefs,
  onStoreClick,
}: StoreBadgesProps) {
  const go = (store: 'app_store' | 'google_play', href: string) => {
    track('store_badge_clicked', { store, placement });
    // Neither call blocks the navigation below; both are fire-and-forget.
    onStoreClick?.(store, href);
    window.location.href = href;
  };

  const badge = (
    store: 'app_store' | 'google_play',
    href: string,
    src: string,
    alt: string,
    disabled: boolean | undefined,
  ) => {
    const img = (
      // unoptimized: badges are static, trusted assets; next/image otherwise
      // won't render the SVG badge (SVG optimization is off by default).
      <Image src={src} alt={alt} width={142} height={42} className="h-[42px] w-auto" unoptimized />
    );
    if (disabled) {
      return (
        <span
          aria-disabled="true"
          title="Coming soon"
          className="relative inline-block cursor-default opacity-45 grayscale"
        >
          {img}
          <span className="absolute inset-x-0 -bottom-4 text-center text-[10px] font-semibold uppercase tracking-wider text-faint">
            Coming soon
          </span>
        </span>
      );
    }
    return (
      <button
        type="button"
        onClick={() => go(store, href)}
        aria-label={alt}
        className="transition hover:-translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-700"
      >
        {img}
      </button>
    );
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {badge('app_store', hrefs?.appStore ?? APP_STORE_URL, '/badges/app-store.svg', 'Download WeLeap on the App Store', comingSoon?.appStore)}
      {badge('google_play', hrefs?.googlePlay ?? PLAY_STORE_URL, '/badges/google-play.svg', 'Get WeLeap on Google Play', comingSoon?.googlePlay)}
    </div>
  );
}
