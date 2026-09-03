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
