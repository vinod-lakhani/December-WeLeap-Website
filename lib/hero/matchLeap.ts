import { computeInvestingImpact } from '@/lib/networthImpact/math'
import { DEFAULT_MATCH_RATE_PCT, DEFAULT_MATCH_CAP_PCT, K401_EMPLOYEE_CAP } from '@/lib/allocator/constants'

/**
 * The homepage's one-question Leap.
 *
 * The hero asks for a salary and nothing else, which constrains what it is
 * honest to claim. It CANNOT know what someone currently defers, so it does
 * not report a shortfall — "you're leaving $X on the table" would be a
 * statement about a number nobody supplied.
 *
 * What one input does support is the size of the prize: how much an employer
 * will match at a typical arrangement. That is a real figure, it is bigger
 * than a shortfall would be, and the assumption behind it can be printed next
 * to it in one line.
 *
 * The same defaults the allocator already uses (100% up to 5%), so the
 * homepage and the money plan cannot quote different numbers for the same
 * salary.
 */

export interface MatchLeap {
  /** Employer money available per month, at the default match. */
  monthly: number
  /** The same figure annually. */
  annual: number
  /** What the monthly amount becomes after 30 years at 7% real. */
  thirtyYear: number
  /** The employee contribution needed to unlock it, as a percent of salary. */
  contributionPct: number
}

/** Long-run real return, matching every other projection on the site. */
const REAL_RETURN = 0.07
const HORIZON_YEARS = 30

/** Below this a match figure is too small to be worth a headline. */
const MIN_SALARY = 12000
/** Above this the input is far likelier to be a typo than a salary. */
const MAX_SALARY = 2_000_000

export function computeMatchLeap(salaryAnnual: number): MatchLeap | null {
  if (!Number.isFinite(salaryAnnual)) return null
  if (salaryAnnual < MIN_SALARY || salaryAnnual > MAX_SALARY) return null

  const contributionPct = DEFAULT_MATCH_CAP_PCT
  const employeeAnnual = salaryAnnual * (contributionPct / 100)

  /**
   * Capped at the IRS employee deferral limit.
   *
   * An employer only matches what the employee actually defers, and above the
   * cap the employee cannot defer any more — so on a high salary the match
   * stops growing with income. Without this the hero would quote a figure a
   * high earner is not allowed to reach.
   */
  const matchedEmployeeAnnual = Math.min(employeeAnnual, K401_EMPLOYEE_CAP)
  const annual = matchedEmployeeAnnual * (DEFAULT_MATCH_RATE_PCT / 100)
  const monthly = annual / 12

  return {
    monthly,
    annual,
    thirtyYear: computeInvestingImpact(monthly, REAL_RETURN, HORIZON_YEARS),
    contributionPct,
  }
}

/** The assumption, in the words printed under the number. */
export const MATCH_ASSUMPTION = `Assumes an employer match of ${DEFAULT_MATCH_RATE_PCT}% up to ${DEFAULT_MATCH_CAP_PCT}% of salary, and 7% a year over 30 years.`
