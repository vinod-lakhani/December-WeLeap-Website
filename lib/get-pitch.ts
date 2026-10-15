/**
 * What /get says, and the screen it shows, matched to where the person came
 * from.
 *
 * Measured 9-14 Oct: of 104 iOS visitors who did not tap the store button, 45%
 * were gone inside ten seconds and only 9 clicked anything at all. The ones who
 * stayed read an abstract promise — "ranks what matters and hands you the next
 * move" — with nothing under it, and left. The page asked for an install on
 * trust alone.
 *
 * So each pitch carries a real product screen. Not decoration: the screenshots
 * are the evidence for the sentence above them, and every one of them names a
 * dollar amount, which the copy cannot do before it knows anything about the
 * person.
 *
 * Matching is on keywords in the ad's own slugs rather than a table of ad ids,
 * because ad ids churn every time a creative is duplicated and a stale table
 * fails silently — it just serves the default forever. A keyword rule degrades
 * the same way on purpose: unknown traffic gets DEFAULT_PITCH, which is true
 * for everybody.
 */
import type { StoreUtm } from '@/lib/stores'

export type GetProof = {
  src: string
  alt: string
  /** Intrinsic size, so next/image reserves the box and nothing shifts. */
  width: number
  height: number
}

export type GetPitch = {
  headline: string
  sub: string
  proof: GetProof
}

/**
 * Headlines wrap at roughly 17 characters per line at 30px on a 350px column.
 * Three lines still clear the fold in an in-app browser (~560px of viewport);
 * four push the store button under it, which is the one thing this page cannot
 * afford. See the length guard in get-pitch.test.ts.
 */
export const MAX_HEADLINE = 34

const WEEKLY_FOCUS: GetProof = {
  src: '/images/product/weekly-focus.jpg',
  alt: "WeLeap's weekly focus card: capture your full 401(k) match by moving your deferral to 6% of gross pay, worth $750 a month.",
  width: 1400,
  height: 529,
}

const DEBT_PAYOFF: GetProof = {
  src: '/images/product/debt-payoff-leap.jpg',
  alt: "WeLeap's weekly focus card: put $150 a month toward $8,500 of high-APR debt and clear it 19.8 years sooner, saving $11,219 of interest.",
  width: 1400,
  height: 529,
}

const SAVINGS_PATH: GetProof = {
  src: '/images/product/savings-path.jpg',
  alt: "WeLeap's savings path card: an emergency fund 22 months away, $5,000 saved of a $27,772 target.",
  width: 1400,
  height: 529,
}

/**
 * The fallback, and what the great majority of traffic sees. The sub-head is
 * deliberately a description of the card underneath it rather than a claim
 * about the product, so the two corroborate each other instead of the page
 * asserting something twice.
 */
export const DEFAULT_PITCH: GetPitch = {
  headline: 'The one money move to make next.',
  sub: 'Every week WeLeap names one move, with the dollar amount, ready to approve.',
  proof: WEEKLY_FOCUS,
}

const DEBT_PITCH: GetPitch = {
  headline: 'Your debt has a faster exit.',
  sub: 'WeLeap sets the payoff order and shows what it saves you in interest.',
  proof: DEBT_PAYOFF,
}

const SAVINGS_PITCH: GetPitch = {
  headline: 'Know when your fund is full.',
  sub: 'WeLeap sets the target, tracks the gap and names the move each week.',
  proof: SAVINGS_PATH,
}

const MATCH_PITCH: GetPitch = {
  headline: 'The free money you’re missing.',
  sub: 'WeLeap finds your unclaimed employer match and what to change to get it.',
  proof: WEEKLY_FOCUS,
}

/**
 * First match wins, so order is precedence. Debt leads because a payoff ad is
 * the most specific promise of the four and the worst one to answer with a
 * generic page.
 */
const THEMES: ReadonlyArray<{ match: RegExp; pitch: GetPitch }> = [
  { match: /debt|payoff|apr|card/, pitch: DEBT_PITCH },
  { match: /emergency|saving|savings|cushion/, pitch: SAVINGS_PITCH },
  { match: /401|match|retire/, pitch: MATCH_PITCH },
]

/**
 * The pitch for a visit.
 *
 * Reads utm_content first and utm_campaign second — content is the creative,
 * which is what the person actually saw, while campaign is the bucket it was
 * bought in. Both are searched because naming conventions differ per campaign
 * and a rule that only read one would miss half of them.
 */
export function pitchFor(utm: StoreUtm | undefined): GetPitch {
  const haystack = `${utm?.utm_content ?? ''} ${utm?.utm_campaign ?? ''}`.toLowerCase()
  if (!haystack.trim()) return DEFAULT_PITCH

  for (const theme of THEMES) {
    if (theme.match.test(haystack)) return theme.pitch
  }
  return DEFAULT_PITCH
}

/** Every pitch, for tests that assert across all of them. */
export const ALL_PITCHES: ReadonlyArray<GetPitch> = [
  DEFAULT_PITCH,
  DEBT_PITCH,
  SAVINGS_PITCH,
  MATCH_PITCH,
]
