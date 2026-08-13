/**
 * Buy-now-pay-later reality check — the maths.
 *
 * Kept out of the component so the numbers can be reasoned about (and checked)
 * on their own. Three of these corrected real errors in the prototype:
 *
 *  - Card interest was `totalOwed × APR`, which assumes the entire remaining
 *    balance sits on the card for a full year. It doesn't: you charge each
 *    installment as it falls due and the balance builds, then decays as you
 *    repay. On the prototype's own demo data that overstated the cost by ~6x
 *    ($85 vs $14). We now accrue daily on the actual running balance.
 *  - The late-fee rate divided by the whole remaining plan balance rather than
 *    the single installment the fee is actually charged on, which is the only
 *    sum being deferred.
 *  - "Of your next paycheck, already claimed" measured a window starting today
 *    instead of at the next payday, even though the payday was collected.
 *
 * Nothing here is advice. Every figure is arithmetic on what the user typed.
 */

export const DAY_MS = 86_400_000

export type Cadence = 7 | 14 | 30

export interface BnplPlan {
  id: string
  provider: string
  /** Amount of one installment. */
  amount: number
  /** Installments still to pay, inclusive of the next one. */
  installmentsLeft: number
  cadence: Cadence
  /** Date of the next installment. Null means "unknown", treated as +7 days. */
  nextDue: Date | null
}

export interface ScheduledPayment {
  date: Date
  amount: number
  provider: string
  planId: string
}

/** Midnight today, local time. */
export function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * `yyyy-mm-dd` for a date `days` from now, in LOCAL time.
 *
 * The prototype used toISOString(), which is UTC — for anyone west of
 * Greenwich in the evening that returns tomorrow's date, so every default due
 * date landed a day early.
 */
export function localISODate(days = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Parse a date input value as local noon, so DST can't shift the day. */
export function parseDateInput(value: string): Date | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Every remaining installment across every plan, in date order. */
export function buildSchedule(plans: BnplPlan[], today = startOfToday()): ScheduledPayment[] {
  const out: ScheduledPayment[] = []
  for (const p of plans) {
    if (!(p.amount > 0) || !(p.installmentsLeft > 0)) continue
    let d = p.nextDue ? new Date(p.nextDue) : new Date(today.getTime() + 7 * DAY_MS)
    for (let i = 0; i < p.installmentsLeft; i++) {
      out.push({ date: new Date(d), amount: p.amount, provider: p.provider, planId: p.id })
      d = new Date(d.getTime() + p.cadence * DAY_MS)
    }
  }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime())
}

/** Total of payments falling in [from, to). */
export function sumBetween(payments: ScheduledPayment[], from: Date, to: Date): number {
  return payments
    .filter((p) => p.date >= from && p.date < to)
    .reduce((s, p) => s + p.amount, 0)
}

export function countBetween(payments: ScheduledPayment[], from: Date, to: Date): number {
  return payments.filter((p) => p.date >= from && p.date < to).length
}

/** The first payday on or after today, stepping forward by the pay cycle. */
export function nextPayday(payDate: Date | null, frequencyDays: number, today = startOfToday()): Date | null {
  if (!payDate) return null
  let d = new Date(payDate)
  let guard = 0
  while (d < today && guard++ < 400) d = new Date(d.getTime() + frequencyDays * DAY_MS)
  return d
}

export interface PaycheckClaim {
  /** Committed to BNPL out of the paycheck arriving on `windowStart`. */
  committed: number
  /** As a share of take-home, 0-100+. */
  percent: number
  windowStart: Date
  windowEnd: Date
  /** True when no payday was given and we fell back to a window starting today. */
  approximate: boolean
}

/**
 * How much of the NEXT paycheck is already spoken for.
 *
 * The window runs from the next payday to the one after it — the money that
 * paycheck has to cover. Starting the window at "today" (as the prototype did)
 * measures a different and mostly meaningless span, since payments falling
 * before payday come out of what you're holding now, not out of what's coming.
 * Those are reported separately by `dueBeforePayday`.
 */
export function paycheckClaim(
  payments: ScheduledPayment[],
  takeHome: number,
  frequencyDays: number,
  payDate: Date | null,
  today = startOfToday()
): PaycheckClaim | null {
  if (!(takeHome > 0)) return null
  const payday = nextPayday(payDate, frequencyDays, today)
  const windowStart = payday ?? today
  const windowEnd = new Date(windowStart.getTime() + frequencyDays * DAY_MS)
  const committed = sumBetween(payments, windowStart, windowEnd)
  return {
    committed,
    percent: (committed / takeHome) * 100,
    windowStart,
    windowEnd,
    approximate: payday === null,
  }
}

/** Money leaving before the next payday — i.e. out of what you already hold. */
export function dueBeforePayday(
  payments: ScheduledPayment[],
  payDate: Date | null,
  frequencyDays: number,
  today = startOfToday()
): number | null {
  const payday = nextPayday(payDate, frequencyDays, today)
  if (!payday) return null
  return sumBetween(payments, today, payday)
}

export interface CardInterest {
  /** Interest accrued from today until the last installment clears. */
  duringPlans: number
  /** Balance sitting on the card once every installment has been charged. */
  balanceAtEnd: number
  /** Cost of leaving that final balance untouched for a further year. */
  perYearAfter: number
  /** Days from today to the final installment. */
  spanDays: number
}

/**
 * Interest if these installments are charged to a card carrying a balance.
 *
 * Accrues daily on the running balance, adding each installment on the day it
 * is charged. This deliberately does NOT model repayments — "I carry a
 * balance" is the case where the charges sit — so `duringPlans` is an upper
 * bound for the plan window, not a full-year figure.
 *
 * The prototype's `total × APR` treated the whole balance as present from day
 * one and outstanding for twelve months, which roughly sextupled it.
 */
export function cardInterest(
  payments: ScheduledPayment[],
  aprPercent: number,
  today = startOfToday()
): CardInterest {
  const empty = { duringPlans: 0, balanceAtEnd: 0, perYearAfter: 0, spanDays: 0 }
  if (!payments.length || !(aprPercent > 0)) return empty

  const daily = aprPercent / 100 / 365
  const last = payments[payments.length - 1].date
  const spanDays = Math.max(0, Math.ceil((last.getTime() - today.getTime()) / DAY_MS))

  let balance = 0
  let interest = 0
  let cursor = new Date(today)
  for (const p of payments) {
    const days = Math.max(0, Math.round((p.date.getTime() - cursor.getTime()) / DAY_MS))
    interest += balance * daily * days
    balance += p.amount
    cursor = new Date(p.date)
  }
  return {
    duringPlans: interest,
    balanceAtEnd: balance,
    perYearAfter: balance * (aprPercent / 100),
    spanDays,
  }
}

export interface LateFeeExposure {
  /** Total charged if one installment is missed on every fee-charging plan. */
  ifOneMissedEverywhere: number
  /** Number of plans that carry a late fee. */
  feeChargingPlans: number
  /** The single costliest miss, relative to the installment it lands on. */
  worst: {
    provider: string
    fee: number
    installment: number
    /** Fee as a share of that one installment. */
    percentOfInstallment: number
    /**
     * Annualised equivalent of paying `fee` to defer `installment` by one
     * cadence. Correct denominator: the installment you missed, not the whole
     * remaining plan. Presented as an equivalence, never as a real APR — a
     * late fee is a penalty, not interest on a loan.
     */
    annualisedEquivalent: number
  } | null
}

export function lateFeeExposure(
  plans: BnplPlan[],
  feeFor: (provider: string) => number
): LateFeeExposure {
  const charging = plans.filter((p) => p.amount > 0 && feeFor(p.provider) > 0)
  if (!charging.length) {
    return { ifOneMissedEverywhere: 0, feeChargingPlans: 0, worst: null }
  }
  const ifOneMissedEverywhere = charging.reduce((s, p) => s + feeFor(p.provider), 0)

  // Costliest = the fee that is the biggest bite out of its own installment.
  let worst = charging[0]
  for (const p of charging.slice(1)) {
    if (feeFor(p.provider) / p.amount > feeFor(worst.provider) / worst.amount) worst = p
  }
  const fee = feeFor(worst.provider)
  return {
    ifOneMissedEverywhere,
    feeChargingPlans: charging.length,
    worst: {
      provider: worst.provider,
      fee,
      installment: worst.amount,
      percentOfInstallment: (fee / worst.amount) * 100,
      annualisedEquivalent: (fee / worst.amount) * (365 / worst.cadence) * 100,
    },
  }
}

export type Severity = 'steady' | 'stacking' | 'stretched' | 'overloaded'

export interface Verdict {
  severity: Severity
  label: string
  note: string
}

export function verdict(
  claimPercent: number | null,
  planCount: number,
  providerCount: number
): Verdict {
  const c = claimPercent ?? -1
  if (c >= 40 || planCount >= 5) {
    return {
      severity: 'overloaded',
      label: 'Overloaded',
      note: 'This is where late fees and overdrafts usually start. Worth pausing new plans.',
    }
  }
  if (c >= 25 || planCount === 4) {
    return {
      severity: 'stretched',
      label: 'Stretched',
      note: 'A large share of your pay is spent before it lands.',
    }
  }
  if (c >= 15 || planCount === 3 || providerCount >= 2) {
    return {
      severity: 'stacking',
      label: 'Stacking up',
      note: 'Running plans across several apps is what makes one easy to lose track of.',
    }
  }
  return {
    severity: 'steady',
    label: 'Manageable',
    note: "You're on top of it — just watch for due dates landing right before payday.",
  }
}
