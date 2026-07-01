'use client';

/**
 * OfferAnalysisTool
 * Full offer letter breakdown — all 7 numbers, live take-home, 40-yr wealth impact.
 * On CTA: encodes key fields as URL params and redirects to the WeLeap app.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { track } from '@/lib/analytics';
import { EarlyAccessDialog } from '@/components/early-access-dialog';
import { calculateMarketRentRange, compareMarketToSafe } from '@/lib/zoriClient';

// ── Constants ─────────────────────────────────────────────────────────────────

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://weleap.app';

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

  // Intent CTA
  const [intent, setIntent] = useState<'first' | 'two-offers' | 'current-job' | null>(null);

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
  const trackFieldChange = useCallback((field: string, value: any) => {
    track('offer_tool_field_changed', {
      field,
      value_type: typeof value === 'number' ? 'number' : 'string',
      has_value: !!value,
    });
  }, []);

  const trackIntentSelect = useCallback((selectedIntent: typeof intent) => {
    track('offer_tool_intent_selected', { intent: selectedIntent });
  }, []);

  const trackEsppToggle = useCallback((isOpen: boolean) => {
    track('offer_tool_espp_toggled', { espp_expanded: isOpen });
  }, []);

  // ── CTA ──────────────────────────────────────────────────────────────────────
  const handleSignUp = useCallback(() => {
    if (!salary) return;
    track('offer_tool_cta_clicked', { intent, salary: Math.round(salary / 10000) * 10000, state: jobState });
    const params = new URLSearchParams();
    params.set('src', 'offer_tool');
    params.set('salary', String(salary));
    if (jobState) params.set('state', jobState);
    if (bonusPct) params.set('bonus', String(bonusPct));
    if (matchRatePct) params.set('matchRate', String(matchRatePct));
    if (matchUpToPct) params.set('matchUpTo', String(matchUpToPct));
    if (hsaMonthly) params.set('hsa', String(hsaMonthly));
    if (rsuAnnual) params.set('rsu', String(rsuAnnual));
    if (city) params.set('city', city);
    if (rentMonthly) params.set('rent', String(rentMonthly));
    if (intent) params.set('intent', intent);
    window.location.href = `${APP_BASE_URL}/react/#analyze?${params.toString()}`;
  }, [salary, jobState, bonusPct, matchRatePct, matchUpToPct, hsaMonthly, rsuAnnual, city, rentMonthly, intent]);

  const hasResults = !!calc;

  return (
    <div className="w-full max-w-[600px] mx-auto">

      {/* Running total bar */}
      {hasResults && calc && (
        <div className="bg-[#2d5a26] rounded-2xl px-5 py-3 mb-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wide mb-0.5">Base salary</div>
              <div className="text-base font-bold text-white/80">{fc(salary)}</div>
            </div>
            <div className="text-white/30 text-lg">→</div>
            <div>
              <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wide mb-0.5">Total package</div>
              <div className="text-lg font-extrabold text-[#A7C957]">{fc(calc.totalPackage)}</div>
            </div>
          </div>
          {calc.totalPackage > salary && (
            <div className="bg-[#A7C957]/15 border border-[#A7C957]/30 rounded-lg px-3 py-1 text-xs font-bold text-[#A7C957]">
              +{fc(calc.totalPackage - salary)} more
            </div>
          )}
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
            {calc.totalPackage > salary && (
              <p className="text-xs text-white/30 text-right mt-1">+{fc(calc.totalPackage - salary)} more than base salary</p>
            )}
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
            <h3 className="text-base font-extrabold text-gray-900 text-center mb-1">What would you like to do next?</h3>
            <p className="text-xs text-gray-400 text-center mb-5">Sign up free and we'll build the right analysis for you.</p>

            <div className="space-y-2.5 mb-5">
              {([
                { key: 'first' as const, emoji: '🎉', title: 'This is my first job offer', desc: 'Build a complete financial plan around this salary — savings, emergency fund, debt payoff, retirement.' },
                { key: 'two-offers' as const, emoji: '⇄', title: 'I have another offer to compare', desc: 'Add Offer B and see side-by-side total comp, take-home, and 40-year wealth impact.' },
                { key: 'current-job' as const, emoji: '📊', title: 'Compare to my current job', desc: 'See exactly how cash flow, wealth building, and net worth change if you make the switch.' },
              ] as const).map(opt => (
                <button key={opt.key} type="button" onClick={() => {
                  setIntent(opt.key);
                  trackIntentSelect(opt.key);
                }}
                  className={`w-full flex items-start gap-3 text-left px-4 py-3.5 rounded-xl border-[1.5px] transition-all cursor-pointer ${
                    intent === opt.key ? 'border-[#386641] bg-green-50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}>
                  <div className={`w-5 h-5 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                    intent === opt.key ? 'border-[#386641] bg-[#386641]' : 'border-gray-300 bg-white'
                  }`}>
                    {intent === opt.key && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{opt.emoji} {opt.title}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            <Button onClick={handleSignUp} disabled={!intent}
              className={`w-full py-4 text-base font-bold rounded-xl transition-all ${
                intent ? 'bg-[#386641] hover:bg-[#2d5a26] text-white' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
              {intent === 'first' ? 'Build my financial plan →'
               : intent === 'two-offers' ? 'Compare to another offer →'
               : intent === 'current-job' ? 'Compare to my current job →'
               : 'Sign up free →'}
            </Button>

            <div className="border-t border-gray-100 pt-4 mt-4">
              <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest font-semibold mb-3">What you get after signing up</p>
              <div className="grid grid-cols-2 gap-1.5">
                {['✓ Offer A vs B comparison', '✓ Monthly spending tracker', '✓ Savings & debt plan', '✓ Retirement projections', '✓ Net worth dashboard', '✓ Ribbit AI advisor'].map(item => (
                  <div key={item} className="text-xs text-gray-500">{item}</div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">Free · No credit card · ~2 minutes</p>
            </div>
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
