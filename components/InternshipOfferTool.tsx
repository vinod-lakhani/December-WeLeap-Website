'use client'

/**
 * What an internship offer is worth, for the term it covers.
 *
 * Nothing is prefilled with an example. Every campaign hero and worked-example
 * tool on this site has needed its completion gate repaired because a result
 * that exists before anybody types makes "a result and a touch" vacuous. Here
 * the hours and the weeks carry their conventional defaults and the rate does
 * not, so no result exists until the visitor supplies the one number that is
 * theirs — and completion then needs one more of term, state or city.
 *
 * The headline is what is left after housing, not pay. The question an intern
 * is actually asking is "can I afford to live there for the summer", and the
 * answer with the higher hourly rate is often the wrong one once the city is
 * in the picture. The primary CTA sits directly under that figure with nothing
 * between — the ordering every other tool was moved to.
 *
 * Two internships compare side by side from launch, live, with no confirm
 * step: the second offer's inputs on the left and both priced on the right on
 * a wide screen, stacked on a phone. One DOM for both layouts, so every input
 * mounts once. See components/OfferCompare.tsx for why that rule exists.
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { AppCta } from '@/components/AppCta'
import { ExplainRow } from '@/components/ExplainRow'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { track } from '@/lib/analytics'
import {
  computeInternship,
  emptyInternship,
  UPFRONT_RENT_MONTHS,
  RETIREMENT_RETURN,
  RETIREMENT_YEARS,
  type HousingMode,
  type InternshipInputs,
  type InternshipResult,
  type PayShape,
} from '@/lib/internship/calculation'
import { nextRunIndex } from '@/lib/run-index'
import { US_STATES_NAMED } from '@/lib/states'
import { claimToolCompletion, useResultShown } from '@/lib/tool-funnel'
import { cn } from '@/lib/utils'

const TOOL = 'internship'
const PAGE = '/what-is-my-internship-offer-worth'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(
    Math.round(n),
  )
const num = (raw: string) => Number(raw.replace(/[^0-9.]/g, '')) || 0

type MetroOption = { label: string; value: string }

/* ── Inputs ─────────────────────────────────────────────────────────────── */

const SELECT =
  'mt-1 h-11 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-base disabled:bg-gray-50 md:text-sm'

function GroupLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-400">{children}</p>
}

function NumField({
  id, label, value, onChange, placeholder, prefix, suffix, decimals,
}: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  placeholder?: string
  prefix?: string
  suffix?: string
  /** Allow a decimal point — an hourly rate is often $27.50. */
  decimals?: boolean
}) {
  // Decimal fields keep the raw string so "27." survives the keystroke.
  const [raw, setRaw] = useState(value ? String(value) : '')
  useEffect(() => {
    if (num(raw) !== value) setRaw(value ? String(value) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <div>
      <Label htmlFor={id} className="text-[13px] text-gray-700">{label}</Label>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-gray-500">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          inputMode={decimals ? 'decimal' : 'numeric'}
          className={cn('mt-1 border-[#D1D5DB]', prefix && 'pl-7', suffix && 'pr-10')}
          value={decimals ? raw : value ? value.toLocaleString('en-US') : ''}
          placeholder={placeholder}
          onChange={(e) => {
            const next = decimals
              ? e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')
              : e.target.value
            if (decimals) setRaw(next)
            onChange(num(next))
          }}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

function Choice<T extends string>({
  name, value, options, onChange,
}: {
  name: string
  value: T
  options: ReadonlyArray<{ value: T; label: string }>
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'min-h-11 rounded-full border px-4 text-[13.5px] font-semibold transition',
            value === o.value
              ? 'border-[#386641] bg-[#386641] text-white'
              : 'border-[#D1D5DB] bg-white text-gray-700 hover:border-[#386641]',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const PAY_SHAPES: ReadonlyArray<{ value: PayShape; label: string }> = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'monthly', label: 'Monthly stipend' },
  { value: 'lump', label: 'One payment for the term' },
]

const HOUSING: ReadonlyArray<{ value: HousingMode; label: string }> = [
  { value: 'self', label: 'I pay rent' },
  { value: 'stipend', label: 'They pay a housing stipend' },
  { value: 'provided', label: 'They provide housing' },
]

interface FieldsProps {
  idPrefix: string
  value: InternshipInputs
  city: string
  metros: MetroOption[]
  loadingMetros: boolean
  onChange: (patch: Partial<InternshipInputs>, field: string) => void
  onCity: (city: string) => void
}

/**
 * Every field that changes the answer, for one internship. Used twice — the
 * offer and the one it is compared against — with different ids.
 */
function InternshipFields({ idPrefix: p, value: v, city, metros, loadingMetros, onChange, onCity }: FieldsProps) {
  return (
    <div className="space-y-5">
      <div>
        <GroupLabel>How it pays</GroupLabel>
        <Choice name="Pay shape" value={v.payShape} options={PAY_SHAPES} onChange={(s) => onChange({ payShape: s }, 'pay_shape')} />
        <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
          {v.payShape === 'hourly' && (
            <>
              <NumField id={`${p}-rate`} label="Hourly rate" value={v.hourlyRate} prefix="$" placeholder="e.g. 25" decimals
                onChange={(n) => onChange({ hourlyRate: n }, 'pay')} />
              <NumField id={`${p}-hours`} label="Hours a week" value={v.hoursPerWeek} suffix="hrs"
                onChange={(n) => onChange({ hoursPerWeek: n }, 'hours')} />
              <NumField id={`${p}-overtime`} label="Overtime hours a week" value={v.overtimeHoursPerWeek} suffix="at 1.5×" placeholder="0"
                onChange={(n) => onChange({ overtimeHoursPerWeek: n }, 'overtime')} />
            </>
          )}
          {v.payShape === 'monthly' && (
            <NumField id={`${p}-stipend`} label="Stipend a month" value={v.monthlyStipend} prefix="$" placeholder="e.g. 4,000"
              onChange={(n) => onChange({ monthlyStipend: n }, 'pay')} />
          )}
          {v.payShape === 'lump' && (
            <NumField id={`${p}-lump`} label="Total for the term" value={v.lumpSum} prefix="$" placeholder="e.g. 15,000"
              onChange={(n) => onChange({ lumpSum: n }, 'pay')} />
          )}
          <NumField id={`${p}-weeks`} label="Weeks (co-ops are often 16)" value={v.weeks} suffix="wks"
            onChange={(n) => onChange({ weeks: n }, 'weeks')} />
        </div>
      </div>

      <div>
        <GroupLabel>Where it is</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${p}-state`} className="text-[13px] text-gray-700">Work state</Label>
            <select id={`${p}-state`} value={v.state} className={SELECT}
              onChange={(e) => { onChange({ state: e.target.value }, 'state'); onCity('') }}>
              <option value="">— select state —</option>
              {US_STATES_NAMED.map((st) => <option key={st.code} value={st.code}>{st.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor={`${p}-city`} className="text-[13px] text-gray-700">City</Label>
            <select id={`${p}-city`} value={city} disabled={!v.state} className={SELECT}
              onChange={(e) => onCity(e.target.value)}>
              <option value="">
                {loadingMetros ? 'Loading…' : v.state ? '— select city —' : '— select state first —'}
              </option>
              {metros.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <GroupLabel>Housing</GroupLabel>
        <Choice name="Housing" value={v.housing} options={HOUSING} onChange={(h) => onChange({ housing: h }, 'housing')} />
        {v.housing !== 'provided' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {v.housing === 'stipend' && (
              <NumField id={`${p}-housing-stipend`} label="Housing stipend a month (taxed as wages)" value={v.housingStipendMonthly} prefix="$" placeholder="e.g. 1,500"
                onChange={(n) => onChange({ housingStipendMonthly: n }, 'housing_stipend')} />
            )}
            <NumField id={`${p}-rent`} label="Rent a month" value={v.rentMonthly} prefix="$" placeholder={city ? 'market rate' : 'e.g. 1,500'}
              onChange={(n) => onChange({ rentMonthly: n }, 'rent')} />
          </div>
        )}
        {v.housing !== 'provided' && city && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
            Prefilled with the market rate for a year lease in {city}. Summer sublets and furnished short-term
            places vary either way — put in what you actually know.
          </p>
        )}
        {v.housing === 'stipend' && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
            A cash stipend is wages and is taxed here like the rest of your pay. Paid as one lump sum rather than
            monthly? Put it in the one-off allowance below instead.
          </p>
        )}
      </div>

      <RetirementFields p={p} v={v} onChange={onChange} />

      <div>
        <GroupLabel>Anything else</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumField id={`${p}-relocation`} label="One-off allowance: relocation, travel or a housing lump sum" value={v.relocation} prefix="$" placeholder="0"
            onChange={(n) => onChange({ relocation: n }, 'relocation')} />
        </div>
        {v.relocation > 0 && (
          <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
            Taxed as wages — a relocation or housing lump sum has been taxable since 2018. Withheld at the flat 22%
            federal rate for a one-off payment.
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * The 401(k), collapsed until asked for.
 *
 * Most internships have no plan, so this opens on a question rather than three
 * empty fields. Some do — the Purdue tester's did, and it was the part of her
 * feedback with the most to teach: a match is free money only if you put in
 * enough to get all of it, and the first summer is the cheapest time to start.
 *
 * The contribution follows the match cap until somebody types their own,
 * because the cap is the answer to "how much should I put in" for nearly
 * everyone: less leaves free money behind, more is your own money with no
 * extra match. Once they type a contribution it is theirs and stops following.
 */
function RetirementFields({
  p, v, onChange,
}: {
  p: string
  v: InternshipInputs
  onChange: (patch: Partial<InternshipInputs>, field: string) => void
}) {
  const [open, setOpen] = useState(v.matchUpToPct > 0 || v.contributionPct > 0)
  const ownContribution = useRef(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); track('internship_401k_opened', { tool: 'internship' }) }}
        className="block min-h-11 w-full rounded-xl border border-dashed border-gray-300 px-4 py-3 text-left transition hover:border-[#386641]"
      >
        <span className="block text-[14px] font-bold text-gray-900">Does it offer a 401(k) match?</span>
        <span className="mt-0.5 block text-[12.5px] text-gray-500">Some internships do. Add it to see what it&apos;s worth.</span>
      </button>
    )
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <GroupLabel>401(k)</GroupLabel>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            ownContribution.current = false
            onChange({ matchRatePct: 0, matchUpToPct: 0, contributionPct: 0 }, 'match')
          }}
          className="-my-2 inline-flex min-h-11 items-center text-[12.5px] font-semibold text-gray-500 underline underline-offset-2"
        >
          Remove
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
        <NumField id={`${p}-match-rate`} label="Match rate" value={v.matchRatePct} suffix="%" placeholder="e.g. 100"
          onChange={(n) => onChange({ matchRatePct: n }, 'match')} />
        <NumField id={`${p}-match-cap`} label="Up to (% of pay)" value={v.matchUpToPct} suffix="%" placeholder="e.g. 5" decimals
          onChange={(n) => onChange(ownContribution.current ? { matchUpToPct: n } : { matchUpToPct: n, contributionPct: n }, 'match')} />
        <NumField id={`${p}-contribution`} label="You put in (% of pay)" value={v.contributionPct} suffix="%" decimals
          onChange={(n) => { ownContribution.current = true; onChange({ contributionPct: n }, 'contribution') }} />
      </div>
      {v.matchUpToPct > 0 && (
        <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500">
          {ownContribution.current
            ? <>The match stops at {v.matchUpToPct}% of pay. Less than that leaves free money behind; more is your own money, saved with the same tax break and no extra match.</>
            : <>Set to the match cap, {v.matchUpToPct}% — the least that captures the whole match. Change it if you want to put in more.</>}
        </p>
      )}
    </div>
  )
}

/* ── Metro options and market rent, per side ───────────────────────────── */

function useMetros(state: string) {
  const [metros, setMetros] = useState<MetroOption[]>([])
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!state) { setMetros([]); return }
    let cancelled = false
    setLoading(true)
    fetch(`/api/zori?state=${state}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => { if (!cancelled) setMetros(Array.isArray(data.options) ? data.options : []) })
      .catch(() => { if (!cancelled) setMetros([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [state])
  return { metros, loading }
}

/**
 * Market rent for the city, into the rent field only while it is still empty.
 * A typed figure is the real one and is never overwritten.
 */
function useMarketRent(state: string, city: string, onRent: (rent: number) => void) {
  useEffect(() => {
    if (!state || !city || city === '__OTHER__') return
    let cancelled = false
    fetch(`/api/zori?state=${state}&region=${encodeURIComponent(city)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => { if (!cancelled && data.medianRent) onRent(Math.round(data.medianRent)) })
      .catch(() => { /* the field stays empty and asks for itself */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, city])
}

/* ── The tool ───────────────────────────────────────────────────────────── */

export function InternshipOfferTool() {
  const [a, setA] = useState<InternshipInputs>(emptyInternship)
  const [cityA, setCityA] = useState('')
  const [b, setB] = useState<InternshipInputs | null>(null)
  const [cityB, setCityB] = useState('')

  const metrosA = useMetros(a.state)
  const metrosB = useMetros(b?.state ?? '')

  useMarketRent(a.state, cityA, (rent) =>
    setA((prev) => (prev.rentMonthly === 0 ? { ...prev, rentMonthly: rent } : prev)),
  )
  useMarketRent(b?.state ?? '', cityB, (rent) =>
    setB((prev) => (prev && prev.rentMonthly === 0 ? { ...prev, rentMonthly: rent } : prev)),
  )

  /**
   * Which fields the visitor CHANGED on the first offer. Not focus — the rent
   * tool's gate counted focus and completed on a tab through the form.
   */
  const [changed, setChanged] = useState<ReadonlySet<string>>(() => new Set())
  const [engagementCount, setEngagementCount] = useState(0)
  const engaged = useRef(false)

  const patchA = useCallback((patch: Partial<InternshipInputs>, field: string) => {
    setA((prev) => ({ ...prev, ...patch }))
    setChanged((prev) => (prev.has(field) ? prev : new Set(prev).add(field)))
    setEngagementCount((n) => n + 1)
    if (engaged.current) return
    engaged.current = true
    track('tool_engaged', { tool: TOOL, first_field: field })
    track('tool_form_start', { tool: TOOL, page: PAGE })
  }, [])

  const onCityA = useCallback((city: string) => {
    setCityA(city)
    if (city) setChanged((prev) => (prev.has('city') ? prev : new Set(prev).add('city')))
  }, [])

  const result = useMemo(() => computeInternship(a), [a])
  const resultB = useMemo(() => (b ? computeInternship(b) : null), [b])

  useResultShown('internship', !!result)

  /**
   * Completion: a result, and enough of it is the visitor's.
   *
   * Pay is the primary — it is the offer. One more of term (changed from the
   * default), state or city makes the answer about their summer rather than a
   * rate in a vacuum. Same rule, same session scope, as every other tool.
   */
  const enoughInput =
    changed.has('pay') && (changed.has('weeks') || changed.has('state') || changed.has('city'))
  const completed = useRef(false)
  useEffect(() => {
    if (!result || engagementCount === 0 || !enoughInput || completed.current) return
    if (!claimToolCompletion('internship')) { completed.current = true; return }
    completed.current = true
    track('tool_completed', {
      tool: 'internship',
      run_index: nextRunIndex(TOOL),
      trigger: 'field_change',
      fields_changed: engagementCount,
      inputs_supplied: [...changed].sort(),
      pay_shape: a.payShape,
      housing: a.housing,
      weeks: a.weeks,
      state_set: !!a.state,
      city_set: !!cityA,
      has_401k: a.matchUpToPct > 0 || a.contributionPct > 0,
      left_after_housing: Math.round(result.leftAfterHousing),
    })
  }, [result, engagementCount, enoughInput, changed, a.payShape, a.housing, a.weeks, a.state, a.matchUpToPct, a.contributionPct, cityA])

  const startCompare = () => {
    // Seeded with the same term and the same housing answer, because those are
    // the parts most likely to be equal. Pay and place start empty — they are
    // the reason there are two.
    setB({ ...emptyInternship(), weeks: a.weeks, hoursPerWeek: a.hoursPerWeek, housing: a.housing })
    setCityB('')
    track('internship_compare_started', { tool: TOOL })
  }
  const clearCompare = () => {
    setB(null)
    setCityB('')
    track('internship_compare_cleared', { tool: TOOL })
  }

  return (
    <div className="mx-auto w-full max-w-[600px]">
      {/* ── The offer ──────────────────────────────────────────────────── */}
      <section className="rounded-2xl border-2 border-[#386641] bg-white p-5 md:p-6">
        <InternshipFields
          idPrefix="intern"
          value={a}
          city={cityA}
          metros={metrosA.metros}
          loadingMetros={metrosA.loading}
          onChange={patchA}
          onCity={onCityA}
        />
      </section>

      {/* ── The answer ─────────────────────────────────────────────────── */}
      {result ? (
        <>
          <Headline r={result} housing={a.housing} className="mt-4" />

          {/* Directly under the result, nothing between. */}
          <div className="mt-4">
            <AppCta
              tool="internship"
              eyebrow="This summer, then the one after"
              headline="Want this money to go somewhere first?"
              body={`${fc(result.leftAfterHousing)} is what the term leaves. Left alone it goes into the summer; the app decides where it goes before that happens, and keeps the numbers when the full-time offer arrives.`}
              buttonLabel={result.leftAfterHousing > 0 ? `Show me where my ${fc(result.leftAfterHousing)} should go →` : 'Create my free account →'}
              bullets={[
                ...(result.employerMatch > 0 || result.matchLeftBehind > 0
                  ? ['Your match, tracked until every paycheck captures all of it']
                  : []),
                'Your pay and your rent, tracked across the term',
                'A savings plan sized to a term, not a year',
                'The same numbers, repriced when the full-time offer lands',
              ]}
              prefill={{ state: a.state }}
            />
          </div>

          <Breakdown r={result} inputs={a} className="mt-4" />

          {/* ── The second internship ─────────────────────────────────── */}
          <div className={cn('mt-4', b && 'lg:-mx-[84px] lg:w-[768px]')}>
            {/*
              Two columns need more than the 600px the tool gets. The page
              container is max-w-3xl (768px); (768 − 600) / 2 = 84px into each
              margin. If the page container changes, this changes with it.
            */}
            {b ? (
              <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
                <section className="rounded-2xl border-2 border-[#386641] bg-white p-5 md:p-6">
                  <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">The second internship</h3>
                    <button type="button" onClick={clearCompare}
                      className="-my-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-800">
                      Remove
                    </button>
                  </div>
                  <p className="mb-5 text-[14px] leading-relaxed text-gray-600">
                    Same term and housing answer as above to start with. Change whatever this one does differently.
                  </p>
                  <InternshipFields
                    idPrefix="intern-b"
                    value={b}
                    city={cityB}
                    metros={metrosB.metros}
                    loadingMetros={metrosB.loading}
                    onChange={(patch) => setB((prev) => (prev ? { ...prev, ...patch } : prev))}
                    onCity={setCityB}
                  />
                </section>
                <Comparison
                  a={result}
                  b={resultB}
                  cityA={cityA}
                  cityB={cityB}
                  rentMissingA={a.housing !== 'provided' && a.rentMonthly === 0}
                  rentMissingB={!!b && b.housing !== 'provided' && b.rentMonthly === 0}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={startCompare}
                className="w-full rounded-2xl border-2 border-dashed border-gray-300 bg-white px-5 py-5 text-center transition hover:border-[#386641] hover:bg-gray-50"
              >
                <span className="block text-[15px] font-bold text-gray-900">Weighing this against another internship?</span>
                <span className="mt-1 block text-[13.5px] leading-relaxed text-gray-500">
                  Add the second one and both get priced side by side — including what each leaves after housing,
                  which is where the higher hourly rate often comes out behind.
                </span>
              </button>
            )}
          </div>
        </>
      ) : (
        <p className="mt-4 text-center text-[14px] text-gray-500">
          Put in the pay and the answer appears here — what the term leaves after housing.
        </p>
      )}
    </div>
  )
}

/* ── Result blocks ──────────────────────────────────────────────────────── */

function Headline({ r, housing, className }: { r: InternshipResult; housing: HousingMode; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-[#F3F7F3] p-5 md:p-6', className)}>
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3F6B42]">What the term leaves</p>
      <p className={cn('mt-1 text-[38px] font-black leading-none tabular-nums', r.leftAfterHousing < 0 ? 'text-red-600' : 'text-[#111827]')}>
        {r.leftAfterHousing < 0 ? `−${fc(-r.leftAfterHousing)}` : fc(r.leftAfterHousing)}
      </p>
      <p className="mt-2 text-[14px] leading-relaxed text-gray-600">
        {fc(r.takeHome)} lands across {r.months.toFixed(1)} months
        {r.housingCost > 0
          ? <>, and housing takes {fc(r.housingCost)} of it</>
          : housing === 'provided'
            ? <>, with housing covered</>
            : <>, before rent &mdash; pick a city or put in a monthly figure</>}.
        {r.deferral + r.employerMatch > 0 && <> Plus {fc(r.deferral + r.employerMatch)} into your 401(k).</>}
        {r.refund > 0 && <> About {fc(r.refund)} more comes back when you file.</>}
      </p>
    </section>
  )
}

function Row({
  id, label, value, muted, note, explain,
}: {
  id: string
  label: string
  value: string
  muted?: boolean
  note?: string
  explain: React.ReactNode
}) {
  return (
    <ExplainRow
      tool="internship"
      row={id}
      className="border-b border-gray-100 py-2.5"
      labelClassName={cn('text-[14px]', muted ? 'text-gray-500' : 'text-gray-700')}
      label={label}
      note={note && <p className="text-[12px] leading-snug text-gray-400">{note}</p>}
      value={<p className={cn('text-[14.5px] font-bold tabular-nums', muted ? 'text-gray-500' : 'text-gray-900')}>{value}</p>}
      explain={explain}
    />
  )
}

function Breakdown({ r, inputs, className }: { r: InternshipResult; inputs: InternshipInputs; className?: string }) {
  return (
    <section className={cn('rounded-2xl border border-gray-200 bg-white p-5 md:p-6', className)}>
      <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">Where it goes</h3>
      <div className="mt-2">
        <Row id="pay" label="Pay for the term" value={fc(r.wages)}
          explain={inputs.payShape === 'hourly'
            ? <>Your rate × hours a week × {inputs.weeks} weeks, with any overtime at 1.5×. This is the figure in the offer, before anything comes out.</>
            : inputs.payShape === 'monthly'
              ? <>The monthly stipend × the months the term covers: {inputs.weeks} weeks × 12 ÷ 52 = {r.months.toFixed(1)} months.</>
              : <>The single payment for the term, as the offer states it.</>} />
        {r.housingStipend > 0 && (
          <Row id="housing_stipend" label="Housing stipend, for the term" value={fc(r.housingStipend)} note="Taxed as wages."
            explain={<>The monthly stipend × {r.months.toFixed(1)} months. Paid to you in cash, so it is income: taxed and withheld exactly like your pay, which surprises most people the first time.</>} />
        )}
        {r.relocation > 0 && (
          <Row id="one_off" label="One-off allowance" value={fc(r.relocation)} note="Taxed as wages."
            explain={<>Relocation, travel or a housing lump sum, paid once. Taxable income since 2018. Payroll withholds federal tax on a one-off payment at a flat 22% rather than as though you earned it every week.</>} />
        )}
        <Row id="withheld" label="Withheld by payroll" value={`−${fc(r.withheld.total)}`} muted
          note={`Federal ${fc(r.withheld.federal)} · state ${fc(r.withheld.state)} · Social Security and Medicare ${fc(r.withheld.fica)}`}
          explain={<>Payroll assumes each paycheck&apos;s rate continues all year, so this pay is withheld as if you earned {fc(r.annualised)} a year — federal and state tax on that, charged for the weeks you work. Social Security and Medicare are 7.65% of every dollar. Most of the federal and state part comes back when you file; see the green box below.</>} />
        {r.deferral > 0 && (
          <Row id="401k" label="Into your 401(k)" value={`−${fc(r.deferral)}`} muted note="Saved, not spent."
            explain={<>{inputs.contributionPct}% of your pay, moved into the plan before it reaches you. It is taken before income tax, so each dollar costs you less than a dollar of take-home — but Social Security and Medicare still apply to it. The money is yours; it is just not in your checking account.</>} />
        )}
        <Row id="take_home" label="Lands in your account" value={fc(r.takeHome)} note={`${fc(r.takeHomeMonthly)} a month`}
          explain={<>Everything above minus what payroll withheld: the cash that actually reaches your account during the term. The tax refund arrives later, when you file, so it is not counted here.</>} />
        <Row
          id="rent"
          label="Rent for the term"
          value={r.housingCost > 0 ? `−${fc(r.housingCost)}` : inputs.housing === 'provided' ? 'covered' : '—'}
          muted
          note={r.housingCost > 0 || inputs.housing === 'provided' ? undefined : 'Pick a city or put in a monthly rent.'}
          explain={<>Monthly rent × the months the term covers ({inputs.weeks} weeks × 12 ÷ 52 = {r.months.toFixed(1)}). When you pick a city it is prefilled with the market rate for a year lease there; a summer sublet or furnished place can cost more or less, so put in what you actually know.</>}
        />
        <Row id="left" label="Left after housing" value={fc(r.leftAfterHousing)}
          explain={<>What lands in your account minus rent for the term. This is the number that decides whether the summer works — and the one on which two offers most often swap places, because a higher rate in a pricier city can leave less.</>} />
      </div>

      {/* The refund, as a number. Payroll withholds as if the rate continued
          all year; what is owed on a term's income alone is far less. */}
      <div className="mt-4 rounded-xl border border-[#A7C957] bg-green-50 px-4 py-3">
        <p className="text-[13.5px] leading-relaxed text-gray-800">
          <strong className="font-bold">Payroll will hold back about {fc(r.withheld.total)}.</strong>{' '}
          {r.refund > 0 ? (
            <>
              Roughly {fc(r.refund)} of that comes back when you file, because withholding assumes this rate
              continues all year and {fc(r.gross)} on its own is taxed far less. The {fc(r.withheld.fica)} of
              Social Security and Medicare doesn&apos;t.
            </>
          ) : (
            <>None of it comes back: at this level the tax owed matches what was withheld.</>
          )}{' '}
          <span className="text-gray-500">Assumes no other income this year.</span>
        </p>
      </div>

      {(r.deferral > 0 || r.matchLeftBehind > 0) && <RetirementCard r={r} inputs={inputs} />}

      {r.upfrontCash > 0 && (
        <p className="mt-4 text-[13.5px] leading-relaxed text-gray-600">
          <strong className="font-bold text-gray-800">Cash you need before the first paycheck: about {fc(r.upfrontCash)}.</strong>{' '}
          A deposit and the first month&apos;s rent are usually due before any pay lands, and the first paycheck
          tends to arrive two to three weeks in — so this is what you need saved, or covered, to move there without
          going into debt. Rule of thumb: deposit ≈ {UPFRONT_RENT_MONTHS - 1} month&apos;s rent.
        </p>
      )}

      {!r.stateNamed && (
        <p className="mt-3 text-[12.5px] text-gray-500">
          {inputs.state ? 'State tax is a national blend for this state.' : 'Pick a work state and the tax uses that state rather than a national blend.'}
        </p>
      )}

      <p className="mt-4 border-t border-gray-100 pt-3 text-[12.5px] leading-relaxed text-gray-400">
        Annualised, this rate would be {fc(r.annualised)} a year. A comparison aid for holding it against a
        full-time offer — and the number that makes $45/hr sound like $93,000. Not what you will earn.
      </p>
    </section>
  )
}

/**
 * What one summer in the plan is worth, stated once and plainly.
 *
 * From the tester: "If you invest X% now, 20 years from now it'll be X." The
 * line uses forty years — a twenty-year-old at sixty — and the same 7% every
 * other WeLeap page compounds at, so it is a planning figure and labelled one.
 *
 * Two caveats are not optional. Plans often make new hires wait before they can
 * join, and many vest the match over years: an intern who leaves in August can
 * forfeit all of it. A tool that shows a match as money in hand without saying
 * so is overstating the offer, which is exactly what this page exists not to do.
 */
function RetirementCard({ r, inputs }: { r: InternshipResult; inputs: InternshipInputs }) {
  const into = r.deferral + r.employerMatch
  return (
    <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-3.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">Your 401(k) this term</p>
      {into > 0 ? (
        <>
          <p className="mt-1 text-[14px] leading-relaxed text-gray-800">
            <strong className="font-bold">{fc(into)} goes in</strong> — {fc(r.deferral)} from you
            {r.employerMatch > 0 && <>, {fc(r.employerMatch)} from your employer</>}.
          </p>
          <p className="mt-1.5 text-[14px] leading-relaxed text-gray-800">
            Left invested, one summer of that is about <strong className="font-bold">{fc(r.retirementLater)}</strong> in{' '}
            {RETIREMENT_YEARS} years.
          </p>
          <p className="mt-0.5 text-[12px] text-gray-400">
            At {Math.round(RETIREMENT_RETURN * 100)}% a year, before fees. A planning figure, not a promise.
          </p>
        </>
      ) : null}
      {r.matchLeftBehind > 0 && (
        <p className="mt-2.5 rounded-lg bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-900">
          <strong className="font-bold">{fc(r.matchLeftBehind)} of match is left behind.</strong> Put in{' '}
          {inputs.matchUpToPct}% of pay to get all of it — the match is only paid on what you contribute, and it
          never backfills.
        </p>
      )}
      {r.leftAfterHousing < 0 && r.deferral > 0 && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-gray-600">
          At this contribution the term doesn&apos;t cover rent. The match is still worth taking if you can — but
          not on a credit card.
        </p>
      )}
      <p className="mt-2.5 border-t border-gray-100 pt-2.5 text-[12px] leading-relaxed text-gray-500">
        Check two things in the plan documents. <strong className="font-semibold text-gray-700">Eligibility:</strong>{' '}
        some plans make new hires wait before they can join. <strong className="font-semibold text-gray-700">Vesting:</strong>{' '}
        if the match vests over years, leaving after the summer can mean forfeiting it. What you put in is always yours.
      </p>
    </div>
  )
}

function Comparison({
  a, b, cityA, cityB, rentMissingA, rentMissingB,
}: {
  a: InternshipResult
  b: InternshipResult | null
  cityA: string
  cityB: string
  rentMissingA: boolean
  rentMissingB: boolean
}) {
  const cell = 'px-2 py-2.5 text-right text-[14px] tabular-nums'
  const head = 'px-2 py-2 text-right text-[12px] font-bold uppercase tracking-wide text-gray-500'
  /**
   * The same rows, in the same order, as "Where it goes" above — so a reader
   * can run a finger down one and find the matching line in the other. The
   * two lines that sit below the total there (the refund, the up-front cash)
   * sit below it here too, muted, rather than being folded into the sum.
   */
  type Line = { label: string; a: number; b: number; negative?: boolean; total?: boolean; aside?: boolean }
  const rows: Line[] = b
    ? [
        { label: 'Pay for the term', a: a.wages, b: b.wages },
        ...(a.housingStipend > 0 || b.housingStipend > 0
          ? [{ label: 'Housing stipend, for the term', a: a.housingStipend, b: b.housingStipend }]
          : []),
        ...(a.relocation > 0 || b.relocation > 0
          ? [{ label: 'One-off allowance', a: a.relocation, b: b.relocation }]
          : []),
        { label: 'Withheld by payroll', a: a.withheld.total, b: b.withheld.total, negative: true },
        ...(a.deferral > 0 || b.deferral > 0
          ? [{ label: 'Into your 401(k)', a: a.deferral, b: b.deferral, negative: true }]
          : []),
        { label: 'Lands in your account', a: a.takeHome, b: b.takeHome },
        { label: 'Rent for the term', a: a.housingCost, b: b.housingCost, negative: true },
        { label: 'Left after housing', a: a.leftAfterHousing, b: b.leftAfterHousing, total: true },
        ...(a.employerMatch > 0 || b.employerMatch > 0
          ? [{ label: 'Employer match, into your 401(k)', a: a.employerMatch, b: b.employerMatch, aside: true }]
          : []),
        { label: 'Tax refund when you file (est.)', a: a.refund, b: b.refund, aside: true },
        { label: 'Cash needed before the first paycheck', a: a.upfrontCash, b: b.upfrontCash, aside: true },
      ]
    : []
  const winner = b ? (a.leftAfterHousing === b.leftAfterHousing ? null : a.leftAfterHousing > b.leftAfterHousing ? 'a' : 'b') : null

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">Both internships, side by side</h3>
      {!b ? (
        <p className="mt-3 rounded-lg bg-gray-50 px-4 py-4 text-[14px] leading-relaxed text-gray-600">
          Add the second internship&apos;s pay and both get priced here as you type.
        </p>
      ) : (
        <div className="-mx-5 mt-3 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[300px] border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-2 py-2 text-left text-[12px] font-bold uppercase tracking-wide text-gray-500">For the term</th>
                <th className={head}>
                  First
                  <span className="block text-[11.5px] font-medium normal-case tracking-normal text-gray-400">{cityA || 'no city set'}</span>
                </th>
                <th className={head}>
                  Second
                  <span className="block text-[11.5px] font-medium normal-case tracking-normal text-gray-400">{cityB || 'no city set'}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const show = (n: number) => (n === 0 ? '—' : `${row.negative ? '−' : ''}${fc(n)}`)
                if (row.total) {
                  return (
                    <tr key={row.label} className="border-b-2 border-gray-300 bg-gray-50">
                      <td className="px-2 py-3 text-left text-[14px] font-extrabold text-gray-900">{row.label}</td>
                      <td className={cn(cell, 'py-3 text-[17px] font-black', winner === 'a' ? 'text-[#386641]' : 'text-gray-500')}>{fc(row.a)}</td>
                      <td className={cn(cell, 'py-3 text-[17px] font-black', winner === 'b' ? 'text-[#386641]' : 'text-gray-500')}>{fc(row.b)}</td>
                    </tr>
                  )
                }
                /**
                 * The two rows after the total were greyed out, and the first
                 * tester asked what "filing" meant, what "Needed up front" was
                 * and why both were grey — three misses on two lines. They are
                 * real numbers to plan around, not faded ones, so they get
                 * their names spelled out and a divider that says why they sit
                 * outside the total.
                 */
                const firstAside = row.aside && !rows[rows.indexOf(row) - 1]?.aside
                return (
                  <Fragment key={row.label}>
                    {firstAside && (
                      <tr>
                        <td colSpan={3} className="px-2 pb-1.5 pt-4 text-left text-[11.5px] font-bold uppercase tracking-wide text-gray-500">
                          Not in the total — plan for these
                        </td>
                      </tr>
                    )}
                    <tr className="border-b border-gray-100">
                      <td className="px-2 py-2.5 text-left text-[13.5px] text-gray-600">{row.label}</td>
                      <td className={cn(cell, 'text-gray-500')}>{show(row.a)}</td>
                      <td className={cn(cell, 'text-gray-900')}>{show(row.b)}</td>
                    </tr>
                  </Fragment>
                )
              })}
            </tbody>
          </table>
          {(rentMissingA || rentMissingB) && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-[13.5px] leading-relaxed text-amber-900">
                <strong className="font-bold">
                  {rentMissingA && rentMissingB ? 'Neither has a rent figure yet' : rentMissingA ? 'The first has no rent figure yet' : 'The second has no rent figure yet'}
                </strong>
                {' '}— pick a city or put in a monthly rent for both, or this is a pay comparison dressed as a housing one.
              </p>
            </div>
          )}
          {winner && !rentMissingA && !rentMissingB && (
            <p className="mt-4 text-[14px] font-bold leading-snug text-gray-900">
              The {winner === 'a' ? 'first' : 'second'} one leaves {fc(Math.abs(a.leftAfterHousing - b.leftAfterHousing))} more for the term
              {(winner === 'a' ? a.wages < b.wages : b.wages < a.wages) && <> — on lower pay</>}.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
