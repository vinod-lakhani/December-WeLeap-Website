import { ogContentType, ogSize, claimOgImage, defaultOgImage } from '@/lib/og'
import { decodeRentClaim, rentClaimHeadline } from '@/lib/share/rentClaim'
import { getRegionNameBySlug } from '@/lib/zori'

/**
 * The card X, LinkedIn, Facebook, Slack and iMessage draw when a shared claim
 * is posted. This is the entire reason the claim lives in the path rather than
 * the query string: `opengraph-image.tsx` receives `params`, never
 * `searchParams`.
 *
 * Unlike the eight tool cards, this one is NOT prerendered — the claim is a
 * dynamic segment, so it renders per request and the fonts have to be traced
 * into the serverless bundle. See `outputFileTracingIncludes` in
 * next.config.mjs.
 */

export const alt = 'A rent reality check from WeLeap'
export const size = ogSize
export const contentType = ogContentType

export default async function Image({
  params,
}: {
  params: Promise<{ tool: string; claim: string }>
}) {
  const { tool, claim: claimSlug } = await params

  // A card is drawn for a crawler that may follow a link the page itself
  // rejects, so fall back to the sitewide card rather than throwing — a broken
  // image is worse than a generic one.
  if (tool !== 'rent') return defaultOgImage()

  const claim = decodeRentClaim(claimSlug)
  if (!claim) return defaultOgImage()

  const metro = claim.kind === 'market_gap' ? await getRegionNameBySlug(claim.metroSlug) : null

  return claimOgImage({
    headline: rentClaimHeadline(claim, metro),
    footnote: 'weleap.ai · free rent calculator',
  })
}
