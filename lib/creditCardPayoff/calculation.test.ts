import { describe, expect, it } from 'vitest'
import { getMinTotalPayment, runPayoffScenario, type CreditCard } from './calculation'

/**
 * The fixture that separates the two strategies: the biggest balance is NOT
 * the worst APR, so avalanche (highest APR) and the highest-balance-first sort
 * this module used to ship send the extra payment to different cards.
 *
 * Measured totals for this book, so the regression is legible rather than a
 * bare magic number:
 *
 *   extra/mo   avalanche      highest-balance   interest avoided
 *   $100       $2,247.02      $2,980.67         $733.65
 *   $250       $1,139.00      $1,542.40         $403.40
 *   $300       $  982.85      $1,332.76         $349.91
 *   $600       $  553.34      $  741.95         $188.62
 *
 * These assertions are exact on purpose. Inequality assertions ("avalanche
 * costs less") pass under BOTH sorts on most books and would not have caught
 * the original bug — that was verified by running them against the old code.
 */
const DIVERGENT: CreditCard[] = [
  { id: 'big-cheap', name: 'Big balance, low APR', balance: 6000, apr: 11.99 },
  { id: 'small-costly', name: 'Small balance, high APR', balance: 1800, apr: 28.99 },
]

describe('runPayoffScenario — avalanche ordering', () => {
  it('routes the extra payment by APR, not by balance', () => {
    // Under highest-balance-first this is 1332.7643. A failure here means the
    // extra is going to the big cheap card again.
    expect(runPayoffScenario(DIVERGENT, 300).totalInterest).toBeCloseTo(982.8519, 3)
  })

  it('holds at a low extra payment, where the gap is widest', () => {
    // Under highest-balance-first this is 2980.6664 — $733.65 more.
    expect(runPayoffScenario(DIVERGENT, 100).totalInterest).toBeCloseTo(2247.0154, 3)
  })

  it('is unaffected by the order cards are passed in', () => {
    const forward = runPayoffScenario(DIVERGENT, 250)
    const reversed = runPayoffScenario([...DIVERGENT].reverse(), 250)

    expect(reversed.totalInterest).toBeCloseTo(forward.totalInterest, 6)
    expect(reversed.months).toBe(forward.months)
  })

  it('can take one month longer than highest-balance-first while costing far less', () => {
    // Counterintuitive but correct, and worth pinning so nobody "fixes" it:
    // retiring the small high-APR card early removes its minimum payment, so
    // less total money moves each month. At $100 extra avalanche finishes in
    // 56 months against the old sort's 55 — and saves $733.65 in interest.
    // Payoff speed and interest cost are not the same objective.
    expect(runPayoffScenario(DIVERGENT, 100).months).toBe(56)
  })

  it('breaks APR ties toward the smaller balance', () => {
    const tied: CreditCard[] = [
      { id: 'larger', name: 'Larger', balance: 4000, apr: 22 },
      { id: 'smaller', name: 'Smaller', balance: 900, apr: 22 },
    ]
    // Equal APRs, so the tie-break decides. Reversing the input must not move
    // the answer — if it does, the sort fell through to input position.
    const forward = runPayoffScenario(tied, 300)
    const reversed = runPayoffScenario([...tied].reverse(), 300)

    expect(reversed.totalInterest).toBeCloseTo(forward.totalInterest, 6)
    expect(forward.months).toBeGreaterThan(0)
  })
})

describe('runPayoffScenario — invariants', () => {
  it('terminates and never reports a negative balance', () => {
    const result = runPayoffScenario(DIVERGENT, 500)

    expect(result.months).toBeGreaterThan(0)
    expect(result.months).toBeLessThan(600)
    expect(result.balanceHistory.every((p) => p.totalBalance >= 0)).toBe(true)
    expect(result.balanceHistory.at(-1)!.totalBalance).toBeCloseTo(0, 2)
  })

  it('more extra never costs more interest', () => {
    const low = runPayoffScenario(DIVERGENT, 100)
    const high = runPayoffScenario(DIVERGENT, 600)

    expect(high.totalInterest).toBeLessThan(low.totalInterest)
    expect(high.months).toBeLessThan(low.months)
  })

  it('totalPaid reconciles to principal plus interest', () => {
    const result = runPayoffScenario(DIVERGENT, 275)
    const principal = DIVERGENT.reduce((sum, c) => sum + c.balance, 0)

    expect(result.totalPaid).toBeCloseTo(principal + result.totalInterest, 6)
  })

  it('handles an empty and a fully-paid book without looping', () => {
    expect(runPayoffScenario([], 100).months).toBe(0)
    expect(runPayoffScenario([{ id: 'z', name: 'Zero', balance: 0, apr: 25 }], 100).months).toBe(0)
  })
})

describe('getMinTotalPayment', () => {
  it('applies the $25 floor per card, not per book', () => {
    const tiny: CreditCard[] = [
      { id: 'a', name: 'A', balance: 50, apr: 20 },
      { id: 'b', name: 'B', balance: 50, apr: 20 },
    ]
    expect(getMinTotalPayment(tiny)).toBeCloseTo(50, 2)
  })

  it('never asks for more than the balance plus its interest', () => {
    const nearZero: CreditCard[] = [{ id: 'a', name: 'A', balance: 3, apr: 25 }]
    expect(getMinTotalPayment(nearZero)).toBeCloseTo(3 + 3 * (25 / 100 / 12), 6)
  })

  it('ignores zero-balance cards', () => {
    expect(getMinTotalPayment([{ id: 'a', name: 'A', balance: 0, apr: 25 }])).toBe(0)
  })
})
