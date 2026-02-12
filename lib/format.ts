/**
 * Formatting helpers for Net Worth Impact and other tools.
 * Currency with optional sign, and percentage.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Format as signed currency: +$1,234 or -$1,234 */
export function formatCurrencySigned(value: number): string {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(abs);
  if (value >= 0) return `+${formatted}`;
  return `-${formatted}`;
}

export function formatPercent(value: number, decimals: number = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/** Format contribution/target percentage for display (2 decimals). */
export function formatPct(value: number): string {
  return `${Number(value.toFixed(2))}%`;
}
