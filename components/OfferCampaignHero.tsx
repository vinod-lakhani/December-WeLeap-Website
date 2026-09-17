'use client'

/**
 * The first screen for paid traffic on the offer tool.
 *
 * A visitor from the Yik Yak ad has just read "Your offer says $62k. it's worth
 * ~$78.5k. most people never find the other $16.5k." They have seconds, they
 * are inside another app's browser, and the only thing they came for is that
 * number.
 *
 * So the number is the page. The example from the creative renders as a real
 * result — the same breakdown the tool produces for anybody — with the salary
 * field sitting inside it, pre-filled at the figure from the ad. The first
 * action is not filling in a form to get a result; it is changing one number in
 * a result that is already working. There is no submit button, because there is
 * nothing to submit: it recomputes as you type.
 *
 * The standard hero asks for a salary and promises a number. On a short phone
 * that promise fell below the fold, which is the worst place for it: the
 * visitor sees a question and a form, having been sold an answer.
 */

import { useCallback, useRef } from 'react'

import { track } from '@/lib/analytics'
import { EXAMPLE } from '@/lib/offer/example'
import type { OfferValue } from '@/lib/offer/calculate'
import { cn } from '@/lib/utils'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

export interface OfferCampaignHeroProps {
  /** Formatted salary string, shared with the rest of the tool. */
  salaryInput: string
  onSalaryChange: (raw: string) => void
  /** The priced offer, once there is a salary. Null before. */
  calc: OfferValue | null
  salary: number
  /** Annual vesting the tool is holding, shown as its own line. */
  equityAnnual: number
  /** Scrolls to the upload block further down. */
  onUploadClick: () => void
}

export function OfferCampaignHero({
  salaryInput, onSalaryChange, calc, salary, equityAnnual, onUploadClick,
}: OfferCampaignHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Whether the figures on screen are the visitor's or the ad's.
   *
   * Until they change the number, this is the example from the creative and is
   * labelled as somebody else's offer. The moment they type, it is theirs and
   * the label has to go, because leaving it would be describing their salary as
   * an example.
   */
  const isExample = salary === EXAMPLE.salary

  const rows = calc
    ? [
        { k: 'Base salary', v: salary },
        { k: 'Bonus at target', v: calc.annualBonus },
        { k: '401(k) match', v: calc.annual401kMatch },
        { k: 'Equity, per year', v: equityAnnual },
      ].filter((r) => r.v > 0)
    : []

  // Straight off the tool's own figure. The hero used to add the example's
  // equity for display while the tool held none, so the page carried two
  // totals — $78,500 here and $71,920 in the result card below it.
  const total = calc ? calc.totalPackage : 0
  const found = total - salary

  const handleUpload = useCallback(() => {
    track('offer_campaign_upload_link', { tool: 'offer' })
    onUploadClick()
  }, [onUploadClick])

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <h1 className="text-[27px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#1A3320] sm:text-[32px]">
        {isExample ? (
          <>The {fc(EXAMPLE.salary)} offer from the ad. Here&rsquo;s the other {fc(EXAMPLE.found)}.</>
        ) : (
          <>Your offer, all seven numbers.</>
        )}
      </h1>

      <div className="mt-5 rounded-2xl border-2 border-[#386641] bg-white px-5 py-5 shadow-card sm:px-6">
        {/* The field lives inside the result, not above it. Changing it is the
            first thing a visitor does, and it happens in place — the number
            below moves as they type, so the page demonstrates itself. */}
        <label htmlFor="offer-salary" className="block text-[13px] font-bold uppercase tracking-[0.06em] text-[#386641]">
          {isExample ? 'Now type yours' : 'Base salary'}
        </label>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
          <input
            id="offer-salary"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            aria-label="Annual base salary"
            value={salaryInput}
            onChange={(e) => onSalaryChange(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="h-14 w-full rounded-xl border-2 border-[#386641] pl-9 text-2xl font-extrabold tracking-[-0.02em] text-[#386641] outline-none focus-visible:ring-2 focus-visible:ring-[#A7C957]"
          />
        </div>

        {calc && (
          <>
            <dl className="mt-4">
              {rows.map((r) => (
                <div key={r.k} className="flex justify-between border-b border-hairline py-2 text-[14px]">
                  <dt className="text-gray-600">{r.k}</dt>
                  <dd className="font-bold tabular-nums text-gray-900">{fc(r.v)}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#386641]">
                {isExample ? 'That offer is worth' : 'Your offer is worth'}
              </p>
              <p className="mt-1 text-[clamp(2.4rem,11vw,3.2rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {fc(total)}
              </p>
              {found > 0 && (
                <p className="mt-2 text-[15px] leading-snug text-subtle">
                  <span className="font-bold text-[#386641]">{fc(found)} more</span> than the {fc(salary)} on the
                  offer letter.
                </p>
              )}
            </div>
          </>
        )}

        {isExample && (
          <p className="mt-3.5 rounded-lg bg-canvas px-3.5 py-2.5 text-[12.5px] leading-relaxed text-subtle">
            These are the ad&rsquo;s numbers, with a {EXAMPLE.bonusPct}% bonus, a {EXAMPLE.matchUpToPct}% match and{' '}
            {fc(EXAMPLE.equity)} of equity. Type your salary above and they become yours.
          </p>
        )}
      </div>

      {/* One line. The dashed box with three paragraphs of privacy copy is
          still down the page for anybody who wants it, and it is the wrong
          first impression for somebody who has not seen their number yet. */}
      <p className="mt-3.5 text-center text-[14.5px] text-subtle">
        Have the offer letter?{' '}
        <button
          type="button"
          onClick={handleUpload}
          className={cn(
            '-my-2 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-[3px]',
          )}
        >
          Upload it and skip the typing.
        </button>
      </p>

      <p className="mt-2.5 text-center text-[12.5px] text-faint">
        Free · No account · Nothing to connect
      </p>
    </div>
  )
}
