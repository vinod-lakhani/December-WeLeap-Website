import { describe, expect, it } from 'vitest'

import type { OfferFigures } from '@/lib/offer/liveFigures'
import { yourFigure } from './OfferNumberChips'

/**
 * What each chip says about THIS visitor's offer. The rule that matters: a
 * term they have not entered says so — it never shows an example figure as if
 * it were theirs, which is the mistake the entered-data change (D1-D3) fixed in
 * the result card.
 */

const base: OfferFigures = {
  salary: 95_000,
  takeHomeMonthly: 6_042,
  bonusPct: 0,
  annualBonus: 0,
  bonusEntered: false,
  matchRatePct: 0,
  matchUpToPct: 0,
  annual401kMatch: 0,
  matchEntered: false,
  annualHsa: 0,
  annualHealthcare: 0,
  benefitsEntered: false,
  rsuAnnual: 0,
  annualEspp: 0,
  equityEntered: false,
  ptoDays: 15,
  ptoValue: 0,
  ptoEntered: false,
  rentMonthly: 0,
  rentPct: null,
}

describe('yourFigure', () => {
  it('says nothing before there is a result', () => {
    for (const id of ['base', 'bonus', 'match', 'hsa', 'equity', 'pto', 'housing']) {
      expect(yourFigure(id, null)).toBeNull()
    }
  })

  it('states the salary and take-home', () => {
    expect(yourFigure('base', base)).toBe('$95,000 a year, about $6,042 a month after tax.')
  })

  it('says "not entered" rather than showing an example', () => {
    for (const id of ['bonus', 'match', 'hsa', 'equity']) {
      expect(yourFigure(id, base)).toMatch(/^Not entered yet/)
    }
    expect(yourFigure('housing', base)).toMatch(/^Not entered yet/)
    expect(yourFigure('pto', base)).toMatch(/counted at the 15-day norm: \$0 extra/)
  })

  it('shows entered terms with the figures that produced them', () => {
    const f: OfferFigures = {
      ...base,
      bonusPct: 10, annualBonus: 9_500, bonusEntered: true,
      matchRatePct: 100, matchUpToPct: 6, annual401kMatch: 5_700, matchEntered: true,
      annualHsa: 1_200, annualHealthcare: -1_800, benefitsEntered: true,
      rsuAnnual: 20_000, annualEspp: 1_425, equityEntered: true,
      ptoDays: 20, ptoValue: 1_827, ptoEntered: true,
      rentMonthly: 1_800, rentPct: 30,
    }
    expect(yourFigure('bonus', f)).toBe('$9,500 a year (a 10% target).')
    expect(yourFigure('match', f)).toBe('$5,700 a year (100% up to 6% of salary).')
    expect(yourFigure('hsa', f)).toBe('$1,200 into your HSA, −$1,800 in premiums: −$600 a year.')
    expect(yourFigure('equity', f)).toBe('$20,000 a year in stock, plus $1,425 from the ESPP discount.')
    expect(yourFigure('pto', f)).toBe('20 days, worth $1,827 a year above the 15-day norm.')
    expect(yourFigure('housing', f)).toBe('$1,800 a month, 30% of your take-home.')
  })

  it('is honest about time off at or under the norm', () => {
    expect(yourFigure('pto', { ...base, ptoDays: 10, ptoEntered: true })).toBe(
      '10 days, at or under the 15-day norm, so $0 extra.',
    )
  })
})
