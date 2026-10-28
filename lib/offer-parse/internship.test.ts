import { describe, expect, it } from 'vitest'

import {
  INTERNSHIP_FIELD_KEYS,
  internshipWeeks,
  mergeInternshipInputs,
  validateInternship,
  weeksBetween,
  ymdToDate,
} from './internship'

/**
 * The internship parse adds two shapes the offer parse never had — dates and a
 * perk list — and both are where a misread would reach the form looking
 * plausible. Every test here is about a value that must be DROPPED.
 */

const f = (value: unknown, quote = 'quoted line', confidence = 0.9) => ({ value, confidence, quote })

describe('weeksBetween', () => {
  it('reads a Monday-to-Friday term as the number on the letter', () => {
    expect(weeksBetween(20270601, 20270820)).toBe(12) // Tue Jun 1 – Fri Aug 20
    expect(weeksBetween(20270607, 20270813)).toBe(10)
    expect(weeksBetween(20270111, 20270430)).toBe(16) // a spring co-op
  })

  it('refuses a term that ends before it starts, or runs past a year', () => {
    expect(weeksBetween(20270820, 20270601)).toBeNull()
    expect(weeksBetween(20270601, 20270601)).toBeNull()
    expect(weeksBetween(20270101, 20290101)).toBeNull()
  })
})

describe('ymdToDate', () => {
  it('rejects dates that do not exist rather than rolling them over', () => {
    expect(ymdToDate(20270231)).toBeNull()
    expect(ymdToDate(20271301)).toBeNull()
    expect(ymdToDate(20270229)).toBeNull() // 2027 is not a leap year
    expect(ymdToDate(20280229)).not.toBeNull()
  })
})

describe('validateInternship', () => {
  it('keeps in-range fields with a quote and drops the rest', () => {
    const { parsed, rejected } = validateInternship({
      hourlyRate: f(32.5),
      hoursPerWeek: f(40),
      housingStipendMonthly: f(1_500),
      relocationAllowance: f(2_000, ''), // no quote
      monthlyStipend: f(4_000, 'q', 0.3), // low confidence
      termLumpSum: f(9_000_000), // out of range
    })
    expect(parsed.hourlyRate?.value).toBe(32.5)
    expect(parsed.hoursPerWeek?.value).toBe(40)
    expect(parsed.housingStipendMonthly?.value).toBe(1_500)
    expect(parsed.relocationAllowance).toBeUndefined()
    expect(parsed.monthlyStipend).toBeUndefined()
    expect(parsed.termLumpSum).toBeUndefined()
    expect(rejected.sort()).toEqual(['monthlyStipend', 'relocationAllowance', 'termLumpSum'])
  })

  it('drops an impossible date, and both dates when they make no term', () => {
    expect(validateInternship({ startDateYmd: f(20270231) }).parsed.startDateYmd).toBeUndefined()
    const backwards = validateInternship({ startDateYmd: f(20270820), endDateYmd: f(20270601) })
    expect(backwards.parsed.startDateYmd).toBeUndefined()
    expect(backwards.parsed.endDateYmd).toBeUndefined()
  })

  it('cannot carry a Social Security number in any numeric field', () => {
    // Nine digits fails every range here; the widest is an eight-digit date.
    for (const key of INTERNSHIP_FIELD_KEYS) {
      expect(validateInternship({ [key]: f(123456789) }).parsed[key]).toBeUndefined()
    }
  })

  it('drops a quote that still carries personal data', () => {
    const { parsed } = validateInternship({ hourlyRate: f(30, 'Pay for SSN 123-45-6789 is $30 an hour') })
    expect(parsed.hourlyRate).toBeUndefined()
  })

  it('keeps perks from the closed list only, once each', () => {
    const { parsed } = validateInternship({
      otherPerks: [
        { kind: 'wellness', quote: 'a $200 wellness stipend' },
        { kind: 'wellness', quote: 'wellness again' },
        { kind: 'yacht', quote: 'a yacht' },
        { kind: 'meals', quote: '' },
        { kind: 'meals', quote: 'lunch is provided daily' },
      ],
    })
    expect(parsed.otherPerks?.map((p) => p.kind)).toEqual(['wellness', 'meals'])
  })

  it('takes the housing-provided flag only as exactly 1', () => {
    expect(validateInternship({ housingProvided: f(1) }).parsed.housingProvided?.value).toBe(1)
    expect(validateInternship({ housingProvided: f(0) }).parsed.housingProvided).toBeUndefined()
    expect(validateInternship({ housingProvided: f(2) }).parsed.housingProvided).toBeUndefined()
  })
})

describe('internshipWeeks', () => {
  it('prefers a stated length to the dates', () => {
    const { parsed } = validateInternship({
      termWeeks: f(10),
      startDateYmd: f(20270601),
      endDateYmd: f(20270820),
    })
    expect(internshipWeeks(parsed)).toBe(10)
  })

  it('falls back to the dates, and to nothing', () => {
    expect(internshipWeeks(validateInternship({ startDateYmd: f(20270601), endDateYmd: f(20270820) }).parsed)).toBe(12)
    expect(internshipWeeks(validateInternship({ startDateYmd: f(20270601) }).parsed)).toBeNull()
  })
})

describe('mergeInternshipInputs', () => {
  it('keeps the higher-confidence field and concatenates perks across blocks', () => {
    const merged = mergeInternshipInputs([
      { hourlyRate: f(30, 'q', 0.7), otherPerks: [{ kind: 'meals', quote: 'lunch' }] },
      { hourlyRate: f(32, 'q', 0.95), otherPerks: [{ kind: 'gym', quote: 'gym' }] },
    ]) as { hourlyRate: { value: number }; otherPerks: unknown[] }
    expect(merged.hourlyRate.value).toBe(32)
    expect(merged.otherPerks).toHaveLength(2)
  })
})
