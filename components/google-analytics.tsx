"use client"

/**
 * GA4.
 *
 * Deliberately not gated on the cookie banner. The banner is a notice rather
 * than a consent prompt — see components/cookie-consent.tsx — so there is no
 * answer to wait for, and gating on an acknowledgement nobody is asked to give
 * would just mean losing the analytics of everyone who ignores it.
 *
 * The trade this makes is recorded in the privacy policy's third-party list
 * rather than in a dialog.
 */

import { GoogleAnalytics } from "@next/third-parties/google"

export function ConditionalGoogleAnalytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  if (!gaId) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
