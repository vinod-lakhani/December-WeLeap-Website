'use client'

/**
 * Two offers, side by side.
 *
 * Deliberately not a second copy of the form. Offer A's column reads the
 * fourteen fields the tool already holds; Offer B's are gathered here, in one
 * block, against one piece of state.
 *
 * Two states, and which one shows depends on whether there is a second offer
 * yet. Before: the intake panel alone — upload, or the fields. After: the
 * comparison table, with the fields folded away underneath.
 *
 * The first cut showed the table immediately, with Offer B's column rendered as
 * nine dashes and the inputs below it. Everyone who saw it went looking for
 * where the second offer was supposed to go, including the person who asked for
 * the feature. A table of dashes is not an invitation to fill anything in — it
 * looks like a result that failed to load.
 */

import { useState } from 'react'

import { OfferLetterUpload } from '@/components/OfferLetterUpload'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { track } from '@/lib/analytics'
import type { OfferInputs } from '@/lib/offer/calculate'
import type { Comparison, OfferSide } from '@/lib/offer/compare'
import type { ParsedOffer } from '@/lib/offer-parse/fields'
import { cn } from '@/lib/utils'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

const num = (raw: string) => Number(raw.replace(/[^0-9]/g, '')) || 0

/** A figure in a cell — negatives read as costs, not as smaller numbers. */
function Money({ value, muted }: { value: number; muted?: boolean }) {
  if (value === 0) return <span className="text-gray-300">&mdash;</span>
  return (
    <span
      className={cn(
        'font-bold tabular-nums',
        value < 0 ? 'text-red-500' : muted ? 'text-gray-500' : 'text-gray-900',
      )}
    >
      {value < 0 ? `−${fc(value)}` : fc(value)}
    </span>
  )
}

const SELECT =
  'mt-1 h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-base disabled:bg-gray-50 md:text-sm'

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.08em] text-gray-400">{children}</p>
  )
}

function Field({
  id, label, value, onChange, placeholder, suffix,
}: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  placeholder?: string
  suffix?: string
}) {
  return (
    <div>
      <Label htmlFor={id} className="text-[13px] text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          inputMode="numeric"
          className={cn('mt-1 border-[#D1D5DB]', suffix && 'pr-8')}
          value={value ? value.toLocaleString() : ''}
          placeholder={placeholder}
          onChange={(e) => onChange(num(e.target.value))}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 text-[13px] text-gray-400">
            {suffix}
          </span>
        )}
      </div>
    </div>
  )
}

/**
 * Every field that changes what the second offer is worth.
 *
 * All of them, not the headline few. The table has a row for the match, the
 * HSA, the premium, the ESPP and the time off, and a row you cannot edit is
 * worse than no row at all: it shows the first offer's figure in the second
 * offer's column and gives you no way to say otherwise.
 */
function OfferBFields({
  b, bState, bLocation, states, cities, loadingCities, onChangeB, onLocationB,
}: Pick<
  OfferCompareProps,
  'b' | 'bState' | 'bLocation' | 'states' | 'cities' | 'loadingCities' | 'onChangeB' | 'onLocationB'
>) {
  return (
    <div className="space-y-5">
      <div>
        <GroupLabel>The offer</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="cmp-salary" label="Base salary" value={b.salary} placeholder="e.g. 120,000"
            onChange={(n) => onChangeB({ salary: n })} />
          <Field id="cmp-bonus" label="Bonus at target" value={b.bonusPct} suffix="%"
            onChange={(n) => onChangeB({ bonusPct: n })} />
          <Field id="cmp-rsu" label="Equity, per year" value={b.rsuAnnual} placeholder="0"
            onChange={(n) => onChangeB({ rsuAnnual: n })} />
        </div>
      </div>

      <div>
        <GroupLabel>Where it is</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="cmp-state" className="text-[13px] text-gray-700">Work state</Label>
            <select id="cmp-state" value={bState} className={SELECT}
              onChange={(e) => onLocationB('', e.target.value)}>
              <option value="">— select state —</option>
              {states.map((st) => <option key={st.code} value={st.code}>{st.name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="cmp-city" className="text-[13px] text-gray-700">City</Label>
            <select id="cmp-city" value={bLocation} disabled={!bState} className={SELECT}
              onChange={(e) => onLocationB(e.target.value, bState)}>
              <option value="">
                {loadingCities ? 'Loading…' : bState ? '— select city —' : '— select state first —'}
              </option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <Field id="cmp-rent" label="Rent, monthly" value={b.rentMonthly} placeholder="market rate"
            onChange={(n) => onChangeB({ rentMonthly: n })} />
        </div>
      </div>

      <div>
        <GroupLabel>Benefits and time off</GroupLabel>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field id="cmp-match-rate" label="Match rate" value={b.matchRatePct} suffix="%"
            onChange={(n) => onChangeB({ matchRatePct: n })} />
          <Field id="cmp-match-upto" label="Up to (% of salary)" value={b.matchUpToPct} suffix="%"
            onChange={(n) => onChangeB({ matchUpToPct: n })} />
          <Field id="cmp-pto" label="Paid time off (days)" value={b.ptoDays}
            onChange={(n) => onChangeB({ ptoDays: n })} />
          <Field id="cmp-hsa" label="Employer HSA / mo" value={b.hsaMonthly} placeholder="0"
            onChange={(n) => onChangeB({ hsaMonthly: n })} />
          <Field id="cmp-premium" label="Your premium / mo" value={b.healthcarePremium} placeholder="0"
            onChange={(n) => onChangeB({ healthcarePremium: n })} />
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            id="cmp-espp" type="checkbox" checked={b.showEspp}
            onChange={(e) => onChangeB({ showEspp: e.target.checked })}
            className="h-4 w-4 accent-[#386641]"
          />
          <span className="text-[13.5px] font-semibold text-gray-700">This offer has an ESPP</span>
        </label>
        {b.showEspp && (
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field id="cmp-espp-contrib" label="Contribution" value={b.esppContrib} suffix="%"
              onChange={(n) => onChangeB({ esppContrib: n })} />
            <Field id="cmp-espp-discount" label="Discount" value={b.esppDiscount} suffix="%"
              onChange={(n) => onChangeB({ esppDiscount: n })} />
          </div>
        )}
      </div>
    </div>
  )
}

export interface OfferCompareProps {
  a: OfferSide
  b: OfferInputs
  bLocation: string
  comparison: Comparison
  onChangeB: (patch: Partial<OfferInputs>) => void
  onLocationB: (city: string, state: string) => void
  onParsedB: (parsed: ParsedOffer) => void
  onClear: () => void
  /** States the second offer can be taxed in, as the tool already holds them. */
  states: ReadonlyArray<{ code: string; name: string }>
  /** Cities available for the chosen state, once one is picked. */
  cities: readonly string[]
  loadingCities?: boolean
  loadingTax?: boolean
  bState: string
}

export function OfferCompare(props: OfferCompareProps) {
  const { a, b, bLocation, comparison, onParsedB, onClear, loadingTax } = props
  const { packageRows, monthlyRows, totals, leftAfterRent, verdict } = comparison

  const [showEdit, setShowEdit] = useState(false)
  /**
   * The intake panel gives way on a click, not on a keystroke.
   *
   * Switching on `b.salary > 0` alone read as a bug: salary is the first field
   * anyone fills, so the panel vanished out from under them with the HSA, the
   * premium and the time off still blank, and no obvious way back to fields
   * they had been looking at a moment earlier.
   */
  const [confirmed, setConfirmed] = useState(false)
  const hasSecondOffer = b.salary > 0 && confirmed

  const upload = (
    <OfferLetterUpload
      dense
      onParsed={(parsed) => { track('offer_compare_parsed', { tool: 'offer' }); onParsedB(parsed) }}
    />
  )

  // ── Nothing to compare yet ──────────────────────────────────────────────────
  if (!hasSecondOffer) {
    return (
      <div className="rounded-2xl border-2 border-[#386641] bg-white p-5 md:p-6">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">The second offer</h3>
          <button
            type="button"
            onClick={() => { track('offer_compare_cleared', { tool: 'offer' }); onClear() }}
            className="text-[13px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
        <p className="mb-5 text-[14px] leading-relaxed text-gray-600">
          Everything above is the first offer. Put the second one in here and both get priced side by side
          &mdash; including what each leaves after rent, which is where they usually swap places.
        </p>

        <div className="mb-5">{upload}</div>

        <div className="mb-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-gray-200" />
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-gray-400">or type it in</span>
          <span className="h-px flex-1 bg-gray-200" />
        </div>

        <OfferBFields {...props} />

        <p className="mt-5 rounded-lg bg-gray-50 px-4 py-3 text-[12.5px] leading-relaxed text-gray-600">
          <strong className="font-bold text-gray-800">Prefilled from the first offer:</strong> a{' '}
          {b.matchRatePct}% match up to {b.matchUpToPct}% of salary, {b.ptoDays} days off
          {b.hsaMonthly > 0 && <>, {fc(b.hsaMonthly)}/mo employer HSA</>}
          {b.healthcarePremium > 0 && <>, a {fc(b.healthcarePremium)}/mo premium</>}. Change whatever the second
          offer does differently.
        </p>

        <button
          type="button"
          disabled={!b.salary}
          onClick={() => { track('offer_compare_confirmed', { tool: 'offer' }); setConfirmed(true) }}
          className="mt-5 w-full rounded-xl bg-[#386641] py-4 text-base font-bold text-white transition hover:bg-[#2d5a26] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500"
        >
          {b.salary ? 'Compare the two offers →' : 'Add a base salary to compare'}
        </button>
      </div>
    )
  }

  // ── Both offers, priced ─────────────────────────────────────────────────────
  const cell = 'px-3 py-2.5 text-right text-[14.5px]'
  const head = 'px-3 py-2 text-right text-[12.5px] font-bold uppercase tracking-wide text-gray-500'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">Both offers, side by side</h3>
        <button
          type="button"
          onClick={() => { track('offer_compare_cleared', { tool: 'offer' }); onClear() }}
          className="text-[13px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-800"
        >
          Remove the second offer
        </button>
      </div>

      {/* Wide content scrolls inside its own box rather than the page. */}
      <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
        <table className="w-full min-w-[420px] border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[12.5px] font-bold uppercase tracking-wide text-gray-500">
                The package, per year
              </th>
              <th className={head}>
                {a.label}
                <span className="block text-[11.5px] font-medium normal-case tracking-normal text-gray-400">
                  {a.location || 'no city set'}
                </span>
              </th>
              <th className={head}>
                Offer B
                <span className="block text-[11.5px] font-medium normal-case tracking-normal text-gray-400">
                  {bLocation || 'no city set'}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {packageRows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="px-3 py-2.5 text-left text-[14px] text-gray-600">{row.label}</td>
                <td className={cell}><Money value={row.a} muted /></td>
                <td className={cell}><Money value={row.b} /></td>
              </tr>
            ))}
            <tr className="border-b-2 border-gray-300 bg-gray-50">
              <td className="px-3 py-3 text-left text-[14.5px] font-extrabold text-gray-900">Total package</td>
              <td className={cn(cell, 'py-3')}>
                <span className={cn('text-[17px] font-black tabular-nums', totals.winner === 'a' ? 'text-[#386641]' : 'text-gray-500')}>
                  {fc(totals.a)}
                </span>
              </td>
              <td className={cn(cell, 'py-3')}>
                <span className={cn('text-[17px] font-black tabular-nums', totals.winner === 'b' ? 'text-[#386641]' : 'text-gray-500')}>
                  {fc(totals.b)}
                </span>
              </td>
            </tr>

            <tr>
              <td colSpan={3} className="px-3 pb-2 pt-5 text-left text-[12.5px] font-bold uppercase tracking-wide text-gray-500">
                Living on it, per month
              </td>
            </tr>
            {monthlyRows.map((row) => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="px-3 py-2.5 text-left text-[14px] text-gray-600">{row.label}</td>
                <td className={cell}><Money value={row.negative ? -row.a : row.a} muted /></td>
                <td className={cell}><Money value={row.negative ? -row.b : row.b} /></td>
              </tr>
            ))}
            <tr className="bg-gray-50">
              <td className="px-3 py-3 text-left text-[14.5px] font-extrabold text-gray-900">Left after rent</td>
              <td className={cn(cell, 'py-3')}>
                <span className={cn('text-[17px] font-black tabular-nums', leftAfterRent.winner === 'a' ? 'text-[#386641]' : 'text-gray-500')}>
                  {fc(leftAfterRent.a)}
                </span>
              </td>
              <td className={cn(cell, 'py-3')}>
                <span className={cn('text-[17px] font-black tabular-nums', leftAfterRent.winner === 'b' ? 'text-[#386641]' : 'text-gray-500')}>
                  {fc(leftAfterRent.b)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {verdict ? (
        <div
          className={cn(
            'mt-5 rounded-xl px-4 py-4',
            verdict.split ? 'border border-[#A7C957] bg-green-50' : 'border border-gray-200 bg-gray-50',
          )}
        >
          <p className="text-[15px] font-bold leading-snug text-gray-900">{verdict.paper}</p>
          <p className="mt-1 text-[15px] font-bold leading-snug text-gray-900">{verdict.monthly}</p>
          {verdict.split && (
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-gray-600">
              Neither is the right answer. This is the comparison a base salary never shows &mdash; the bigger
              package is not the one that leaves you more to live on.
            </p>
          )}
        </div>
      ) : (
        // Without rent for both this is a salary comparison, which is the one
        // thing the feature exists not to be. Ask for what is missing rather
        // than printing a verdict built on half the evidence.
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13.5px] leading-relaxed text-amber-900">
            <strong className="font-bold">Set a city for both offers</strong> to see what each one leaves after
            rent. That is the number that decides how they feel to live on, and it is the reason the bigger
            package is often not the better offer.
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-gray-200 pt-5">
        <button
          type="button"
          onClick={() => setShowEdit((v) => !v)}
          className="text-[13.5px] font-bold text-[#386641] underline underline-offset-2"
        >
          {showEdit ? 'Hide the second offer’s numbers' : 'Edit the second offer’s numbers'}
        </button>

        {showEdit && (
          <div className="mt-4 space-y-4">
            {upload}
            <OfferBFields {...props} />
          </div>
        )}
      </div>

      {loadingTax && (
        <p className="mt-3 text-[12.5px] text-gray-400">Working out tax for the second offer…</p>
      )}
    </div>
  )
}
