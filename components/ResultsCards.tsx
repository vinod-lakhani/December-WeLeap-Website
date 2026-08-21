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
import { getHUDRentRange, compareRentRanges } from '@/lib/hudRents';
import { track } from '@/lib/analytics';
import { calculateMarketRentRange, compareMarketToSafe } from '@/lib/zoriClient';
import { RentShareCard } from '@/components/RentShareCard';
import { buildRentClaim, encodeRentClaim, rentClaimHeadline } from '@/lib/share/rentClaim';

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

  /**
   * What a share actually asserts.
   *
   * A market gap where the data supports one, the take-home method line where
   * it does not. Never the rent range itself: the range divides back to a
   * salary in one step, so a card showing it is not the "without showing your
   * salary" the button promises. A gap is a statement about a city.
   *
   * The URL is relative so it works on any deploy — preview, local, or
   * production — rather than hard-coding the canonical host and quietly
   * pointing every preview share at live.
   */
  const shareClaim = buildRentClaim({
    comparison: marketRentComparison,
    medianRent: marketRentData?.medianRent ?? 0,
    rentRangeLow,
    rentRangeHigh,
    regionName: regionName ?? null,
  });
  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/s/rent/${encodeRentClaim(shareClaim)}`
      : `/s/rent/${encodeRentClaim(shareClaim)}`;
  const shareText = rentClaimHeadline(
    shareClaim,
    shareClaim.kind === 'market_gap' ? (regionName ?? null) : null
  );

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

              {/* Share belongs with the number it's about, and it leads with
                  the reason someone would.

                  This used to read "Save This Range" — a save verb in 14px
                  grey, with "Planning with someone? Share this range." as a
                  smaller line underneath it — sitting several blocks below,
                  after the accordions. One share was recorded in 180 days,
                  which says less about whether people share than about never
                  having been asked properly.

                  Salary is the taboo that stops personal-finance content being
                  shared at all: the numbers that would make a post worth
                  reading are the ones nobody will publish. Naming that up front
                  is the whole offer, and it is the framing the offer analyser
                  already uses on 2% of the traffic while this tool, with 74%
                  of it, buried the same mechanic. */}
              <div className="mt-5 border-t border-hairline pt-4">
                <RentShareCard
                  shareUrl={shareUrl}
                  shareText={shareText}
                  trigger={
                    <button
                      type="button"
                      onClick={() => track('rent_share_card_opened', { page: '/how-much-rent-can-i-afford' })}
                      className="text-sm font-bold text-brand-700 underline underline-offset-4 hover:text-brand-800"
                    >
                      Share this without showing your salary →
                    </button>
                  }
                />
              </div>
            </div>

            {/* The reality check. This is the takeaway that turns an abstract
                range into a decision, and it was previously 12px grey text at
                the bottom of the card where it got lost. */}
            {zoriAvailable && marketRentData && (
              <div className="rounded-2xl border border-hairline bg-canvas p-5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">
                  What rentals actually cost here
                </p>
                <p className="mt-1 text-[28px] font-extrabold leading-none text-ink tabular-nums">
                  {formatCurrency(marketRentData.marketLow)}–{formatCurrency(marketRentData.marketHigh)}
                </p>
                <p className="mt-2.5 inline-flex items-center rounded-full border px-3 py-1 text-[12.5px] font-bold"
                  style={{
                    borderColor: marketRentComparison === 'above' ? '#ff9f4055' : marketRentComparison === 'below' ? '#4bc0c055' : '#36a2eb55',
                    background: marketRentComparison === 'above' ? '#fff1e2' : marketRentComparison === 'below' ? '#e3f6f4' : '#e7f2fd',
                    color: marketRentComparison === 'above' ? '#b45309' : marketRentComparison === 'below' ? '#0f766e' : '#0369a1',
                  }}
                >
                  {marketRentComparison === 'above'
                    ? 'Runs higher than your range'
                    : marketRentComparison === 'below'
                    ? 'Below your range — room to save'
                    : 'Overlaps your range'}
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-subtle">
                  {marketRentComparison === 'above'
                    ? 'Most people starting out get roommates or trade space for flexibility.'
                    : marketRentComparison === 'below'
                    ? 'You have more room than the average renter here — worth banking the difference.'
                    : 'Plenty of options fit, but the top of the market will feel tight.'}
                </p>
              </div>
            )}

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

            {/* Upfront cash, with the start-date timing folded in behind a
                disclosure. The number is the punch; the timing is the "why",
                and it used to live in a separate card that repeated this same
                figure further down the page. */}
            {upfrontCash && (
              <div className="rounded-2xl border border-hairline bg-canvas p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-subtle">
                  Cash you need upfront
                </p>
                <p className="mt-1 text-[28px] font-extrabold leading-none text-ink tabular-nums">
                  {formatCurrencyRange(upfrontCash.totalLow, upfrontCash.totalHigh)}
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-subtle">
                  {getTimingMessage()}
                </p>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="upfront" className="border-none">
                    <AccordionTrigger className="py-2 text-[13px] font-semibold text-brand-700 hover:no-underline">
                      What makes up this number
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 pt-1">
                      <div className="space-y-2 text-[13px] text-subtle">
                        <div className="flex items-center justify-between">
                          <span>Security deposit</span>
                          <span className="font-semibold text-ink tabular-nums">
                            {formatCurrencyRange(upfrontCash.depositLow, upfrontCash.depositHigh)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>First month&apos;s rent</span>
                          <span className="font-semibold text-ink tabular-nums">
                            {formatCurrencyRange(upfrontCash.firstMonthLow, upfrontCash.firstMonthHigh)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Gap living costs (food/transport/etc.)</span>
                          <span className="font-semibold text-ink tabular-nums">
                            {formatCurrency(upfrontCash.gapLivingCosts)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Moving/setup costs</span>
                          <span className="font-semibold text-ink tabular-nums">
                            {formatCurrency(upfrontCash.movingSetup)}
                          </span>
                        </div>
                      </div>
                      {formattedStartDate && (
                        <p className="border-t border-hairline pt-2 text-xs text-faint">
                          Based on a {formattedStartDate} start date and typical move-in timing. This is where
                          many new grads get squeezed.
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
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

    </div>
  );
}
