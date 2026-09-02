import { describe, it, expect } from 'vitest'
import { deferralState, employerMatchState, hsaState, type PaystubLine } from './fields'
import { validatePaystub, mergePaystubInputs } from './validate'

const line = (
  kind: PaystubLine['kind'],
  currentAmount: number,
  ytdAmount = 0,
  label = kind
): PaystubLine => ({ label, currentAmount, ytdAmount, kind })

describe('deferralState — what the stub says about the 401(k)', () => {
  it('reads the current period when there is one', () => {
    // $240 deducted on $4,000 gross, semi-monthly.
    expect(deferralState([line('retirement_employee', 240)], 4000, undefined)).toEqual({
      kind: 'contributing', pct: 6, from: 'current',
    })
  })

  it('adds traditional and Roth together', () => {
    expect(
      deferralState([line('retirement_employee', 160), line('retirement_employee', 80)], 4000, undefined)
    ).toMatchObject({ kind: 'contributing', pct: 6 })
  })

  it('calls a maxed-out saver maxed out, not a non-saver', () => {
    // Both real statements tested: 0.00 for the period, 32,500 year to date —
    // the IRS limit plus the age-50 catch-up. Reading only the current column
    // said "contributes nothing" about somebody who had finished contributing,
    // and would have opened the plan by telling them to start.
    const state = deferralState([line('retirement_employee', 0, 32_500)], 10_816.8, 235_141.95)
    expect(state.kind).toBe('maxed')
    if (state.kind === 'maxed') {
      expect(state.ytd).toBe(32_500)
      expect(state.effectivePct).toBeCloseTo(13.8, 1)
    }
  })

  it('falls back to year-to-date when the period happens to be zero', () => {
    // A bonus-only cheque or an unpaid week, well below the cap.
    expect(deferralState([line('retirement_employee', 0, 6_000)], 4000, 100_000)).toEqual({
      kind: 'contributing', pct: 6, from: 'ytd',
    })
  })

  it('distinguishes "contributes nothing" from "no 401(k) line at all"', () => {
    expect(deferralState([line('retirement_employee', 0, 0)], 4000, 96_000).kind).toBe('none')
    expect(deferralState([line('medical', 120)], 4000, 96_000).kind).toBe('unknown')
  })

  it('ignores the employer match, which is not the employee deferral', () => {
    expect(deferralState([line('employer_match', 160, 2_560)], 4000, 96_000).kind).toBe('unknown')
  })

  it('returns unknown rather than a nonsense percentage', () => {
    expect(deferralState([line('retirement_employee', 240)], 0, 0).kind).toBe('unknown')
    expect(deferralState([line('retirement_employee', 5000)], 4000, undefined).kind).toBe('unknown')
  })
})

describe('employerMatchState — three states, because two would be a lie', () => {
  it('confirms a match from the current column', () => {
    expect(employerMatchState([line('employer_match', 160, 2_560)])).toEqual({
      hasMatch: true, amountCurrent: 160, amountYtd: 2_560,
    })
  })

  it('confirms a match that only appears year-to-date', () => {
    // A real statement pays the match as an annual true-up: 0.00 this period,
    // 4,814.69 year to date. Current-column-only, that read as "unknown".
    expect(employerMatchState([line('employer_match', 0, 4_814.69)])).toMatchObject({ hasMatch: true })
  })

  it('says UNKNOWN when no match line appears, never "no"', () => {
    // Plenty of payroll systems never print employer contributions — two of the
    // sample stubs are identical in net pay for exactly that reason. Answering
    // "no" would tell someone they have no match when they may well have one.
    expect(employerMatchState([line('retirement_employee', 240)])).toEqual({ hasMatch: null })
    expect(employerMatchState([])).toEqual({ hasMatch: null })
    expect(employerMatchState([line('employer_match', 0, 0)])).toEqual({ hasMatch: null })
  })
})

describe('validatePaystub', () => {
  const good = {
    grossPayCurrent: 4000,
    payFrequency: 'semimonthly',
    workStateCode: 'CA',
    lines: [{ label: '401(k) - employee', currentAmount: 240, ytdAmount: 3840, kind: 'retirement_employee' }],
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
    ['a kind outside the taxonomy', { label: 'x', currentAmount: 10, ytdAmount: 0, kind: 'crypto' }],
    ['an amount past the ceiling', { label: 'x', currentAmount: 1_000_000, ytdAmount: 0, kind: 'other' }],
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
      { lines: [{ label: 'a', currentAmount: 1, ytdAmount: 0, kind: 'other' }] },
      { lines: [{ label: 'b', currentAmount: 2, ytdAmount: 0, kind: 'other' }] },
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
    lines: [{ label: '401(k)', currentAmount, ytdAmount: 0, kind }],
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
    expect(deferralState(validatePaystub(stub(-240)).parsed.lines, 4000, undefined)).toMatchObject({ pct: 6 })
    expect(deferralState(validatePaystub(stub(240)).parsed.lines, 4000, undefined)).toMatchObject({ pct: 6 })
  })

  it('still rejects a magnitude past the ceiling, in either direction', () => {
    expect(validatePaystub(stub(-1_000_000)).parsed.lines).toHaveLength(0)
    expect(validatePaystub(stub(1_000_000)).parsed.lines).toHaveLength(0)
  })
})

describe('hsaState — the stub answers the HSA question', () => {
  const hsa = (currentAmount: number, ytdAmount = 0, label = 'Hsa Ee Ded'): PaystubLine => ({
    label, currentAmount, ytdAmount, kind: 'hsa_employee',
  })

  it('treats a deduction as proof of an eligible plan', () => {
    // The IRS does not allow an HSA contribution without an HDHP, so the
    // deduction settles the question the money plan asks outright.
    expect(hsaState([hsa(181.81)], 24)).toEqual({ eligible: true, annualEmployee: 4363 })
  })

  it('takes the largest row rather than the sum', () => {
    // A real ADP statement listed the same $181.81 twice, as "Hsa Ee Ded" and
    // "HSA DD". Summing doubles a real contribution to $8,726 — past the IRS
    // limit — and the plan would then read the remaining room as zero.
    const both = [hsa(181.81, 2363.53, 'Hsa Ee Ded'), hsa(181.81, 4363.53, 'HSA DD')]
    expect(hsaState(both, 24)).toEqual({ eligible: true, annualEmployee: 4363 })
  })

  it('still confirms eligibility when the period is zero but the year is not', () => {
    expect(hsaState([hsa(0, 2545.34)], 24)).toEqual({ eligible: true, annualEmployee: null })
  })

  it('says nothing when there is no HSA line', () => {
    // Not "no HSA" — the person may be eligible and simply not contributing.
    expect(hsaState([], 24)).toEqual({ eligible: null })
    expect(hsaState([{ label: 'Medical', currentAmount: 120, ytdAmount: 1920, kind: 'medical' }], 24))
      .toEqual({ eligible: null })
  })

  it('omits the annual figure when the frequency is unknown', () => {
    expect(hsaState([hsa(181.81)], null)).toEqual({ eligible: true, annualEmployee: null })
  })
})
