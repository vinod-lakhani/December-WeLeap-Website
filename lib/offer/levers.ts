/**
 * Which ask is worth making.
 *
 * The tool tells you what an offer is worth and then leaves you at the moment
 * that actually matters: you are about to accept, counter, or walk, this week.
 * These are the three counters worth considering, each priced off the offer in
 * front of you rather than off general advice.
 *
 * Every figure here is computeOfferValue run against a changed input, minus the
 * baseline. Nothing new is asked of the visitor and no API is called — which is
 * the point. The comparison feature needed a second input path and four network
 * round trips; this needs the numbers already on the screen.
 *
 * Levers that would not move anything are not offered. Asking for a match you
 * already have is not advice.
 */

import { computeOfferValue, type OfferInputs, type TaxResult } from './calculate'

export type Cadence = 'monthly' | 'annual' | 'once'

export interface Lever {
  id: 'base' | 'match' | 'signing'
  /** "Ask for $5,000 more base" — the thing to say. */
  ask: string
  /** What it is worth, in `cadence` terms. */
  amount: number
  cadence: Cadence
  /** Why this one behaves the way it does. */
  detail: string
}

/**
 * A dollar-for-dollar match is the usual ceiling, and six percent the usual
 * band it applies up to. Both are what an ask is measured against.
 */
const STRONG_MATCH_RATE = 100
const STRONG_MATCH_UP_TO = 6

/**
 * A round number to ask for, scaled so it stays meaningful.
 *
 * $5,000 is a real ask on $85,000 and a rounding error on $400,000. Five
 * percent, rounded to the nearest $2,500, keeps it both round and worth saying
 * out loud, and the floor and ceiling stop it becoming either trivial or
 * absurd.
 */
export function askAmountFor(salary: number): number {
  const raw = salary * 0.05
  const rounded = Math.round(raw / 2_500) * 2_500
  return Math.min(Math.max(rounded, 2_500), 25_000)
}

const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(Math.abs(n)))

export function computeLevers(inputs: OfferInputs, tax: TaxResult | null): Lever[] {
  const base = computeOfferValue(inputs, tax)
  if (!base) return []

  const ask = askAmountFor(inputs.salary)
  const levers: Lever[] = []

  // ── More base ───────────────────────────────────────────────────────────────
  /**
   * Priced at the effective rate rather than the marginal one, which is the
   * same approximation the tool already makes for bonus and equity. It runs a
   * little generous: the next dollar is taxed above the average of all the
   * dollars before it. Consistency with the rest of the screen is worth more
   * here than precision the tax API does not give us.
   */
  const takeHomeDelta = (ask * (1 - base.effectiveTaxRate)) / 12
  const raised = computeOfferValue({ ...inputs, salary: inputs.salary + ask }, tax)!
  const packageDelta = raised.totalPackage - base.totalPackage

  levers.push({
    id: 'base',
    ask: `Ask for ${money(ask)} more base`,
    amount: takeHomeDelta,
    cadence: 'monthly',
    detail:
      packageDelta > ask
        ? `Recurs every year, and pulls the bonus and match up with it — ${money(packageDelta)} on the package, not ${money(ask)}.`
        : 'Recurs every year, and it is the number every future raise is calculated from.',
  })

  // ── A better match ──────────────────────────────────────────────────────────
  // Ask for the weaker half of the match first: the band it applies up to if
  // that is short, otherwise the rate. Asking for both at once is not an ask,
  // it is a wish.
  const better: Partial<OfferInputs> | null =
    inputs.matchUpToPct < STRONG_MATCH_UP_TO
      ? { matchUpToPct: STRONG_MATCH_UP_TO }
      : inputs.matchRatePct < STRONG_MATCH_RATE
        ? { matchRatePct: STRONG_MATCH_RATE }
        : null

  if (better) {
    const improved = computeOfferValue({ ...inputs, ...better }, tax)!
    const matchDelta = improved.annual401kMatch - base.annual401kMatch
    if (matchDelta > 0) {
      levers.push({
        id: 'match',
        ask:
          better.matchUpToPct != null
            ? `Ask for the match to go to ${STRONG_MATCH_UP_TO}% of salary`
            : 'Ask for the match to go to dollar for dollar',
        amount: matchDelta,
        cadence: 'annual',
        detail:
          'Employer money, and often easier to move than base. You only receive it if you contribute enough to earn it.',
      })
    }
  }

  // ── A signing bonus ─────────────────────────────────────────────────────────
  /**
   * Offered whether or not the letter has one, because it is the ask a company
   * that cannot move base will usually agree to — it does not touch the salary
   * bands, and it is not paid again.
   */
  levers.push({
    id: 'signing',
    ask:
      inputs.signingBonus > 0
        ? `Ask for ${money(ask)} more signing bonus`
        : `Ask for a ${money(ask)} signing bonus`,
    amount: ask * (1 - base.effectiveTaxRate),
    cadence: 'once',
    detail:
      'Paid once and taxed as income, so it is worth less than it sounds — but it is the ask a company that cannot move base will usually agree to.',
  })

  return levers
}
