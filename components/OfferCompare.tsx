'use client'

/**
 * Two offers, side by side.
 *
 * Deliberately not a second copy of the form. Offer A's column reads the
 * fourteen fields the tool already holds; Offer B's column is the input — every
 * cell in it is editable, and an uploaded second letter fills them in. A form
 * this long rendered twice would be two thousand lines of markup to compare six
 * numbers.
 *
 * The table is the feature. The verdict underneath it is the point: the bigger
 * package is frequently not the one that leaves you more each month, and no
 * base-salary comparison shows that.
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

export function OfferCompare({
  a, b, bLocation, comparison, onChangeB, onLocationB, onParsedB, onClear,
  states, cities, loadingCities, loadingTax, bState,
}: OfferCompareProps) {
  // Open until the second offer has a salary: the fields below are the only
  // place to enter one, and a collapsed panel would hide the single thing the
  // visitor just asked to do.
  const [showEdit, setShowEdit] = useState(!b.salary)
  const { packageRows, monthlyRows, totals, leftAfterRent, verdict } = comparison

  const cell = 'px-3 py-2.5 text-right text-[14.5px]'
  const head = 'px-3 py-2 text-right text-[12.5px] font-bold uppercase tracking-wide text-gray-500'

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 md:p-6">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-extrabold tracking-[-0.015em] text-gray-900">
          Both offers, side by side
        </h3>
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
                {'Offer B'}
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
              <td className="px-3 py-3 text-left text-[14.5px] font-extrabold text-gray-900">
                Total package
              </td>
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
              <td className="px-3 py-3 text-left text-[14.5px] font-extrabold text-gray-900">
                Left after rent
              </td>
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
        // thing the feature exists not to be. Ask for whatever is missing,
        // rather than printing a verdict built on half the evidence.
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-[13.5px] leading-relaxed text-amber-900">
            {!b.salary ? (
              <>
                <strong className="font-bold">Add the second offer&apos;s salary</strong> below, with its city.
                Everything else starts from the first offer, so you only need to change what differs.
              </>
            ) : (
              <>
                <strong className="font-bold">Set a city for both offers</strong> to see what each one leaves
                after rent. That is the number that decides how they feel to live on, and it is the reason the
                bigger package is often not the better offer.
              </>
            )}
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
            <OfferLetterUpload
              dense
              onParsed={(parsed) => { track('offer_compare_parsed', { tool: 'offer' }); onParsedB(parsed) }}
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="cmp-salary" className="text-[13px] text-gray-700">Base salary</Label>
                <Input
                  id="cmp-salary" inputMode="numeric" className="mt-1"
                  value={b.salary ? b.salary.toLocaleString() : ''}
                  placeholder="e.g. 120,000"
                  onChange={(e) => onChangeB({ salary: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="cmp-bonus" className="text-[13px] text-gray-700">Bonus at target (%)</Label>
                <Input
                  id="cmp-bonus" inputMode="numeric" className="mt-1" value={b.bonusPct || ''}
                  onChange={(e) => onChangeB({ bonusPct: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="cmp-state" className="text-[13px] text-gray-700">Work state</Label>
                <select
                  id="cmp-state" value={bState}
                  onChange={(e) => onLocationB('', e.target.value)}
                  className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-base md:text-sm"
                >
                  <option value="">— select state —</option>
                  {states.map((st) => <option key={st.code} value={st.code}>{st.name}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="cmp-city" className="text-[13px] text-gray-700">City</Label>
                <select
                  id="cmp-city" value={bLocation} disabled={!bState}
                  onChange={(e) => onLocationB(e.target.value, bState)}
                  className="mt-1 h-10 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-base disabled:bg-gray-50 md:text-sm"
                >
                  <option value="">
                    {loadingCities ? 'Loading…' : bState ? '— select city —' : '— select state first —'}
                  </option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="cmp-rent" className="text-[13px] text-gray-700">Rent, monthly</Label>
                <Input
                  id="cmp-rent" inputMode="numeric" className="mt-1"
                  value={b.rentMonthly ? b.rentMonthly.toLocaleString() : ''}
                  placeholder="market rate"
                  onChange={(e) => onChangeB({ rentMonthly: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="cmp-rsu" className="text-[13px] text-gray-700">Equity, per year</Label>
                <Input
                  id="cmp-rsu" inputMode="numeric" className="mt-1"
                  value={b.rsuAnnual ? b.rsuAnnual.toLocaleString() : ''}
                  placeholder="0"
                  onChange={(e) => onChangeB({ rsuAnnual: Number(e.target.value.replace(/[^0-9]/g, '')) || 0 })}
                />
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-gray-500">
              The match, HSA, premium and time off start from the first offer&apos;s figures. Upload the second
              letter, or change them above, wherever the two differ.
            </p>
          </div>
        )}
      </div>

      {loadingTax && (
        <p className="mt-3 text-[12.5px] text-gray-400">Working out tax for the second offer…</p>
      )}
    </div>
  )
}
