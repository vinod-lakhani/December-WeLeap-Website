import { describe, it, expect } from 'vitest'
import {
  OFFER_FIELDS,
  OFFER_FIELD_KEYS,
  BENEFITS_FIELD_KEYS,
  BENEFITS_DESCRIPTIONS,
  isInRange,
} from './fields'

/**
 * The benefits path reuses the offer path's ranges and validation and changes
 * only the wording. These guard that arrangement, because the failure mode is
 * silent: a key that drifts out of OFFER_FIELDS still type-checks against a
 * plain string union, and a missing description would reach the model as
 * "undefined Expected range: 0 to 100".
 */

describe('the benefits field table', () => {
  it('asks only for what an offer letter does not carry', () => {
    // Not an arbitrary subset. Across four real offer letters all four stated
    // a salary and a work state; none stated any of these.
    expect([...BENEFITS_FIELD_KEYS]).toEqual([
      'matchRatePct',
      'matchUpToPct',
      'employerHsaAnnual',
      'healthcarePremiumMonthly',
    ])
  })

  it('only names fields the offer table already defines', () => {
    for (const key of BENEFITS_FIELD_KEYS) {
      expect(OFFER_FIELD_KEYS).toContain(key)
      expect(OFFER_FIELDS[key]).toBeDefined()
    }
  })

  it('gives every one of them its own wording', () => {
    for (const key of BENEFITS_FIELD_KEYS) {
      const text = BENEFITS_DESCRIPTIONS[key]
      expect(typeof text).toBe('string')
      expect(text.length).toBeGreaterThan(40)
      // The description must differ from the offer-letter one, or there was no
      // reason to branch on document class in the first place.
      expect(text).not.toBe(OFFER_FIELDS[key].describe)
    }
  })

  it('shares the offer path’s ranges, so validation cannot diverge', () => {
    // The figures the Northstar guide under test actually yields.
    expect(isInRange('matchRatePct', 80)).toBe(true)
    expect(isInRange('matchUpToPct', 5)).toBe(true)
    expect(isInRange('employerHsaAnnual', 1000)).toBe(true)
    expect(isInRange('healthcarePremiumMonthly', 78)).toBe(true)
  })

  it('names the traps the guide sets, so a reworded prompt keeps avoiding them', () => {
    // Each of these is a wrong answer the test document offers up next to the
    // right one: the max employer contribution beside the match cap, the
    // family HSA beside the employee-only figure, three premiums for one field.
    expect(BENEFITS_DESCRIPTIONS.matchUpToPct).toMatch(/not the maximum employer contribution/i)
    expect(BENEFITS_DESCRIPTIONS.employerHsaAnnual).toMatch(/employee-only/i)
    expect(BENEFITS_DESCRIPTIONS.employerHsaAnnual).toMatch(/do not use it/i)
    expect(BENEFITS_DESCRIPTIONS.healthcarePremiumMonthly).toMatch(/HSA-ELIGIBLE/)
    expect(BENEFITS_DESCRIPTIONS.matchRatePct).toMatch(/not from an illustrative table/i)
  })
})
