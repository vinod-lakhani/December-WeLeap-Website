/**
 * Leap Impact Simulator — Next Leaps stack preview.
 *
 * Canonical order from Savings Stack spec (HSA intentionally omitted for this tool):
 * 1. Emergency Fund
 * 2. Employer 401(k) Match
 * 3. (HSA — not shown)
 * 4. High-APR Debt (APR ≥ 10%)
 * 5. Retirement investing (post-match) — Retirement Focus split
 * 6. Brokerage investing
 *
 * We only have: salary, state, take-home, match y/n, match %, current 401k %.
 * Steps we cannot compute are marked as "Unlock in full plan".
 */

export type StackStepStatus = 'ready' | 'in_progress' | 'completed' | 'unlock' | 'later';

export interface StackPreviewStep {
  stepNumber: number;
  name: string;
  why: string;
  status: StackStepStatus;
  /** Short label for badge, e.g. "Unlock in full plan" */
  badge?: string;
}

/**
 * Returns the Next Leaps stack preview steps (3–5 steps).
 * Deterministic: no extra inputs; honest about what needs the full plan.
 */
export function getStackPreviewSteps(
  hasEmployerMatch: boolean,
  current401kPct: number,
  matchPct: number
): StackPreviewStep[] {
  // Step 1: Emergency Fund — 1-month buffer first (consistent with full stack policy)
  const step1: StackPreviewStep = {
    stepNumber: 1,
    name: 'Emergency Fund (1-month buffer first)',
    why: "Start with a 1-month safety buffer. We'll extend to 3–6 months in the full plan.",
    status: 'ready',
  };

  // Step 2: 401(k) Match — completed = "captured ✅" inline to reduce clutter
  const matchCaptured = !hasEmployerMatch || current401kPct >= matchPct;
  const step2: StackPreviewStep = {
    stepNumber: 2,
    name: matchCaptured ? '401(k) Match — captured ✅' : '401(k) Match',
    why: matchCaptured
      ? 'Guaranteed return — you’re capturing it.'
      : 'Guaranteed return ("free money") — capture your full match next.',
    status: matchCaptured ? 'completed' : 'in_progress',
  };

  // Step 3: High-APR Debt — we don't have debt/APR data
  const step3: StackPreviewStep = {
    stepNumber: 3,
    name: 'High-APR Debt (APR ≥ 10%)',
    why: 'Interest avoided is a guaranteed return. We’ll prioritize this in your full plan.',
    status: 'unlock',
    badge: 'Unlock in full plan',
  };

  // Step 4: Retirement vs Brokerage split — needs Retirement Focus (High/Medium/Low)
  const step4: StackPreviewStep = {
    stepNumber: 4,
    name: 'Retirement vs Brokerage split (post-match)',
    why: 'Your split depends on Retirement Focus (High / Medium / Low). We’ll set it in the full plan.',
    status: 'unlock',
    badge: 'Unlock in full plan',
  };

  // Step 5: Brokerage — after the above (minimized)
  const step5: StackPreviewStep = {
    stepNumber: 5,
    name: 'Brokerage investing (later)',
    why: 'After the above priorities.',
    status: 'later',
    badge: 'Later',
  };

  return [step1, step2, step3, step4, step5];
}
