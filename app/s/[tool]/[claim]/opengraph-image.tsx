import { ogContentType, ogSize, claimOgImage, defaultOgImage } from '@/lib/og'
import { resolveShareClaim } from '@/lib/share/claims'

/**
 * The card X, LinkedIn, Facebook, Slack and iMessage draw when a shared claim
 * is posted. This is the entire reason the claim lives in the path rather than
 * the query string: `opengraph-image.tsx` receives `params`, never
 * `searchParams`.
 *
 * Not prerendered — the claim is a dynamic segment, so this renders per
 * request and the fonts have to be traced into the serverless bundle. See
 * `experimental.outputFileTracingIncludes` in next.config.mjs.
 */

export const alt = 'A reality check from WeLeap'
export const size = ogSize
export const contentType = ogContentType

export default async function Image({
  params,
}: {
  params: Promise<{ tool: string; claim: string }>
}) {
  const { tool, claim: slug } = await params
  const claim = await resolveShareClaim(tool, slug)

  // A card is drawn for a crawler that may follow a link the page itself
  // rejects, so fall back to the sitewide card rather than throwing — a broken
  // image is worse than a generic one.
  if (!claim) return defaultOgImage()

  return claimOgImage({
    eyebrow: claim.eyebrow,
    headline: claim.headline,
    footnote: claim.footnote,
  })
}
