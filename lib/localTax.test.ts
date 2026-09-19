import { describe, expect, it } from 'vitest'

import { STANDARD_DEDUCTION_2026_SINGLE } from './firstPaycheck/constants'
import { hasLocalTax, localTaxAnnual, localTaxRate } from './localTax'
import { getAvailableCities } from './cities'

/**
 * City income tax, checked against the published NYC schedule.
 *
 * This table is the one place on the site with no live oracle: /api/tax takes
 * a state and has no concept of a city, so nothing here can be verified the
 * way the state rates are. The brackets are therefore reproduced in the test
 * rather than only in a comment — if the rate drifts from what the schedule
 * actually charges, this is what says so.
 */
const NYC_BRACKETS: ReadonlyArray<readonly [number, number]> = [
  [12_000, 0.03078],
  [25_000, 0.03762],
  [50_000, 0.03819],
  [Number.POSITIVE_INFINITY, 0.03876],
]
const NY_STANDARD_DEDUCTION = 8_000

/** What New York City actually charges a single filer on this salary. */
function nycScheduleTax(grossAnnual: number): number {
  const income = Math.max(0, grossAnnual - NY_STANDARD_DEDUCTION)
  let owed = 0
  let floor = 0
  for (const [cap, rate] of NYC_BRACKETS) {
    if (income <= floor) break
    owed += (Math.min(income, cap) - floor) * rate
    floor = cap
  }
  return owed
}

const taxableAt = (salary: number) => Math.max(0, salary - STANDARD_DEDUCTION_2026_SINGLE)

describe('local income tax', () => {
  it('tracks the NYC schedule across the range these tools serve', () => {
    for (const salary of [55_000, 70_000, 95_000]) {
      const ours = localTaxAnnual('NYC', taxableAt(salary))
      expect(Math.abs(ours - nycScheduleTax(salary)), `NYC at $${salary}`).toBeLessThan(70)
    }
  })

  it('is worth about $190 a month on the campaign salary', () => {
    /**
     * The reason this exists. /api/tax returns a STATE figure, so every
     * take-home number here was ignoring it — on a page whose argument is that
     * other calculators use money you never receive.
     */
    const monthly = localTaxAnnual('NYC', taxableAt(70_000)) / 12
    expect(Math.round(monthly)).toBe(189)
  })

  it('charges nothing in the five metros that do not levy one', () => {
    // Zeros on purpose, not gaps. Recorded so nobody fills them in later with
    // numbers that do not exist.
    for (const city of ['Austin', 'SF Bay Area', 'Seattle', 'Boston', 'Chicago']) {
      expect(localTaxRate(city), city).toBe(0)
      expect(hasLocalTax(city), city).toBe(false)
    }
  })

  it('has an explicit entry for every city the picker offers', () => {
    /**
     * A city missing from the table is silently taxed at zero, which is right
     * for most places and wrong for the one that matters. Asked by name rather
     * than by rate, because five of the six genuinely are zero.
     */
    const undeclared = getAvailableCities().filter(
      (c) => localTaxRate(c) === 0 && !['Austin', 'SF Bay Area', 'Seattle', 'Boston', 'Chicago'].includes(c),
    )
    expect(undeclared).toEqual([])
  })

  it('charges nothing for a state with no city named', () => {
    // The "Other" path knows a state and not a city. Nothing rather than a guess.
    expect(localTaxAnnual('', taxableAt(70_000))).toBe(0)
    expect(localTaxAnnual('Other', taxableAt(70_000))).toBe(0)
    expect(localTaxAnnual('CO', taxableAt(70_000))).toBe(0)
  })

  it('never returns a negative charge', () => {
    expect(localTaxAnnual('NYC', -5_000)).toBe(0)
    expect(localTaxAnnual('NYC', 0)).toBe(0)
  })
})
