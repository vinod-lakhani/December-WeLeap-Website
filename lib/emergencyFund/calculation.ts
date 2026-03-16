/**
 * Emergency Fund Target calculation engine
 * Converts the vague "3–6 months" rule into a personalized target.
 */

export type IncomeStability =
  | 'very_stable'
  | 'mostly_stable'
  | 'somewhat_variable'
  | 'freelance';

export type CreditCardDebt = 'no' | 'occasionally' | 'yes';

export interface EmergencyFundInputs {
  monthlyIncome: number;
  monthlyExpenses: number;
  incomeStability: IncomeStability;
  hasDependents: boolean;
  currentSavings: number;
  creditCardDebt: CreditCardDebt;
}

export interface EmergencyFundResult {
  targetMonths: number;
  targetDollars: number;
  progressPct: number;
  reasons: string[];
}

const MIN_MONTHS = 2;
const MAX_MONTHS = 6;
const BASE_MONTHS = 3;

const INCOME_VOLATILITY_ADJUSTMENT: Record<IncomeStability, number> = {
  very_stable: 0,
  mostly_stable: 0.5,
  somewhat_variable: 1,
  freelance: 2,
};

/**
 * Calculate the recommended emergency fund target in months and dollars.
 */
export function calculateEmergencyFundTarget(inputs: EmergencyFundInputs): EmergencyFundResult {
  const {
    monthlyIncome,
    monthlyExpenses,
    incomeStability,
    hasDependents,
    currentSavings,
    creditCardDebt,
  } = inputs;

  let targetMonths = BASE_MONTHS;
  const reasons: string[] = [];

  // Income volatility
  const volatilityAdj = INCOME_VOLATILITY_ADJUSTMENT[incomeStability];
  targetMonths += volatilityAdj;
  if (volatilityAdj > 0) {
    reasons.push(
      volatilityAdj >= 2
        ? 'Your income is variable or freelance'
        : volatilityAdj >= 1
          ? 'Your income is somewhat variable'
          : 'Your income has some variability'
    );
  }

  // Expense pressure (essentials as % of income)
  const expenseRatio = monthlyIncome > 0 ? monthlyExpenses / monthlyIncome : 0;
  if (expenseRatio > 0.8) {
    targetMonths += 1.5;
    reasons.push('Your expenses consume a large share of income');
  } else if (expenseRatio > 0.65) {
    targetMonths += 1;
    reasons.push('Your expenses consume a significant share of income');
  }

  // Debt risk
  if (creditCardDebt === 'yes') {
    targetMonths += 0.5;
    reasons.push('You carry credit card debt');
  } else if (creditCardDebt === 'occasionally') {
    targetMonths += 0.25;
    reasons.push('You occasionally carry credit card debt');
  }

  // Dependents
  if (hasDependents) {
    targetMonths += 1;
    reasons.push('You have dependents');
  }

  // Low savings cushion
  const oneMonthExpenses = monthlyExpenses;
  if (currentSavings < oneMonthExpenses && oneMonthExpenses > 0) {
    targetMonths += 0.5;
    reasons.push('Your financial buffer is currently low');
  }

  // Clamp
  targetMonths = Math.max(MIN_MONTHS, Math.min(MAX_MONTHS, Math.round(targetMonths * 2) / 2));

  const targetDollars = monthlyExpenses * targetMonths;
  const progressPct =
    targetDollars > 0 ? Math.min(100, (currentSavings / targetDollars) * 100) : 0;

  return {
    targetMonths,
    targetDollars,
    progressPct,
    reasons: reasons.length > 0 ? reasons : ['Your situation suggests a standard buffer.'],
  };
}

export interface Milestone {
  months: number;
  targetDollars: number;
  label: string;
}

/**
 * Build milestone stages for the journey (1 month, 3 months, full target).
 */
export function getMilestones(
  monthlyExpenses: number,
  targetMonths: number
): Milestone[] {
  const milestones: Milestone[] = [];
  const oneMonth = monthlyExpenses;
  const threeMonths = monthlyExpenses * 3;
  const targetDollars = monthlyExpenses * targetMonths;

  // Always include 1 month
  milestones.push({ months: 1, targetDollars: oneMonth, label: 'basic cushion' });

  // Include 3 months if target > 3 (as "solid buffer")
  if (targetMonths > 3) {
    milestones.push({ months: 3, targetDollars: threeMonths, label: 'solid buffer' });
  }

  // Full target
  milestones.push({
    months: targetMonths,
    targetDollars,
    label: 'full target',
  });

  return milestones.sort((a, b) => a.months - b.months);
}

/**
 * Calculate months to reach target at a given monthly savings rate.
 */
export function monthsToReach(
  currentSavings: number,
  targetDollars: number,
  monthlySavings: number
): number | null {
  const gap = targetDollars - currentSavings;
  if (gap <= 0) return 0;
  if (monthlySavings <= 0) return null;
  return Math.ceil(gap / monthlySavings);
}

/**
 * Suggest a monthly savings amount (e.g. 10% of discretionary or a round number).
 */
export function suggestMonthlySavings(
  monthlyIncome: number,
  monthlyExpenses: number
): number {
  const discretionary = monthlyIncome - monthlyExpenses;
  if (discretionary <= 0) return 25;
  // 10% of discretionary, rounded to nearest $25, min $25
  const tenPct = discretionary * 0.1;
  const rounded = Math.round(tenPct / 25) * 25;
  return Math.max(25, Math.min(rounded, 500));
}
