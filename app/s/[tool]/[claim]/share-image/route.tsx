import { shareCardImage } from '@/lib/og'
import { resolveShareClaim } from '@/lib/share/claims'

/**
 * The 4:5 image the Share and Download buttons hand over.
 *
 * A route rather than a client-side render, and this is what replaced
 * html2canvas. The previous PNG was a screenshot of the share popover — a
 * 400px-wide DOM node at scale 2 — so its width was below Instagram's 1080 and
 * its aspect ratio changed with the length of the text inside it. An export
 * format should be chosen, not inherited from a UI component's CSS.
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
  const { tool, claim: slug } = await params
  const claim = await resolveShareClaim(tool, slug)
  if (!claim) return new Response('Not found', { status: 404 })

  const image = shareCardImage({
    eyebrow: claim.eyebrow,
    headline: claim.headline,
    footnote: claim.footnote,
  })

  const headers = new Headers(image.headers)
  headers.set('Cache-Control', 'public, immutable, no-transform, max-age=31536000')
  return new Response(image.body, { status: image.status, headers })
}
