/**
 * A/B Test Helper for Day-0 Cash Reality Experiment
 * 
 * A/B TESTING DISABLED - Always returns Variant A (Control)
 * 
 * Previously assigned users to Variant A (Control) or Variant B (Test)
 * - 50/50 split
 * - Persists in localStorage
 * - Supports query param override for QA
 * 
 * Now always returns 'A' to disable A/B testing
 */

const STORAGE_KEY = 'rent_tool_ab_day0_cash_variant';
const QUERY_PARAM = 'ab_day0';

export type Variant = 'A' | 'B';

/**
 * Get the assigned variant for the current user
 * A/B TESTING DISABLED - Always returns 'A'
 */
export function getDay0CashVariant(): Variant {
  // A/B testing disabled - always return Variant A
  return 'A';
}

/**
 * Get variant without side effects (for read-only access)
 * A/B TESTING DISABLED - Always returns 'A'
 */
export function getDay0CashVariantReadOnly(): Variant | null {
  // A/B testing disabled - always return Variant A
  return 'A';
}
