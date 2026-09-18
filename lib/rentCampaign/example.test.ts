import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { calculateRentRange, calculateUpfrontCash, listingSiteRentMonthly } from '@/lib/rent'
import { EXAMPLE_MOVE, RENT_EXAMPLE } from './example'

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
    // calculator uses, and it is the same $1,750 in every city because the
    // rule ignores tax entirely.
    expect(Math.round(RENT_EXAMPLE.listingSite)).toBe(1_750)
  })

  it('lands the band the ad quotes', () => {
    // Frame 3.
    expect(RENT_EXAMPLE.rentLow).toBe(1_350)
    expect(RENT_EXAMPLE.rentHigh).toBe(1_700)
  })

  it('lands the upfront figure the ad quotes', () => {
    // Frame 4. The number the creative originally had at $3,400, which was
    // deposit + first month + moving with the two-week gap named in the stack
    // but not added to the total.
    expect(RENT_EXAMPLE.upfrontLow).toBe(4_100)
  })

  it('counts the gap the stack names', () => {
    /**
     * The whole reason the upfront number is bigger than people expect, and
     * the line that was missing from the ad's arithmetic. Two weeks of living
     * costs with no salary behind them, on top of a deposit and a first month
     * paid the same day.
     */
    const rent = calculateRentRange(RENT_EXAMPLE.takeHomeMonthly, 0)
    const u = calculateUpfrontCash(rent, RENT_EXAMPLE.takeHomeMonthly)
    expect(Math.round(u.gapLiving)).toBe(790)
    expect(u.depositLow + u.firstMonthLow + u.gapLiving + u.movingSetup).toBeGreaterThan(4_000)
  })

  it('still beats the listing site at the top of the band', () => {
    /**
     * Austin is the least flattering preset for this argument — no state
     * income tax, so take-home is high and the band reaches further up. The
     * ad's premise has to survive a reader who anchors on the TOP of the
     * range, not just the bottom, or it collapses in the replies.
     */
    expect(RENT_EXAMPLE.rentHigh).toBeLessThan(RENT_EXAMPLE.listingSite)
  })

  it('is computed, not typed out', () => {
    expect(listingSiteRentMonthly(EXAMPLE_MOVE.salary)).toBe(RENT_EXAMPLE.listingSite)
    const fresh = calculateRentRange(RENT_EXAMPLE.takeHomeMonthly, 0)
    expect(fresh.low).toBe(RENT_EXAMPLE.rentLow)
    expect(fresh.high).toBe(RENT_EXAMPLE.rentHigh)
  })
})


describe('campaign mode on the rent tool', () => {
  const tool = readFileSync(join(process.cwd(), 'components/RentTool.tsx'), 'utf8')
  const hero = readFileSync(join(process.cwd(), 'components/RentCampaignHero.tsx'), 'utf8')

  it('never puts a comma into the salary it shares with the form', () => {
    /**
     * The trap this nearly fell into. The hero renders the salary at 24px as
     * the centrepiece of the first screen, where "70000" reads as a number
     * somebody forgot to finish — but that state is shared with the form
     * below, which is a number field whose every consumer reads it with
     * parseFloat. parseFloat('70,000') is 70, so formatting the shared value
     * would have quietly repriced the whole tool at a seventy-dollar salary.
     *
     * Grouping happens on the way out and is stripped on the way in.
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
