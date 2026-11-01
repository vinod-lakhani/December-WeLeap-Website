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
 * So each pitch used to carry a real product screen — a still screenshot under
 * the button as the evidence for the sentence above it. Since 31 Oct 2026 the
 * evidence is the 30-second product tour instead (components/ProductTourVideo),
 * the same clip for every pitch: it shows the 401(k) leap, the paycheck split
 * and the debt and savings moves in one place, and it moves. What still varies
 * by ad is the promise — headline and sub-line — which is the part an ad
 * actually sets up.
 *
 * Matching is on keywords in the ad's own slugs rather than a table of ad ids,
 * because ad ids churn every time a creative is duplicated and a stale table
 * fails silently — it just serves the default forever. A keyword rule degrades
 * the same way on purpose: unknown traffic gets DEFAULT_PITCH, which is true
 * for everybody.
 */
import type { StoreUtm } from '@/lib/stores'

export type GetPitch = {
  headline: string
  sub: string
}

/**
 * Headlines wrap at roughly 17 characters per line at 30px on a 350px column.
 * Three lines still clear the fold in an in-app browser (~560px of viewport);
 * four push the store button under it, which is the one thing this page cannot
 * afford. See the length guard in get-pitch.test.ts.
 */
export const MAX_HEADLINE = 34

export const DEFAULT_PITCH: GetPitch = {
  headline: 'The one money move to make next.',
  sub: 'Every week WeLeap names one move, with the dollar amount, ready to approve.',
}

const DEBT_PITCH: GetPitch = {
  headline: 'Your debt has a faster exit.',
  sub: 'WeLeap sets the payoff order and shows what it saves you in interest.',
}

const SAVINGS_PITCH: GetPitch = {
  headline: 'Know when your fund is full.',
  sub: 'WeLeap sets the target, tracks the gap and names the move each week.',
}

const MATCH_PITCH: GetPitch = {
  headline: 'The free money you’re missing.',
  sub: 'WeLeap finds your unclaimed employer match and what to change to get it.',
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
