/**
 * Deep link to the Full Allocation Engine.
 * When NEXT_PUBLIC_ALLOCATOR_URL is set, use that (external app).
 * Otherwise use same-site /allocator with full prefill params.
 */

export type AllocatorIntent = 'lock_plan' | 'unlock_full_stack';

export interface AllocatorParams {
  salary: number;
  state: string;
  netMonthly?: number;
  recommended401kPct?: number;
}

/** Full prefill payload for post-email redirect (query params or storage). */
export interface AllocatorPrefillPayload {
  salaryAnnual: number;
  state: string;
  payFrequency?: string;
  employerMatchEnabled: boolean;
  employerMatchPct: number;
  current401kPct: number;
  recommended401kPct: number;
  estimatedNetMonthlyIncome?: number;
  leapDelta30yr?: number;
  costOfDelay12Mo?: number;
  intent: AllocatorIntent;
  source: string;
}

const ALLOCATOR_PATH = '/allocator';

function getAllocatorBase(): string {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_ALLOCATOR_URL) {
    return process.env.NEXT_PUBLIC_ALLOCATOR_URL;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin + ALLOCATOR_PATH;
  }
  return (process.env?.NEXT_PUBLIC_SITE_URL || 'https://www.weleap.ai') + ALLOCATOR_PATH;
}

/**
 * Build URL for email links (needs absolute URL). Uses NEXT_PUBLIC_SITE_URL on server.
 */
export function buildAllocatorUrl(params: AllocatorParams): string {
  const base = getAllocatorBase();
  const u = new URL(base);
  u.searchParams.set('salary', String(params.salary));
  u.searchParams.set('state', params.state);
  if (params.netMonthly != null) {
    u.searchParams.set('netMonthly', String(Math.round(params.netMonthly)));
  }
  if (params.recommended401kPct != null) {
    u.searchParams.set('401k', String(params.recommended401kPct));
  }
  return u.toString();
}

/**
 * Build Full Allocation Engine URL with full prefill (for post-email redirect).
 * Persists intent and all leap tool data via query params.
 */
export function buildAllocatorPrefillUrl(payload: AllocatorPrefillPayload): string {
  const base = typeof window !== 'undefined' ? window.location.origin + ALLOCATOR_PATH : (process.env?.NEXT_PUBLIC_SITE_URL || 'https://www.weleap.ai') + ALLOCATOR_PATH;
  const u = new URL(base);
  u.searchParams.set('salaryAnnual', String(payload.salaryAnnual));
  u.searchParams.set('state', payload.state);
  if (payload.payFrequency) u.searchParams.set('payFrequency', payload.payFrequency);
  u.searchParams.set('employerMatchEnabled', payload.employerMatchEnabled ? '1' : '0');
  u.searchParams.set('employerMatchPct', String(payload.employerMatchPct));
  u.searchParams.set('current401kPct', String(payload.current401kPct));
  u.searchParams.set('recommended401kPct', String(payload.recommended401kPct));
  if (payload.estimatedNetMonthlyIncome != null) {
    u.searchParams.set('estimatedNetMonthlyIncome', String(Math.round(payload.estimatedNetMonthlyIncome)));
  }
  if (payload.leapDelta30yr != null) {
    u.searchParams.set('leapDelta30yr', String(payload.leapDelta30yr));
  }
  if (payload.costOfDelay12Mo != null) {
    u.searchParams.set('costOfDelay12Mo', String(Math.round(payload.costOfDelay12Mo)));
  }
  u.searchParams.set('intent', payload.intent);
  u.searchParams.set('source', payload.source);
  return u.toString();
}
