import { describe, it, expect } from 'vitest'
import { assessPaystubText } from './text-quality'

/**
 * The numbers in these cases are the ones actually measured, not invented:
 * three cleanly extracted stubs scored 28, 30 and 32 money figures; two real
 * ADP statements scored zero apiece out of 147 and 165 numeric runs.
 */

describe('assessPaystubText', () => {
  it('accepts a stub whose separators survived', () => {
    const good = [
      'Gross pay $4,000.00',
      'Medical - employee $120.00 $1,920.00',
      'HSA - employee $100.00 $1,600.00',
      '401(k) - employee $240.00 $3,840.00',
      'NET PAY $2,515.04',
    ].join('\n')
    const q = assessPaystubText(good)
    expect(q.usable).toBe(true)
    expect(q.moneyFigures).toBeGreaterThanOrEqual(4)
  })

  it('rejects a real ADP statement, where the decimals are gone', () => {
    // Verbatim from the document that timed out three times.
    const mangled = [
      'Net Pay $5 358 89',
      'Regular 10802 08 86 67 10 802 08 160 489 56',
      '-2 134 76 35 399 79',
      'Checking 1 -5 358 89',
      'Hsa Offset +181 81',
    ].join('\n')
    const q = assessPaystubText(mangled)
    expect(q.usable).toBe(false)
    expect(q.moneyFigures).toBe(0)
    // Plenty of numbers — which is the point. A length check passes this.
    expect(q.numericRuns).toBeGreaterThan(20)
  })

  it('rejects an empty extraction too, without special-casing it', () => {
    expect(assessPaystubText('').usable).toBe(false)
    expect(assessPaystubText('Earnings Statement').usable).toBe(false)
  })

  it('is not fooled by a handful of stray decimals', () => {
    // Three is below the floor; a real stub cannot print only three figures.
    expect(assessPaystubText('a 1.00 b 2.50 c 3.75 d 400 500 600').usable).toBe(false)
  })

  it('counts thousands separators and bare decimals alike', () => {
    const q = assessPaystubText('10,802.08 5358.89 181.81 240.00')
    expect(q.moneyFigures).toBe(4)
    expect(q.usable).toBe(true)
  })

  it('does not count a year or a bare integer as money', () => {
    expect(assessPaystubText('2026 08/15/2026 4000 240').moneyFigures).toBe(0)
  })
})
