import { getPostHog } from "@/lib/posthog-lazy"

/**
 * Persist UTM params in sessionStorage for first-touch attribution.
 * When a user lands with UTM params and navigates elsewhere, we preserve them
 * so waitlist/lead forms can attribute signups to the original campaign.
 */

const UTM_STORAGE_KEY = "wle_utm"

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const

function getUtmFromUrl(search: string): string {
  const params = new URLSearchParams(search)
  const tracking = new URLSearchParams()
  UTM_KEYS.forEach((key) => {
    const val = params.get(key)
    if (val) tracking.set(key, val)
  })
  return tracking.toString()
}

/** Store UTM params from current URL (first touch only - does not overwrite). */
export function captureUtmIfPresent(): void {
  if (typeof window === "undefined") return
  const fromUrl = getUtmFromUrl(window.location.search)
  if (!fromUrl) return
  try {
    const existing = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (!existing) {
      sessionStorage.setItem(UTM_STORAGE_KEY, fromUrl)
    }
  } catch {
    // sessionStorage not available (private mode, etc.)
  }
}

/** Get stored UTM params, or from current URL. Returns query string (no leading ?). */
export function getUtmParams(): string {
  if (typeof window === "undefined") return ""
  try {
    const stored = sessionStorage.getItem(UTM_STORAGE_KEY)
    if (stored) return stored
  } catch {
    // ignore
  }
  return getUtmFromUrl(window.location.search)
}

/**
 * Record how someone entered the site, as a first-touch super property.
 *
 * `src` is not a UTM and deliberately does not join UTM_KEYS. A tool CTA
 * already sends `src=<tool slug>` to the app to attribute a signup, so putting
 * `src` in the stored UTM string would make one parameter mean two different
 * things depending on which direction it was travelling.
 *
 * This is the answer to a narrower question: did this person arrive from a
 * shared link? Registered as a PostHog super property rather than added to
 * each event, so every event the visitor goes on to fire — tool_viewed,
 * tool_completed, tool_cta_clicked, cta_click_signup — carries it without any
 * of those call sites changing. That is what makes the share funnel
 * answerable: before this, a visitor arriving from a share was
 * indistinguishable from an organic one the moment they left the landing page.
 *
 * `register_once`, not `register`: first touch wins. Someone who arrives from
 * a share and returns organically a week later should still be attributed to
 * the share that found them.
 */
export function captureEntrySourceIfPresent(): void {
  if (typeof window === "undefined") return
  const src = new URLSearchParams(window.location.search).get("src")
  if (!src) return
  // Bounded and character-restricted: this ends up on every subsequent event,
  // so it must not become a channel for arbitrary text from a crafted URL.
  if (!/^[a-z0-9_]{1,32}$/.test(src)) return
  try {
    getPostHog().register_once({ entry_src: src })
  } catch {
    // PostHog unavailable — attribution is lost, the site is not.
  }
}
