import { describe, it, expect } from 'vitest'
import { validateExtraction } from './validate'

const ok = (value: number | string, quote = 'Annual base salary: $145,000') => ({
  value,
  confidence: 0.95,
  quote,
})

describe('validateExtraction — what gets through', () => {
  it('accepts a well-formed field', () => {
    const { parsed } = validateExtraction({ baseSalaryAnnual: ok(145000) })
    expect(parsed.baseSalaryAnnual).toEqual({
      value: 145000,
      confidence: 0.95,
      quote: 'Annual base salary: $145,000',
    })
  })

  it('accepts a state code from the form’s own list', () => {
    const { parsed } = validateExtraction({
      workStateCode: ok('CA', 'This position is based in San Francisco, California'),
    })
    expect(parsed.workStateCode?.value).toBe('CA')
  })

  it('keeps the fields that pass when a sibling fails', () => {
    const { parsed, rejected } = validateExtraction({
      baseSalaryAnnual: ok(145000),
      ptoDays: ok(9999, 'unlimited PTO'),
    })
    expect(parsed.baseSalaryAnnual?.value).toBe(145000)
    expect(parsed.ptoDays).toBeUndefined()
    expect(rejected).toEqual(['ptoDays'])
  })

  it('carries a tiered match through as the blended rate', () => {
    const quote = 'the Company matches 100% of the first 3% and 50% of the next 2%'
    const { parsed } = validateExtraction({
      matchRatePct: { value: 80, confidence: 0.9, quote },
      matchUpToPct: { value: 5, confidence: 0.9, quote },
    })
    expect(parsed.matchRatePct?.value).toBe(80)
    expect(parsed.matchUpToPct?.value).toBe(5)
  })
})

describe('validateExtraction — what gets dropped', () => {
  it.each([
    ['a salary below the floor', { baseSalaryAnnual: ok(4) }],
    ['a salary above the ceiling', { baseSalaryAnnual: ok(40_000_000) }],
    ['a nine-digit number in a money field', { baseSalaryAnnual: ok(123456789) }],
    ['a PTO count that is not whole', { ptoDays: ok(15.5) }],
    ['a percentage past its ceiling', { esppDiscountPct: ok(90) }],
    ['a state that is not a state', { workStateCode: ok('XX') }],
    ['a value that arrived as a string', { baseSalaryAnnual: ok('145000') }],
    ['NaN', { baseSalaryAnnual: ok(Number.NaN) }],
    ['Infinity', { baseSalaryAnnual: ok(Number.POSITIVE_INFINITY) }],
  ])('drops %s', (_label, input) => {
    const { parsed, rejected } = validateExtraction(input)
    expect(Object.keys(parsed)).toHaveLength(0)
    expect(rejected).toHaveLength(1)
  })

  it('drops a field below the confidence floor', () => {
    const { parsed } = validateExtraction({
      baseSalaryAnnual: { value: 145000, confidence: 0.4, quote: 'salary: $145,000' },
    })
    expect(parsed.baseSalaryAnnual).toBeUndefined()
  })

  it('drops a field with no quote, however confident', () => {
    const { parsed } = validateExtraction({
      baseSalaryAnnual: { value: 145000, confidence: 1, quote: '   ' },
    })
    expect(parsed.baseSalaryAnnual).toBeUndefined()
  })

  it('drops the whole field when its quote carries personal data', () => {
    // The value is perfectly valid. It goes anyway: a redacted quote is one the
    // user cannot check, and an unverifiable number is worse than no number.
    const { parsed, rejected } = validateExtraction({
      baseSalaryAnnual: ok(145000, 'Alex Smith, SSN 123-45-6789, base salary $145,000'),
    })
    expect(parsed.baseSalaryAnnual).toBeUndefined()
    expect(rejected).toEqual(['baseSalaryAnnual'])
  })

  it('ignores keys that are not in the schema', () => {
    const { parsed } = validateExtraction({
      employeeName: ok(1, 'Alex Smith'),
      homeAddress: ok(1, '12 Oak Street'),
      baseSalaryAnnual: ok(145000),
    })
    expect(Object.keys(parsed)).toEqual(['baseSalaryAnnual'])
  })

  it.each([
    ['null', null],
    ['a string', 'nope'],
    ['an array', []],
    ['undefined', undefined],
  ])('returns nothing for %s rather than throwing', (_label, input) => {
    expect(validateExtraction(input).parsed).toEqual({})
  })
})
