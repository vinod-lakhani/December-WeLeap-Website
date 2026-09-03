/**
 * The IRS limit is a ceiling. Using it as a target inverted the advice.
 *
 * The first test is the one that matters: the old rule recommended a bigger
 * percentage the less you earned, because $24,500 is a bigger share of a
 * smaller salary. These pin the replacement and, more importantly, pin the
 * direction — targets must not rise as income falls.
 */

import { describe, it, expect } from 'vitest'
import { computeRetirementTargetPct, totalRetirementPctOfGross } from './retirementTarget'
import { K401_EMPLOYEE_CAP, RETIREMENT_TARGET_PCT_OF_GROSS } from './constants'

const base = {
  current401kPct: 5,
  hasEmployerMatch: true,
  matchCapPct: 5,
  matchRatePct: 100,
  stateCode: 'TX',
}

describe('computeRetirementTargetPct', () => {
  it('targets 15% of gross including the match, so a 5% match asks for 10%', () => {
    const pct = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000 })
    expect(pct).toBe(10)
    expect(totalRetirementPctOfGross({ ...base, salaryAnnual: 60_000 }, pct)).toBe(
      RETIREMENT_TARGET_PCT_OF_GROSS
    )
  })

  it('no longer rises as salary falls — the whole point', () => {
    const at = (salaryAnnual: number) => computeRetirementTargetPct({ ...base, salaryAnnual })
    const salaries = [45_000, 60_000, 90_000, 120_000, 200_000]
    const targets = salaries.map(at)
    // Old rule produced 54.4 / 40.8 / 27.2 / 20.4 / 12.2 — strictly decreasing
    // in income, which is backwards. The rule is flat until the IRS ceiling
    // starts to bite, and never increases as income drops.
    expect(targets).toEqual([10, 10, 10, 10, 10])
    for (let i = 1; i < targets.length; i++) {
      expect(targets[i]!).toBeLessThanOrEqual(targets[i - 1]!)
    }
  })

  it('a weaker match asks more of the employee, for the same 15% total', () => {
    // 50 cents on the dollar up to 6% is 3% of gross from the employer.
    const inputs = { ...base, salaryAnnual: 60_000, matchCapPct: 6, matchRatePct: 50 }
    const pct = computeRetirementTargetPct(inputs)
    expect(pct).toBe(12)
    expect(totalRetirementPctOfGross(inputs, pct)).toBe(15)
  })

  it('no match at all means the full 15% is the employee’s', () => {
    const inputs = { ...base, salaryAnnual: 60_000, hasEmployerMatch: false, current401kPct: 0 }
    expect(computeRetirementTargetPct(inputs)).toBe(15)
  })

  it('clamps to the IRS limit for a high earner, where 15% would exceed it', () => {
    // 10% of $300k is $30,000, past the $24,500 employee limit.
    const pct = computeRetirementTargetPct({ ...base, salaryAnnual: 300_000 })
    expect(pct).toBeCloseTo((K401_EMPLOYEE_CAP / 300_000) * 100, 5)
    expect((300_000 * pct) / 100).toBeLessThanOrEqual(K401_EMPLOYEE_CAP)
  })

  it('never recommends less than the match cap, which pays 100%', () => {
    const pct = computeRetirementTargetPct({
      ...base,
      salaryAnnual: 60_000,
      current401kPct: 0,
      matchCapPct: 12,
      matchRatePct: 100,
    })
    // 15% total against a 12% match leaves 3% — below the cap, so capturing
    // the match wins. The rule may never talk someone out of free money.
    expect(pct).toBeGreaterThanOrEqual(12)
  })

  it('never recommends a decrease for someone already above the target', () => {
    const pct = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000, current401kPct: 22 })
    expect(pct).toBe(22)
  })
})

describe('the solvency floor', () => {
  it('leaves a workable surplus in the case that used to go negative', () => {
    // $60k / TX / $2,400 essentials. The old target of 40.83% produced a
    // take-home of $2,377 — below essentials — so the plan came out empty.
    const pct = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000, essentialsMonthly: 2400 })
    expect(pct).toBe(10)
  })

  it('backs off when 15% would not leave the essentials covered', () => {
    // $60k in TX nets $3,342/mo at the 5% match and $3,166 at 10%. Essentials
    // of $3,250 sit between the two, so 15%-including-match is unaffordable
    // here and the target has to land partway.
    const inputs = { ...base, salaryAnnual: 60_000, essentialsMonthly: 3250 }
    const pct = computeRetirementTargetPct(inputs)
    expect(pct).toBeLessThan(10)
    expect(pct).toBeGreaterThanOrEqual(5)
  })

  it('falls back to capturing the match when nothing else fits', () => {
    // Essentials above take-home even at the match cap. The answer is the
    // match and no more, not an increase the budget cannot absorb.
    const pct = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000, current401kPct: 5, essentialsMonthly: 3400 })
    expect(pct).toBe(5)
  })

  it('is inert when essentials are unknown, so the rule stands alone', () => {
    const withOut = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000 })
    const withZero = computeRetirementTargetPct({ ...base, salaryAnnual: 60_000, essentialsMonthly: 0 })
    expect(withZero).toBe(withOut)
  })
})
