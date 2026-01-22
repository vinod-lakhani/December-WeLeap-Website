'use client';

/**
 * ResultsCards Component - A/B Test Implementation
 * 
 * Day-0 Cash Reality A/B Test:
 * - Variant A (Control): Shows exact Day-0 cash number immediately (current behavior)
 * - Variant B (Test): Shows preview/bucket, gates exact number behind email capture
 * 
 * GA4 Events Tracked:
 * - day0_cash_module_view: Fires when module becomes visible (IntersectionObserver)
 * - day0_cash_cta_click: Fires on CTA click (different CTAs for A vs B)
 * - day0_cash_email_modal_open: Fires when email modal opens (Variant B)
 * - day0_cash_email_submit: Fires when email is submitted (Variant B)
 * - day0_cash_number_revealed: Fires when exact number is shown
 *   - Variant A: Fires immediately when module is visible
 *   - Variant B: Fires only after successful email submit
 * 
 * See GA4_AB_TEST_EVENTS.md for full event documentation.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatCurrency, formatCurrencyRange, roundToNearest100 } from '@/lib/rounding';
import { getHUDRentRange, compareRentRanges } from '@/lib/hudRents';
import { getDay0CashVariant } from '@/lib/abTest';
import { track } from '@/lib/analytics';
import { Day0CashEmailModal } from '@/components/Day0CashEmailModal';

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
  taxBreakdown?: TaxBreakdown;
  planData?: PlanData;
}

export function ResultsCards({
  takeHomeMonthly,
  takeHomeAnnual,
  rentRange,
  rentRangeLow,
  rentRangeHigh,
  daysUntilStart,
  startDate,
  city,
  taxBreakdown,
  planData,
}: ResultsCardsProps) {
  // Get HUD rent context if city is available
  const hudRentRange = city ? getHUDRentRange(city) : undefined;
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
  
  // A/B Test: Get variant for Day-0 Cash module
  const [variant] = useState(() => getDay0CashVariant());
  const [isDay0EmailModalOpen, setIsDay0EmailModalOpen] = useState(false);
  const [day0NumberRevealed, setDay0NumberRevealed] = useState(variant === 'A'); // Variant A shows immediately
  
  // Track Day-0 Cash module view (once when visible)
  const day0ModuleRef = useRef<HTMLDivElement>(null);
  const day0ModuleViewedRef = useRef(false);
  
  useEffect(() => {
    if (!day0ModuleRef.current || day0ModuleViewedRef.current || !upfrontCash) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !day0ModuleViewedRef.current) {
            day0ModuleViewedRef.current = true;
            track('day0_cash_module_view', {
              ab_day0_cash_variant: variant,
            });
            
            // For Variant A, also fire number_revealed immediately (if number is shown by default)
            if (variant === 'A') {
              track('day0_cash_number_revealed', {
                ab_day0_cash_variant: variant,
              });
            }
            
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(day0ModuleRef.current);

    return () => {
      observer.disconnect();
    };
  }, [variant, upfrontCash]);

  // Handle Day-0 email submission (Variant B only)
  const handleDay0EmailSubmitted = () => {
    setDay0NumberRevealed(true);
    track('day0_cash_number_revealed', {
      ab_day0_cash_variant: variant,
    });
  };

  // Handle Day-0 CTA click
  const handleDay0CTAClick = () => {
    track('day0_cash_cta_click', {
      ab_day0_cash_variant: variant,
      cta_label: variant === 'A' ? 'View assumptions' : 'Get my Day-0 Cash Plan',
    });
    
    if (variant === 'B') {
      setIsDay0EmailModalOpen(true);
    }
    // Variant A: CTA just opens accordion (existing behavior, no change needed)
  };

  // Helper to get preview text for Variant B
  const getDay0PreviewText = () => {
    if (!upfrontCash) return '';
    
    const avg = (upfrontCash.totalLow + upfrontCash.totalHigh) / 2;
    
    if (avg < 3000) {
      return 'Likely $2k–$4k upfront';
    } else if (avg < 6000) {
      return 'Likely $4k–$7k upfront';
    } else if (avg < 10000) {
      return 'Likely $7k–$10k upfront';
    } else {
      return 'Likely several thousand dollars upfront';
    }
  };

  return (
    <div className="space-y-6">
      {/* Card A: Monthly Take-Home */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#111827]">Your Real Monthly Take-Home</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-[#111827]">{formatCurrency(takeHomeMonthly)}</p>
              <p className="text-sm text-[#111827]/70">
                {formatCurrency(takeHomeAnnual)} annually
              </p>
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
          </div>
        </CardContent>
      </Card>

      {/* Card B: Safe Rent Range */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#111827]">Safe Rent Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-[#111827]">{rentRange}</p>
              <p className="text-sm text-[#111827]/70">
                Based on your take-home pay and early-career flexibility.
              </p>
            </div>

            {/* Market Reality */}
            {hudRentRange && rentComparison && (
              <div className="border-t border-[#D1D5DB] pt-4 mt-4">
                <p className="text-xs text-[#111827]/70 mb-2">
                  Market reality: Typical 1-bedroom rents are around {formatCurrency(hudRentRange.low)}–{formatCurrency(hudRentRange.high)}/month.
                </p>
                {hudRentRange.low > rentRangeHigh && (
                  <p className="text-xs text-[#111827]/80">
                    What this means: Many early-career professionals use roommates or trade space for flexibility.
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

      {/* Card C: Timing Pressure */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-[#111827]">Timing Pressure</CardTitle>
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
            </div>

            {/* Upfront Cash Needed - A/B Test */}
            {upfrontCash && (
              <div ref={day0ModuleRef} className="border-t border-[#D1D5DB] pt-4 mt-4">
                <h4 className="text-base font-semibold text-[#111827] mb-2">
                  Upfront cash needed before your first paycheck
                </h4>
                
                {/* Variant A: Show exact number immediately (current behavior) */}
                {variant === 'A' && (
                  <>
                    <p className="text-3xl font-bold text-[#111827] mb-1">
                      {formatCurrencyRange(upfrontCash.totalLow, upfrontCash.totalHigh)}
                    </p>
                    <p className="text-xs text-[#111827]/60 mb-3">
                      Estimate based on start date and typical move-in timing.
                    </p>
                    
                    {/* Assumptions Disclosure */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="assumptions" className="border-none">
                        <AccordionTrigger 
                          className="text-xs text-[#111827]/70 hover:no-underline py-2"
                          onClick={handleDay0CTAClick}
                        >
                          View assumptions
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
                  </>
                )}

                {/* Variant B: Show preview + explanation, gate exact number behind email */}
                {variant === 'B' && (
                  <>
                    {!day0NumberRevealed ? (
                      <>
                        {/* Preview text */}
                        <p className="text-2xl font-semibold text-[#111827] mb-2">
                          {getDay0PreviewText()}
                        </p>
                        <p className="text-sm text-[#111827]/70 mb-4">
                          This is what you'll need before your first paycheck: deposit, first month, moving costs, and timing gaps.
                        </p>
                        
                        {/* CTA Button */}
                        <Button
                          onClick={handleDay0CTAClick}
                          className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90 mb-3"
                        >
                          Get my Day-0 Cash Plan
                        </Button>
                      </>
                    ) : (
                      <>
                        {/* Revealed exact number */}
                        <p className="text-3xl font-bold text-[#111827] mb-1">
                          {formatCurrencyRange(upfrontCash.totalLow, upfrontCash.totalHigh)}
                        </p>
                        <p className="text-xs text-[#111827]/60 mb-3">
                          Estimate based on start date and typical move-in timing.
                        </p>
                        
                        {/* Assumptions Disclosure */}
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="assumptions" className="border-none">
                            <AccordionTrigger className="text-xs text-[#111827]/70 hover:no-underline py-2">
                              View assumptions
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
                      </>
                    )}
                  </>
                )}
              </div>
            )}
            
            {/* Day-0 Cash Email Modal (Variant B only) */}
            {variant === 'B' && upfrontCash && (
              {planData && (
                <Day0CashEmailModal
                  variant={variant}
                  isOpen={isDay0EmailModalOpen}
                  onOpenChange={setIsDay0EmailModalOpen}
                  onEmailSubmitted={handleDay0EmailSubmitted}
                  planData={planData}
                />
              )}
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
