/**
 * The offer in the ad, worked out.
 *
 * The Yik Yak creative opens "Your offer says $62k. it's worth ~$78.5k. most
 * people never find the other $16.5k." A visitor arrives holding that promise,
 * and the page has about two seconds to look like the thing that made it.
 *
 * It is shown as an EXAMPLE, not as a default. Defaulting equity would reach
 * the same headline by telling every visitor their own offer contains $6,580 of
 * stock — and that number does not stay on the page. It feeds buildOfferClaim,
 * so a $40,000 offer would generate a shareable "my offer is worth 32% more
 * than they quoted" built on equity that audience mostly does not have. A 10%
 * bonus and a 6% match are near-universal; equity is not. So the tool's own
 * number stays a measurement of what the visitor typed, and the ad's number
 * appears beside it, labelled as somebody else's offer.
 *
 * Every figure below is computed by the same function that prices a real offer.
 * Nothing here is typed out by hand, so the example cannot drift away from what
 * the calculator would actually say — and example.test.ts fails if the total
 * stops matching the creative, which is the signal that the ad needs changing.
 */

import { computeOfferValue, MARKET_PTO_DAYS, type OfferInputs } from './calculate'

/** The offer the creative describes. */
export const EXAMPLE_OFFER: OfferInputs = {
  salary: 62_000,
  bonusPct: 10,
  matchRatePct: 100,
  matchUpToPct: 6,
  hsaMonthly: 0,
  healthcarePremium: 0,
  rsuAnnual: 6_580,
  signingBonus: 0,
  showEspp: false,
  esppContrib: 10,
  esppDiscount: 15,
  ptoDays: MARKET_PTO_DAYS,
  rentMonthly: 0,
  savingsPct: 20,
}

/**
 * Priced with no tax result, which changes nothing here: the package total is
 * pre-tax, so it does not depend on the API answering.
 */
const priced = computeOfferValue(EXAMPLE_OFFER, null)!

export const EXAMPLE = {
  salary: EXAMPLE_OFFER.salary,
  bonusPct: EXAMPLE_OFFER.bonusPct,
  matchUpToPct: EXAMPLE_OFFER.matchUpToPct,
  equity: EXAMPLE_OFFER.rsuAnnual,
  /** What the tool would report for it. */
  total: priced.totalPackage,
  /** What the creative calls "the other $16.5k". */
  found: priced.totalPackage - EXAMPLE_OFFER.salary,
} as const
