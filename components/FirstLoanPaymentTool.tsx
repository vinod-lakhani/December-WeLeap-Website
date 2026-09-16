'use client'

/**
 * What the first student loan payment does to a paycheck.
 *
 * Everything the visitor needs is pre-filled, so a result is on screen before
 * anything is tapped. That is the lesson from the offer tool, where the first
 * phone screen asked for a document and the field that needed nothing sat 175px
 * below the fold.
 *
 * The numbers live inside a sentence rather than in a form. A borrower three
 * weeks from the end of a grace period is not filling anything in; they are
 * reading a claim about their own money and correcting the parts that are
 * wrong.
 *
 * Two after-figures, not one. The mock showed a single paycheck that assumed no
 * 401(k) and put "keep your match" immediately under it, which meant the
 * recommended action produced a different number from the one on screen. Both
 * are shown, and the gap between them is what keeping the match costs.
 */

import { useCallback, useMemo, useRef, useState } from 'react'

import { AppCta } from '@/components/AppCta'
import { track } from '@/lib/analytics'
import { nextRunIndex } from '@/lib/run-index'
import { US_STATES } from '@/lib/states'
import { hasStateRate } from '@/lib/firstPaycheck/calculation'
import {
  computeLoanPayment,
  localTakeHomeMonthly,
  MATCH_DEFERRAL_PCT,
  STANDARD_TERM_MONTHS,
} from '@/lib/studentLoan/calculation'
import { useTaxEstimate } from '@/lib/tax/useTaxEstimate'

const TOOL = 'first_loan_payment'
const PAGE = '/first-student-loan-payment'

/** Pre-filled so the page answers before it asks. Round, plausible, editable. */
const DEFAULTS = { balance: '30,000', rate: '6.5', salary: '60,000' }

const money = (n: number) =>
  `$${Math.round(n).toLocaleString('en-US')}`

const digits = (raw: string, max = 7) => raw.replace(/[^0-9]/g, '').slice(0, max)
const grouped = (raw: string) => {
  const d = digits(raw)
  return d ? Number(d).toLocaleString('en-US') : ''
}
const toNumber = (raw: string) => Number(raw.replace(/[^0-9.]/g, '')) || 0

/** Width tracks content so the sentence does not jump as digits are typed. */
const chWidth = (value: string, min: number) =>
  ({ width: `${Math.max(min, value.length + 0.3)}ch` })

function Editable({
  id, value, onChange, label, prefix, suffix, minCh, mode = 'numeric',
}: {
  id: string
  value: string
  onChange: (v: string) => void
  label: string
  prefix?: string
  suffix?: string
  minCh: number
  mode?: 'numeric' | 'decimal'
}) {
  return (
    <span className="inline-flex items-baseline border-b-[3px] border-[#C2DEC6] font-extrabold text-[#386641] focus-within:border-[#386641]">
      {prefix}
      <input
        id={id}
        aria-label={label}
        inputMode={mode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.currentTarget.select()}
        style={chWidth(value, minCh)}
        className="border-0 bg-transparent p-0 font-[inherit] text-[inherit] leading-[inherit] tracking-[inherit] text-[inherit] outline-none"
      />
      {suffix}
    </span>
  )
}

export function FirstLoanPaymentTool() {
  const [balance, setBalance] = useState(DEFAULTS.balance)
  const [rate, setRate] = useState(DEFAULTS.rate)
  const [salary, setSalary] = useState(DEFAULTS.salary)
  const [state, setState] = useState('')

  const engaged = useRef(false)
  const completed = useRef(false)
  const belowRef = useRef<HTMLDivElement>(null)

  const markEngaged = useCallback((field: string) => {
    if (engaged.current) return
    engaged.current = true
    track('tool_engaged', { tool: 'first_loan_payment', first_field: field })
    track('tool_form_start', { tool: TOOL, page: PAGE })
  }, [])

  const salaryNum = toNumber(salary)
  const deferralAnnual = (salaryNum * MATCH_DEFERRAL_PCT) / 100

  /**
   * The local figure is what renders first, and the API's replaces it a moment
   * later. A flat state rate is a national average and wrong for any actual
   * person; /api/tax knows the real schedule. Nothing waits for it.
   */
  const noDeferral = useTaxEstimate({
    salary: salaryNum,
    state,
    local: salaryNum > 0
      ? { federalAnnual: 0, stateAnnual: 0, ficaAnnual: 0, netAnnual: localTakeHomeMonthly(salaryNum, state, 0) * 12, source: 'local' }
      : null,
  })
  const withDeferral = useTaxEstimate({
    salary: salaryNum,
    state,
    pretaxAnnual: deferralAnnual,
    local: salaryNum > 0
      ? { federalAnnual: 0, stateAnnual: 0, ficaAnnual: 0, netAnnual: localTakeHomeMonthly(salaryNum, state, deferralAnnual) * 12, source: 'local' }
      : null,
  })

  const result = useMemo(
    () =>
      computeLoanPayment({
        balance: toNumber(balance),
        aprPct: toNumber(rate),
        salary: salaryNum,
        state,
        deferralPct: MATCH_DEFERRAL_PCT,
        takeHomeBeforeOverride: noDeferral ? noDeferral.netAnnual / 12 : undefined,
        takeHomeWithDeferralOverride: withDeferral ? withDeferral.netAnnual / 12 : undefined,
      }),
    [balance, rate, salaryNum, state, noDeferral, withDeferral],
  )

  /**
   * Fires on the first deliberate move past the first frame, not on render.
   * The page shows a full result immediately, so firing on load would make
   * completion mean "arrived" and the step between engaged and completed
   * measure nothing.
   */
  const complete = useCallback(() => {
    if (completed.current || !result) return
    completed.current = true
    track('tool_completed', {
      tool: 'first_loan_payment',
      run_index: nextRunIndex(TOOL),
      balance: toNumber(balance),
      apr_pct: toNumber(rate),
      salary: toNumber(salary),
      state_set: !!state,
      payment: Math.round(result.payment),
      take_home_after: Math.round(result.takeHomeAfter),
      high_apr: result.highApr,
    })
  }, [result, balance, rate, salary, state])

  const seeWhatToDo = useCallback(() => {
    complete()
    track('first_loan_cta', { tool: TOOL })
    belowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [complete])

  const stateNamed = hasStateRate(state)

  return (
    <div className="mx-auto w-full max-w-[600px]">
      {/* ── The first frame ─────────────────────────────────────────────── */}
      <section className="rounded-2xl border-2 border-[#386641] bg-white px-5 py-5 sm:px-6 sm:py-6">
        {/* No headline here. The page h1 above already asks this question and
            the hero paragraph already names the grace period; repeating both
            inside the card cost about 330px of the first screen and pushed the
            button off it. The card starts at the sentence, which is the first
            thing on the page that is not prose. */}
        <p className="text-[19px] font-semibold leading-[1.4] text-[#0C0F0C] sm:text-[20px]">
          You owe{' '}
          <Editable
            id="loan-balance" label="Loan balance" prefix="$" minCh={6}
            value={balance}
            onChange={(v) => { markEngaged('balance'); setBalance(grouped(v)) }}
          />{' '}
          at{' '}
          <Editable
            id="loan-rate" label="Interest rate" suffix="%" minCh={2} mode="decimal"
            value={rate}
            onChange={(v) => { markEngaged('rate'); setRate(v.replace(/[^0-9.]/g, '').slice(0, 5)) }}
          />
          , earning{' '}
          <Editable
            id="loan-salary" label="Salary" prefix="$" minCh={6}
            value={salary}
            onChange={(v) => { markEngaged('salary'); setSalary(grouped(v)) }}
          />{' '}
          a year in{' '}
          <span className="inline-flex items-baseline border-b-[3px] border-[#C2DEC6] focus-within:border-[#386641]">
            <select
              id="loan-state"
              aria-label="Work state"
              value={state}
              onChange={(e) => { markEngaged('state'); setState(e.target.value) }}
              className="border-0 bg-transparent p-0 font-[inherit] text-[inherit] font-extrabold leading-[inherit] text-[#386641] outline-none"
            >
              <option value="">your state</option>
              {US_STATES.map((code) => <option key={code} value={code}>{code}</option>)}
            </select>
          </span>
          .
        </p>

        {result && (
          <>
            <p className="mt-3 text-[19px] font-semibold leading-[1.4] text-[#0C0F0C] sm:text-[20px]">
              Your payment: <span className="font-extrabold text-[#386641]">{money(result.payment)}</span> a month.
            </p>

            <p className="mt-3.5 text-[24px] font-extrabold leading-[1.2] tracking-[-0.03em] text-[#0C0F0C] sm:text-[26px]">
              Your paycheck goes from{' '}
              <span className="font-semibold text-[#9AA39B] line-through">{money(result.takeHomeBefore)}</span> to{' '}
              <span className="text-[#386641]">{money(result.takeHomeAfter)}</span>.
            </p>

            {/* The number the advice below actually produces. Without it the
                tool recommends keeping the match while showing a paycheck that
                assumes nobody does. */}
            {result.deferralCostMonthly > 0 && (
              <p className="mt-2.5 text-[15px] leading-relaxed text-[#636B64]">
                Keep a {MATCH_DEFERRAL_PCT}% 401(k) contribution and it is{' '}
                <span className="font-bold text-[#0C0F0C]">{money(result.takeHomeWithMatch)}</span>. That is the
                version worth having, and it costs {money(result.deferralCostMonthly)} a month.
              </p>
            )}
          </>
        )}

        <p className="mt-3 text-sm text-[#636B64]">
          <span className="font-semibold text-[#0C0F0C]">Tap any number</span> to make it yours.
        </p>


        <button
          type="button"
          onClick={seeWhatToDo}
          className="mt-5 w-full rounded-xl bg-[#386641] py-4 text-[17px] font-bold text-white transition hover:bg-[#2d5a26]"
        >
          See what to do about it
        </button>

        {/* Below the button, not between the answer and it. Ninety pixels of
            small print sitting in that gap was the difference between the
            button being on the first screen and off it. */}
        <p className="mt-3.5 text-xs leading-relaxed text-[#9AA39B]">
          Estimates. Standard {STANDARD_TERM_MONTHS / 12}-year plan, single filer, monthly take-home rather than one
          paycheck.{' '}
          {stateNamed
            ? `State tax for ${state}${noDeferral?.source === 'api' ? ', from current tax tables' : ''}.`
            : 'No state picked, so state tax is estimated at 4%, about the national middle. Pick yours above and these sharpen.'}
        </p>

      </section>

      {/* ── Below the fold ──────────────────────────────────────────────── */}
      <div ref={belowRef} className="scroll-mt-24">
        {result && (
          <>
            <section className="mt-4 rounded-2xl border border-hairline bg-white px-5 py-5 sm:px-6">
              <h3 className="text-[15px] font-bold text-[#1A3320]">The one move</h3>
              {result.highApr ? (
                <>
                  <p className="mt-2.5 text-base font-semibold leading-snug text-[#0C0F0C]">
                    This rate is high enough to attack. Capture the match first, then send extra here.
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#636B64]">
                    At {toNumber(rate)}% this loan costs more than most things you could do with the money, once the
                    employer match is already captured. The match still comes first, because it doubles on day one.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2.5 text-base font-semibold leading-snug text-[#0C0F0C]">
                    Pay the minimum on this loan. Keep your 401(k) match.
                  </p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#636B64]">
                    A {toNumber(rate)}% loan is not the fire to put out first. If your employer matches, every dollar
                    you send there doubles on day one. Extra loan payments come after the match and after a small
                    cushion.
                  </p>
                </>
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-hairline bg-white px-5 py-5 sm:px-6">
              <h3 className="text-[15px] font-bold text-[#1A3320]">Where the money goes</h3>
              {/* Reconciles to the paycheck the advice above produces, not the
                  one somebody gets by ignoring it. The contribution used to be
                  missing from this list while the card above recommended
                  making it, so the two disagreed by $164 on the same screen. */}
              <p className="mt-1 text-[12.5px] text-[#9AA39B]">
                Following the one move, with the {MATCH_DEFERRAL_PCT}% contribution running.
              </p>
              <dl className="mt-3 text-sm">
                {[
                  { k: 'Monthly gross', v: result.grossMonthly },
                  { k: `Your 401(k), ${MATCH_DEFERRAL_PCT}%`, v: result.deferralMonthly },
                  { k: 'Taxes (estimated)', v: result.taxWithDeferralMonthly },
                  { k: 'Loan payment', v: result.payment },
                ].map((row) => (
                  <div key={row.k} className="flex justify-between border-b border-hairline py-2 text-[#636B64]">
                    <dt>{row.k}</dt>
                    <dd className="tabular-nums">{money(row.v)}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-2.5 font-bold text-[#0C0F0C]">
                  <dt>What lands</dt>
                  <dd className="tabular-nums">{money(result.takeHomeWithMatch)}</dd>
                </div>
              </dl>

              {/* The three numbers here are $200 in, $400 out and $168 of
                  take-home, and an earlier draft put them in competition: it
                  called $168 "the only line here you keep" while the line
                  directly above said $200, so the reader's first question was
                  which of the two was real rather than what either meant.

                  They are a sequence, not a comparison. The contribution is
                  $200, the employer doubles it, and the reason the paycheck
                  only moves by $168 is named rather than left to be worked
                  out — because "why not $200" is exactly what somebody asks
                  at this point. */}
              {result.retirementMonthly > 0 && (
                <div className="mt-4 rounded-xl border border-[#A7C957] bg-green-50 px-4 py-3.5">
                  <p className="text-[15px] font-bold leading-snug text-[#1A3320]">
                    Your {money(result.deferralMonthly)} is matched.{' '}
                    {money(result.retirementMonthly)} a month goes in.
                  </p>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#2f5233]">
                    Your employer adds a dollar for every dollar, from the first paycheck. And the{' '}
                    {money(result.deferralMonthly)} comes out before tax, so your take-home drops by{' '}
                    {money(result.deferralCostMonthly)} rather than the full {money(result.deferralMonthly)}.
                  </p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#636B64]">
                    Assumes your employer matches dollar for dollar up to {MATCH_DEFERRAL_PCT}%, which is the
                    commonest arrangement. Your benefits guide has the real terms, and they are worth checking
                    before you set the number.
                  </p>
                </div>
              )}

              <p className="mt-3 text-xs leading-relaxed text-[#9AA39B]">
                Over the full {STANDARD_TERM_MONTHS / 12} years this loan costs about{' '}
                {money(result.interestTotal)} in interest if nothing changes.
              </p>
            </section>

            <div className="mt-4">
              <AppCta
                tool="first_loan_payment"
                eyebrow="Every payday, not just today"
                headline="Want this checked every payday?"
                body="This is one month on one loan. The app watches the balance come down, the match land and the payment clear, and tells you when the priority changes."
                buttonLabel="Track my loan and my match"
                bullets={[
                  'Your match, tracked until you actually capture it',
                  'The loan balance and the payment, watched as they clear',
                  'A nudge when the priority changes, not a monthly report',
                ]}
                prefill={{
                  salary: toNumber(salary),
                  state,
                  loan_balance: toNumber(balance),
                  loan_apr: toNumber(rate),
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
