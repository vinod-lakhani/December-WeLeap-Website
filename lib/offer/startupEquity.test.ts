import { describe, expect, it } from 'vitest'

import { afterDilution, atLastRound, breakEvenExit, companyValue, costToBuy, ownership, payoutAt, pct } from './startupEquity'

/**
 * The spec's worked example, end to end: $130,000 base at a Series A startup, 20,000 ISOs at a $1.10 strike over
 * four years, a $4.40 Series A price and 20,000,000 shares outstanding; the other offer is $150,000.
 */
const grant = { shares: 20_000, strike: 1.1, type: 'iso' as const, vestYears: 4 }
const OUTSTANDING = 20_000_000

describe('startup equity: the worked example', () => {
  it("the recruiter's number, the cost to buy, and the share of the company", () => {
    expect(atLastRound(grant, 4.4)).toBeCloseTo(88_000)
    expect(costToBuy(grant)).toBeCloseTo(22_000)
    expect(ownership(grant, OUTSTANDING)).toBeCloseTo(0.001)
    expect(afterDilution(0.001)).toBeCloseTo(0.00064)
    expect(pct(0.001)).toBe('0.10%')
    expect(pct(0.00064)).toBe('0.06%')
  })

  it('pays out after dilution and the cost to buy, never below zero', () => {
    expect(payoutAt(grant, OUTSTANDING, 88e6)).toBeCloseTo(34_320)
    expect(payoutAt(grant, OUTSTANDING, 264e6)).toBeCloseTo(146_960)
    expect(payoutAt(grant, OUTSTANDING, 880e6)).toBeCloseTo(541_200)
    expect(payoutAt(grant, OUTSTANDING, 10e6)).toBe(0)
  })

  it('breaks even at about $159M, 1.8 times the last valuation; nothing to make up when this offer pays more', () => {
    const exit = breakEvenExit(grant, OUTSTANDING, 20_000)!
    expect(exit).toBeCloseTo(159_375_000)
    expect(exit / 88e6).toBeCloseTo(1.81, 2)
    expect(companyValue(exit)).toBe('$159M')
    expect(breakEvenExit(grant, OUTSTANDING, 0)).toBeNull()
    expect(breakEvenExit(grant, OUTSTANDING, -5_000)).toBeNull()
  })

  it('RSUs have nothing to buy; an unknown strike has no cost to show', () => {
    expect(costToBuy({ shares: 5_000, type: 'rsu' })).toBe(0)
    expect(costToBuy({ shares: 5_000 })).toBeUndefined()
  })

  it('says company values the way people do', () => {
    expect(companyValue(88e6)).toBe('$88M')
    expect(companyValue(1.2e9)).toBe('$1.2B')
    expect(companyValue(2.5e6)).toBe('$2.5M')
    expect(companyValue(750e3)).toBe('$750K')
  })
})
