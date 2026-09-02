import { describe, it, expect } from 'vitest'
import { deferralPct, employerMatchState, type PaystubLine } from './fields'
import { validatePaystub, mergePaystubInputs } from './validate'

const line = (kind: PaystubLine['kind'], currentAmount: number, label = kind): PaystubLine => ({
  label, currentAmount, kind,
})

describe('deferralPct — the figure the money plan opens by assuming is zero', () => {
  it('divides the deferral by gross, to one decimal', () => {
    // The stub under test: $240 deducted on $4,000 gross, semi-monthly.
    expect(deferralPct([line('retirement_employee', 240)], 4000)).toBe(6)
  })

  it('adds traditional and Roth together', () => {
    expect(deferralPct([line('retirement_employee', 160), line('retirement_employee', 80)], 4000)).toBe(6)
  })

  it('ignores the employer match, which is not the employee deferral', () => {
    expect(deferralPct([line('employer_match', 160)], 4000)).toBeNull()
  })

  it.each([
    ['no retirement line at all', [line('medical', 120)], 4000],
    ['no gross to divide by', [line('retirement_employee', 240)], undefined],
    ['a gross of zero', [line('retirement_employee', 240)], 0],
    ['a deferral larger than gross', [line('retirement_employee', 5000)], 4000],
  ])('returns null for %s rather than a number', (_l, lines, gross) => {
    expect(deferralPct(lines as PaystubLine[], gross as number | undefined)).toBeNull()
  })
})

describe('employerMatchState — three states, because two would be a lie', () => {
  it('confirms a match when the stub shows one', () => {
    expect(employerMatchState([line('employer_match', 160)])).toEqual({ hasMatch: true, amount: 160 })
  })

  it('says UNKNOWN when no match line appears, never "no"', () => {
    // The whole reason this returns null. Plenty of payroll systems never print
    // employer contributions — the two stubs under test are identical in net
    // pay for exactly that reason. Answering "no" here would tell someone they
    // have no match when they may well have one, and capturing the match is the
    // money plan's first move.
    expect(employerMatchState([line('retirement_employee', 240)])).toEqual({ hasMatch: null })
    expect(employerMatchState([])).toEqual({ hasMatch: null })
  })

  it('treats a zero-amount match row as unknown too', () => {
    expect(employerMatchState([line('employer_match', 0)])).toEqual({ hasMatch: null })
  })
})

describe('validatePaystub', () => {
  const good = {
    grossPayCurrent: 4000,
    payFrequency: 'semimonthly',
    workStateCode: 'CA',
    lines: [{ label: '401(k) - employee', currentAmount: 240, kind: 'retirement_employee' }],
  }

  it('accepts a well-formed stub', () => {
    const { parsed } = validatePaystub(good)
    expect(parsed.grossPayCurrent).toBe(4000)
    expect(parsed.payFrequency).toBe('semimonthly')
    expect(parsed.workStateCode).toBe('CA')
    expect(parsed.lines).toHaveLength(1)
  })

  it.each([
    ['a frequency outside the enum', { payFrequency: 'fortnightly' }],
    ['a state that is not a state', { workStateCode: 'ZZ' }],
    ['a gross of zero', { grossPayCurrent: 0 }],
    ['an absurd gross', { grossPayCurrent: 9_999_999 }],
  ])('drops %s', (_l, override) => {
    const { parsed, rejected } = validatePaystub({ ...good, ...override })
    expect(rejected.length).toBeGreaterThan(0)
    expect(Object.values(parsed).filter((v) => v === (override as Record<string, unknown>)[Object.keys(override)[0]!])).toHaveLength(0)
  })

  it.each([
    // A negative amount is NOT in this list, and used to be: real payroll
    // statements print deductions as negatives, so rejecting them threw away
    // most of the first real stub tested. See the sign block below.
    ['a kind outside the taxonomy', { label: 'x', currentAmount: 10, kind: 'crypto' }],
    ['an amount past the ceiling', { label: 'x', currentAmount: 1_000_000, kind: 'other' }],
    ['an empty label', { label: '   ', currentAmount: 10, kind: 'other' }],
    ['a label carrying personal data', { label: 'Garnishment 123-45-6789', currentAmount: 10, kind: 'other' }],
    ['a row that is not an object', 'nope'],
  ])('drops a row with %s while keeping the rest', (_l, row) => {
    const { parsed } = validatePaystub({ ...good, lines: [...good.lines, row] })
    expect(parsed.lines).toHaveLength(1)
    expect(parsed.lines[0]!.kind).toBe('retirement_employee')
  })

  it('never throws on rubbish', () => {
    for (const input of [null, 'x', [], undefined, { lines: 'not an array' }]) {
      expect(() => validatePaystub(input)).not.toThrow()
      expect(validatePaystub(input).parsed.lines).toEqual([])
    }
  })
})

describe('mergePaystubInputs', () => {
  it('keeps bare scalars, which mergeToolInputs silently dropped', () => {
    // The bug this exists for: mergeToolInputs skips any value that is not an
    // object, so a numeric gross and a string frequency vanished while `lines`
    // — an array — came through. Nine runs returned a perfect deductions table
    // and no gross pay at all.
    const merged = mergePaystubInputs([{ grossPayCurrent: 4000, payFrequency: 'semimonthly' }])
    expect(merged.grossPayCurrent).toBe(4000)
    expect(merged.payFrequency).toBe('semimonthly')
  })

  it('concatenates rows split across parallel tool calls', () => {
    const merged = mergePaystubInputs([
      { lines: [{ label: 'a', currentAmount: 1, kind: 'other' }] },
      { lines: [{ label: 'b', currentAmount: 2, kind: 'other' }] },
    ])
    expect(merged.lines).toHaveLength(2)
  })

  it('always produces a lines array, even from nothing', () => {
    expect(mergePaystubInputs([]).lines).toEqual([])
    expect(mergePaystubInputs([null, 'x']).lines).toEqual([])
  })
})

describe('deductions printed as negatives', () => {
  const stub = (currentAmount: number, kind = 'retirement_employee') => ({
    grossPayCurrent: 4000,
    payFrequency: 'semimonthly',
    lines: [{ label: '401(k)', currentAmount, kind }],
  })

  it('keeps a negative deduction, as its magnitude', () => {
    // A real ADP statement prints "-181.81" for money leaving the cheque.
    // Requiring a positive amount discarded fourteen rows of twenty-two on the
    // first real stub tested — including the whole employee HSA deduction.
    const { parsed } = validatePaystub(stub(-240))
    expect(parsed.lines).toHaveLength(1)
    expect(parsed.lines[0]!.currentAmount).toBe(240)
  })

  it('reaches the same deferral either way the stub signs it', () => {
    expect(deferralPct(validatePaystub(stub(-240)).parsed.lines, 4000)).toBe(6)
    expect(deferralPct(validatePaystub(stub(240)).parsed.lines, 4000)).toBe(6)
  })

  it('still rejects a magnitude past the ceiling, in either direction', () => {
    expect(validatePaystub(stub(-1_000_000)).parsed.lines).toHaveLength(0)
    expect(validatePaystub(stub(1_000_000)).parsed.lines).toHaveLength(0)
  })
})
