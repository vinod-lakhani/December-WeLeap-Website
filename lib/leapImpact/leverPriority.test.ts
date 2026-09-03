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

/**
 * The two rewritten cases below used to assert the IRS limit as the target.
 *
 * That was the behaviour, so the tests were honest — but the behaviour was
 * wrong, and pinning it made the wrongness look intentional. Steering at the
 * limit makes the advice harsher the less someone earns (40.8% of gross on
 * $60k, 54.4% on $45k), because the same $24,500 is a bigger share of a
 * smaller salary. The target is now 15% of gross including the employer match,
 * clamped to the limit. See lib/allocator/retirementTarget.ts.
 */
describe('getRecommendedLeap', () => {
  it('salary=100k, 401k%=15% => already at the 15% target, not "maxed"', () => {
    const leap = getRecommendedLeap(true, 5, 15, SALARY_AT_CAP);
    // A 5% dollar-for-dollar match plus 15% of their own pay is 20% of gross,
    // past the target. Reported as at_target: they are $9,500 short of the IRS
    // limit, so the old at_cap answer ("hitting the annual 401(k) limit") was
    // simply untrue for them.
    expect(leap.type).toBe('at_target');
    expect(leap.optimized401kPct).toBe(15);
    expect(leap.summary).not.toContain('limit');
  });

  it('salary=100k, 401k%=5% => recommends 10%, which is 15% with the match', () => {
    const leap = getRecommendedLeap(true, 5, 5, SALARY_AT_CAP);
    expect(leap.type).toBe('increase_contribution');
    expect(leap.optimized401kPct).toBe(10);
    // The old rule sent this person to CAP_PCT instead.
    expect(leap.optimized401kPct).toBeLessThan(CAP_PCT);
  });

  it('the target no longer rises as salary falls', () => {
    const at = (salaryAnnual: number) => getRecommendedLeap(true, 5, 5, salaryAnnual).optimized401kPct;
    // Old rule: 54.4 / 40.8 / 24.5 / 12.2 — strictly worse for lower earners.
    expect([at(45_000), at(60_000), at(100_000), at(200_000)]).toEqual([10, 10, 10, 10]);
  });

  it('still clamps to the IRS limit where 15% of gross would exceed it', () => {
    // 10% of $300k is $30,000, past the $24,500 employee limit.
    const leap = getRecommendedLeap(true, 5, 5, 300_000);
    expect((300_000 * leap.optimized401kPct) / 100).toBeLessThanOrEqual(K401_EMPLOYEE_CAP);
  });

  it('salary=200k, 401k%=15% => at_cap (maxed)', () => {
    const leap = getRecommendedLeap(true, 5, 15, 200_000);
    expect(leap.type).toBe('at_cap');
    expect(leap.summary).toContain('Nice');
    expect(leap.summary).not.toContain('from 15% → 15%');
  });

  it('summary never uses the old "from X → Y" format', () => {
    const leap = getRecommendedLeap(true, 5, 5, 100_000);
    expect(leap.summary).not.toMatch(/from .+% → .+%/);
    expect(leap.summary).toMatch(/Move toward/);
  });
});
