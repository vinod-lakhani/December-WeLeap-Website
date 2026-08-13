/**
 * Smart Purchase Check — cash, pay-in-4, monthly financing, or wait.
 *
 * Built for the Builder: someone with a surplus deciding how to fund a
 * purchase, not someone checking whether they can survive it. The output is a
 * single recommendation with its reasoning, plus the trade-off for each option
 * so the user can disagree with us on their own terms.
 *
 * Two rules do most of the work and are worth stating plainly:
 *
 *  1. Simplicity wins ties. If the options are economically close, we say pay
 *     cash and keep it simple. Recommending 0% financing so someone can earn a
 *     few dollars of savings interest is the kind of advice that is technically
 *     correct and practically useless.
 *  2. Free financing is worth taking only when the cash it preserves is doing
 *     something. Otherwise it is four reminders in your calendar for nothing.
 *
 * Deliberately NOT modelled: employer match, retirement contributions, real
 * emergency-fund targets. Those need the user's actual accounts, which is the
 * honest reason to connect them in the app rather than guess here.
 */

export type PurchaseContext =
  | 'building_ef'
  | 'ef_set'
  | 'paying_debt'
  | 'saving_soon'
  | 'investing'

export type Choice = 'cash' | 'pay_in_4' | 'monthly' | 'wait'

export interface PurchaseInput {
  /** What it costs. */
  price: number
  /** Cash and savings they could actually reach today. */
  cashAvailable: number
  /** Typical money left after expenses each month. */
  monthlySurplus: number
  context: PurchaseContext
  /** Is an interest-free pay-in-4 plan on offer? */
  hasPayIn4: boolean
  /** Monthly plan, when one is offered. APR of 0 is a genuine 0% offer. */
  monthlyPlan: { months: number; aprPercent: number } | null
}

export interface OptionOutcome {
  choice: Choice
  available: boolean
  /** What you pay in total, including any interest. */
  totalCost: number
  /** Interest and fees above the sticker price. */
  extraCost: number
  /** Leaves your account today. */
  dueToday: number
  /** Ongoing commitment, normalised to a month. */
  monthlyLoad: number
  /** Cash left immediately after the first payment. */
  cashAfter: number
  /** Whether the ongoing commitment fits inside the monthly surplus. */
  fitsSurplus: boolean
  /**
   * The commitment in the cadence the user actually experiences it. Pay-in-4
   * is fortnightly, so quoting its monthly-equivalent run rate ("$482/mo" on a
   * $900 purchase) is accurate and completely unrecognisable to the person
   * paying $225 a fortnight.
   */
  commitment: string
}

export interface Recommendation {
  choice: Choice
  headline: string
  reason: string
  /** The one thing they give up by taking it, when there is one. */
  tradeoff: string | null
  options: OptionOutcome[]
}

const PAY_IN_4_INSTALLMENTS = 4
/** Pay-in-4 runs fortnightly, so a month carries about 2.14 installments. */
const FORTNIGHTS_PER_MONTH = 30 / 14

/** Standard amortised payment. Handles the 0% case without dividing by zero. */
export function monthlyPayment(principal: number, aprPercent: number, months: number): number {
  if (months <= 0) return 0
  if (aprPercent <= 0) return principal / months
  const i = aprPercent / 100 / 12
  return (principal * i) / (1 - Math.pow(1 + i, -months))
}

/**
 * How much of their reachable cash this purchase consumes.
 *
 * Used instead of an emergency-fund target because we deliberately don't ask
 * for expenses. Someone spending 8% of their cash is in a different position
 * from someone spending 60% of it, and that difference is what decides whether
 * free financing is worth the admin.
 */
function cashShare(price: number, cashAvailable: number): number {
  if (cashAvailable <= 0) return Infinity
  return price / cashAvailable
}

/** Above this share of cash, paying cash is a real dent rather than a rounding error. */
function dentThreshold(context: PurchaseContext): number {
  switch (context) {
    case 'building_ef':
    case 'saving_soon':
    case 'paying_debt':
      return 0.15
    case 'ef_set':
    case 'investing':
    default:
      return 0.35
  }
}

/** Interest below this is too small to be worth a recommendation of its own. */
function trivialInterest(price: number): number {
  return Math.max(15, price * 0.02)
}

export function buildOptions(input: PurchaseInput): OptionOutcome[] {
  const { price, cashAvailable, monthlySurplus, hasPayIn4, monthlyPlan } = input
  const out: OptionOutcome[] = []

  out.push({
    choice: 'cash',
    available: cashAvailable >= price,
    totalCost: price,
    extraCost: 0,
    dueToday: price,
    monthlyLoad: 0,
    cashAfter: cashAvailable - price,
    fitsSurplus: true,
    commitment: 'Nothing ongoing',
  })

  if (hasPayIn4) {
    const installment = price / PAY_IN_4_INSTALLMENTS
    const load = installment * FORTNIGHTS_PER_MONTH
    out.push({
      choice: 'pay_in_4',
      available: cashAvailable >= installment,
      totalCost: price,
      extraCost: 0,
      dueToday: installment,
      monthlyLoad: load,
      cashAfter: cashAvailable - installment,
      fitsSurplus: load <= monthlySurplus,
      commitment: `${money(installment)} every 2 weeks for 8 weeks`,
    })
  }

  if (monthlyPlan && monthlyPlan.months > 0) {
    const pmt = monthlyPayment(price, monthlyPlan.aprPercent, monthlyPlan.months)
    const total = pmt * monthlyPlan.months
    out.push({
      choice: 'monthly',
      available: true,
      totalCost: total,
      extraCost: Math.max(0, total - price),
      dueToday: 0,
      monthlyLoad: pmt,
      cashAfter: cashAvailable,
      fitsSurplus: pmt <= monthlySurplus,
      commitment: `${money(pmt)} a month for ${monthlyPlan.months} months`,
    })
  }

  return out
}

export function recommend(input: PurchaseInput): Recommendation {
  const { price, cashAvailable, monthlySurplus, context } = input
  const options = buildOptions(input)
  const get = (c: Choice) => options.find((o) => o.choice === c) ?? null

  const cash = get('cash')!
  const p4 = get('pay_in_4')
  const monthly = get('monthly')

  const canCash = cash.available
  const freeOption =
    p4 && p4.available && p4.fitsSurplus
      ? p4
      : monthly && monthly.extraCost === 0 && monthly.fitsSurplus
        ? monthly
        : null
  const paidOption = monthly && monthly.extraCost > 0 && monthly.fitsSurplus ? monthly : null

  const share = cashShare(price, cashAvailable)
  const dents = !canCash || share > dentThreshold(context)

  // 1 — no route that doesn't strain something.
  if (!canCash && !freeOption && !paidOption) {
    return {
      choice: 'wait',
      headline: 'Wait on this one.',
      reason:
        'There is no way to fund it right now that does not stretch you — the cash is not there and the repayments do not fit inside your monthly surplus.',
      tradeoff: null,
      options,
    }
  }

  // 2 — clearing expensive debt: neither draining cash nor adding a commitment helps.
  if (context === 'paying_debt' && !canCash) {
    return {
      choice: 'wait',
      headline: 'Wait until the debt is smaller.',
      reason:
        'You would be adding a new commitment while still clearing an expensive one. Every month you delay this, more of your surplus goes at the balance instead.',
      tradeoff: 'You do not get the thing yet.',
      options,
    }
  }

  // 3 — cash is comfortable and the purchase barely moves it. Simplicity wins.
  if (canCash && !dents) {
    const saved = paidOption ? paidOption.extraCost : 0
    return {
      choice: 'cash',
      headline: 'Pay cash and keep it simple.',
      reason:
        saved > trivialInterest(price)
          ? `This is a small share of the cash you have available, and financing it would add ${fmt(saved)} for no real benefit.`
          : 'This is a small share of the cash you have available. Splitting it would leave you tracking payments for months to solve a problem you do not have.',
      tradeoff: `${fmt(cash.cashAfter)} left afterwards.`,
      options,
    }
  }

  // 4 — cash would be a real dent and something free is on offer that fits.
  if (freeOption) {
    const preserved = price - freeOption.dueToday
    return {
      choice: freeOption.choice,
      headline:
        freeOption.choice === 'pay_in_4'
          ? 'Use the interest-free plan.'
          : 'Take the 0% monthly plan.',
      reason: `It costs nothing extra, the payments fit inside your ${fmt(monthlySurplus)} monthly surplus, and it keeps ${fmt(preserved)} of your cash where it is ${reasonForCash(context)}.`,
      tradeoff: `${freeOption.commitment}.`,
      options,
    }
  }

  // 5 — nothing free, but the cash is there. Don't pay interest for nothing.
  if (canCash) {
    return {
      choice: 'cash',
      headline: 'Pay cash.',
      reason: paidOption
        ? `The only financing on offer adds ${fmt(paidOption.extraCost)}, and you can cover this without it.`
        : 'There is no interest-free option here, and you can cover it outright.',
      tradeoff: `${fmt(cash.cashAfter)} left afterwards${dents ? ', which is a real dent — worth checking against anything you have coming up.' : '.'}`,
      options,
    }
  }

  // 6 — financing is the only route. Worth it only if the cost is small.
  if (paidOption && paidOption.extraCost <= trivialInterest(price)) {
    return {
      choice: 'monthly',
      headline: 'Financing is fine here.',
      reason: `It adds ${fmt(paidOption.extraCost)}, which is small against the price, and the payment fits your monthly surplus.`,
      tradeoff: `${paidOption.commitment}.`,
      options,
    }
  }

  return {
    choice: 'wait',
    headline: 'Wait, or save up for it first.',
    reason: paidOption
      ? `Financing is the only route open and it adds ${fmt(paidOption.extraCost)}. At ${fmt(monthlySurplus)} a month spare, saving for it costs you nothing but time.`
      : 'Financing is the only route open and it does not fit comfortably inside your monthly surplus.',
    tradeoff: monthlySurplus > 0 ? `About ${Math.ceil(price / monthlySurplus)} months of your surplus to save it outright.` : null,
    options,
  }
}

function reasonForCash(context: PurchaseContext): string {
  switch (context) {
    case 'building_ef':
      return 'while you are still building your emergency fund'
    case 'saving_soon':
      return 'for the thing you are saving towards'
    case 'paying_debt':
      return 'so you can keep paying down the debt'
    case 'investing':
      return 'and invested'
    case 'ef_set':
    default:
      return 'and available'
  }
}

const money = fmt

function fmt(n: number): string {
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: n % 1 === 0 ? 0 : 2,
      maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    })
  )
}
