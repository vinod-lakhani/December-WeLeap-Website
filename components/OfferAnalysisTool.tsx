'use client';

/**
 * OfferAnalysisTool
 * Full offer letter breakdown — all 7 numbers, live take-home, 40-yr wealth impact.
 * On CTA: encodes key fields as URL params and redirects to the WeLeap app.
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { track } from '@/lib/analytics';
import { calculateMarketRentRange, compareMarketToSafe } from '@/lib/zoriClient';
import { appLink } from '@/lib/app-link';
import { fbqTrack } from '@/lib/meta-pixel';
import { OfferShareCard } from '@/components/OfferShareCard';

// ── Constants ─────────────────────────────────────────────────────────────────

const NO_INCOME_TAX_STATES = new Set(['AK', 'FL', 'NV', 'NH', 'SD', 'TN', 'TX', 'WA', 'WY']);

const US_STATES = [
  { code: 'AL', name: 'Alabama' }, { code: 'AK', name: 'Alaska' }, { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' }, { code: 'CA', name: 'California' }, { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' }, { code: 'DE', name: 'Delaware' }, { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' }, { code: 'HI', name: 'Hawaii' }, { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' }, { code: 'IN', name: 'Indiana' }, { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' }, { code: 'KY', name: 'Kentucky' }, { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' }, { code: 'MD', name: 'Maryland' }, { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' }, { code: 'MN', name: 'Minnesota' }, { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' }, { code: 'MT', name: 'Montana' }, { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' }, { code: 'NH', name: 'New Hampshire' }, { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' }, { code: 'NY', name: 'New York' }, { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' }, { code: 'OH', name: 'Ohio' }, { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' }, { code: 'PA', name: 'Pennsylvania' }, { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' }, { code: 'SD', name: 'South Dakota' }, { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' }, { code: 'UT', name: 'Utah' }, { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' }, { code: 'WA', name: 'Washington' }, { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' }, { code: 'WY', name: 'Wyoming' }, { code: 'DC', name: 'D.C.' },
];


const MARKET_PTO_DAYS = 15;

interface TaxResult {
  netIncomeAnnual: number;
  federalTaxAnnual: number;
  stateTaxAnnual: number;
  ficaTaxAnnual: number;
}

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Math.round(Math.abs(n)));

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ num, title, subtitle, annualValue, children }: {
  num: number; title: string; subtitle: string; annualValue?: number | null; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-3">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-[#386641] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {num}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">{title}</div>
            <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
          </div>
        </div>
        {annualValue != null && annualValue > 0 && (
          <div className="text-right shrink-0">
            <div className="text-xs text-gray-400">per year</div>
            <div className="text-base font-extrabold text-[#386641]">{fc(annualValue)}</div>
          </div>
        )}
      </div>
      <div className="px-5 py-5">{children}</div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function OfferAnalysisTool() {
  // 1. Base salary
  const [salaryInput, setSalaryInput] = useState('');
  const [salary, setSalary] = useState(0);
  const [jobState, setJobState] = useState('');
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);
  const [taxLoading, setTaxLoading] = useState(false);

  // 2. Bonus
  const [bonusPct, setBonusPct] = useState(10);

  // 3. 401k match
  const [matchRatePct, setMatchRatePct] = useState(100);
  const [matchUpToPct, setMatchUpToPct] = useState(6);

  // 4. Health & benefits
  const [hsaMonthly, setHsaMonthly] = useState(0);
  const [healthcarePremium, setHealthcarePremium] = useState(0);

  // 5. Equity
  const [rsuAnnual, setRsuAnnual] = useState(0);
  const [showEspp, setShowEspp] = useState(false);
  const [esppContrib, setEsppContrib] = useState(10);
  const [esppDiscount, setEsppDiscount] = useState(15);

  // 6. PTO
  const [ptoDays, setPtoDays] = useState(15);

  // 7. Housing
  const [city, setCity] = useState('');
  const [rentMonthly, setRentMonthly] = useState(0);

  // 50/30/20
  const [needsPct, setNeedsPct] = useState(50);
  const [wantsPct, setWantsPct] = useState(30);
  const savingsPct = Math.max(0, 100 - needsPct - wantsPct);


  // Metro/city options
  const [metroOptions, setMetroOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [loadingMetros, setLoadingMetros] = useState(false);

  // Market rent data
  const [marketRentData, setMarketRentData] = useState<{
    medianRent: number;
    marketLow: number;
    marketHigh: number;
    tier: string;
  } | null>(null);
  const [loadingMarketRent, setLoadingMarketRent] = useState(false);
  const [marketRentComparison, setMarketRentComparison] = useState<'above' | 'overlap' | 'below' | null>(null);

  // ── Load metro options when state changes ───────────────────────────────────
  useEffect(() => {
    if (!jobState) {
      setMetroOptions([]);
      setCity('');
      return;
    }

    setLoadingMetros(true);
    const url = `/api/zori?state=${jobState}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.options && Array.isArray(data.options)) {
          setMetroOptions(data.options);
        } else {
          setMetroOptions([]);
        }
      })
      .catch(err => {
        console.error('Failed to load metro options:', err);
        setMetroOptions([]);
      })
      .finally(() => {
        setLoadingMetros(false);
      });
  }, [jobState]);

  // ── Tax API call ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (salary <= 0) { setTaxResult(null); return; }
    let cancelled = false;
    setTaxLoading(true);
    fetch('/api/tax', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ salaryAnnual: salary, state: jobState || 'CA' }),
    })
      .then(r => r.json())
      .then((data: TaxResult) => { if (!cancelled) { setTaxResult(data); setTaxLoading(false); } })
      .catch(() => { if (!cancelled) setTaxLoading(false); });
    return () => { cancelled = true; };
  }, [salary, jobState]);

  // ── Calculations ─────────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    if (salary <= 0) return null;
    const takeHomeMonthly = taxResult ? Math.round(taxResult.netIncomeAnnual / 12) : Math.round(salary * 0.72 / 12);

    // Effective tax rate on the base salary — used to approximate tax on bonus/equity.
    // RSUs, bonuses, and ESPP are taxed as ordinary income (supplemental withholding),
    // so applying the same effective rate is a reasonable estimate.
    const effectiveTaxRate = taxResult
      ? (taxResult.federalTaxAnnual + taxResult.stateTaxAnnual + taxResult.ficaTaxAnnual) / salary
      : 0.28; // fallback ~28% when no API result yet

    const annualBonus = salary * bonusPct / 100;
    const annual401kMatch = salary * (matchUpToPct / 100) * (matchRatePct / 100);
    const annualHsa = hsaMonthly * 12;
    const annualHealthcare = -(healthcarePremium * 12);
    const annualEspp = showEspp ? Math.round(salary * esppContrib / 100 * esppDiscount / 100) : 0;

    // totalPackage is pre-tax total comp — industry standard for comp discussions
    const totalPackage = salary + annualBonus + annual401kMatch + annualHsa + annualHealthcare + rsuAnnual + annualEspp;
    const ptoValue = Math.round((salary / 260) * Math.max(0, ptoDays - MARKET_PTO_DAYS));

    // After-tax values for wealth-building — bonus and equity are taxed before you keep them
    const annualBonusAfterTax = annualBonus * (1 - effectiveTaxRate);
    const annualRsuAfterTax   = rsuAnnual   * (1 - effectiveTaxRate);
    const annualEsppAfterTax  = annualEspp  * (1 - effectiveTaxRate);

    // Monthly wealth = after-tax savings rate + employer contributions (pre-tax benefit) + after-tax equity
    const monthlyWealth = Math.round(takeHomeMonthly * savingsPct / 100)
      + (annual401kMatch + annualHsa) / 12
      + (annualBonusAfterTax + annualRsuAfterTax + annualEsppAfterTax) / 12;

    const nw40yr = Math.round(monthlyWealth * ((Math.pow(1 + 0.07 / 12, 480) - 1) / (0.07 / 12)));
    const rentPct = rentMonthly > 0 && takeHomeMonthly > 0 ? Math.round(rentMonthly / takeHomeMonthly * 100) : null;

    return {
      takeHomeMonthly, effectiveTaxRate,
      annualBonus, annual401kMatch, annualHsa, annualHealthcare, annualEspp,
      annualBonusAfterTax, annualRsuAfterTax, annualEsppAfterTax,
      ptoValue, totalPackage, monthlyWealth, nw40yr, rentPct,
    };
  }, [salary, taxResult, bonusPct, matchRatePct, matchUpToPct, hsaMonthly, healthcarePremium, rsuAnnual, showEspp, esppContrib, esppDiscount, ptoDays, rentMonthly, savingsPct]);

  // ── Market rent data load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!city || !jobState) {
      setMarketRentData(null);
      setMarketRentComparison(null);
      return;
    }

    setLoadingMarketRent(true);
    const url = `/api/zori?state=${jobState}&region=${encodeURIComponent(city)}`;
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.medianRent) {
          const marketRange = calculateMarketRentRange(data.medianRent);

          // Auto-fill rent with median if not already set
          if (rentMonthly === 0) {
            setRentMonthly(Math.round(data.medianRent));
          }

          setMarketRentData({
            medianRent: data.medianRent,
            marketLow: marketRange.marketLow,
            marketHigh: marketRange.marketHigh,
            tier: marketRange.tier,
          });

          // Calculate comparison based on safe range
          if (calc) {
            const safeLow = Math.round(calc.takeHomeMonthly * 0.28);
            const safeHigh = Math.round(calc.takeHomeMonthly * 0.35);
            const comparison = compareMarketToSafe(
              marketRange.marketLow,
              marketRange.marketHigh,
              safeLow,
              safeHigh
            );
            setMarketRentComparison(comparison);
          }
        }
      })
      .catch(err => {
        console.error('Failed to load market rent data:', err);
        setMarketRentData(null);
      })
      .finally(() => {
        setLoadingMarketRent(false);
      });
  }, [city, jobState, calc, rentMonthly]);

  // ── Analytics helpers ───────────────────────────────────────────────────────

  /**
   * Second step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
   * tool_cta_clicked -> cta_click_signup.
   *
   * `offer_tool_field_changed` fires on every keystroke, which measures effort
   * but cannot be a funnel step — a funnel needs one event per person per step.
   * This fires once, on the first field anyone touches.
   */
  const engagedRef = useRef(false);
  const trackFieldChange = useCallback((field: string, value: any) => {
    if (!engagedRef.current) {
      engagedRef.current = true;
      track('tool_engaged', { tool: 'offer', first_field: field });
    }
    track('offer_tool_field_changed', {
      field,
      value_type: typeof value === 'number' ? 'number' : 'string',
      has_value: !!value,
    });
  }, []);


  const trackEsppToggle = useCallback((isOpen: boolean) => {
    track('offer_tool_espp_toggled', { espp_expanded: isOpen });
  }, []);

  // ── CTA ──────────────────────────────────────────────────────────────────────
  const handleSignUp = useCallback((placement: 'button' | 'preview_tile' = 'button') => {
    if (!salary) return;
    // Phase 0 funnel event (mirrors the rent tool with tool: 'offer').
    // `placement` distinguishes the primary button from the clickable preview
    // tile — without it both targets fire an identical event and we can't tell
    // which one is doing the work.
    track('tool_cta_clicked', { tool: 'offer', placement });
    track('offer_tool_cta_clicked', { salary: Math.round(salary / 10000) * 10000, state: jobState, placement });
    // appLink() owns the cross-domain attribution: stored first-touch UTMs plus
    // the PostHog distinct_id as ph_did, so weleap.app can identify() the same
    // person rather than counting them twice. This used to rebuild that logic
    // inline, which meant a change to attribution would have silently missed
    // the tool with the deepest link.
    window.location.href = appLink('/react/#analyze', {
      src: 'offer_tool',
      salary: String(salary),
      state: jobState,
      bonus: bonusPct ? String(bonusPct) : '',
      matchRate: matchRatePct ? String(matchRatePct) : '',
      matchUpTo: matchUpToPct ? String(matchUpToPct) : '',
      hsa: hsaMonthly ? String(hsaMonthly) : '',
      rsu: rsuAnnual ? String(rsuAnnual) : '',
      city,
      rent: rentMonthly ? String(rentMonthly) : '',
    });
  }, [salary, jobState, bonusPct, matchRatePct, matchUpToPct, hsaMonthly, rsuAnnual, city, rentMonthly]);

  const hasResults = !!calc;

  /**
   * Fourth step of the funnel, fired once.
   *
   * `hasResults` alone is true the instant the first digit of a salary is
   * typed, which made tool_completed and tool_engaged the same moment and the
   * funnel step between them meaningless. It now waits for the tax lookup to
   * resolve, which is the point the package total and the take-home figure stop
   * being the 72% placeholder and become an actual answer worth reading.
   */
  const analysisComplete = hasResults && !!taxResult;
  const toolCompletedRef = useRef(false);
  useEffect(() => {
    if (analysisComplete && !toolCompletedRef.current) {
      toolCompletedRef.current = true;
      track('tool_completed', { tool: 'offer' });
      fbqTrack('Lead', { content_name: 'offer_tool' });
    }
  }, [analysisComplete]);

  return (
    <div className="w-full max-w-[600px] mx-auto">

      {/* Running total: a PROGRESS indicator while filling the form, not the
          conclusion. Deliberately drops the "+$X more" delta — that framing
          belongs to the answer card below, and showing both spoiled the reveal
          before the user reached it. Sticky, so it follows you through seven
          sections of inputs. */}
      {hasResults && calc && (
        <div className="sticky top-[86px] z-20 mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#2d5a26] px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white/50">
            Package so far
          </span>
          <span className="text-base font-extrabold text-[#A7C957] tabular-nums">
            {fc(calc.totalPackage)}
          </span>
        </div>
      )}

      {/* ── 1. Base Salary ─────────────────────────────────────────────────── */}
      <Section num={1} title="Base Salary" subtitle="The headline number on your offer letter" annualValue={salary || null}>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Annual base salary</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input
                type="text" inputMode="numeric" placeholder="e.g. 150,000"
                value={salaryInput}
                onChange={e => {
                  const raw = e.target.value.replace(/[^0-9]/g, '');
                  setSalaryInput(raw ? Number(raw).toLocaleString() : '');
                  const newSalary = raw ? Number(raw) : 0;
                  setSalary(newSalary);
                  if (newSalary > 0) trackFieldChange('salary', newSalary);
                }}
                className="pl-6 text-base font-semibold border-[#386641] focus-visible:ring-[#386641]"
                autoFocus
              />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">
              Work state <span className="font-normal text-gray-400">(optional — improves tax accuracy)</span>
            </Label>
            <Select value={jobState} onValueChange={(val) => {
              setJobState(val);
              trackFieldChange('state', val);
            }}>
              <SelectTrigger><SelectValue placeholder="— select state —" /></SelectTrigger>
              <SelectContent>
                {US_STATES.map(s => <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {jobState && NO_INCOME_TAX_STATES.has(jobState) && (
              <p className="text-xs text-[#386641] font-semibold mt-1">No state income tax ✓</p>
            )}
          </div>
          {calc && (
            <div className="flex items-center justify-between bg-green-50 border border-[#A7C957] rounded-xl px-4 py-3">
              <span className="text-sm text-[#386641]">
                {taxLoading ? 'Calculating take-home…' : `Est. monthly take-home${!taxResult ? ' (approx.)' : ''}`}
              </span>
              <span className="text-xl font-extrabold text-gray-900">{fc(calc.takeHomeMonthly)}<span className="text-sm font-medium text-gray-500">/mo</span></span>
            </div>
          )}
        </div>
      </Section>

      {salary > 0 && (<>
      {/* ── 2. Bonus ──────────────────────────────────────────────────────── */}
      <Section num={2} title="Bonus Target" subtitle="Annual performance bonus — not guaranteed but real comp" annualValue={calc?.annualBonus}>
        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-sm font-semibold text-gray-700">Target bonus</Label>
            <span className="text-lg font-extrabold text-gray-900">{bonusPct}%</span>
          </div>
          <input type="range" min={0} max={50} step={5} value={bonusPct} onChange={e => {
            const newVal = Number(e.target.value);
            setBonusPct(newVal);
            trackFieldChange('bonus_pct', newVal);
          }}
            className="w-full accent-[#386641] cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>Typical: 10–20%</span><span>50%</span></div>
          {calc && bonusPct > 0 && (
            <p className="text-sm text-gray-500 mt-2">At target: <strong className="text-gray-900">{fc(calc.annualBonus)}/yr</strong></p>
          )}
        </div>
      </Section>

      {/* ── 3. 401k match ─────────────────────────────────────────────────── */}
      <Section num={3} title="401k Match" subtitle="Free money — often the most-missed line in an offer" annualValue={calc?.annual401kMatch}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Match rate</Label>
            <div className="relative">
              <Input type="text" inputMode="numeric" placeholder="100" value={matchRatePct || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setMatchRatePct(newVal);
                  trackFieldChange('match_rate_pct', newVal);
                }}
                className="pr-6" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Up to (% of salary)</Label>
            <div className="relative">
              <Input type="text" inputMode="numeric" placeholder="6" value={matchUpToPct || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setMatchUpToPct(newVal);
                  trackFieldChange('match_up_to_pct', newVal);
                }}
                className="pr-6" />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
            </div>
          </div>
        </div>
        {calc && calc.annual401kMatch > 0 && (
          <p className="text-sm text-gray-500 mt-3">Contribute at least {matchUpToPct}% to capture the full <strong className="text-[#386641]">{fc(calc.annual401kMatch)}/yr match</strong>.</p>
        )}
      </Section>

      {/* ── 4. Health & Benefits ──────────────────────────────────────────── */}
      <Section num={4} title="Health & Benefits" subtitle="Employer HSA contribution and your healthcare premium" annualValue={calc ? calc.annualHsa + calc.annualHealthcare : null}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Employer HSA / mo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="text" inputMode="numeric" placeholder="0" value={hsaMonthly || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setHsaMonthly(newVal);
                  if (newVal > 0) trackFieldChange('hsa_monthly', newVal);
                }} className="pl-6" />
            </div>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Your healthcare premium / mo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="text" inputMode="numeric" placeholder="0" value={healthcarePremium || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setHealthcarePremium(newVal);
                  if (newVal > 0) trackFieldChange('healthcare_premium', newVal);
                }} className="pl-6" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── 5. Equity ─────────────────────────────────────────────────────── */}
      <Section num={5} title="Equity" subtitle="RSUs and ESPP — often the biggest gap between base and total comp" annualValue={calc ? rsuAnnual + calc.annualEspp : null}>
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1 block">RSU grant — annual vesting value</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="text" inputMode="numeric" placeholder="0" value={rsuAnnual || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setRsuAnnual(newVal);
                  if (newVal > 0) trackFieldChange('rsu_annual', newVal);
                }} className="pl-6" />
            </div>
            <p className="text-xs text-gray-400 mt-1">Total grant ÷ vesting years. E.g. $100k over 4 years = $25,000/yr</p>
          </div>
          <button type="button" onClick={() => {
            const newVal = !showEspp;
            setShowEspp(newVal);
            trackEsppToggle(newVal);
          }}
            className="text-sm font-semibold text-[#386641] flex items-center gap-1 bg-transparent border-none cursor-pointer">
            {showEspp ? '▾' : '▸'} Employee Stock Purchase Plan (ESPP)
          </button>
          {showEspp && (
            <div className="grid grid-cols-2 gap-3 pl-3 border-l-2 border-green-100">
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1 block">Your contribution %</Label>
                <div className="relative">
                  <Input type="text" inputMode="numeric" placeholder="10" value={esppContrib || ''}
                    onChange={e => {
                      const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                      setEsppContrib(newVal);
                      trackFieldChange('espp_contrib_pct', newVal);
                    }} className="pr-6 text-sm" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-gray-600 mb-1 block">Discount %</Label>
                <div className="relative">
                  <Input type="text" inputMode="numeric" placeholder="15" value={esppDiscount || ''}
                    onChange={e => {
                      const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                      setEsppDiscount(newVal);
                      trackFieldChange('espp_discount_pct', newVal);
                    }} className="pr-6 text-sm" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* ── 6. PTO ────────────────────────────────────────────────────────── */}
      <Section num={6} title="Time Off" subtitle="PTO above the US average (15 days) has real dollar value" annualValue={calc && calc.ptoValue > 0 ? calc.ptoValue : null}>
        <div>
          <div className="flex justify-between mb-2">
            <Label className="text-sm font-semibold text-gray-700">PTO days offered</Label>
            <span className="text-lg font-extrabold text-gray-900">{ptoDays} days</span>
          </div>
          <input type="range" min={0} max={40} step={1} value={ptoDays} onChange={e => {
            const newVal = Number(e.target.value);
            setPtoDays(newVal);
            trackFieldChange('pto_days', newVal);
          }}
            className="w-full accent-[#386641] cursor-pointer" />
          <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0</span><span>US avg: 15 days</span><span>40</span></div>
          {calc && salary > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              Daily rate: {fc(salary / 260)}.{' '}
              {ptoDays > MARKET_PTO_DAYS
                ? <><strong className="text-[#386641]">{ptoDays - MARKET_PTO_DAYS} days above market</strong> = {fc(calc.ptoValue)}/yr extra value.</>
                : ptoDays === MARKET_PTO_DAYS ? 'At US market average.'
                : <strong className="text-red-500">{MARKET_PTO_DAYS - ptoDays} days below market.</strong>}
            </p>
          )}
        </div>
      </Section>

      {/* ── 7. Housing ────────────────────────────────────────────────────── */}
      <Section num={7} title="Where You'll Live" subtitle="Rent as a % of take-home reveals more than the salary alone">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">City / Metro</Label>
            <Select value={city} onValueChange={(val) => {
              setCity(val);
              trackFieldChange('city', val);
            }} disabled={!jobState || loadingMetros}>
              <SelectTrigger><SelectValue placeholder={loadingMetros ? "Loading..." : jobState ? "— select city —" : "— select state first —"} /></SelectTrigger>
              <SelectContent>
                {metroOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-sm font-semibold text-gray-700 mb-1.5 block">Expected rent / mo</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <Input type="text" inputMode="numeric" placeholder="0" value={rentMonthly || ''}
                onChange={e => {
                  const newVal = Number(e.target.value.replace(/[^0-9]/g, '')) || 0;
                  setRentMonthly(newVal);
                  if (newVal > 0) trackFieldChange('rent_monthly', newVal);
                }} className="pl-6" />
            </div>
          </div>
        </div>
        {calc && rentMonthly > 0 && calc.rentPct !== null && (
          <div className="space-y-3 mt-3">
            <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              calc.rentPct <= 30 ? 'bg-green-50 text-[#386641] border border-[#A7C957]'
              : calc.rentPct <= 35 ? 'bg-yellow-50 text-yellow-700 border border-yellow-300'
              : 'bg-red-50 text-red-700 border border-red-300'
            }`}>
              {calc.rentPct}% of take-home — {calc.rentPct <= 30 ? 'healthy range ✓' : calc.rentPct <= 35 ? 'a bit stretched' : 'over the 35% threshold'}
            </div>

            {/* A warning with nowhere to go is just a scold. Over 35% we hand
                them the rent tool, pre-filled with what they've already typed. */}
            {calc.rentPct > 35 && (
              <a
                href={`/how-much-rent-can-i-afford?salary=${Math.round(salary)}`}
                onClick={() => track('tool_cross_sell_clicked', { from: 'offer', to: 'rent' })}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#A7C957] bg-green-50 px-4 py-3 transition hover:border-[#386641]"
              >
                <span className="text-sm text-gray-700">
                  Find the rent you can actually afford on this offer
                </span>
                <span className="shrink-0 text-sm font-bold text-[#386641]">Open →</span>
              </a>
            )}

            {city && (
              <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
                {loadingMarketRent ? (
                  <p className="text-sm text-gray-600">Loading market rent data for {city}...</p>
                ) : marketRentData ? (
                  <>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                      <p className="text-xs text-blue-900 mb-2">
                        <strong>What's out there:</strong> Typical rents in {city} are around <strong>${marketRentData.marketLow}–${marketRentData.marketHigh}/month.</strong>
                      </p>
                      <p className="text-xs text-blue-800">
                        {marketRentComparison === 'above' ? (
                          <>
                            <strong>Reality check:</strong> Typical rents run higher than your safe range (28–35% of take-home). Many people get roommates or trade space for flexibility.
                          </>
                        ) : marketRentComparison === 'below' ? (
                          <>
                            <strong>Good news:</strong> Typical rents fall below your safe range — you may have more room to save or upgrade your living space.
                          </>
                        ) : (
                          <>
                            <strong>Heads up:</strong> Typical rents overlap your safe range — being intentional about location and space tradeoffs matters.
                          </>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-gray-500">Could not load market data for {city}.</p>
                )}
              </div>
            )}
          </div>
        )}
      </Section>

      {/* ── Full package breakdown ─────────────────────────────────────────── */}
      {calc && (
        <div className="space-y-3 mb-3">
          {/* THE ANSWER. The tool's whole premise is that an offer is worth more
              than the base number — but that finding was rendering as
              "+$15,200 more than base salary" in 12px white/30 at the bottom of
              the breakdown card. It leads now; the breakdown below is the proof. */}
          <div className="rounded-2xl border border-hairline bg-white px-6 py-8 text-center shadow-card">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-700">
              Your offer is actually worth
            </p>
            <p className="mt-2 text-[clamp(2.6rem,7vw,3.6rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
              {fc(calc.totalPackage)}
            </p>
            {calc.totalPackage > salary && (
              <p className="mt-3 text-[15px] text-subtle">
                <span className="font-bold text-brand-700">
                  +{Math.round(((calc.totalPackage - salary) / salary) * 100)}% more
                </span>{' '}
                than the {fc(salary)} base they quoted you
              </p>
            )}
            <p className="mt-1.5 text-[13px] text-faint">
              You&apos;d keep about {fc(calc.takeHomeMonthly)}/mo after tax
            </p>

            {/* Share belongs with the number it's about — this is peak
                "wait, really?". Five blocks later, past the CTA, it wasn't. */}
            {calc.totalPackage > salary && (
              <div className="mt-5 border-t border-hairline pt-4">
                <OfferShareCard
                  upliftPct={((calc.totalPackage - salary) / salary) * 100}
                  trigger={
                    <button
                      type="button"
                      onClick={() => track('offer_share_card_opened', { page: '/offer' })}
                      className="text-sm font-bold text-brand-700 underline underline-offset-4 hover:text-brand-800"
                    >
                      Share this without showing your salary →
                    </button>
                  }
                />
              </div>
            )}
          </div>

          {/* Package card */}
          <div className="bg-[#1a2e1a] rounded-2xl px-6 py-5">
            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mb-4">Your full package</div>
            {[
              { label: 'Base salary', value: salary },
              { label: `Bonus target (${bonusPct}%)`, value: calc.annualBonus, show: bonusPct > 0 },
              { label: `401k match`, value: calc.annual401kMatch, show: matchUpToPct > 0 },
              { label: 'Employer HSA', value: calc.annualHsa, show: hsaMonthly > 0 },
              { label: 'Healthcare premium', value: calc.annualHealthcare, show: healthcarePremium > 0 },
              { label: 'RSUs (annual vesting)', value: rsuAnnual, show: rsuAnnual > 0 },
              { label: 'ESPP discount', value: calc.annualEspp, show: showEspp && calc.annualEspp > 0 },
              { label: `PTO (+${ptoDays - MARKET_PTO_DAYS} days)`, value: calc.ptoValue, show: calc.ptoValue > 0 },
            ].filter(r => r.show !== false).map((row, i, arr) => (
              <div key={i} className={`flex justify-between items-baseline py-1.5 ${i < arr.length - 1 ? 'border-b border-white/5' : ''}`}>
                <span className={`text-sm ${i === 0 ? 'text-white/90' : 'text-white/50'}`}>{row.label}</span>
                <span className={`text-sm font-bold ${row.value < 0 ? 'text-red-400' : i === 0 ? 'text-white/90' : 'text-[#A7C957]'}`}>
                  {row.value < 0 ? `−${fc(row.value)}` : fc(row.value)}
                </span>
              </div>
            ))}
            <div className="border-t border-white/20 mt-3 pt-3 flex justify-between items-baseline">
              <span className="text-sm font-bold text-white">Total package</span>
              <span className="text-2xl font-black text-[#A7C957]">{fc(calc.totalPackage)}</span>
            </div>
          </div>

          {/* 50/30/20 */}
          <div className="bg-white rounded-2xl border border-gray-200 px-5 py-5">
            <div className="flex justify-between items-baseline mb-1">
              <div className="text-sm font-bold text-gray-900">Monthly take-home breakdown</div>
              <div className="text-xl font-extrabold text-[#386641]">{fc(calc.takeHomeMonthly)}/mo</div>
            </div>
            <p className="text-xs text-gray-400 mb-5">Starting with a 50/30/20 split. Adjust to match how you plan to live.</p>

            {/* Needs */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold text-gray-800">🏠 Needs ({needsPct}%)</span>
                <span className="text-sm font-bold text-gray-800">{fc(calc.takeHomeMonthly * needsPct / 100)}/mo</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Rent, utilities, groceries, transport, insurance, minimum debt payments.</p>
              <input type="range" min={10} max={70} step={5} value={needsPct} onChange={e => {
                const newVal = Number(e.target.value);
                setNeedsPct(newVal);
                trackFieldChange('needs_pct', newVal);
              }}
                className="w-full accent-gray-700 cursor-pointer" />
            </div>

            {/* Wants */}
            <div className="mb-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-bold text-gray-800">🛍️ Wants ({wantsPct}%)</span>
                <span className="text-sm font-bold text-gray-800">{fc(calc.takeHomeMonthly * wantsPct / 100)}/mo</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">Dining, subscriptions, travel, shopping, entertainment, hobbies.</p>
              <input type="range" min={5} max={60} step={5} value={wantsPct} onChange={e => {
                const newVal = Number(e.target.value);
                setWantsPct(newVal);
                trackFieldChange('wants_pct', newVal);
              }}
                className="w-full accent-gray-700 cursor-pointer" />
            </div>

            {/* Savings */}
            <div className={`rounded-xl px-4 py-3 ${
              savingsPct >= 20 ? 'bg-green-50 border border-[#A7C957]'
              : savingsPct >= 10 ? 'bg-yellow-50 border border-yellow-300'
              : 'bg-red-50 border border-red-300'
            }`}>
              <div className="flex justify-between items-baseline mb-1">
                <span className={`text-sm font-bold ${savingsPct >= 20 ? 'text-[#386641]' : savingsPct >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>
                  💰 Savings ({savingsPct}%)
                </span>
                <span className={`text-sm font-bold ${savingsPct >= 20 ? 'text-[#386641]' : savingsPct >= 10 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {fc(calc.takeHomeMonthly * savingsPct / 100)}/mo
                </span>
              </div>
              <p className="text-xs text-gray-500">
                {savingsPct >= 20
                  ? 'Emergency fund, 401k beyond match, investments. Auto-calculated from remaining %.'
                  : savingsPct >= 10 ? 'A bit tight — most financial plans target at least 20% for wealth building.'
                  : 'Below 10% — consider reducing needs or wants to build meaningful savings.'}
              </p>
            </div>

            {/* Wealth building */}
            <div className="mt-4 bg-green-50 border border-[#A7C957] rounded-xl px-4 py-3">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-semibold text-[#386641]">Total monthly wealth building</span>
                <span className="text-base font-extrabold text-[#386641]">{fc(calc.monthlyWealth)}/mo</span>
              </div>
              <p className="text-xs text-gray-500">Savings + 401k match + equity → <strong className="text-gray-900">${(calc.nw40yr / 1_000_000).toFixed(1)}M in 40 years at 7%</strong></p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl border-2 border-gray-200 px-6 py-6">
            {/* Lead with the match — it's the single most concrete, most
                time-sensitive number in the whole analysis, and it was
                previously buried in the breakdown while the CTA showed a
                feature list. Falls back to total-package uplift when the
                offer has no match. */}
            {calc.annual401kMatch > 0 ? (
              <div className="mb-5 rounded-xl border border-[#A7C957] bg-green-50 px-4 py-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#386641] mb-1">
                  Your first Leap
                </p>
                <p className="text-2xl font-extrabold text-gray-900 leading-tight">
                  Capture the full {fc(calc.annual401kMatch)}/yr match
                </p>
                <p className="text-xs text-gray-500 mt-1.5">
                  You only get it if you contribute at least {matchUpToPct}%. Most plans let you change this
                  any time — but it doesn&apos;t backdate.
                </p>
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-[#A7C957] bg-green-50 px-4 py-4 text-center">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#386641] mb-1">
                  Your first Leap
                </p>
                <p className="text-2xl font-extrabold text-gray-900 leading-tight">
                  Put {fc(calc.monthlyWealth)}/mo to work
                </p>
                <p className="text-xs text-gray-500 mt-1.5">
                  That&apos;s what this offer leaves you to build with. Where it goes first is the decision
                  that compounds.
                </p>
              </div>
            )}

            {/* The three "where should we start?" options all led to the same
                onboarding, so they promised a branch that doesn't exist — and
                asked the user to choose before knowing what they were choosing
                between. Replaced with one action plus what's actually waiting
                on the other side. `intent` is no longer sent; the app link
                already guarded for its absence, and the question is better
                asked in onboarding where it can change something. */}
            <Button onClick={() => handleSignUp('button')}
              className="w-full rounded-xl bg-[#386641] py-4 text-base font-bold text-white transition-all hover:bg-[#2d5a26]">
              Get my first Leap →
            </Button>

            {/* The whole tile is the target, not just the button above it —
                it already shows what you get, so clicking it to get it is the
                natural gesture. A real button element so it stays keyboard-
                reachable, with a hover lift so it reads as clickable. */}
            <button
              type="button"
              onClick={() => handleSignUp('preview_tile')}
              aria-label="Create your free account and get your first Leap"
              className="group mt-5 block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition hover:-translate-y-[2px] hover:border-[#386641] hover:bg-white hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#386641]"
            >
              <p className="mb-3 text-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                What&apos;s waiting in the app
              </p>
              <img
                src="/images/product/weekly-focus.jpg"
                alt="WeLeap showing this week's focus: capture your full 401(k) match"
                width={1400}
                height={529}
                loading="lazy"
                className="mb-3 block h-auto w-full rounded-lg border border-gray-200"
              />
              <div className="space-y-1.5">
                {[
                  'Your match, tracked until you actually capture it',
                  'A savings, debt and retirement plan built on this salary',
                  'Add a second offer any time and compare side by side',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className="mt-[3px] shrink-0 text-[#386641]">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-center text-xs font-bold text-[#386641] group-hover:underline">
                Get all of this free →
              </p>
            </button>

            <p className="text-center text-xs text-gray-400 mt-4">Free · No credit card · ~2 minutes</p>
          </div>
        </div>
      )}
      </>)}

      <p className="text-center text-xs text-gray-300 mt-2">
        Calculations are estimates. WeLeap does not store offer data until you create an account.
      </p>
    </div>
  );
}
