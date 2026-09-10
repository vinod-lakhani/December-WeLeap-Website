/**
 * These numbers get typed into a payroll portal, so the tests are written
 * against the arithmetic a reader could check by hand rather than against
 * whatever the implementation happens to return.
 */

import { describe, it, expect } from 'vitest'
import {
  computeFirstPaycheck,
  marginalFederalRate,
  federalTax,
  taxableIncome,
  enrollmentDeadline,
} from './calculation'
import { STANDARD_DEDUCTION_2026_SINGLE, ROTH_BREAKEVEN_RATE } from './constants'

const base = {
  salaryAnnual: 72_000,
  stateCode: 'TX',
  payFrequency: 'semimonthly' as const,
  matchRatePct: 100,
  matchCapPct: 4,
  hsaEligible: false,
}

describe('marginal rate', () => {
  it('reads the bracket the next dollar falls in, not an average', () => {
    // 2026 single: 22% starts at $50,401 of taxable income.
    expect(marginalFederalRate(50_400)).toBe(0.12)
    expect(marginalFederalRate(50_401)).toBe(0.22)
    expect(marginalFederalRate(105_700)).toBe(0.22)
    expect(marginalFederalRate(105_701)).toBe(0.24)
  })

  it('sums federal tax bracket by bracket rather than applying one rate', () => {
    // $12,400 at 10% = $1,240, then the rest of $50,400 at 12%.
    expect(federalTax(12_400)).toBeCloseTo(1_240, 2)
    expect(federalTax(50_400)).toBeCloseTo(1_240 + (50_400 - 12_400) * 0.12, 2)
  })
})

describe('the worked example from the design', () => {
  // $72,000, single, Texas, twice a month, 100% match up to 4%, no HSA.
  const plan = computeFirstPaycheck(base)

  it('types the match cap into the 401(k) box', () => {
    expect(plan.contributionPct).toBe(4)
    // 4% of $72,000 over 24 periods.
    expect(plan.contributionPerCheck).toBeCloseTo((72_000 * 0.04) / 24, 2)
    expect(plan.contributionPerCheck).toBeCloseTo(120, 2)
  })

  it('lands in the 22% bracket, so pre-tax beats Roth', () => {
    // $72,000 − $16,100 standard deduction − $2,880 deferral = $53,020 taxable,
    // which is above the $50,400 top of the 12% band.
    expect(taxableIncome(72_000, 2_880)).toBeCloseTo(72_000 - 2_880 - STANDARD_DEDUCTION_2026_SINGLE, 2)
    expect(plan.marginalRate).toBe(0.22)
    expect(plan.rothOrTraditional).toBe('Traditional')
  })

  it('costs less out of take-home than it puts in, by the tax it saves', () => {
    // $120 pre-tax at 22% federal and no Texas income tax = about $94.
    expect(plan.contributionCostPerCheck).toBeCloseTo(120 * (1 - 0.22), 1)
    expect(Math.round(plan.contributionCostPerCheck)).toBe(94)
  })

  it('names the match as the annual figure it is', () => {
    expect(plan.employerMatchAnnual).toBeCloseTo(72_000 * 0.04, 2)
    expect(plan.employerMatchAnnual).toBeCloseTo(2_880, 2)
  })
})

describe('Roth versus traditional', () => {
  it('flips to Roth below the 22% line', () => {
    // $55,000 − $16,100 − $2,200 = $36,700 taxable, inside the 12% band.
    const plan = computeFirstPaycheck({ ...base, salaryAnnual: 55_000 })
    expect(plan.marginalRate).toBeLessThan(ROTH_BREAKEVEN_RATE)
    expect(plan.rothOrTraditional).toBe('Roth')
  })

  it('reads the bracket AFTER the deferral, since that is what can move it', () => {
    // Gross puts this person in 22%; the deferral and HSA pull them under it.
    // Reading the rate before the deferral would give the opposite answer.
    // $70,000: without the HSA, taxable is $51,100 and the rate is 22%. Add the
    // $2,500 HSA starting point and it drops to $48,600, under the $50,400 top
    // of the 12% band. Same person, opposite answer, decided entirely by the
    // deferral — which is why the bracket is read after it and not before.
    const withoutHsa = computeFirstPaycheck({ ...base, salaryAnnual: 70_000, hsaEligible: false })
    const withHsa = computeFirstPaycheck({ ...base, salaryAnnual: 70_000, hsaEligible: true })
    expect(withoutHsa.marginalRate).toBe(0.22)
    expect(withHsa.marginalRate).toBe(0.12)
    expect(withHsa.rothOrTraditional).toBe('Roth')
  })
})

describe('an HSA dollar is cheaper than a 401(k) dollar', () => {
  it('by exactly FICA, because the 401(k) does not escape it', () => {
    // The most common error in this arithmetic is treating them the same.
    const plan = computeFirstPaycheck({ ...base, salaryAnnual: 120_000, hsaEligible: true })
    const perDollar401k = plan.contributionCostPerCheck / plan.contributionPerCheck
    const perDollarHsa = plan.hsaCostPerCheck / plan.hsaPerCheck
    expect(perDollar401k - perDollarHsa).toBeCloseTo(0.0765, 4)
  })

  it('recommends a starting point rather than the legal maximum', () => {
    // Week one of a first job is the wrong moment to divert the full limit:
    // the deductible is what the HSA is for. This uses the same figure the
    // money plan uses for somebody starting from zero, so the two tools cannot
    // hand the same person different numbers.
    const plan = computeFirstPaycheck({ ...base, hsaEligible: true })
    expect(plan.hsaAnnualTarget).toBe(2_500)
    expect(plan.hsaAnnualTarget).toBeLessThan(plan.hsaCeilingAnnual)
    expect(Math.round(plan.hsaPerCheck)).toBe(104)
  })

  it('splits the recommended amount across the real number of periods', () => {
    const monthly = computeFirstPaycheck({ ...base, payFrequency: 'monthly', hsaEligible: true })
    const biweekly = computeFirstPaycheck({ ...base, payFrequency: 'biweekly', hsaEligible: true })
    expect(monthly.hsaPerCheck * 12).toBeCloseTo(monthly.hsaAnnualTarget, 2)
    expect(biweekly.hsaPerCheck * 26).toBeCloseTo(biweekly.hsaAnnualTarget, 2)
    // Semi-monthly is 24 and biweekly is 26. They are not the same thing.
    expect(biweekly.periodsPerYear).toBe(26)
    expect(computeFirstPaycheck(base).periodsPerYear).toBe(24)
  })
})

describe('limits and edges', () => {
  it('never recommends past the IRS employee limit', () => {
    // A 60% match cap on a high salary would otherwise ask for far too much.
    const plan = computeFirstPaycheck({ ...base, salaryAnnual: 400_000, matchCapPct: 60 })
    expect((400_000 * plan.contributionPct) / 100).toBeLessThanOrEqual(24_500 + 0.01)
  })

  it('recommends nothing into a plan with no match', () => {
    const plan = computeFirstPaycheck({ ...base, matchCapPct: 0 })
    expect(plan.contributionPct).toBe(0)
    expect(plan.employerMatchAnnual).toBe(0)
  })

  it('handles a half match without doubling the employer half', () => {
    const plan = computeFirstPaycheck({ ...base, matchRatePct: 50, matchCapPct: 6 })
    expect(plan.contributionPct).toBe(6)
    expect(plan.employerMatchAnnual).toBeCloseTo(72_000 * 0.06 * 0.5, 2)
  })
})

describe('the enrollment window', () => {
  it('is thirty days from the start date', () => {
    expect(enrollmentDeadline('2026-09-22')).toBe('2026-10-22')
  })

  it('crosses a month boundary correctly rather than adding to the day number', () => {
    expect(enrollmentDeadline('2026-01-20')).toBe('2026-02-19')
    expect(enrollmentDeadline('2026-12-15')).toBe('2027-01-14')
  })

  it('is null without a start date, so nothing invents a deadline', () => {
    expect(enrollmentDeadline(null)).toBeNull()
    expect(enrollmentDeadline('not a date')).toBeNull()
  })
})
