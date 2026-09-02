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
      'Paid time off or vacation days per year. Convert hours at 8 per day. If the letter lists company holidays as a separate figure, report only the PTO or vacation number and ignore the holidays. Omit only if the letter does not state a number, or says PTO is unlimited.',
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

/* ==========================================================================
   Benefits guide
   ========================================================================== */

/**
 * The four fields an offer letter does not carry.
 *
 * This is not a guess about document conventions — it is what four real offer
 * letters showed. All four stated a base salary and a work location. None
 * stated a 401(k) match, an employer HSA contribution or a medical premium.
 * Those live in the benefits guide, so that is the document asked for, and
 * these are the only fields worth asking it for: everything else the offer
 * letter already answers better.
 *
 * The ranges and the validation are shared with the offer path. Only the
 * wording changes, because the same number is described very differently in a
 * one-page letter and a thirty-page plan summary.
 */
export const BENEFITS_FIELD_KEYS = [
  'matchRatePct',
  'matchUpToPct',
  'employerHsaAnnual',
  'healthcarePremiumMonthly',
] as const satisfies readonly OfferFieldKey[]

/**
 * WHICH PLAN, and this is the hard part of reading a benefits guide.
 *
 * A guide does not say what this employee pays. It lists every plan — a real
 * one under test offers three medical options at $78, $164 and $286 a month —
 * and the answer depends on an election the document cannot know about. The
 * employer HSA figure splits the same way, by coverage tier.
 *
 * Picking the HSA-eligible plan is a considered choice rather than a coin
 * toss. It is the only option on which the employer HSA contribution exists at
 * all, so the premium and the HSA figure come from the same plan and describe
 * one coherent scenario instead of two unrelated ones. It is also the plan
 * that makes the HSA Leap available, which is the reason this tool wants the
 * number. The plan name is required in the quote so the assumption is visible
 * at the point of use, and the UI says it in plain words.
 */
export const BENEFITS_DESCRIPTIONS: Record<(typeof BENEFITS_FIELD_KEYS)[number], string> = {
  matchRatePct:
    'Employer 401(k) match rate as a percentage. For a tiered formula — "100% of the first 3% and 50% of the next 2%" — compute the blended rate over the full cap: (1.00x3 + 0.50x2) / 5 = 80. Read the formula from the prose, not from an illustrative table of example contributions.',
  matchUpToPct:
    'The employee contribution percentage at which the employer match stops. For "100% of the first 3% and 50% of the next 2%" that is 5, because the match stops growing after 5%. Not the maximum employer contribution, which for that formula is 4% of pay.',
  employerHsaAnnual:
    'Employer HSA contribution in US dollars per year, for EMPLOYEE-ONLY coverage. Guides usually give a second, larger figure for family coverage — do not use it. Where the amount is given per pay period, annualise it ONLY with a pay-period count stated somewhere in this document; if the document does not state one, omit rather than assuming 24 or 26. If no plan is HSA-eligible, omit this.',
  healthcarePremiumMonthly:
    'What the EMPLOYEE pays per month for medical coverage, for employee-only coverage on the HSA-ELIGIBLE plan (usually labelled HDHP or high deductible). Where several plans are listed, use that one and name it in your quote. Convert from per-pay-period if needed. Exclude dental and vision. A guide stating that a plan costs the employee nothing is stating a premium of 0 — record 0 rather than omitting it. If no plan is HSA-eligible, use the lowest-cost medical plan and name it.',
}

