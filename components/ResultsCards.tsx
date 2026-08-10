'use client';

/**
 * ResultsCards Component
 * Displays rent tool results: take-home, safe rent range, timing pressure, upfront cash.
 */

import { useState, useEffect, type ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatCurrency, formatCurrencyRange, roundToNearest100 } from '@/lib/rounding';
import { rentNetWorthProtection30yr } from '@/lib/rent';
import { getHUDRentRange, compareRentRanges } from '@/lib/hudRents';
import { track } from '@/lib/analytics';
import { calculateMarketRentRange, compareMarketToSafe } from '@/lib/zoriClient';
import { RentShareCard } from '@/components/RentShareCard';

interface TaxBreakdown {
  grossAnnual: number;
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  ficaTaxAnnual: number;
  totalTaxAnnual: number;
  netIncomeAnnual: number;
}

interface PlanData {
  salary: string;
  city: string;
  startDate: string;
  debtMonthly?: string;
  takeHomeMonthly: number;
  takeHomeAnnual: number;
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  daysUntilStart: number;
  upfrontCashLow?: number;
  upfrontCashHigh?: number;
  budgetBreakdown?: {
    needs: number;
    wants: number;
    savings: number;
  };
  taxBreakdown?: {
    grossAnnual: number;
    federalTaxAnnual: number;
    stateTaxAnnual: number;
    ficaTaxAnnual: number;
    totalTaxAnnual: number;
    netIncomeAnnual: number;
  };
  // Location context for ZORI
  locationMode?: 'preset' | 'other';
  presetCity?: string;
  stateName?: string;
  regionName?: string;
  zoriAvailable?: boolean;
}

interface ResultsCardsProps {
  takeHomeMonthly: number;
  takeHomeAnnual: number;
  rentRange: string;
  rentRangeLow: number;
  rentRangeHigh: number;
  daysUntilStart: number;
  startDate?: string;
  city?: string;
  locationMode?: 'preset' | 'other' | null;
  presetCity?: string | null;
  stateName?: string | null;
  regionName?: string | null;
  zoriAvailable?: boolean;
  taxBreakdown?: TaxBreakdown;
  planData?: PlanData;
  /** Rendered immediately after the hero answer — the conversion moment
   *  belongs next to the number, not after four more cards. */
  afterHero?: ReactNode;
}

export function ResultsCards({
  afterHero,
  takeHomeMonthly,
  takeHomeAnnual,
  rentRange,
  rentRangeLow,
  rentRangeHigh,
  daysUntilStart,
  startDate,
  city,
  locationMode,
  presetCity,
  stateName,
  regionName,
  zoriAvailable,
  taxBreakdown,
  planData,
}: ResultsCardsProps) {
  // ZORI market rent data
  const [marketRentData, setMarketRentData] = useState<{
    medianRent: number;
    marketLow: number;
    marketHigh: number;
    tier: string;
  } | null>(null);
  const [loadingMarketRent, setLoadingMarketRent] = useState(false);
  const [marketRentComparison, setMarketRentComparison] = useState<'above' | 'overlap' | 'below' | null>(null);

  // Load ZORI market rent data when location is available
  useEffect(() => {
    if (zoriAvailable && stateName && regionName && !loadingMarketRent && !marketRentData) {
      setLoadingMarketRent(true);
      const url = `/api/zori?state=${stateName}&region=${encodeURIComponent(regionName)}`;
      console.log('[ResultsCards] Loading market rent from:', url);
      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[ResultsCards] Market rent data received:', data);
          if (data.medianRent) {
            const marketRange = calculateMarketRentRange(data.medianRent);
            const comparison = compareMarketToSafe(
              marketRange.marketLow,
              marketRange.marketHigh,
              rentRangeLow,
              rentRangeHigh
            );
            
            setMarketRentData({
              medianRent: marketRange.medianRent,
              marketLow: marketRange.marketLow,
              marketHigh: marketRange.marketHigh,
              tier: marketRange.tier,
            });
            setMarketRentComparison(comparison);
            
            // Track market rent loaded
            track('market_rent_loaded_v1', {
              page: '/how-much-rent-can-i-afford',
              locationMode: locationMode || 'unknown',
              presetCity: presetCity || null,
              stateName,
              regionName,
              tier: marketRange.tier,
              medianRent: marketRange.medianRent,
              marketLow: marketRange.marketLow,
              marketHigh: marketRange.marketHigh,
            });
          } else {
            track('market_rent_unavailable_v1', {
              page: '/how-much-rent-can-i-afford',
              locationMode: locationMode || 'unknown',
              presetCity: presetCity || null,
              stateName,
              regionName,
            });
          }
        })
        .catch(err => {
          console.error('Error loading market rent:', err);
          track('market_rent_unavailable_v1', {
            page: '/how-much-rent-can-i-afford',
            locationMode: locationMode || 'unknown',
            presetCity: presetCity || null,
            stateName,
            regionName,
          });
        })
        .finally(() => {
          setLoadingMarketRent(false);
        });
    } else if (!zoriAvailable && marketRentData) {
      // Reset if ZORI becomes unavailable
      setMarketRentData(null);
      setMarketRentComparison(null);
    }
  }, [zoriAvailable, stateName, regionName, locationMode, presetCity, rentRangeLow, rentRangeHigh, loadingMarketRent, marketRentData]);

  // Fallback to HUD rent context if ZORI not available (for backward compatibility)
  const hudRentRange = (!zoriAvailable && city) ? getHUDRentRange(city) : undefined;
  const rentComparison = hudRentRange 
    ? compareRentRanges(rentRangeLow, rentRangeHigh, hudRentRange.low, hudRentRange.high)
    : null;

  // Format start date for display
  const formattedStartDate = startDate 
    ? new Date(startDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    : null;

  // Determine timing pressure message based on daysUntilStart
  const getTimingMessage = (): string => {
    if (daysUntilStart === 0) {
      return 'Even when you start soon, first paychecks often arrive 2–3 weeks after your start date. Early fixed costs can still feel tighter.';
    } else if (daysUntilStart > 0 && daysUntilStart <= 30) {
      return `Your job starts in ${daysUntilStart} ${daysUntilStart === 1 ? 'day' : 'days'}. First paychecks often arrive 2–3 weeks after your start date, which can make early rent decisions more sensitive.`;
    } else {
      return `Your job starts in ${daysUntilStart} days. Security deposits, first month's rent, and a short gap before your first paycheck all require cash upfront. Choosing lower rent reduces that early cash burden.`;
    }
  };

  // Calculate upfront cash needed before first paycheck
  const calculateUpfrontCash = () => {
    if (!startDate || takeHomeMonthly === 0) {
      return null;
    }

    // Gap days = fixed 14 days (from start date to first paycheck)
    const gapDays = 14;

    // Security deposit = 1× rent
    const depositLow = rentRangeLow;
    const depositHigh = rentRangeHigh;

    // First month rent = 1× rent
    const firstMonthLow = rentRangeLow;
    const firstMonthHigh = rentRangeHigh;

    // Gap living costs = 35% of take-home, prorated by gapDays/30
    const gapLivingCosts = (takeHomeMonthly * 0.35) * (gapDays / 30);

    // Moving/setup = $600 flat
    const movingSetup = 600;

    // Calculate totals (low and high)
    const totalLow = depositLow + firstMonthLow + gapLivingCosts + movingSetup;
    const totalHigh = depositHigh + firstMonthHigh + gapLivingCosts + movingSetup;

    // Round to nearest $100 for cleaner display
    const totalLowRounded = roundToNearest100(totalLow);
    const totalHighRounded = roundToNearest100(totalHigh);

    return {
      gapDays,
      depositLow,
      depositHigh,
      firstMonthLow,
      firstMonthHigh,
      gapLivingCosts: roundToNearest100(gapLivingCosts),
      movingSetup,
      totalLow: totalLowRounded,
      totalHigh: totalHighRounded,
    };
  };

  const upfrontCash = calculateUpfrontCash();
  const netWorthProtection = rentNetWorthProtection30yr(takeHomeMonthly);

  return (
    <div className="space-y-6">
      {/* THE ANSWER. Previously the rent range was the second of seven
          equal-weight cards, behind take-home — but the range is the question
          people came to ask. Take-home is now a supporting line, and the tax
          breakdown moved here as progressive disclosure. */}
      <Card className="rounded-card border-hairline bg-white shadow-card">
        <CardContent className="px-6 py-8 md:px-9 md:py-10">
          <div className="space-y-5">
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
                Rent you can afford
              </p>
              <p className="mt-2 text-[clamp(2.6rem,7vw,4rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {rentRange}
              </p>
              <p className="mt-3 text-[15px] text-subtle">
                On {formatCurrency(takeHomeMonthly)}/mo take-home
                <span className="text-faint"> · {formatCurrency(takeHomeAnnual)} a year after tax</span>
              </p>
              {netWorthProtection > 0 && (
                <p className="mt-2 text-sm font-semibold text-brand-700">
                  Going above this range could cost ~{formatCurrency(netWorthProtection)} over time.
                </p>
              )}
            </div>

          {/* Tax Breakdown Accordion */}
          {taxBreakdown && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="breakdown" className="border-t border-[#D1D5DB] pt-4">
                <AccordionTrigger className="text-sm text-[#111827]/80 hover:no-underline py-2">
                  View breakdown (gross → take-home)
                </AccordionTrigger>
                <AccordionContent className="pt-2 space-y-3">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-[#111827]/70">Gross annual income</span>
                      <span className="font-semibold text-[#111827]">
                        {formatCurrency(taxBreakdown.grossAnnual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-[#D1D5DB]/50">
                      <span className="text-[#111827]/70">Federal tax</span>
                      <span className="text-[#111827]">
                        -{formatCurrency(taxBreakdown.federalTaxAnnual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[#111827]/70">State tax</span>
                      <span className="text-[#111827]">
                        -{formatCurrency(taxBreakdown.stateTaxAnnual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-[#111827]/70">FICA (Social Security + Medicare)</span>
                      <span className="text-[#111827]">
                        -{formatCurrency(taxBreakdown.ficaTaxAnnual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t border-[#D1D5DB]">
                      <span className="font-semibold text-[#111827]/70">Total taxes</span>
                      <span className="font-semibold text-[#111827]">
                        -{formatCurrency(taxBreakdown.totalTaxAnnual)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center pt-2 border-t-2 border-[#D1D5DB]">
                      <span className="font-semibold text-[#111827]">Take-home (annual)</span>
                      <span className="text-xl font-bold text-[#111827]">
                        {formatCurrency(taxBreakdown.netIncomeAnnual)}
                      </span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

            {/* Upfront cash — prominent */}
            {upfrontCash && (
              <div className="rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] p-4">
                <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">
                  📦 Cash you need upfront
                </p>
                <p className="text-2xl font-bold text-[#111827]">
                  {formatCurrencyRange(upfrontCash.totalLow, upfrontCash.totalHigh)}
                </p>
                <p className="text-xs text-[#6B7280] mt-1">
                  Most people underestimate this number.
                </p>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Before your first paycheck — deposit, first month, moving costs.
                </p>
              </div>
            )}

            {/* Share button — ghost style */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2">
              <RentShareCard
                rentRange={rentRange}
                rentRangeLow={rentRangeLow}
                rentRangeHigh={rentRangeHigh}
                upfrontCashLow={upfrontCash?.totalLow}
                upfrontCashHigh={upfrontCash?.totalHigh}
                netWorthProtection={netWorthProtection}
                trigger={
                  <button
                    type="button"
                    className="text-sm text-[#6B7280] hover:text-[#111827] underline underline-offset-2"
                  >
                    Save This Range
                  </button>
                }
              />
            </div>
            <p className="text-xs text-[#9CA3AF]">
              Planning with someone? Share this range.
            </p>

            {/* Market Reality - ZORI */}
            {zoriAvailable && marketRentData && (
              <div className="border-t border-[#D1D5DB] pt-4 mt-4">
                <p className="text-xs text-[#111827]/70 mb-2">
                  What's out there: Typical rents in your area are around {formatCurrency(marketRentData.marketLow)}–{formatCurrency(marketRentData.marketHigh)}/month.
                </p>
                {marketRentComparison === 'above' && (
                  <p className="text-xs text-[#111827]/80">
                    Reality check: Typical rents run higher than what you can afford. Many people just starting out get roommates or trade space for flexibility.
                  </p>
                )}
                {marketRentComparison === 'below' && (
                  <p className="text-xs text-[#111827]/80">
                    Reality check: Typical rents are below your range — you may have more room to save.
                  </p>
                )}
                {marketRentComparison === 'overlap' && (
                  <p className="text-xs text-[#111827]/80">
                    Reality check: Typical rents overlap with your range — being intentional about tradeoffs matters.
                  </p>
                )}
              </div>
            )}
            
            {/* Market Reality - Unavailable */}
            {!zoriAvailable && !hudRentRange && (
              <div className="border-t border-[#D1D5DB] pt-4 mt-4">
                <p className="text-xs text-[#111827]/70">
                  Market reality: Not available for this area yet.
                </p>
              </div>
            )}
            
            {/* Market Reality - Fallback to HUD (backward compatibility) */}
            {!zoriAvailable && hudRentRange && rentComparison && (
              <div className="border-t border-[#D1D5DB] pt-4 mt-4">
                <p className="text-xs text-[#111827]/70 mb-2">
                  Market reality: Typical 1-bedroom rents are around {formatCurrency(hudRentRange.low)}–{formatCurrency(hudRentRange.high)}/month.
                </p>
                {hudRentRange.low > rentRangeHigh && (
                  <p className="text-xs text-[#111827]/80">
                    What this means: Many people just starting out get roommates or trade space for flexibility.
                  </p>
                )}
                {hudRentRange.high < rentRangeLow && (
                  <p className="text-xs text-[#111827]/80">
                    Good news: Typical rents fall within your safe range.
                  </p>
                )}
                {!(hudRentRange.low > rentRangeHigh) && !(hudRentRange.high < rentRangeLow) && (
                  <p className="text-xs text-[#111827]/80">
                    Heads up: Parts of the market fit your range, but higher-end units may feel tight early on.
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {afterHero}

      {/* Card C: When your first paycheck hits */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#111827]">When your first paycheck hits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-2xl font-semibold text-[#111827]">
                Start-date timing matters
              </p>
              <p className="text-sm text-[#111827]/70">
                {getTimingMessage()}
              </p>
              {formattedStartDate && (
                <p className="text-xs text-[#111827]/60 mt-2">
                  Start date: {formattedStartDate}
                </p>
              )}
              <p className="text-sm font-semibold text-[#111827] mt-2">
                This is where many new grads get squeezed.
              </p>
            </div>

            {/* Upfront Cash Needed */}
            {upfrontCash && (
              <div className="border-t border-[#D1D5DB] pt-4 mt-4">
                <h4 className="text-base font-semibold text-[#111827] mb-2">
                  Cash you need before your first paycheck
                </h4>
                <p className="text-3xl font-bold text-[#111827] mb-1">
                  {formatCurrencyRange(upfrontCash.totalLow, upfrontCash.totalHigh)}
                </p>
                <p className="text-xs text-[#111827]/60 mb-1">
                  Most people underestimate this number.
                </p>
                <p className="text-xs text-[#111827]/60 mb-3">
                  Estimate based on start date and typical move-in timing.
                </p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="assumptions" className="border-none">
                    <AccordionTrigger className="text-xs text-[#111827]/70 hover:no-underline py-2">
                      How we figure it
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 space-y-2">
                      <div className="space-y-2 text-xs text-[#111827]/70">
                        <div className="flex justify-between items-center">
                          <span>Security deposit</span>
                          <span className="font-medium text-[#111827]">
                            {formatCurrencyRange(upfrontCash.depositLow, upfrontCash.depositHigh)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>First month's rent</span>
                          <span className="font-medium text-[#111827]">
                            {formatCurrencyRange(upfrontCash.firstMonthLow, upfrontCash.firstMonthHigh)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Gap living costs (food/transport/etc.)</span>
                          <span className="font-medium text-[#111827]">
                            {formatCurrency(upfrontCash.gapLivingCosts)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Moving/setup costs</span>
                          <span className="font-medium text-[#111827]">
                            {formatCurrency(upfrontCash.movingSetup)}
                          </span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
