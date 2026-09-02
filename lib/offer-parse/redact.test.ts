import { describe, it, expect } from 'vitest'
import { redact, containsPii } from './redact'

/**
 * Two failure modes, and both are tested here because they pull in opposite
 * directions. Missing an SSN sends it to a vendor. Redacting a salary breaks
 * the feature. The second half of this file is the one that will catch a
 * regression when someone widens a pattern.
 */

describe('redact — what must never survive', () => {
  it.each([
    ['dashed SSN', 'SSN: 123-45-6789'],
    ['spaced SSN', 'SSN 123 45 6789'],
    ['bare SSN', 'Employee 123456789 on record'],
    ['routing number', 'Routing 021000021 for direct deposit'],
    ['account number', 'Account 4392015583271'],
    ['grouped card', 'Card 4111 1111 1111 1111'],
    ['email', 'Contact alex.smith@example.com to accept'],
    ['phone', 'Call 415-555-0142 with questions'],
    ['phone with country code', 'Call +1 415 555 0142'],
    ['street address', 'You will report to 1600 Pennsylvania Avenue'],
    ['apartment line', 'Apt 4B'],
    ['date of birth', 'Date of birth: 1990-04-12'],
  ])('removes %s', (_label, input) => {
    const { text, hits } = redact(input)
    expect(hits).toBeGreaterThan(0)
    expect(text).toContain('[redacted]')
    // The digits themselves are gone, not merely flagged.
    expect(text).not.toMatch(/\d{3}[-\s]?\d{2}[-\s]?\d{4}/)
  })

  it('reports a hit count rather than the content it found', () => {
    const { hits } = redact('SSN 123-45-6789 and 987-65-4321')
    expect(hits).toBe(2)
  })

  it('leaves no digits behind when an SSN sits inside a sentence', () => {
    expect(redact('Your SSN 123-45-6789 is on file.').text).toBe(
      'Your SSN [redacted] is on file.'
    )
  })
})

describe('redact — what must survive, or the parser stops working', () => {
  it.each([
    ['a salary with commas', 'Annual base salary: $145,000'],
    ['a bare six-figure salary', 'Your salary will be 145000 per year'],
    ['a semi-monthly figure', 'You will be paid $5,576.92 semi-monthly'],
    ['a tiered match formula', 'The Company matches 100% of the first 3% and 50% of the next 2%'],
    ['a simple match formula', 'We match 50% of the first 6% of eligible compensation'],
    ['a 401k reference', 'You are eligible for the 401k plan'],
    ['PTO days', 'You will accrue 15 days of paid time off'],
    ['a bonus target', 'Target bonus of 10% of base salary'],
    ['an ESPP discount', 'ESPP with a 15% discount and a lookback'],
    ['an equity grant', 'An RSU grant valued at $240,000 vesting over 4 years'],
    ['a start date', 'Your start date is March 3, 2026'],
    ['an HSA contribution', 'The Company contributes $1,200 annually to your HSA'],
  ])('keeps %s intact', (_label, input) => {
    const { text, hits } = redact(input)
    expect(hits).toBe(0)
    expect(text).toBe(input)
  })

  it('keeps a whole realistic paragraph unchanged', () => {
    const para =
      'Your annual base salary will be $145,000, paid semi-monthly. You will be ' +
      'eligible for a target bonus of 12% and the Company will match 100% of the ' +
      'first 3% and 50% of the next 2% of your 401(k) contributions. You will ' +
      'receive 20 days of paid time off per year.'
    expect(redact(para)).toEqual({ text: para, hits: 0 })
  })
})

describe('containsPii', () => {
  it('gates a model-written quote on the same rules', () => {
    expect(containsPii('the Company matches 50% of the first 6%')).toBe(false)
    expect(containsPii('Alex Smith, 12 Oak Street, starting at $120,000')).toBe(true)
  })
})
