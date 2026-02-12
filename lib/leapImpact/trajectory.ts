/**
 * Leap Impact Simulator — net worth trajectory simulation.
 *
 * Model: invested assets only (401k + match). No debt for MVP.
 * - Monthly contribution = (gross * pct / 100) / 12 for employee; match on same cap.
 * - Growth: compound at monthly real return.
 * Same formula as networthImpact/math computeInvestingImpact (FV of monthly contributions).
 */

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
 * Net worth at end of each year for a given contribution path.
 * Each year we add 12 months of contributions and compound from start of year to end of year.
 * Simplified: we treat each year's contributions as a single FV from that year (equivalent to
 * monthly contributions at monthly rate).
 */
function runPath(
  grossAnnual: number,
  contributionPct: number,
  matchPct: number,
  hasMatch: boolean,
  realReturn: number,
  years: number
): number[] {
  const monthlyRate = realReturn / MONTHS_PER_YEAR;
  const employeeMonthly = (grossAnnual * (contributionPct / 100)) / MONTHS_PER_YEAR;
  // Employer match: only on employee contribution, capped at matchPct of salary
  const matchMonthly = hasMatch
    ? (grossAnnual * (Math.min(contributionPct, matchPct) / 100)) / MONTHS_PER_YEAR
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
  matchPct: number;
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
  const baselineByYear = runPath(
    inputs.grossAnnual,
    inputs.current401kPct,
    inputs.matchPct,
    inputs.hasEmployerMatch,
    realReturn,
    years
  );
  const optimizedByYear = runPath(
    inputs.grossAnnual,
    inputs.optimized401kPct,
    inputs.matchPct,
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

  // Baseline path: current % for delayMonths, then optimized for rest
  const employeeBaseline = (inputs.grossAnnual * (inputs.current401kPct / 100)) / MONTHS_PER_YEAR;
  const matchBaseline = inputs.hasEmployerMatch
    ? (inputs.grossAnnual * (Math.min(inputs.current401kPct, inputs.matchPct) / 100)) / MONTHS_PER_YEAR
    : 0;
  const totalBaseline = employeeBaseline + matchBaseline;

  const employeeOpt = (inputs.grossAnnual * (inputs.optimized401kPct / 100)) / MONTHS_PER_YEAR;
  const matchOpt = inputs.hasEmployerMatch
    ? (inputs.grossAnnual * (Math.min(inputs.optimized401kPct, inputs.matchPct) / 100)) / MONTHS_PER_YEAR
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
