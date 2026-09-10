/**
 * Federal parameters for the first-paycheck setup tool.
 *
 * These decide a recommendation a person types into a payroll portal, so they
 * are sourced rather than remembered, and dated so a stale year is visible
 * rather than silent.
 */

/** The tax year these figures describe. Rendered on the page. */
export const TAX_YEAR_FIRST_PAYCHECK = 2026

/**
 * 2026 federal brackets, single filer, on TAXABLE income.
 *
 * Source: IRS inflation adjustments for tax year 2026 (Notice released October
 * 2025), as tabulated by the Tax Foundation.
 *
 * Marginal rates, not the effective-rate approximation in lib/allocator/
 * takeHome.ts. That model answers "roughly what is my take-home"; this one has
 * to answer "what does the next dollar cost me", which is a different question
 * and the whole basis of the Roth-versus-traditional call.
 */
export const FEDERAL_BRACKETS_2026_SINGLE: readonly { upTo: number; rate: number }[] = [
  { upTo: 12_400, rate: 0.1 },
  { upTo: 50_400, rate: 0.12 },
  { upTo: 105_700, rate: 0.22 },
  { upTo: 201_775, rate: 0.24 },
  { upTo: 256_225, rate: 0.32 },
  { upTo: 640_600, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
]

/** 2026 standard deduction, single filer. */
export const STANDARD_DEDUCTION_2026_SINGLE = 16_100

/**
 * The bracket at which pre-tax generally beats Roth for someone starting out.
 *
 * Not a law, a rule of thumb, and the page says so. Below 22% you are probably
 * paying the lowest rate you will ever pay, so taking the tax now and never
 * again is the stronger side; at 22% and above the deduction today usually
 * wins. The tool reports which side of this line the person lands on and why,
 * rather than pretending the answer is certain.
 */
export const ROTH_BREAKEVEN_RATE = 0.22

/**
 * FICA. Applies to gross wages, and this is the detail that makes a 401(k) and
 * an HSA cost different amounts out of the same paycheck.
 *
 * A 401(k) deferral is exempt from income tax but NOT from FICA. An HSA
 * contribution through payroll is exempt from both. So a dollar into an HSA
 * costs about 7.65 cents less than a dollar into a 401(k), every time, and any
 * model that treats them the same understates the HSA.
 */
export const FICA_SOCIAL_SECURITY = 0.062
export const FICA_MEDICARE = 0.0145
export const FICA_TOTAL = FICA_SOCIAL_SECURITY + FICA_MEDICARE

/** Social Security stops at the wage base; Medicare does not. */
export const SS_WAGE_BASE_2026 = 184_500

/**
 * How long a new-hire enrollment window usually runs.
 *
 * Thirty days is the common default and it is NOT a rule — plans set their
 * own, and some are 14 days. The page presents the date as "likely" and tells
 * the reader to confirm it, because being wrong in the confident direction
 * here costs somebody a year of coverage.
 */
export const TYPICAL_ENROLLMENT_WINDOW_DAYS = 30
