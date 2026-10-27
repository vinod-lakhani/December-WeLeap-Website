/**
 * "Where should my money go?": the person's next-dollar order from the chat's four answers (take-home, rent, the
 * biggest debt, the 401(k) match), worked out in code, never by the model. Spec: "Proposed: Where should my money
 * go?" (Oct 27); mock-ups 8 to 11 in Ribbit App Pull Mockups.
 *
 * One order, one place. The app has no single next-dollar order today: five places encode one and disagree (the
 * spec's "Decision needed"). Until Vinod and Shubha settle it, the chat's order is ORDER below, the one the feed's
 * "one thing this month" ranking implies (backend/feed/next_leaps.go appendOneThingThisMonthLeap): the match, then
 * debt above 10%, then three months of essentials, then retirement toward 15%. Changing the order is changing
 * ORDER; nothing else in the chat knows it.
 */

/** The steps, in order. See the note above before changing it. */
export const ORDER = ['match', 'debt', 'emergency', 'retirement'] as const
export type StepKey = (typeof ORDER)[number]

/** Debt is high-interest strictly above this APR, as in the backend's savings stack (totalHighAprDebtOutstanding). */
export const HIGH_INTEREST_APR_PCT = 10
/** Months of essentials in the first emergency fund goal (the standard 3 to 6 months, at its low end). */
export const EMERGENCY_MONTHS = 3
/** Essentials before the bank shows real spending: the Needs half of 50/30/20, the split the app seeds. */
export const ESSENTIALS_SHARE = 0.5
/** The retirement target counting the match, the standard figure the reader quotes. */
export const RETIREMENT_TARGET_PCT = 15

/** kind: a credit card or a loan, when the person said which (the app files it in the matching place). */
export interface MoneyDebt { balance: number; aprPct: number; payment: number; kind?: 'card' | 'loan' }

export interface MoneyInputs {
  takeHomeMonthly: number
  rentMonthly: number
  debt?: MoneyDebt
  match?: 'known' | 'unknown' | 'none'
  matchUpToPct?: number
  /** At the matched rate: what goes in a month with the match, and its after-tax cost (the offer flow's election). */
  electionMonthlyIn?: number
  electionCost?: number
  /** The person's own monthly contribution at the matched rate, before the match. */
  contributionMonthly?: number
}

export interface DebtPlan {
  payment: number
  months: number
  interest: number
  /** At what they pay now; months Infinity when it never covers the interest. */
  currentMonths: number
  currentInterest: number
}

export interface MoneyStep { key: StepKey; title: string; detail: string }

export interface MoneyOrder {
  steps: MoneyStep[]
  leftAfterRent: number
  /** What the steps with a monthly amount take a month (the match's cost and the debt payment). */
  monthlyForSteps: number
  debtPlan?: DebtPlan
  emergencyGoal: number
}

const fc = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/**
 * A balance paid a fixed amount a month at an APR: months to clear (unrounded) and total interest, the app's
 * loan_calculation formula (backend/ai/handler.go). Months Infinity when the payment never covers the interest.
 */
export function payoff(balance: number, aprPct: number, payment: number): { months: number; interest: number } {
  const r = aprPct / 100 / 12
  if (payment <= 0) return { months: Infinity, interest: Infinity }
  if (r === 0) return { months: balance / payment, interest: 0 }
  if (payment <= balance * r) return { months: Infinity, interest: Infinity }
  const months = -Math.log(1 - (r * balance) / payment) / Math.log(1 + r)
  return { months, interest: payment * months - balance }
}

/** The fixed payment that clears a balance in a number of months, rounded up to the next $25. */
function paymentToClear(balance: number, aprPct: number, months: number): number {
  const r = aprPct / 100 / 12
  const exact = r === 0 ? balance / months : (balance * r) / (1 - (1 + r) ** -months)
  return Math.ceil(exact / 25) * 25
}

/**
 * How fast to pay a high-interest debt: clear it in 12 months if that payment takes at most half of what is left
 * after rent and the match, else in 24, else at what they pay now. Never less than they pay now.
 */
function planDebt(d: MoneyDebt, room: number): DebtPlan {
  const now = payoff(d.balance, d.aprPct, d.payment)
  let payment = d.payment
  for (const months of [12, 24]) {
    const p = paymentToClear(d.balance, d.aprPct, months)
    if (p <= room / 2) { payment = Math.max(p, d.payment); break }
  }
  const plan = payoff(d.balance, d.aprPct, payment)
  return { payment, months: Math.round(plan.months), interest: plan.interest, currentMonths: Math.round(now.months), currentInterest: now.interest }
}

export function moneyOrder(i: MoneyInputs): MoneyOrder {
  const leftAfterRent = Math.max(0, i.takeHomeMonthly - i.rentMonthly)
  const emergencyGoal = Math.round((EMERGENCY_MONTHS * ESSENTIALS_SHARE * i.takeHomeMonthly) / 100) * 100
  const matchCost = i.match === 'known' ? i.electionCost ?? 0 : 0
  const highDebt = i.debt && i.debt.aprPct > HIGH_INTEREST_APR_PCT ? i.debt : undefined
  const debtPlan = highDebt ? planDebt(highDebt, leftAfterRent - matchCost) : undefined

  const byKey: Partial<Record<StepKey, MoneyStep>> = {}
  if (i.match === 'known' && i.matchUpToPct && i.contributionMonthly && i.electionMonthlyIn) {
    const employer = i.electionMonthlyIn - i.contributionMonthly
    byKey.match = {
      key: 'match',
      title: 'Get your full 401(k) match',
      detail: `Put in ${i.matchUpToPct}% of pay, ${fc(i.contributionMonthly)} a month, and your employer adds ${fc(employer)}. Costs you about ${fc(matchCost)} of take-home.`,
    }
  } else if (i.match === 'known' && i.matchUpToPct) {
    // Take-home typed, not a salary: the match is a percent of pay, with no dollars to put on it.
    byKey.match = {
      key: 'match',
      title: 'Get your full 401(k) match',
      detail: `Put in at least ${i.matchUpToPct}% of pay to get all of it. It is the only free money in this list.`,
    }
  } else if (i.match === 'unknown') {
    byKey.match = {
      key: 'match',
      title: 'Find out your 401(k) match',
      detail: 'Ask HR what they match, then put in at least enough to get all of it. It is the only free money in this list.',
    }
  }
  if (highDebt && debtPlan) {
    const rate = `${highDebt.aprPct}%`
    const faster = debtPlan.payment > highDebt.payment
    byKey.debt = {
      key: 'debt',
      title: `Pay the ${rate} ${faster ? 'debt faster' : 'debt down'}`,
      detail: !Number.isFinite(debtPlan.currentMonths) && !faster
        ? `${fc(highDebt.payment)} a month doesn't cover the interest, so the balance never goes down. Raise the payment before anything else.`
        : faster
          ? `${fc(debtPlan.payment)} a month instead of ${fc(highDebt.payment)}: gone in ${debtPlan.months} months, not ${Number.isFinite(debtPlan.currentMonths) ? debtPlan.currentMonths : 'ever'}, and ${fc(debtPlan.interest)} in interest instead of ${Number.isFinite(debtPlan.currentInterest) ? fc(debtPlan.currentInterest) : 'more every month'}.`
          : `Keep paying ${fc(highDebt.payment)} a month: it's gone in ${debtPlan.months} months, with ${fc(debtPlan.interest)} in interest.`,
    }
  }
  byKey.emergency = {
    key: 'emergency',
    title: `Build ${EMERGENCY_MONTHS} months of essentials`,
    detail: `About ${fc(emergencyGoal)}, estimated at half your take-home until your real spending is in.`,
  }
  byKey.retirement = {
    key: 'retirement',
    title: `Then raise retirement toward ${RETIREMENT_TARGET_PCT}%`,
    detail: highDebt ? 'Counting the match, once the debt is gone.' : 'Counting the match.',
  }
  const steps = ORDER.map((k) => byKey[k]).filter((s): s is MoneyStep => Boolean(s))
  return { steps, leftAfterRent, monthlyForSteps: matchCost + (debtPlan && debtPlan.payment > (highDebt?.payment ?? 0) ? debtPlan.payment : 0), debtPlan, emergencyGoal }
}
