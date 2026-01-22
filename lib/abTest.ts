/**
 * A/B Test Helper for Day-0 Cash Reality Experiment
 * 
 * Assigns users to Variant A (Control) or Variant B (Test)
 * - 50/50 split
 * - Persists in localStorage
 * - Supports query param override for QA
 */

const STORAGE_KEY = 'rent_tool_ab_day0_cash_variant';
const QUERY_PARAM = 'ab_day0';

export type Variant = 'A' | 'B';

/**
 * Get the assigned variant for the current user
 * - Checks query param first (for QA/testing)
 * - Then checks localStorage (for persistence)
 * - Otherwise assigns 50/50 split and saves to localStorage
 */
export function getDay0CashVariant(): Variant {
  // Check query param override first (for QA)
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const queryVariant = urlParams.get(QUERY_PARAM);
    if (queryVariant === 'A' || queryVariant === 'B') {
      return queryVariant as Variant;
    }

    // Check localStorage for existing assignment
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'A' || stored === 'B') {
      return stored as Variant;
    }

    // Assign 50/50 split
    const variant: Variant = Math.random() < 0.5 ? 'A' : 'B';
    localStorage.setItem(STORAGE_KEY, variant);
    return variant;
  }

  // Server-side default (shouldn't happen, but TypeScript needs it)
  return 'A';
}

/**
 * Get variant without side effects (for read-only access)
 * Useful for analytics where you don't want to assign if not already assigned
 */
export function getDay0CashVariantReadOnly(): Variant | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Check query param
  const urlParams = new URLSearchParams(window.location.search);
  const queryVariant = urlParams.get(QUERY_PARAM);
  if (queryVariant === 'A' || queryVariant === 'B') {
    return queryVariant as Variant;
  }

  // Check localStorage
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'A' || stored === 'B') {
    return stored as Variant;
  }

  return null;
}
