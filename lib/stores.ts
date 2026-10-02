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
