/**
 * The offer tool's shareable claim.
 *
 * Same rules as the rent claim (see rentClaim.ts): an insight rather than an
 * amount, encoded in the URL path so `opengraph-image.tsx` can reach it, and
 * nothing stored anywhere.
 *
 * This tool was already following the rule — its card has always shown a
 * percentage and never a figure — because salary is exactly the number an
 * offer post cannot contain. What it lacked was a link: the card existed only
 * as a PNG, so a share was a dead end for whoever saw it.
 */

export type OfferClaim =
  | {
      kind: 'uplift'
      /** Total package as a whole percent above the quoted base. 1–999. */
      pct: number
      /**
       * How many of the seven components the offer actually carried. Optional
       * because an offer analysed from base alone has nothing to count, and a
       * claim should not invent one.
       */
      components?: number
    }
  | {
      /**
       * For an offer whose total does not exceed the base — no equity, no
       * match, no bonus. Rare, and a real answer rather than an error, so it
       * gets a claim of its own rather than being suppressed.
       */
      kind: 'method'
    }

const METHOD_SLUG = 'seven-numbers-not-one'

/** `uplift-23` or `uplift-23-of-5`. Anchored, so no partial matches. */
const UPLIFT = /^uplift-(\d{1,3})(?:-of-([1-7]))?$/

export function encodeOfferClaim(claim: OfferClaim): string {
  if (claim.kind === 'method') return METHOD_SLUG
  return claim.components
    ? `uplift-${claim.pct}-of-${claim.components}`
    : `uplift-${claim.pct}`
}

export function decodeOfferClaim(slug: string): OfferClaim | null {
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > 60) return null
  if (slug === METHOD_SLUG) return { kind: 'method' }

  const m = UPLIFT.exec(slug)
  if (!m) return null

  const pct = Number(m[1])
  if (!Number.isInteger(pct) || pct < 1 || pct > 999) return null

  const components = m[2] ? Number(m[2]) : undefined
  return components ? { kind: 'uplift', pct, components } : { kind: 'uplift', pct }
}

/** The sentence, in one place, so card and page cannot drift. */
export function offerClaimHeadline(claim: OfferClaim): string {
  if (claim.kind === 'method') {
    return 'An offer has seven numbers. Most people only read one.'
  }
  return `My offer is worth ${claim.pct}% more than the base salary they quoted.`
}

/** The supporting line beneath it. */
export function offerClaimFootnote(claim: OfferClaim): string {
  if (claim.kind === 'method' || !claim.components) {
    return 'An offer has seven numbers. Most people only read one.'
  }
  return `An offer has seven numbers — mine had ${claim.components}.`
}

/**
 * Turn the tool's computed uplift into a claim.
 *
 * A total at or below the quoted base is not an uplift, so it falls back to the
 * method claim rather than reporting 0% — the same rule the rent tool applies
 * to a market that sits inside the affordable band.
 */
export function buildOfferClaim(input: {
  totalPackage: number
  base: number
  components?: number
}): OfferClaim {
  const { totalPackage, base, components } = input
  if (!(base > 0) || !(totalPackage > base)) return { kind: 'method' }

  const pct = Math.round(((totalPackage - base) / base) * 100)
  if (pct < 1 || pct > 999) return { kind: 'method' }

  return components && components >= 1 && components <= 7
    ? { kind: 'uplift', pct, components }
    : { kind: 'uplift', pct }
}
