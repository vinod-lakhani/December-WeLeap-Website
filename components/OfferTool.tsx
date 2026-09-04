'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ResultsCards } from '@/components/ResultsCards';
import { AssumptionsAccordion } from '@/components/AssumptionsAccordion';
import { WaitlistForm } from '@/components/WaitlistForm';
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire';
import { useCountReveal } from '@/lib/feedback-reveal';
import { getStateCodeForCity, getAvailableCities } from '@/lib/cities';
import { calculateRentRange, calculateBudgetBreakdown } from '@/lib/rent';
import { computeInvestingImpact } from '@/lib/networthImpact/math';
import { formatCurrency } from '@/lib/rounding';
import { track } from '@/lib/analytics';
import { nextRunIndex } from '@/lib/run-index';
import { trackLeapShown } from '@/lib/leap-shown';
import { appLink } from '@/lib/app-link';
import {
  bucketSalary,
  bucketRentRatio,
  bucketDaysUntilStart,
  mapCityToTier,
} from '@/lib/buckets';
import defaultMetroMappingData from '@/data/default_metro_mapping.json';

const defaultMetroMapping = defaultMetroMappingData as Record<string, { regionName: string; stateName: string }>;

interface TaxCalculationResult {
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  ficaTaxAnnual: number;
  totalTaxAnnual: number;
  netIncomeAnnual: number;
  taxSource: 'api_ninjas' | 'fallback';
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC',
];

interface MetroOption {
  label: string;
  value: string;
}

export function OfferTool() {
  const [salary, setSalary] = useState('');
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [otherState, setOtherState] = useState('');
  const [otherMetro, setOtherMetro] = useState('');
  const [debtEnabled, setDebtEnabled] = useState(false);
  const [debtMonthly, setDebtMonthly] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<TaxCalculationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Location tracking
  const [locationMode, setLocationMode] = useState<'preset' | 'other' | null>(null);
  const [presetCity, setPresetCity] = useState<string | null>(null);
  const [stateName, setStateName] = useState<string | null>(null);
  const [regionName, setRegionName] = useState<string | null>(null);
  const [zoriAvailable, setZoriAvailable] = useState(false);
  const [metroOptions, setMetroOptions] = useState<MetroOption[]>([]);
  const [loadingMetros, setLoadingMetros] = useState(false);
  
  // Track form start (fire once on first interaction)
  const formStartedRef = useRef(false);
  const prefillAppliedRef = useRef(false);
  const toolCompletedRef = useRef(false);

  /**
   * How many times a playbook has been generated this visit.
   *
   * Drives when the feedback prompt appears. State rather than a ref because
   * the prompt's visibility depends on it and a ref would not re-render.
   */
  const [playbookRuns, setPlaybookRuns] = useState(0);

  /**
   * The prompt appears with the first playbook.
   *
   * It was gated on a second run, on the reasoning that someone comparing two
   * rent ranges has formed a firmer view. That is probably true, and it was
   * the wrong trade: the 2.2 runs-per-person this was based on is a mean, and
   * a mean hides a minority re-running many times. Everyone who ran once —
   * plausibly most people — never saw the prompt at all.
   *
   * Reach wins here. Unlike the payoff slider, this tool has no post-result
   * interaction to wait for; a re-run means going back up the page and
   * resubmitting, which is a different and rarer act than nudging a control.
   * Still keyed on the run count rather than on `results` so the threshold is
   * one number to change if that judgement flips back.
   */
  const feedbackRevealed = useCountReveal(playbookRuns, {
    threshold: 1,
    enabled: !!results,
  });

  // Fire tool_completed once when results first render (Phase 0 funnel).
  // Mirrors the same event on /what-is-my-job-offer-worth with tool: 'offer'.
  useEffect(() => {
    if (results && !toolCompletedRef.current) {
      toolCompletedRef.current = true;
      track('tool_completed', { tool: 'rent', run_index: nextRunIndex('rent') });
    }
  }, [results]);

  const availableCities = getAvailableCities();
  const showOtherState = city === 'Other';

  // Pre-populate form from URL query params (e.g. from MVPLeaps sidekick).
  // Read from window.location.search so params are available on first load (useSearchParams can be stale on hydration).
  useEffect(() => {
    if (prefillAppliedRef.current || typeof window === 'undefined') return;
    prefillAppliedRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const salaryParam = params.get('salary');
    if (salaryParam != null && salaryParam !== '') {
      const num = parseInt(salaryParam.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        setSalary(String(num));
      }
    }
    let cityParam = params.get('city');
    if (cityParam != null && cityParam !== '') {
      cityParam = cityParam.trim();
      // Map "San Francisco" to dropdown option "SF Bay Area"
      if (cityParam.toLowerCase() === 'san francisco') {
        cityParam = 'SF Bay Area';
      }
      if (availableCities.includes(cityParam)) {
        setCity(cityParam);
      }
    }
    const startParam = params.get('startDate');
    if (startParam != null && startParam !== '') {
      const trimmed = startParam.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        setStartDate(trimmed);
      }
    }
  }, [availableCities]);

  // Load metro options when state is selected
  useEffect(() => {
    if (showOtherState && otherState && !loadingMetros) {
      setLoadingMetros(true);
      const url = `/api/zori?state=${otherState}`;
      console.log('[OfferTool] Loading metro options from:', url);
      fetch(url)
        .then(res => {
          if (!res.ok) {
            throw new Error(`API error: ${res.status} ${res.statusText}`);
          }
          return res.json();
        })
        .then(data => {
          console.log('[OfferTool] Metro options received:', data);
          if (data.options && Array.isArray(data.options)) {
            setMetroOptions(data.options);
          } else {
            console.warn('[OfferTool] Invalid options format:', data);
            setMetroOptions([]);
          }
        })
        .catch(err => {
          console.error('[OfferTool] Error loading metro options:', err);
          setMetroOptions([]);
        })
        .finally(() => {
          setLoadingMetros(false);
        });
    } else if (!showOtherState) {
      setMetroOptions([]);
      setOtherMetro('');
      setLoadingMetros(false);
    }
  }, [showOtherState, otherState]);

  // Update location tracking when city/state/metro changes
  useEffect(() => {
    if (city && city !== 'Other') {
      // Preset city selected
      setLocationMode('preset');
      setPresetCity(city);
      setStateName(null);
      setRegionName(null);
      
      // Get mapping from default_metro_mapping.json
      const mapping = defaultMetroMapping[city];
      if (mapping) {
        setStateName(mapping.stateName);
        setRegionName(mapping.regionName);
        setZoriAvailable(true);
      } else {
        setZoriAvailable(false);
      }
    } else if (city === 'Other' && otherState) {
      // Other selected with state
      setLocationMode('other');
      setPresetCity(null);
      setStateName(otherState);
      
      if (otherMetro && otherMetro !== '__OTHER__') {
        // Metro selected
        setRegionName(otherMetro);
        setZoriAvailable(true);
      } else if (otherMetro === '__OTHER__') {
        // "Outside major metros / Not sure" selected
        setRegionName(null);
        setZoriAvailable(false);
      } else {
        // No metro selected yet
        setRegionName(null);
        setZoriAvailable(false);
      }
    } else {
      // Reset
      setLocationMode(null);
      setPresetCity(null);
      setStateName(null);
      setRegionName(null);
      setZoriAvailable(false);
    }
  }, [city, otherState, otherMetro]);

  // Track form start on first focus/input.
  //
  // Second step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
  // tool_cta_clicked -> cta_click_signup. `rent_form_start` already fired once
  // per visit here but under a rent-only name, so it could not be the middle of
  // a funnel keyed on the shared events. Both fire now, from the same guard, so
  // the count is identical and the old event keeps its history.
  const handleFormStart = (field: string) => {
    if (!formStartedRef.current) {
      formStartedRef.current = true;
      track('tool_engaged', { tool: 'rent', first_field: field });
      track('rent_form_start', {
        page: '/how-much-rent-can-i-afford',
        tool_version: 'rent_tool_v1',
      });
    }
  };

  const calculateDaysUntilStart = (dateString: string): number => {
    if (!dateString) return 0;
    const start = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleCalculate = async () => {
    // Track hero CTA click (this is the "See my rent reality" button)
    track('hero_cta_click', {
      page: '/how-much-rent-can-i-afford',
      tool_version: 'rent_tool_v1',
    });
    
    setError(null);
    
    if (!salary || !city || !startDate) {
      setError('Please fill in all required fields');
      return;
    }

    if (showOtherState && !otherState) {
      setError('Please select a state');
      return;
    }

    const salaryNum = parseFloat(salary);
    if (isNaN(salaryNum) || salaryNum <= 0) {
      setError('Please enter a valid salary');
      return;
    }

    setIsCalculating(true);

    try {
      // Get state code
      const stateCode = showOtherState ? otherState : getStateCodeForCity(city);
      if (!stateCode) {
        throw new Error('Unable to determine state for selected city');
      }

      // Call tax API
      const taxResponse = await fetch('/api/tax', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryAnnual: salaryNum,
          state: stateCode,
        }),
      });

      if (!taxResponse.ok) {
        const errorData = await taxResponse.json();
        throw new Error(errorData.error || 'Failed to calculate taxes');
      }

      const taxData: TaxCalculationResult = await taxResponse.json();
      setResults(taxData);
      
      // Track form submit with bucketed parameters
      const takeHomeMonthlyAfterTax = taxData.netIncomeAnnual / 12;
      const rentRangeAfterSubmit = calculateRentRange(takeHomeMonthlyAfterTax, debtAmount);
      
      track('rent_form_submit', {
        page: '/how-much-rent-can-i-afford',
        tool_version: 'rent_tool_v1',
        salary_bucket: bucketSalary(salaryNum),
        city_tier: mapCityToTier(city),
        days_until_start_bucket: bucketDaysUntilStart(startDate),
        // Rent ratio will be calculated after we have the rent range
        rent_ratio_bucket: bucketRentRatio(
          (rentRangeAfterSubmit.low + rentRangeAfterSubmit.high) / 2,
          takeHomeMonthlyAfterTax
        ),
      });
      
      // Track playbook generated (after successful calculation)
      setPlaybookRuns((n) => n + 1);
      track('playbook_generated', {
        page: '/how-much-rent-can-i-afford',
        tool_version: 'rent_tool_v1',
        salary_bucket: bucketSalary(salaryNum),
        city_tier: mapCityToTier(city),
        days_until_start_bucket: bucketDaysUntilStart(startDate),
        rent_ratio_bucket: bucketRentRatio(
          (rentRangeAfterSubmit.low + rentRangeAfterSubmit.high) / 2,
          takeHomeMonthlyAfterTax
        ),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate derived values
  const takeHomeMonthly = results ? results.netIncomeAnnual / 12 : 0;
  const takeHomeAnnual = results?.netIncomeAnnual || 0;
  const debtAmount = debtEnabled ? parseFloat(debtMonthly) || 0 : 0;
  const rentRangeData = results
    ? calculateRentRange(takeHomeMonthly, debtAmount)
    : null;
  const rentRange = rentRangeData?.formatted || '';
  const rentRangeLow = rentRangeData?.low || 0;
  const rentRangeHigh = rentRangeData?.high || 0;
  const daysUntilStart = calculateDaysUntilStart(startDate);
  const budgetBreakdown = results ? calculateBudgetBreakdown(takeHomeMonthly) : null;

  // What the rent decision is worth long-run. Derived from the REAL spread
  // between the low and high end of their own range — not the 5%-of-take-home
  // heuristic used for the "going above this range" line, which answers a
  // different question and isn't tied to the choice we're asking them to make.
  const leapMonthly = Math.max(0, rentRangeHigh - rentRangeLow);

  /**
   * `leap_shown` sits in its own effect rather than beside `tool_completed`,
   * because it reports `leapMonthly` and that is declared here — below the
   * completion effect. Referencing it from up there compiles as a
   * use-before-declaration the moment it enters a dependency array.
   *
   * Same guard shape, its own ref, so the two still fire once each and at the
   * same moment: both are gated on `results` existing.
   */
  const leapShownRef = useRef(false);
  useEffect(() => {
    if (!results || leapShownRef.current) return;
    leapShownRef.current = true;
    trackLeapShown({ tool: 'rent', leapType: 'rent_reduction', leapValueUsd: leapMonthly });
  }, [results, leapMonthly]);
  const leapThirtyYear = leapMonthly > 0
    ? Math.round(computeInvestingImpact(leapMonthly, 0.07, 30))
    : 0;

  // Calculate upfront cash needed (for plan data)
  const calculateUpfrontCash = () => {
    if (!startDate || takeHomeMonthly === 0 || !rentRangeData) {
      return { low: 0, high: 0 };
    }
    const gapDays = 14;
    const depositLow = rentRangeLow;
    const depositHigh = rentRangeHigh;
    const firstMonthLow = rentRangeLow;
    const firstMonthHigh = rentRangeHigh;
    const gapLivingCosts = (takeHomeMonthly * 0.35) * (gapDays / 30);
    const movingSetup = 600;
    const totalLow = depositLow + firstMonthLow + gapLivingCosts + movingSetup;
    const totalHigh = depositHigh + firstMonthHigh + gapLivingCosts + movingSetup;
    return {
      low: Math.round(totalLow / 100) * 100,
      high: Math.round(totalHigh / 100) * 100,
    };
  };
  const upfrontCash = calculateUpfrontCash();

  // Prepare plan data for email
  const planData = results ? {
    salary,
    city,
    startDate,
    debtMonthly: debtEnabled ? debtMonthly : undefined,
    takeHomeMonthly,
    takeHomeAnnual,
    rentRange,
    rentRangeLow,
    rentRangeHigh,
    daysUntilStart,
    upfrontCashLow: upfrontCash.low,
    upfrontCashHigh: upfrontCash.high,
    budgetBreakdown: budgetBreakdown || undefined,
    taxBreakdown: results ? {
      grossAnnual: parseFloat(salary),
      federalTaxAnnual: results.federalTaxAnnual,
      stateTaxAnnual: results.stateTaxAnnual,
      ficaTaxAnnual: results.ficaTaxAnnual,
      totalTaxAnnual: results.totalTaxAnnual,
      netIncomeAnnual: results.netIncomeAnnual,
    } : undefined,
    // Location context for ZORI
    locationMode: locationMode || undefined,
    presetCity: presetCity || undefined,
    stateName: stateName || undefined,
    regionName: regionName || undefined,
    zoriAvailable: zoriAvailable,
  } : undefined;

  return (
    <div className="space-y-8">
      {/* Input Form */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-[#111827]">Find your rent range</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Salary Input */}
          <div className="space-y-2">
            <Label htmlFor="salary" className="text-[#111827]">
              Offer Salary (annual, USD) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="salary"
              type="number"
              placeholder="e.g., 75000"
              value={salary}
              onChange={(e) => {
                setSalary(e.target.value);
                handleFormStart('salary');
              }}
              onFocus={() => handleFormStart('salary')}
              className="border-[#D1D5DB] !placeholder:text-[#111827]/40"
            />
          </div>

          {/* Location Select */}
          <div className="space-y-2">
            <Label htmlFor="city" className="text-[#111827]">
              Where will you be living? <span className="text-red-500">*</span>
            </Label>
            <Select value={city} onValueChange={(value) => {
              setCity(value);
              handleFormStart('city');
            }}>
              <SelectTrigger
                id="city"
                className="border-[#D1D5DB]"
                onFocus={() => handleFormStart('city')}
              >
                <SelectValue placeholder="Select a location" />
              </SelectTrigger>
              <SelectContent className="z-[100]">
                {availableCities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* State Select (if Other selected) */}
          {showOtherState && (
            <div className="space-y-2">
              <Label htmlFor="state" className="text-[#111827]">
                State <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={otherState} 
                onValueChange={(value) => {
                  setOtherState(value);
                  setOtherMetro(''); // Reset metro when state changes
                  track('other_state_selected_v1', {
                    page: '/how-much-rent-can-i-afford',
                    stateName: value,
                  });
                }}
              >
                <SelectTrigger id="state" className="border-[#D1D5DB]">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {US_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Metro Select (if Other selected and state chosen) */}
          {showOtherState && otherState && (
            <div className="space-y-2">
              <Label htmlFor="metro" className="text-[#111827]">
                Closest metro (optional)
              </Label>
              <Select 
                value={otherMetro} 
                onValueChange={(value) => {
                  setOtherMetro(value);
                  if (value !== '__OTHER__') {
                    track('other_metro_selected_v1', {
                      page: '/how-much-rent-can-i-afford',
                      stateName: otherState,
                      regionName: value,
                    });
                  } else {
                    /**
                     * Picking "Outside major metros / Not sure" fired nothing,
                     * so the one population that gets a market-free answer was
                     * the one population that could not be counted.
                     *
                     * It also got misread: `other_metro_selected_v1` fires only
                     * on a REAL metro, so its 64 events were people who FOUND
                     * their metro. They were reported as evidence that a
                     * quarter of users fall outside coverage. The data says the
                     * opposite — 686 metros across all 51 states — and this is
                     * the event that will say how narrow the gap actually is.
                     */
                    track('other_metro_outside_selected_v1', {
                      page: '/how-much-rent-can-i-afford',
                      stateName: otherState,
                    });
                  }
                }}
                disabled={loadingMetros || metroOptions.length === 0}
              >
                <SelectTrigger id="metro" className="border-[#D1D5DB]">
                  <SelectValue placeholder={loadingMetros ? "Loading metros..." : "Select a metro"} />
                </SelectTrigger>
                <SelectContent>
                  {metroOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Used to estimate typical rents. You don't need a neighborhood yet.
              </p>
            </div>
          )}

          {/* Start Date */}
          <div className="space-y-2 relative">
            <Label htmlFor="startDate" className="text-[#111827]">
              Start Date <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                handleFormStart('start_date');
              }}
              onFocus={() => handleFormStart('start_date')}
              className="border-[#D1D5DB] text-base md:text-sm min-h-[44px] text-left w-full pr-10"
              style={{
                WebkitAppearance: 'none',
                MozAppearance: 'textfield',
              }}
            />
              {/* Fallback calendar icon for mobile browsers that hide the native one */}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 md:hidden">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 2V4M14 2V4M3 6H17M4 4H16C16.5304 4 17.0391 4.21071 17.4142 4.58579C17.7893 4.96086 18 5.46957 18 6V16C18 16.5304 17.7893 17.0391 17.4142 17.4142C17.0391 17.7893 16.5304 18 16 18H4C3.46957 18 2.96086 17.7893 2.58579 17.4142C2.21071 17.0391 2 16.5304 2 16V6C2 5.46957 2.21071 4.96086 2.58579 4.58579C2.96086 4.21071 3.46957 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <p className="text-xs text-[#111827]/60 mt-1">
              Shows the gap before your first paycheck.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {error}
            </div>
          )}

          <Button
            onClick={handleCalculate}
            disabled={isCalculating}
            className="w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
          >
            {isCalculating ? 'Calculating...' : 'See my numbers'}
          </Button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Takes about 2 minutes. We'll email your plan.
          </p>
        </CardContent>
      </Card>

      {/* Results Section */}
      {results && (
        <div className="space-y-8">
          <ResultsCards
            afterHero={
              <Card className="border-2 border-[#3F6B42] bg-[#F3F7F3] shadow-sm">
                <CardContent className="py-6 space-y-4">
                  {/* Lead with the actual decision in front of them — the spread
                      between the low and high end of their own range — not a
                      generic "we'll build you a plan". The number is already
                      computed; showing it is what makes signing up concrete. */}
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3F6B42]">
                    Your first Leap
                  </p>
                  <h3 className="text-xl font-bold text-[#111827]">
                    Rent at {formatCurrency(rentRangeLow)} instead of {formatCurrency(rentRangeHigh)} and you free up{' '}
                    <span className="text-[#3F6B42]">{formatCurrency(leapMonthly)}/mo</span>.
                  </h3>

                  {leapThirtyYear > 0 && (
                    <div className="rounded-2xl border border-[#3F6B42]/25 bg-white px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
                        What that&apos;s worth if you invest it
                      </p>
                      <p className="mt-1 text-[30px] font-extrabold leading-none text-[#111827] tabular-nums">
                        {formatCurrency(leapThirtyYear)}
                      </p>
                      <p className="mt-1.5 text-xs text-gray-500">
                        Over 30 years at 7% a year. Same salary, same city — just the cheaper apartment.
                      </p>
                    </div>
                  )}

                  <p className="text-sm text-gray-700">
                    That&apos;s the whole decision. Left alone it disappears into everyday spending — WeLeap
                    makes sure it goes somewhere first.
                  </p>
                  <div>
                    <Button
                      onClick={() => {
                        // `placement` matches the CtaPlacement union every
                        // AppCta-based tool sends. Without it this CTA was the
                        // one tool_cta_clicked that could not be split by
                        // target, which breaks the funnel comparison across
                        // tools rather than just losing a dimension here.
                        track('tool_cta_clicked', { tool: 'rent', placement: 'button' });
                        /**
                         * `src` only. Salary, city and state used to ride along
                         * here, and the app discarded all three: its hydration
                         * returns early unless `src === 'offer_tool'`, and the
                         * session it builds is an offer session whose unsent
                         * fields fall back to an invented bonus and employer
                         * match. Sending them was worse than not sending them.
                         *
                         * They would be near-worthless even if consumed —
                         * onboarding asks for income directly, so a passed
                         * salary is a default that is overwritten minutes
                         * later. `src` does not go stale, because it records
                         * where the person came from rather than what they own.
                         */
                        window.location.href = appLink('', { src: 'rent' });
                      }}
                      className="w-full sm:w-auto bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90"
                    >
                      {/* Not "Track my $350/mo". Two problems with that: the
                          $350 does not exist yet — it is conditional on signing
                          the cheaper lease — and "track" is the budgeting-app
                          verb this product spends a comparison table on /tools
                          distancing itself from. This completes the sentence
                          directly above it ("WeLeap makes sure it goes
                          somewhere first") and leaves the loop open: the tool
                          found the money, the app decides where it goes. */}
                      {leapMonthly > 0
                        ? `Show me where my ${formatCurrency(leapMonthly)}/mo should go →`
                        : 'Get my first Leap →'}
                    </Button>
                    <p className="text-xs text-gray-500 mt-2">
                      Free · 2 minutes · No credit card.
                    </p>
                  </div>
                  {/* "Email me my plan instead" used to sit here, directly
                      under the CTA and styled as a peer choice — a
                      lower-commitment escape hatch offered at the exact moment
                      of decision. The email plan itself still exists further
                      down the page; it is no longer presented as an equal
                      alternative to the thing this page is for. */}
                </CardContent>
              </Card>
            }
            takeHomeMonthly={takeHomeMonthly}
            takeHomeAnnual={takeHomeAnnual}
            rentRange={rentRange}
            rentRangeLow={rentRangeLow}
            rentRangeHigh={rentRangeHigh}
            daysUntilStart={daysUntilStart}
            startDate={startDate}
            city={city}
            locationMode={locationMode}
            presetCity={presetCity}
            stateName={stateName}
            regionName={regionName}
            zoriAvailable={zoriAvailable}
            taxBreakdown={results ? {
              grossAnnual: parseFloat(salary),
              federalTaxAnnual: results.federalTaxAnnual,
              stateTaxAnnual: results.stateTaxAnnual,
              ficaTaxAnnual: results.ficaTaxAnnual,
              totalTaxAnnual: results.totalTaxAnnual,
              netIncomeAnnual: results.netIncomeAnnual,
            } : undefined}
            planData={planData}
          />

          {/* Primary bridge: create a free account (Phase 0 landing bridge).
              Personalized with the user's rent range. Email capture becomes the
              secondary action, not the terminus. */}

          {/* Tool Feedback Questionnaire.
              Moved above the "Factor in debt" toggle and the email-plan tile.
              It used to sit below both, so reaching it meant scrolling past an
              optional advanced input and a form designed to end the session.

              Still below the CTA, deliberately: the CTA is the page's job and
              this prompt should not push it down the page to buy responses. */}
          {feedbackRevealed && (
          <ToolFeedbackQuestionnaire
            page="/how-much-rent-can-i-afford"
              tool="rent"
            eventName="rent_tool_feedback_submitted"
            question="Does this rent range make sense for you?"
            buttonLabels={{
              yes: '✅ Yes — this feels right',
              // "Not sure" is an abstention: it ends the exchange without
              // saying anything about the range. Money Plan's middle option
              // is an actual position — the person has a view, it just isn't
              // this number — and it is the best-performing prompt in the set.
              not_sure: "🤔 I'd tweak it",
              no: "❌ Doesn't feel relevant",
            }}
            feedbackResponseMessages={{
              yes: "Great — let's build the rest of your plan.",
              not_sure: 'No worries — your full plan will show the tradeoffs and alternatives.',
              no: "Got it — your full plan will show the next best move.",
            }}
            onFeedbackSubmitted={() => {}}
          />
          )}

          {/* Debt Adjustment Accordion */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debt-toggle" className="text-[#111827] cursor-pointer">
                    Factor in debt (minimums only, optional)
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setDebtEnabled(!debtEnabled);
                      if (!debtEnabled) {
                        track('offer_tool_debt_enabled');
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      debtEnabled ? 'bg-[#3F6B42]' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        debtEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {debtEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="debt" className="text-[#111827]">
                      Total monthly minimum payments ($/mo)
                    </Label>
                    <Input
                      id="debt"
                      type="number"
                      placeholder="300"
                      value={debtMonthly}
                      onChange={(e) => setDebtMonthly(e.target.value)}
                      className="border-[#D1D5DB]"
                    />
                    {debtAmount > 0 && (
                      <p className="text-sm text-[#111827]/70">
                        Updated rent range: {calculateRentRange(takeHomeMonthly, debtAmount).formatted} / month
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-8" />

          {/* Tile 2: Secondary — Day 1 Rent Plan (PDF). Target of the bridge's
              "Email me my plan instead" link. */}
          <div id="email-plan" className="scroll-mt-24">
            <WaitlistForm planData={planData} variant="secondary" />
          </div>

          {/* Assumptions Accordion */}
          <div onClick={() => track('offer_tool_assumptions_opened')}>
            <AssumptionsAccordion taxSource={results.taxSource} />
          </div>
        </div>
      )}
    </div>
  );
}
