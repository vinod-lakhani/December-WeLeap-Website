/**
 * Leap Impact Simulator — constants and defaults.
 * Align with WeLeap assumptions (e.g. default match %).
 */

/** Real (inflation-adjusted) return assumption for invested assets. 7% — consistent with Net Worth Impact tool. */
export const REAL_RETURN_DEFAULT = 0.07;

/** Builder target: suggest increasing 401(k) toward this % when already capturing match. */
export const BUILDER_TARGET_PCT = 12;

/** Default employer match % when user says "Yes" to match (matches common WeLeap assumption). */
export const DEFAULT_MATCH_PCT = 5;

/** Default current 401(k) contribution % (user input default). */
export const DEFAULT_CURRENT_401K_PCT = 5;

/** Time horizon in years for net worth projection. */
export const TRAJECTORY_YEARS = 30;

/** Cost-of-delay: assume user waits this many months before applying the Leap. */
export const DELAY_MONTHS = 12;
