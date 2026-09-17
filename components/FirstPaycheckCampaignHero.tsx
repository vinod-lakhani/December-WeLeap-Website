'use client'

/**
 * The first screen for paid traffic on the first-paycheck tool.
 *
 * Same argument as the offer tool's campaign hero, applied to a page whose
 * surprise runs the other way. The offer tool tells you a number is bigger
 * than you thought; this one tells you a paycheck is smaller. Subtraction is a
 * worse thing to lead a paid visitor with, so the ladder down to take-home is
 * the middle of the card, not the end of it — the card closes on the employer
 * money the 401(k) percentage exists to capture, which is the only figure here
 * that anybody can act on in the next ten minutes.
 *
 * The salary field sits inside the result rather than above it, so the first
 * action is changing one number in something that already works rather than
 * filling in a form to find out whether it will. There is no submit button
 * because there is nothing to submit.
 *
 * The rest of the tool renders below, unchanged: start date, state, pay
 * frequency, the real match formula, HSA eligibility, and the upload that
 * reads a benefits guide. This screen is the doorway, not a replacement.
 */

import { useCallback, useRef } from 'react'

import { track } from '@/lib/analytics'
import { TYPICAL_ENROLLMENT_WINDOW_DAYS } from '@/lib/firstPaycheck/constants'
import { PAYCHECK_EXAMPLE } from '@/lib/firstPaycheck/example'
import type { FirstPaycheckPlan } from '@/lib/firstPaycheck/calculation'
import type { PayFrequency } from '@/lib/offer-parse/fields'

const fc = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

/** How a period reads mid-sentence, e.g. "Gross, twice a month". */
const PERIOD_PHRASE: Record<PayFrequency, string> = {
  weekly: 'every week',
  biweekly: 'every two weeks',
  semimonthly: 'twice a month',
  monthly: 'once a month',
}

export interface FirstPaycheckCampaignHeroProps {
  /** Raw salary string, shared with the rest of the tool. */
  salaryInput: string
  onSalaryChange: (raw: string) => void
  /** Parsed salary, or null before there is one. */
  salary: number | null
  /** The plan, once there is a salary. Null before. */
  plan: FirstPaycheckPlan | null
  payFrequency: PayFrequency
  /** Scrolls to the upload block further down. */
  onUploadClick: () => void
}

export function FirstPaycheckCampaignHero({
  salaryInput, onSalaryChange, salary, plan, payFrequency, onUploadClick,
}: FirstPaycheckCampaignHeroProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  /**
   * Whether the figures on screen are the visitor's or the creative's.
   *
   * Until they change the number this is the example from the ad and is
   * labelled as somebody else's job. The moment they type it is theirs and the
   * label has to go, because leaving it would be describing their salary as an
   * example.
   */
  const isExample = salary === PAYCHECK_EXAMPLE.salary

  /**
   * Withholding, derived rather than recomputed.
   *
   * takeHomePerCheck can come from /api/tax, which knows the real state
   * schedule; federal, state and FICA worked out separately here would be the
   * local approximation and would not add up to the number printed below them.
   * Taking the difference means the ladder always reconciles to its own total,
   * whichever source answered.
   */
  const withheld = plan
    ? plan.grossPerCheck - plan.contributionPerCheck - plan.hsaPerCheck - plan.takeHomePerCheck
    : 0

  const handleUpload = useCallback(() => {
    track('first_paycheck_campaign_upload_link', { tool: 'first_paycheck' })
    onUploadClick()
  }, [onUploadClick])

  return (
    <div className="mx-auto w-full max-w-[600px]">
      <h1 className="text-[27px] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#1A3320] sm:text-[32px]">
        {isExample ? (
          <>
            {fc(PAYCHECK_EXAMPLE.salary)} a year is {fc(PAYCHECK_EXAMPLE.takeHome)} a paycheck.
          </>
        ) : (
          <>Your paycheck, and the one number to type.</>
        )}
      </h1>

      <div className="mt-5 rounded-2xl border-2 border-[#3F6B42] bg-white px-5 py-5 shadow-card sm:px-6">
        {/* The field lives inside the result. Changing it happens in place and
            everything below moves as you type, so the page demonstrates itself
            rather than promising. */}
        <label htmlFor="fp-salary" className="block text-[13px] font-bold uppercase tracking-[0.06em] text-[#3F6B42]">
          {isExample ? 'Now type yours' : 'What the job pays'}
        </label>
        <div className="relative mt-1.5">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl text-gray-400">$</span>
          <input
            id="fp-salary"
            ref={inputRef}
            type="text"
            inputMode="numeric"
            aria-label="Annual salary"
            value={salaryInput}
            onChange={(e) => onSalaryChange(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            className="h-14 w-full rounded-xl border-2 border-[#3F6B42] pl-9 text-2xl font-extrabold tracking-[-0.02em] text-[#3F6B42] outline-none focus-visible:ring-2 focus-visible:ring-[#A7C957]"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            per year
          </span>
        </div>

        {plan && salary !== null && (
          <>
            <dl className="mt-4">
              <div className="flex justify-between border-b border-hairline py-2 text-[14px]">
                <dt className="text-gray-600">Gross, {PERIOD_PHRASE[payFrequency]}</dt>
                <dd className="font-bold tabular-nums text-gray-900">{fc(plan.grossPerCheck)}</dd>
              </div>
              <div className="flex justify-between border-b border-hairline py-2 text-[14px]">
                <dt className="text-gray-600">Tax and FICA</dt>
                <dd className="font-bold tabular-nums text-gray-900">&minus;{fc(withheld)}</dd>
              </div>
              {plan.contributionPerCheck > 0 && (
                <div className="flex justify-between border-b border-hairline py-2 text-[14px]">
                  <dt className="text-gray-600">
                    401(k) at {Number(plan.contributionPct.toFixed(2))}%
                  </dt>
                  <dd className="font-bold tabular-nums text-gray-900">
                    &minus;{fc(plan.contributionPerCheck)}
                  </dd>
                </div>
              )}
              {plan.hsaPerCheck > 0 && (
                <div className="flex justify-between border-b border-hairline py-2 text-[14px]">
                  <dt className="text-gray-600">HSA</dt>
                  <dd className="font-bold tabular-nums text-gray-900">&minus;{fc(plan.hsaPerCheck)}</dd>
                </div>
              )}
            </dl>

            <div className="mt-3.5 text-center">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#3F6B42]">
                What actually lands
              </p>
              <p className="mt-1 text-[clamp(2.4rem,11vw,3.2rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {fc(plan.takeHomePerCheck)}
              </p>
              <p className="mt-1 text-[13px] text-faint">{PERIOD_PHRASE[payFrequency]}, once everything is set</p>
            </div>

            {/* The card closes on the gain, not the shrinkage.
                Everything above this line is money leaving, which is true and
                is not a reason to act. This is: the percentage in the row
                above is the exact point where the employer stops matching, and
                the match is never paid retroactively for the months somebody
                spent below it. */}
            {plan.employerMatchAnnual > 0 && (
              <p className="mt-4 rounded-xl bg-[#F1F5EC] px-4 py-3.5 text-center text-[14.5px] leading-relaxed text-[#1A3320]">
                Type{' '}
                <strong className="font-extrabold">
                  {Number(plan.contributionPct.toFixed(2))}%
                </strong>{' '}
                in the 401(k) box. Your employer adds{' '}
                <strong className="font-extrabold">{fc(plan.employerMatchAnnual)} a year</strong> &mdash; and
                never backdates it for the months you skip.
              </p>
            )}
          </>
        )}

        {isExample && (
          <p className="mt-3.5 rounded-lg bg-canvas px-3.5 py-2.5 text-[12.5px] leading-relaxed text-subtle">
            An example on {fc(PAYCHECK_EXAMPLE.salary)}, paid twice a month, with a dollar-for-dollar match to{' '}
            {PAYCHECK_EXAMPLE.matchCapPct}%. Type your salary above and it becomes yours &mdash; your state, pay
            schedule and real match formula are all editable below.
          </p>
        )}
      </div>

      <p className="mt-3.5 text-center text-[14.5px] text-subtle">
        Have the offer letter or benefits guide?{' '}
        <button
          type="button"
          onClick={handleUpload}
          className="-my-2 inline-flex min-h-11 items-center font-semibold text-brand-700 underline underline-offset-[3px]"
        >
          Upload it and skip the typing.
        </button>
      </p>

      {/* The deadline is a property of the situation rather than something the
          page invents, and it is the reason this tool is worth opening today
          rather than bookmarking. Stated as the guess it is. */}
      <p className="mt-2.5 text-center text-[12.5px] text-faint">
        Most enrolment windows close about {TYPICAL_ENROLLMENT_WINDOW_DAYS} days after you start · Free · No account
      </p>
    </div>
  )
}
