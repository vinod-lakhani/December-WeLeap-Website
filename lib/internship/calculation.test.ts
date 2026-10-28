import { describe, expect, it } from 'vitest'

import { federalTax, ficaTax } from '@/lib/firstPaycheck/calculation'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import {
  computeInternship,
  emptyInternship,
  termWages,
  OVERTIME_MULTIPLIER,
  SUPPLEMENTAL_FEDERAL_RATE,
  WEEKS_PER_MONTH,
  type InternshipInputs,
} from './calculation'

/**
 * The two numbers this tool exists to get right are the gap between what
 * payroll withholds and what is owed, and the tax on a cash housing stipend.
 * Every figure here is derived from the same bracket, deduction and FICA
 * functions the first-paycheck tool reads, so the assertions reconstruct the
 * expected value from those rather than from a number typed into the test.
 */

const base = (over: Partial<InternshipInputs> = {}): InternshipInputs => ({
  ...emptyInternship(),
  hourlyRate: 25,
  state: 'TX',
  ...over,
})

describe('termWages', () => {
  it('prices the three shapes pay arrives in', () => {
    expect(termWages(base())).toBe(25 * 40 * 12)
    expect(termWages(base({ payShape: 'monthly', monthlyStipend: 4_000 }))).toBeCloseTo(4_000 * (12 / WEEKS_PER_MONTH), 6)
    expect(termWages(base({ payShape: 'lump', lumpSum: 15_000 }))).toBe(15_000)
  })

  it('pays overtime at time and a half, hourly only', () => {
    const with5 = termWages(base({ overtimeHoursPerWeek: 5 }))
    expect(with5).toBe((25 * 40 + 25 * OVERTIME_MULTIPLIER * 5) * 12)
    // A stipend is a stipend; overtime hours on it change nothing.
    expect(termWages(base({ payShape: 'monthly', monthlyStipend: 4_000, overtimeHoursPerWeek: 5 }))).toBe(
      termWages(base({ payShape: 'monthly', monthlyStipend: 4_000 }))
    )
  })

  it('is zero without a term or a rate, so no result can exist before input', () => {
    expect(termWages(base({ weeks: 0 }))).toBe(0)
    expect(termWages(base({ hourlyRate: 0 }))).toBe(0)
    expect(computeInternship(emptyInternship())).toBeNull()
  })
})

describe('computeInternship: withholding versus what is owed', () => {
  it('withholds as though the rate continued all year, and owes on the term alone', () => {
    const r = computeInternship(base())!
    expect(r.wages).toBe(12_000)
    expect(r.annualised).toBe(52_000)

    const annualisedTaxable = 52_000 - STANDARD_DEDUCTION_2026_SINGLE
    expect(r.withheld.federal).toBeCloseTo(federalTax(annualisedTaxable) * (12 / 52), 6)
    // $12,000 is under the standard deduction: nothing is owed federally.
    expect(r.owed.federal).toBe(0)
    expect(r.refund).toBeCloseTo(r.withheld.federal, 6)
  })

  it('never refunds FICA', () => {
    const r = computeInternship(base())!
    expect(r.withheld.fica).toBeCloseTo(ficaTax(12_000), 6)
    expect(r.owed.fica).toBeCloseTo(ficaTax(12_000), 6)
    // The refund is federal + state only; FICA cancels.
    expect(r.refund).toBeCloseTo(r.withheld.federal - r.owed.federal + r.withheld.state - r.owed.state, 6)
  })

  it('is never over-refunded: what is owed cannot exceed what was withheld', () => {
    for (const rate of [12, 25, 45, 80]) {
      for (const weeks of [8, 12, 16, 26]) {
        for (const state of ['TX', 'CA', 'NY', 'ZZ']) {
          const r = computeInternship(base({ hourlyRate: rate, weeks, state }))!
          expect(r.withheld.total + 1e-6).toBeGreaterThanOrEqual(r.owed.total)
          expect(r.refund).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('take-home is gross less what payroll takes, not less what is owed', () => {
    const r = computeInternship(base())!
    expect(r.takeHome).toBeCloseTo(r.gross - r.withheld.total, 6)
    expect(r.takeHome).toBeLessThan(r.gross - r.owed.total)
  })

  it('applies the state rate to the same base as federal, once a state is set', () => {
    const tx = computeInternship(base({ state: 'TX' }))!
    const ca = computeInternship(base({ state: 'CA' }))!
    expect(tx.withheld.state).toBe(0)
    expect(ca.withheld.state).toBeGreaterThan(0)
    expect(ca.stateNamed).toBe(true)
    expect(computeInternship(base({ state: '' }))!.stateNamed).toBe(false)
  })
})

describe('computeInternship: housing and allowances', () => {
  it('taxes a cash housing stipend as wages', () => {
    const none = computeInternship(base())!
    const stip = computeInternship(base({ housing: 'stipend', housingStipendMonthly: 1_500, rentMonthly: 1_500 }))!
    const months = 12 / WEEKS_PER_MONTH
    expect(stip.housingStipend).toBeCloseTo(1_500 * months, 6)
    expect(stip.gross).toBeCloseTo(none.gross + 1_500 * months, 6)
    // More withheld, not the same: the stipend went through payroll.
    expect(stip.withheld.total).toBeGreaterThan(none.withheld.total)
  })

  it('taxes a relocation allowance at the supplemental flat rate for withholding', () => {
    const none = computeInternship(base())!
    const relo = computeInternship(base({ relocation: 2_000 }))!
    expect(relo.gross).toBe(none.gross + 2_000)
    expect(relo.withheld.federal).toBeCloseTo(none.withheld.federal + 2_000 * SUPPLEMENTAL_FEDERAL_RATE, 6)
    expect(relo.withheld.fica).toBeCloseTo(ficaTax(14_000), 6)
  })

  it('charges rent for the term, and nothing when the employer provides housing', () => {
    const months = 12 / WEEKS_PER_MONTH
    const self = computeInternship(base({ housing: 'self', rentMonthly: 1_800 }))!
    expect(self.housingCost).toBeCloseTo(1_800 * months, 6)
    expect(self.leftAfterHousing).toBeCloseTo(self.takeHome - 1_800 * months, 6)
    expect(self.upfrontCash).toBe(3_600)

    const provided = computeInternship(base({ housing: 'provided', rentMonthly: 1_800 }))!
    expect(provided.housingCost).toBe(0)
    expect(provided.upfrontCash).toBe(0)
    expect(provided.leftAfterHousing).toBeCloseTo(provided.takeHome, 6)
  })

  it('still charges rent alongside a stipend — the stipend is income, not free housing', () => {
    const months = 12 / WEEKS_PER_MONTH
    const r = computeInternship(base({ housing: 'stipend', housingStipendMonthly: 1_500, rentMonthly: 1_800 }))!
    expect(r.housingCost).toBeCloseTo(1_800 * months, 6)
  })
})

describe('computeInternship: the term', () => {
  it('scales with weeks, and the months follow', () => {
    const twelve = computeInternship(base({ weeks: 12 }))!
    const sixteen = computeInternship(base({ weeks: 16 }))!
    expect(sixteen.wages).toBeCloseTo(twelve.wages * (16 / 12), 6)
    expect(sixteen.months).toBeCloseTo(16 / WEEKS_PER_MONTH, 6)
    expect(sixteen.annualised).toBe(twelve.annualised)
  })
})

describe('computeInternship: 401(k)', () => {
  const withPlan = (over: Partial<InternshipInputs> = {}) =>
    base({ hourlyRate: 30, matchRatePct: 100, matchUpToPct: 5, contributionPct: 5, ...over })

  it('changes nothing when there is no plan', () => {
    const r = computeInternship(base())!
    expect(r.deferral).toBe(0)
    expect(r.employerMatch).toBe(0)
    expect(r.matchLeftBehind).toBe(0)
    expect(r.retirementLater).toBe(0)
  })

  it('defers from pay and matches up to the cap', () => {
    const r = computeInternship(withPlan())!
    // $30 × 40 × 12 = $14,400; 5% of it.
    expect(r.deferral).toBeCloseTo(720, 6)
    expect(r.employerMatch).toBeCloseTo(720, 6)
    expect(r.matchLeftBehind).toBe(0)
  })

  it('reports the match left behind by contributing under the cap', () => {
    const r = computeInternship(withPlan({ contributionPct: 2 }))!
    expect(r.employerMatch).toBeCloseTo(14_400 * 0.02, 6)
    expect(r.matchLeftBehind).toBeCloseTo(14_400 * 0.03, 6)
  })

  it('stops matching at the cap, however much you put in', () => {
    const r = computeInternship(withPlan({ contributionPct: 15 }))!
    expect(r.deferral).toBeCloseTo(14_400 * 0.15, 6)
    expect(r.employerMatch).toBeCloseTo(14_400 * 0.05, 6)
  })

  it('applies a partial match rate', () => {
    const r = computeInternship(withPlan({ matchRatePct: 50, matchUpToPct: 6, contributionPct: 6 }))!
    expect(r.employerMatch).toBeCloseTo(14_400 * 0.06 * 0.5, 6)
  })

  it('matches pay only, never a stipend or an allowance', () => {
    const plain = computeInternship(withPlan())!
    const extras = computeInternship(withPlan({ housing: 'stipend', housingStipendMonthly: 1_500, relocation: 2_000 }))!
    expect(extras.deferral).toBeCloseTo(plain.deferral, 6)
    expect(extras.employerMatch).toBeCloseTo(plain.employerMatch, 6)
  })

  it('lowers income tax but not FICA, and comes out of what lands', () => {
    const none = computeInternship(base({ hourlyRate: 30, state: 'CA' }))!
    const plan = computeInternship(withPlan({ state: 'CA' }))!
    expect(plan.withheld.fica).toBeCloseTo(none.withheld.fica, 6)
    expect(plan.withheld.federal).toBeLessThan(none.withheld.federal)
    expect(plan.withheld.state).toBeLessThan(none.withheld.state)
    // Lands less, but by less than the deferral — the tax saving is the difference.
    const drop = none.takeHome - plan.takeHome
    expect(drop).toBeLessThan(plan.deferral)
    expect(drop).toBeGreaterThan(0)
    expect(plan.takeHome).toBeCloseTo(plan.gross - plan.withheld.total - plan.deferral, 6)
  })

  it('keeps the refund honest with a deferral — owed never exceeds withheld', () => {
    for (const contributionPct of [0, 3, 6, 15]) {
      const r = computeInternship(withPlan({ contributionPct, state: 'NY' }))!
      expect(r.withheld.total + 1e-6).toBeGreaterThanOrEqual(r.owed.total)
    }
  })

  it('compounds one summer of contributions and match at 7% for 40 years', () => {
    const r = computeInternship(withPlan())!
    expect(r.retirementLater).toBeCloseTo(1_440 * Math.pow(1.07, 40), 4)
  })
})
