/**
 * Shared 401(k) status and lever priority logic.
 * Used by Leap Impact Simulator and Full Leap (allocator) for consistent behavior.
 */

import { K401_EMPLOYEE_CAP_2025 } from '@/lib/allocator/constants';

/** IRS 401(k) employee deferral limit (2025). Alias for shared use. */
export const K401_EMPLOYEE_MAX = K401_EMPLOYEE_CAP_2025;

export interface Compute401kStatusInputs {
  salaryAnnual: number;
  current401kPct: number;
  hasEmployerMatch: boolean;
  matchCapPct: number;
}

export interface Compute401kStatusResult {
  current401kAnnual: number;
  is401kMaxed: boolean;
  matchCaptured: boolean;
}

/**
 * Compute 401(k) status: annual contribution, whether at IRS cap, whether match is captured.
 * Used by both Leap Impact and Full Leap for consistent maxed detection.
 */
export function compute401kStatus(inputs: Compute401kStatusInputs): Compute401kStatusResult {
  const { salaryAnnual, current401kPct, hasEmployerMatch, matchCapPct } = inputs;

  const current401kAnnual =
    salaryAnnual > 0 ? (salaryAnnual * current401kPct) / 100 : 0;

  // At cap: current contribution >= IRS limit. No tolerance (23499 not maxed, 23500 maxed).
  const is401kMaxed = salaryAnnual > 0 && current401kAnnual >= K401_EMPLOYEE_MAX;

  // Match captured = contributing at or above employer match cap (or no match)
  const matchCaptured = !hasEmployerMatch || current401kPct >= matchCapPct;

  return { current401kAnnual, is401kMaxed, matchCaptured };
}
