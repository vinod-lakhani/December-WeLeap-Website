'use client'

/**
 * Money Age — the four-tap front door.
 *
 * Two sequencing decisions carry this page and both are deliberate:
 *
 * 1. A PROVISIONAL NUMBER AFTER THREE TAPS. Age, income band, savings band, and
 *    something comes back. Everything after that is refinement on a number the
 *    visitor already owns, which is the only honest answer to an audience that
 *    leaves before a fifth field.
 *
 * 2. THE SLIDER IS THE PAYOFF, not a form field. It asks for the one input
 *    nobody can self-report, and it answers live. Dragging it is the product
 *    demo — a contribution change repricing a life, in the second it is made.
 *
 * The result leads with the DELTA, never the bare age. Every comparable metric
 * (fitness age, lung age) runs lower-is-better; this one is inverted, so "31"
 * alone reads as bad news to anyone who has not used the tool — which is every
 * recipient of a share.
 *
 * See docs/specs/money-age-v2.md.
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { track } from '@/lib/analytics'
import { nextRunIndex } from '@/lib/run-index'
import { ToolFeedbackQuestionnaire } from '@/components/ToolFeedbackQuestionnaire'
import { computeMoneyAge, priceMove } from '@/lib/moneyAge/calculation'
import {
  INCOME_BANDS,
  POSITION_BANDS,
  DEBT_BANDS,
  POSITION_BAND_CEILING,
  bandLabel,
  type Band,
} from '@/lib/moneyAge/bands'
import { REFERENCE_SAVINGS_RATE, CAREER_START_AGE } from '@/lib/moneyAge/constants'

const PAGE = '/whats-my-money-age'
const TOOL = 'money_age'

/** Where the slider starts. The reference rate, so the default is "typical". */
const DEFAULT_RATE_PCT = Math.round(REFERENCE_SAVINGS_RATE * 100)
/** Same number the method section publishes. 12, not 12.1, misquotes it. */
const REFERENCE_RATE_LABEL = `${(REFERENCE_SAVINGS_RATE * 100).toFixed(1)}%`
/**
 * 25, not 30. Above about 26% the rate credit hits its ±10-year clamp, so the
 * last few points of travel moved nothing — a slider that stops responding
 * reads as broken. Found by dragging it, not by reading the formula.
 */
const MAX_RATE_PCT = 25

function BandRow({
  bands,
  value,
  onPick,
  name,
}: {
  bands: readonly Band[]
  value: number | null
  onPick: (v: number) => void
  name: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={name}>
      {bands.map((b) => {
        const selected = value === b.value
        return (
          <button
            key={b.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(b.value)}
            className={cn(
              'rounded-xl border-2 px-4 py-2.5 text-sm font-semibold transition',
              selected
                ? 'border-[#3F6B42] bg-[#3F6B42] text-white'
                : 'border-[#D1D5DB] bg-white text-[#111827] hover:border-[#3F6B42]'
            )}
          >
            {b.label}
          </button>
        )
      })}
    </div>
  )
}

function Answered({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return (
    <button
      type="button"
      onClick={onEdit}
      className="flex w-full items-baseline justify-between gap-3 rounded-lg px-1 py-2 text-left hover:bg-gray-50"
    >
      <span className="text-sm text-gray-500">{label}</span>
      <span className="flex items-baseline gap-2">
        <span className="text-sm font-semibold text-[#111827]">{value}</span>
        <span className="text-xs text-[#3F6B42]">Edit</span>
      </span>
    </button>
  )
}

export function MoneyAgeTool() {
  const [age, setAge] = useState('')
  const [income, setIncome] = useState<number | null>(null)
  const [positionBand, setPositionBand] = useState<number | null>(null)
  /**
   * An exact figure, for people the bands cannot represent.
   *
   * Bands are the fast path and stay the default, but no band is right for a
   * $2M portfolio — and each doubling of savings is worth two to three years of
   * money age, so the top band carries years of error however it is drawn. When
   * this is filled it wins over the band.
   */
  const [positionExact, setPositionExact] = useState('')
  const [debt, setDebt] = useState<number | null>(null)
  const [ratePct, setRatePct] = useState(DEFAULT_RATE_PCT)
  const [rateTouched, setRateTouched] = useState(false)
  const [finished, setFinished] = useState(false)
  const engaged = useRef(false)
  const sliderMoves = useRef(0)
  const completed = useRef(false)

  const ageNum = useMemo(() => {
    const n = parseInt(age, 10)
    return Number.isFinite(n) && n >= 18 && n <= 45 ? n : null
  }, [age])

  const markEngaged = useCallback((field: string) => {
    if (engaged.current) return
    engaged.current = true
    track('tool_engaged', { tool: TOOL, first_field: field })
    track('tool_form_start', { tool: TOOL, page: PAGE })
  }, [])

  const exactNum = useMemo(() => {
    if (!positionExact.trim()) return null
    const n = Math.round(parseFloat(positionExact.replace(/[$,\s]/g, '')))
    return Number.isFinite(n) && n >= 0 && n <= 100_000_000 ? n : null
  }, [positionExact])

  /** The typed figure wins when present; otherwise the tapped band. */
  const position = exactNum ?? positionBand

  /** Everything needed for a number. Debt is optional — it defaults to none. */
  const ready = ageNum != null && income != null && position != null

  const result = useMemo(() => {
    if (!ready) return null
    return computeMoneyAge({
      age: ageNum,
      income,
      position: position - (debt ?? 0),
      savingsRate: ratePct / 100,
    })
  }, [ready, ageNum, income, position, debt, ratePct])

  /**
   * The provisional number, shown the moment position is answered.
   *
   * Deliberately fires before the debt question and before the slider, on the
   * default rate. It is the whole reason this page can hold someone who would
   * not fill in five fields.
   */
  const provisionalFired = useRef(false)
  if (result && !provisionalFired.current) {
    provisionalFired.current = true
    track('provisional_shown', { tool: TOOL, provisional_age: result.moneyAge })
  }

  const onSlider = useCallback(
    (v: number) => {
      markEngaged('savings_rate')
      setRateTouched(true)
      sliderMoves.current += 1
      setRatePct(v)
    },
    [markEngaged]
  )

  const finish = useCallback(() => {
    if (!result || !ageNum || income == null || position == null) return
    setFinished(true)
    if (completed.current) return
    completed.current = true
    track('tool_completed', {
      // Literal, not TOOL: lib/tool-instrumentation.test.ts reads this file as
      // text to prove every registered tool wires the funnel, and it cannot
      // resolve a const.
      tool: 'money_age',
      run_index: nextRunIndex(TOOL),
      age: ageNum,
      money_age: result.moneyAge,
      delta_years: result.deltaYears,
      income_band: bandLabel(INCOME_BANDS, income),
      position_band: exactNum != null ? 'exact' : bandLabel(POSITION_BANDS, positionBand),
      position_exact_used: exactNum != null,
      debt_band: bandLabel(DEBT_BANDS, debt),
      savings_rate: ratePct,
      slider_moves: sliderMoves.current,
      rate_touched: rateTouched,
    })
  }, [result, ageNum, income, position, positionBand, exactNum, debt, ratePct, rateTouched])

  /**
   * The one move, priced in years.
   *
   * Capped at the employer-match increment rather than the slider maximum,
   * because the move has to be one somebody could actually make on Monday.
   * `priceMove` returns null when nothing changes, and that is rendered as
   * "this doesn't move the number" rather than manufactured into a delta.
   */
  const move = useMemo(() => {
    if (!result || !ageNum || income == null || position == null) return null
    const target = Math.min(ratePct / 100 + 0.05, 0.3)
    return priceMove(
      { age: ageNum, income, position: position - (debt ?? 0), savingsRate: ratePct / 100 },
      { savingsRate: target }
    )
  }, [result, ageNum, income, position, debt, ratePct])

  /**
   * The attribution rows, forced to reconcile.
   *
   * `savedYears` is rounded honestly; `rateYears` is then whatever is left over
   * to reach the money age. Any rounding error lands on the rate term, which is
   * the estimated one — putting it on the balance term would misstate the
   * figure the reader actually knows.
   */
  const CAREER_START = CAREER_START_AGE
  const savedYears = result ? Math.round(result.positionYears) : 0
  const rateYears = result ? result.moneyAge - CAREER_START_AGE - savedYears : 0
  const signed = (n: number) => `${n >= 0 ? '+' : ''}${n} ${Math.abs(n) === 1 ? 'year' : 'years'}`

  const deltaLine = (d: number) =>
    d === 0
      ? 'Your money is exactly your own age.'
      : d > 0
        ? `Your money is ${d} ${d === 1 ? 'year' : 'years'} ahead of you.`
        : `Your money is ${Math.abs(d)} ${Math.abs(d) === 1 ? 'year' : 'years'} behind you.`

  return (
    <div className="space-y-4">
      {/* Q1 — age */}
      <Card className="border-[#D1D5DB] bg-white">
        <CardContent className="pt-6">
          {ageNum != null && (income != null || position != null) ? (
            <Answered label="Your age" value={`${ageNum}`} onEdit={() => setIncome(null)} />
          ) : (
            <>
              <Label htmlFor="ma-age" className="text-base font-bold text-[#111827]">
                How old are you?
              </Label>
              <Input
                id="ma-age"
                type="number"
                inputMode="numeric"
                min={18}
                max={45}
                placeholder="e.g. 27"
                value={age}
                onChange={(e) => {
                  markEngaged('age')
                  setAge(e.target.value)
                }}
                className="mt-2 max-w-[9rem] border-[#D1D5DB] text-lg"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* Q2 — income */}
      {ageNum != null && (
        <Card className="border-[#D1D5DB] bg-white">
          <CardContent className="pt-6">
            {income != null && position != null ? (
              <Answered
                label="You earn"
                value={bandLabel(INCOME_BANDS, income) ?? ''}
                onEdit={() => setPositionBand(null)}
              />
            ) : (
              <>
                <p className="text-base font-bold text-[#111827]">
                  Roughly what do you earn a year, before tax?
                </p>
                <div className="mt-3">
                  <BandRow
                    bands={INCOME_BANDS}
                    value={income}
                    name="Annual income"
                    onPick={(v) => {
                      markEngaged('income')
                      setIncome(v)
                    }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Q3 — position. The provisional number lands right after this. */}
      {ageNum != null && income != null && (
        <Card className="border-[#D1D5DB] bg-white">
          <CardContent className="pt-6">
            <p className="text-base font-bold text-[#111827]">
              Everything you&apos;ve got saved, added up.
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Retirement, investments, savings, cash. A rough number is fine — this is the one that
              moves the answer most.
            </p>
            <div className="mt-3">
              <BandRow
                bands={POSITION_BANDS}
                value={exactNum != null ? null : positionBand}
                name="Total saved"
                onPick={(v) => {
                  markEngaged('position')
                  setPositionBand(v)
                  // A tap is an explicit answer, so it clears any typed figure
                  // rather than being silently overridden by it.
                  setPositionExact('')
                }}
              />
            </div>
            {/* The ceiling escape hatch. Above the top band the error is years,
                not rounding, and it lands on the people whose result is worth
                sharing — so precision is offered rather than assumed away. */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Label htmlFor="ma-exact" className="text-xs text-gray-500">
                Or enter the exact amount
              </Label>
              <Input
                id="ma-exact"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 320,000"
                value={positionExact}
                onChange={(e) => {
                  markEngaged('position_exact')
                  setPositionExact(e.target.value)
                }}
                className="h-9 max-w-[10rem] border-[#D1D5DB] text-sm"
              />
            </div>
            {exactNum != null && exactNum > POSITION_BAND_CEILING && (
              <p className="mt-2 text-xs text-[#3F6B42]">
                Above ${POSITION_BAND_CEILING.toLocaleString()} the bands stop being precise, so
                we&apos;re using your figure.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* The provisional reveal. Three taps in. */}
      {result && !finished && (
        <div className="rounded-xl border-2 border-[#3F6B42] bg-[#3F6B42]/[0.04] px-5 py-4">
          <p className="text-sm text-gray-600">So far, your money age is</p>
          <p className="text-4xl font-bold text-[#3F6B42]">{result.moneyAge}</p>
          <p className="mt-1 text-sm text-[#111827]">{deltaLine(result.deltaYears)}</p>
          <p className="mt-1 text-xs text-gray-500">
            One more question and a slider to go — both of them move this.
          </p>
        </div>
      )}

      {/* Q4 — debt */}
      {result && !finished && (
        <Card className="border-[#D1D5DB] bg-white">
          <CardContent className="pt-6">
            <p className="text-base font-bold text-[#111827]">Owe anything on credit cards?</p>
            <div className="mt-3">
              <BandRow
                bands={DEBT_BANDS}
                value={debt}
                name="Credit card debt"
                onPick={(v) => {
                  markEngaged('debt')
                  setDebt(v)
                }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Q5 — the slider */}
      {result && debt != null && !finished && (
        <Card className="border-[#D1D5DB] bg-white">
          <CardContent className="pt-6">
            <p className="text-base font-bold text-[#111827]">
              How much of your pay are you putting away?
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Retirement contributions, savings, all of it — including anything your employer puts
              in.
            </p>
            <input
              id="ma-rate"
              type="range"
              min={0}
              max={MAX_RATE_PCT}
              step={1}
              value={ratePct}
              onChange={(e) => onSlider(parseInt(e.target.value, 10))}
              aria-label="Share of pay saved"
              className="mt-4 w-full accent-[#3F6B42]"
            />
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-2xl font-bold text-[#111827]">{ratePct}%</span>
              <span className="text-sm text-gray-600">
                money age <span className="font-bold text-[#3F6B42]">{result.moneyAge}</span>
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Not sure? Most people underestimate this. Drag it and see.
            </p>
            <Button
              onClick={finish}
              className="mt-4 w-full bg-[#3F6B42] text-white hover:bg-[#3F6B42]/90 sm:w-auto"
            >
              See my result →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* The result */}
      {result && finished && (
        <div className="space-y-4">
          <Card className="border-2 border-[#3F6B42] bg-white">
            <CardContent className="pt-6 text-center">
              {/* The DELTA leads. The age is the supporting detail, not the
                  headline — see the file comment. */}
              <p className="text-5xl font-bold text-[#3F6B42]">
                {result.deltaYears === 0
                  ? 'On track'
                  : `${result.deltaYears > 0 ? '+' : ''}${result.deltaYears} ${
                      Math.abs(result.deltaYears) === 1 ? 'year' : 'years'
                    }`}
              </p>
              <p className="mt-2 text-lg font-semibold text-[#111827]">
                {deltaLine(result.deltaYears)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Your money age is <span className="font-bold">{result.moneyAge}</span>. Someone
                whose pay grew the way yours did, saving {REFERENCE_RATE_LABEL} of it all the way,
                would be {result.moneyAge} before they held what you hold.
              </p>
            </CardContent>
          </Card>

          <Card className="border-[#D1D5DB] bg-white">
            <CardContent className="pt-6">
              <p className="text-sm font-bold text-[#111827]">Where it comes from</p>
              {/* These must sum to the money age. Rounding each term on its own
                  printed "+1" and "+4" next to an age of 28 — and 22+1+4 is 27.
                  The second term is derived from the first so the column always
                  reconciles, which is the only sum a reader can check. */}
              <dl className="mt-3 space-y-2">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-gray-700">Starting point</dt>
                  <dd className="text-sm font-bold text-[#111827]">{CAREER_START}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-gray-700">What you&apos;ve saved</dt>
                  <dd className="text-sm font-bold text-[#111827]">{signed(savedYears)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-sm text-gray-700">What you&apos;re putting away</dt>
                  <dd className="text-sm font-bold text-[#111827]">{signed(rateYears)}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 border-t border-gray-200 pt-2">
                  <dt className="text-sm font-semibold text-[#111827]">Your money age</dt>
                  <dd className="text-sm font-bold text-[#3F6B42]">{result.moneyAge}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-gray-500">
                On track for your age is about ${Math.round(result.onTrackPosition).toLocaleString()}{' '}
                saved.
              </p>
            </CardContent>
          </Card>

          {/* The one move. Null means the move genuinely changes nothing, and
              that is said rather than dressed up — the honest null cases are
              what make the non-zero ones believable. */}
          <Card className="border-[#D1D5DB] bg-white">
            <CardContent className="pt-6">
              <p className="text-base font-bold text-[#111827]">
                Put away 5% more of your pay.
              </p>
              {move ? (
                <>
                  <p className="mt-3 text-center text-3xl font-bold text-[#3F6B42]">
                    {move.before} → {move.after}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    That is {move.gain} {move.gain === 1 ? 'year' : 'years'}
                    {result.deltaYears < 0 && move.gain >= Math.abs(result.deltaYears)
                      ? ' — enough to close the gap entirely.'
                      : result.deltaYears < 0
                        ? `, which closes ${move.gain} of the ${Math.abs(result.deltaYears)} you are behind.`
                        : ' further ahead.'}{' '}
                    If your employer matches, some of that 5% is theirs rather than yours.
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">
                  At your numbers this doesn&apos;t move your money age enough to show. It still
                  changes what you hold — it just needs longer to register here.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Block five — one CTA.
              No prefill params. The money plan needs salaryAnnual AND state
              AND intent before it will accept any of them, and this page never
              asks for state — so a partial prefill returns null and the plan
              starts cold anyway. Passing them would look wired without being
              wired, which is worse than a plain link. Either add a state
              question here or relax that guard; until then this is honest. */}
          <div className="rounded-xl border-2 border-[#3F6B42] bg-white px-5 py-5">
            <p className="text-lg font-bold text-[#111827]">
              See what order to do the rest in.
            </p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              There are four more moves after this one and they have an order — match, buffer,
              debt, retirement. The plan works out which of them your money should reach first.
            </p>
            <a
              href="/how-should-i-split-my-paycheck"
              onClick={() =>
                track('tool_cta_clicked', { tool: 'money_age', target: 'money_plan' })
              }
              className="mt-4 inline-block rounded-xl bg-[#3F6B42] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#3F6B42]/90"
            >
              Build my plan →
            </a>
            <p className="mt-2 text-xs text-gray-500">Free · 2 minutes · No card.</p>
          </div>

          <ToolFeedbackQuestionnaire
            page={PAGE}
            tool={TOOL}
            eventName="money_age_feedback_submitted"
            question="Does this feel about right?"
            buttonLabels={{ yes: 'Yes', not_sure: 'Not sure', no: 'Not for me' }}
            onFeedbackSubmitted={() => {}}
          />
        </div>
      )}
    </div>
  )
}
