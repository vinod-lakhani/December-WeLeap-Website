"use client"

import { useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { captureUtmIfPresent, captureEntrySourceIfPresent } from "@/lib/utm-storage"

/**
 * Records first-touch attribution whenever the query string changes.
 *
 * Two different things, deliberately kept apart: UTM params go to
 * sessionStorage and travel onward to the app via appLink(), while `src`
 * becomes a PostHog super property so the rest of the visit is segmentable by
 * how it started. See lib/utm-storage.ts for why they are not merged.
 *
 * Keyed on the search params rather than running once on mount. This lives in
 * the root layout, which does NOT remount across client-side navigation — so a
 * mount-only effect missed the case that matters most here: a shared claim
 * page sends the reader to the tool with `?src=share` via a Next <Link>, which
 * changes the URL without remounting anything. The parameter arrived and
 * nothing read it.
 *
 * Both calls are idempotent — sessionStorage is first-touch and PostHog gets
 * `register_once` — so re-running on every navigation cannot overwrite an
 * earlier, truer origin.
 */
export function UtmCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    captureUtmIfPresent()
    captureEntrySourceIfPresent()
  }, [searchParams])

  return null
}
