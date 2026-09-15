import { describe, expect, it } from 'vitest'

import { computeOfferValue } from './calculate'
import { EXAMPLE, EXAMPLE_OFFER } from './example'

/**
 * This file guards a claim that is running in paid media.
 *
 * The creative says "$62k … worth ~$78.5k … the other $16.5k". If the pricing
 * logic moves — a changed IRS cap, a different default, a fix to the match —
 * the example on the page moves with it, silently, and the ad starts promising
 * a number the calculator no longer produces. These tests fail instead, which
 * is the signal to change the ad.
 */
describe('the worked example behind the ad', () => {
  it('still lands on the ~$78.5k the creative promises', () => {
    expect(EXAMPLE.total).toBe(78_500)
  })

  it('still finds the ~$16.5k the creative promises', () => {
    // "most people never find the other $16.5k"
    expect(EXAMPLE.found).toBe(16_500)
  })

  it('is the sum of its own parts, with nothing unexplained', () => {
    const { salary, bonusPct, matchRatePct, matchUpToPct, rsuAnnual } = EXAMPLE_OFFER
    const bonus = salary * (bonusPct / 100)
    const match = salary * (matchUpToPct / 100) * (matchRatePct / 100)

    // If this drifts, the page is showing a breakdown that does not add up —
    // worse than a wrong total, because the reader can check it.
    expect(salary + bonus + match + rsuAnnual).toBe(EXAMPLE.total)
  })

  it('is priced by the same function that prices a real offer', () => {
    // Not a hand-typed constant: change the engine and this follows.
    expect(computeOfferValue(EXAMPLE_OFFER, null)!.totalPackage).toBe(EXAMPLE.total)
  })

  it('describes an offer a reader could actually have', () => {
    // A default nobody would query, and an equity figure that is plausible
    // rather than reverse-engineered into absurdity.
    expect(EXAMPLE_OFFER.bonusPct).toBeLessThanOrEqual(15)
    expect(EXAMPLE_OFFER.matchUpToPct).toBeLessThanOrEqual(6)
    expect(EXAMPLE_OFFER.rsuAnnual / EXAMPLE_OFFER.salary).toBeLessThan(0.2)
  })
})
