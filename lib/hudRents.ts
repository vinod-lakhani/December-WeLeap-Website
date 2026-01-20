/**
 * Market reality rent data for 1-bedroom apartments
 * Based on current market conditions and actual rental rates
 * Note: These are estimates and may vary by neighborhood
 */

export interface HUDRentRange {
  low: number;
  high: number;
}

export interface HUDRentData {
  [cityKey: string]: HUDRentRange;
}

/**
 * Market reality rent ranges for 1-bedroom apartments
 * Ranges represent actual market rates based on current rental market conditions
 */
export const HUD_RENTS: HUDRentData = {
  'Austin, TX': {
    low: 1600,
    high: 1900,
  },
  'New York, NY': {
    low: 2800,
    high: 3400,
  },
  'San Francisco Bay Area, CA': {
    low: 3200,
    high: 3600,
  },
  'Seattle, WA': {
    low: 2200,
    high: 2600,
  },
  'Boston, MA': {
    low: 2700,
    high: 3200,
  },
  'Chicago, IL': {
    low: 1200,
    high: 1500,
  },
};

/**
 * Map city selection to HUD key
 */
export function getHUDKeyForCity(city: string): string | undefined {
  const mapping: Record<string, string> = {
    'Austin': 'Austin, TX',
    'NYC': 'New York, NY',
    'SF Bay Area': 'San Francisco Bay Area, CA',
    'Seattle': 'Seattle, WA',
    'Boston': 'Boston, MA',
    'Chicago': 'Chicago, IL',
  };

  return mapping[city];
}

/**
 * Get HUD rent range for a city
 */
export function getHUDRentRange(city: string): HUDRentRange | undefined {
  const hudKey = getHUDKeyForCity(city);
  if (!hudKey) return undefined;
  return HUD_RENTS[hudKey];
}

/**
 * Compare user safe rent range to HUD market rent range
 * Returns one of: 'above', 'overlap', 'below'
 */
export function compareRentRanges(
  userRentLow: number,
  userRentHigh: number,
  hudRentLow: number,
  hudRentHigh: number
): 'above' | 'overlap' | 'below' {
  // If user's max is below HUD's min, market is above safe range
  if (userRentHigh < hudRentLow) {
    return 'above';
  }
  
  // If user's min is above HUD's max, market is below safe range
  if (userRentLow > hudRentHigh) {
    return 'below';
  }
  
  // Otherwise, they overlap
  return 'overlap';
}
