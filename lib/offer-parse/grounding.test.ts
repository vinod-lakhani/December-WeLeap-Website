import { describe, it, expect } from 'vitest'
import { quoteIsGrounded } from './grounding'

/**
 * Both halves matter and they pull against each other. Letting a fabricated
 * quote through defeats the point; rejecting a real one costs a correct field.
 * Every case in the second block is a quote a real document actually produced.
 */

describe('quoteIsGrounded — rejects what is not there', () => {
  const source = 'Your annual base salary will be $145,000, paid semi-monthly.'

  it.each([
    ['a sentence the document never contained', 'Your annual base salary will be $195,000.'],
    ['a plausible invention', 'The Company matches 100% of the first 6% of pay.'],
    ['an empty quote', ''],
  ])('rejects %s', (_label, quote) => {
    expect(quoteIsGrounded(quote, source)).toBe(false)
  })
})

describe('quoteIsGrounded — accepts what real documents produce', () => {
  it('survives a line break inside the sentence', () => {
    // Extracted PDF text wraps mid-sentence; the quote does not.
    const source = 'Company match is $0.30 on every $1 employee\ndeferral up to 60% of salary.'
    const quote = 'Company match is $0.30 on every $1 employee deferral up to 60% of salary.'
    expect(quoteIsGrounded(quote, source)).toBe(true)
  })

  it('survives a bullet glyph the model dropped', () => {
    // The failure that motivated normalising past punctuation entirely: a real
    // guide bullets this list with a character unpdf renders unprintably, and a
    // correct $0 premium was discarded on every run because of it.
    const source = 'This coverage costs you nothing and includes employee-only coverage for:\n UnitedHealthcare High Deductible Health Plan (HDHP)'
    const quote = 'This coverage costs you nothing and includes employee-only coverage for: UnitedHealthcare High Deductible Health Plan (HDHP)'
    expect(quoteIsGrounded(quote, source)).toBe(true)
  })

  it('survives an em dash rendered differently', () => {
    const source = 'Autodesk will contribute money to your HSA each pay period — $50 if you are enrolled'
    expect(quoteIsGrounded('contribute money to your HSA each pay period - $50 if you are enrolled', source)).toBe(true)
  })

  it('accepts a quote stitched across a table with ellipses', () => {
    // Only the longest segment has to be real. A short fragment like "Employee"
    // would match almost any document and prove nothing.
    const source = 'Employee Pre-Tax Contributions (26 Pay Periods)\nMeritain Medical HDHP Plan\nPer Paycheck\nEmployee $51.49'
    const quote = 'Employee Pre-Tax Contributions (26 Pay Periods) ... Meritain Medical HDHP Plan ... Employee'
    expect(quoteIsGrounded(quote, source)).toBe(true)
  })

  it('still rejects when only the short fragments match', () => {
    const source = 'Employee Pre-Tax Contributions (26 Pay Periods)'
    const quote = 'Employee ... The Company will pay your entire medical premium in full every month'
    expect(quoteIsGrounded(quote, source)).toBe(false)
  })

  it('passes everything when there is no source to check against', () => {
    // The vision path has no extracted text. Asserting grounding we could not
    // test would be worse than admitting the check does not apply.
    expect(quoteIsGrounded('anything at all', '')).toBe(true)
  })
})
