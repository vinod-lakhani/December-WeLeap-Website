import { describe, it, expect } from 'vitest'
import {
  computeAnnualContributionIncrease401k,
  computeAnnualContributionSplit401k,
} from './trajectory'

describe('computeAnnualContributionSplit401k', () => {
  // The worked example from the feedback: $60,000, 3% → 5%, 100% match up to 5%.
  const base = {
    grossAnnual: 60_000, current401kPct: 3, optimized401kPct: 5,
    matchPct: 5, matchRatePct: 100, hasEmployerMatch: true,
    realReturn: 0.07, years: 30,
  }

  it('splits the increase into whose money each half is', () => {
    // The number shown was $2,400 under a heading about employer money. Half of
    // it is the reader's own paycheck moving between accounts.
    expect(computeAnnualContributionSplit401k(base)).toEqual({
      employee: 1200, employer: 1200, total: 2400,
    })
  })

  it('agrees with the total the summed function returns', () => {
    // The two must not drift: same arithmetic, one summed and one not.
    const split = computeAnnualContributionSplit401k(base)
    expect(split.total).toBe(computeAnnualContributionIncrease401k(base))
  })

  it('reports no employer half when there is no match', () => {
    const split = computeAnnualContributionSplit401k({ ...base, hasEmployerMatch: false })
    expect(split).toEqual({ employee: 1200, employer: 0, total: 1200 })
  })

  it('stops the employer half at the match cap', () => {
    // Going 3% → 10% against a 5% cap: the employee half keeps growing, the
    // employer half stops at the cap.
    const split = computeAnnualContributionSplit401k({ ...base, optimized401kPct: 10 })
    expect(split.employee).toBe(4200)
    expect(split.employer).toBe(1200)
  })
})
