/**
 * Capital Allocation Framework — constants.
 *
 * IRS limits, kept current. These were stamped 2025 and went stale silently;
 * the name carried the year (`K401_EMPLOYEE_CAP_2025`) so every call site had
 * to be edited to refresh a number, which is why nobody did. The year now
 * lives in one place, `TAX_YEAR`, and the names are year-agnostic.
 *
 * Refresh each autumn when the IRS publishes the cost-of-living notice for
 * the following year, and update `TAX_YEAR` with it — the UI copy and the
 * FAQ both quote these figures with the year attached.
 *
 * Current source: IRS Notice 2025-67 (2026 amounts).
 * https://www.irs.gov/pub/irs-drop/n-25-67.pdf
 */

/** Tax year the limits below are drawn from. Quoted in user-facing copy. */
export const TAX_YEAR = 2026;

/** 401(k) employee deferral cap. */
export const K401_EMPLOYEE_CAP = 24500;

/**
 * IRA employee contribution limit, all IRAs combined.
 *
 * 2026 figure from IRS Notice 2025-67. Deliberately the BASE limit: the plan
 * never asks anyone's age, so it cannot know whether the $1,100 catch-up at 50+
 * applies. Understating the room routes a little extra to a brokerage account,
 * which is legal for anyone; overstating it recommends a contribution somebody
 * is not allowed to make.
 *
 * This exists because the post-tax "Retirement" line had no ceiling at all. On
 * $140,000 the plan was recommending $30,073 a year into it — four times what
 * anyone can put in an IRA — because the routing split a surplus by percentage
 * and never asked where the money was allowed to go.
 */
export const IRA_LIMIT = 7500;

/**
 * Catch-up contributions, and the odd shape they have in 2026.
 *
 * All from IRS Notice 2025-67. The 60-to-63 band is not a typo and not
 * cumulative: SECURE 2.0 gives those four ages a LARGER catch-up than 50-plus,
 * and at 64 it drops back to the standard one. Encoding that as a lookup
 * rather than a comparison is the only way it stays right.
 *
 *   under 50   401(k) $24,500   IRA $7,500
 *   50 to 59   401(k) $32,500   IRA $8,600
 *   60 to 63   401(k) $35,750   IRA $8,600
 *   64 plus    401(k) $32,500   IRA $8,600
 */
export const K401_CATCHUP_50 = 8000;
export const K401_CATCHUP_60_TO_63 = 11250;
export const IRA_CATCHUP_50 = 1100;

/**
 * The 401(k) employee deferral limit for someone of this age.
 *
 * Age is optional throughout the plan, and undefined means the base limit —
 * the same answer the tool gave before it asked. Understating the limit routes
 * a little extra to a brokerage account, which anyone may do; overstating it
 * recommends a contribution somebody is not allowed to make.
 */
export function k401LimitForAge(age?: number | null): number {
  if (age == null || age < 50) return K401_EMPLOYEE_CAP;
  if (age >= 60 && age <= 63) return K401_EMPLOYEE_CAP + K401_CATCHUP_60_TO_63;
  return K401_EMPLOYEE_CAP + K401_CATCHUP_50;
}

/** The IRA limit for someone of this age. One catch-up, no 60-to-63 band. */
export function iraLimitForAge(age?: number | null): number {
  if (age == null || age < 50) return IRA_LIMIT;
  return IRA_LIMIT + IRA_CATCHUP_50;
}

/** HSA max contribution, self-only. */
export const HSA_LIMIT_SINGLE = 4400;

/** HSA max contribution, family. */
export const HSA_LIMIT_FAMILY = 8750;

/** Default employer match rate (X): 100% = dollar-for-dollar. */
export const DEFAULT_MATCH_RATE_PCT = 100;

/** Default employer match cap (Y): up to 5% of salary. */
export const DEFAULT_MATCH_CAP_PCT = 5;

/**
 * Total retirement contribution we steer toward, as a percentage of gross,
 * INCLUDING the employer match.
 *
 * The tool used to steer at the IRS employee limit instead, which inverts with
 * income — see retirementTarget.ts. Fifteen is the number the summary card has
 * always claimed, and it was the fallback in selectPrimaryLeap the whole time.
 */
export const RETIREMENT_TARGET_PCT_OF_GROSS = 15;

/** EF target = this many months of essential expenses. */
export const EF_TARGET_MONTHS = 3;

/** Share of post-tax savings routed to EF until target. */
export const EF_ALLOC_PCT = 0.4;

/** Share of remaining (after EF) routed to high-APR debt. */
export const DEBT_ALLOC_PCT = 0.4;

/** Recommended HSA annual target when current = 0 (Builder-friendly starting point). */
export const HSA_RECOMMENDED_START = 2500;
