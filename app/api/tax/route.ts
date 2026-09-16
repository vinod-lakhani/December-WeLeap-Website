import { NextRequest, NextResponse } from 'next/server';

import {
  federalTax,
  ficaTax,
  stateRate,
  taxableIncome,
} from '@/lib/firstPaycheck/calculation';
import {
  STANDARD_DEDUCTION_2026_SINGLE as STANDARD_DEDUCTION,
  TAX_YEAR_FIRST_PAYCHECK as TAX_YEAR,
} from '@/lib/firstPaycheck/constants';

interface TaxCalculationResponse {
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  ficaTaxAnnual: number;
  totalTaxAnnual: number;
  netIncomeAnnual: number;
  taxSource: 'api_ninjas' | 'fallback';
}

/**
 * Fallback when API Ninjas is unavailable.
 *
 * This used to keep its own tax code, and got it wrong three ways at once: it
 * applied a MARGINAL rate to GROSS income as though it were an effective rate,
 * from a 2023 bracket table, with no standard deduction. On $60,000 that
 * produced $13,200 of federal tax against a true figure of $5,020.
 *
 * It now runs the same functions every calculator on the site uses, so the
 * fallback and the API agree to within rounding and no tool can quote a
 * take-home that depends on whether a third party happened to answer.
 */
function calculateFallbackTax(
  annualIncome: number,
  stateCode: string,
  pretaxAnnual = 0,
): TaxCalculationResponse {
  const federalTaxAnnual = federalTax(taxableIncome(annualIncome, pretaxAnnual));
  const stateTaxAnnual =
    Math.max(0, annualIncome - pretaxAnnual - STANDARD_DEDUCTION) * stateRate(stateCode);
  const ficaTaxAnnual = ficaTax(annualIncome);
  const totalTaxAnnual = federalTaxAnnual + stateTaxAnnual + ficaTaxAnnual;

  return {
    federalTaxAnnual: Math.round(federalTaxAnnual),
    stateTaxAnnual: Math.round(stateTaxAnnual),
    ficaTaxAnnual: Math.round(ficaTaxAnnual),
    totalTaxAnnual: Math.round(totalTaxAnnual),
    netIncomeAnnual: Math.round(annualIncome - totalTaxAnnual),
    taxSource: 'fallback' as const,
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
    /**
     * Pre-tax money coming out before tax: a 401(k) deferral, a payroll HSA.
     * Optional, and added to the standard deduction rather than subtracted
     * from the salary — taking it off the salary would understate FICA, which
     * a 401(k) deferral still pays.
     */
    const pretaxAnnual = Math.max(0, Number(body.pretaxAnnual) || 0);

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
        /**
         * The standard deduction, which the API does not apply on its own.
         *
         * Without it the request asks for tax on GROSS income, and the
         * response says so plainly — it returns `deductions: 0` and
         * `taxable_income` equal to the salary we sent. Nobody read that, so
         * two shipped tools were quoting a take-home $328 a month too low on a
         * $60,000 salary. It compounds: state tax is charged on the same
         * taxable income, so California went out at $2,260 instead of $1,211.
         *
         * tax_year is pinned to the same year the deduction comes from. Left
         * to default, the API would advance to the next year's brackets while
         * we kept sending this year's deduction.
         */
        apiUrl.searchParams.set('deductions', String(STANDARD_DEDUCTION + pretaxAnnual));
        apiUrl.searchParams.set('tax_year', String(TAX_YEAR));

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
    const fallbackResult = calculateFallbackTax(salaryAnnual, state, pretaxAnnual);
    return NextResponse.json(fallbackResult);

  } catch (error) {
    console.error('[Tax API] Error processing tax calculation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
