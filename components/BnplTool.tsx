'use client'

/**
 * BNPL Reality Check.
 *
 * Klarna shows you Klarna, Afterpay shows you Afterpay. The whole point of
 * this tool is the number none of them will show you: the total, and what it
 * does to the paycheck it lands on.
 *
 * All arithmetic lives in lib/bnpl/calculation.ts so it can be reasoned about
 * separately; see that file for what was corrected from the prototype.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { AppCta } from '@/components/AppCta'
import { track } from '@/lib/analytics'
import { cn } from '@/lib/utils'
import { PROVIDERS, providerFee, providerNote, FEES_VERIFIED_ON } from '@/lib/bnpl/providers'
import {
  buildSchedule,
  cardInterest,
  countBetween,
  dueBeforePayday,
  lateFeeExposure,
  localISODate,
  paycheckClaim,
  parseDateInput,
  startOfToday,
  sumBetween,
  verdict,
  DAY_MS,
  type BnplPlan,
  type Cadence,
} from '@/lib/bnpl/calculation'

const PAGE = '/bnpl-reality-check'

const money = (n: number, dp = 0) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })

/** Severity → the token pair used for the verdict banner and the meter. */
const SEVERITY_STYLE: Record<string, { wash: string; dot: string; bar: string; track: string }> = {
  steady: { wash: 'bg-brand-50', dot: 'bg-brand-700', bar: 'bg-brand-700', track: 'bg-brand-100' },
  stacking: { wash: 'bg-amber-50', dot: 'bg-amber-500', bar: 'bg-amber-500', track: 'bg-amber-100' },
  stretched: { wash: 'bg-orange-50', dot: 'bg-orange-500', bar: 'bg-orange-500', track: 'bg-orange-100' },
  overloaded: { wash: 'bg-red-50', dot: 'bg-red-500', bar: 'bg-red-500', track: 'bg-red-100' },
}

interface Row {
  id: string
  provider: string
  amount: string
  installmentsLeft: string
  cadence: string
  nextDue: string
}

let seq = 0
const blankRow = (offsetDays = 7): Row => ({
  id: `r${++seq}`,
  provider: PROVIDERS[0].name,
  amount: '',
  installmentsLeft: '3',
  cadence: '14',
  nextDue: localISODate(offsetDays),
})

export function BnplTool() {
  // Starts empty. The prototype shipped three pre-filled plans, which meant a
  // first-time visitor saw invented numbers presented as their own — and every
  // pageview counted as an engaged session. "See an example" is opt-in instead.
  const [rows, setRows] = useState<Row[]>([blankRow()])
  const [takeHome, setTakeHome] = useState('')
  const [payFreq, setPayFreq] = useState('14')
  const [payDate, setPayDate] = useState('')
  const [onCard, setOnCard] = useState(false)
  const [cardApr, setCardApr] = useState('24.99')

  const resultsSeen = useRef(false)

  const update = useCallback((id: string, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }, [])

  const plans: BnplPlan[] = useMemo(
    () =>
      rows
        .map((r) => ({
          id: r.id,
          provider: r.provider,
          amount: parseFloat(r.amount) || 0,
          installmentsLeft: Math.max(1, parseInt(r.installmentsLeft) || 1),
          cadence: (parseInt(r.cadence) || 14) as Cadence,
          nextDue: parseDateInput(r.nextDue),
        }))
        .filter((p) => p.amount > 0),
    [rows]
  )

  const today = useMemo(() => startOfToday(), [])
  const schedule = useMemo(() => buildSchedule(plans, today), [plans, today])

  const totalOwed = useMemo(() => schedule.reduce((s, p) => s + p.amount, 0), [schedule])
  const providerCount = useMemo(() => new Set(plans.map((p) => p.provider)).size, [plans])

  const in14 = useMemo(
    () => sumBetween(schedule, today, new Date(today.getTime() + 14 * DAY_MS)),
    [schedule, today]
  )
  const in14Count = useMemo(
    () => countBetween(schedule, today, new Date(today.getTime() + 14 * DAY_MS)),
    [schedule, today]
  )

  const freqNum = parseInt(payFreq) || 14
  const payDateObj = useMemo(() => parseDateInput(payDate), [payDate])
  const claim = useMemo(
    () => paycheckClaim(schedule, parseFloat(takeHome) || 0, freqNum, payDateObj, today),
    [schedule, takeHome, freqNum, payDateObj, today]
  )
  const beforePayday = useMemo(
    () => dueBeforePayday(schedule, payDateObj, freqNum, today),
    [schedule, payDateObj, freqNum, today]
  )

  const fees = useMemo(() => lateFeeExposure(plans, providerFee), [plans])
  const card = useMemo(
    () => cardInterest(schedule, onCard ? parseFloat(cardApr) || 0 : 0, today),
    [schedule, onCard, cardApr, today]
  )

  const v = useMemo(
    () => verdict(claim?.percent ?? null, plans.length, providerCount),
    [claim, plans.length, providerCount]
  )
  const sev = SEVERITY_STYLE[v.severity]

  const hasResults = plans.length > 0

  useEffect(() => {
    if (hasResults && !resultsSeen.current) {
      resultsSeen.current = true
      track('bnpl_results_viewed', { page: PAGE, plans: plans.length, providers: providerCount })
    }
  }, [hasResults, plans.length, providerCount])

  // 8 weekly buckets
  const weeks = useMemo(() => {
    const w = new Array(8).fill(0)
    for (const p of schedule) {
      const i = Math.floor((p.date.getTime() - today.getTime()) / DAY_MS / 7)
      if (i >= 0 && i < 8) w[i] += p.amount
    }
    return w
  }, [schedule, today])
  const weekMax = Math.max(...weeks, 1)

  const paydayWeeks = useMemo(() => {
    const s = new Set<number>()
    if (!payDateObj) return s
    let d = new Date(payDateObj)
    let guard = 0
    while ((d.getTime() - today.getTime()) / DAY_MS < 56 && guard++ < 60) {
      const i = Math.floor((d.getTime() - today.getTime()) / DAY_MS / 7)
      if (i >= 0) s.add(i)
      d = new Date(d.getTime() + freqNum * DAY_MS)
    }
    return s
  }, [payDateObj, freqNum, today])

  const loadExample = () => {
    seq = 0
    setRows([
      { ...blankRow(3), provider: 'Klarna', amount: '34.50', installmentsLeft: '3', cadence: '14' },
      { ...blankRow(5), provider: 'Afterpay', amount: '22', installmentsLeft: '2', cadence: '14' },
      { ...blankRow(12), provider: 'Affirm', amount: '48', installmentsLeft: '4', cadence: '30' },
    ])
    track('bnpl_example_loaded', { page: PAGE })
  }

  return (
    <div className="space-y-5">
      {/* ── plans ─────────────────────────────────────────────── */}
      <Card className="border-hairline bg-white">
        <CardContent className="pt-6">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">Your active plans</h2>
          <p className="mt-1 text-[13.5px] text-subtle">
            One row per purchase you&apos;re still paying off. Rough guesses are fine.
          </p>

          <div className="mt-5 space-y-4">
            {rows.map((r, idx) => (
              <div key={r.id} className="rounded-xl border border-hairline bg-canvas p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-faint">
                    Plan {idx + 1}
                  </span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}
                      className="rounded-md px-2 py-1 text-[13px] font-semibold text-faint transition hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="lg:col-span-2">
                    <Label className="text-[12.5px] font-semibold text-ink">App</Label>
                    <select
                      value={r.provider}
                      onChange={(e) => update(r.id, { provider: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[14.5px] text-ink"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-[12.5px] font-semibold text-ink">Each payment</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="35"
                      value={r.amount}
                      onChange={(e) => update(r.id, { amount: e.target.value })}
                      className="mt-1 border-hairline"
                    />
                  </div>
                  <div>
                    <Label className="text-[12.5px] font-semibold text-ink">Payments left</Label>
                    <Input
                      type="number"
                      min="1"
                      max="36"
                      inputMode="numeric"
                      value={r.installmentsLeft}
                      onChange={(e) => update(r.id, { installmentsLeft: e.target.value })}
                      className="mt-1 border-hairline"
                    />
                  </div>
                  <div>
                    <Label className="text-[12.5px] font-semibold text-ink">How often</Label>
                    <select
                      value={r.cadence}
                      onChange={(e) => update(r.id, { cadence: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[14.5px] text-ink"
                    >
                      <option value="14">Every 2 weeks</option>
                      <option value="7">Weekly</option>
                      <option value="30">Monthly</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label className="text-[12.5px] font-semibold text-ink">Next payment due</Label>
                    <Input
                      type="date"
                      value={r.nextDue}
                      onChange={(e) => update(r.id, { nextDue: e.target.value })}
                      className="mt-1 border-hairline"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setRows((rs) => [...rs, blankRow(7)])}
              className="rounded-full border border-dashed border-brand-200 px-5 py-2.5 text-[14px] font-bold text-brand-700 transition hover:bg-brand-700/5"
            >
              + Add another plan
            </button>
            {!hasResults && (
              <button
                type="button"
                onClick={loadExample}
                className="rounded-full px-4 py-2.5 text-[14px] font-semibold text-subtle underline-offset-2 transition hover:text-ink hover:underline"
              >
                See an example
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── paycheck ──────────────────────────────────────────── */}
      <Card className="border-hairline bg-white">
        <CardContent className="pt-6">
          <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">
            Your paycheck{' '}
            <span className="text-[14px] font-medium text-faint">(optional)</span>
          </h2>
          <p className="mt-1 text-[13.5px] text-subtle">
            Tells you how much of the next one is already spoken for.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">Take-home per paycheck</Label>
              <Input
                type="number"
                min="0"
                step="50"
                inputMode="decimal"
                placeholder="2,100"
                value={takeHome}
                onChange={(e) => setTakeHome(e.target.value)}
                className="mt-1 border-hairline"
              />
            </div>
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">How often</Label>
              <select
                value={payFreq}
                onChange={(e) => setPayFreq(e.target.value)}
                className="mt-1 w-full rounded-lg border border-hairline bg-white px-3 py-2 text-[14.5px] text-ink"
              >
                <option value="14">Every 2 weeks</option>
                <option value="7">Weekly</option>
                <option value="15">Twice a month</option>
                <option value="30">Monthly</option>
              </select>
            </div>
            <div>
              <Label className="text-[12.5px] font-semibold text-ink">Next payday</Label>
              <Input
                type="date"
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="mt-1 border-hairline"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── results ───────────────────────────────────────────── */}
      {hasResults && (
        <>
          <div className={cn('flex items-start gap-3 rounded-card border border-hairline p-4', sev.wash)}>
            <span className={cn('mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full', sev.dot)} />
            <p className="text-[15px] font-bold text-ink">
              {v.label} <span className="font-normal text-subtle">— {v.note}</span>
            </p>
          </div>

          <Card className="border-hairline bg-white">
            <CardContent className="pt-6">
              <div className="text-[14px] text-subtle">Still owed across all your plans</div>
              <div className="mt-1 text-[clamp(2.6rem,6vw,3.4rem)] font-extrabold leading-none tracking-[-0.03em] text-ink tabular-nums">
                {money(totalOwed, totalOwed < 1000 ? 2 : 0)}
              </div>
              <div className="mt-2 text-[13px] text-faint">
                {plans.length} plan{plans.length === 1 ? '' : 's'} · {providerCount} app
                {providerCount === 1 ? '' : 's'} · {schedule.length} payment
                {schedule.length === 1 ? '' : 's'} still to go
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-hairline bg-white">
              <CardContent className="pt-6">
                <div className="text-[13.5px] text-subtle">Leaving your account in the next 14 days</div>
                <div className="mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-ink tabular-nums">
                  {money(in14, 2)}
                </div>
                <div className="mt-1 text-[12.5px] text-faint">
                  {in14Count > 0
                    ? `${in14Count} separate autopay pull${in14Count === 1 ? '' : 's'}`
                    : 'Nothing due in the next two weeks'}
                </div>
              </CardContent>
            </Card>

            <Card className="border-hairline bg-white">
              <CardContent className="pt-6">
                <div className="text-[13.5px] text-subtle">Of your next paycheck, already claimed</div>
                <div className="mt-1 text-[26px] font-extrabold tracking-[-0.02em] text-ink tabular-nums">
                  {claim ? `${Math.round(claim.percent)}%` : '—'}
                </div>
                <div className={cn('mt-2.5 h-2.5 overflow-hidden rounded-full', claim ? sev.track : 'bg-hairline')}>
                  <div
                    className={cn('h-full rounded-full transition-all', sev.bar)}
                    style={{ width: `${Math.min(100, claim?.percent ?? 0)}%` }}
                  />
                </div>
                <div className="mt-1.5 text-[12.5px] text-faint">
                  {claim
                    ? `${money(claim.committed, 2)} of ${money(parseFloat(takeHome) || 0)} is promised to pay-later apps${claim.approximate ? ' (add your payday for an exact window)' : ''}`
                    : 'Add your paycheck above to see this'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 8-week timeline */}
          <Card className="border-hairline bg-white">
            <CardContent className="pt-6">
              <h2 className="text-[17px] font-extrabold tracking-[-0.015em] text-ink">The next 8 weeks</h2>
              <p className="mt-1 text-[13.5px] text-subtle">
                {beforePayday !== null && beforePayday > 0
                  ? `Heads up: ${money(beforePayday, 2)} comes out before your next payday.`
                  : "What's scheduled to leave your account, week by week."}
              </p>
              <div className="mt-5 flex h-[130px] items-end gap-2">
                {weeks.map((amt, i) => (
                  <div key={i} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end">
                    <div className="mb-1 whitespace-nowrap text-[11px] font-bold text-subtle tabular-nums">
                      {amt > 0 ? money(amt) : ''}
                    </div>
                    <div
                      className={cn('w-full max-w-[26px] rounded-t', amt > 0 ? 'bg-brand-700' : 'bg-hairline')}
                      style={{ height: amt > 0 ? `${Math.max(4, (amt / weekMax) * 88)}px` : '2px' }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-hairline pt-2">
                {weeks.map((_, i) => {
                  const d = new Date(today.getTime() + i * 7 * DAY_MS)
                  return (
                    <div key={i} className="min-w-0 flex-1 text-center text-[11px] text-faint">
                      {d.getMonth() + 1}/{d.getDate()}
                      {paydayWeeks.has(i) && (
                        <>
                          <br />
                          <span className="font-bold text-brand-700">payday</span>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* reveals */}
          <Card className="border-hairline bg-white">
            <CardContent className="space-y-6 pt-6">
              <div className="border-l-[3px] border-brand-700 pl-4">
                <h3 className="text-[14.5px] font-bold text-ink">If you miss one payment</h3>
                {fees.worst ? (
                  <p className="mt-1 text-[14px] leading-relaxed text-subtle">
                    Miss one on every plan that charges and it&apos;s{' '}
                    <strong className="text-ink">{money(fees.ifOneMissedEverywhere, 2)}</strong> in fees.
                    The steepest is <strong className="text-ink">{fees.worst.provider}</strong> —{' '}
                    {providerNote(fees.worst.provider)} on a {money(fees.worst.installment, 2)} payment,
                    which is <strong className="text-ink">{Math.round(fees.worst.percentOfInstallment)}%</strong>{' '}
                    of that payment. Miss it every cycle and you&apos;d be paying the equivalent of{' '}
                    {Math.round(fees.worst.annualisedEquivalent).toLocaleString()}% a year to defer it.
                    A 0% plan stops being 0% the moment you slip.
                  </p>
                ) : (
                  <p className="mt-1 text-[14px] leading-relaxed text-subtle">
                    Your providers don&apos;t charge late fees — but a missed payment can still freeze
                    your account and go to collections. On-time BNPL payments mostly don&apos;t build
                    credit; late ones can still hurt it.
                  </p>
                )}
              </div>

              <div className="border-l-[3px] border-brand-700 pl-4">
                <h3 className="text-[14.5px] font-bold text-ink">Paying these with a credit card?</h3>
                <div className="mt-2.5 flex flex-wrap items-center gap-2.5 text-[14px] text-subtle">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={onCard}
                      onChange={(e) => setOnCard(e.target.checked)}
                      className="h-4 w-4 accent-[#2d6a4f]"
                    />
                    <span>I carry a balance on that card, at</span>
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="36"
                    step="0.01"
                    inputMode="decimal"
                    value={cardApr}
                    onChange={(e) => setCardApr(e.target.value)}
                    className="h-9 w-24 border-hairline"
                  />
                  <span>% APR</span>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-subtle">
                  {onCard && card.duringPlans > 0 ? (
                    <>
                      Then these aren&apos;t 0% plans. Charging each installment as it falls due adds
                      about <strong className="text-ink">{money(card.duringPlans, 2)}</strong> in
                      interest over the {card.spanDays} days these plans run. If the{' '}
                      {money(card.balanceAtEnd, 2)} then sits on the card, it costs a further{' '}
                      <strong className="text-ink">{money(card.perYearAfter, 2)} a year</strong> until
                      it&apos;s cleared. Switching autopay to a debit card fixes this in two minutes.
                    </>
                  ) : (
                    'Tick this if your BNPL payments come off a credit card you don’t clear in full.'
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          <AppCta
            tool="bnpl"
            prefill={{ debt_balance: Math.round(totalOwed) }}
            eyebrow="Now put it somewhere it can't surprise you"
            headline="Track this alongside everything else."
            body="You can add these as debts in WeLeap and see them next to your rent, savings and everything else that has to come out of the same paycheck."
            bullets={[
              'Your debts, savings and retirement in one plan',
              'A weekly focus, so the next payment is never the thing that surprises you',
              'See what clearing these frees up each month',
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
            Estimates only, based on what you enter. WeLeap is not a registered investment adviser and
            does not provide personalised investment advice.
            {FEES_VERIFIED_ON
              ? ` Late fees are typical published maximums as of ${FEES_VERIFIED_ON} and vary by state.`
              : ' Late fees are typical published maximums and vary by state — check your provider.'}
          </p>
        </>
      )}
    </div>
  )
}
