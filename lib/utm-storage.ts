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
