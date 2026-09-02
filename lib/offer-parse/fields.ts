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

/* ==========================================================================
   Paystub
   ========================================================================== */

/**
 * The one document that says what is actually happening.
 *
 * An offer letter says what was promised and a benefits guide says what is
 * available. Only a paystub says what the employee is really doing — and the
 * money plan opens by assuming they contribute nothing, because `wCurrent401k`
 * defaults to "0" and nobody recalls their deferral percentage from memory.
 *
 * ASK FOR THE ROWS, NOT THE FIELDS. This was first written the obvious way,
 * with a named scalar per figure: `retirement401kEmployeeCurrent`,
 * `employerMatchCurrent`, `hsaEmployeeCurrent`. It did not work. Recall swung
 * between 2/6 and 6/6 on the same stub across four attempts — two effort
 * settings, three prompts, and the vision path, which was worst of all.
 *
 * The extraction was never the problem. unpdf hands over the table perfectly:
 * headers, row order and both columns intact. Asking "find the 401(k) line"
 * makes the model judge, per field, whether it has found the right thing; it
 * inconsistently decided no. Asking "list every row" is a single mechanical
 * pass with nothing to decide, and it is byte-for-byte identical run to run.
 *
 * Which also answers whether better OCR or a table-aware extractor would have
 * helped: no. The input was already right.
 */

/**
 * What a deduction row is, once classified.
 *
 * A cut-down version of the spec's §4 taxonomy — only the kinds the money plan
 * can act on, plus `other` so nothing has to be forced into a wrong bucket. The
 * rows we ignore still have to be listed, because listing all of them is what
 * makes the listing reliable.
 */
export const PAYSTUB_LINE_KINDS = [
  'retirement_employee',
  'employer_match',
  'hsa_employee',
  'medical',
  'dental',
  'vision',
  'tax',
  'other',
] as const

export type PaystubLineKind = (typeof PAYSTUB_LINE_KINDS)[number]

export interface PaystubLine {
  /** The row label, verbatim. Doubles as the quote for this figure. */
  label: string
  /** The Current column. */
  currentAmount: number
  /**
   * The year-to-date column, which is where a real stub keeps its answers.
   *
   * Dropped when this was first built, on the grounds that the money plan
   * wants what is happening now. Two real statements showed why that was
   * wrong: both had a 401(k) row reading 0.00 for the period and 32,500
   * year-to-date. Reading only the current column, the tool concluded the
   * person contributes nothing and would have opened by telling a maxed-out
   * saver to start saving.
   */
  ytdAmount: number
  kind: PaystubLineKind
}

/** Rows outside this are a misread of the table rather than a real deduction. */
export const MAX_LINE_AMOUNT = 100_000

/**
 * Year-to-date figures are running totals and legitimately far larger — one
 * real statement showed 312,746.61 of gross by August. Sharing the per-period
 * ceiling would have rejected the very column that answers the question.
 */
export const MAX_YTD_AMOUNT = 5_000_000

export const PAY_FREQUENCIES = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
} as const

export type PayFrequency = keyof typeof PAY_FREQUENCIES

export const PAY_FREQUENCY_DESCRIPTION =
  'How often this employee is paid, as stated on the stub. "Semi-monthly" is twice a month (24 a year); "biweekly" is every two weeks (26 a year) — they are different and the stub usually says which. If the stub does not state it, derive it from the pay period dates rather than assuming.'

export const PAYSTUB_LINES_DESCRIPTION =
  'EVERY row of the deductions and employer-contributions tables, in the order they appear. Do not skip rows and do not filter to the interesting ones — list all of them. Give BOTH columns for each row: currentAmount from the current-period column and ytdAmount from the year-to-date column. Where a row shows only one figure, put it in currentAmount and use 0 for ytdAmount.'

export const GROSS_PAY_DESCRIPTION =
  'Gross pay for THIS pay period, from the Current column, before any tax or deduction.'

export function isPayFrequency(value: unknown): value is PayFrequency {
  return typeof value === 'string' && value in PAY_FREQUENCIES
}

export function isLineKind(value: unknown): value is PaystubLineKind {
  return typeof value === 'string' && (PAYSTUB_LINE_KINDS as readonly string[]).includes(value)
}

/** What a read paystub hands back, after validation. */
export interface ParsedPaystub {
  grossPayCurrent?: number
  grossPayYtd?: number
  payFrequency?: PayFrequency
  workStateCode?: (typeof US_STATES)[number]
  lines: PaystubLine[]
}

/**
 * What the stub says about this person's 401(k), in the states it can be in.
 *
 * The current column alone is not enough, and two real statements are the
 * proof: both show a 401(k) row of 0.00 for the period against 32,500
 * year-to-date. That is not somebody who contributes nothing — it is somebody
 * who finished contributing. 32,500 is exactly the IRS employee limit plus the
 * age-50 catch-up, so the deductions stopped because there was nothing left to
 * defer.
 *
 * Getting this wrong is not a small miss. The money plan's first move is
 * capturing the employer match, and opening with that for someone who maxed out
 * in August is both useless and slightly insulting.
 */
export type DeferralState =
  | { kind: 'maxed'; ytd: number; effectivePct: number | null }
  | { kind: 'contributing'; pct: number; from: 'current' | 'ytd' }
  | { kind: 'none' }
  | { kind: 'unknown' }

/**
 * The base employee limit. Someone at or above it has finished for the year,
 * and the catch-up cases land above it too rather than needing their own test —
 * an age this tool never asks for.
 */
import { K401_EMPLOYEE_CAP } from '@/lib/allocator/constants'

export function deferralState(
  lines: PaystubLine[],
  grossPayCurrent: number | undefined,
  grossPayYtd: number | undefined
): DeferralState {
  const retirement = lines.filter((l) => l.kind === 'retirement_employee')
  if (retirement.length === 0) return { kind: 'unknown' }

  const current = retirement.reduce((s, l) => s + l.currentAmount, 0)
  const ytd = retirement.reduce((s, l) => s + l.ytdAmount, 0)

  const pct = (part: number, whole: number | undefined) => {
    if (!whole || whole <= 0) return null
    const v = (part / whole) * 100
    return Number.isFinite(v) && v > 0 && v <= 100 ? Math.round(v * 10) / 10 : null
  }

  if (ytd >= K401_EMPLOYEE_CAP) {
    return { kind: 'maxed', ytd, effectivePct: pct(ytd, grossPayYtd) }
  }
  // Current first: it is what the person is doing now. Year-to-date is the
  // fallback for a period that happens to be zero — a bonus-only cheque, an
  // unpaid week, a contribution that started mid-year.
  const fromCurrent = current > 0 ? pct(current, grossPayCurrent) : null
  if (fromCurrent !== null) return { kind: 'contributing', pct: fromCurrent, from: 'current' }
  const fromYtd = ytd > 0 ? pct(ytd, grossPayYtd) : null
  if (fromYtd !== null) return { kind: 'contributing', pct: fromYtd, from: 'ytd' }
  return current === 0 && ytd === 0 ? { kind: 'none' } : { kind: 'unknown' }
}

/**
 * Whether the employer matches — in three states, because two would be a lie.
 *
 * A stub showing a match line proves one exists. A stub showing none proves
 * nothing: plenty of payroll systems never print employer contributions, and
 * two of the sample stubs are identical in net pay for exactly that reason.
 * Returning `false` there would tell someone they have no match when they may
 * well have one, and capturing the match is the money plan's first move.
 *
 * The year-to-date column settles cases the current one cannot. On a real
 * statement the per-period match reads 0.00 while year-to-date reads 4,814.69
 * — the match is real and paid as an annual true-up. Current-column-only, that
 * was "unknown"; with both, it is a confirmed yes.
 */
export function employerMatchState(
  lines: PaystubLine[]
): { hasMatch: true; amountCurrent: number; amountYtd: number } | { hasMatch: null } {
  const match = lines.filter((l) => l.kind === 'employer_match')
  const amountCurrent = match.reduce((s, l) => s + l.currentAmount, 0)
  const amountYtd = match.reduce((s, l) => s + l.ytdAmount, 0)
  return amountCurrent > 0 || amountYtd > 0
    ? { hasMatch: true, amountCurrent, amountYtd }
    : { hasMatch: null }
}

/**
 * What the stub proves about an HSA.
 *
 * An employee HSA deduction is proof of an HSA-eligible health plan: the IRS
 * does not let you contribute to one without an HDHP. So a stub carrying that
 * line answers a question the money plan currently asks outright, and asking it
 * anyway — after the user has handed over the document that settles it — is the
 * kind of thing that makes an upload feel pointless.
 *
 * THE ROWS ARE TAKEN AT THEIR MAXIMUM, NOT SUMMED. A real ADP statement listed
 * the same $181.81 deduction twice, under "Hsa Ee Ded" and "HSA DD" — one is
 * the deduction and the other its direct-deposit counterpart, and both classify
 * as an employee HSA line. Summing them doubles a real contribution to $8,726 a
 * year, past the IRS limit, and the money plan would then compute the remaining
 * room as zero for somebody with thousands left. Two identical rows are far
 * more likely to be one deduction described twice than two separate ones.
 *
 * Coverage type is not inferred. A stub does not say whether the plan is single
 * or family, and that changes the annual limit — so it stays the form's own
 * default for the user to set.
 */
export function hsaState(
  lines: PaystubLine[],
  grossPeriodsPerYear: number | null
): { eligible: true; annualEmployee: number | null } | { eligible: null } {
  const rows = lines.filter((l) => l.kind === 'hsa_employee')
  const largest = rows.reduce((max, l) => Math.max(max, l.currentAmount), 0)
  const largestYtd = rows.reduce((max, l) => Math.max(max, l.ytdAmount), 0)

  // Either column proves the plan. A contribution that has paused for the
  // period still happened this year.
  if (largest <= 0 && largestYtd <= 0) return { eligible: null }

  const annual =
    largest > 0 && grossPeriodsPerYear ? Math.round(largest * grossPeriodsPerYear) : null
  return { eligible: true, annualEmployee: annual }
}

