/**
 * What we read off an offer letter, and nothing else.
 *
 * This list IS the privacy control. Section 9 of the parser spec asks that
 * personal data is "never extracted at all, not extracted-then-redacted" — and
 * the way to guarantee that is not to instruct a model and hope, but to give it
 * nowhere to put the data. Every field below is a bounded number or a US state
 * code. A name, a home address, an employee ID or a bank account has no slot in
 * the output schema, so it cannot come back.
 *
 * The ranges do a second job people miss: an SSN is nine digits, and the widest
 * field here tops out at eight (`equityAnnualUsd`, 10,000,000). A social
 * security number cannot survive range validation even if a model tried to put
 * one in a numeric field.
 *
 * The set is deliberately bounded by what OfferAnalysisTool can consume. There
 * is no point extracting a signing bonus clawback the form has no input for —
 * it would be data we hold and cannot use, which is the opposite of the point.
 */

import { US_STATES } from '@/lib/states'

export interface ParsedField {
  /** The number itself, already range-validated. */
  value: number
  /** 0-1, as reported by the model. Below MIN_CONFIDENCE the field is dropped. */
  confidence: number
  /** The sentence it was read from. Redacted, and required — see below. */
  quote: string
}

export type ParsedOffer = Partial<Record<OfferFieldKey, ParsedField>> & {
  /**
   * The one non-numeric field, and it is an enum of the 51 values in
   * lib/states.ts rather than a free string. A closed set of two-letter codes
   * has the same property the numeric fields have: there is no value it can
   * take that carries personal data.
   */
  workStateCode?: { value: (typeof US_STATES)[number]; confidence: number; quote: string }
}

export const WORK_STATE_DESCRIPTION =
  'The two-letter US state code for where the role is based. Use the work location, not the company headquarters. Omit for a remote role with no stated state.'

/**
 * A field with no supporting quote is discarded rather than down-weighted.
 *
 * The spec's confidence model has three bands; this has two, because the
 * consequence here is smaller and the simpler rule is easier to defend. A field
 * we drop costs the user the default they already had. A field we get wrong
 * produces a confidently incorrect package value, which is the failure that
 * matters — precision over recall, per the spec's own ship gate.
 */
export const MIN_CONFIDENCE = 0.6

interface FieldSpec {
  /** Sent to the model as the schema description. */
  describe: string
  min: number
  max: number
  /** Whole numbers only — percentages and day counts, not dollars. */
  integer?: boolean
}

export const OFFER_FIELDS = {
  baseSalaryAnnual: {
    describe:
      'Annual base salary in US dollars. If the letter states a per-period amount (semi-monthly, biweekly, hourly), annualise it and use that. Exclude bonus, equity and any signing bonus.',
    min: 10_000,
    max: 5_000_000,
  },
  targetBonusPct: {
    describe:
      'Target annual bonus as a percentage of base salary. If stated as a dollar amount, convert using the base salary. Not the signing bonus.',
    min: 0,
    max: 200,
  },
  matchRatePct: {
    describe:
      'Employer 401(k) match rate as a percentage. "The Company matches 50% of the first 6%" is 50. For a tiered formula such as "100% of the first 3% and 50% of the next 2%", compute the blended rate over the full cap: (1.00x3 + 0.50x2) / 5 = 80.',
    min: 0,
    max: 200,
  },
  matchUpToPct: {
    describe:
      'The employee contribution percentage at which the employer match stops. "50% of the first 6%" is 6. For a tiered formula, use the highest tier ceiling: "100% of the first 3% and 50% of the next 2%" is 5.',
    min: 0,
    max: 100,
  },
  employerHsaAnnual: {
    describe:
      'Employer contribution or seed to an HSA, in US dollars per year. Not the employee contribution limit, and not an FSA.',
    min: 0,
    max: 20_000,
  },
  healthcarePremiumMonthly: {
    describe:
      'What the EMPLOYEE pays for health insurance per month, in US dollars. Convert from per-pay-period if needed. Not the employer cost, not the deductible.',
    min: 0,
    max: 5_000,
  },
  equityAnnualUsd: {
    describe:
      'Annualised equity value in US dollars — total stated grant value divided by the vesting years. Only when the letter gives a dollar value; if it states a number of units with no price, omit rather than valuing it.',
    min: 0,
    max: 10_000_000,
  },
  ptoDays: {
    describe:
      'Paid time off in days per year. Convert hours at 8 per day. Exclude public holidays and sick days stated separately. Omit for unlimited PTO.',
    min: 0,
    max: 365,
    integer: true,
  },
  esppDiscountPct: {
    describe:
      'Employee stock purchase plan discount, as a percentage off the market price. Typically 5 or 15.',
    min: 0,
    max: 50,
  },
} as const satisfies Record<string, FieldSpec>

export type OfferFieldKey = keyof typeof OFFER_FIELDS

export const OFFER_FIELD_KEYS = Object.keys(OFFER_FIELDS) as OfferFieldKey[]

/**
 * Range check, applied to every value before it can reach the client.
 *
 * The model is asked for a number in a range and is generally given one; this
 * is here for when it is not. A salary of 4 or 40,000,000 is a misread, and a
 * misread that reaches the form becomes a wrong package value the user has no
 * reason to doubt.
 */
export function isInRange(key: OfferFieldKey, value: unknown): value is number {
  const spec: FieldSpec = OFFER_FIELDS[key]
  if (typeof value !== 'number' || !Number.isFinite(value)) return false
  if (spec.integer && !Number.isInteger(value)) return false
  return value >= spec.min && value <= spec.max
}

/** The 51 codes the form's own dropdown accepts. */
export function isStateCode(value: unknown): value is (typeof US_STATES)[number] {
  return typeof value === 'string' && (US_STATES as readonly string[]).includes(value)
}
