import { NextRequest, NextResponse } from 'next/server';

interface TaxCalculationResponse {
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  ficaTaxAnnual: number;
  totalTaxAnnual: number;
  netIncomeAnnual: number;
  taxSource: 'api_ninjas' | 'fallback';
}

/**
 * Calculate conservative fallback tax estimate
 * Uses effective tax rates as a conservative estimate
 */
function calculateFallbackTax(annualIncome: number, stateCode: string): TaxCalculationResponse {
  // Federal tax brackets (simplified effective rate approach)
  let federalEffectiveRate = 0.10; // Conservative default
  
  if (annualIncome > 578125) {
    federalEffectiveRate = 0.37;
  } else if (annualIncome > 231250) {
    federalEffectiveRate = 0.35;
  } else if (annualIncome > 182050) {
    federalEffectiveRate = 0.32;
  } else if (annualIncome > 95350) {
    federalEffectiveRate = 0.24;
  } else if (annualIncome > 44725) {
    federalEffectiveRate = 0.22;
  } else if (annualIncome > 11000) {
    federalEffectiveRate = 0.12;
  }
  
  // State tax (simplified by state)
  const stateRates: Record<string, number> = {
    CA: 0.09, // CA has progressive rates, using conservative estimate
    NY: 0.06,
    TX: 0.00, // TX has no state income tax
    WA: 0.00, // WA has no state income tax
    MA: 0.05,
    IL: 0.0495,
  };
  
  const stateEffectiveRate = stateRates[stateCode] || 0.04;
  
  // FICA (Social Security + Medicare)
  const socialSecurityRate = 0.062; // 6.2% up to wage base (we'll simplify)
  const medicareRate = 0.0145; // 1.45%
  const ficaRate = socialSecurityRate + medicareRate;
  
  // Calculate taxes
  const federalTaxAnnual = annualIncome * federalEffectiveRate;
  const stateTaxAnnual = annualIncome * stateEffectiveRate;
  const ficaTaxAnnual = annualIncome * ficaRate;
  const totalTaxAnnual = federalTaxAnnual + stateTaxAnnual + ficaTaxAnnual;
  const netIncomeAnnual = annualIncome - totalTaxAnnual;
  
  return {
    federalTaxAnnual: Math.round(federalTaxAnnual),
    stateTaxAnnual: Math.round(stateTaxAnnual),
    ficaTaxAnnual: Math.round(ficaTaxAnnual),
    totalTaxAnnual: Math.round(totalTaxAnnual),
    netIncomeAnnual: Math.round(netIncomeAnnual),
    taxSource: 'fallback',
  };
}

/**
 * Reverse: given desired take-home, solve for required gross salary.
 * Uses binary search with fallback tax (API Ninjas doesn't support reverse).
 */
function solveGrossFromTakeHome(takeHomeAnnual: number, stateCode: string): TaxCalculationResponse {
  let low = takeHomeAnnual;
  let high = takeHomeAnnual * 2; // gross is at least take-home, typically 1.3–1.5x
  const tolerance = 1;

  for (let i = 0; i < 50; i++) {
    const guess = Math.round((low + high) / 2);
    const result = calculateFallbackTax(guess, stateCode);
    const diff = result.netIncomeAnnual - takeHomeAnnual;

    if (Math.abs(diff) <= tolerance) {
      return result;
    }
    if (diff < 0) {
      low = guess; // need higher gross
    } else {
      high = guess; // need lower gross
    }
  }

  const finalGuess = Math.round((low + high) / 2);
  return calculateFallbackTax(finalGuess, stateCode);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { salaryAnnual, takeHomeAnnual, state } = body;

    // Validate required fields
    if (!state) {
      return NextResponse.json(
        { error: 'Missing required field: state is required' },
        { status: 400 }
      );
    }

    // Reverse mode: take-home → gross
    if (takeHomeAnnual != null && takeHomeAnnual > 0 && (salaryAnnual == null || salaryAnnual === 0)) {
      const result = solveGrossFromTakeHome(takeHomeAnnual, state);
      const solvedGross = result.netIncomeAnnual + result.totalTaxAnnual;
      return NextResponse.json({
        ...result,
        salaryAnnual: Math.round(solvedGross), // required gross to achieve target take-home
      });
    }

    // Forward mode: gross → take-home
    if (!salaryAnnual || salaryAnnual <= 0) {
      return NextResponse.json(
        { error: 'Missing required field: salaryAnnual (or takeHomeAnnual for reverse) is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.API_NINJAS_KEY;

    // Try API Ninjas first if API key is available
    if (apiKey) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      try {
        const apiUrl = new URL('https://api.api-ninjas.com/v1/incometaxcalculator');
        apiUrl.searchParams.set('country', 'US');
        apiUrl.searchParams.set('region', state);
        apiUrl.searchParams.set('income', salaryAnnual.toString());
        apiUrl.searchParams.set('filing_status', 'single'); // Required for US; default to single

        const response = await fetch(apiUrl.toString(), {
          method: 'GET',
          headers: {
            'X-Api-Key': apiKey,
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          
          const stateTaxAnnual = data.region_taxes_owed || 0;
          const ficaTaxAnnual = data.fica_total || 
            ((data.fica_social_security || 0) + (data.fica_medicare || 0));
          const totalTaxAnnual = data.total_taxes_owed || 0;
          const netIncomeAnnual = data.income_after_tax || (salaryAnnual - totalTaxAnnual);
          
          // Federal tax = total - state - FICA
          const federalTaxAnnual = totalTaxAnnual - stateTaxAnnual - ficaTaxAnnual;

          return NextResponse.json({
            federalTaxAnnual: Math.round(federalTaxAnnual),
            stateTaxAnnual: Math.round(stateTaxAnnual),
            ficaTaxAnnual: Math.round(ficaTaxAnnual),
            totalTaxAnnual: Math.round(totalTaxAnnual),
            netIncomeAnnual: Math.round(netIncomeAnnual),
            taxSource: 'api_ninjas' as const,
          });
        } else {
          clearTimeout(timeoutId);
          const errorText = await response.text();
          console.warn('[Tax API] API Ninjas request failed:', response.status, errorText);
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn('[Tax API] API Ninjas request timed out, falling back to estimate');
        } else {
          console.error('[Tax API] Error calling API Ninjas:', error);
        }
        // Fall through to fallback calculation
      }
    } else {
      console.warn('[Tax API] API_NINJAS_KEY not configured, using fallback');
    }

    // Fallback calculation
    const fallbackResult = calculateFallbackTax(salaryAnnual, state);
    return NextResponse.json(fallbackResult);

  } catch (error) {
    console.error('[Tax API] Error processing tax calculation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
