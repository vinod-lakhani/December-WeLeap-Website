import { describe, expect, it } from 'vitest'

import { moneyOrder, ORDER, payoff } from './moneyOrder'
import { parseDebt } from './parse'

// The mock-up's person: $85,000 in Texas ($5,719 take-home), $1,600 rent, a $4,000 card at 22% paying $150, and a
// 100%-up-to-4% match ($283 in, $283 from the employer, about $221 of take-home).
const BASE = {
  takeHomeMonthly: 5719, rentMonthly: 1600,
  debt: { balance: 4000, aprPct: 22, payment: 150 },
  match: 'known' as const, matchUpToPct: 4, contributionMonthly: 283, electionMonthlyIn: 566, electionCost: 221,
}

describe('payoff (the app loan tool formula)', () => {
  it('matches the loan tool on a card and a car loan', () => {
    const card = payoff(4000, 22, 150)
    expect(card.months).toBeCloseTo(36.9, 1)
    expect(Math.round(card.interest)).toBe(1542)
    const car = payoff(30000, 18, 650)
    expect(Math.round(car.months)).toBe(79)
  })

  it('never clears when the payment does not cover the interest', () => {
    expect(payoff(30000, 18, 400).months).toBe(Infinity)
  })
})

describe('the next-dollar order', () => {
  it('match, then the card cleared in a year, then three months of essentials, then retirement', () => {
    const o = moneyOrder(BASE)
    expect(o.steps.map((s) => s.key)).toEqual([...ORDER])
    expect(o.steps[0].detail).toBe('Put in 4% of pay, $283 a month, and your employer adds $283. Costs you about $221 of take-home.')
    expect(o.debtPlan).toEqual(expect.objectContaining({ payment: 375, months: 12, currentMonths: 37 }))
    expect(Math.round(o.debtPlan!.currentInterest)).toBe(1542)
    expect(o.steps[1].detail).toMatch(/^\$375 a month instead of \$150: gone in 12 months, not 37/)
    expect(o.emergencyGoal).toBe(8600)
    expect(o.leftAfterRent).toBe(4119)
    expect(o.monthlyForSteps).toBe(221 + 375)
  })

  it('a debt at 10% or less is not on the list; no match leaves the match out', () => {
    const o = moneyOrder({ ...BASE, debt: { balance: 12000, aprPct: 6, payment: 250 }, match: 'none' })
    expect(o.steps.map((s) => s.key)).toEqual(['emergency', 'retirement'])
    expect(o.steps[1].detail).toBe('Counting the match.')
  })

  it('an unknown match is a step with no numbers', () => {
    const o = moneyOrder({ ...BASE, match: 'unknown', debt: undefined })
    expect(o.steps[0]).toEqual(expect.objectContaining({ key: 'match', title: 'Find out your 401(k) match' }))
    expect(o.steps[0].detail).not.toMatch(/\$/)
  })

  it('a tight budget clears it in two years; tighter still keeps the current payment', () => {
    const tight = moneyOrder({ ...BASE, takeHomeMonthly: 2100, rentMonthly: 1500, match: 'none' })
    expect(tight.debtPlan!.months).toBeGreaterThan(12)
    const tighter = moneyOrder({ ...BASE, takeHomeMonthly: 1900, rentMonthly: 1500, match: 'none' })
    expect(tighter.debtPlan!.payment).toBe(150)
    expect(tighter.steps[0].detail).toMatch(/^Keep paying \$150 a month/)
  })

  it('a payment below the interest says so', () => {
    const o = moneyOrder({ ...BASE, takeHomeMonthly: 1800, rentMonthly: 1500, debt: { balance: 30000, aprPct: 18, payment: 400 }, match: 'none' })
    expect(o.steps[0].detail).toMatch(/doesn't cover the interest/)
  })
})

describe('reading a debt typed in one line', () => {
  it('balance, rate and payment, in any order', () => {
    expect(parseDebt('Card, 4000 at 22%, I pay 150')).toEqual({ balance: 4000, aprPct: 22, payment: 150, kind: 'card' })
    expect(parseDebt('$12k student loan 6.8% paying 250 a month')).toEqual({ balance: 12000, aprPct: 6.8, payment: 250, kind: 'loan' })
    expect(parseDebt('car loan 18,500 at 7.9%, 410/mo')).toEqual({ balance: 18500, aprPct: 7.9, payment: 410, kind: 'loan' })
  })
  it('what is missing stays undefined', () => {
    expect(parseDebt('about 3000 on a card')).toEqual({ balance: 3000, kind: 'card' })
    expect(parseDebt('3000 at 19%, paying 100')).toEqual({ balance: 3000, aprPct: 19, payment: 100 })
    expect(parseDebt('24%')).toEqual({ aprPct: 24 })
  })
})
