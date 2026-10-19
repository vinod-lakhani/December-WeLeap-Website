"use client"

/**
 * Loads the Google Ads tag and registers AW-18514097818 as a destination.
 *
 * Separate from ConditionalGoogleAnalytics on purpose. That component returns
 * null when NEXT_PUBLIC_GA_ID is unset, and gtag.js is what it loads — so
 * hanging the Ads tag off it would mean every conversion silently depending on
 * a GA4 environment variable in a different system. This loads gtag.js itself
 * if nothing else has, and only adds a `config` call if GA4 got there first.
 * Loading gtag.js twice is the documented multi-destination install; the second
 * request is a cache hit and the two share one dataLayer.
 *
 * Mounted site-wide rather than per page: `tool_completed` fires on ten tool
 * pages and `store_link_clicked` on /get, and a tag missing from one of them
 * is the kind of gap that looks like poor ad performance.
 *
 * Nothing renders. The host gate lives in lib/google-ads.ts — conversions do
 * not fire from previews or localhost, so neither does the tag.
 */

import { useEffect } from "react"

import { GOOGLE_ADS_ID, adsConversionsEnabled } from "@/lib/google-ads"

const SRC = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`

/**
 * Module scope, not a ref: it has to survive a remount.
 *
 * React 18 StrictMode runs effects twice in development, and this was sending
 * `config` for the Ads destination twice — two page views to the Ads account
 * for one visit. Harmless in production, where StrictMode does not
 * double-invoke, but the same would happen for real on any remount.
 */
let configured = false

export function GoogleAdsTag() {
  useEffect(() => {
    if (configured || !adsConversionsEnabled()) return
    configured = true

    const w = window as typeof window & { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    if (typeof w.gtag !== "function") {
      // The canonical shim: gtag must push `arguments` itself, not an array
      // literal — gtag.js reads the arguments object.
      const shim = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        w.dataLayer!.push(arguments)
      } as unknown as NonNullable<typeof window.gtag>
      w.gtag = shim
      shim("js", new Date())
    }

    if (!document.querySelector(`script[src="${SRC}"]`)) {
      const s = document.createElement("script")
      s.src = SRC
      s.async = true
      document.head.appendChild(s)
    }

    /**
     * Registers the Ads destination. Also sends Ads a page view, which is how
     * a conversion gets a click to attribute to — the conversion event alone
     * carries no gclid.
     */
    w.gtag!("config", GOOGLE_ADS_ID)
  }, [])

  return null
}
