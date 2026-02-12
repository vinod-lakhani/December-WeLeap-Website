/**
 * Capital Allocation Framework — constants.
 * HSA limits (IRS 2025). Match defaults for UI.
 */

/** HSA max contribution, self-only (2025). */
export const HSA_LIMIT_SINGLE = 4300;

/** HSA max contribution, family (2025). */
export const HSA_LIMIT_FAMILY = 8550;

/** Default employer match rate (X): 100% = dollar-for-dollar. */
export const DEFAULT_MATCH_RATE_PCT = 100;

/** Default employer match cap (Y): up to 5% of salary. */
export const DEFAULT_MATCH_CAP_PCT = 5;

/** EF target = this many months of essential expenses. */
export const EF_TARGET_MONTHS = 3;

/** Share of post-tax savings routed to EF until target. */
export const EF_ALLOC_PCT = 0.4;

/** Share of remaining (after EF) routed to high-APR debt. */
export const DEBT_ALLOC_PCT = 0.4;

/** Recommended HSA annual target when current = 0 (Builder-friendly starting point). */
export const HSA_RECOMMENDED_START = 2500;
