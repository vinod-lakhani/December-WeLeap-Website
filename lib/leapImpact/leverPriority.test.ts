import { describe, it, expect } from 'vitest';
import { compute401kStatus, K401_EMPLOYEE_MAX } from './leverPriority';
import { getRecommendedLeap } from './leapDecision';

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

  it('boundary: annual=23499 => not maxed', () => {
    // 23499 / 23500 = 9.9996% of salary for 235k
    const salary = 235_000;
    const pct = (23_499 / salary) * 100; // ~10%
    const result = compute401kStatus({
      salaryAnnual: salary,
      current401kPct: pct,
      hasEmployerMatch: false,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBeCloseTo(23_499, 0);
    expect(result.is401kMaxed).toBe(false);
  });

  it('boundary: annual=23500 => maxed', () => {
    const result = compute401kStatus({
      salaryAnnual: 100_000,
      current401kPct: 23.5, // 100k * 23.5% = 23,500
      hasEmployerMatch: false,
      matchCapPct: 5,
    });
    expect(result.current401kAnnual).toBe(23_500);
    expect(result.is401kMaxed).toBe(true);
  });

  it('K401_EMPLOYEE_MAX is 23500', () => {
    expect(K401_EMPLOYEE_MAX).toBe(23_500);
  });
});

describe('getRecommendedLeap', () => {
  it('salary=100k, 401k%=15% => not at cap, recommends increase toward 23.5%', () => {
    const leap = getRecommendedLeap(true, 5, 15, 100_000);
    // 15% of 100k = 15k, below 23,500 cap. Cap % = 23.5%. Should recommend increase.
    expect(leap.type).toBe('increase_contribution');
    expect(leap.optimized401kPct).toBe(23.5);
    expect(leap.summary).toContain('15%');
    expect(leap.summary).toContain('23.5%');
  });

  it('salary=200k, 401k%=15% => at_cap (maxed)', () => {
    const leap = getRecommendedLeap(true, 5, 15, 200_000);
    expect(leap.type).toBe('at_cap');
    expect(leap.summary).toContain('Nice');
    expect(leap.summary).not.toContain('from 15% → 15%');
  });

  it('never returns "Increase 401(k) from X → X" (from==to)', () => {
    // Various combinations that could produce from==to
    const cases = [
      { salary: 100_000, current: 15, match: 5 },
      { salary: 100_000, current: 15, match: 15 },
      { salary: 100_000, current: 12, match: 5 },
      { salary: 200_000, current: 15, match: 5 },
    ];
    for (const c of cases) {
      const leap = getRecommendedLeap(true, c.match, c.current, c.salary);
      if (leap.type === 'increase_contribution' || leap.type === 'capture_match') {
        const match = leap.summary.match(/from ([\d.]+)% → ([\d.]+)%/);
        if (match) {
          expect(parseFloat(match[1])).not.toBe(parseFloat(match[2]));
        }
      }
    }
  });
});
