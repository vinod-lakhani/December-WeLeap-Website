import { shareCardImage } from '@/lib/og'
import { decodeRentClaim, rentClaimHeadline } from '@/lib/share/rentClaim'
import { getRegionNameBySlug } from '@/lib/zori'

/**
 * The 4:5 image the Share and Download buttons hand over.
 *
 * A route rather than a client-side render, and this replaces html2canvas.
 * The previous PNG was a screenshot of the share popover — a 400px-wide DOM
 * node at scale 2 — so its width was below Instagram's 1080 and its aspect
 * ratio changed with the length of the city name. An export format should be
 * chosen, not inherited from a UI component's CSS.
 *
 * Rendered by the same card component as the link preview, so what someone
 * posts and what a platform draws from the URL stay one design.
 *
 * Cached hard: a claim URL fully describes its own image, so the same path can
 * never produce different bytes.
 */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ tool: string; claim: string }> }
) {
  const { tool, claim: claimSlug } = await params

  if (tool !== 'rent') return new Response('Not found', { status: 404 })

  const claim = decodeRentClaim(claimSlug)
  if (!claim) return new Response('Not found', { status: 404 })

  const metro = claim.kind === 'market_gap' ? await getRegionNameBySlug(claim.metroSlug) : null

  const image = shareCardImage({
    headline: rentClaimHeadline(claim, metro),
    footnote: 'weleap.ai/rent · free rent calculator',
  })

  const headers = new Headers(image.headers)
  headers.set('Cache-Control', 'public, immutable, no-transform, max-age=31536000')
  return new Response(image.body, { status: image.status, headers })
}
