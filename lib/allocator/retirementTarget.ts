/**
 * How much of your pay should go into retirement.
 *
 * This used to be `K401_EMPLOYEE_CAP / salary`, i.e. whatever percentage lands
 * on the IRS annual limit. The IRS limit is a ceiling, and using a ceiling as
 * a target makes the advice get MORE aggressive as income falls, because the
 * same $24,500 is a bigger share of a smaller salary:
 *
 *   $45,000 →  54.4% of gross
 *   $60,000 →  40.8%
 *   $120,000 →  20.4%
 *   $200,000 →  12.2%
 *
 * On $60k in TX with $2,400 of essentials, 40.83% left a take-home of $2,377
 * against essentials of $2,400 — so the surplus clamped to zero and the entire
 * post-tax plan (buffer, debt, retirement, flex) rendered empty. The tool was
 * recommending a contribution that made its own plan impossible, and the card
 * said "getting to 15% of pay into retirement" while displaying 40.83%.
 *
 * So: 15% of gross, counting the employer match, clamped to the IRS limit. The
 * match counts because it is retirement money arriving in the same account —
 * ignoring it would ask a 5%-matched employee for 15% of their own pay to hit
 * a 20% total, which is a different (and unstated) rule.
 */

import { K401_EMPLOYEE_CAP, RETIREMENT_TARGET_PCT_OF_GROSS } from './constants'
import { computeNetTakeHomeMonthly } from './takeHome'

export interface RetirementTargetInputs {
  salaryAnnual: number
  current401kPct: number
  hasEmployerMatch: boolean
  /** Percentage of salary the employer matches up to. */
  matchCapPct: number
  /** Match rate: 100 = dollar-for-dollar, 50 = fifty cents on the dollar. */
  matchRatePct: number
  /**
   * Essential monthly spend, when known.
   *
   * Turns on the solvency floor below. Omitted before the buffer step, which
   * is fine — the rule alone leaves a workable surplus at every income we
   * checked, and the floor exists for the stretched cases, not the typical one.
   */
  essentialsMonthly?: number
  stateCode?: string
  currentHsaAnnual?: number
}

/** Employer contribution as a percentage of gross, once the match is captured. */
export function employerMatchPctOfGross(inputs: {
  hasEmployerMatch: boolean
  matchCapPct: number
  matchRatePct: number
  employeePct: number
}): number {
  if (!inputs.hasEmployerMatch) return 0
  const matched = Math.min(inputs.employeePct, inputs.matchCapPct)
  return (matched * inputs.matchRatePct) / 100
}

/**
 * The lowest target we will ever recommend.
 *
 * Whatever the person already does, and at least enough to capture the match —
 * the match is the one step in this whole plan that pays 100%, so no floor may
 * sit below it.
 */
function floorPct(inputs: RetirementTargetInputs): number {
  const matchFloor = inputs.hasEmployerMatch ? inputs.matchCapPct : 0
  return Math.max(inputs.current401kPct, matchFloor)
}

/** 15% of gross including the match, before any clamping. */
function rulePct(inputs: RetirementTargetInputs): number {
  const employerShare = employerMatchPctOfGross({
    hasEmployerMatch: inputs.hasEmployerMatch,
    matchCapPct: inputs.matchCapPct,
    matchRatePct: inputs.matchRatePct,
    // Evaluated at the match cap because this rule only applies once the match
    // is captured; below that, capturing it is the recommendation.
    employeePct: inputs.matchCapPct,
  })
  return Math.max(0, RETIREMENT_TARGET_PCT_OF_GROSS - employerShare)
}

/** The IRS employee deferral limit, as a percentage of this salary. */
function irsCeilingPct(salaryAnnual: number): number {
  if (salaryAnnual <= 0) return 100
  return Math.min((K401_EMPLOYEE_CAP / salaryAnnual) * 100, 100)
}

/**
 * The largest target at or below `ceiling` that still leaves the essentials
 * covered, never going below `floor`.
 *
 * Take-home falls monotonically as the deferral rises, so this is a binary
 * search on a quarter-point grid rather than anything cleverer. It exists to
 * make one outcome unreachable: advice whose own arithmetic leaves the reader
 * unable to pay rent. If even the floor fails that test the floor is returned
 * anyway — at that point the honest answer is "capture the match and no more",
 * not a smaller increase dressed up as a plan.
 */
function applySolvencyFloor(inputs: RetirementTargetInputs, ceiling: number, floor: number): number {
  const { essentialsMonthly } = inputs
  if (essentialsMonthly == null || essentialsMonthly <= 0) return ceiling

  const surplusAt = (pct: number) =>
    computeNetTakeHomeMonthly({
      salaryAnnual: inputs.salaryAnnual,
      employee401kPct: pct,
      currentHsaAnnual: inputs.currentHsaAnnual ?? 0,
      stateCode: inputs.stateCode ?? '',
    }) - essentialsMonthly

  if (surplusAt(ceiling) >= 0) return ceiling
  if (surplusAt(floor) < 0) return floor

  let lo = floor
  let hi = ceiling
  for (let i = 0; i < 24 && hi - lo > 0.25; i++) {
    const mid = (lo + hi) / 2
    if (surplusAt(mid) >= 0) lo = mid
    else hi = mid
  }
  return Math.floor(lo * 4) / 4
}

/**
 * The 401(k) percentage to recommend, all rules applied.
 *
 * Never returns less than the person already contributes, so this can be used
 * directly as a target without a separate "is this an increase" check.
 */
export function computeRetirementTargetPct(inputs: RetirementTargetInputs): number {
  const floor = floorPct(inputs)
  const ceiling = Math.max(floor, Math.min(rulePct(inputs), irsCeilingPct(inputs.salaryAnnual)))
  return applySolvencyFloor(inputs, ceiling, floor)
}

/** Total retirement contribution at a given deferral, as a percentage of gross. */
export function totalRetirementPctOfGross(inputs: RetirementTargetInputs, employeePct: number): number {
  return (
    employeePct +
    employerMatchPctOfGross({
      hasEmployerMatch: inputs.hasEmployerMatch,
      matchCapPct: inputs.matchCapPct,
      matchRatePct: inputs.matchRatePct,
      employeePct,
    })
  )
}
