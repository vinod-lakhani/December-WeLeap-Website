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
import { US_STATES } from '@/lib/states'
import { getHUDRentRange } from '@/lib/hudRents'
import { estimateTaxAnnual } from '@/lib/allocator/takeHome'
import {
  UPFRONT,
  calculateRentRange,
  calculateUpfrontCash,
  listingSiteRentMonthly,
  marketRentVerdict,
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
  /** Preset city name, or 'Other'. Shared with the tool below. */
  city: string
  onCityChange: (city: string) => void
  /**
   * State code when the city is 'Other', shared with the tool below.
   *
   * The six presets cover the metros the market-rent data knows about, which
   * is not where most of the country lives. Without this an ad running
   * nationally sent everyone outside those six to a national tax blend that is
   * wrong for all of them — and state tax moves this answer more than anything
   * else on the page.
   */
  otherState: string
  onOtherStateChange: (state: string) => void
}

export function RentCampaignHero({
  salaryInput, onSalaryChange, city, onCityChange, otherState, onOtherStateChange,
}: RentCampaignHeroProps) {
  const salary = useMemo(() => {
    const n = parseFloat(salaryInput.replace(/[$,\s]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : 0
  }, [salaryInput])

  const isOther = city === 'Other'
  const stateCode = (isOther ? otherState : getStateCodeForCity(city)) ?? ''

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
   *
   * "Close enough" is doing real work and is measured rather than assumed: for
   * the New York example the first paint puts the top of the band at $1,625
   * and the API settles it at $1,600, because the local state rate is charged
   * on taxable income while the table's rates were calibrated on gross. The
   * bottom of the band and the upfront total are identical either way. See
   * lib/rentCampaign/example.ts, which pins both and names the cause.
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
   * What a one-bed in this city actually goes for.
   *
   * The other half of the answer, and on a graduate salary in an expensive
   * city the more useful half. "You can carry $1,300 to $1,600" is a budget;
   * "and a one-bed here is $2,800" is the decision — it is the difference
   * between planning a move and planning a move with roommates. A page that
   * gives the budget and not the price leaves the reader to discover the gap
   * on a listings site, which is exactly where the bad number came from.
   */
  const market = useMemo(() => {
    const m = getHUDRentRange(city)
    if (!m || !(rent.high > 0)) return null
    return {
      ...m,
      verdict: marketRentVerdict(rent.high, m.low, m.high),
      /** How far the cheapest one-bed sits above the top of what they can carry. */
      shortfall: Math.max(0, m.low - rent.high),
    }
  }, [city, rent.high])

  /**
   * Whether the figures are the visitor's or the creative's.
   *
   * Both the salary and the city have to still be the example's: someone who
   * keeps $70,000 and switches to Boston has told us something, and the page
   * should stop describing the numbers as an example the moment it is
   * answering them rather than the ad.
   */
  const isExample = salary === RENT_EXAMPLE.salary && city === RENT_EXAMPLE.city
  /**
   * 'Other' with no state yet is the one case where this card cannot answer.
   * Showing a national blend and calling it their number would be worse than
   * asking for one more tap, because the blend is wrong for every state.
   */
  const awaitingState = isOther && !otherState
  const ready = salary > 0 && takeHomeMonthly > 0 && !awaitingState

  return (
    <div className="mx-auto w-full max-w-[600px]">
      {/* The headline names the ANSWER, not the claim being argued with.
          It used to read "$70,000 in NYC. The listing site says $1,750." —
          which puts the opposition's number in the largest type on the page
          and leaves a visitor working out which of the two figures is
          supposed to be theirs. The contrast still happens, one line under
          the result, where it reads as a correction rather than a rival. */}
      <h1 className="text-[27px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#1A3320] sm:text-[32px]">
        {isExample ? (
          <>What {fc(RENT_EXAMPLE.salary)} in {RENT_EXAMPLE.city} actually rents.</>
        ) : (
          <>What your salary actually rents.</>
        )}
      </h1>

      <div className="mt-5 rounded-2xl border-2 border-[#386641] bg-white px-5 py-5 shadow-card sm:px-6">
        {/* Two controls, two labels with the same grammar. "NOW TYPE YOURS"
            sat over a field that was already filled in, next to a plain
            "CITY", so the pair read as an instruction and a noun. */}
        <div className="flex gap-3">
          <div className="min-w-0 flex-1">
            <label
              htmlFor="rent-campaign-salary"
              className="block text-[12px] font-bold uppercase tracking-[0.07em] text-[#6B7C6E]"
            >
              Salary
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
          {/* 42%, not 38%: "SF Bay Area" measured 86px against 88px of inner
              width, which is not margin, it is luck. */}
          <div className="w-[42%] shrink-0">
            <label
              htmlFor="rent-campaign-city"
              className="block text-[12px] font-bold uppercase tracking-[0.07em] text-[#6B7C6E]"
            >
              City
            </label>
            {/* State tax moves take-home by more than anything else here, so
                without a city the answer is a national blend that is wrong for
                everybody. The ad names a city, so this arrives already right. */}
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
              {/* "Somewhere else" truncated to "Somewh" in a select this
                  narrow, and this is the same word the form below uses. */}
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Anywhere that is not one of the six metros the rent data covers.
            State alone, because state tax is what this card computes and it is
            answerable with one tap; the metro that local rents need is a list
            fetched per state, and a loading state on the first screen would
            cost more than it returns. The tool below asks for it. */}
        {isOther && (
          <div className="mt-3">
            <label
              htmlFor="rent-campaign-state"
              className="block text-[12px] font-bold uppercase tracking-[0.07em] text-[#6B7C6E]"
            >
              State
            </label>
            <select
              id="rent-campaign-state"
              aria-label="State"
              value={otherState}
              onChange={(e) => onOtherStateChange(e.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl border-2 border-[#386641] bg-white px-2.5 text-[15px] font-bold text-[#386641] outline-none focus-visible:ring-2 focus-visible:ring-[#A7C957]"
            >
              <option value="">Pick your state</option>
              {US_STATES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        )}

        {awaitingState && salary > 0 && (
          <p className="mt-4 rounded-xl bg-canvas px-4 py-3 text-center text-[14px] leading-relaxed text-subtle">
            Pick your state and this answers. It changes the number more than anything else here.
          </p>
        )}

        {ready && (
          <>
            {/* THE ANSWER. One number, the largest thing on the page, with
                nothing competing for the same weight. */}
            <div className="mt-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#386641]">
                Rent you can carry
              </p>
              <p className="mt-1.5 text-[clamp(2rem,9vw,2.75rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {fc(rent.low)}&ndash;{fc(rent.high)}
              </p>
              <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.08em] text-faint">
                a month
              </p>
            </div>

            {/* What it actually costs, against what they can carry.
                Placed directly under the answer because for most of these
                cities it is the answer's consequence, and reading one without
                the other is how somebody ends up surprised on a listings
                site. */}
            {market && (
              <div className="mt-4 border-t border-hairline pt-3.5">
                {/* Label short enough to hold one line at 375px. "A one-bed
                    in NYC goes for" wrapped and left "for" orphaned beside
                    the price. */}
                <div className="flex items-baseline justify-between gap-3 text-[14.5px]">
                  <span className="text-gray-600">One-bed in {city}</span>
                  <span className="shrink-0 font-extrabold tabular-nums text-ink">
                    {fc(market.low)}&ndash;{fc(market.high)}
                  </span>
                </div>
                <p className="mt-1.5 text-[14.5px] font-semibold leading-snug text-[#1A3320]">
                  {market.verdict === 'out_of_reach' ? (
                    <>
                      {fc(market.shortfall)} a month more than you can carry. Roommates, or a cheaper
                      neighbourhood.
                    </>
                  ) : market.verdict === 'in_reach' ? (
                    <>That whole range is inside what you can carry.</>
                  ) : (
                    <>The low end is inside your range. Possible, with looking.</>
                  )}
                </p>
              </div>
            )}

            {/* The correction, demoted. It used to be a struck-through row
                directly beneath the inputs, where it read as part of the form
                and repeated the $1,750 already sitting in the headline. */}
            {/* Outside the six metros the rent data covers, the budget still
                works — it is tax, and the state answers that. The price does
                not, and saying so is better than leaving a reader to notice a
                section is missing. */}
            {!market && (
              <div className="mt-4 border-t border-hairline pt-3.5">
                <p className="text-[14px] leading-snug text-subtle">
                  We hold one-bed rents for six metros. Pick yours in the tool below and this gets the local
                  price too.
                </p>
              </div>
            )}

            {/* Where both numbers come from.
                This used to end "...comes out of the $4,606 that lands",
                which named neither the unit nor the quantity — sitting
                between a $70,000 salary and a $1,750 monthly figure, there
                was nothing to tell a reader which kind of number it was. It
                also has to carry the band's derivation now, since the
                "28-35% of..." line that used to sit under the result was
                removed to stop three figures stacking up there. */}
            <p className="mt-3.5 text-[13.5px] leading-relaxed text-subtle">
              Listing sites would have said{' '}
              <span className="font-semibold text-gray-500 line-through">{fc(listing)}</span> &mdash; 30% of your
              salary before tax. But rent is paid out of take-home, which is{' '}
              <span className="font-semibold text-ink">{fc(takeHomeMonthly)} a month</span>, and the range above
              is 28&ndash;35% of that.
            </p>

            {/* The second thing anybody needs, kept visibly second: the total
                sits on the header line at body weight instead of being a
                rival to the number above. */}
            <div className="mt-4 rounded-xl bg-[#F1F5EC] px-4 py-3.5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[12.5px] font-bold uppercase tracking-[0.08em] text-[#386641]">
                  Before you get keys
                </p>
                <p className="text-[22px] font-extrabold leading-none tracking-[-0.02em] text-ink tabular-nums">
                  {fc(upfront.low)}
                </p>
              </div>
              <dl className="mt-3 space-y-1 border-t border-[#DCE5D2] pt-2.5 text-[13.5px]">
                {[
                  ['Deposit', upfront.depositLow],
                  ['First month', upfront.firstMonthLow],
                  [`${UPFRONT.gapDays} days with no paycheck`, upfront.gapLiving],
                  ['Moving and setup', upfront.movingSetup],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex justify-between gap-3">
                    <dt className="text-gray-600">{label}</dt>
                    <dd className="shrink-0 font-semibold tabular-nums text-gray-900">{fc(Number(value))}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* One line of small print, not two boxes of it. The deposit
                assumption and the example label used to be stacked grey
                blocks totalling six lines directly under the numbers. */}
            <p className="mt-3 text-[12px] leading-relaxed text-faint">
              Assumes a one-month deposit at the bottom of your range, so it is a floor.
              {isExample && ' Change the salary above to make these yours.'}
            </p>
          </>
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
