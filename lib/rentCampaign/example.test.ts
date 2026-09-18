import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { calculateRentRange, calculateUpfrontCash, listingSiteRentMonthly } from '@/lib/rent'
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
    expect(RENT_EXAMPLE_SETTLED.rentLow).toBe(1_300)
    expect(RENT_EXAMPLE_SETTLED.rentHigh).toBe(1_600)
  })

  it('lands the upfront figure the ad quotes', () => {
    // Frame 4, and the same either way, which is why the ad can state it flatly.
    expect(RENT_EXAMPLE_SETTLED.upfrontLow).toBe(4_000)
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
    expect(Math.round(u.gapLiving)).toBe(752)
    expect(u.depositLow + u.firstMonthLow + u.gapLiving + u.movingSetup).toBeGreaterThan(3_900)
  })

  it('beats the listing site at the TOP of the band, not just the bottom', () => {
    /**
     * The ad's premise has to survive a reader who anchors on the top of the
     * range. New York clears it by $150 a month; Austin, the version this
     * replaced, cleared it by $50 because Texas charges no income tax.
     */
    expect(RENT_EXAMPLE_SETTLED.rentHigh).toBeLessThan(RENT_EXAMPLE.listingSite)
    expect(RENT_EXAMPLE.listingSite - RENT_EXAMPLE_SETTLED.rentHigh).toBeGreaterThanOrEqual(150)
  })

  it('is computed, not typed out', () => {
    expect(listingSiteRentMonthly(EXAMPLE_MOVE.salary)).toBe(RENT_EXAMPLE.listingSite)
    const fresh = calculateRentRange(RENT_EXAMPLE.takeHomeMonthly, 0)
    expect(fresh.low).toBe(RENT_EXAMPLE.rentLow)
    expect(fresh.high).toBe(RENT_EXAMPLE.rentHigh)
  })

  describe('what moves between the first paint and the settled answer', () => {
    it('moves only the top of the band, and only by one rounding step', () => {
      /**
       * The local table and the API disagree about New York state tax, so the
       * hero paints $1,625 and settles at $1,600. Pinned rather than hidden:
       * if this delta ever grows, the ad is quoting a number the page visibly
       * contradicts and somebody needs to know.
       */
      expect(RENT_EXAMPLE.rentLow).toBe(RENT_EXAMPLE_SETTLED.rentLow)
      expect(RENT_EXAMPLE.rentHigh).toBe(1_625)
      expect(RENT_EXAMPLE.rentHigh - RENT_EXAMPLE_SETTLED.rentHigh).toBe(25)
    })

    it('is caused by a state rate applied to taxable income, not gross', () => {
      /**
       * lib/firstPaycheck/calculation.ts records its rates as percentages OF
       * GROSS — its own comment measures New York at 3.40%, 3.88% and 4.26%
       * across $50k to $85k, and sets 4%. The callers then charge that rate on
       * TAXABLE income, after the federal standard deduction, which understates
       * state tax in every tool that reads the table.
       *
       * Not fixed here: it moves numbers across the whole site and deserves its
       * own change. This test exists so the cause is written down next to the
       * symptom.
       */
      expect(stateRate('NY')).toBe(0.04)
      const apiStateTax = 2_799
      const onGross = EXAMPLE_MOVE.salary * stateRate('NY')
      expect(Math.round(onGross)).toBe(2_800) // within a dollar of what the API charges
      expect(onGross - apiStateTax).toBeLessThan(2)
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
