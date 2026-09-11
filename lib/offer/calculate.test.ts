import { describe, expect, it } from 'vitest'

import { K401_EMPLOYEE_CAP } from '@/lib/allocator/constants'
import { computeOfferValue, MARKET_PTO_DAYS, type OfferInputs, type TaxResult } from './calculate'

/**
 * The offer calculation shipped for months with no test of any kind. These
 * cover the parts where being wrong is expensive rather than every line: the
 * match cap that a real benefits guide already broke, the pre-tax/after-tax
 * split, and the behaviour when /api/tax has not answered.
 */

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

/** A tax answer with a round 30% total burden, so the arithmetic is checkable. */
const taxAt = (salary: number): TaxResult => ({
  netIncomeAnnual: salary * 0.7,
  federalTaxAnnual: salary * 0.18,
  stateTaxAnnual: salary * 0.05,
  ficaTaxAnnual: salary * 0.07,
})

describe('computeOfferValue', () => {
  it('returns null rather than a package worth nothing when there is no salary', () => {
    expect(computeOfferValue(offer({ salary: 0 }), null)).toBeNull()
  })

  describe('the employer match', () => {
    it('is the matched deferral times the rate', () => {
      // 6% of 100k = 6,000 deferred, matched dollar for dollar.
      const v = computeOfferValue(offer(), taxAt(100_000))!
      expect(v.annual401kMatch).toBe(6_000)
    })

    it('halves when the employer pays 50 cents on the dollar', () => {
      const v = computeOfferValue(offer({ matchRatePct: 50 }), taxAt(100_000))!
      expect(v.annual401kMatch).toBe(3_000)
    })

    it('stops at the IRS deferral cap, not at the percentage in the letter', () => {
      /**
       * The case from the comment in calculate.ts: a benefits guide reading
       * "$0.30 on every $1 employee deferral up to 60% of salary". Taken at
       * face value that is 18% of pay — $27,000 on a $150,000 salary. You
       * cannot defer 60% of $150,000, because the cap stops you well before,
       * so the match stops with it.
       */
      const v = computeOfferValue(
        offer({ salary: 150_000, matchUpToPct: 60, matchRatePct: 30 }),
        taxAt(150_000),
      )!

      expect(v.annual401kMatch).toBe(K401_EMPLOYEE_CAP * 0.3)
      expect(v.annual401kMatch).toBeLessThan(150_000 * 0.6 * 0.3)
    })

    it('is uncapped below the limit, so ordinary offers are untouched', () => {
      // 6% of 80k is 4,800 — nowhere near the cap, so no clamping applies.
      const v = computeOfferValue(offer({ salary: 80_000 }), taxAt(80_000))!
      expect(v.annual401kMatch).toBe(4_800)
    })
  })

  describe('the package total', () => {
    it('adds bonus, match, HSA and equity, and subtracts the premium', () => {
      const v = computeOfferValue(
        offer({ hsaMonthly: 100, healthcarePremium: 200, rsuAnnual: 20_000 }),
        taxAt(100_000),
      )!

      // 100,000 + 10,000 bonus + 6,000 match + 1,200 HSA - 2,400 premium + 20,000 equity
      expect(v.totalPackage).toBe(134_800)
      expect(v.annualHealthcare).toBe(-2_400)
    })

    it('values PTO only above market, and counts it', () => {
      const atMarket = computeOfferValue(offer(), taxAt(100_000))!
      expect(atMarket.ptoValue).toBe(0)

      // Matching the market baseline is the going rate, not a benefit, and
      // neither is falling short of it — the value floors at zero rather than
      // going negative and quietly shrinking the package.
      const below = computeOfferValue(offer({ ptoDays: MARKET_PTO_DAYS - 5 }), taxAt(100_000))!
      expect(below.ptoValue).toBe(0)
      expect(below.totalPackage).toBe(atMarket.totalPackage)

      const above = computeOfferValue(offer({ ptoDays: MARKET_PTO_DAYS + 5 }), taxAt(100_000))!
      // Five days at 100,000 / 260 working days.
      expect(above.ptoValue).toBe(Math.round((100_000 / 260) * 5))
      expect(above.totalPackage).toBe(atMarket.totalPackage + above.ptoValue)
    })

    it('adds up to the rows the result screen lists', () => {
      /**
       * The regression this guards: the PTO row rendered in the list above the
       * total while the total left it out, so the lines on screen did not sum
       * to the figure printed under them.
       */
      const v = computeOfferValue(
        offer({ hsaMonthly: 100, healthcarePremium: 200, rsuAnnual: 25_000, showEspp: true, ptoDays: 25 }),
        taxAt(100_000),
      )!

      const rows = [
        100_000, v.annualBonus, v.annual401kMatch, v.annualHsa,
        v.annualHealthcare, 25_000, v.annualEspp, v.ptoValue,
      ]
      expect(rows.reduce((a, b) => a + b, 0)).toBe(v.totalPackage)
    })

    it('counts the ESPP only when the offer has one', () => {
      const without = computeOfferValue(offer(), taxAt(100_000))!
      const withEspp = computeOfferValue(offer({ showEspp: true }), taxAt(100_000))!

      expect(without.annualEspp).toBe(0)
      // 10% of salary at a 15% discount.
      expect(withEspp.annualEspp).toBe(1_500)
      expect(withEspp.totalPackage - without.totalPackage).toBe(1_500)
    })
  })

  describe('the signing bonus', () => {
    it('is left out of the per-year package and added to year one', () => {
      const v = computeOfferValue(offer({ signingBonus: 20_000 }), taxAt(100_000))!
      const without = computeOfferValue(offer(), taxAt(100_000))!

      // Folding a one-off into a figure labelled "per year" would make year one
      // right and every year after it wrong by exactly this amount.
      expect(v.totalPackage).toBe(without.totalPackage)
      expect(v.firstYearTotal).toBe(without.totalPackage + 20_000)
    })

    it('is taxed as income', () => {
      const v = computeOfferValue(offer({ signingBonus: 20_000 }), taxAt(100_000))!
      expect(v.signingBonusAfterTax).toBeCloseTo(20_000 * 0.7, 6)
    })

    it('leaves firstYearTotal equal to the package when there is none', () => {
      const v = computeOfferValue(offer(), taxAt(100_000))!
      expect(v.firstYearTotal).toBe(v.totalPackage)
    })
  })

  describe('after-tax figures', () => {
    it('taxes bonus and equity at the effective rate off the salary', () => {
      const v = computeOfferValue(offer({ rsuAnnual: 20_000 }), taxAt(100_000))!

      expect(v.effectiveTaxRate).toBeCloseTo(0.3, 10)
      expect(v.annualBonusAfterTax).toBeCloseTo(10_000 * 0.7, 6)
      expect(v.annualRsuAfterTax).toBeCloseTo(20_000 * 0.7, 6)
    })

    it('counts employer money in monthly wealth without taxing it', () => {
      const v = computeOfferValue(offer({ hsaMonthly: 100 }), taxAt(100_000))!

      // Employer contributions land whole: match and HSA are not reduced by the
      // employee's effective rate the way bonus and equity are.
      const takeHome = Math.round((100_000 * 0.7) / 12)
      const expected =
        Math.round((takeHome * 20) / 100) + (6_000 + 1_200) / 12 + (10_000 * 0.7) / 12
      expect(v.monthlyWealth).toBeCloseTo(expected, 6)
    })
  })

  describe('rent', () => {
    it('is a share of take-home, not of salary', () => {
      const v = computeOfferValue(offer({ rentMonthly: 2_000 }), taxAt(100_000))!
      const takeHome = Math.round((100_000 * 0.7) / 12)

      expect(v.rentPct).toBe(Math.round((2_000 / takeHome) * 100))
      // Against gross it would read far lower, which is the mistake this guards.
      expect(v.rentPct).toBeGreaterThan(Math.round((2_000 / (100_000 / 12)) * 100))
    })

    it('is null when no rent is known, rather than zero percent', () => {
      expect(computeOfferValue(offer(), taxAt(100_000))!.rentPct).toBeNull()
    })
  })

  describe('before /api/tax answers', () => {
    it('still produces a package, on the fallback rates', () => {
      const v = computeOfferValue(offer(), null)!

      expect(v.takeHomeMonthly).toBe(Math.round((100_000 * 0.72) / 12))
      expect(v.effectiveTaxRate).toBe(0.28)
      // Employer money does not depend on the tax answer, so it is already right.
      expect(v.annual401kMatch).toBe(6_000)
    })

    it('changes only the tax-dependent figures once it lands', () => {
      const pending = computeOfferValue(offer({ rsuAnnual: 10_000 }), null)!
      const settled = computeOfferValue(offer({ rsuAnnual: 10_000 }), taxAt(100_000))!

      expect(settled.totalPackage).toBe(pending.totalPackage)
      expect(settled.annual401kMatch).toBe(pending.annual401kMatch)
      expect(settled.takeHomeMonthly).not.toBe(pending.takeHomeMonthly)
    })
  })

  describe('comparing two offers', () => {
    it('separates what an offer pays from what it leaves you', () => {
      /**
       * The comparison the feature exists for: the bigger package can be the
       * one with less left over, once rent is in. B pays 20k more and still
       * leaves less each month.
       */
      const a = computeOfferValue(offer({ salary: 85_000, rentMonthly: 1_600 }), taxAt(85_000))!
      const b = computeOfferValue(offer({ salary: 105_000, rentMonthly: 3_300 }), taxAt(105_000))!

      expect(b.totalPackage).toBeGreaterThan(a.totalPackage)

      const leftA = a.takeHomeMonthly - 1_600
      const leftB = b.takeHomeMonthly - 3_300
      expect(leftB).toBeLessThan(leftA)
    })
  })
})
