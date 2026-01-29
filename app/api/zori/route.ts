import { NextResponse } from 'next/server';
import { loadZoriData, getMetroOptionsForState, getMedianRentForRegion } from '@/lib/zori';

/**
 * GET /api/zori/metros?state=TX
 * Returns metro options for a given state
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const stateName = searchParams.get('state');
  const regionName = searchParams.get('region');
  
  try {
    if (stateName && !regionName) {
      // Get metro options for state
      const options = await getMetroOptionsForState(stateName);
      console.log(`[ZORI API] Metro options for ${stateName}:`, options.length, 'options');
      return NextResponse.json({ options });
    }
    
    if (stateName && regionName) {
      // Get median rent for region
      const decodedRegion = decodeURIComponent(regionName);
      console.log(`[ZORI API] Looking up median rent for ${decodedRegion}, ${stateName}`);
      const result = await getMedianRentForRegion(decodedRegion, stateName);
      console.log(`[ZORI API] Result:`, result);
      return NextResponse.json(result);
    }
    
    // Return all data (for debugging/admin)
    const data = await loadZoriData();
    return NextResponse.json({
      metrosByState: Object.fromEntries(
        Array.from(data.metrosByState.entries()).map(([state, metros]) => [
          state,
          metros,
        ])
      ),
    });
  } catch (error) {
    console.error('Error loading ZORI data:', error);
    return NextResponse.json(
      { error: 'Failed to load ZORI data' },
      { status: 500 }
    );
  }
}
