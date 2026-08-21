'use client'

import { useEffect, useRef } from 'react'
import { track } from '@/lib/analytics'

/**
 * Fires once when someone arrives on a shared claim.
 *
 * This is the other half of the share loop and the number the referral
 * decision rests on. `rent_share_card_shared` counts people who send a link;
 * this counts people who receive one and land. Without it a share is an act
 * with no measurable consequence, and section 7 of the pricing memo cannot be
 * settled either way.
 *
 * Its own client component so the page around it stays a server component and
 * keeps rendering the claim into the served HTML — which is what the crawlers
 * building the link preview actually read.
 */
export function ShareLandingBeacon({
  tool,
  claimKind,
  metro,
}: {
  tool: string
  claimKind: string
  metro: string | null
}) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    track('share_landing_viewed', {
      tool,
      claim_kind: claimKind,
      // The metro is in the URL the visitor already has, so this adds no
      // information about them — it is the shared city, not their location.
      ...(metro ? { metro } : {}),
    })
  }, [tool, claimKind, metro])

  return null
}
