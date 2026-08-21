import { decodeRentClaim, rentClaimHeadline } from './rentClaim'
import { decodeOfferClaim, offerClaimHeadline, offerClaimFootnote } from './offerClaim'
import { getRegionNameBySlug } from '@/lib/zori'

/**
 * One registry, so a share route does not know which tool it is serving.
 *
 * The page, the OG image and the 4:5 share image all need the same three
 * things — a headline, a supporting line, and where to send the reader — and
 * they used to get them from rent-specific code with the tool name hardcoded
 * in three places. Adding the offer tool would have meant three `if` ladders
 * kept in step by hand.
 *
 * Each tool keeps its own claim vocabulary, because a rent market gap and an
 * offer uplift are genuinely different assertions and flattening them into one
 * shape would lose that. What is shared is the shape of the ANSWER.
 */

export interface ResolvedClaim {
  /** The claim itself. Appears on the page, the link preview and the image. */
  headline: string
  /** The line printed along the bottom of the image. */
  footnote: string
  /** The paragraph under the headline on the landing page. */
  supporting: string
  /** Small label above the headline on the image. */
  eyebrow: string
  /** Where "work out your own" sends them. */
  toolHref: string
  /** The button on the landing page. */
  ctaLabel: string
  /** The `tool` slug for analytics, matching FREE_TOOLS. */
  toolSlug: string
  /** Which branch of the claim this is, for analytics. */
  claimKind: string
  /** Present only where the claim names a place. */
  metro?: string
}

export const SHARE_TOOLS = ['rent', 'offer'] as const

export function isShareTool(tool: string): boolean {
  return (SHARE_TOOLS as readonly string[]).includes(tool)
}

/**
 * Returns null for an unknown tool or a malformed claim, so the route 404s
 * rather than rendering something the tool never computed.
 */
export async function resolveShareClaim(
  tool: string,
  slug: string
): Promise<ResolvedClaim | null> {
  if (tool === 'rent') {
    const claim = decodeRentClaim(slug)
    if (!claim) return null

    // A market_gap claim whose metro has gone from the data falls back to the
    // method headline rather than 404ing: an old share should survive a data
    // refresh dropping a region.
    const metro = claim.kind === 'market_gap' ? await getRegionNameBySlug(claim.metroSlug) : null

    return {
      headline: rentClaimHeadline(claim, metro),
      footnote: 'weleap.ai/rent · free rent calculator',
      // Short on purpose. The headline already names the city and the gap, so
      // repeating both here padded the hero to three lines of centred text and
      // said nothing new. This states the one thing the tool does differently.
      supporting:
        'The 30% rule is quoted on gross pay. This applies it to take-home — which is why the number moves.',
      eyebrow: 'Rent reality check',
      toolHref: '/how-much-rent-can-i-afford',
      ctaLabel: 'Work out my rent range →',
      toolSlug: 'rent',
      claimKind: claim.kind,
      ...(metro ? { metro } : {}),
    }
  }

  if (tool === 'offer') {
    const claim = decodeOfferClaim(slug)
    if (!claim) return null

    return {
      headline: offerClaimHeadline(claim),
      footnote: offerClaimFootnote(claim),
      supporting:
        'Base salary is most of what people think an offer is worth. Bonus, employer match, equity, HSA, healthcare and PTO are the rest — and they are where offers actually differ.',
      eyebrow: 'Offer reality check',
      toolHref: '/what-is-my-job-offer-worth',
      ctaLabel: 'Check what my offer is worth →',
      toolSlug: 'offer',
      claimKind: claim.kind,
    }
  }

  return null
}
