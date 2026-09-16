import { describe, expect, it } from 'vitest'

import { hasStateRate, stateRate } from '@/lib/firstPaycheck/calculation'
import { US_STATES } from '@/lib/states'
import {
  computeLoanPayment,
  monthlyPayment,
  STANDARD_TERM_MONTHS,
  type LoanPaymentInputs,
} from './calculation'

const base = (over: Partial<LoanPaymentInputs> = {}): LoanPaymentInputs => ({
  balance: 30_000,
  aprPct: 6.5,
  salary: 60_000,
  state: '',
  deferralPct: 4,
  ...over,
})

describe('monthlyPayment', () => {
  it('matches the standard ten-year amortization', () => {
    // $30,000 at 6.5% over 120 months. The figure in the brief.
    expect(Math.round(monthlyPayment(30_000, 6.5))).toBe(341)
  })

  it('moves the way the acceptance criteria say', () => {
    // "Changing the balance to 45,000 updates the payment to about $511."
    expect(Math.round(monthlyPayment(45_000, 6.5))).toBe(511)
  })

  it('divides evenly at a zero rate rather than dividing by zero', () => {
    expect(monthlyPayment(12_000, 0)).toBe(100)
    expect(Number.isFinite(monthlyPayment(12_000, 0))).toBe(true)
  })

  it('is zero for a balance nobody has entered yet', () => {
    expect(monthlyPayment(0, 6.5)).toBe(0)
  })

  it('costs more per month as the rate climbs', () => {
    const cheap = monthlyPayment(30_000, 3)
    const dear = monthlyPayment(30_000, 9)
    expect(dear).toBeGreaterThan(cheap)
  })
})

describe('computeLoanPayment', () => {
  it('withholds everything until there is a salary', () => {
    expect(computeLoanPayment(base({ salary: 0 }))).toBeNull()
  })

  it('takes the payment off take-home, not off gross', () => {
    const r = computeLoanPayment(base())!
    expect(r.takeHomeAfter).toBeCloseTo(r.takeHomeBefore - r.payment, 6)
    // The distinction the tool exists for: against gross the payment looks
    // smaller than it is.
    expect(r.takeHomeBefore).toBeLessThan(r.grossMonthly)
  })

  it('reports the paycheck with the match kept, which is what it recommends', () => {
    /**
     * The mock showed one after-figure that assumed no 401(k), directly above
     * advice to keep the match. A visitor who takes the advice does not get
     * the number they were shown, so the tool reports both.
     */
    const r = computeLoanPayment(base())!
    expect(r.takeHomeWithMatch).toBeLessThan(r.takeHomeAfter)
    expect(r.deferralCostMonthly).toBeGreaterThan(0)
  })

  it('prices the deferral below its face value, because of the tax it saves', () => {
    const r = computeLoanPayment(base({ deferralPct: 4 }))!
    const faceValue = (60_000 * 0.04) / 12 // $200 a month gross
    expect(r.deferralCostMonthly).toBeLessThan(faceValue)
    // But not free: FICA is charged on the deferral, so it is not the whole
    // marginal rate either.
    expect(r.deferralCostMonthly).toBeGreaterThan(faceValue * 0.5)
  })

  it('leaves the two paychecks equal when nothing is deferred', () => {
    const r = computeLoanPayment(base({ deferralPct: 0 }))!
    expect(r.takeHomeWithMatch).toBeCloseTo(r.takeHomeAfter, 6)
    expect(r.deferralCostMonthly).toBeCloseTo(0, 6)
  })

  describe('the high-rate switch', () => {
    it('leaves an ordinary federal rate alone', () => {
      expect(computeLoanPayment(base({ aprPct: 6.5 }))!.highApr).toBe(false)
      expect(computeLoanPayment(base({ aprPct: 9.9 }))!.highApr).toBe(false)
    })

    it('flips at ten percent, the same threshold the allocator uses', () => {
      expect(computeLoanPayment(base({ aprPct: 10 }))!.highApr).toBe(true)
      expect(computeLoanPayment(base({ aprPct: 11 }))!.highApr).toBe(true)
    })
  })

  describe('state tax', () => {
    it('leaves more in hand in a state with no income tax', () => {
      const texas = computeLoanPayment(base({ state: 'TX' }))!
      const blended = computeLoanPayment(base({ state: '' }))!
      expect(texas.takeHomeAfter).toBeGreaterThan(blended.takeHomeAfter)
    })

    it('actually differs across states rather than quietly blending', () => {
      const seen = new Set(
        ['TX', 'CO', 'OR', 'PA', 'ND'].map(
          (s) => Math.round(computeLoanPayment(base({ state: s }))!.takeHomeAfter),
        ),
      )
      // Five states, five different answers. Before the table was filled in,
      // four of these fell through to the same 4% default.
      expect(seen.size).toBe(5)
    })

    it('has a named rate for every state the picker offers', () => {
      // A code in the dropdown with no entry silently became 4%, which is how
      // thirty-eight states used to be priced. Asked by name rather than by
      // rate, because Kentucky really is flat 4% and should not read as a gap.
      expect(US_STATES.filter((code) => !hasStateRate(code))).toEqual([])
    })

    it('still blends anything that is not a state', () => {
      expect(stateRate('')).toBe(0.04)
      expect(stateRate('ZZ')).toBe(0.04)
    })
  })

  it('reports the interest the standard term costs', () => {
    const r = computeLoanPayment(base())!
    // $341 a month for ten years against a $30,000 balance.
    expect(Math.round(r.interestTotal)).toBe(Math.round(r.payment * STANDARD_TERM_MONTHS - 30_000))
    expect(r.interestTotal).toBeGreaterThan(9_000)
  })
})
