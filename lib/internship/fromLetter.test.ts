import { describe, expect, it } from 'vitest'

import { validateInternship } from '@/lib/offer-parse/internship'
import { inputsFromLetter } from './fromLetter'

const f = (value: unknown) => ({ value, confidence: 0.9, quote: 'line' })
const from = (raw: Record<string, unknown>) => inputsFromLetter(validateInternship(raw).parsed)

describe('inputsFromLetter', () => {
  it('fills pay, term from dates, state and a monthly housing stipend', () => {
    const { patch, fields } = from({
      hourlyRate: f(32),
      hoursPerWeek: f(40),
      startDateYmd: f(20270601),
      endDateYmd: f(20270820),
      workStateCode: { value: 'CA', confidence: 0.9, quote: 'San Jose, California' },
      housingStipendMonthly: f(1_500),
    })
    expect(patch).toMatchObject({ payShape: 'hourly', hourlyRate: 32, hoursPerWeek: 40, weeks: 12, state: 'CA', housing: 'stipend', housingStipendMonthly: 1_500 })
    expect(fields).toEqual(['pay', 'hours', 'weeks', 'state', 'housing_stipend'])
  })

  it('puts a one-time housing payment in the one-off allowance, beside relocation', () => {
    const { patch } = from({ monthlyStipend: f(5_000), housingLumpSum: f(3_000), relocationAllowance: f(1_000) })
    expect(patch.payShape).toBe('monthly')
    expect(patch.relocation).toBe(4_000)
    expect(patch.housing).toBeUndefined()
    expect(patch.housingStipendMonthly).toBeUndefined()
  })

  it('marks provided housing and ignores a stipend beside it', () => {
    const { patch } = from({ termLumpSum: f(12_000), housingProvided: f(1), housingStipendMonthly: f(900) })
    expect(patch).toMatchObject({ payShape: 'lump', lumpSum: 12_000, housing: 'provided' })
    expect(patch.housingStipendMonthly).toBeUndefined()
  })

  it('never fills in a match term the letter did not state', () => {
    const rateOnly = from({ hourlyRate: f(30), matchRatePct: f(50) })
    expect(rateOnly.patch.matchRatePct).toBe(50)
    expect(rateOnly.patch.matchUpToPct).toBeUndefined()
    expect(rateOnly.patch.contributionPct).toBeUndefined()

    const both = from({ hourlyRate: f(30), matchRatePct: f(100), matchUpToPct: f(4) })
    expect(both.patch).toMatchObject({ matchRatePct: 100, matchUpToPct: 4, contributionPct: 4 })
  })

  it('sets nothing it was not given', () => {
    expect(from({})).toEqual({ patch: {}, fields: [] })
  })
})
