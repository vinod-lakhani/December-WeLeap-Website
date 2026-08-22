'use client'

import Link from 'next/link'
import { track } from '@/lib/analytics'

/**
 * The button on a shared-claim page, and the event that says whether anyone
 * pressed it.
 *
 * `share_landing_viewed` counted arrivals from a shared link; nothing counted
 * what they did next, so the share funnel dead-ended at the landing page. A
 * view with no companion click measures a bounce rate you cannot see.
 *
 * Its own client component so the page stays a server component — the claim
 * has to be in the served HTML, because that is what a crawler building the
 * link preview reads.
 */
export function ShareLandingCta({
  href,
  label,
  tool,
  claimKind,
}: {
  href: string
  label: string
  tool: string
  claimKind: string
}) {
  return (
    <Link
      href={href}
      onClick={() => track('share_landing_cta_clicked', { tool, claim_kind: claimKind })}
      className="inline-flex rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800"
    >
      {label}
    </Link>
  )
}
