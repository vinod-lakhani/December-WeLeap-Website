import { describe, expect, it } from 'vitest'

import { MARKET_PTO_DAYS, type OfferInputs, type TaxResult } from './calculate'
import { askAmountFor, computeLevers } from './levers'

const BASE: OfferInputs = {
  salary: 100_000,
  bonusPct: 10,
  matchRatePct: 100,
  matchUpToPct: 6,
  hsaMonthly: 0,
  healthcarePremium: 0,
  rsuAnnual: 0,
  signingBonus: 0,
  showEspp: false,
  esppContrib: 10,
  esppDiscount: 15,
  ptoDays: MARKET_PTO_DAYS,
  rentMonthly: 0,
  savingsPct: 20,
}

const offer = (over: Partial<OfferInputs> = {}): OfferInputs => ({ ...BASE, ...over })

/** A flat 30% burden, so every figure below can be checked by hand. */
const taxAt = (salary: number): TaxResult => ({
  netIncomeAnnual: salary * 0.7,
  federalTaxAnnual: salary * 0.18,
  stateTaxAnnual: salary * 0.05,
  ficaTaxAnnual: salary * 0.07,
})

const byId = (inputs: OfferInputs, tax = taxAt(inputs.salary)) =>
  Object.fromEntries(computeLevers(inputs, tax).map((l) => [l.id, l]))

describe('askAmountFor', () => {
  it('scales with salary and stays a round number', () => {
    // 5% of 85,000 is 4,250, which rounds to a figure you can say out loud.
    expect(askAmountFor(85_000)).toBe(5_000)
    expect(askAmountFor(100_000)).toBe(5_000)
    expect(askAmountFor(200_000)).toBe(10_000)
    expect([2_500, 5_000, 7_500, 10_000]).toContain(askAmountFor(120_000))
  })

  it('never asks for something trivial or absurd', () => {
    // $5,000 is a real ask on $85,000 and a rounding error on $400,000; 5% of
    // $30,000 is $1,500, which is not worth opening a negotiation over.
    expect(askAmountFor(30_000)).toBe(2_500)
    expect(askAmountFor(1_000_000)).toBe(25_000)
  })
})

describe('computeLevers', () => {
  it('offers nothing without a salary to price against', () => {
    expect(computeLevers(offer({ salary: 0 }), null)).toEqual([])
  })

  describe('more base', () => {
    it('is worth the raise after tax, monthly', () => {
      const { base } = byId(offer())

      expect(base.cadence).toBe('monthly')
      // $5,000 at a 30% burden, spread over twelve months.
      expect(base.amount).toBeCloseTo((5_000 * 0.7) / 12, 6)
      expect(base.ask).toBe('Ask for $5,000 more base')
    })

    it('says what it drags up with it', () => {
      // A 10% bonus and a 6% match mean $5,000 of base is worth more than
      // $5,000 on the package — that is the part people do not price.
      const { base } = byId(offer())
      expect(base.detail).toContain('bonus and match')
      expect(base.detail).toContain('$5,800')
    })

    it('drops that claim when there is no bonus or match to drag', () => {
      const { base } = byId(offer({ bonusPct: 0, matchUpToPct: 0 }))
      expect(base.detail).not.toContain('bonus and match')
      expect(base.detail).toContain('every future raise')
    })
  })

  describe('a better match', () => {
    it('asks for the band when the band is the weak half', () => {
      const { match } = byId(offer({ matchRatePct: 100, matchUpToPct: 3 }))

      expect(match.ask).toContain('6% of salary')
      expect(match.cadence).toBe('annual')
      // 3% to 6% of $100,000, matched dollar for dollar.
      expect(match.amount).toBe(3_000)
    })

    it('asks for the rate when the band is already fine', () => {
      const { match } = byId(offer({ matchRatePct: 50, matchUpToPct: 6 }))

      expect(match.ask).toContain('dollar for dollar')
      // 50% to 100% of a 6% deferral on $100,000.
      expect(match.amount).toBe(3_000)
    })

    it('is not offered at all when the match is already strong', () => {
      // Asking for a match you already have is not advice.
      expect(byId(offer({ matchRatePct: 100, matchUpToPct: 6 })).match).toBeUndefined()
      expect(byId(offer({ matchRatePct: 100, matchUpToPct: 8 })).match).toBeUndefined()
    })

    it('respects the IRS cap rather than promising uncapped employer money', () => {
      // At $600,000, 6% of salary is past the deferral limit, so moving the
      // band from 3% cannot be worth the full 3% of pay.
      const { match } = byId(offer({ salary: 600_000, matchUpToPct: 3 }))
      expect(match.amount).toBeLessThan(600_000 * 0.03)
    })
  })

  describe('a signing bonus', () => {
    it('is worth the ask after tax, once', () => {
      const { signing } = byId(offer())

      expect(signing.cadence).toBe('once')
      expect(signing.amount).toBeCloseTo(5_000 * 0.7, 6)
      expect(signing.ask).toBe('Ask for a $5,000 signing bonus')
    })

    it('asks for more when the offer already has one', () => {
      const { signing } = byId(offer({ signingBonus: 10_000 }))
      expect(signing.ask).toBe('Ask for $5,000 more signing bonus')
    })
  })

  it('orders them so the recurring ask comes before the one-off', () => {
    const ids = computeLevers(offer({ matchUpToPct: 3 }), taxAt(100_000)).map((l) => l.id)
    expect(ids).toEqual(['base', 'match', 'signing'])
  })

  it('prices everything before /api/tax answers, on the fallback rate', () => {
    const { base, signing } = byId(offer(), null as unknown as TaxResult)

    expect(base.amount).toBeCloseTo((5_000 * 0.72) / 12, 6)
    expect(signing.amount).toBeCloseTo(5_000 * 0.72, 6)
  })
})
