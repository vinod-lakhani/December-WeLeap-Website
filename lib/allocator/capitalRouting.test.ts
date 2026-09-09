/**
 * The buffer step used to assume you were starting from zero.
 *
 * `computeCapitalRouting` has always taken an `efCurrent`, and `buildLeaps`
 * has always passed it `0` — because nothing in the tool asked. That is not a
 * conservative default. It routes 40% of the monthly surplus into a buffer
 * that may already be full, and it takes that 40% away from the debt and
 * retirement steps, which is where it belonged. The output was not vague, it
 * was wrong, and it was wrong in the direction of doing less with the money.
 *
 * The numbers below are one person seen at four balances, so the tests read as
 * a progression rather than four unrelated cases: $60k in TX nets $3,342/mo,
 * essentials of $2,400 leave a $942 surplus, and three months of essentials
 * make a $7,200 target.
 */

import { describe, it, expect } from 'vitest'
import { computeCapitalRouting } from './capitalRouting'
import type { AllocatorUnlockData } from './leapModel'

const SURPLUS = 942
const ESSENTIALS = 2400
const TARGET = ESSENTIALS * 3 // 7200

const unlock = (over: Partial<AllocatorUnlockData> = {}): AllocatorUnlockData => ({
  essentialMonthly: ESSENTIALS,
  carriesBalance: true,
  debtBalance: 3000,
  debtAprRange: '20+',
  retirementFocus: 'medium',
  ...over,
})

const route = (efCurrent: number) =>
  computeCapitalRouting({ postTaxSavingsMonthly: SURPLUS, efCurrent, unlock: unlock({ cashOnHand: efCurrent }) })

describe('computeCapitalRouting — the buffer against real savings', () => {
  it('nothing saved: 40% to the buffer, and the target is 20 months out', () => {
    const r = route(0)
    expect(r.efAlloc).toBeCloseTo(376.8, 1)
    expect(r.efGap).toBe(TARGET)
    expect(r.efFunded).toBe(false)
    expect(r.monthsToEfTarget).toBe(20)
  })

  it('partway there: the timeline runs off the GAP, not the target', () => {
    const r = route(3000)
    // $4,200 still missing at $376.80/mo is 12 months. Computed from the full
    // $7,200 it would read 20 — the same answer as having saved nothing, which
    // is what the tool showed before this field existed.
    expect(r.efGap).toBe(4200)
    expect(r.monthsToEfTarget).toBe(12)
    expect(r.efFunded).toBe(false)
    // Still funding the buffer, so the money below it is unchanged.
    expect(r.efAlloc).toBeCloseTo(376.8, 1)
  })

  it('exactly at target: funded, and the 40% moves down the stack', () => {
    const r = route(TARGET)
    expect(r.efFunded).toBe(true)
    expect(r.efAlloc).toBe(0)
    expect(r.efGap).toBe(0)
    expect(r.monthsToEfTarget).toBeUndefined()
    // The whole surplus is now available below the buffer: 40% of $942 to the
    // 22% APR card rather than 40% of $565.
    expect(r.debtAlloc).toBeCloseTo(376.8, 1)
  })

  it('over-funded is treated as funded, not as a rounding edge', () => {
    const r = route(20_000)
    expect(r.efFunded).toBe(true)
    expect(r.efAlloc).toBe(0)
    expect(r.efGap).toBe(0)
  })

  it('a funded buffer sends the money on rather than leaving it unrouted', () => {
    const zero = route(0)
    const funded = route(TARGET)
    const sum = (r: typeof zero) => r.efAlloc + r.debtAlloc + r.retirementAlloc + r.brokerageAlloc
    // Every dollar of surplus is still accounted for either way. The buffer
    // being done redirects the money; it does not make it disappear.
    expect(sum(zero)).toBeCloseTo(SURPLUS, 1)
    expect(sum(funded)).toBeCloseTo(SURPLUS, 1)
    expect(funded.debtAlloc).toBeGreaterThan(zero.debtAlloc)
    expect(funded.retirementAlloc).toBeGreaterThan(zero.retirementAlloc)
  })

  it('no debt: a funded buffer sends the full surplus to retirement and flex', () => {
    const r = computeCapitalRouting({
      postTaxSavingsMonthly: SURPLUS,
      efCurrent: TARGET,
      unlock: unlock({ cashOnHand: TARGET, carriesBalance: false, debtBalance: undefined }),
    })
    expect(r.efAlloc).toBe(0)
    expect(r.debtAlloc).toBe(0)
    expect(r.retirementAlloc + r.brokerageAlloc).toBeCloseTo(SURPLUS, 1)
  })

  it('unanswered behaves as zero, so the field is additive not required', () => {
    const unanswered = computeCapitalRouting({ postTaxSavingsMonthly: SURPLUS, unlock: unlock() })
    expect(unanswered).toEqual(route(0))
  })

  it('no essentials means no target, and a balance cannot invent one', () => {
    const r = computeCapitalRouting({
      postTaxSavingsMonthly: SURPLUS,
      efCurrent: 5000,
      unlock: unlock({ essentialMonthly: undefined, cashOnHand: 5000 }),
    })
    // Without essentials there is no target to be funded against, so this is
    // "not applicable" rather than "done" — and efAlloc stays 0 either way.
    expect(r.efTarget).toBe(0)
    expect(r.efFunded).toBe(false)
    expect(r.efAlloc).toBe(0)
  })
})

describe('retirement contributions respect the legal maximum', () => {
  const base = {
    postTaxSavingsMonthly: 4000,
    efCurrent: 999_999, // buffer funded, so nothing diverts there
    unlock: { essentialMonthly: 3000, carriesBalance: false, retirementFocus: 'medium' as const },
  }

  it('caps the retirement line at the room available', () => {
    // Without a ceiling this split by preference alone and recommended several
    // times the legal maximum. On $140,000 the old routing produced $30,073 a
    // year into "Retirement" against an IRA limit of $7,500.
    const r = computeCapitalRouting({ ...base, retirementHeadroomAnnual: 12_000 })
    expect(r.retirementAlloc).toBeCloseTo(1000, 2)
    expect(r.retirementCapped).toBe(true)
  })

  it('moves the overflow to brokerage rather than losing it', () => {
    // The money is still there to invest; it just cannot go somewhere
    // sheltered this year. A plan that quietly dropped it would be worse than
    // one that never capped.
    const capped = computeCapitalRouting({ ...base, retirementHeadroomAnnual: 12_000 })
    const uncapped = computeCapitalRouting(base)
    const total = (r: typeof capped) =>
      r.efAlloc + r.debtAlloc + r.retirementAlloc + r.brokerageAlloc
    expect(total(capped)).toBeCloseTo(total(uncapped), 2)
    expect(capped.brokerageAlloc).toBeGreaterThan(uncapped.brokerageAlloc)
  })

  it('does not cap when there is room to spare', () => {
    const r = computeCapitalRouting({ ...base, retirementHeadroomAnnual: 200_000 })
    const uncapped = computeCapitalRouting(base)
    expect(r.retirementAlloc).toBeCloseTo(uncapped.retirementAlloc, 2)
    expect(r.retirementCapped).toBe(false)
  })

  it('stays uncapped when the room is unknown, so an old caller is unchanged', () => {
    // Omitted means unknown. A caller that cannot compute headroom must get the
    // behaviour it always got rather than a silently different plan.
    const r = computeCapitalRouting(base)
    expect(r.retirementCapped).toBe(false)
    expect(r.retirementAlloc).toBeGreaterThan(0)
  })

  it('sends everything to brokerage when there is no room at all', () => {
    // Someone already at both limits. Retirement is zero and nothing is lost.
    const r = computeCapitalRouting({ ...base, retirementHeadroomAnnual: 0 })
    expect(r.retirementAlloc).toBe(0)
    expect(r.retirementCapped).toBe(true)
    expect(r.efAlloc + r.debtAlloc + r.retirementAlloc + r.brokerageAlloc).toBeCloseTo(
      base.postTaxSavingsMonthly,
      2
    )
  })
})
