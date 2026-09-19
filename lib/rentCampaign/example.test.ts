import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import {
  calculateRentRange,
  calculateUpfrontCash,
  listingSiteRentMonthly,
  marketRentVerdict,
} from '@/lib/rent'
import { estimateTaxAnnual } from '@/lib/allocator/takeHome'
import { getStateCodeForCity } from '@/lib/cities'
import { getHUDRentRange } from '@/lib/hudRents'
import { localTaxAnnual } from '@/lib/localTax'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import { stateRate } from '@/lib/firstPaycheck/calculation'
import { EXAMPLE_MOVE, RENT_EXAMPLE, RENT_EXAMPLE_SETTLED } from './example'

/**
 * These pin the figures the ad is allowed to quote.
 *
 * A visitor who arrives on a promise and reads a different number has been
 * told the tool is unreliable before it has said anything else. When one of
 * these fails the creative is what changes.
 */
describe('the rent campaign example', () => {
  it('quotes the listing-site rule the ad argues with', () => {
    // Frame 2. 30% of GROSS, which is what every listing site and landlord
    // calculator uses, and the same $1,750 in every city because the rule
    // ignores tax entirely.
    expect(Math.round(RENT_EXAMPLE.listingSite)).toBe(1_750)
  })

  it('lands the band the ad quotes, once the page has settled', () => {
    // Frame 3. The SETTLED figures, because those are what anybody reading the
    // page will see — the API answers long before a visitor has finished the
    // headline.
    expect(RENT_EXAMPLE_SETTLED.rentLow).toBe(1_225)
    expect(RENT_EXAMPLE_SETTLED.rentHigh).toBe(1_550)
  })

  it('lands the upfront figure the ad quotes', () => {
    // Frame 4, and the same either way, which is why the ad can state it flatly.
    expect(RENT_EXAMPLE_SETTLED.upfrontLow).toBe(3_800)
    expect(RENT_EXAMPLE.upfrontLow).toBe(RENT_EXAMPLE_SETTLED.upfrontLow)
  })

  it('counts the gap the stack names', () => {
    /**
     * The line that was missing from the ad's original arithmetic: two weeks
     * of living costs with no salary behind them, on top of a deposit and a
     * first month paid the same day. Without it the total came out at $3,400
     * for a move that costs $4,000.
     */
    const rent = calculateRentRange(RENT_EXAMPLE_SETTLED.takeHomeMonthly, 0)
    const u = calculateUpfrontCash(rent, RENT_EXAMPLE_SETTLED.takeHomeMonthly)
    expect(Math.round(u.gapLiving)).toBe(722)
    expect(u.depositLow + u.firstMonthLow + u.gapLiving + u.movingSetup).toBeGreaterThan(3_700)
  })

  it('beats the listing site at the TOP of the band, not just the bottom', () => {
    /**
     * The ad's premise has to survive a reader who anchors on the top of the
     * range. New York clears it by $150 a month; Austin, the version this
     * replaced, cleared it by $50 because Texas charges no income tax.
     */
    expect(RENT_EXAMPLE_SETTLED.rentHigh).toBeLessThan(RENT_EXAMPLE.listingSite)
    expect(RENT_EXAMPLE.listingSite - RENT_EXAMPLE_SETTLED.rentHigh).toBeGreaterThanOrEqual(200)
  })

  it('is computed, not typed out', () => {
    expect(listingSiteRentMonthly(EXAMPLE_MOVE.salary)).toBe(RENT_EXAMPLE.listingSite)
    const fresh = calculateRentRange(RENT_EXAMPLE.takeHomeMonthly, 0)
    expect(fresh.low).toBe(RENT_EXAMPLE.rentLow)
    expect(fresh.high).toBe(RENT_EXAMPLE.rentHigh)
  })

  describe('the first paint and the settled answer', () => {
    it('now agree, so the ad quotes one set of numbers', () => {
      /**
       * They did not. The hero paints from the local state table and swaps in
       * /api/tax when it answers, and for New York the first paint put the top
       * of the band at $1,625 against the API's $1,600 — a visible step on the
       * one number the creative quotes.
       *
       * The cause was not what it first looked like. The base was right: gross
       * less deferrals less the standard deduction reproduces the API to the
       * cent in every flat-tax state. It was the RATE. New York was carrying
       * 4%, a figure measured as a share of gross, charged on taxable income
       * — and thirty-one of fifty-one states had the same problem, the worst
       * by $1,908 a year. See the calibration note on STATE_RATES.
       */
      expect(RENT_EXAMPLE.rentLow).toBe(RENT_EXAMPLE_SETTLED.rentLow)
      expect(RENT_EXAMPLE.rentHigh).toBe(RENT_EXAMPLE_SETTLED.rentHigh)
      expect(RENT_EXAMPLE.upfrontLow).toBe(RENT_EXAMPLE_SETTLED.upfrontLow)
    })

    it('keeps New York close enough to the API that nothing visibly moves', () => {
      // $25 is one rounding step in calculateRentRange, so anything under it
      // cannot change what the page prints.
      const delta = Math.abs(RENT_EXAMPLE.takeHomeMonthly - RENT_EXAMPLE_SETTLED.takeHomeMonthly)
      expect(delta).toBeLessThan(25)
      expect(stateRate('NY')).toBe(0.0522)
    })
  })
})

describe('campaign mode on the rent tool', () => {
  const tool = readFileSync(join(process.cwd(), 'components/RentTool.tsx'), 'utf8')
  const hero = readFileSync(join(process.cwd(), 'components/RentCampaignHero.tsx'), 'utf8')

  it('never puts a comma into the salary it shares with the form', () => {
    /**
     * The hero renders the salary at 24px as the centrepiece of the first
     * screen, where "70000" reads as a number somebody forgot to finish — but
     * that state is shared with the form below, which is a number field whose
     * every consumer reads it with parseFloat. parseFloat('70,000') is 70, so
     * formatting the shared value would quietly reprice the tool at a
     * seventy-dollar salary. Grouping goes on the way out, stripped on the way in.
     */
    expect(tool).toMatch(/setSalary\(raw\.replace\(\/\[\^0-9\]\/g, ''\)\)/)
    expect(hero).toMatch(/const display = salary > 0 \? salary\.toLocaleString\('en-US'\) : salaryInput/)
    expect(hero).toMatch(/onSalaryChange\(e\.target\.value\.replace\(\/\[\^0-9\]\/g, ''\)\)/)
  })

  it('only pre-fills the example for campaign traffic', () => {
    expect(tool).toMatch(/useState\(campaign \? String\(RENT_EXAMPLE\.salary\) : ''\)/)
    expect(tool).toMatch(/useState\(campaign \? RENT_EXAMPLE\.city : ''\)/)
  })

  it('shares one upfront-cash implementation with the tool', () => {
    // Two implementations of the same sum is how a landing page ends up
    // promising a figure the tool below it contradicts.
    expect(tool).toMatch(/calculateUpfrontCash\(rentRangeData, takeHomeMonthly\)/)
    expect(hero).toMatch(/calculateUpfrontCash\(rent, takeHomeMonthly\)/)
  })
})

describe('what a one-bed actually costs, against what you can carry', () => {
  /**
   * The other half of the answer, and on a graduate salary in an expensive
   * city the more useful half. "You can carry $1,300 to $1,600" is a budget;
   * "and a one-bed here is $2,800" is the decision.
   *
   * These are the six preset cities at the campaign's $70,000, so a change to
   * the tax table, the rent band or the market data that flips one of these
   * verdicts shows up here rather than in front of a visitor.
   */
  const CASES = [
    { city: 'NYC', verdict: 'out_of_reach', shortfall: 1_250 },
    // Computed from the local table, which is what these tests exercise. The
    // page shows $1,550 once /api/tax answers: California's graduated schedule
    // is the worst fit for a single rate, so the two differ by one $25 step.
    // The verdict — the thing a reader acts on — is the same either way.
    { city: 'SF Bay Area', verdict: 'out_of_reach', shortfall: 1_575 },
    { city: 'Boston', verdict: 'out_of_reach', shortfall: 1_075 },
    { city: 'Seattle', verdict: 'out_of_reach', shortfall: 500 },
    { city: 'Austin', verdict: 'low_end_only', shortfall: 0 },
    { city: 'Chicago', verdict: 'in_reach', shortfall: 0 },
  ] as const

  it.each(CASES)('$city reads as $verdict', ({ city, verdict, shortfall }) => {
    const stateCode = getStateCodeForCity(city)!
    // Local tax included, because the page includes it. Without this the
    // fixture priced New York $75 a month richer than the card does and the
    // shortfall it asserted was not the one on screen.
    const net =
      70_000 -
      estimateTaxAnnual(70_000, 0, 0, stateCode) -
      localTaxAnnual(city, 70_000 - STANDARD_DEDUCTION_2026_SINGLE)
    const band = calculateRentRange(net / 12, 0)
    const m = getHUDRentRange(city)!
    expect(marketRentVerdict(band.high, m.low, m.high)).toBe(verdict)
    expect(Math.max(0, m.low - band.high)).toBe(shortfall)
  })

  it('separates a market that fits entirely from one where only the floor does', () => {
    /**
     * The distinction compareRentRanges could not make, and the reason this
     * has its own function: Chicago's whole range sits under the ceiling,
     * Austin's does not.
     */
    expect(marketRentVerdict(1_625, 1_200, 1_500)).toBe('in_reach')
    expect(marketRentVerdict(1_700, 1_600, 1_900)).toBe('low_end_only')
    expect(marketRentVerdict(1_600, 2_800, 3_400)).toBe('out_of_reach')
  })
})
