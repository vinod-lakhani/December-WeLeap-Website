import type { Metadata } from 'next'
import { headers } from 'next/headers'

import { GetRedirect } from '@/components/GetRedirect'
import { cleanUtm, type StoreUtm } from '@/lib/stores'

// Redirect landing for the /get smart link — not a content page, keep it out of search.
export const metadata: Metadata = {
  title: 'Get the WeLeap app',
  robots: { index: false, follow: false },
}

/**
 * Device from the request's own User-Agent.
 *
 * Done on the server so the store button ships in the HTML with its href
 * already correct. The spec asks for "a plain <a href> with the store URL
 * already resolved at render time", and the reason is specific: Instagram's
 * and Facebook's in-app browsers hand off to the App Store app when a real
 * anchor is tapped, and do not when navigation happens from script. A button
 * whose href appears only after hydration is a script navigation for anybody
 * who taps in the first moment.
 *
 * UA sniffing, as the spec says. It is unreliable in general and exact enough
 * for the three buckets this needs.
 */
function deviceFromUserAgent(ua: string): 'ios' | 'android' | 'desktop' {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios'
  if (/Android/i.test(ua)) return 'android'
  return 'desktop'
}

export default function GetPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const ua = headers().get('user-agent') ?? ''

  /**
   * UTMs from the URL only, here.
   *
   * sessionStorage is the documented fallback and it does not exist on the
   * server, so the client refines these on mount when the URL carried none.
   * Rendering from the URL first means a tagged visit — which every paid click
   * is — has the right `ct` in the markup without waiting for anything.
   */
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? ''
  const initialUtm: StoreUtm = cleanUtm({
    utm_source: first(searchParams?.utm_source),
    utm_medium: first(searchParams?.utm_medium),
    utm_campaign: first(searchParams?.utm_campaign),
    utm_content: first(searchParams?.utm_content),
    utm_term: first(searchParams?.utm_term),
  })

  return <GetRedirect initialDevice={deviceFromUserAgent(ua)} initialUtm={initialUtm} />
}
