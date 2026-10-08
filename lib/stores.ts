/**
 * Single source of truth for the native app store links and which stores are
 * live. Both StoreBadges and the /get smart link read from here.
 *
 * LAUNCH SWITCH: when Google Play publishes, flip `googlePlay` to true and
 * redeploy — every badge and the /get Android path go live together.
 */
export const APP_STORE_URL = 'https://apps.apple.com/app/id6801673529';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=ai.weleap.app';
export const WEB_APP_URL = 'https://weleap.app';

export const STORE_AVAILABLE = {
  appStore: true,
  // Android v5 approved 2026-10-02 and published to Google Play.
  googlePlay: true,
} as const;

/* ------------------------------------------------------------------ *
 * Attributed store links. Pure functions so they are testable without a DOM.
 *
 * Apple only credits `ct` in App Store Connect > Analytics > Acquisition >
 * Campaigns when `pt` (the provider token) is also present. Without pt the
 * campaign token is ignored — that is NEXT_PUBLIC_APPLE_PT.
 *
 * Google Play reads the utm_* tags straight off the listing URL for its
 * acquisition reports, and also hands them to the installed app as the Install
 * Referrer. Nothing in the app reads the referrer today; the Play Console
 * report is what we rely on.
 * ------------------------------------------------------------------ */

export type StoreUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};

// Provider token from App Store Connect > Analytics > Acquisition > Campaigns
// (the campaign link Apple issued on 2026-10-02). Public by nature — it is in
// every campaign URL — so it ships as the default; the env var only overrides.
export const APPLE_PROVIDER_TOKEN = process.env.NEXT_PUBLIC_APPLE_PT || '129313076';

/** Apple's campaign-link form of the listing URL (the path Apple issues with pt/ct). */
export const APP_STORE_CAMPAIGN_URL = 'https://apps.apple.com/app/apple-store/id6801673529';

/** App Store `ct` / Play tag values must be tidy: alphanumerics, _ and -, ≤40 chars. */
export function sanitizeToken(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .slice(0, 40);
}

/** Sanitized copy with empty values dropped — no "direct"/"none" placeholders. */
export function cleanUtm(utm: StoreUtm): StoreUtm {
  const out: StoreUtm = {};
  (Object.keys(utm) as (keyof StoreUtm)[]).forEach((k) => {
    const v = sanitizeToken(utm[k] ?? '');
    if (v) out[k] = v;
  });
  return out;
}

/** `ct` = campaign_content, else campaign_source, else source, else 'launch'. */
/**
 * The house account, when no creator is named.
 *
 * Lives here rather than in lib/bio.ts because both the bio page's default and
 * the campaign token's rule below need the same word, and two copies of it
 * would drift the first time somebody renamed one.
 */
export const HOUSE_TERM = 'weleap';

/**
 * campaign_source_content_term, in that order, empty parts dropped.
 *
 * App Store Connect reports installs by `ct` and gives us nothing else — no
 * second field for the channel, the placement or the person. So everything
 * that matters is folded into the one string Apple will show:
 *
 *   lal1_meta_l3                      a Meta ad set, third creative
 *   organic_bio_instagram_app         the bio link, from Instagram
 *   organic_bio_tiktok_app_joshua     the same, from TikTok, via Joshua
 *
 * SOURCE SITS IN THE MIDDLE because campaign and content are the pair that
 * read as a unit — "which campaign, which thing in it" — and splitting them
 * with the channel keeps the eye on the part that changes most between rows.
 *
 * THE HOUSE TERM IS OMITTED. utm_term defaults to "weleap" on the bio page so
 * the field is never missing from an event, but repeating it in every token
 * would add a word to every row that says only "nobody in particular". A named
 * creator still appears. This is also what makes a plain bio tap read as
 * organic_bio_instagram_app rather than organic_bio_instagram_app_weleap.
 *
 * Mind the 40-character cap in sanitizeToken: the tail is what gets cut, and
 * the tail is the person. Current longest real token is 29.
 */
export function appStoreCampaignToken(utm: StoreUtm): string {
  const u = cleanUtm(utm);
  const person = u.utm_term && u.utm_term !== HOUSE_TERM ? u.utm_term : '';
  const parts = u.utm_campaign
    ? [u.utm_campaign, u.utm_source, u.utm_content, person]
    : [u.utm_source, person];
  return sanitizeToken(parts.filter(Boolean).join('_')) || 'launch';
}

export function appStoreUrl(utm: StoreUtm, pt: string = APPLE_PROVIDER_TOKEN): string {
  const q = new URLSearchParams();
  if (pt) q.set('pt', pt);
  q.set('ct', appStoreCampaignToken(utm));
  q.set('mt', '8');
  return `${APP_STORE_CAMPAIGN_URL}?${q.toString()}`;
}

export function playStoreUrl(utm: StoreUtm): string {
  const u = cleanUtm(utm);
  const tags = new URLSearchParams();
  (['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const).forEach((k) => {
    if (u[k]) tags.set(k, u[k]!);
  });
  if (!tags.has('utm_medium')) tags.set('utm_medium', 'smartlink');
  const tagStr = tags.toString();
  // Tags on the URL feed Play Console; the same string as `referrer` reaches
  // the app's Install Referrer API for whenever something reads it.
  return `${PLAY_STORE_URL}&${tagStr}&referrer=${encodeURIComponent(tagStr)}`;
}
