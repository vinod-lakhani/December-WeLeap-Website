/**
 * HUD Fair Market Rent (FMR) data for 1-bedroom apartments
 * Based on HUD 2024-2025 Fair Market Rent data
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
 * HUD Fair Market Rent ranges for 1-bedroom apartments
 * Ranges represent typical market rates (not prescriptive)
 */
export const HUD_RENTS: HUDRentData = {
  'Austin, TX': {
    low: 1300,
    high: 1500,
  },
  'New York, NY': {
    low: 1800,
    high: 2200,
  },
  'San Francisco Bay Area, CA': {
    low: 2200,
    high: 2600,
  },
  'Seattle, WA': {
    low: 1700,
    high: 2000,
  },
  'Boston, MA': {
    low: 1900,
    high: 2200,
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
