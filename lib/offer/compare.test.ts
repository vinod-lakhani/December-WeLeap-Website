import { describe, expect, it } from 'vitest'

import { computeOfferValue, MARKET_PTO_DAYS, type OfferInputs, type TaxResult } from './calculate'
import { compareOffers, leftAfterRent, type OfferSide } from './compare'

const BASE: OfferInputs = {
  salary: 100_000,
  bonusPct: 10,
  matchRatePct: 100,
  matchUpToPct: 6,
  hsaMonthly: 0,
  healthcarePremium: 0,
  rsuAnnual: 0,
  showEspp: false,
  esppContrib: 10,
  esppDiscount: 15,
  ptoDays: MARKET_PTO_DAYS,
  rentMonthly: 0,
  savingsPct: 20,
}

/** A tax answer at a round total burden, so the arithmetic stays checkable. */
const taxAt = (salary: number, rate = 0.3): TaxResult => ({
  netIncomeAnnual: salary * (1 - rate),
  federalTaxAnnual: salary * (rate - 0.12),
  stateTaxAnnual: salary * 0.05,
  ficaTaxAnnual: salary * 0.07,
})

/**
 * @param rate Total effective tax burden for this offer's state. Defaults to a
 *   flat 30% where the state is not the point; the Texas/California case passes
 *   its own, because "take-home in each offer's own state" is one of the four
 *   numbers this feature exists to work out.
 */
function side(
  label: string,
  location: string,
  over: Partial<OfferInputs>,
  rate = 0.3,
): OfferSide {
  const inputs: OfferInputs = { ...BASE, ...over }
  return { label, location, inputs, value: computeOfferValue(inputs, taxAt(inputs.salary, rate))! }
}

describe('compareOffers', () => {
  describe('the comparison the feature exists for', () => {
    /**
     * The mockup's case, and the one the page currently asks people to work out
     * with a pen: Austin against San Francisco. B pays more and leaves less.
     */
    const austin = side('Offer A', 'Austin, TX', { salary: 85_000, rentMonthly: 1_600 }, 0.24)
    const sf = side('Offer B', 'San Francisco, CA', { salary: 105_000, rentMonthly: 3_300 }, 0.34)

    it('names the bigger package and the better month separately', () => {
      const c = compareOffers(austin, sf)

      expect(c.totals.winner).toBe('b')
      expect(c.leftAfterRent.winner).toBe('a')
      expect(c.verdict!.split).toBe(true)
      expect(c.verdict!.paper).toContain('Offer B')
      expect(c.verdict!.paper).toContain('more a year on paper')
      expect(c.verdict!.monthly).toContain('Offer A')
      expect(c.verdict!.monthly).toContain('more a month after rent')
    })

    it('measures what is left from take-home in each state, not from salary', () => {
      const c = compareOffers(austin, sf)

      expect(c.leftAfterRent.a).toBe(Math.round((85_000 * 0.76) / 12) - 1_600)
      expect(c.leftAfterRent.b).toBe(Math.round((105_000 * 0.66) / 12) - 3_300)
      expect(c.leftAfterRent.a).toBeGreaterThan(c.leftAfterRent.b)

      /**
       * On gross the two look near enough level — about $30 a month between
       * them. Tax and rent turn that into hundreds. The gross view does not
       * point the wrong way here so much as it hides how big the gap is, which
       * is the more common way a base-salary comparison misleads.
       */
      const grossGap = 85_000 / 12 - 1_600 - (105_000 / 12 - 3_300)
      expect(Math.abs(grossGap)).toBeLessThan(50)
      expect(c.leftAfterRent.a - c.leftAfterRent.b).toBeGreaterThan(500)
    })
  })

  describe('when the two agree', () => {
    it('does not manufacture a tension', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 85_000, rentMonthly: 1_600 })
      const b = side('Offer B', 'Dallas, TX', { salary: 105_000, rentMonthly: 1_700 })

      const c = compareOffers(a, b)
      expect(c.totals.winner).toBe('b')
      expect(c.leftAfterRent.winner).toBe('b')
      expect(c.verdict!.split).toBe(false)
    })
  })

  describe('near-identical offers', () => {
    it('calls a package difference under the noise floor a tie', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 100_000, rentMonthly: 1_600 })
      const b = side('Offer B', 'Dallas, TX', { salary: 100_200, rentMonthly: 1_600 })

      const c = compareOffers(a, b)
      // $200 of base is a rounding difference, not a better offer.
      expect(c.totals.winner).toBe('tie')
      expect(c.verdict!.paper).toContain('about the same')
      expect(c.verdict!.split).toBe(false)
    })

    it('calls a monthly difference under the noise floor a tie', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 100_000, rentMonthly: 1_600 })
      const b = side('Offer B', 'Dallas, TX', { salary: 100_000, rentMonthly: 1_610 })

      const c = compareOffers(a, b)
      expect(c.leftAfterRent.winner).toBe('tie')
      expect(c.verdict!.monthly).toContain('about the same')
    })

    it('never reports a split when either side is a tie', () => {
      // A clear package win, but the months are level. Nothing is in tension.
      const a = side('Offer A', 'Austin, TX', { salary: 100_000, rentMonthly: 1_600 })
      const b = side('Offer B', 'Dallas, TX', { salary: 120_000, rentMonthly: 1_600 + 1_167 })

      const c = compareOffers(a, b)
      expect(c.totals.winner).toBe('b')
      expect(c.leftAfterRent.winner).toBe('tie')
      expect(c.verdict!.split).toBe(false)
    })
  })

  describe('without rent for both offers', () => {
    it('withholds the verdict rather than comparing salaries', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 85_000, rentMonthly: 1_600 })
      const b = side('Offer B', '', { salary: 105_000, rentMonthly: 0 })

      const c = compareOffers(a, b)
      // The rows still render — the verdict is what needs both cities.
      expect(c.packageRows.length).toBeGreaterThan(0)
      expect(c.totals.winner).toBe('b')
      expect(c.verdict).toBeNull()
    })
  })

  describe('the rows', () => {
    it('counts equity and PTO, each on its own line', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 100_000 })
      const b = side('Offer B', 'Dallas, TX', {
        salary: 100_000,
        rsuAnnual: 25_000,
        ptoDays: MARKET_PTO_DAYS + 10,
      })

      const c = compareOffers(a, b)
      const equity = c.packageRows.find((r) => r.label.startsWith('Equity'))!
      const pto = c.packageRows.find((r) => r.label.startsWith('Paid time off'))!

      expect(equity.b).toBe(25_000)
      expect(pto.b).toBe(Math.round((100_000 / 260) * 10))

      // Same base, and B is ahead by exactly the equity and the leave.
      expect(c.totals.winner).toBe('b')
      expect(c.totals.delta).toBe(25_000 + pto.b)
    })

    it('sums its own package rows into the total it reports', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 100_000 })
      const b = side('Offer B', 'Dallas, TX', {
        salary: 120_000, rsuAnnual: 25_000, hsaMonthly: 100,
        healthcarePremium: 200, ptoDays: 25, showEspp: true,
      })

      const c = compareOffers(a, b)
      const sum = (k: 'a' | 'b') => c.packageRows.reduce((t, r) => t + r[k], 0)

      expect(sum('a')).toBe(c.totals.a)
      expect(sum('b')).toBe(c.totals.b)
    })

    it('carries the premium through as a cost', () => {
      const a = side('Offer A', 'Austin, TX', { salary: 100_000 })
      const b = side('Offer B', 'Dallas, TX', { salary: 100_000, healthcarePremium: 300 })

      const c = compareOffers(a, b)
      const premium = c.packageRows.find((r) => r.label.startsWith('Healthcare'))!

      expect(premium.negative).toBe(true)
      expect(premium.b).toBe(-3_600)
      expect(c.totals.delta).toBe(-3_600)
      expect(c.totals.winner).toBe('a')
    })
  })
})

describe('leftAfterRent', () => {
  it('is take-home minus rent, and can go negative', () => {
    const inputs: OfferInputs = { ...BASE, salary: 60_000, rentMonthly: 4_000 }
    const value = computeOfferValue(inputs, taxAt(60_000))!

    expect(leftAfterRent(value, inputs)).toBe(Math.round((60_000 * 0.7) / 12) - 4_000)
    expect(leftAfterRent(value, inputs)).toBeLessThan(0)
  })
})
