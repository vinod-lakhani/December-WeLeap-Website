'use client'

import { useEffect } from 'react'

/**
 * Meta Pixel, site-wide.
 *
 * Loads like Google Analytics does today: whenever NEXT_PUBLIC_META_PIXEL_ID
 * is set, regardless of the cookie banner. Consent gating for GA, PostHog and
 * this pixel is deliberately deferred to one later change so the posture is
 * decided once, for all three.
 *
 * Inert when the env var is unset. The custom event `GetPageReached` is fired
 * from components/GetRedirect.tsx via window.fbq.
 */
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''

export function MetaPixel() {
  useEffect(() => {
    if (!PIXEL_ID || window.fbq) return
    const w = window as unknown as Record<string, unknown>
    // Standard base code, minus the <noscript> image (no-JS visitors never
    // reach the redirect anyway).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const n: any = function (...args: unknown[]) {
      if (n.callMethod) n.callMethod(...args)
      else n.queue.push(args)
    }
    n.push = n
    n.loaded = true
    n.version = '2.0'
    n.queue = []
    w.fbq = n
    if (!w._fbq) w._fbq = n
    const s = document.createElement('script')
    s.async = true
    s.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(s)
    n('init', PIXEL_ID)
    n('track', 'PageView')
  }, [])

  return null
}
