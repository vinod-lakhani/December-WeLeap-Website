'use client'

/**
 * Smart Purchase Check.
 *
 * "Pay now or pay later?" is a decision, which is what every other tool here
 * answers — rent, offers, payoff. The earlier version of this asked "how much
 * do you owe across your pay-later apps", which is an audit, and an audit only
 * speaks to someone who already suspects they have a problem.
 *
 * Five inputs, deliberately. Everything past that — real emergency-fund
 * progress, retirement contributions, goals — needs the user's actual accounts,
 * and pretending to know it here would be worse than saying so.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AppCta } from '@/components/AppCta'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import {
  recommend,
  type Choice,
  type PurchaseContext,
  type OptionOutcome,
} from '@/lib/purchase/decision'

const PAGE = '/smart-purchase-check'

const money = (n: number, dp?: number) =>
  '$' +
  n.toLocaleString('en-US', {
    minimumFractionDigits: dp ?? (n % 1 === 0 ? 0 : 2),
    maximumFractionDigits: dp ?? (n % 1 === 0 ? 0 : 2),
  })

const CONTEXTS: { value: PurchaseContext; label: string }[] = [
  { value: 'building_ef', label: 'Building an emergency fund' },
  { value: 'ef_set', label: 'Emergency fund is set' },
  { value: 'paying_debt', label: 'Paying down high-interest debt' },
  { value: 'saving_soon', label: 'Saving for something soon' },
  { value: 'investing', label: 'Investing for the future' },
]

const CHOICE_LABEL: Record<Choice, string> = {
  cash: 'Pay cash',
  pay_in_4: 'Pay in 4',
  monthly: 'Monthly plan',
  wait: 'Wait',
}

/** Recommendation styling. "Wait" is amber, never red — it isn't a failure. */
const CHOICE_STYLE: Record<Choice, { border: string; wash: string; eyebrow: string }> = {
  cash: { border: 'border-brand-700', wash: 'bg-brand-50', eyebrow: 'text-brand-700' },
  pay_in_4: { border: 'border-brand-700', wash: 'bg-brand-50', eyebrow: 'text-brand-700' },
  monthly: { border: 'border-brand-700', wash: 'bg-brand-50', eyebrow: 'text-brand-700' },
  wait: { border: 'border-amber-400', wash: 'bg-amber-50', eyebrow: 'text-amber-700' },
}

export function SmartPurchaseTool() {
  const [price, setPrice] = useState('')
  const [cash, setCash] = useState('')
  const [surplus, setSurplus] = useState('')
  const [context, setContext] = useState<PurchaseContext>('building_ef')
  const [hasPayIn4, setHasPayIn4] = useState(true)
  const [hasMonthly, setHasMonthly] = useState(false)
  const [months, setMonths] = useState('12')
  const [apr, setApr] = useState('0')

  const seen = useRef(false)

  /**
   * Second step of the funnel: tool_viewed -> tool_engaged -> tool_completed ->
   * tool_cta_clicked -> cta_click_signup.
   *
   * Fires once per visit, on the first input touched, carrying that field —
   * not per keystroke. This tool had no engagement event at all, so the only
   * thing between "landed" and "clicked the CTA" was silence.
   */
  const engagedRef = useRef(false)
  const markEngaged = useCallback((field: string) => {
    if (engagedRef.current) return
    engagedRef.current = true
    track('tool_engaged', { tool: 'smart_purchase', first_field: field })
  }, [])

  const priceNum = parseFloat(price) || 0
  const cashNum = parseFloat(cash) || 0
  const surplusNum = parseFloat(surplus) || 0

  // Price alone can't answer the question — the whole point is comparing it
  // against what they have. Nothing shows until all three are real.
  const ready = priceNum > 0 && cashNum > 0 && surplusNum > 0

  const result = useMemo(() => {
    if (!ready) return null
    return recommend({
      price: priceNum,
      cashAvailable: cashNum,
      monthlySurplus: surplusNum,
      context,
      hasPayIn4,
      monthlyPlan: hasMonthly
        ? { months: Math.max(1, parseInt(months) || 12), aprPercent: Math.max(0, parseFloat(apr) || 0) }
        : null,
    })
  }, [ready, priceNum, cashNum, surplusNum, context, hasPayIn4, hasMonthly, months, apr])

  /**
   * Third step of the funnel, fired once.
   *
   * `ready` is the tool's own definition of a real answer: price, cash on hand
   * and monthly surplus all present and positive. Nothing renders below the
   * inputs until then — no placeholder recommendation, no defaults standing in
   * for what the user has not said — so the first moment `result` is non-null
   * is the first moment a recommendation exists on screen. That is genuinely
   * later than engagement, which is the whole point: the first field typed and
   * the answer appearing are three fields apart.
   */
  useEffect(() => {
    if (result && !seen.current) {
      seen.current = true
      track('tool_completed', { tool: 'smart_purchase' })
      track('purchase_result_viewed', { page: PAGE, choice: result.choice })
    }
  }, [result])

  const style = result ? CHOICE_STYLE[result.choice] : null

  return (
    <div className="space-y-5">
      {/* ── the purchase ─────────────────────────────────────── */}
      <Card className="border-hairline bg-white">
        <CardContent className="pt-6">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">
            What are you buying?
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">Price</Label>
              <Input
                type="number"
                min="0"
                step="1"
                inputMode="decimal"
                placeholder="e.g. 900"
                value={price}
                onChange={(e) => {
                  markEngaged('price')
                  setPrice(e.target.value)
                }}
                className="mt-1 border-hairline placeholder:text-faint"
              />
            </div>
          </div>

          <p className="mt-5 text-[12.5px] font-bold uppercase tracking-[0.08em] text-faint">
            How can you pay for it?
          </p>
          <div className="mt-2.5 space-y-2.5">
            <label className="flex cursor-pointer items-center gap-2.5 text-[14.5px] text-ink">
              <input
                type="checkbox"
                checked={hasPayIn4}
                onChange={(e) => {
                  markEngaged('has_pay_in_4')
                  setHasPayIn4(e.target.checked)
                }}
                className="h-4 w-4 accent-[#2d6a4f]"
              />
              Interest-free &ldquo;pay in 4&rdquo; is offered
            </label>
            <label className="flex cursor-pointer items-center gap-2.5 text-[14.5px] text-ink">
              <input
                type="checkbox"
                checked={hasMonthly}
                onChange={(e) => {
                  markEngaged('has_monthly_plan')
                  setHasMonthly(e.target.checked)
                }}
                className="h-4 w-4 accent-[#2d6a4f]"
              />
              A monthly payment plan is offered
            </label>
            {hasMonthly && (
              <div className="ml-7 flex flex-wrap items-center gap-2.5 text-[14px] text-subtle">
                <Input
                  type="number"
                  min="1"
                  max="60"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) => {
                    markEngaged('plan_months')
                    setMonths(e.target.value)
                  }}
                  className="h-9 w-20 border-hairline"
                />
                <span>months at</span>
                <Input
                  type="number"
                  min="0"
                  max="40"
                  step="0.01"
                  inputMode="decimal"
                  value={apr}
                  onChange={(e) => {
                    markEngaged('plan_apr')
                    setApr(e.target.value)
                  }}
                  className="h-9 w-24 border-hairline"
                />
                <span>% APR — 0 if it&apos;s a 0% offer</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── their position ───────────────────────────────────── */}
      <Card className="border-hairline bg-white">
        <CardContent className="pt-6">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">
            Where you&apos;re at
          </h2>
          <p className="mt-1 text-[13.5px] text-subtle">
            Rough numbers are fine — this is about the shape of the decision, not the cents.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">
                Cash and savings you could reach today
              </Label>
              <Input
                type="number"
                min="0"
                step="100"
                inputMode="decimal"
                placeholder="e.g. 4,500"
                value={cash}
                onChange={(e) => {
                  markEngaged('cash_available')
                  setCash(e.target.value)
                }}
                className="mt-1 border-hairline placeholder:text-faint"
              />
            </div>
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">
                Left over in a typical month
              </Label>
              <Input
                type="number"
                min="0"
                step="50"
                inputMode="decimal"
                placeholder="e.g. 1,200"
                value={surplus}
                onChange={(e) => {
                  markEngaged('monthly_surplus')
                  setSurplus(e.target.value)
                }}
                className="mt-1 border-hairline placeholder:text-faint"
              />
            </div>
          </div>
          <div className="mt-3">
            <Label className="text-[12.5px] font-semibold text-ink">
              Right now, your money is mostly going towards
            </Label>
            <select
              value={context}
              onChange={(e) => {
                markEngaged('context')
                setContext(e.target.value as PurchaseContext)
              }}
              className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[14.5px] text-ink sm:max-w-sm"
            >
              {CONTEXTS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* ── the answer ───────────────────────────────────────── */}
      {result && style && (
        <>
          <div className={cn('rounded-card border-2 p-6 md:p-7', style.border, style.wash)}>
            <p className={cn('text-[11px] font-bold uppercase tracking-[0.1em]', style.eyebrow)}>
              The smarter move
            </p>
            <h2 className="mt-2 text-[clamp(1.6rem,3.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              {result.headline}
            </h2>
            <p className="mt-3 text-[15.5px] leading-relaxed text-ink-soft">{result.reason}</p>
            {result.tradeoff && (
              <p className="mt-3 border-t border-black/10 pt-3 text-[14px] text-subtle">
                <span className="font-semibold text-ink">What it costs you:</span>{' '}
                {result.tradeoff}
              </p>
            )}
          </div>

          <Card className="border-hairline bg-white">
            <CardContent className="pt-6">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">
                Side by side
              </h2>
              <p className="mt-1 text-[13.5px] text-subtle">
                Disagree with us if you like — here&apos;s what each one actually does.
              </p>
              <div className="mt-4 space-y-3">
                {result.options.map((o) => (
                  <OptionRow key={o.choice} o={o} chosen={o.choice === result.choice} />
                ))}
              </div>
            </CardContent>
          </Card>

          <AppCta
            tool="smart_purchase"
            prefill={{ purchase_price: Math.round(priceNum) }}
            eyebrow="This answer used five numbers"
            headline="See what this purchase does to your actual plan."
            body="Connect your accounts and Ribbit can weigh it against your real savings, goals and contributions — not the five things you just typed."
            bullets={[
              'Your real emergency fund, goals and contributions in the answer',
              'Every plan you already have, counted automatically',
              'A weekly focus, so the next payment is never a surprise',
            ]}
            image={{
              src: '/images/product/setup-checklist.png',
              alt: 'WeLeap setup checklist showing a plan being built',
              width: 1720,
              height: 680,
            }}
            buttonLabel="Start my plan →"
          />

          <p className="text-center text-[12px] leading-relaxed text-faint">
            Estimates only, based on the five figures you entered. WeLeap is not a registered
            investment adviser and does not provide personalised investment advice.
          </p>
        </>
      )}
    </div>
  )
}

function OptionRow({ o, chosen }: { o: OptionOutcome; chosen: boolean }) {
  const unusable = !o.available || !o.fitsSurplus
  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        chosen ? 'border-brand-700 bg-brand-50' : 'border-hairline bg-canvas'
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-[15.5px] font-bold text-ink">
          {CHOICE_LABEL[o.choice]}
          {chosen && (
            <span className="ml-2 rounded-full bg-brand-700 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-white">
              Recommended
            </span>
          )}
        </span>
        <span className="text-[15px] font-bold text-ink tabular-nums">
          {money(o.totalCost, 2)}
          {o.extraCost > 0 && (
            <span className="ml-1.5 text-[13px] font-semibold text-orange-600">
              +{money(o.extraCost, 2)}
            </span>
          )}
        </span>
      </div>
      <div className="mt-1.5 grid gap-x-6 gap-y-1 text-[13px] text-subtle sm:grid-cols-3">
        <span>
          Today: <span className="font-semibold text-ink tabular-nums">{money(o.dueToday, 2)}</span>
        </span>
        <span>
          Cash after:{' '}
          <span className="font-semibold text-ink tabular-nums">{money(o.cashAfter, 2)}</span>
        </span>
        <span>{o.commitment}</span>
      </div>
      {unusable && (
        <p className="mt-2 text-[12.5px] font-semibold text-orange-600">
          {!o.available
            ? "You don't have the cash on hand for this one."
            : "The payments don't fit inside your monthly surplus."}
        </p>
      )}
    </div>
  )
}
