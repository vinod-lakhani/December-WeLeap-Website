"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { captureUtmIfPresent, captureEntrySourceIfPresent } from "@/lib/utm-storage"

/**
 * Records campaign attribution whenever the query string changes.
 *
 * Two different things, deliberately kept apart: UTM params go to
 * sessionStorage and travel onward to the app via appLink(), while `src`
 * becomes a PostHog super property so the rest of the visit is segmentable by
 * how it started. See lib/utm-storage.ts for why they are not merged, and why
 * one is last touch while the other stays first touch.
 *
 * Keyed on the search params rather than running once on mount. This lives in
 * the root layout, which does NOT remount across client-side navigation — so a
 * mount-only effect missed the case that matters most here: a shared claim
 * page sends the reader to the tool with `?src=share` via a Next <Link>, which
 * changes the URL without remounting anything. The parameter arrived and
 * nothing read it.
 *
 * Re-running on every navigation is safe, but for a different reason in each
 * case, and the difference matters. `captureEntrySourceIfPresent` is
 * idempotent: `register_once` means the first origin wins forever. UTM capture
 * is deliberately NOT idempotent any more — it records last touch, because the
 * old first-touch behaviour meant the first tagged visit in a tab was the only
 * one that ever reached the app. What keeps it safe is that an untagged URL is
 * ignored outright, so in-site navigation cannot wipe what arrival captured.
 * First touch is still kept, under its own key. See lib/utm-storage.ts.
 */
export function UtmCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    captureUtmIfPresent()
    captureEntrySourceIfPresent()
  }, [searchParams])

  return null
}
