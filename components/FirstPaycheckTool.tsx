'use client'

/**
 * First Paycheck Setup — what to type into the benefits forms.
 *
 * Every other tool here answers a question about money in general. This one
 * answers a question about a FORM, in a week when the reader has a browser tab
 * open on their employer's payroll portal and a field asking for a percentage.
 * So the output is shaped like the portal: a percentage for the 401(k) box, a
 * dollar figure per paycheck for the HSA box, and an answer for the Roth
 * toggle — not an annual plan they have to divide in their head at the moment
 * of entry.
 *
 * It reuses the offer-letter and benefits-guide upload wholesale. The match
 * formula, the HSA and the premium are only in the benefits guide, usually
 * thirty pages in, and that document is exactly what nobody reads. Reading it
 * for them is most of the value here.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { track } from '@/lib/analytics'
import { nextRunIndex } from '@/lib/run-index'
import { HSA_RECOMMENDED_START } from '@/lib/allocator/constants'
import { US_STATES } from '@/lib/states'
import { useTaxEstimate } from '@/lib/tax/useTaxEstimate'
import { OfferLetterUpload } from '@/components/OfferLetterUpload'
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire'
import { AppCta } from '@/components/AppCta'
import { computeFirstPaycheck } from '@/lib/firstPaycheck/calculation'
import { TAX_YEAR_FIRST_PAYCHECK, TYPICAL_ENROLLMENT_WINDOW_DAYS } from '@/lib/firstPaycheck/constants'
import { PAY_FREQUENCIES, type PayFrequency, type ParsedOffer } from '@/lib/offer-parse/fields'
import { trackDocFieldEdited, stampFirstDocClass } from '@/lib/offer-parse/doc-analytics'

const PAGE = '/first-paycheck-setup'
const TOOL = 'first_paycheck'

const SELECT = 'mt-1 h-11 w-full rounded-md border border-[#D1D5DB] bg-white px-3 text-sm text-[#111827]'

const FREQUENCY_LABELS: Record<PayFrequency, string> = {
  weekly: 'Every week',
  biweekly: 'Every two weeks',
  semimonthly: 'Twice a month',
  monthly: 'Once a month',
}

const money = (n: number) =>
  `$${Math.round(n).toLocaleString('en-US')}`

const dateLabel = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

export function FirstPaycheckTool() {
  const [startDate, setStartDate] = useState('')
  const [salary, setSalary] = useState('')
  const [state, setState] = useState('')
  const [payFrequency, setPayFrequency] = useState<PayFrequency>('semimonthly')
  const [matchRatePct, setMatchRatePct] = useState('100')
  const [matchCapPct, setMatchCapPct] = useState('4')
  const [hsaEligible, setHsaEligible] = useState(false)
  const engaged = useRef(false)
  const completed = useRef(false)
  /** Fields a document filled, so an edit to one is a correction we can learn from. */
  const fromDoc = useRef<Set<string>>(new Set())

  /**
   * The hero's two controls, matching the offer tool's.
   *
   * The button does not compute — the plan recomputes on every keystroke — it
   * carries the visitor to it. The answer sits below six more controls, all of
   * which have working defaults, so without this the person who types one
   * number has no idea the page has already answered them.
   */
  const salaryRef = useRef<HTMLInputElement>(null)

  const scrollTo = useCallback((id: string) => {
    const go = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    go()
    // The first salary reveals the result card and the deadline note beneath
    // it, so the target moves after the scroll starts. Re-aim as it settles.
    ;[500, 1200].forEach((ms) => setTimeout(go, ms))
  }, [])

  const revealPlan = useCallback(() => {
    if (!salary.trim()) {
      salaryRef.current?.focus()
      track('first_paycheck_quickstart_cta', { tool: TOOL, outcome: 'no_salary' })
      return
    }
    track('first_paycheck_quickstart_cta', { tool: TOOL, outcome: 'scrolled_to_plan' })
    scrollTo('fp-plan')
  }, [salary, scrollTo])

  const jumpToUpload = useCallback(() => {
    track('first_paycheck_quickstart_upload_link', { tool: TOOL })
    scrollTo('fp-upload')
  }, [scrollTo])

  const markEngaged = useCallback((field: string) => {
    if (engaged.current) return
    engaged.current = true
    track('tool_engaged', { tool: TOOL, first_field: field })
    track('tool_form_start', { tool: TOOL, page: PAGE })
  }, [])

  const noteEdit = useCallback((field: string) => {
    if (!fromDoc.current.has(field)) return
    trackDocFieldEdited({ fieldKey: field, docClass: 'offer_letter', tool: TOOL })
  }, [])

  /**
   * Fills whatever the document actually contained and leaves the rest alone.
   *
   * Both document kinds land here. An offer letter carries the salary and
   * state; the match formula, the employer HSA and the premium come from the
   * benefits guide, which is the half nobody reads and the reason this tool
   * accepts two files rather than one.
   */
  const applyParsed = useCallback((parsed: ParsedOffer) => {
    const filled = new Set(fromDoc.current)
    if (parsed.baseSalaryAnnual) { setSalary(String(Math.round(parsed.baseSalaryAnnual.value))); filled.add('salary') }
    if (parsed.workStateCode) { setState(parsed.workStateCode.value); filled.add('state') }
    if (parsed.matchRatePct) { setMatchRatePct(String(parsed.matchRatePct.value)); filled.add('match_rate') }
    if (parsed.matchUpToPct) { setMatchCapPct(String(parsed.matchUpToPct.value)); filled.add('match_cap') }
    // An employer HSA contribution only exists on an HSA-eligible plan, so its
    // presence answers the health-plan question without asking it.
    if (parsed.employerHsaAnnual && parsed.employerHsaAnnual.value > 0) { setHsaEligible(true); filled.add('hsa') }
    fromDoc.current = filled
    stampFirstDocClass('offer_letter')
  }, [])

  const salaryNum = useMemo(() => {
    const n = parseFloat(salary.replace(/[$,\s]/g, ''))
    return Number.isFinite(n) && n > 0 ? n : null
  }, [salary])

  /**
   * The API's take-home, once it answers. Until then the local estimate stands,
   * which is the whole point: this tool renders a full plan from one number and
   * cannot wait on a network call to do it.
   */
  const pretaxAnnual = useMemo(() => {
    if (!salaryNum) return 0
    const deferral = (salaryNum * Number(matchCapPct || 0)) / 100
    return deferral + (hsaEligible ? HSA_RECOMMENDED_START : 0)
  }, [salaryNum, matchCapPct, hsaEligible])

  const taxEstimate = useTaxEstimate({
    salary: salaryNum ?? 0,
    state,
    pretaxAnnual,
    local: null,
  })

  const plan = useMemo(() => {
    // Salary alone. State used to be required, which is what put the first
    // answerable question two controls deep — but stateRate() has always
    // fallen back to a 4% blend for a code it does not know, so the gate was
    // withholding an answer the calculation could already produce. The state
    // select is still there, marked optional, and the estimate says when it is
    // running on the blend.
    if (!salaryNum) return null
    return computeFirstPaycheck({
      salaryAnnual: salaryNum,
      stateCode: state,
      payFrequency,
      matchRatePct: Math.max(0, parseFloat(matchRatePct) || 0),
      matchCapPct: Math.max(0, parseFloat(matchCapPct) || 0),
      hsaEligible,
      startDate: startDate || null,
      takeHomeAnnualOverride: taxEstimate ? taxEstimate.netAnnual : undefined,
    })
  }, [salaryNum, state, payFrequency, matchRatePct, matchCapPct, hsaEligible, startDate, taxEstimate])

  if (plan && !completed.current) {
    completed.current = true
    track('tool_completed', {
      tool: 'first_paycheck',
      run_index: nextRunIndex('first_paycheck'),
      has_match: plan.contributionPct > 0,
      hsa_eligible: hsaEligible,
      pay_frequency: payFrequency,
    })
  }

  const rows = plan
    ? [
        {
          k: '401(k) contribution',
          v: `${Number(plan.contributionPct.toFixed(2))}%`,
          d:
            plan.contributionPct > 0
              ? `Captures the full match. ${money(plan.contributionPerCheck)} per check before tax, about ${money(plan.contributionCostPerCheck)} out of take-home.`
              : 'No employer match on this plan, so there is no amount you have to hit. What to contribute is a wider question — the money plan answers it.',
        },
        {
          k: 'Roth or traditional',
          v: plan.rothOrTraditional,
          d:
            plan.rothOrTraditional === 'Traditional'
              ? `After your contributions you land in the ${Math.round(plan.marginalRate * 100)}% bracket, where the deduction today is usually worth more than tax-free growth later.`
              : `After your contributions you land in the ${Math.round(plan.marginalRate * 100)}% bracket. That is likely the lowest rate you will ever pay, so paying it now and never again is usually the stronger side.`,
        },
        ...(hsaEligible
          ? [{
              k: 'HSA contribution',
              v: `${money(plan.hsaPerCheck)} per check`,
              d: `A starting point of ${money(plan.hsaAnnualTarget)} a year, not the ${money(plan.hsaCeilingAnnual)} limit — the deductible is what the HSA is for, so filling it before you have a cash buffer is the wrong order. Pre-tax and FICA-free, so it costs about ${money(plan.hsaCostPerCheck)} out of take-home, cheaper per dollar than the 401(k).`,
            }]
          : []),
        {
          k: 'W-4',
          v: 'Single, no extra withholding',
          d: 'The standard answer for one job and no dependants. If you have a second job, a working spouse or dependants, use the IRS withholding estimator instead — those cases change it.',
        },
        {
          k: 'Your first full paycheck, about',
          v: money(plan.takeHomePerCheck),
          d: `After federal tax, FICA, state, and the contributions above, paid ${FREQUENCY_LABELS[payFrequency].toLowerCase()}. Starting mid-period makes the very first one smaller.`,
        },
      ]
    : []

  return (
    <div className="space-y-4">
      {/* ── The first screen ──────────────────────────────────────────────
          Measured at 375x812: the upload block sat at 509px and the first
          field a visitor could fill — Start date — at 1,140px, 328px below the
          fold. Same shape as the offer tool before it was reordered: everything
          reachable on arrival asked for a document, and the thing that needs
          nothing was off screen.

          Salary is the whole minimum. The headline answer — the percentage to
          type in the 401(k) box — is the match cap and needs neither salary nor
          state; salary is what turns it into dollars a person recognises. */}
      <Card className="border-2 border-[#3F6B42] bg-white">
        <CardContent className="space-y-4 pt-6">
          <div>
            <Label htmlFor="fp-salary" className="text-sm font-semibold text-[#111827]">
              What does the offer pay?
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-gray-400">$</span>
              <Input
                id="fp-salary"
                ref={salaryRef}
                type="text" inputMode="numeric" placeholder="e.g. 72,000" value={salary}
                onChange={(e) => { markEngaged('salary'); noteEdit('salary'); setSalary(e.target.value) }}
                className="h-14 border-[#3F6B42] pl-9 text-2xl font-bold tracking-[-0.02em] text-[#3F6B42]"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                per year
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={revealPlan}
            className="w-full rounded-xl bg-[#3F6B42] py-4 text-[17px] font-bold text-white transition hover:bg-[#35593a]"
          >
            Show me what to type →
          </button>

          <p className="text-center text-[15px] text-gray-600">
            Have the offer letter?{' '}
            <button
              type="button"
              onClick={jumpToUpload}
              className="font-semibold text-[#3F6B42] underline underline-offset-[3px]"
            >
              Upload it and skip the typing.
            </button>
          </p>
        </CardContent>
      </Card>

      <Card className="border-[#D1D5DB] bg-white">
        <CardContent className="pt-6 space-y-5">
          <div id="fp-upload" className="scroll-mt-24">
            <OfferLetterUpload dense onParsed={(parsed) => applyParsed(parsed)} />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-gray-400">Or type it in</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <p className="text-sm text-gray-600">
            Filled in from your documents where we found them, and always editable. No bank account needed.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="fp-start" className="text-[#111827]">Start date</Label>
              {/* Clicking the field opens the picker.
                  A bare date input only opens on the small calendar glyph at
                  its right edge — clicking the text does nothing, which reads
                  as a broken control rather than as a rule about where to
                  click. showPicker() fixes that, is guarded because it throws
                  without a user gesture and does not exist in older Safari,
                  and typing the date still works either way. */}
              <Input
                id="fp-start" type="date" value={startDate}
                onChange={(e) => { markEngaged('start_date'); setStartDate(e.target.value) }}
                onClick={(e) => {
                  const el = e.currentTarget as HTMLInputElement & { showPicker?: () => void }
                  try { el.showPicker?.() } catch { /* no gesture, or unsupported */ }
                }}
                className="mt-1 cursor-pointer border-[#D1D5DB]"
              />
            </div>
            <div>
              <Label htmlFor="fp-state" className="text-[#111827]">
                State <span className="font-normal text-gray-400">(optional)</span>
              </Label>
              <select
                id="fp-state" value={state} className={SELECT}
                onChange={(e) => { markEngaged('state'); noteEdit('state'); setState(e.target.value) }}
              >
                <option value="">Select state</option>
                {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="fp-freq" className="text-[#111827]">Pay frequency</Label>
              <select
                id="fp-freq" value={payFrequency} className={SELECT}
                onChange={(e) => { markEngaged('pay_frequency'); setPayFrequency(e.target.value as PayFrequency) }}
              >
                {(Object.keys(PAY_FREQUENCIES) as PayFrequency[]).map((f) => (
                  <option key={f} value={f}>{FREQUENCY_LABELS[f]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="fp-match-rate" className="text-[#111827]">Employer match</Label>
              <div className="mt-1 flex items-center gap-1.5">
                <Input
                  id="fp-match-rate" type="number" inputMode="decimal" value={matchRatePct}
                  onChange={(e) => { markEngaged('match_rate'); noteEdit('match_rate'); setMatchRatePct(e.target.value) }}
                  className="border-[#D1D5DB]" aria-label="Match rate percent"
                />
                <span className="shrink-0 text-sm text-gray-500">% up to</span>
                <Input
                  id="fp-match-cap" type="number" inputMode="decimal" value={matchCapPct}
                  onChange={(e) => { markEngaged('match_cap'); noteEdit('match_cap'); setMatchCapPct(e.target.value) }}
                  className="border-[#D1D5DB]" aria-label="Match cap percent of salary"
                />
                <span className="shrink-0 text-sm text-gray-500">%</span>
              </div>
            </div>
            <div>
              <Label htmlFor="fp-hsa" className="text-[#111827]">Health plan offered</Label>
              <select
                id="fp-hsa" value={hsaEligible ? 'hdhp' : 'other'} className={SELECT}
                onChange={(e) => { markEngaged('hsa'); noteEdit('hsa'); setHsaEligible(e.target.value === 'hdhp') }}
              >
                <option value="other">PPO or other (no HSA)</option>
                <option value="hdhp">HDHP with HSA</option>
              </select>
            </div>
          </div>

          {plan?.enrollmentDeadline && (
            <div className="rounded-xl bg-[#FBF2E0] px-4 py-3 text-sm leading-relaxed text-[#6B3F00]">
              <strong>Your enrollment window likely closes {dateLabel(plan.enrollmentDeadline)}.</strong>{' '}
              Most employers give about {TYPICAL_ENROLLMENT_WINDOW_DAYS} days from your start date, but plans set
              their own and some are shorter. Check your benefits email for the real date — this one is a guess.
            </div>
          )}
        </CardContent>
      </Card>

      {plan && (
        <Card id="fp-plan" className="scroll-mt-24 border-2 border-[#3F6B42] bg-white">
          <CardContent className="pt-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#3F6B42]">
              What to type into the forms
            </p>
            {/* Rows stack on a phone. Side by side, the value column is
                shrink-0 and some values are sentences — "Single, no extra
                withholding" — so the description beside it got squeezed to a
                clipped line at 375px. The value is the thing being typed into
                a form, so it keeps its emphasis at either width. */}
            <dl className="mt-3">
              {rows.map((r) => (
                <div
                  key={r.k}
                  className="flex flex-col gap-1 border-t border-gray-200 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
                >
                  <div className="min-w-0 sm:order-1">
                    <dt className="text-[15px] font-semibold text-[#111827]">{r.k}</dt>
                    <dd className="mt-0.5 text-[13px] leading-relaxed text-gray-600">{r.d}</dd>
                  </div>
                  <div className="text-[17px] font-extrabold tabular-nums text-[#3F6B42] sm:order-2 sm:shrink-0 sm:text-right">
                    {r.v}
                  </div>
                </div>
              ))}
            </dl>

            {plan.employerMatchAnnual > 0 && (
              <div className="mt-4 rounded-xl bg-[#3F6B42]/[0.06] px-4 py-4">
                <p className="text-[13px] font-semibold text-[#3F6B42]">
                  Match you leave behind by not setting this up
                </p>
                <p className="text-2xl font-extrabold tabular-nums text-[#111827]">
                  {money(plan.employerMatchAnnual)} a year
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  It starts the day you enrol and is not paid retroactively for the months you missed.
                </p>
              </div>
            )}

            {!state && (
              /* Say which assumption is standing in. The plan renders without a
                 state because stateRate() blends to 4%, which is a fair national
                 middle and wrong for any particular person — worth one line and
                 a way to fix it, rather than a silent approximation. */
              <p className="mt-4 rounded-lg bg-[#3F6B42]/[0.06] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[#2f5233]">
                <span className="font-bold">No state set,</span> so this assumes a 4% state tax — about the
                national middle, and wrong for you if you are in Texas or California. Set it below and these
                numbers sharpen.
              </p>
            )}

            <p className="mt-4 text-xs leading-relaxed text-gray-500">
              Estimates for planning, not personalised financial, tax or legal advice. Federal figures are{' '}
              {TAX_YEAR_FIRST_PAYCHECK} single-filer brackets and the standard deduction; state tax is an
              approximate flat rate. Your own portal is the authority on what it accepts.
            </p>

            {/* THE ONE THING THE TOOL CANNOT DO ITSELF.
                Everything above is a number to type; none of it proves the
                number arrived. Checking the first deposit against what was
                elected is the natural next step, it needs the connected
                account this page deliberately does not ask for, and it is the
                only claim on this page that requires signing up — so it is the
                only thing the CTA promises. */}
            <div className="mt-6">
              <AppCta
                tool="first_paycheck"
                eyebrow="Then confirm it landed"
                headline="Check my first paycheck against what I set"
                body="Typing the numbers in is not the same as them taking effect. When your first check lands, WeLeap compares the 401(k) and HSA deductions against what you elected and tells you if something is off."
                buttonLabel="Check my first paycheck →"
                bullets={[
                  'Your elections saved, so you can check them against the deposit',
                  'A nudge if the deductions do not match what you set',
                  'The rest of the plan once the forms are done',
                ]}
                footnote="Free · No card · Bank connection is optional and read-only"
              />
            </div>

            <div className="mt-5">
              <ToolFeedbackQuestionnaire
                page={PAGE}
                tool={TOOL}
                eventName="first_paycheck_feedback_submitted"
                question="Did this tell you what to type?"
                buttonLabels={{ yes: 'Yes', not_sure: 'Partly', no: 'Not really' }}
                onFeedbackSubmitted={() => {}}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
