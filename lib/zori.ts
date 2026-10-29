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

/**
 * Resolve a slugified metro back to its display name, e.g. "austin-tx" →
 * "Austin, TX".
 *
 * Used by the share route, which carries the metro in its URL path. Resolving
 * against the data rather than un-slugifying the string does two jobs: the
 * display name is exact ("Coeur d'Alene, ID", not "Coeur D Alene Id"), and a
 * metro that does not exist has nothing to match, so a hand-edited URL 404s
 * instead of rendering a claim the tool never made.
 *
 * The store is cached after first load, so this costs one Map walk.
 */
export async function getRegionNameBySlug(slug: string): Promise<string | null> {
  const { slugifyMetro } = await import('@/lib/share/rentClaim');
  const data = await loadZoriData();
  for (const metro of data.byRegionState.values()) {
    if (slugifyMetro(metro.regionName) === slug) return metro.regionName;
  }
  return null;
}

export interface MetroMatch { label: string; value: string; stateCode: string }

/**
 * Metros for a typed city ("Dallas", "charlotte", "Dallas Fort Worth"), narrowed to a state when one was typed.
 * Exact city first; else a typed name that starts with a metro's city ("dallas fort worth"); else a metro city that
 * starts with what was typed (4+ letters). The chat's city question knew only its six presets and state names, so
 * a typed "Dallas" went to Ribbit as a question: 7 of 14 paid rent chats (Oct 28-29) got stuck there.
 */
export async function findMetros(city: string, stateCode?: string, limit = 6): Promise<MetroMatch[]> {
  const data = await loadZoriData();
  const want = normalizeKey(city);
  if (want.length < 3) return [];
  const rows: MetroMatch[] = [];
  const seen = new Set<string>();
  for (const [st, metros] of data.metrosByState.entries()) {
    if (stateCode && st !== stateCode) continue;
    for (const m of metros) {
      if (seen.has(m.regionName)) continue;
      seen.add(m.regionName);
      // "Washington, DC" is listed under DC and VA: its own suffix is the state to price it in.
      const suffix = m.regionName.match(/, ([A-Z]{2})$/)?.[1];
      rows.push({ label: m.regionName, value: m.regionName, stateCode: suffix && data.byRegionState.has(`${normalizeKey(m.regionName)}|${suffix}`) ? suffix : st });
    }
  }
  const cityOf = (r: MetroMatch) => normalizeKey(r.value.split(',')[0]);
  const exact = rows.filter((r) => cityOf(r) === want);
  if (exact.length) return exact.slice(0, limit);
  const longer = rows.filter((r) => want.startsWith(`${cityOf(r)} `));
  if (longer.length) return longer.slice(0, limit);
  return want.length >= 4 ? rows.filter((r) => cityOf(r).startsWith(want)).slice(0, limit) : [];
}
