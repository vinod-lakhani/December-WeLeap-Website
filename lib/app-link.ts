/**
 * Cross-domain attribution helper (weleap.ai -> weleap.app).
 *
 * weleap.ai and the app are different domains, so cookies do not cross and
 * PostHog would treat the same human as two anonymous people. We fix both
 * identity and UTMs by passing them through the CTA URL:
 *   - stored first-touch UTM params (see lib/utm-storage.ts)
 *   - the current PostHog distinct_id as `ph_did`, so the app can call
 *     posthog.identify(ph_did) and stitch the two domains into one person.
 *
 * The app side reads these on load, before signup. See the Phase 0 spec.
 */

import posthog from "posthog-js"
import { getUtmParams } from "@/lib/utm-storage"

/** Base URL of the WeLeap app. Env-driven so dev/prod can differ. */
export const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://weleap.app"

/**
 * Stable, SSR-safe app href (no attribution params). Use this as the static
 * `href` on anchors to avoid hydration mismatch, then override navigation with
 * `appLink()` in an onClick handler so attribution is attached at click time.
 * See navigation.tsx for the pattern.
 */
export const APP_HREF = APP_BASE_URL

/**
 * Build an app-bound URL that carries attribution forward.
 *
 * @param path        App route to link to (default the app root "").
 * @param extraParams Optional extra query params (e.g. rent tool prefill).
 * @returns Absolute URL like `https://weleap.app?utm_source=...&ph_did=...`
 */
export function appLink(path = "", extraParams?: Record<string, string>): string {
  const params = new URLSearchParams()

  // 1) Stored first-touch UTMs (query string, no leading "?").
  const utm = typeof window !== "undefined" ? getUtmParams() : ""
  if (utm) {
    new URLSearchParams(utm).forEach((value, key) => params.set(key, value))
  }

  // 2) PostHog distinct_id -> lets the app stitch identity across domains.
  if (typeof window !== "undefined") {
    try {
      const did = posthog?.get_distinct_id?.()
      if (did) params.set("ph_did", did)
    } catch {
      // PostHog not ready yet — links still work without stitching.
    }
  }

  // 3) Caller-supplied extras (e.g. salary/city prefill from the rent tool).
  if (extraParams) {
    Object.entries(extraParams).forEach(([key, value]) => {
      if (value != null && value !== "") params.set(key, String(value))
    })
  }

  const qs = params.toString()
  return qs ? `${APP_BASE_URL}${path}?${qs}` : `${APP_BASE_URL}${path}`
}
