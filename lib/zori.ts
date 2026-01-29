/**
 * ZORI Metro Data Utilities
 * 
 * Handles loading and lookup of ZORI (Zillow Observed Rent Index) metro-level rent data.
 * Used to compute "Market reality rent range" for the rent tool.
 */

import fs from 'fs';
import path from 'path';

export interface ZoriMetroData {
  regionName: string;
  stateName: string;
  medianRent: number;
}

export interface ZoriDataStore {
  byRegionState: Map<string, ZoriMetroData>;
  metrosByState: Map<string, Array<{ regionName: string; medianRent: number }>>;
}

export interface MetroOption {
  label: string;
  value: string;
}

export interface MarketRentRange {
  medianRent: number;
  buffered: number;
  marketLow: number;
  marketHigh: number;
  tier: 'T1' | 'T2' | 'T3' | 'T4';
  bufferPct: number;
  widthPct: number;
}

let zoriDataCache: ZoriDataStore | null = null;

/**
 * Normalize a string key for matching
 * - lowercase
 * - trim
 * - collapse multiple spaces to one
 * - remove punctuation except spaces
 */
export function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

/**
 * Load ZORI data from CSV file
 * Parses CSV and builds lookup maps
 */
export async function loadZoriData(): Promise<ZoriDataStore> {
  // Return cached data if available
  if (zoriDataCache) {
    return zoriDataCache;
  }

  const csvPath = path.join(process.cwd(), 'data', 'zori_metro.csv');
  
  // Check if file exists
  if (!fs.existsSync(csvPath)) {
    console.warn(`ZORI CSV file not found at ${csvPath}. Using empty data store.`);
    zoriDataCache = {
      byRegionState: new Map(),
      metrosByState: new Map(),
    };
    return zoriDataCache;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header row
  const dataLines = lines.slice(1);
  
  const byRegionState = new Map<string, ZoriMetroData>();
  const metrosByState = new Map<string, Array<{ regionName: string; medianRent: number }>>();

  for (const line of dataLines) {
    // Parse CSV line (handle quoted values)
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim()); // Add last part
    
    if (parts.length < 3) continue;
    
    const regionName = parts[0].replace(/^"|"$/g, '').trim();
    const stateName = parts[1].replace(/^"|"$/g, '').trim();
    const medianRentStr = parts[2].replace(/^"|"$/g, '').trim();
    
    // Clean median rent string: remove $ and commas, then parse
    const cleanedRentStr = medianRentStr.replace(/[$,]/g, '');
    const medianRent = parseFloat(cleanedRentStr);
    if (isNaN(medianRent) || medianRent <= 0) {
      console.warn(`Skipping invalid median rent for ${regionName}, ${stateName}: ${medianRentStr}`);
      continue;
    }
    
    // Store in byRegionState map
    const key = `${normalizeKey(regionName)}|${stateName}`;
    byRegionState.set(key, {
      regionName,
      stateName,
      medianRent,
    });
    
    // Store in metrosByState map
    if (!metrosByState.has(stateName)) {
      metrosByState.set(stateName, []);
    }
    metrosByState.get(stateName)!.push({
      regionName,
      medianRent,
    });
  }
  
  // Sort metrosByState lists by medianRent descending
  for (const [stateName, metros] of metrosByState.entries()) {
    metros.sort((a, b) => b.medianRent - a.medianRent);
  }
  
  zoriDataCache = {
    byRegionState,
    metrosByState,
  };
  
  return zoriDataCache;
}

/**
 * Get metro options for a given state
 * Returns dropdown options including "Outside major metros / Not sure"
 */
export async function getMetroOptionsForState(stateName: string): Promise<MetroOption[]> {
  const data = await loadZoriData();
  const metros = data.metrosByState.get(stateName) || [];
  
  const options: MetroOption[] = metros.map(metro => ({
    label: metro.regionName,
    value: metro.regionName,
  }));
  
  // Add "Outside major metros / Not sure" option
  options.push({
    label: 'Outside major metros / Not sure',
    value: '__OTHER__',
  });
  
  return options;
}

/**
 * Get median rent for a region
 * Attempts exact match first, then soft match (contains)
 */
export async function getMedianRentForRegion(
  regionName: string,
  stateName: string
): Promise<{ medianRent: number | null; matchedRegion?: string }> {
  const data = await loadZoriData();
  
  // Try exact match first
  const exactKey = `${normalizeKey(regionName)}|${stateName}`;
  const exactMatch = data.byRegionState.get(exactKey);
  if (exactMatch) {
    return {
      medianRent: exactMatch.medianRent,
      matchedRegion: exactMatch.regionName,
    };
  }
  
  // Try soft match (contains)
  const normalizedRegion = normalizeKey(regionName);
  const matches: ZoriMetroData[] = [];
  
  for (const [key, metro] of data.byRegionState.entries()) {
    if (metro.stateName === stateName) {
      const normalizedMetroRegion = normalizeKey(metro.regionName);
      if (normalizedMetroRegion.includes(normalizedRegion) || 
          normalizedRegion.includes(normalizedMetroRegion)) {
        matches.push(metro);
      }
    }
  }
  
  if (matches.length > 0) {
    // Choose highest medianRent if multiple matches
    const bestMatch = matches.reduce((best, current) => 
      current.medianRent > best.medianRent ? current : best
    );
    return {
      medianRent: bestMatch.medianRent,
      matchedRegion: bestMatch.regionName,
    };
  }
  
  return { medianRent: null };
}

// Note: calculateMarketRentRange and compareMarketToSafe have been moved to lib/zoriClient.ts
// to avoid bundling server-side code in client components.
// Import them from zoriClient.ts for client-side use.
