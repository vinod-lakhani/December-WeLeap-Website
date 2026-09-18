'use client'

/**
 * The first screen for paid traffic on the rent tool.
 *
 * The creative runs four frames: a salary and a city, the number the listing
 * site allows, the number take-home actually allows, and the cash needed
 * before the keys. This screen is those four frames, computed, with the salary
 * field sitting inside them.
 *
 * The shape is different from the other two campaign heroes and the reason is
 * worth stating. The offer tool's surprise is additive and the paycheck tool's
 * is subtractive; this one is a CONTRADICTION. The visitor has already been
 * told a number by every listing site they have opened, and the page's job is
 * to put its own beside it rather than to reveal something they had not
 * considered. So the listing-site figure is on screen, named, and struck
 * through — arguing with it openly is the whole proposition, and quietly
 * showing a smaller number instead would read as a different calculator rather
 * than a correction.
 *
 * The full tool renders below with start date, debt and market rent for the
 * city. Salary and city are shared with it, so anything typed here is already
 * filled in down there.
 */

import { useMemo } from 'react'

import { track } from '@/lib/analytics'
import { getStateCodeForCity, getAvailableCities } from '@/lib/cities'
import { estimateTaxAnnual } from '@/lib/allocator/takeHome'
import {
  UPFRONT,
  calculateRentRange,
  calculateUpfrontCash,
  listingSiteRentMonthly,
} from '@/lib/rent'
import { RENT_EXAMPLE } from '@/lib/rentCampaign/example'
import { useTaxEstimate } from '@/lib/tax/useTaxEstimate'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

export interface RentCampaignHeroProps {
  /** Raw salary string, shared with the tool below. */
  salaryInput: string
  onSalaryChange: (raw: string) => void
  /** Preset city name, shared with the tool below. */
  city: string
  onCityChange: (city: string) => void
}

export function RentCampaignHero({
  salaryInput, onSalaryChange, city, onCityChange,
}: RentCampaignHeroProps) {
  const salary = useMemo(() => {
    const n = parseFloat(salaryInput.replace(/[$,\s]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [salaryInput])

  const stateCode = getStateCodeForCity(city) ?? ''

  /**
   * Grouped for display only.
   *
   * `salaryInput` is shared with the form below, which is a number field read
   * with parseFloat everywhere it is used — parseFloat('70,000') is 70, so the
   * comma can never go into the shared value. It is added on the way out and
   * stripped on the way in.
   */
  const display = salary > 0 ? salary.toLocaleString('en-US') : salaryInput

  /**
   * Local first, the API when it answers.
   *
   * This page cannot open on a spinner — the visitor was promised a number,
   * not a loading state — and the local table is close enough to stand in.
   * For the example itself the two agree to the dollar, because Texas has no
   * state tax; elsewhere the figure sharpens a moment after arrival.
   */
  const local = useMemo(() => {
    if (salary <= 0) return null
    const tax = estimateTaxAnnual(salary, 0, 0, stateCode)
    return {
      federalAnnual: 0,
      stateAnnual: 0,
      ficaAnnual: 0,
      netAnnual: salary - tax,
      source: 'local' as const,
    }
  }, [salary, stateCode])

  const tax = useTaxEstimate({ salary, state: stateCode, pretaxAnnual: 0, local })

  const takeHomeMonthly = tax ? tax.netAnnual / 12 : 0
  const rent = useMemo(() => calculateRentRange(takeHomeMonthly, 0), [takeHomeMonthly])
  const upfront = useMemo(
    () => calculateUpfrontCash(rent, takeHomeMonthly),
    [rent, takeHomeMonthly],
  )
  const listing = listingSiteRentMonthly(salary)

  /**
   * Whether the figures are the visitor's or the creative's.
   *
   * Both the salary and the city have to still be the example's: someone who
   * keeps $70,000 and switches to Boston has told us something, and the page
   * should stop describing the numbers as an example the moment it is
   * answering them rather than the ad.
   */
  const isExample = salary === RENT_EXAMPLE.salary && city === RENT_EXAMPLE.city
  const ready = salary > 0 && takeHomeMonthly > 0

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <h1 className="text-[27px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#1A3320] sm:text-[32px]">
        {isExample ? (
          <>
            {fc(RENT_EXAMPLE.salary)} in {RENT_EXAMPLE.city}. The listing site says{' '}
            {fc(RENT_EXAMPLE.listingSite)}.
          </>
        ) : (
          <>Your rent range, on take-home.</>
        )}
      </h1>

      <div className="mt-5 rounded-2xl border-2 border-[#386641] bg-white px-5 py-5 shadow-card sm:px-6">
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="rent-campaign-salary"
              className="block text-[13px] font-bold uppercase tracking-[0.06em] text-[#386641]"
            >
              {isExample ? 'Now type yours' : 'Salary'}
            </label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
              <input
                id="rent-campaign-salary"
                type="text"
                inputMode="numeric"
                aria-label="Annual salary"
                value={display}
                onChange={(e) => onSalaryChange(e.target.value.replace(/[^0-9]/g, ''))}
                onFocus={(e) => e.currentTarget.select()}
                className="h-14 w-full rounded-xl border-2 border-[#386641] pl-8 text-2xl font-extrabold tracking-[-0.02em] text-[#386641] outline-none focus-visible:ring-2 focus-visible:ring-[#A7C957]"
              />
            </div>
          </div>
          <div className="w-[38%] shrink-0">
            <label
              htmlFor="rent-campaign-city"
              className="block text-[13px] font-bold uppercase tracking-[0.06em] text-[#386641]"
            >
              City
            </label>
            {/* A second control on a first screen is a cost, and this one earns
                it: state tax moves take-home by more than anything else on the
                page, and without a city the answer is a national blend that is
                wrong for everybody. The ad names a city, so a visitor arriving
                from it already has the answer in mind. */}
            <select
              id="rent-campaign-city"
              aria-label="City"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              className="mt-1.5 h-14 w-full rounded-xl border-2 border-[#386641] bg-white px-2.5 text-[15px] font-bold text-[#386641] outline-none focus-visible:ring-2 focus-visible:ring-[#A7C957]"
            >
              {getAvailableCities().map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        {ready && (
          <>
            {/* Frame 2 and 3: the number they have been told, and ours. */}
            <div className="mt-4 flex items-baseline justify-between border-b border-hairline pb-2.5 text-[14px]">
              <span className="text-gray-600">Listing sites, 30% of gross</span>
              <span className="font-bold tabular-nums text-gray-400 line-through">{fc(listing)}</span>
            </div>

            <div className="mt-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#386641]">
                On take-home, you can carry
              </p>
              <p className="mt-1 text-[clamp(1.9rem,8.5vw,2.6rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {fc(rent.low)} &ndash; {fc(rent.high)}
              </p>
              <p className="mt-1.5 text-[13px] leading-snug text-subtle">
                28&ndash;35% of the {fc(takeHomeMonthly)} that actually lands
                {tax?.source === 'local' && <span className="text-faint"> · sharpening</span>}
              </p>
            </div>

            {/* Frame 4, and the strongest number on the page: the one nobody
                budgets for. Shown as its own block with the working visible,
                because an unexplained four-figure sum invites an argument the
                itemisation settles. */}
            <div className="mt-4 rounded-xl bg-[#F1F5EC] px-4 py-3.5">
              <p className="text-center text-[13px] font-bold uppercase tracking-[0.08em] text-[#386641]">
                Before you get keys
              </p>
              <p className="mt-0.5 text-center text-[28px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
                {fc(upfront.low)}
              </p>
              <dl className="mt-3 space-y-1 text-[13.5px]">
                <div className="flex justify-between">
                  <dt className="text-gray-600">Deposit</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">{fc(upfront.depositLow)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">First month</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">{fc(upfront.firstMonthLow)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">{UPFRONT.gapDays} days before your first paycheck</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">{fc(upfront.gapLiving)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">Moving and setup</dt>
                  <dd className="font-semibold tabular-nums text-gray-900">{fc(upfront.movingSetup)}</dd>
                </div>
              </dl>
              {/* Said out loud rather than left for somebody to discover: a
                  one-month deposit is the friendly end of the market. */}
              <p className="mt-2.5 border-t border-[#DCE5D2] pt-2 text-[12px] leading-relaxed text-subtle">
                Assumes a one-month deposit at the bottom of your range. Plenty of landlords ask for more,
                and some want last month&rsquo;s too &mdash; so treat this as the floor.
              </p>
            </div>
          </>
        )}

        {isExample && (
          <p className="mt-3.5 rounded-lg bg-canvas px-3.5 py-2.5 text-[12.5px] leading-relaxed text-subtle">
            The ad&rsquo;s numbers, for a single filer with no other debt. Type your salary above and pick your
            city &mdash; then the tool below adds your start date, any debt payments and what rent actually
            costs there.
          </p>
        )}
      </div>

      <p className="mt-3.5 text-center text-[14.5px] text-subtle">
        <button
          type="button"
          onClick={() => {
            track('rent_campaign_scroll_to_tool', { tool: 'rent' })
            document.getElementById('rent-full-tool')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }}
          className="-my-2 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-[3px]"
        >
          Add your start date and debt payments
        </button>
      </p>

      <p className="mt-2 text-center text-[12.5px] text-faint">Free · No account · Nothing to connect</p>
    </div>
  )
}
