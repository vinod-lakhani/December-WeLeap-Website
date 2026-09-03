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
