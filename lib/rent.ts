/**
 * Rent calculation utilities
 * Based on the 28-35% rule of take-home pay
 */

import { roundToNearest25, formatCurrencyRange } from './rounding';
import { computeInvestingImpact } from '@/lib/networthImpact/math';

/** Real return assumption (7%) — aligned with Net Worth Impact tool */
const REAL_RETURN = 0.07;

/**
 * Estimate net worth protection over 30 years from staying in safe rent range.
 * Assumes overspend = 5% of take-home (going from 35% to 40% rent).
 * Protection = FV of that monthly savings invested at 7% for 30 years.
 */
export function rentNetWorthProtection30yr(takeHomeMonthly: number): number {
  if (takeHomeMonthly <= 0) return 0;
  const monthlyOverspendAvoided = takeHomeMonthly * 0.05;
  return Math.round(computeInvestingImpact(monthlyOverspendAvoided, REAL_RETURN, 30));
}

export interface RentRange {
  low: number;
  high: number;
  formatted: string;
}

/**
 * Calculate safe rent range based on monthly take-home pay
 * 
 * Formula:
 * - Base = takeHomeMonthly - debtMonthly (minimum 0)
 * - Low = 28% of Base
 * - High = 35% of Base
 * - Both rounded to nearest $25
 * 
 * @param takeHomeMonthly Monthly take-home pay after taxes
 * @param debtMonthly Optional monthly debt payments
 */
export function calculateRentRange(
  takeHomeMonthly: number,
  debtMonthly: number = 0
): RentRange {
  // Base is take-home minus debt, clamped to minimum 0
  const base = Math.max(0, takeHomeMonthly - debtMonthly);
  
  // Calculate percentages
  const lowRaw = base * 0.28;
  const highRaw = base * 0.35;
  
  // Round to nearest $25
  const low = roundToNearest25(lowRaw);
  const high = roundToNearest25(highRaw);
  
  // Format for display
  const formatted = formatCurrencyRange(low, high);
  
  return {
    low,
    high,
    formatted,
  };
}

/**
 * Calculate needs/wants/savings breakdown
 * Based on 50/30/20 rule
 */
export interface BudgetBreakdown {
  needs: number;
  wants: number;
  savings: number;
}

/**
 * Calculate monthly budget breakdown using 50/30/20 rule
 * All values rounded to nearest $10
 */
export function calculateBudgetBreakdown(
  takeHomeMonthly: number
): BudgetBreakdown {
  const needs = Math.round(takeHomeMonthly * 0.5 / 10) * 10;
  const wants = Math.round(takeHomeMonthly * 0.3 / 10) * 10;
  const savings = takeHomeMonthly - needs - wants; // Remainder to ensure total adds up
  
  return {
    needs,
    wants,
    savings,
  };
}

/**
 * What a move costs before the first paycheck lands.
 *
 * Extracted from RentTool so the campaign hero and the tool cannot quote two
 * different figures for the same move — the hero is the number in an ad, and
 * a visitor who scrolls to the full tool must not find it disagreeing with
 * the thing that brought them.
 *
 * The gap is the part nobody budgets for and the reason this exists: starting
 * a job means two to four weeks of living costs with no salary behind them,
 * on top of a deposit and a first month paid on the same day.
 *
 * Deposit is assumed to be one month. Plenty of landlords ask for more and
 * some want last month's as well, so this is a floor rather than a forecast,
 * and anywhere it is shown says so.
 */
export const UPFRONT = {
  /** Days between moving in and the first paycheck. */
  gapDays: 14,
  /** Share of take-home that keeps going out during the gap. */
  gapSpendRate: 0.35,
  /** Truck, deposits on utilities, the things bought in week one. */
  movingSetup: 600,
} as const

export interface UpfrontCash {
  low: number
  high: number
  /** The individual lines, at the low end, so a page can show its working. */
  depositLow: number
  firstMonthLow: number
  gapLiving: number
  movingSetup: number
}

export function calculateUpfrontCash(
  rent: RentRange,
  takeHomeMonthly: number,
): UpfrontCash {
  if (takeHomeMonthly <= 0) {
    return { low: 0, high: 0, depositLow: 0, firstMonthLow: 0, gapLiving: 0, movingSetup: 0 }
  }
  const gapLiving = takeHomeMonthly * UPFRONT.gapSpendRate * (UPFRONT.gapDays / 30)
  const totalLow = rent.low * 2 + gapLiving + UPFRONT.movingSetup
  const totalHigh = rent.high * 2 + gapLiving + UPFRONT.movingSetup
  return {
    low: Math.round(totalLow / 100) * 100,
    high: Math.round(totalHigh / 100) * 100,
    depositLow: rent.low,
    firstMonthLow: rent.low,
    gapLiving,
    movingSetup: UPFRONT.movingSetup,
  }
}

/**
 * What the listing sites and most landlord calculators allow: 30% of GROSS.
 *
 * The number this tool exists to argue with. Rent is paid out of what lands in
 * the account, and quoting the rule on a salary nobody receives is how people
 * sign leases they cannot carry.
 */
export function listingSiteRentMonthly(salaryAnnual: number): number {
  return (salaryAnnual * 0.3) / 12
}
