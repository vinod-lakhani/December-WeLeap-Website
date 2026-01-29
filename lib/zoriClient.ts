/**
 * ZORI Client-Side Utilities
 * 
 * Client-safe functions for calculating market rent ranges.
 * These functions don't require file system access and can be used in browser components.
 */

export interface MarketRentRange {
  medianRent: number;
  buffered: number;
  marketLow: number;
  marketHigh: number;
  tier: 'T1' | 'T2' | 'T3' | 'T4';
  bufferPct: number;
  widthPct: number;
}

/**
 * Calculate market rent range based on median rent
 * Uses tier-based buffering and width calculation
 */
export function calculateMarketRentRange(medianRent: number): MarketRentRange {
  // Determine tier based on median rent
  let tier: 'T1' | 'T2' | 'T3' | 'T4';
  let bufferPct: number;
  let widthPct: number;
  
  if (medianRent >= 3000) {
    tier = 'T1';
    bufferPct = 0.08; // +8%
    widthPct = 0.06; // ±6%
  } else if (medianRent >= 2200) {
    tier = 'T2';
    bufferPct = 0.06; // +6%
    widthPct = 0.07; // ±7%
  } else if (medianRent >= 1500) {
    tier = 'T3';
    bufferPct = 0.04; // +4%
    widthPct = 0.08; // ±8%
  } else {
    tier = 'T4';
    bufferPct = 0.02; // +2%
    widthPct = 0.10; // ±10%
  }
  
  // Calculate buffered value
  const buffered = medianRent * (1 + bufferPct);
  
  // Calculate range
  const marketLow = buffered * (1 - widthPct);
  const marketHigh = buffered * (1 + widthPct);
  
  // Round to nearest $25
  const roundTo25 = (n: number) => Math.round(n / 25) * 25;
  
  return {
    medianRent,
    buffered,
    marketLow: roundTo25(marketLow),
    marketHigh: roundTo25(marketHigh),
    tier,
    bufferPct,
    widthPct,
  };
}

/**
 * Compare market rent range to safe rent range
 * Returns: 'above', 'overlap', or 'below'
 */
export function compareMarketToSafe(
  marketLow: number,
  marketHigh: number,
  safeLow: number,
  safeHigh: number
): 'above' | 'overlap' | 'below' {
  // If market's min is above safe's max, market is above safe range
  if (marketLow > safeHigh) {
    return 'above';
  }
  
  // If market's max is below safe's min, market is below safe range
  if (marketHigh < safeLow) {
    return 'below';
  }
  
  // Otherwise, they overlap
  return 'overlap';
}
