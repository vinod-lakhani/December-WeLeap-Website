/**
 * The link from the Ribbit chat into the WeLeap web app: the contract both sides read.
 *
 * The chat knows most of what onboarding asks (salary or take-home, place, rent, debt, start date, the 401k
 * election), so the app opens with the plan already in, skips the form, and after sign-in asks to connect the
 * bank; it never opens the bank on arrival (spec: "Save My Plan: Chat to App Without the Form"). Every number
 * here comes from the chat's own facts, computed by the tool logic, never typed by the model.
 *
 * The experiment runs on dev3 (decided Oct 26): NEXT_PUBLIC_RIBBIT_APP_URL is the one setting that moves it to
 * production. Attribution (UTMs, click ids, the PostHog id) rides along through appLinkAt, as on every other CTA.
 *
 * Parameters the app reads (all optional except src and why):
 *   src=ribbit_chat   the experiment's flag; nothing else in the app changes without it
 *   why               plan_preview | spending_check | plan_invite | account | benefit | rent_answer (which ask was tapped)
 *   rt                the chat thread id, to stitch the web events to the app
 *   flow              rent | offer | money | general
 *   salary            yearly salary, dollars (when given)
 *   takehome          monthly take-home, dollars (net of federal, FICA, state and city tax where known)
 *   state, city       two-letter state; the city or metro as the chat named it
 *   rent              the monthly rent the person picked
 *   rent_low, rent_high   the rent range the chat worked out (the plan when no rent is picked yet)
 *   debt              monthly debt payments
 *   start             working | this_month | next_month | YYYY-MM-DD
 *   upfront           the cash-before-keys target (the top of the upfront range)
 *   percheck          what to move after each paycheck toward it
 *   purpose           cushion | card | future (what the freed-up money is for)
 *   match_rate, match_cap   the 401k match formula as given (percent)
 *   k401_monthly      monthly into the 401k at the elected rate, with the match
 *   k401_cost         its monthly after-tax cost to take-home
 *   worth             the offer's yearly worth on entered terms
 *   saving            a monthly saving amount the person mentioned (general questions)
 *   debt_balance, debt_rate, debt_pay, debt_months   money flow: the biggest debt and the plan for it (payment, months)
 *   debt_kind         money flow: card | loan, when the person said which
 *   debt_now          money flow: what they pay on it today (the card's minimum in the app)
 *   ef_goal           money flow: the emergency fund goal (three months of essentials)
 */
import { appLinkAt } from '@/lib/app-link'
import { moneyInputs, type Facts, type Flow } from './engine'
import { moneyOrder } from './moneyOrder'

export const RIBBIT_APP_URL = process.env.NEXT_PUBLIC_RIBBIT_APP_URL ?? 'https://dev3.weleap.app'

export type AppReason = 'plan_preview' | 'spending_check' | 'plan_invite' | 'account' | 'benefit' | 'rent_answer'

const round = (n: number | undefined) => (n === undefined || !Number.isFinite(n) ? undefined : String(Math.round(n)))

/** The plan's numbers as link parameters. Absent facts are left out, never guessed. */
export function ribbitPlanParams(f: Facts, flow: Flow | null, why: AppReason, threadId: string): Record<string, string> {
  const money = flow === 'money' ? moneyOrder(moneyInputs(f)) : undefined
  const p: Record<string, string | undefined> = {
    src: 'ribbit_chat',
    why,
    rt: threadId || undefined,
    flow: flow ?? 'general',
    salary: f.takeHomeFrom === 'salary' ? round(f.salary) : undefined,
    takehome: round(f.takeHomeMonthly),
    state: f.stateCode,
    city: f.place,
    rent: round(f.pick),
    rent_low: flow === 'rent' ? round(f.range?.low) : undefined,
    rent_high: flow === 'rent' ? round(f.range?.high) : undefined,
    debt: f.debtMonthly ? round(f.debtMonthly) : undefined,
    start: f.start === 'date' ? f.startDate : f.start,
    upfront: round(f.upfront?.high),
    percheck: round(f.perCheck),
    purpose: f.purpose,
    match_rate: f.match === 'known' ? round(f.matchRatePct) : undefined,
    match_cap: f.match === 'known' ? round(f.matchUpToPct) : undefined,
    k401_monthly: round(f.electionMonthlyIn),
    k401_cost: round(f.electionCost),
    worth: f.match === 'known' ? round(f.value?.totalPackage) : undefined,
    saving: round(f.mentionedSaving),
    debt_balance: money && f.debt ? round(f.debt.balance) : undefined,
    debt_rate: money && f.debt ? String(f.debt.aprPct) : undefined,
    debt_pay: money?.debtPlan ? round(money.debtPlan.payment) : undefined,
    debt_months: money?.debtPlan && Number.isFinite(money.debtPlan.months) ? String(money.debtPlan.months) : undefined,
    debt_kind: money && f.debt?.kind ? f.debt.kind : undefined,
    debt_now: money && f.debt ? round(f.debt.payment) : undefined,
    ef_goal: money ? round(money.emergencyGoal) : undefined,
  }
  return Object.fromEntries(Object.entries(p).filter((e): e is [string, string] => e[1] !== undefined && e[1] !== ''))
}

/** The full link into the app, with attribution. Client-side (attribution reads storage and PostHog). */
export function ribbitAppLink(f: Facts, flow: Flow | null, why: AppReason, threadId: string): string {
  return appLinkAt(RIBBIT_APP_URL, '/react/', ribbitPlanParams(f, flow, why, threadId))
}

/**
 * Whether this browser tapped a "Save my plan" link, so the chat can offer "Open my plan" when the person comes
 * back. The chat cannot see the app's account (another site), so the tap is the signal: kept 90 days, cleared by
 * nothing else. Wrapped in try/catch: storage can be off (private mode), and then the chat just doesn't offer it.
 */
const SAVED_KEY = 'weleap.ribbitChat.planSaved.v1'
const SAVED_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

export function markPlanSaved(flow: Flow | null): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify({ t: Date.now(), flow: flow ?? 'general' }))
  } catch { /* storage off: no "Open my plan" later */ }
}

export function planSaved(): { t: number; flow: string } | null {
  try {
    const v = JSON.parse(localStorage.getItem(SAVED_KEY) ?? 'null') as { t?: number; flow?: string } | null
    return v?.t && Date.now() - v.t < SAVED_MAX_AGE_MS ? { t: v.t, flow: v.flow ?? 'general' } : null
  } catch {
    return null
  }
}

/** "Open my plan": the app with no plan in the link, so it opens the account's own (Home shows the saved plan
 *  until a bank is connected; signed out, the app's sign-in). Attribution rides along as on every CTA. */
export function ribbitOpenPlanLink(): string {
  return appLinkAt(RIBBIT_APP_URL, '/react/')
}
