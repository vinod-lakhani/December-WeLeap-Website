import { describe, it, expect } from 'vitest';
import { compute401kStatus, K401_EMPLOYEE_MAX } from './leverPriority';
import { getRecommendedLeap } from './leapDecision';
import { K401_EMPLOYEE_CAP, TAX_YEAR } from '@/lib/allocator/constants';

/**
 * The boundary cases below are written against `K401_EMPLOYEE_CAP` rather than
 * a literal. They previously hardcoded 23,500 and broke the moment the 2026
 * IRS figures landed — which tested the constant's value, not the boundary
 * logic they were named for. The one place the literal genuinely belongs is
 * the pin below, where failing on an IRS refresh is the point.
 */

/** Salary chosen so the cap lands on a clean percentage. */
const SALARY_AT_CAP = 100_000;
const CAP_PCT = (K401_EMPLOYEE_CAP / SALARY_AT_CAP) * 100;

describe('compute401kStatus', () => {
  it('salary=100k, 401k%=15% => annual=15k not maxed', () => {
    const result = compute401kStatus({
      salaryAnnual: 100_000,
      current401kPct: 15,
      hasEmployerMatch: true,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBe(15_000);
    expect(result.is401kMaxed).toBe(false);
    expect(result.matchCaptured).toBe(true); // 15% >= 5%
  });

  it('salary=200k, 401k%=15% => annual=30k => maxed true', () => {
    const result = compute401kStatus({
      salaryAnnual: 200_000,
      current401kPct: 15,
      hasEmployerMatch: true,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBe(30_000);
    expect(result.is401kMaxed).toBe(true);
  });

  it('boundary: one dollar under the cap => not maxed', () => {
    const salary = 235_000;
    const pct = ((K401_EMPLOYEE_CAP - 1) / salary) * 100;
    const result = compute401kStatus({
      salaryAnnual: salary,
      current401kPct: pct,
      hasEmployerMatch: false,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBeCloseTo(K401_EMPLOYEE_CAP - 1, 0);
    expect(result.is401kMaxed).toBe(false);
  });

  it('boundary: exactly at the cap => maxed', () => {
    const result = compute401kStatus({
      salaryAnnual: SALARY_AT_CAP,
      current401kPct: CAP_PCT,
      hasEmployerMatch: false,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBe(K401_EMPLOYEE_CAP);
    expect(result.is401kMaxed).toBe(true);
  });

  it('re-exports the cap from the single source of truth', () => {
    // Guards the re-export wiring without pinning a value — the value itself
    // is pinned once, below.
    expect(K401_EMPLOYEE_MAX).toBe(K401_EMPLOYEE_CAP);
  });
});

describe('IRS limits', () => {
  /**
   * Deliberately a literal. This test SHOULD fail when someone refreshes the
   * constants for a new tax year — that failure is the review gate, forcing
   * the new figure to be checked against the IRS notice rather than typed from
   * memory. These numbers are quoted to users in the allocator copy and FAQ.
   *
   * Current source: IRS Notice 2025-67 (2026 amounts).
   * https://www.irs.gov/pub/irs-drop/n-25-67.pdf
   */
  it('matches the published figures for the stated tax year', () => {
    expect(TAX_YEAR).toBe(2026);
    expect(K401_EMPLOYEE_CAP).toBe(24_500);
  });
});

describe('getRecommendedLeap', () => {
  it('salary=100k, 401k%=15% => not at cap, recommends increase toward the cap', () => {
    const leap = getRecommendedLeap(true, 5, 15, SALARY_AT_CAP);
    // 15% of 100k = 15k, below the cap. Should recommend increasing to CAP_PCT.
    expect(leap.type).toBe('increase_contribution');
    expect(leap.optimized401kPct).toBe(CAP_PCT);
    expect(leap.summary).toContain(`${CAP_PCT}%`);
  });

  it('salary=200k, 401k%=15% => at_cap (maxed)', () => {
    const leap = getRecommendedLeap(true, 5, 15, 200_000);
    expect(leap.type).toBe('at_cap');
    expect(leap.summary).toContain('Nice');
    expect(leap.summary).not.toContain('from 15% → 15%');
  });

  it('summary uses new format (no from X → Y)', () => {
    const leap = getRecommendedLeap(true, 5, 15, 100_000);
    expect(leap.summary).not.toMatch(/from .+% → .+%/);
    expect(leap.summary).toMatch(/Move toward/);
  });
});
