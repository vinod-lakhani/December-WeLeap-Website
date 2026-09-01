import { describe, it, expect } from 'vitest'
import { computeMatchLeap } from './matchLeap'
import { K401_EMPLOYEE_CAP } from '@/lib/allocator/constants'

describe('computeMatchLeap', () => {
  it('reports the employer money available at the default match', () => {
    // 72,000 x 5% = 3,600 matched dollar-for-dollar.
    const leap = computeMatchLeap(72000)!
    expect(leap.annual).toBe(3600)
    expect(leap.monthly).toBe(300)
    expect(leap.contributionPct).toBe(5)
  })

  it('projects the monthly figure over thirty years', () => {
    const leap = computeMatchLeap(72000)!
    // $300/mo at 7% for 30 years lands around $340k.
    expect(leap.thirtyYear).toBeGreaterThan(330_000)
    expect(leap.thirtyYear).toBeLessThan(370_000)
  })

  it('scales linearly below the deferral cap', () => {
    expect(computeMatchLeap(50000)!.annual).toBe(2500)
    expect(computeMatchLeap(100000)!.annual).toBe(5000)
  })

  it('stops growing once 5% of salary exceeds the IRS deferral cap', () => {
    // An employer matches what the employee defers, and above the cap they
    // cannot defer more — so the match plateaus rather than tracking income.
    const atCap = computeMatchLeap(K401_EMPLOYEE_CAP * 20)!
    const wellAbove = computeMatchLeap(K401_EMPLOYEE_CAP * 40)!
    expect(atCap.annual).toBe(K401_EMPLOYEE_CAP)
    expect(wellAbove.annual).toBe(K401_EMPLOYEE_CAP)
  })

  it.each([
    ['zero', 0],
    ['negative', -50000],
    ['implausibly low', 5000],
    ['implausibly high', 5_000_000],
    ['not a number', Number.NaN],
    ['infinite', Number.POSITIVE_INFINITY],
  ])('returns null for %s rather than printing a headline figure', (_label, salary) => {
    expect(computeMatchLeap(salary)).toBeNull()
  })
})
