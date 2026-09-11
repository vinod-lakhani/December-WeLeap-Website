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
  | {
      /**
       * Two offers where the bigger package is not the one you live better on.
       * The whole reason the comparison exists, and the only genuinely
       * surprising thing this tool ever tells anybody.
       */
      kind: 'compare_split'
      /** How much more the bigger package pays, as a percent. 1–999. */
      pkgPct: number
      /** How much less it leaves each month after rent, as a percent. 1–999. */
      monthPct: number
    }
  | {
      /** Two offers that point the same way. Less surprising, still true. */
      kind: 'compare_agree'
      pkgPct: number
      monthPct: number
    }
  | {
      /**
       * A comparison whose numbers will not survive being made into
       * percentages — one offer leaving nothing after rent, or a difference too
       * small to name. The assertion stands on its own without them.
       */
      kind: 'compare_method'
    }

const METHOD_SLUG = 'seven-numbers-not-one'
const COMPARE_METHOD_SLUG = 'bigger-package-not-better'

/** `uplift-23` or `uplift-23-of-5`. Anchored, so no partial matches. */
const UPLIFT = /^uplift-(\d{1,3})(?:-of-([1-7]))?$/
/** `split-24-13` — pays 24% more, leaves 13% less. */
const SPLIT = /^split-(\d{1,3})-(\d{1,3})$/
/** `both-24-13` — pays 24% more and leaves 13% more. */
const AGREE = /^both-(\d{1,3})-(\d{1,3})$/

const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 999

export function encodeOfferClaim(claim: OfferClaim): string {
  switch (claim.kind) {
    case 'method':
      return METHOD_SLUG
    case 'compare_method':
      return COMPARE_METHOD_SLUG
    case 'compare_split':
      return `split-${claim.pkgPct}-${claim.monthPct}`
    case 'compare_agree':
      return `both-${claim.pkgPct}-${claim.monthPct}`
    case 'uplift':
      return claim.components
        ? `uplift-${claim.pct}-of-${claim.components}`
        : `uplift-${claim.pct}`
  }
}

export function decodeOfferClaim(slug: string): OfferClaim | null {
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > 60) return null
  if (slug === METHOD_SLUG) return { kind: 'method' }
  if (slug === COMPARE_METHOD_SLUG) return { kind: 'compare_method' }

  const pair = SPLIT.exec(slug) ?? AGREE.exec(slug)
  if (pair) {
    const pkgPct = Number(pair[1])
    const monthPct = Number(pair[2])
    if (!inRange(pkgPct) || !inRange(monthPct)) return null
    return SPLIT.test(slug)
      ? { kind: 'compare_split', pkgPct, monthPct }
      : { kind: 'compare_agree', pkgPct, monthPct }
  }

  const m = UPLIFT.exec(slug)
  if (!m) return null

  const pct = Number(m[1])
  if (!inRange(pct)) return null

  const components = m[2] ? Number(m[2]) : undefined
  return components ? { kind: 'uplift', pct, components } : { kind: 'uplift', pct }
}

const SEVEN_NUMBERS = 'An offer has seven numbers. Most people only read one.'

/** The sentence, in one place, so card and page cannot drift. */
export function offerClaimHeadline(claim: OfferClaim): string {
  switch (claim.kind) {
    case 'method':
      return SEVEN_NUMBERS
    case 'compare_method':
      return 'Two offers. The bigger package was not the better one.'
    case 'compare_split':
      // The only genuinely surprising sentence this tool produces, and the
      // reason anybody would post it.
      return `One offer paid ${claim.pkgPct}% more. It left me ${claim.monthPct}% less every month.`
    case 'compare_agree':
      return `The offer paying ${claim.pkgPct}% more also left me ${claim.monthPct}% more every month.`
    case 'uplift':
      return `My offer is worth ${claim.pct}% more than the base salary they quoted.`
  }
}

/** The supporting line beneath it. */
export function offerClaimFootnote(claim: OfferClaim): string {
  switch (claim.kind) {
    case 'compare_split':
    case 'compare_agree':
    case 'compare_method':
      return 'Both offers, after tax in their own state and after rent in their own city.'
    case 'uplift':
      return claim.components
        ? `An offer has seven numbers — mine had ${claim.components}.`
        : SEVEN_NUMBERS
    case 'method':
      return SEVEN_NUMBERS
  }
}

/**
 * The paragraph under the headline on the share landing page.
 *
 * Lives here rather than in the registry because it has to say something
 * different for a comparison: the seven-numbers line explains what a single
 * offer hides, and explains nothing at all about why two of them swapped
 * places.
 */
export function offerClaimSupporting(claim: OfferClaim): string {
  switch (claim.kind) {
    case 'compare_split':
    case 'compare_agree':
    case 'compare_method':
      return 'Two offers rarely differ only in salary. Tax is set by the state you work in and rent by the city you live in, so the package that pays more is regularly not the one that leaves more.'
    default:
      return 'Base salary is most of what people think an offer is worth. Bonus, employer match, equity, HSA, healthcare and PTO are the rest — and they are where offers actually differ.'
  }
}

/**
 * Turn a finished comparison into a claim.
 *
 * Percentages, never dollars — the same rule the rest of this file follows.
 * Salary is exactly the number an offer post cannot contain, and two salaries
 * are worse than one.
 *
 * Falls back to the method claim whenever the percentages would not mean
 * anything: an offer that leaves nothing after rent has no denominator, and a
 * difference that rounds to zero is not a finding.
 */
export function buildOfferCompareClaim(input: {
  totalA: number
  totalB: number
  leftA: number
  leftB: number
}): OfferClaim {
  const { totalA, totalB, leftA, leftB } = input
  const fallback: OfferClaim = { kind: 'compare_method' }

  if (!(totalA > 0) || !(totalB > 0) || !(leftA > 0) || !(leftB > 0)) return fallback

  const bigger = totalB > totalA ? 'b' : 'a'
  const [biggerTotal, smallerTotal] = bigger === 'b' ? [totalB, totalA] : [totalA, totalB]
  const [biggerLeft, smallerLeft] = bigger === 'b' ? [leftB, leftA] : [leftA, leftB]

  const pkgPct = Math.round(((biggerTotal - smallerTotal) / smallerTotal) * 100)
  if (!inRange(pkgPct)) return fallback

  // Measured against whichever side leaves less, so the percentage always
  // reads as "more than the other one" rather than flipping sign.
  const split = biggerLeft < smallerLeft
  const [high, low] = split ? [smallerLeft, biggerLeft] : [biggerLeft, smallerLeft]
  const monthPct = Math.round(((high - low) / low) * 100)
  if (!inRange(monthPct)) return fallback

  return split
    ? { kind: 'compare_split', pkgPct, monthPct }
    : { kind: 'compare_agree', pkgPct, monthPct }
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
