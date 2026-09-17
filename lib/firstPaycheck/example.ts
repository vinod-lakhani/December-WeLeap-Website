/**
 * The starting salary in the creative, worked out.
 *
 * Campaign traffic arrives holding a promise about a number, and the page has
 * about two seconds to look like the thing that made it. So the first screen
 * is not a form that leads to an answer; it is an answer already running, with
 * one field in it.
 *
 * Shown as an EXAMPLE and labelled as one until the visitor types. The offer
 * tool learned this the hard way: defaulting the ad's figures reaches the same
 * headline by telling every visitor that their own offer contains numbers it
 * does not, and those numbers do not stay on the page — they feed a share
 * claim. The defaults here are different in kind, which is why this one is
 * safer than the offer example: a dollar-for-dollar match to 4% and twice-a-
 * month pay are close to the median, not a guess about one person. They are
 * still the tool's own defaults rather than assertions about the visitor, and
 * every one of them is editable below.
 *
 * Every figure is produced by computeFirstPaycheck, the same function that
 * answers a real one, so the example cannot drift away from what the
 * calculator would say. example.test.ts fails if it does — which is the signal
 * that the ad needs rewriting, not the page.
 */

import { computeFirstPaycheck, type FirstPaycheckInputs } from './calculation'

/**
 * The job the creative describes.
 *
 * $62,000 deliberately matches the offer campaign's example. The two tools are
 * the same person's week, six weeks apart, and quoting two different salaries
 * across two ads for the same product is a small thing that reads as carelessness.
 */
export const EXAMPLE_JOB: FirstPaycheckInputs = {
  salaryAnnual: 62_000,
  // No state. The blend is what the tool honestly has before somebody says
  // where they work, and the example must not be quietly luckier than the
  // page: picking Texas here would make every visitor who types a real state
  // watch their paycheck fall.
  stateCode: '',
  payFrequency: 'semimonthly',
  matchRatePct: 100,
  matchCapPct: 4,
  hsaEligible: false,
  startDate: null,
}

const priced = computeFirstPaycheck(EXAMPLE_JOB)

export const PAYCHECK_EXAMPLE = {
  salary: EXAMPLE_JOB.salaryAnnual,
  matchCapPct: EXAMPLE_JOB.matchCapPct,
  matchRatePct: EXAMPLE_JOB.matchRatePct,
  /** What the payroll portal would show as gross for one period. */
  gross: priced.grossPerCheck,
  /** What actually lands. */
  takeHome: priced.takeHomePerCheck,
  /** The employer money the 401(k) percentage is there to capture. */
  match: priced.employerMatchAnnual,
  /** The percentage to type, which is the whole answer the tool sells. */
  contributionPct: priced.contributionPct,
} as const
