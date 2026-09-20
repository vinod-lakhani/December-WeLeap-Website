import { describe, expect, it } from 'vitest'

import { STANDARD_DEDUCTION_2026_SINGLE } from './firstPaycheck/constants'
import { hasLocalTax, localTaxAnnual, localTaxRate } from './localTax'
import { getAvailableCities } from './cities'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

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


describe('the two key spaces, and the tools that use them', () => {
  const tool = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

  it('prices New York the same under both names', () => {
    /**
     * The rent tool holds 'NYC' — its own preset list. The offer tool holds
     * 'New York, NY', because its city select is populated from /api/zori.
     * One concept, two key spaces, and a lookup that silently misses is
     * indistinguishable from a city with no local tax — it would have missed
     * on the one city that has one.
     */
    expect(localTaxRate('NYC')).toBe(localTaxRate('New York, NY'))
    expect(localTaxRate('New York, NY')).toBeGreaterThan(0)
  })

  it('does not charge it in the other five metros under either name', () => {
    for (const c of ['Austin, TX', 'San Francisco, CA', 'Seattle, WA', 'Boston, MA', 'Chicago, IL']) {
      expect(localTaxRate(c), c).toBe(0)
    }
  })

  it('is applied by both tools that turn take-home into a rent line', () => {
    /**
     * The offer tool asks for a city and works a 28-35% rent band off
     * take-home — the rent tool's calculation. Without local tax the two pages
     * told the same New Yorker two different take-home figures, $190 a month
     * apart, which is the specific failure the codebase's own comments warn
     * about: two WeLeap tools cannot quote one person different tax.
     */
    expect(tool('components/OfferAnalysisTool.tsx')).toMatch(/localTaxAnnual\(city,/)
    expect(tool('components/RentTool.tsx')).toMatch(/localTaxAnnual\(city,/)
  })

  it('stops the offer tool silently taxing everybody as Californian', () => {
    /**
     * It sent `state: jobState || 'CA'`, so anyone who had not picked a state
     * was given California's schedule and shown the result as their own — and
     * the campaign hero has no state selector, so that was every visitor
     * arriving from an ad.
     */
    const offer = tool('components/OfferAnalysisTool.tsx')
    // Matched with the `state:` key so this checks the fetch body rather than
    // the comment above it explaining what it used to be.
    expect(offer).not.toMatch(/state: jobState \|\| 'CA'/)
    expect(offer).toMatch(/if \(!jobState\) \{ setTaxResult\(null\); return; \}/)
  })
})


describe('the same person, priced by both tools', () => {
  /**
   * $70,000 in New York, which is the campaign's own example and the only
   * preset city with a local income tax.
   *
   * /api/tax returned net $55,276 for NY at this salary on 18 September 2026.
   * Both tools start from that number and both must land on the same
   * take-home, because both then work a 28-35% rent band off it. Before the
   * offer tool charged local tax they were $190 a month apart — one page
   * telling a New Yorker he could carry $1,300 and another telling him $1,225.
   */
  const SALARY = 70_000
  const API_NET_NY = 55_276
  const taxable = SALARY - STANDARD_DEDUCTION_2026_SINGLE

  it('agrees on take-home under either city key', () => {
    const rentToolNet = API_NET_NY - localTaxAnnual('NYC', taxable)
    const offerToolNet = API_NET_NY - localTaxAnnual('New York, NY', taxable)
    expect(offerToolNet).toBe(rentToolNet)
    expect(Math.round(rentToolNet / 12)).toBe(4_418)
  })

  it('agrees on the rent band that comes off it', () => {
    const monthly = (API_NET_NY - localTaxAnnual('NYC', taxable)) / 12
    const r25 = (n: number) => Math.round(n / 25) * 25
    expect([r25(monthly * 0.28), r25(monthly * 0.35)]).toEqual([1_225, 1_550])
  })

  it('would have disagreed by $190 a month without this', () => {
    // The size of the bug, pinned so the fix cannot be quietly reverted.
    const gap = localTaxAnnual('NYC', taxable) / 12
    expect(Math.round(gap)).toBe(189)
  })
})
