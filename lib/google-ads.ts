/**
 * Google Ads conversion tracking.
 *
 * Four conversion actions exist in account AW-18514097818, created 19 Oct.
 * This file is the only place that knows which weleap.ai event fires which
 * one, because the two sets of names do not match: the actions were named for
 * what they mean to a bidder, the events for what happens on the page.
 *
 * All four are configured in the Ads account as one conversion per click, a
 * 30-day click window, last-click attribution, no enhanced conversions. The
 * "one per click" part matters here: `tool_cta_clicked` can fire more than
 * once a visit — a tool with a CTA above and below the result — and Google
 * collapses those itself. Nothing on this side needs to dedupe, which is why
 * there is no session claim around the conversion the way there is around
 * `tool_completed` itself.
 *
 * Each action carries a $1 placeholder value because the Ads UI would not
 * accept "no value". Harmless under Maximize clicks or Maximize conversions;
 * it would need revisiting before any value-based bidding strategy.
 */

/** The Ads account, not a secret — it ships in the page either way. */
export const GOOGLE_ADS_ID = 'AW-18514097818'

/**
 * `send_to` label per weleap.ai event.
 *
 * Keyed on the event this site actually fires, NOT on the conversion action's
 * name in the Ads UI. `get_store_tap` there is `store_link_clicked` here —
 * same tap on the same button, named before these labels existed, and renaming
 * the event would orphan the saved PostHog insights that read it.
 *
 * The fourth action, `web_signup` (AW-18514097818/DsIjCJHFuqIdEJrtmvxE), is
 * deliberately absent. A completed sign-up fires `user_signed_up` on
 * weleap.app, a different domain and a different repo; there is no event on
 * weleap.ai that means a person signed up. The nearest candidates are both
 * clicks — `tool_cta_clicked` is already wired, and `cta_click_signup` means
 * the sign-up was STARTED. Wiring either would report sign-ups that may never
 * have happened, and double-count the click that is already a conversion.
 * That label stays unused until weleap.app fires it.
 */
export const ADS_CONVERSIONS: Record<string, string> = {
  tool_completed: `${GOOGLE_ADS_ID}/M2r6CIvFuqIdEJrtmvxE`,
  tool_cta_clicked: `${GOOGLE_ADS_ID}/_fHLCI7FuqIdEJrtmvxE`,
  store_link_clicked: `${GOOGLE_ADS_ID}/JJh4CJTFuqIdEJrtmvxE`,
}

/** The label for the action no weleap.ai event can honestly fire. See above. */
export const UNWIRED_WEB_SIGNUP_LABEL = `${GOOGLE_ADS_ID}/DsIjCJHFuqIdEJrtmvxE`

/** Hosts a real conversion can come from. */
const PRODUCTION_HOSTS = new Set(['weleap.ai', 'www.weleap.ai'])

/**
 * Whether conversions may fire.
 *
 * Gated on the host rather than on an env var, which is the pattern the Meta
 * Pixel uses. The difference is the failure mode: an unset env var in Vercel
 * is silent and looks exactly like a working install until somebody checks
 * the Ads account weeks later, whereas a host check cannot be left
 * half-configured. The cost is that conversions do not fire from preview
 * deployments or localhost — which is the behaviour you want, because a
 * conversion from a dev session is a lie told to a bidding algorithm.
 */
export function adsConversionsEnabled(): boolean {
  if (typeof window === 'undefined') return false
  // Optional chaining because this must not be the thing that throws. It runs
  // inside track(), ahead of the PostHog and GA4 sends, so an exception here
  // would cost the events it sits in front of — a worse outcome than a missing
  // conversion.
  const host = window.location?.hostname
  return typeof host === 'string' && PRODUCTION_HOSTS.has(host)
}

/**
 * Report one conversion, if this event is one.
 *
 * Fire-and-forget by design. Two of the three events immediately navigate
 * away — a store tap on /get, a CTA click to weleap.app — and nothing may
 * delay that: an in-app browser hands off to the store app only on a genuine
 * anchor activation, so a deferred navigation is a lost install. gtag sends
 * these over sendBeacon where the browser has it, which is what survives the
 * unload; that is the same exposure the Meta `Lead` on the same tap already
 * carries.
 */
export function fireAdsConversion(eventName: string): void {
  try {
    if (!adsConversionsEnabled()) return
    const sendTo = ADS_CONVERSIONS[eventName]
    if (!sendTo) return
    if (typeof window.gtag !== 'function') return

    window.gtag('event', 'conversion', { send_to: sendTo })
  } catch {
    /* Never let a measurement call break the page, or the events after it. */
  }
}
