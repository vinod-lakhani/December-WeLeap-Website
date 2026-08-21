/**
 * The shareable claim, encoded into a URL path.
 *
 * Sharing a PNG is a dead end: no platform lets a web page post an image, so
 * the sharer downloads a file and uploads it by hand, and whoever sees it has
 * no way back to the tool. Sharing a *link* with an Open Graph image lets X,
 * LinkedIn, Facebook, Slack and iMessage render the card themselves, and the
 * recipient lands on the calculator.
 *
 * The claim lives in the PATH, not the query string, because Next's
 * `opengraph-image.tsx` convention receives `params` and not `searchParams` —
 * a claim in `?pct=22` cannot reach the image generator. Path segments also
 * cache properly at the CDN, which is the case that matters if a share ever
 * goes wide.
 *
 * Nothing is stored. The claim is fully described by its own URL, so there is
 * no table to migrate, no id to expire, and no way for a stale row to outlive
 * the page it describes.
 *
 * WHAT A CLAIM MAY CONTAIN, and this is the design rule rather than a
 * preference: an insight, never an amount. Salary is the taboo that stops
 * personal-finance content being shared at all. The old card showed a rent
 * range, which divides back to a salary in one step — so "share this without
 * showing your salary" was doing less work than it promised. A market gap is a
 * statement about a city; it says nothing about the person posting it.
 */

/** A rent claim, in the two shapes the tool can actually support. */
export type RentClaim =
  | {
      kind: 'market_gap'
      /** Slugified metro, e.g. "austin-tx". Resolved to a display name server-side. */
      metroSlug: string
      /** Whole percent the market sits away from the affordable range. 1–999. */
      pct: number
      direction: 'over' | 'under'
    }
  | {
      /**
       * The fallback, for the visitor who picks "Outside major metros / Not
       * sure" — and, until the data was fixed, anyone selecting DC. It carries
       * no numbers at all and still states the tool's real differentiator:
       * the band is applied to take-home, where the 30% rule is conventionally
       * quoted on gross.
       */
      kind: 'method'
    }

const METHOD_SLUG = 'take-home-not-gross'

/** `austin-tx-22-over` → metro, pct, direction. Anchored, so no partial matches. */
const MARKET_GAP = /^([a-z0-9]+(?:-[a-z0-9]+)*)-(\d{1,3})-(over|under)$/

/**
 * "Austin, TX" → "austin-tx".
 *
 * Lossy on purpose: the display name is resolved from the ZORI data at render
 * time rather than reconstructed from the slug, so this only has to be stable
 * and URL-safe, not reversible. That also validates the claim for free — a
 * metro that does not exist has no row to match and the page 404s.
 */
export function slugifyMetro(regionName: string): string {
  return regionName
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function encodeRentClaim(claim: RentClaim): string {
  if (claim.kind === 'method') return METHOD_SLUG
  return `${claim.metroSlug}-${claim.pct}-${claim.direction}`
}

/**
 * Returns null for anything malformed, so a hand-edited URL renders a 404
 * rather than a card asserting something the tool never computed.
 */
export function decodeRentClaim(slug: string): RentClaim | null {
  if (typeof slug !== 'string' || slug.length === 0 || slug.length > 120) return null
  if (slug === METHOD_SLUG) return { kind: 'method' }

  const m = MARKET_GAP.exec(slug)
  if (!m) return null

  const [, metroSlug, pctRaw, direction] = m
  const pct = Number(pctRaw)
  // A 0% gap is not a finding, and the regex already caps the magnitude at
  // three digits. Both ends are rejected rather than clamped: a claim that had
  // to be corrected to render is a claim the tool did not make.
  if (!Number.isInteger(pct) || pct < 1 || pct > 999) return null
  // `take-home-not-gross` cannot also parse as a metro, but a slug ending in
  // digits could shadow one, so keep the method slug reserved.
  if (metroSlug === METHOD_SLUG) return null

  return { kind: 'market_gap', metroSlug: metroSlug!, pct, direction: direction as 'over' | 'under' }
}

/**
 * The sentence itself, in one place, so the page, the OG card and the share
 * text cannot drift apart.
 *
 * `metro` is the resolved display name ("Austin, TX"), not the slug.
 */
export function rentClaimHeadline(claim: RentClaim, metro: string | null): string {
  if (claim.kind === 'method' || !metro) {
    return 'I worked out my rent on take-home pay, not gross.'
  }
  return claim.direction === 'over'
    ? `Rentals in ${metro} run ${claim.pct}% above what the maths says I can afford.`
    : `Rentals in ${metro} run ${claim.pct}% below what the maths says I can afford.`
}

/**
 * Turn the tool's own market comparison into a claim.
 *
 * The percentage is measured against the EDGE of the affordable band the tool
 * drew, not against its midpoint — "above what I can afford" should mean above
 * the top of the range the calculator actually recommended, otherwise the claim
 * overstates the gap for anyone reading it as the plain-English sentence it is.
 *
 * `overlap` produces the method claim rather than a 0% gap: when the market
 * sits inside the affordable band there is no gap to report, and reporting one
 * anyway would be the tool asserting something it did not find.
 */
export function buildRentClaim(input: {
  comparison: 'above' | 'overlap' | 'below' | null
  medianRent: number
  rentRangeLow: number
  rentRangeHigh: number
  regionName: string | null
}): RentClaim {
  const { comparison, medianRent, rentRangeLow, rentRangeHigh, regionName } = input

  if (!regionName || !comparison || comparison === 'overlap') return { kind: 'method' }
  if (!(medianRent > 0) || !(rentRangeLow > 0) || !(rentRangeHigh > 0)) return { kind: 'method' }

  const edge = comparison === 'above' ? rentRangeHigh : rentRangeLow
  const gap = comparison === 'above' ? medianRent - edge : edge - medianRent
  const pct = Math.round((gap / edge) * 100)

  // A gap that rounds to nothing is not worth a card, and one past 999 is
  // almost certainly bad data rather than a real market.
  if (pct < 1 || pct > 999) return { kind: 'method' }

  return {
    kind: 'market_gap',
    metroSlug: slugifyMetro(regionName),
    pct,
    direction: comparison === 'above' ? 'over' : 'under',
  }
}
