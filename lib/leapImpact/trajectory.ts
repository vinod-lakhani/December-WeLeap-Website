/**
 * Leap Impact Simulator — net worth trajectory simulation.
 *
 * Model: invested assets only (401k + match). No debt for MVP.
 * - Monthly contribution = (gross * pct / 100) / 12 for employee; match on same cap.
 * - Employee contributions capped at IRS limit ($23,500).
 * - Growth: compound at monthly real return.
 */

import { K401_EMPLOYEE_CAP_2025 } from '@/lib/allocator/constants';

const MONTHS_PER_YEAR = 12;

/**
 * Future value of a stream of monthly contributions, compounding at monthly rate i.
 * FV = P * ((1+i)^n - 1) / i. For i=0: FV = P * n.
 */
function fvMonthlyContributions(
  monthlyContribution: number,
  monthlyRate: number,
  numMonths: number
): number {
  if (monthlyRate === 0) {
    return monthlyContribution * numMonths;
  }
  return monthlyContribution * (Math.pow(1 + monthlyRate, numMonths) - 1) / monthlyRate;
}

/**
 * Employer match: X% match up to Y% of salary.
 * employerPctOfSalary = min(contributionPct * matchRatePct/100, matchCapPct).
 */
function employerMatchMonthly(
  grossAnnual: number,
  contributionPct: number,
  matchRatePct: number,
  matchCapPct: number
): number {
  const employerPctOfSalary = Math.min((contributionPct * matchRatePct) / 100, matchCapPct);
  return (grossAnnual * (employerPctOfSalary / 100)) / MONTHS_PER_YEAR;
}

/**
 * Net worth at end of each year for a given contribution path.
 */
function runPath(
  grossAnnual: number,
  contributionPct: number,
  matchCapPct: number,
  matchRatePct: number,
  hasMatch: boolean,
  realReturn: number,
  years: number
): number[] {
  const monthlyRate = realReturn / MONTHS_PER_YEAR;
  const employeeAnnual = Math.min((grossAnnual * contributionPct) / 100, K401_EMPLOYEE_CAP_2025);
  const employeeMonthly = employeeAnnual / MONTHS_PER_YEAR;
  const effectivePctForMatch = grossAnnual > 0 ? (employeeAnnual / grossAnnual) * 100 : 0;
  const matchMonthly = hasMatch
    ? employerMatchMonthly(grossAnnual, effectivePctForMatch, matchRatePct, matchCapPct)
    : 0;
  const totalMonthly = employeeMonthly + matchMonthly;

  const path: number[] = [0];
  let priorEnd = 0;
  for (let y = 1; y <= years; y++) {
    const monthsIn = y * MONTHS_PER_YEAR;
    const fvNew = fvMonthlyContributions(totalMonthly, monthlyRate, MONTHS_PER_YEAR);
    const grownPrior = priorEnd * Math.pow(1 + monthlyRate, MONTHS_PER_YEAR);
    priorEnd = grownPrior + fvNew;
    path.push(Math.round(priorEnd));
  }
  return path;
}

export interface TrajectoryInputs {
  grossAnnual: number;
  current401kPct: number;
  optimized401kPct: number;
  /** Match cap (Y): up to Y% of salary. */
  matchPct: number;
  /** Match rate (X): e.g. 100 = 100% match, 50 = 50% match. Default 100. */
  matchRatePct?: number;
  hasEmployerMatch: boolean;
  realReturn?: number;
  years?: number;
}

export interface TrajectoryResult {
  /** Net worth at end of each year, baseline path */
  baselineByYear: number[];
  /** Net worth at end of each year, optimized path */
  optimizedByYear: number[];
  /** Year indices (0..years) */
  yearLabels: number[];
  /** Net worth at final year, baseline */
  baselineEnd: number;
  /** Net worth at final year, optimized */
  optimizedEnd: number;
  /** Delta at final year (optimized - baseline) */
  delta30yr: number;
}

/**
 * Compute baseline and optimized net worth trajectories over time.
 * Baseline uses current 401(k) %; optimized uses recommended (e.g. full match or +2%).
 */
export function runTrajectory(inputs: TrajectoryInputs): TrajectoryResult {
  const realReturn = inputs.realReturn ?? 0.07;
  const years = inputs.years ?? 30;
  const matchRatePct = inputs.matchRatePct ?? 100;
  const baselineByYear = runPath(
    inputs.grossAnnual,
    inputs.current401kPct,
    inputs.matchPct,
    matchRatePct,
    inputs.hasEmployerMatch,
    realReturn,
    years
  );
  const optimizedByYear = runPath(
    inputs.grossAnnual,
    inputs.optimized401kPct,
    inputs.matchPct,
    matchRatePct,
    inputs.hasEmployerMatch,
    realReturn,
    years
  );
  const yearLabels = Array.from({ length: years + 1 }, (_, i) => i);
  const baselineEnd = baselineByYear[baselineByYear.length - 1] ?? 0;
  const optimizedEnd = optimizedByYear[optimizedByYear.length - 1] ?? 0;
  const delta30yr = optimizedEnd - baselineEnd;

  return {
    baselineByYear,
    optimizedByYear,
    yearLabels,
    baselineEnd,
    optimizedEnd,
    delta30yr,
  };
}

/**
 * Cost of delay: if user waits 12 months before applying the Leap, how much less
 * do they have at Year 30 vs applying the Leap today?
 * Simulate: baseline for 12 months, then switch to optimized for remaining months.
 * Compare final NW to "optimized from start".
 */
export function costOfDelay(
  inputs: TrajectoryInputs,
  delayMonths: number = 12
): number {
  const realReturn = inputs.realReturn ?? 0.07;
  const years = inputs.years ?? 30;
  const monthlyRate = realReturn / MONTHS_PER_YEAR;

  const matchRatePct = inputs.matchRatePct ?? 100;
  const employeeBaselineAnnual = Math.min(
    (inputs.grossAnnual * inputs.current401kPct) / 100,
    K401_EMPLOYEE_CAP_2025
  );
  const employeeBaseline = employeeBaselineAnnual / MONTHS_PER_YEAR;
  const baselinePctForMatch = inputs.grossAnnual > 0 ? (employeeBaselineAnnual / inputs.grossAnnual) * 100 : 0;
  const matchBaseline = inputs.hasEmployerMatch
    ? employerMatchMonthly(inputs.grossAnnual, baselinePctForMatch, matchRatePct, inputs.matchPct)
    : 0;
  const totalBaseline = employeeBaseline + matchBaseline;

  const employeeOptAnnual = Math.min(
    (inputs.grossAnnual * inputs.optimized401kPct) / 100,
    K401_EMPLOYEE_CAP_2025
  );
  const employeeOpt = employeeOptAnnual / MONTHS_PER_YEAR;
  const optPctForMatch = inputs.grossAnnual > 0 ? (employeeOptAnnual / inputs.grossAnnual) * 100 : 0;
  const matchOpt = inputs.hasEmployerMatch
    ? employerMatchMonthly(inputs.grossAnnual, optPctForMatch, matchRatePct, inputs.matchPct)
    : 0;
  const totalOpt = employeeOpt + matchOpt;

  // NW after delay period (baseline contributions only)
  const nwAfterDelay = fvMonthlyContributions(totalBaseline, monthlyRate, delayMonths);
  const remainingMonths = years * MONTHS_PER_YEAR - delayMonths;
  const fvRest = fvMonthlyContributions(totalOpt, monthlyRate, remainingMonths);
  const grownDelay = nwAfterDelay * Math.pow(1 + monthlyRate, remainingMonths);
  const nw30IfDelayed = grownDelay + fvRest;

  // NW if optimized from start
  const nw30OptimizedFromStart = runTrajectory(inputs).optimizedEnd;

  return Math.round(nw30OptimizedFromStart - nw30IfDelayed);
}
