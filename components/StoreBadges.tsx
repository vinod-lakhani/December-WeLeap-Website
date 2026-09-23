'use client';

/**
 * Native-app download badges (App Store + Google Play).
 *
 * Mirrors AppCta's analytics: each tap fires `store_badge_clicked` with the
 * store and a `placement`, so we can see which surface drives installs.
 *
 * ⚠️ ASSETS: public/badges/app-store.svg and public/badges/google-play.png are
 * PLACEHOLDERS. Replace them with the OFFICIAL Apple ("Download on the App
 * Store") and Google ("Get it on Google Play") badge files before launch —
 * both have brand-guideline requirements for the artwork, min size and clear
 * space. The component/layout does not change when you swap the files.
 *
 * Pass `comingSoon` for a store to render its badge disabled (for deploying the
 * badges before a store is live); omit it once the store publishes.
 */
import Image from 'next/image';

import { track } from '@/lib/analytics';

const APP_STORE_URL = 'https://apps.apple.com/app/id6801673529';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.weleap.app';

export interface StoreBadgesProps {
  /** Where the badges are shown, e.g. 'hero' | 'footer'. Sent with the event. */
  placement?: string;
  /** Render a store's badge disabled ("Coming soon") until it publishes. */
  comingSoon?: { appStore?: boolean; googlePlay?: boolean };
  className?: string;
}

export function StoreBadges({ placement = 'hero', comingSoon, className = '' }: StoreBadgesProps) {
  const go = (store: 'app_store' | 'google_play', href: string) => {
    track('store_badge_clicked', { store, placement });
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
      {badge('app_store', APP_STORE_URL, '/badges/app-store.svg', 'Download WeLeap on the App Store', comingSoon?.appStore)}
      {badge('google_play', PLAY_STORE_URL, '/badges/google-play.png', 'Get WeLeap on Google Play', comingSoon?.googlePlay)}
    </div>
  );
}
