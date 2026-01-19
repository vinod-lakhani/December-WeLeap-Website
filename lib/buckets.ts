/**
 * Privacy-safe bucketing functions for GA4 tracking
 * 
 * These functions convert raw user data into anonymized buckets
 * to avoid sending PII (personally identifiable information) to analytics.
 */

/**
 * Bucket salary into ranges
 * 
 * @param grossAnnual - Annual gross salary
 * @returns Salary bucket string
 */
export function bucketSalary(grossAnnual: number): string {
  if (grossAnnual < 60000) return '<60k';
  if (grossAnnual < 80000) return '60_80k';
  if (grossAnnual < 100000) return '80_100k';
  if (grossAnnual < 150000) return '100_150k';
  return '150k_plus';
}

/**
 * Bucket rent ratio (rent / take-home monthly)
 * 
 * @param rent - Monthly rent amount
 * @param takeHomeMonthly - Monthly take-home pay
 * @returns Rent ratio bucket string
 */
export function bucketRentRatio(rent: number, takeHomeMonthly: number): string {
  if (takeHomeMonthly === 0 || !rent || !takeHomeMonthly) return 'unknown';
  
  const ratio = (rent / takeHomeMonthly) * 100;
  
  if (ratio < 25) return '<25';
  if (ratio < 35) return '25_35';
  if (ratio < 45) return '35_45';
  return '45_plus';
}

/**
 * Bucket days until start date
 * 
 * @param startDate - Start date as Date object or date string
 * @returns Days bucket string
 */
export function bucketDaysUntilStart(startDate: Date | string | null | undefined): string {
  if (!startDate) return 'unknown';
  
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  if (isNaN(start.getTime())) return 'unknown';
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);
  
  const diffTime = start.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'unknown';
  if (diffDays < 14) return '<14';
  if (diffDays < 30) return '14_30';
  if (diffDays < 60) return '30_60';
  return '60_plus';
}

/**
 * Map city to tier (without sending city name)
 * 
 * Tier 1: Major tech/finance hubs (SF Bay Area, NYC, Boston, Seattle)
 * Tier 2: Growing tech cities (Austin, Chicago)
 * Other: Any other city
 * 
 * @param city - City name (will not be sent to analytics)
 * @returns City tier string
 */
export function mapCityToTier(city: string | null | undefined): string {
  if (!city) return 'unknown';
  
  const cityLower = city.toLowerCase();
  
  // Tier 1 cities
  const tier1Cities = [
    'sf bay area',
    'san francisco bay area',
    'nyc',
    'new york',
    'new york city',
    'boston',
    'seattle',
  ];
  
  if (tier1Cities.some(t1 => cityLower.includes(t1))) {
    return 'tier_1';
  }
  
  // Tier 2 cities
  const tier2Cities = [
    'austin',
    'chicago',
  ];
  
  if (tier2Cities.some(t2 => cityLower.includes(t2))) {
    return 'tier_2';
  }
  
  return 'other';
}
