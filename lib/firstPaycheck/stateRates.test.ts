import { describe, expect, it } from 'vitest'

import { STANDARD_DEDUCTION_2026_SINGLE } from './constants'
import { hasStateRate, stateRate } from './calculation'
import { US_STATES } from '@/lib/states'

/**
 * The state table, checked against the thing it approximates.
 *
 * It had never been checked. The only test that touched it asked whether every
 * state had an ENTRY, which it did — all fifty-one, thirty-one of them wrong,
 * the worst by $1,908 a year. Coverage is not accuracy, and a table of magic
 * numbers with no oracle is where that distinction gets lost.
 *
 * The figures below are what /api/tax returned on 18 September 2026 for a
 * single filer with no deferrals. They are the oracle: when the tax year rolls
 * or a state changes its schedule, these move and the rates move with them.
 */
const API_STATE_TAX: ReadonlyArray<{ state: string; tax: readonly [number, number, number] }> = [
  { state: 'AK', tax: [0, 0, 0] },
  { state: 'AL', tax: [1905, 2655, 3905] },
  { state: 'AR', tax: [1432, 2017, 2992] },
  { state: 'AZ', tax: [973, 1348, 1973] },
  { state: 'CA', tax: [938, 1811, 3880] },
  { state: 'CO', tax: [1712, 2372, 3472] },
  { state: 'CT', tax: [1500, 2214, 3589] },
  { state: 'DC', tax: [2134, 3103, 5106] },
  { state: 'DE', tax: [1772, 2605, 4191] },
  { state: 'FL', tax: [0, 0, 0] },
  { state: 'GA', tax: [2019, 2797, 4095] },
  { state: 'HI', tax: [1884, 2987, 4887] },
  { state: 'IA', tax: [1478, 2048, 2998] },
  { state: 'ID', tax: [1814, 2609, 3934] },
  { state: 'IL', tax: [1926, 2668, 3906] },
  { state: 'IN', tax: [1148, 1590, 2328] },
  { state: 'KS', tax: [2083, 2920, 4315] },
  { state: 'KY', tax: [1362, 1887, 2762] },
  { state: 'LA', tax: [1167, 1617, 2367] },
  { state: 'MA', tax: [1945, 2695, 3945] },
  { state: 'MD', tax: [1795, 2508, 3695] },
  { state: 'ME', tax: [2371, 3384, 5133] },
  { state: 'MI', tax: [1653, 2291, 3353] },
  { state: 'MN', tax: [2173, 3193, 4893] },
  { state: 'MO', tax: [1652, 2357, 3532] },
  { state: 'MS', tax: [1156, 1756, 2756] },
  { state: 'MT', tax: [1997, 2845, 4257] },
  { state: 'NC', tax: [1552, 2151, 3148] },
  { state: 'ND', tax: [0, 0, 447] },
  { state: 'NE', tax: [1477, 2159, 3297] },
  { state: 'NH', tax: [0, 0, 0] },
  { state: 'NJ', tax: [679, 1485, 2900] },
  { state: 'NM', tax: [1419, 2124, 3324] },
  { state: 'NV', tax: [0, 0, 0] },
  { state: 'NY', tax: [1974, 2799, 4174] },
  { state: 'OH', tax: [353, 766, 1453] },
  { state: 'OK', tax: [1250, 1925, 3050] },
  { state: 'OR', tax: [3095, 4407, 6595] },
  { state: 'PA', tax: [1194, 1655, 2422] },
  { state: 'RI', tax: [1459, 2021, 2959] },
  { state: 'SC', tax: [1734, 2664, 4214] },
  { state: 'SD', tax: [0, 0, 0] },
  { state: 'TN', tax: [0, 0, 0] },
  { state: 'TX', tax: [0, 0, 0] },
  { state: 'UT', tax: [1751, 2426, 3551] },
  { state: 'VA', tax: [1979, 2842, 4279] },
  { state: 'VT', tax: [1303, 2001, 3651] },
  { state: 'WA', tax: [0, 0, 0] },
  { state: 'WI', tax: [1579, 2270, 3595] },
  { state: 'WV', tax: [1095, 1729, 2874] },
  { state: 'WY', tax: [0, 0, 0] },
]

const INCOMES = [55_000, 70_000, 95_000] as const

/** The base every caller charges the rate on, and the one the rates are fitted to. */
const taxableAt = (salary: number) => Math.max(0, salary - STANDARD_DEDUCTION_2026_SINGLE)

const worstError = (state: string, expected: readonly number[]) =>
  Math.max(...INCOMES.map((s, i) => Math.abs(taxableAt(s) * stateRate(state) - expected[i]!)))

describe('state tax rates, against the API they approximate', () => {
  it('covers every state the pickers offer', () => {
    expect(US_STATES.filter((code) => !hasStateRate(code))).toEqual([])
  })

  it('is exact for every flat-tax state', () => {
    /**
     * A flat rate on a taxable base is not an approximation of anything — it
     * is the statute. Any drift here means the base is wrong, not the rate,
     * and that is the failure worth catching loudest.
     */
    for (const s of ['AZ', 'CO', 'IA', 'IL', 'IN', 'KY', 'LA', 'MA', 'MI', 'NC', 'PA', 'RI', 'UT', 'GA']) {
      const row = API_STATE_TAX.find((r) => r.state === s)!
      expect(worstError(s, row.tax), `${s} should reproduce the API exactly`).toBeLessThan(1)
    }
  })

  it('charges nothing where there is no wage tax', () => {
    for (const s of ['AK', 'FL', 'NH', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY']) {
      expect(stateRate(s), s).toBe(0)
    }
  })

  it('is within $700 a year everywhere, across the range these tools serve', () => {
    /**
     * $700 is not a target, it is the residual on California — the steepest
     * graduated schedule here and the one a single rate fits worst. Everything
     * else is well inside it. The bound exists so a future edit cannot quietly
     * reintroduce a $1,900 error.
     */
    const failures = API_STATE_TAX
      .map((r) => ({ state: r.state, err: worstError(r.state, r.tax) }))
      .filter((r) => r.err > 700)
    expect(failures, `states off by more than $700/yr: ${failures.map((f) => `${f.state} $${f.err.toFixed(0)}`).join(', ')}`).toEqual([])
  })

  it('is within $110 a year for all but the steepest schedules', () => {
    const steep = new Set(['CA', 'CT', 'DC', 'DE', 'HI', 'MN', 'MS', 'ND', 'NJ', 'NM', 'OH', 'OK', 'SC', 'VT', 'WI', 'WV'])
    const failures = API_STATE_TAX
      .filter((r) => !steep.has(r.state))
      .map((r) => ({ state: r.state, err: worstError(r.state, r.tax) }))
      .filter((r) => r.err > 110)
    expect(failures, `unexpectedly loose: ${failures.map((f) => `${f.state} $${f.err.toFixed(0)}`).join(', ')}`).toEqual([])
  })

  it('still blends anything that is not a state', () => {
    expect(stateRate('')).toBe(0.04)
    expect(stateRate('ZZ')).toBe(0.04)
  })
})
