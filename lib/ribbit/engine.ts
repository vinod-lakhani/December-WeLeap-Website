/**
 * The Ribbit chat: the rent and offer tools as a conversation (spec: "Ribbit Chat Tool — Rent and Offer Flows"),
 * and "Where should my money go?" for a general question (the order itself is lib/ribbit/moneyOrder.ts).
 *
 * A pure state machine. Each reply produces the next Ribbit messages, the chips for the next answer and the
 * analytics to send; the state is plain JSON, so a refresh restores the thread from localStorage. Every figure
 * comes from the same code the tool pages run, through `ChatServices` (the same /api/tax and /api/zori routes)
 * and the shared libraries (lib/rent, lib/localTax, lib/zoriClient, lib/hudRents, lib/offer) — the chat has no
 * arithmetic of its own beyond a card payoff and the split of a monthly amount across paychecks. Austin in the
 * spec is a worked example only: any state, preset city, metro or "outside a metro" the pages take, this takes.
 *
 * Words are the spec's lines with the figures filled in. A typed message that is not an answer to the open
 * question goes to Ribbit (`ChatServices.ask`), the same assistant that answers on the text thread.
 */
import { getAvailableCities, getStateCodeForCity } from '@/lib/cities'
import { getHUDRentRange } from '@/lib/hudRents'
import { localTaxAnnual } from '@/lib/localTax'
import { calculateRentRange, calculateUpfrontCash, marketRentVerdict, type RentRange } from '@/lib/rent'
import { calculateMarketRentRange } from '@/lib/zoriClient'
import { computeInvestingImpact } from '@/lib/networthImpact/math'
import { REAL_RETURN_DEFAULT } from '@/lib/leapImpact/constants'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import { federalTax, ficaTax, marginalFederalRate, taxableIncome } from '@/lib/firstPaycheck/calculation'
import { computeOfferValue, MARKET_PTO_DAYS, type OfferInputs, type OfferValue, type TaxResult } from '@/lib/offer/calculate'
import { US_STATES_NAMED } from '@/lib/states'
import defaultMetroMappingData from '@/data/default_metro_mapping.json'
import { splitCityState, matchPresetCity, matchState, parseDebt, parseMatch, parseMoney, parseTwoNumbers, salaryOrTakeHome } from './parse'
import { moneyOrder, payoff, type MoneyDebt, type MoneyInputs, type MoneyStep } from './moneyOrder'
import type { AppReason } from './appLink'

const metroMapping = defaultMetroMappingData as Record<string, { regionName: string; stateName: string }>

export type Flow = 'rent' | 'offer' | 'money'
export interface Chip { label: string; value: string }
export interface MathRow { label: string; value: string; strong?: boolean }
export interface ChatMessage {
  from: 'ribbit' | 'you'
  text: string
  /** The win's key figure, set large in the bubble. */
  figure?: string
  /** What the figure is, in a few words above it ("Rent that fits", "Seattle rentals"): two big ranges in a row
   * read as the same thing without it. */
  figureLabel?: string
  /** A second figure set small under the first, for a comparison ("Your range $1,600–$2,000/mo"). */
  compare?: { label: string; value: string }
  /**
   * An ask into the WeLeap app under this message: the lime button (the link is built by the page from the
   * thread's facts, lib/ribbit/appLink.ts), small print under it, and for the endings a text link that opens the
   * text sign-up instead ("Not ready to connect?").
   */
  /** quiet: a small text link instead of the lime button (the benefit line after the one invite). */
  appAsk?: { label: string; why: AppReason; note?: string; textInstead?: boolean; quiet?: boolean }
  /** The plan as WeLeap would show it: rows the chat knows, and rows only the bank can fill (shown locked). */
  planCard?: { known: { label: string; value: string }[]; locked: string[] }
  /** "Show me the math": the breakdown, rendered as rows under the text. */
  math?: MathRow[]
  /** The turn that produced it, for analytics and the handoff. */
  turn?: string
  /** Render the text door (the approved consent and button) under this message. */
  handoff?: Flow
  /** "Where should my money go?": the next-dollar order, as numbered steps (lib/ribbit/moneyOrder.ts). */
  order?: MoneyStep[]
}
export interface ChatEvent { name: string; props: Record<string, unknown> }

/** What the chat knows. Plain JSON. */
export interface Facts {
  salary?: number
  takeHomeMonthly?: number
  /** How take-home was reached: from a salary (taxed), or typed by the person. */
  takeHomeFrom?: 'salary' | 'typed'
  /** Federal and FICA only, before the location is known. */
  takeHomeBeforeState?: boolean
  tax?: TaxResult & { localTaxAnnual: number; taxSource?: string }
  stateCode?: string
  /** A rent-page preset city ("NYC"), when one was chosen. */
  presetCity?: string
  /** The ZORI region for market rents and the offer page's local tax ("New York, NY"). */
  region?: { stateName: string; regionName: string }
  outsideMetro?: boolean
  place?: string
  metroOptions?: { label: string; value: string }[]
  debtMonthly?: number
  /**
   * What to move after each paycheck to rebuild what the move took out (the freed-up amount over two paychecks).
   * The freed-up money only exists once the lower rent is being paid, after the move, so it refills savings; it
   * cannot pay the move-in cash itself, which is due before the keys.
   */
  perCheck?: number
  /** The 401k at the elected rate: monthly in with the match, and its monthly after-tax cost (O6). */
  electionMonthlyIn?: number
  electionCost?: number
  /** A monthly saving amount named in a general question ("I'm saving $1,000 a month"). */
  mentionedSaving?: number
  /** The spending check has been offered in this thread (once per thread). */
  spendingCheckShown?: boolean
  /** The spending check offered on the first rent range (R2); the pick moment (R4) still offers it once. */
  rangeSpendingCheckShown?: boolean
  range?: RentRange
  market?: { low: number; high: number; median: number; tier: string; source: 'zori' | 'hud' } | null
  pick?: number
  start?: 'working' | 'this_month' | 'next_month' | 'date'
  startDate?: string
  upfront?: { low: number; high: number }
  purpose?: 'cushion' | 'card' | 'future'
  roommate?: 'yes' | 'no' | 'not_sure'
  // offer
  bonusPct?: number
  signingBonus?: number
  rsuAnnual?: number
  extrasAsked?: string[]
  pendingExtra?: 'signing' | 'bonus' | 'equity'
  match?: 'known' | 'unknown' | 'none'
  matchRatePct?: number
  matchUpToPct?: number
  pendingMatchCap?: number
  value?: OfferValue
  /** The flow this thread switched from (offer → rent at O7), so the handoff can name both. */
  switchedFrom?: Flow
  // money ("Where should my money go?"); the rent is `pick`, as in the rent flow
  /** The biggest debt, read from one line or asked piece by piece. */
  debt?: MoneyDebt
  pendingDebt?: Partial<MoneyDebt>
  /** The person's own 401(k) contribution a month at the matched rate, before the match. */
  contributionMonthly?: number
  /** "Work it out with your numbers?" has been offered after a planning question (once per thread). */
  moneyOffered?: boolean
  /** The question that led to "Where should my money go?" ("is now a good time to buy a car?"): answered at the order. */
  moneyQuestion?: string
  /** A typed town the rent data has no metro for ("Ashburn", "La Vernia"): named back, priced by its state. */
  typedTown?: string
  /** Typed answers to "Which area?" that matched none: the second moves on with the range alone. */
  metroMisses?: number
  /** "Not now" to the money offer: it is not offered again in this thread. */
  moneyDeclined?: boolean
  /** The offer was made again after they kept going without it (once). */
  moneyReoffered?: boolean
}

export interface ChatState {
  flow: Flow | null
  turn: string
  facts: Facts
  /** The recent thread, newest last, for the assistant's context. */
  history: { from: 'in' | 'out'; text: string }[]
  /** The open question and its options, so an answer to a side question can return to it unchanged. */
  ui?: { chips: Chip[]; input: Step['input']; ask?: string }
  /** The app invite has been shown in this thread: once per thread, as in the text thread. */
  invited?: boolean
  /** Benefit lines shown after the invite (MAX_BENEFIT_LINES a thread, as in the text thread). */
  benefitsShown?: number
}

export interface Step {
  state: ChatState
  messages: ChatMessage[]
  chips: Chip[]
  /** What the text field is for at this turn; 'none' hides it (the handoff turn has its own form). */
  input: 'money' | 'location' | 'text' | 'none'
  events: ChatEvent[]
  /**
   * Set after Ribbit answers a side question: the open question, which is not asked again. The page folds the
   * options into one "back to your plan" line naming it ('' when the turn's question has no "?"), and the field
   * still takes the answer.
   */
  parked?: string
  /** A caption over the options, when they are not the answer to the question just asked. */
  chipsLabel?: string
}

/** The tool pages' own routes, and Ribbit for typed questions. Injected so the engine is testable. */
export interface ChatServices {
  tax(salaryAnnual: number, stateCode: string): Promise<(TaxResult & { taxSource?: string }) | null>
  metros(stateCode: string): Promise<{ label: string; value: string }[]>
  medianRent(stateName: string, regionName: string): Promise<number | null>
  /** Metros for a typed city, narrowed by a typed state (/api/zori?find=). Optional: without it, presets and states only. */
  findMetros?(city: string, stateCode?: string): Promise<{ label: string; value: string; stateCode: string }[]>
  /**
   * Ribbit, for a typed message that is not an answer the chat could read: a reply to show, or the answer to the
   * open question it found in the words ("about five grand a month" → "5000"), which the chat then applies.
   */
  /** thread: the chat's id, for the backend's questions-per-thread cap (the page adds it). */
  ask(input: { flow: Flow; facts: Facts; message: string; step: string; history: ChatState['history']; thread?: string }): Promise<AskResult | null>
}

/**
 * `plan`: the question's honest answer depends on the person's whole picture (what to do with savings, card or
 * invest). The chat answers it and shows the thread's one invite to the app, as the text thread does.
 */
/** benefit/topic: for a planning question, what WeLeap would add for its topic, in the backend's reviewed words
 *  (users/rentpilot.go benefitTopics), the same line the text thread sends. */
export interface AskResult { kind: 'question' | 'step' | 'account'; reply?: string; value?: string; plan?: boolean; benefit?: string; topic?: string }

/** After the one invite, at most this many benefit lines in a thread (the text thread's maxBenefitLines). */
export const MAX_BENEFIT_LINES = 2

export const fc = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
/** A monthly range as every headline shows it: "$1,600–$2,000/mo". */
const span = (low: number, high: number) => `${fc(low)}–${fc(high)}/mo`
const mid50 = (a: number, b: number) => Math.round((a + b) / 2 / 50) * 50
const SOMEWHERE_ELSE = '__elsewhere__'
const OUTSIDE_METRO = '__OTHER__'
const STATE_NAME = (code?: string) => US_STATES_NAMED.find((s) => s.code === code)?.name ?? code ?? ''

// The two tools, named as tasks: after a side question they sit under "Or work out with Ribbit", where a bare
// "Rent" read as an answer to a question nobody asked.
const PICKER_CHIPS: Chip[] = [
  { label: 'Rent I can afford', value: 'rent' }, { label: 'What an offer is worth', value: 'offer' },
  { label: 'Where should my money go?', value: 'money' },
]

/**
 * Prompts to use WeLeap say and do what the text thread's do (golden rule: web and text behave the same). Each
 * line is the text thread's own (weleap-advisor backend/users/rentpilot.go: planInviteText, handOffText,
 * appLinkText) with only the channel word changed. The page puts the app-link card under each, as the text
 * thread sends the link as a card. One invite per thread, shared by a planning question and an account question.
 */
// The same words as the text thread (backend users/rentpilot.go planInviteText, handOffText, appLinkText): one
// Ribbit on both doors. Save and connect, never install: the link opens the plan page, not an app store.
export const INVITE_TEXT = "Save this plan in WeLeap and connect your bank for one built on your real numbers. I'll take it from there."
export const HANDOFF_TEXT = "Your savings, debts and plan live in WeLeap, not in this chat. Save your plan there and connect your bank, and I'll answer from your real numbers."
export const APP_LINK_TEXT = "Your balances and spending aren't in this chat, so that one needs WeLeap."

/** After a planning question before any tool: the offer to work it out with their numbers. */
export const MONEY_OFFER_TEXT = 'Want me to work out your order with your numbers? Four quick questions.'
export const MONEY_BACK_FAILED_TEXT = "I couldn't get back to your question just now. Ask it again here and I'll answer it with these numbers."
export const MONEY_REOFFER_TEXT = 'Want me to check that against your pay? Same four quick questions.'
/** A purchase being planned ("can I afford a car?", "is now a good time to buy?"): offered the money flow like a plan question. */
const AFFORD_QUESTION = /\b(can i afford|afford (a|an|to)|good time to (buy|get)|is (now|it|this) a good time|should i (buy|get) (a|an)\b|i want to buy|thinking (of|about) buying|planning (to buy|on buying)|sav(e|ing) (up )?for (a |an |my )?(house|home|car|wedding|down payment)|down payment)/i
const YES = /^\s*(yes|yeah|yep|yup|sure|ok(ay)?|y|please|let'?s do it|do it|go ahead|sounds good)\b[\s.!]*(please)?[\s.!]*$/i
const NO = /^\s*(no|nope|nah|not now|no thanks|later)\b[\s.!]*$/i
const MONEY_OFFER_CHIPS: Chip[] = [{ label: 'Yes, work it out', value: 'money' }, { label: 'Not now', value: 'not_now' }]

function cityChips(): Chip[] {
  return [...getAvailableCities().map((c) => ({ label: c, value: c })), { label: 'Somewhere else', value: SOMEWHERE_ELSE }]
}

// ── Starting ──────────────────────────────────────────────────────────────────────────────────────────────

export function start(flow: Flow | null): Step {
  const state: ChatState = { flow, turn: flow === 'rent' ? 'R1' : flow === 'offer' ? 'O1' : flow === 'money' ? 'M1' : 'P0', facts: {}, history: [] }
  if (!flow) {
    return say(state, [{ from: 'ribbit', text: 'What are we working out?', turn: 'P0' }],
      PICKER_CHIPS, 'text')
  }
  return flow === 'rent' ? askSalary(state) : flow === 'offer' ? askOfferSalary(state) : askMoneySalary(state)
}

function say(state: ChatState, messages: ChatMessage[], chips: Chip[], input: Step['input'], events: ChatEvent[] = []): Step {
  const ask = openQuestion(messages)
  const out = messages.filter((m) => m.from === 'ribbit').map((m) => ({ from: 'out' as const, text: m.text }))
  return { state: { ...state, history: [...state.history, ...out].slice(-12), ui: { chips, input, ask } }, messages, chips, input, events }
}

/**
 * The question a turn asks: the last sentence ending in "?" in its last message ("Any monthly debt payments, like
 * a car, student loans or card minimums?" out of a message that goes on after it). A turn that ends on an
 * instruction ("Pick the number you'd actually sign at.") has no question to name; the previous one is closed.
 */
function openQuestion(messages: ChatMessage[]): string | undefined {
  const asked = messages.filter((m) => m.from === 'ribbit').pop()?.text.match(/[^.?!]*\?/g)
  return asked?.[asked.length - 1].trim()
}

const win = (turn: string): ChatEvent => ({ name: 'ribbit_win_shown', props: { turn } })

// ── Replying ──────────────────────────────────────────────────────────────────────────────────────────────

export interface Reply { chip?: string; text?: string }

/**
 * One reply. `chip` is a tapped option's value; `text` is typed. The person's own words are added to the thread
 * by the caller (it already shows them); this returns what Ribbit says next.
 */
export async function reply(prev: ChatState, r: Reply, svc: ChatServices): Promise<Step> {
  const state: ChatState = {
    ...prev,
    facts: { ...prev.facts },
    history: [...prev.history, { from: 'in' as const, text: r.text ?? r.chip ?? '' }].slice(-12),
  }
  const turnEvent: ChatEvent = { name: 'ribbit_turn', props: { turn: prev.turn, reply_kind: r.chip ? 'chip' : 'typed' } }
  const step = await route(state, r, svc)
  return { ...step, events: [turnEvent, ...step.events] }
}

async function route(state: ChatState, r: Reply, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const text = (r.text ?? '').trim()
  const chip = r.chip

  if (chip === '__math__') return showMath(state)

  switch (state.turn) {
    case 'P0': {
      // With the money offer on screen, a typed "yes" is "Yes, work it out" and a typed "no" is "Not now"; sent to
      // Ribbit as a question, a bare "yes" got a stray answer or, twice in three tries, none at all.
      const offerOpen = Boolean(f.moneyOffered && !f.moneyDeclined && state.ui?.chips?.some((c) => c.value === 'money'))
      const typedPick = offerOpen && YES.test(text) ? 'money' : offerOpen && NO.test(text) ? 'not_now' : ''
      const pick = chip ?? (typedPick || (/where should my money go/i.test(text) ? 'money' : /offer|job/i.test(text) ? 'offer' : /rent/i.test(text) ? 'rent' : ''))
      if (pick === 'rent') return askSalary({ ...state, flow: 'rent', turn: 'R1' })
      if (pick === 'offer') return askOfferSalary({ ...state, flow: 'offer', turn: 'O1' })
      if (pick === 'money') return askMoneySalary({ ...state, flow: 'money', turn: 'M1' })
      if (pick === 'not_now') return say({ ...state, facts: { ...f, moneyDeclined: true } }, [{ from: 'ribbit', text: 'Sure. Ask me anything, or pick one to work out.' }], PICKER_CHIPS, 'text')
      return question(state, text, svc, 'which tool to use: rent or a job offer')
    }

    // ── Rent ──────────────────────────────────────────────────────────────────────────────────────────────
    case 'R1':
    case 'R1_amount': {
      if (chip === 'salary' || chip === 'take_home') {
        return say({ ...state, turn: 'R1_amount', facts: { ...f, takeHomeFrom: chip === 'salary' ? 'salary' : 'typed' } },
          [{ from: 'ribbit', text: chip === 'salary' ? "What's the yearly salary?" : 'How much take-home lands each month?' }], [], 'money')
      }
      const n = parseMoney(text)
      if (!n) return question(state, text, svc, 'their salary or monthly take-home')
      takeIncome(f, n, state.turn === 'R1_amount' ? (f.takeHomeFrom === 'typed' ? 'take_home' : 'salary') : salaryOrTakeHome(n))
      const takeHome = f.takeHomeMonthly ?? 0
      f.range = calculateRentRange(takeHome, 0)
      const basis = f.takeHomeFrom === 'salary'
        ? `On ${fc(n)} a year, take-home before state tax is about ${fc(takeHome)} a month.`
        : `On ${fc(n)} a month take-home,`
      const line = f.takeHomeFrom === 'salary' ? `${basis} Rent that fits is ${f.range.formatted}.` : `${basis} rent that fits is ${f.range.formatted}.`
      f.rangeSpendingCheckShown = true
      // The thread's first app offer, as the city-answer invite was: later turns don't invite again.
      return say({ ...state, turn: 'R2', invited: true }, [
        { from: 'ribbit', text: line, figure: span(f.range.low, f.range.high), figureLabel: 'Rent that fits', turn: 'R2' },
        spendingCheck(RANGE_SPENDING_CHECK_TEXT, RANGE_SPENDING_CHECK_NOTE),
        { from: 'ribbit', text: 'Which city?' },
      ], [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [win('R2'), { name: 'ribbit_spending_check_shown', props: { turn: 'R2' } }])
    }
    case 'R2':
    case 'O2':
      return chooseLocation(state, chip, text, svc)
    case 'R2_metro':
    case 'O2_metro':
      return chooseMetro(state, chip, text, svc)
    case 'R2_state':
    case 'O2_state':
      return chooseState(state, chip, text, svc)
    case 'R3_roommate': {
      const v = chip ?? (/^y/i.test(text) ? 'yes' : /^n(o|ope)?\b/i.test(text) ? 'no' : /not sure|maybe/i.test(text) ? 'not_sure' : '')
      if (!v) return question(state, text, svc, 'whether they will have a roommate')
      f.roommate = v as Facts['roommate']
      const lead = v === 'yes' ? 'Then your share is what counts: aim for your share inside your range.' : v === 'no' ? 'Solo it is.' : 'Worth deciding before you tour.'
      return askDebt(state, lead)
    }
    case 'R3_debt': {
      if (chip === 'none' || /^(none|no|nope|zero|0)\b/i.test(text)) { f.debtMonthly = 0; return askPick(state, 'No debt to take off.') }
      if (chip === 'yes') return say({ ...state, turn: 'R3_debt_amount' }, [{ from: 'ribbit', text: 'About how much a month, all together?' }], [], 'money')
      const n = parseMoney(text)
      if (n !== null) return applyDebt(state, n)
      return question(state, text, svc, 'their monthly debt payments')
    }
    case 'R3_debt_amount': {
      const n = parseMoney(text)
      if (n === null) return question(state, text, svc, 'their monthly debt payments, as a number')
      return applyDebt(state, n)
    }
    case 'R4': {
      const range = f.range!
      let pick: number | null = null
      if (chip === 'low') pick = range.low
      else if (chip === 'mid') pick = mid50(range.low, range.high)
      else if (chip === 'high') pick = range.high
      else if (chip === 'other') return say({ ...state, turn: 'R4' }, [{ from: 'ribbit', text: 'What number would you sign at?' }], [], 'money')
      else pick = parseMoney(text)
      if (!pick) return question(state, text, svc, 'the monthly rent they would sign at')
      f.pick = pick
      const saving = Math.max(0, range.high - pick)
      const lead = saving > 0
        ? `At ${fc(pick)} you free up ${fc(saving)} a month compared to the top of your range.`
        : pick > range.high
          ? `${fc(pick)} is above your range of ${range.formatted}, so it leaves less for everything else.`
          : `${fc(pick)} is the top of your range.`
      const won: ChatMessage = { from: 'ribbit', text: lead, figure: saving > 0 ? `${fc(saving)}/mo` : undefined, figureLabel: 'Freed up each month', turn: 'R5' }
      if (!f.spendingCheckShown) {
        f.spendingCheckShown = true
        return say({ ...state, turn: 'R4b' }, [won, spendingCheck(
          `Before you sign at ${fc(pick)}: this range assumes the rest of your spending fits. That's the one thing I can't see. Want to check it against what you actually spend?`,
          `Connect your bank in WeLeap, about 2 minutes. You'll see what you spent last month next to ${fc(pick)}, and what's left.`,
        )], KEEP_GOING, 'text', [win('R5'), { name: 'ribbit_spending_check_shown', props: { turn: 'R4' } }])
      }
      return askStart(state, [won], [win('R5')])
    }
    case 'R4b':
      // Past the spending check without tapping it: on to the start date. A typed start answer is read as one.
      if (chip === 'keep') return askStart(state, [])
      return route({ ...state, turn: 'R5' }, r, svc)
    case 'R5': {
      const v = chip ?? (/already|working/i.test(text) ? 'working' : /this month/i.test(text) ? 'this_month' : /next month/i.test(text) ? 'next_month' : '')
      if (v === 'date') return say({ ...state, turn: 'R5_date' }, [{ from: 'ribbit', text: 'What date? Month and day is fine.' }], [], 'text')
      if (!v) return question(state, text, svc, 'when the job starts')
      f.start = v as Facts['start']
      return upfrontTurn(state)
    }
    case 'R5_date': {
      const d = new Date(text)
      if (Number.isNaN(d.getTime())) return question(state, text, svc, 'the start date')
      f.start = 'date'
      f.startDate = d.toISOString().slice(0, 10)
      return upfrontTurn(state)
    }
    case 'R6': {
      const v = chip ?? (/rebuild|refill|cushion|buffer|emergency|back up|move|moving|upfront|deposit/i.test(text) ? 'cushion' : /card|debt/i.test(text) ? 'card' : /future|invest|retire|later|sav(e|ing)/i.test(text) ? 'future' : '')
      if (v === 'upfront_math') return upfrontMath(state)
      if (!v) return question(state, text, svc, 'what the money they free up is for')
      f.purpose = v as Facts['purpose']
      return purposeTurn(state)
    }
    case 'R7_card': {
      const two = parseTwoNumbers(text)
      if (!two) return question(state, text, svc, 'the card balance and its interest rate')
      return cardPayoff(state, two[0], two[1])
    }
    // ── Where should my money go? ─────────────────────────────────────────────────────────────────────────
    case 'M1':
    case 'M1_amount': {
      if (chip === 'salary' || chip === 'take_home') {
        return say({ ...state, turn: 'M1_amount', facts: { ...f, takeHomeFrom: chip === 'salary' ? 'salary' : 'typed' } },
          [{ from: 'ribbit', text: chip === 'salary' ? "What's the yearly salary?" : 'How much take-home lands each month?' }], [], 'money')
      }
      const n = parseMoney(text)
      if (!n) return question(state, text, svc, 'their salary or monthly take-home')
      takeIncome(f, n, state.turn === 'M1_amount' ? (f.takeHomeFrom === 'typed' ? 'take_home' : 'salary') : salaryOrTakeHome(n))
      // A salary needs the state for its take-home; a typed take-home already is one.
      if (f.takeHomeFrom === 'salary') {
        return say({ ...state, turn: 'M2' }, [
          { from: 'ribbit', text: `On ${fc(n)} a year, take-home before state tax is about ${fc(f.takeHomeMonthly ?? 0)} a month. Where do you live?` },
        ], cityChips(), 'location')
      }
      return askMoneyRent(state, '')
    }
    case 'M2':
      return chooseLocation(state, chip, text, svc)
    case 'M2_state':
      return chooseState(state, chip, text, svc)
    case 'M3': {
      const none = chip === 'none' || /no rent|don'?t pay|live with|free|^0$/i.test(text)
      const n = none ? 0 : parseMoney(text)
      if (n === null) return question(state, text, svc, 'their monthly rent')
      f.pick = n
      return askMoneyDebt(state)
    }
    case 'M4':
    case 'M4_more': {
      if (chip === 'none' || /^(none|no|nope|zero|no debt)\b/i.test(text)) { f.debt = undefined; f.pendingDebt = undefined; return askMoneyMatch(state) }
      const pending = f.pendingDebt ?? {}
      // Asked for one missing piece, the answer fills that piece only: "120" for the payment is not a new balance.
      const missing = state.turn === 'M4_more' ? missingDebtPart(pending) : undefined
      let read: Partial<MoneyDebt> = chip === 'card' || chip === 'loan' ? { kind: chip } : parseDebt(text)
      if (missing) {
        const n = read[missing] ?? parseMoney(text)
        read = n !== null && n !== undefined ? { [missing]: n } : {}
      }
      const d = { ...pending, ...Object.fromEntries(Object.entries(read).filter(([, v]) => v !== undefined)) } as Partial<MoneyDebt>
      // "card", "a loan", "yes": a debt with no numbers yet is still an answer; ask for its balance next.
      const saidYes = !missing && /^(yes|yeah|yep|yup|i do|i have|one)\b/i.test(text)
      if (!d.balance && !d.aprPct && !d.payment && !d.kind && !saidYes) return question(state, text, svc, 'their biggest card or loan: its balance, rate and monthly payment')
      const next = missingDebtPart(d)
      if (next) {
        f.pendingDebt = d
        const it = d.kind === 'card' ? 'the card' : d.kind === 'loan' ? 'the loan' : 'it'
        const ask = next === 'balance' ? `What's the balance on ${it}?` : next === 'aprPct' ? `What's the interest rate on ${it}?` : `What do you pay on ${it} a month?`
        return say({ ...state, turn: 'M4_more' }, [{ from: 'ribbit', text: ask }], [], next === 'aprPct' ? 'text' : 'money')
      }
      f.debt = d as MoneyDebt
      f.pendingDebt = undefined
      return askMoneyMatch(state)
    }
    case 'M5':
    case 'M5_formula':
    case 'M5_rate':
      return moneyMatch(state, chip, text, svc)
    case 'M6':
      if (chip === 'keep' || /^(y|yes|keep|save)/i.test(text)) return planEnding(state, [])
      return question(state, text, svc, 'whether to keep this as their plan')

    case 'O6': {
      // Past the 401k spending check: on to rent. Asking about rent directly works too.
      if (chip === 'keep' || chip === 'rent' || /keep|go on|continue|rent/i.test(text)) return offerRent(state)
      return question(state, text, svc, '')
    }

    // ── Offer ─────────────────────────────────────────────────────────────────────────────────────────────
    case 'O1': {
      const n = parseMoney(text)
      if (!n || n < 1_000) return question(state, text, svc, 'the base salary in the offer')
      f.salary = n
      f.takeHomeFrom = 'salary'
      f.takeHomeMonthly = beforeStateTakeHome(n)
      f.takeHomeBeforeState = true
      return say({ ...state, turn: 'O2' }, [
        { from: 'ribbit', text: `On ${fc(n)}, take-home before state tax and any 401k is about ${fc(f.takeHomeMonthly)} a month.`, figure: `${fc(f.takeHomeMonthly)}/mo`, figureLabel: 'Take-home before state tax', turn: 'O2' },
        { from: 'ribbit', text: 'Which city is the job in?' },
      ], [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [win('O2')])
    }
    case 'O3':
    case 'O3_amount':
      return offerExtras(state, chip, text, svc)
    case 'O4':
    case 'O4_formula':
    case 'O4_rate':
      return offerMatch(state, chip, text, svc)
    case 'O5': {
      if (chip === 'skip' || /skip|no/i.test(text)) return offerRent(state)
      if (chip === 'put_in' || /what|put|how much/i.test(text)) return offerElection(state)
      return question(state, text, svc, 'whether they want to know what to put in')
    }
    case 'O7': {
      if (chip === 'yes' || /^y/i.test(text)) {
        // Into the rent flow with what the offer already knows: take-home and place. City asked only if absent.
        const next: ChatState = { ...state, flow: 'rent', facts: { ...f, switchedFrom: 'offer', range: calculateRentRange(f.takeHomeMonthly ?? 0, 0) } }
        return f.region || f.presetCity || f.outsideMetro ? marketTurn(next, svc) : say({ ...next, turn: 'R2' }, [{ from: 'ribbit', text: 'Which city?' }], cityChips(), 'location')
      }
      if (chip === 'later' || /later|no/i.test(text)) return planEnding(state, [])
      return question(state, text, svc, 'whether to work out rent now')
    }
    case 'R8':
    case 'O8':
    case 'M8':
    case 'done':
      // The ending's "Not ready to connect? Text me each step instead" opens the text sign-up.
      if (chip === 'text') return handoff(state)
      return question(state, text, svc, '')
  }
  return question(state, text, svc, '')
}

// ── Take-home ───────────────────────────────────────────────────────────────────────────────────────────────

/** Federal income tax and FICA only: the first answer, before anybody has said where. Labelled as such. */
function beforeStateTakeHome(salary: number): number {
  return Math.round((salary - federalTax(taxableIncome(salary, 0)) - ficaTax(salary)) / 12)
}

/** A salary (taken before state tax, the location refines it) or a monthly take-home as typed. */
function takeIncome(f: Facts, n: number, kind: 'salary' | 'take_home'): void {
  if (kind === 'salary') {
    f.salary = n
    f.takeHomeFrom = 'salary'
    f.takeHomeMonthly = beforeStateTakeHome(n)
    f.takeHomeBeforeState = true
  } else {
    f.takeHomeMonthly = n
    f.takeHomeFrom = 'typed'
    f.takeHomeBeforeState = false
  }
}

/**
 * Take-home with the location, the way each page does it: /api/tax for federal, state and FICA, then local
 * income tax. The rent page charges local tax only for its preset cities (its "Other" path has a state and no
 * city); the offer page keys it by the ZORI region its city list holds. Parity means the same rule per flow.
 */
async function locate(state: ChatState, svc: ChatServices): Promise<void> {
  const f = state.facts
  if (f.takeHomeFrom !== 'salary' || !f.salary || !f.stateCode) return
  const tax = await svc.tax(f.salary, f.stateCode)
  if (!tax) return
  const localKey = state.flow === 'offer' ? f.region?.regionName : f.presetCity
  const local = localKey ? localTaxAnnual(localKey, Math.max(0, f.salary - STANDARD_DEDUCTION_2026_SINGLE)) : 0
  f.tax = { ...tax, localTaxAnnual: local }
  f.takeHomeMonthly = Math.max(0, tax.netIncomeAnnual - local) / 12
  f.takeHomeBeforeState = false
}

function placeTaxLine(f: Facts): string {
  if (!f.tax) return ''
  const parts = ['federal']
  if (f.tax.stateTaxAnnual > 0) parts.push(`${STATE_NAME(f.stateCode)} state`)
  if (f.tax.localTaxAnnual > 0) parts.push('city')
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
  const noState = f.tax.stateTaxAnnual <= 0 ? ` ${STATE_NAME(f.stateCode)} has no state income tax.` : ''
  return `In ${f.place}, take-home is about ${fc(f.takeHomeMonthly ?? 0)} a month after ${list} income tax and FICA.${noState}`
}

// ── Location ────────────────────────────────────────────────────────────────────────────────────────────────

const LOCATION_TURN: Record<Flow, string> = { rent: 'R2', offer: 'O2', money: 'M2' }

async function chooseLocation(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pfx = LOCATION_TURN[state.flow ?? 'rent']
  if (chip === SOMEWHERE_ELSE || /somewhere else|other/i.test(text)) {
    return say({ ...state, turn: `${pfx}_state` }, [{ from: 'ribbit', text: 'Which state?' }], [], 'location')
  }
  const preset = chip && getAvailableCities().includes(chip) ? chip : matchPresetCity(text)
  if (preset) {
    f.presetCity = preset
    f.stateCode = getStateCodeForCity(preset)
    f.region = metroMapping[preset] ?? undefined
    f.outsideMetro = false
    f.place = f.region?.regionName.split(',')[0] ?? preset
    return afterLocation(state, svc)
  }
  // A typed city, anywhere the rent data has a metro ("Dallas", "Charlotte NC", "Houston, Texas"): one match is
  // the answer, several ("Portland") are the options. Before, only the presets and state names were read.
  const { city, stateCode } = splitCityState(text)
  if (city && svc.findMetros) {
    const hits = await svc.findMetros(city, stateCode)
    if (hits.length === 1) return metroChosen(state, hits[0].value, hits[0].stateCode, svc)
    if (hits.length > 1) {
      f.metroOptions = hits.map((h) => ({ label: h.label, value: h.value }))
      f.stateCode = undefined
      return say({ ...state, turn: `${pfx}_metro` }, [{ from: 'ribbit', text: 'Which one?' }], [
        ...hits.map((h) => ({ label: h.label, value: h.value })),
        { label: 'Somewhere else', value: SOMEWHERE_ELSE },
      ], 'location')
    }
  }
  // A town with its state that is no metro ("Ashburn VA"): the state's areas, the town named.
  if (city && stateCode && looksLikePlace(city)) {
    f.typedTown = townName(city)
    return chooseState({ ...state, turn: `${pfx}_state` }, undefined, stateCode, svc)
  }
  const st = matchState(text)
  if (st) return chooseState({ ...state, turn: `${pfx}_state` }, undefined, st.code, svc)
  // A town the rent data doesn't know ("La Vernia"): ask its state rather than hand it to Ribbit, which left paid
  // visitors in small towns and suburbs typing at "Which city?" (Oct 28-29). A real question still goes to Ribbit.
  if (city && looksLikePlace(city)) {
    f.typedTown = townName(city)
    return say({ ...state, turn: `${pfx}_state` }, [{ from: 'ribbit', text: `Which state is ${f.typedTown} in?` }], [], 'location')
  }
  return question(state, text, svc, 'which city the job or the rent is in')
}

/**
 * A typed place name rather than a question or a remark: letters only, up to four words, and none of the words people
 * type at the city question that are not places ("card or invest", "not sure", "how much is utilities").
 */
const NOT_A_PLACE = /\b(card|cards|invest\w*|debt\w*|loan\w*|sav\w*|rent\w*|pay\w*|salary|budget|money|401k|ira|roth|tax\w*|credit|afford\w*|utilit\w*|first|or|and|my|me|i|you|yes|no|ok|okay|thanks|help|sure|idk|dunno|what|how|why|when|which|who|should|can|could|would|is|are|do|does|will|much|live|move\w*|city|town|area)\b/i
function looksLikePlace(text: string): boolean {
  const t = text.trim()
  return /^[A-Za-z][A-Za-z .'-]{1,40}$/.test(t) && t.split(/\s+/).length <= 4 && !NOT_A_PLACE.test(t)
}

/** A typed town as it is named back: "la vernia" → "La Vernia"; typed capitals are kept. */
function townName(city: string): string {
  const t = city.trim().replace(/\s+/g, ' ')
  return t === t.toLowerCase() ? t.replace(/\b[a-z]/g, (c) => c.toUpperCase()) : t
}

/**
 * The 50 largest US metros by population, by their rent-data city: a state's areas list them first. The rent data
 * comes in rent order, so Texas's first eight left out Houston, San Antonio and Austin.
 */
const LARGEST_METROS = new Set(['New York', 'Los Angeles', 'Chicago', 'Dallas', 'Houston', 'Washington', 'Philadelphia', 'Miami', 'Atlanta', 'Boston', 'Phoenix', 'San Francisco', 'Riverside', 'Detroit', 'Seattle', 'Minneapolis', 'San Diego', 'Tampa', 'Denver', 'Baltimore', 'St. Louis', 'Orlando', 'Charlotte', 'San Antonio', 'Portland', 'Sacramento', 'Pittsburgh', 'Austin', 'Las Vegas', 'Cincinnati', 'Kansas City', 'Columbus', 'Indianapolis', 'Cleveland', 'San Jose', 'Nashville', 'Virginia Beach', 'Providence', 'Jacksonville', 'Milwaukee', 'Raleigh', 'Oklahoma City', 'Memphis', 'Richmond', 'Louisville', 'New Orleans', 'Salt Lake City', 'Hartford', 'Buffalo', 'Birmingham'])
function largestFirst(options: { label: string; value: string }[]): { label: string; value: string }[] {
  const big = (o: { value: string }) => LARGEST_METROS.has(o.value.split(',')[0].trim())
  return [...options.filter(big), ...options.filter((o) => !big(o))]
}

/** The area options for a state, with the town's own way out when it was typed. */
function areaChips(f: Facts): Chip[] {
  return [
    ...largestFirst(f.metroOptions ?? []).slice(0, 8).map((o) => ({ label: o.label, value: o.value })),
    { label: f.typedTown ? 'Use my range on its own' : 'Outside a metro', value: OUTSIDE_METRO },
  ]
}

/** A metro picked or typed: its state prices the tax, its region the rents. */
async function metroChosen(state: ChatState, region: string, stateCode: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  f.stateCode = stateCode
  f.presetCity = undefined
  f.region = { stateName: stateCode, regionName: region }
  f.outsideMetro = false
  f.place = region.split(',')[0]
  return afterLocation(state, svc)
}

async function chooseState(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pfx = LOCATION_TURN[state.flow ?? 'rent']
  const st = matchState(chip ?? text)
  if (!st) return question(state, text, svc, 'which US state')
  f.stateCode = st.code
  f.presetCity = undefined
  if (state.flow === 'money') {
    // Only the state's tax matters here: no metro, no rents.
    f.region = undefined
    f.outsideMetro = true
    f.place = f.typedTown ?? st.name
    return afterLocation(state, svc)
  }
  // "Which state is La Vernia in?" answered: the town may still be a metro there.
  if (f.typedTown && svc.findMetros) {
    const hits = await svc.findMetros(f.typedTown, st.code)
    if (hits.length === 1) return metroChosen(state, hits[0].value, hits[0].stateCode, svc)
  }
  const options = await svc.metros(st.code)
  f.metroOptions = options.filter((o) => o.value !== OUTSIDE_METRO)
  if (!f.metroOptions.length) {
    f.outsideMetro = true
    f.region = undefined
    f.place = f.typedTown ?? st.name
    return afterLocation(state, svc)
  }
  const ask = f.typedTown ? `I don't have rent prices for ${f.typedTown}. Which of these is it closest to, or type the nearest city?` : `Which area of ${st.name}?`
  return say({ ...state, turn: `${pfx}_metro` }, [{ from: 'ribbit', text: ask }], areaChips(f), 'location')
}

async function chooseMetro(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const options = f.metroOptions ?? []
  if (chip === OUTSIDE_METRO || /outside|rural|none|on its own/i.test(text)) {
    f.outsideMetro = true
    f.region = undefined
    f.place = f.typedTown ?? STATE_NAME(f.stateCode)
    return afterLocation(state, svc)
  }
  if (chip === SOMEWHERE_ELSE) {
    return say({ ...state, turn: `${LOCATION_TURN[state.flow ?? 'rent']}_state` }, [{ from: 'ribbit', text: 'Which state?' }], [], 'location')
  }
  const t = (chip ?? text).toLowerCase()
  const hit = options.find((o) => o.value.toLowerCase() === t) ?? options.find((o) => o.label.toLowerCase().includes(t) && t.length >= 3)
  if (!hit && !chip) {
    // A typed place in the rent data ("Dallas TX" against "Dallas, TX") is that metro.
    const { city } = splitCityState(text)
    if (city && svc.findMetros) {
      const hits = await svc.findMetros(city, f.stateCode)
      if (hits.length === 1) return metroChosen(state, hits[0].value, hits[0].stateCode, svc)
    }
    // A town the data doesn't know (Oct 29: "Which area of Virginia?" answered eight times, all sent to Ribbit):
    // say so once with the way out, then carry on with the range alone. A real question still goes to Ribbit.
    if (city && looksLikePlace(city)) {
      f.typedTown = townName(city)
      if (!f.metroMisses) {
        f.metroMisses = 1
        return say({ ...state }, [{ from: 'ribbit', text: `I don't have rent prices for ${f.typedTown}. Pick or type the closest area, or use your range on its own.` }], areaChips(f), 'location')
      }
      f.outsideMetro = true
      f.region = undefined
      f.place = f.typedTown
      return afterLocation(state, svc)
    }
  }
  if (!hit) return question(state, text, svc, f.stateCode ? `which area of ${STATE_NAME(f.stateCode)}` : 'which of those places')
  // From "Which one?" across states ("Portland, OR" or "Portland, ME") the state is the option's own.
  return metroChosen(state, hit.value, f.stateCode ?? hit.value.match(/, ([A-Z]{2})$/)?.[1] ?? '', svc)
}

async function afterLocation(state: ChatState, svc: ChatServices): Promise<Step> {
  await locate(state, svc)
  if (state.flow === 'offer') return offerAfterLocation(state)
  if (state.flow === 'money') return askMoneyRent(state, placeTaxLine(state.facts))
  state.facts.range = calculateRentRange(state.facts.takeHomeMonthly ?? 0, state.facts.debtMonthly ?? 0)
  return marketTurn(state, svc)
}

// ── Rent turns ──────────────────────────────────────────────────────────────────────────────────────────────

function askSalary(state: ChatState): Step {
  return say({ ...state, turn: 'R1' }, [
    // Each option names its period: "salary, or take-home per month" read as both monthly, then "Salary" asked
    // for a yearly figure.
    { from: 'ribbit', text: "Let's work out what rent fits. What's your yearly salary, or your monthly take-home? Either works.", turn: 'R1' },
  ], [{ label: 'Yearly salary', value: 'salary' }, { label: 'Monthly take-home', value: 'take_home' }], 'money')
}

/**
 * Market rents for the place, as the rent page reads them: ZORI for the region (preset mapping or the chosen
 * metro), the HUD table for a preset city ZORI does not cover, and nothing for outside a metro.
 */
async function marketTurn(state: ChatState, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const range = f.range ?? calculateRentRange(f.takeHomeMonthly ?? 0, f.debtMonthly ?? 0)
  f.range = range
  let market: Facts['market'] = null
  if (f.region) {
    const median = await svc.medianRent(f.region.stateName, f.region.regionName)
    if (median) {
      const m = calculateMarketRentRange(median)
      market = { low: m.marketLow, high: m.marketHigh, median: m.medianRent, tier: m.tier, source: 'zori' }
    }
  }
  if (!market && f.presetCity) {
    const hud = getHUDRentRange(f.presetCity)
    if (hud) market = { low: hud.low, high: hud.high, median: Math.round((hud.low + hud.high) / 2), tier: 'HUD', source: 'hud' }
  }
  f.market = market
  // With no state or city tax the take-home, and so the range, is the one just shown: say so in a line rather than
  // repeat both figures (Dallas: "$5,719" and "$1,600–$2,000" twice in a row).
  const unchanged = f.tax && f.tax.stateTaxAnnual <= 0 && !(f.tax.localTaxAnnual > 0)
  const taxLine = f.takeHomeFrom === 'salary' && f.tax
    ? unchanged
      ? `${STATE_NAME(f.stateCode)} has no state income tax, so your range stays the same.`
      : `${placeTaxLine(f)} Rent that fits is ${range.formatted}.`
    : ''
  // The city answer gets the headline card in every version.
  const fitsCard = { figure: span(range.low, range.high), figureLabel: 'Rent that fits' }
  if (!market) {
    const none = f.outsideMetro && !f.typedTown ? `I don't have rental prices outside a metro, so your range stands on its own.` : `I don't have rental prices for ${f.place}, so your range stands on its own.`
    return askDebt(state, [taxLine, none].filter(Boolean).join(' '), 'R3', fitsCard)
  }
  const verdict = marketRentVerdict(range.high, market.low, market.high)
  const band = `Rentals in ${f.place} run ${fc(market.low)} to ${fc(market.high)}`
  const marketCard = { figure: span(market.low, market.high), figureLabel: `${f.place} rentals`, compare: { label: 'Rent that fits', value: span(range.low, range.high) } }
  if (verdict === 'in_reach') {
    return askDebt(state, [taxLine, `${band}, inside your range.`].filter(Boolean).join(' '), 'R3', marketCard)
  }
  const where = verdict === 'out_of_reach' ? 'above your range' : 'and only the low end fits your range'
  // Sallie Mae survey reported by Realtor.com (Jul 21, 2025): in the first two years after school, 8% rent solo
  // and 8% rent with roommates — about half of recent grads who rent.
  return say({ ...state, turn: 'R3_roommate' }, [
    { from: 'ribbit', text: [taxLine, `${band}, ${where}. Among recent grads who rent, about half share with roommates.`].filter(Boolean).join(' '), ...marketCard, turn: 'R3' },
    { from: 'ribbit', text: 'Roommate?' },
  ], [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }, { label: 'Not sure yet', value: 'not_sure' }], 'text', [win('R3')])
}

function askDebt(state: ChatState, lead: string, winTurn?: string, card?: Pick<ChatMessage, 'figure' | 'figureLabel' | 'compare'>): Step {
  return say({ ...state, turn: 'R3_debt' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, turn: winTurn, ...card }] : []),
    { from: 'ribbit', text: 'Any monthly debt payments, like a car, student loans or card minimums? They come off the range.' },
  ], [{ label: 'None', value: 'none' }, { label: 'Yes', value: 'yes' }], 'money', [...(winTurn ? [win(winTurn)] : [])])
}

/**
 * The app offer on the first rent range (decided Oct 30): after the Oct 29 deploy, 4 of 6 rent chats left at this
 * range, and the 2 who reached the spending check at the pick both tapped it, while the "Save my plan" invite on the
 * city answer got none. "Which city?" still follows, so narrowing it down costs no tap.
 */
export const RANGE_SPENDING_CHECK_TEXT =
  "That range assumes the rest of your spending fits, and that's the one part I can't see. Want to check it against what you actually spend?"
/** Under the button: no bank in the first ask (Oct 29 call, "check it against real spending"). */
export const RANGE_SPENDING_CHECK_NOTE = "Free in WeLeap. See last month's spending next to this range."

function applyDebt(state: ChatState, debt: number): Step {
  const f = state.facts
  f.debtMonthly = debt
  f.range = calculateRentRange(f.takeHomeMonthly ?? 0, debt)
  return askPick(state, debt > 0 ? `With ${fc(debt)} a month in debt payments, rent that fits is ${f.range.formatted}.` : '')
}

function askPick(state: ChatState, lead: string): Step {
  const r = state.facts.range!
  return say({ ...state, turn: 'R4' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, figure: state.facts.debtMonthly ? span(r.low, r.high) : undefined, figureLabel: 'Rent that fits, after debt' }] : []),
    { from: 'ribbit', text: "Pick the number you'd actually sign at.", turn: 'R4' },
  ], [
    { label: fc(r.low), value: 'low' }, { label: fc(mid50(r.low, r.high)), value: 'mid' }, { label: fc(r.high), value: 'high' },
    { label: 'Other', value: 'other' }, { label: 'Show me the math', value: '__math__' },
  ], 'money', [win('R4')])
}

function upfrontTurn(state: ChatState): Step {
  const f = state.facts
  const up = calculateUpfrontCash(f.range!, f.takeHomeMonthly ?? 0)
  f.upfront = { low: up.low, high: up.high }
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const lead = f.start === 'working'
    ? `Moving takes about ${fc(up.low)} to ${fc(up.high)} upfront: deposit, first month and setup.`
    : `Your first paycheck may not land for a few weeks, so you'll want ${fc(up.low)} to ${fc(up.high)} upfront.`
  if (saving <= 0) return handoff({ ...state, turn: 'R6' }, lead)
  return say({ ...state, turn: 'R6' }, [
    { from: 'ribbit', text: lead, figure: `${fc(up.low)}–${fc(up.high)}`, figureLabel: 'Cash to have before you move', turn: 'R6' },
    { from: 'ribbit', text: purposeQuestion(f) },
  ], [...PURPOSE_CHIPS, { label: 'How the upfront is worked out', value: 'upfront_math' }], 'text', [win('R6')])
}

// The freed-up amount was stated two turns back (R5), with the start date and the upfront cash in between, so the
// question says again where it comes from. The options are what the money does, not labels.
const PURPOSE_CHIPS: Chip[] = [
  { label: 'Rebuild my savings after the move', value: 'cushion' }, { label: 'Paying down a card', value: 'card' }, { label: 'Saving for later', value: 'future' },
]
function purposeQuestion(f: Facts): string {
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  return `Signing at ${fc(f.pick ?? 0)} instead of ${fc(f.range?.high ?? 0)} leaves ${fc(saving)} a month. Where should that ${fc(saving)} go?`
}

function askStart(state: ChatState, lead: ChatMessage[], events: ChatEvent[] = []): Step {
  return say({ ...state, turn: 'R5' }, [...lead, { from: 'ribbit', text: 'When does the job start?' }], [
    { label: 'Already working', value: 'working' }, { label: 'This month', value: 'this_month' },
    { label: 'Next month', value: 'next_month' }, { label: 'Pick a date', value: 'date' },
  ], 'text', events)
}

/**
 * The second moment (decided Oct 26): at the decision with real stakes (the rent they'd sign at, the 401k they'd
 * elect), the one thing the chat can't see is their spending. Once per thread; "Keep going" carries on.
 */
const KEEP_GOING: Chip[] = [{ label: 'Keep going without it', value: 'keep' }]
function spendingCheck(text: string, note: string): ChatMessage {
  return { from: 'ribbit', text, appAsk: { label: 'Check it against my real spending', why: 'spending_check', note } }
}

function upfrontMath(state: ChatState): Step {
  const f = state.facts
  const up = calculateUpfrontCash(f.range!, f.takeHomeMonthly ?? 0)
  return say(state, [{
    from: 'ribbit', text: 'Where the upfront number comes from:',
    math: [
      { label: 'Security deposit (one month)', value: `${fc(f.range!.low)} to ${fc(f.range!.high)}` },
      { label: 'First month', value: `${fc(f.range!.low)} to ${fc(f.range!.high)}` },
      { label: 'Living until the first paycheck', value: fc(up.gapLiving) },
      { label: 'Moving and setup', value: fc(up.movingSetup) },
      { label: 'Total, rounded', value: `${fc(up.low)} to ${fc(up.high)}`, strong: true },
    ],
  }, { from: 'ribbit', text: purposeQuestion(f) }], PURPOSE_CHIPS, 'text')
}

function purposeTurn(state: ChatState): Step {
  const f = state.facts
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const perCheck = Math.round(saving / 2)
  f.perCheck = perCheck
  if (f.purpose === 'card') {
    return say({ ...state, turn: 'R7_card' }, [{ from: 'ribbit', text: `Card first. Reply with the balance and the rate and I'll tell you how many months ${fc(saving)} a month takes to clear it.`, turn: 'R7' }], [], 'text')
  }
  if (f.purpose === 'future') {
    const value = Math.round(computeInvestingImpact(saving, REAL_RETURN_DEFAULT, 30))
    return planEnding(state, [{
      from: 'ribbit',
      text: `${fc(saving)} a month for 30 years at ${Math.round(REAL_RETURN_DEFAULT * 100)}% a year after inflation is about ${fc(value)}. Illustration only, not a guarantee. The first step is the same: auto-transfer ${fc(perCheck)} the day after each paycheck.`,
      figure: fc(value), figureLabel: 'What it could grow to in 30 years', turn: 'R7',
    }], [win('R7')])
  }
  const target = f.upfront?.high ?? 0
  const takeHome = fc(f.takeHomeMonthly ?? 0)
  return planEnding(state, [{
    from: 'ribbit',
    text: `Rebuilding it is. Move ${fc(perCheck)} the day after each paycheck until you're back to ${fc(target)}, what the move takes out. That's if ${takeHome} actually lands; I can't see whether it does.`,
    figure: fc(perCheck), figureLabel: 'To move after each paycheck', turn: 'R7',
  }], [win('R7')])
}

/** Months to clear a balance paying a fixed amount at a card's APR. Infinity when the payment never covers the interest. */
export function monthsToClear(balance: number, aprPct: number, payment: number): number {
  const { months } = payoff(balance, aprPct, payment)
  return Number.isFinite(months) ? Math.ceil(months) : Infinity
}

function cardPayoff(state: ChatState, balance: number, apr: number): Step {
  const f = state.facts
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const months = monthsToClear(balance, apr, saving)
  const text = Number.isFinite(months)
    ? `Putting ${fc(saving)} a month on ${fc(balance)} at ${apr}% clears it in about ${months} months. That's if the balance doesn't grow; the math is only as good as the balance you gave me.`
    : `At ${apr}%, ${fc(saving)} a month doesn't cover the interest on ${fc(balance)}, so the balance won't go down on that alone. The card's minimum has to stay on top of it.`
  return planEnding(state, [{ from: 'ribbit', text, figure: Number.isFinite(months) ? `${months} months` : undefined, figureLabel: 'Time to clear the card', turn: 'R7' }], [win('R7')])
}

// ── Offer turns ─────────────────────────────────────────────────────────────────────────────────────────────

function askOfferSalary(state: ChatState): Step {
  return say({ ...state, turn: 'O1' }, [{ from: 'ribbit', text: "Congrats on the offer. What's the base salary?", turn: 'O1' }], [], 'money')
}

const EXTRA_CHIPS: Chip[] = [
  { label: 'Signing bonus', value: 'signing' }, { label: 'Annual bonus', value: 'bonus' }, { label: 'Equity', value: 'equity' },
]

function offerAfterLocation(state: ChatState): Step {
  const f = state.facts
  const line = placeTaxLine(f) || `In ${f.place}, take-home before any 401k is about ${fc(f.takeHomeMonthly ?? 0)} a month.`
  return say({ ...state, turn: 'O3' }, [
    { from: 'ribbit', text: f.tax ? `${line} That's before any 401k.` : line, figure: `${fc(f.takeHomeMonthly ?? 0)}/mo`, figureLabel: 'Take-home', turn: 'O3' },
    { from: 'ribbit', text: 'Anything on top of the salary?' },
  ], [...EXTRA_CHIPS, { label: 'Just salary', value: 'none' }, { label: 'Show me the math', value: '__math__' }], 'text', [win('O3')])
}

async function offerExtras(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  f.extrasAsked = f.extrasAsked ?? []
  if (state.turn === 'O3_amount' && f.pendingExtra) {
    const n = parseMoney(text)
    if (n === null) return question(state, text, svc, 'the amount')
    if (f.pendingExtra === 'signing') f.signingBonus = n
    if (f.pendingExtra === 'equity') f.rsuAnnual = n
    if (f.pendingExtra === 'bonus') f.bonusPct = /%/.test(text) || n <= 100 ? n : Math.round((n / (f.salary ?? 1)) * 1000) / 10
    f.extrasAsked = [...f.extrasAsked, f.pendingExtra]
    f.pendingExtra = undefined
    const left = EXTRA_CHIPS.filter((c) => !f.extrasAsked!.includes(c.value))
    return say({ ...state, turn: 'O3' }, [{ from: 'ribbit', text: 'Got it. Anything else on top?' }], [...left, { label: "That's all", value: 'none' }], 'text')
  }
  const pick = chip ?? (/sign/i.test(text) ? 'signing' : /bonus/i.test(text) ? 'bonus' : /equity|rsu|stock/i.test(text) ? 'equity' : /just|no|none|that'?s all/i.test(text) ? 'none' : '')
  if (pick === 'none') return askMatch(state)
  if (pick === 'signing' || pick === 'bonus' || pick === 'equity') {
    f.pendingExtra = pick
    const q = pick === 'signing' ? 'How much is the signing bonus?' : pick === 'bonus' ? 'What is the annual bonus target? A percent of salary or a dollar amount.' : 'About how much equity vests a year, in dollars?'
    return say({ ...state, turn: 'O3_amount' }, [{ from: 'ribbit', text: q }], [], 'money')
  }
  return question(state, text, svc, 'anything on top of the salary: signing bonus, annual bonus or equity')
}

function askMatch(state: ChatState): Step {
  return say({ ...state, turn: 'O4' }, [{ from: 'ribbit', text: 'Does the company match 401k? Check the benefits page if you have it.', turn: 'O4' }], [
    { label: 'Yes, I know the %', value: 'known' }, { label: 'Yes, not sure how much', value: 'unknown' },
    { label: 'No', value: 'none' }, { label: 'Not sure', value: 'unknown' },
  ], 'text')
}

async function offerMatch(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  if (state.turn === 'O4') {
    const v = chip ?? (/^no\b/i.test(text) ? 'none' : /not sure|don'?t know/i.test(text) ? 'unknown' : parseMatch(text) ? 'known' : '')
    if (v === 'none') { f.match = 'none'; return offerRent(state, 'No match, so nothing to collect there.') }
    if (v === 'unknown') {
      f.match = 'unknown'
      return say({ ...state, turn: 'O7' }, [
        { from: 'ribbit', text: "Ask HR \"what's the 401k match and when does it vest\" before you sign. I'll remind you.", turn: 'O5' },
        ...offerRentMessages(f),
      ], [{ label: 'Yes', value: 'yes' }, { label: 'Later', value: 'later' }], 'text')
    }
    if (v === 'known' && !parseMatch(text)) {
      return say({ ...state, turn: 'O4_formula' }, [{ from: 'ribbit', text: "What's the formula? For example, 100% up to 4% of salary." }], [], 'text')
    }
    if (!v) return question(state, text, svc, 'whether the company matches 401k contributions')
  }
  if (state.turn === 'O4_rate') {
    const m = parseMatch(text)
    const rate = chip === 'yes' ? 100 : m?.cap ?? null
    if (!rate) return question(state, text, svc, 'the match rate')
    return applyMatch(state, rate, f.pendingMatchCap!)
  }
  const m = parseMatch(text)
  if (!m) return question(state, text, svc, 'the match formula')
  if (m.rate === undefined) {
    f.pendingMatchCap = m.cap
    return say({ ...state, turn: 'O4_rate' }, [{ from: 'ribbit', text: `Is that dollar for dollar up to ${m.cap}% of salary?` }],
      [{ label: 'Yes', value: 'yes' }, { label: 'No, a different rate', value: 'rate' }], 'text')
  }
  return applyMatch(state, m.rate, m.cap)
}

export function offerInputs(f: Facts): OfferInputs {
  return {
    salary: f.salary ?? 0, bonusPct: f.bonusPct ?? 0, matchRatePct: f.matchRatePct ?? 0, matchUpToPct: f.matchUpToPct ?? 0,
    hsaMonthly: 0, healthcarePremium: 0, rsuAnnual: f.rsuAnnual ?? 0, signingBonus: f.signingBonus ?? 0,
    showEspp: false, esppContrib: 0, esppDiscount: 0, ptoDays: MARKET_PTO_DAYS, rentMonthly: 0, savingsPct: 20,
  }
}

function applyMatch(state: ChatState, rate: number, cap: number): Step {
  const f = state.facts
  f.match = 'known'
  f.matchRatePct = rate
  f.matchUpToPct = cap
  f.value = computeOfferValue(offerInputs(f), f.tax ?? null) ?? undefined
  const salary = f.salary ?? 0
  const halfLoss = (salary * (cap / 2 / 100) * (rate / 100)) / 12
  const text = `With that match, the offer is worth ${fc(f.value?.totalPackage ?? salary)} a year, not ${fc(salary)}, but only if you put in at least ${cap}%. At half that you leave ${fc(halfLoss)} a month on the table.`
  return say({ ...state, turn: 'O5' }, [{ from: 'ribbit', text, figure: `${fc(f.value?.totalPackage ?? salary)}/yr`, figureLabel: 'What the offer is worth', turn: 'O5' }],
    [{ label: 'What should I put in', value: 'put_in' }, { label: 'Skip', value: 'skip' }], 'text', [win('O5')])
}

/**
 * The 401k at the matched rate: what the person puts in a month, what goes in with the match, and its after-tax
 * cost (the contribution escapes federal income tax at their own marginal rate and state tax at their state's
 * effective rate, as the first-paycheck tool prices it). Stored on the facts for the card and the link.
 */
function election(f: Facts): { contribution: number; match: number; cost: number } {
  const salary = f.salary ?? 0
  const cap = f.matchUpToPct ?? 0
  const rate = f.matchRatePct ?? 0
  const contribution = (salary * cap) / 100 / 12
  const match = contribution * (rate / 100)
  const stateRate = f.tax && salary ? f.tax.stateTaxAnnual / salary : 0
  const cost = contribution * (1 - marginalFederalRate(taxableIncome(salary, (salary * cap) / 100)) - stateRate)
  f.electionMonthlyIn = contribution + match
  f.electionCost = cost
  f.contributionMonthly = contribution
  return { contribution, match, cost }
}

function offerElection(state: ChatState): Step {
  const f = state.facts
  const cap = f.matchUpToPct ?? 0
  const { contribution, match, cost } = election(f)
  const elected: ChatMessage = {
    from: 'ribbit',
    text: `Put in ${cap}%. It costs you about ${fc(cost)} a month of take-home and adds ${fc(contribution + match)} a month to your retirement account with the match. That's the ${cap}% form with HR on day one, then a look at the first stub to confirm it took.`,
    figure: `${cap}%`, figureLabel: 'Put into your 401k', turn: 'O6',
  }
  if (f.spendingCheckShown) return offerRent({ ...state, turn: 'O6' }, undefined, [elected])
  f.spendingCheckShown = true
  return say({ ...state, turn: 'O6' }, [elected, spendingCheck(
    `That ${fc(cost)} is fine if your spending leaves room for it, and your spending is the one thing I can't see. Want to check before you tell HR?`,
    `Connect your bank in WeLeap, about 2 minutes. You'll see last month's spending next to ${fc(f.takeHomeMonthly ?? 0)} take-home, before and after the ${cap}%.`,
  )], [...KEEP_GOING, { label: "What's a good rent on this", value: 'rent' }], 'text', [win('O6'), { name: 'ribbit_spending_check_shown', props: { turn: 'O6' } }])
}

function offerRentMessages(f: Facts): ChatMessage[] {
  const r = calculateRentRange(f.takeHomeMonthly ?? 0, 0)
  return [{ from: 'ribbit', text: `Rent? You'd be looking at ${r.formatted} a month${f.place ? ` in ${f.place}` : ''}. Want to work that out properly?`, turn: 'O7' }]
}

function offerRent(state: ChatState, lead?: string, before: ChatMessage[] = []): Step {
  return say({ ...state, turn: 'O7' }, [...before, ...(lead ? [{ from: 'ribbit' as const, text: lead }] : []), ...offerRentMessages(state.facts)],
    [{ label: 'Yes', value: 'yes' }, { label: 'Later', value: 'later' }], 'text')
}

// ── Where should my money go? turns ──────────────────────────────────────────────────────────────────────────

function askMoneySalary(state: ChatState): Step {
  return say({ ...state, turn: 'M1' }, [
    { from: 'ribbit', text: "Let's work out where your money should go, in order. Four quick questions. What's your yearly salary, or your monthly take-home?", turn: 'M1' },
  ], [{ label: 'Yearly salary', value: 'salary' }, { label: 'Monthly take-home', value: 'take_home' }], 'money')
}

function askMoneyRent(state: ChatState, lead: string): Step {
  const f = state.facts
  return say({ ...state, turn: 'M3' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, figure: `${fc(f.takeHomeMonthly ?? 0)}/mo`, figureLabel: 'Take-home', turn: 'M3' }] : []),
    { from: 'ribbit', text: "What's your rent each month?" },
  ], [{ label: "I don't pay rent", value: 'none' }], 'money', lead ? [win('M3')] : [])
}

function askMoneyDebt(state: ChatState): Step {
  return say({ ...state, turn: 'M4' }, [
    { from: 'ribbit', text: 'Any card or loan balances? The one with the highest rate is enough: its balance, its rate and what you pay a month.' },
  ], [{ label: 'Credit card', value: 'card' }, { label: 'Loan', value: 'loan' }, { label: 'No debt', value: 'none' }], 'text')
}

function missingDebtPart(d: Partial<MoneyDebt>): keyof MoneyDebt | undefined {
  return d.balance === undefined ? 'balance' : d.aprPct === undefined ? 'aprPct' : d.payment === undefined ? 'payment' : undefined
}

function askMoneyMatch(state: ChatState): Step {
  return say({ ...state, turn: 'M5' }, [{ from: 'ribbit', text: 'Last one. Does your job match 401(k) contributions?', turn: 'M5' }], [
    { label: 'Yes, I know the match', value: 'known' }, { label: 'Yes, not sure how much', value: 'unknown' }, { label: 'No match', value: 'none' },
  ], 'text')
}

/** The match, read as the offer flow reads it (parseMatch, a lone % confirmed as dollar for dollar). */
async function moneyMatch(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  if (state.turn === 'M5') {
    const v = chip ?? (/^no\b/i.test(text) ? 'none' : /not sure|don'?t know/i.test(text) ? 'unknown' : parseMatch(text) ? 'known' : '')
    if (v === 'none' || v === 'unknown') { f.match = v; return moneyResult(state, svc) }
    if (v === 'known' && !parseMatch(text)) {
      return say({ ...state, turn: 'M5_formula' }, [{ from: 'ribbit', text: "What's the formula? For example, 100% up to 4% of salary." }], [], 'text')
    }
    if (!v) return question(state, text, svc, 'whether their job matches 401(k) contributions')
  }
  if (state.turn === 'M5_rate') {
    const m = parseMatch(text)
    const rate = chip === 'yes' ? 100 : m?.cap ?? null
    if (!rate) return question(state, text, svc, 'the match rate')
    return applyMoneyMatch(state, rate, f.pendingMatchCap!, svc)
  }
  const m = parseMatch(text)
  if (!m) return question(state, text, svc, 'the match formula')
  if (m.rate === undefined) {
    f.pendingMatchCap = m.cap
    return say({ ...state, turn: 'M5_rate' }, [{ from: 'ribbit', text: `Is that dollar for dollar up to ${m.cap}% of salary?` }],
      [{ label: 'Yes', value: 'yes' }, { label: 'No, a different rate', value: 'rate' }], 'text')
  }
  return applyMoneyMatch(state, m.rate, m.cap, svc)
}

function applyMoneyMatch(state: ChatState, rate: number, cap: number, svc: ChatServices): Promise<Step> {
  const f = state.facts
  f.match = 'known'
  f.matchRatePct = rate
  f.matchUpToPct = cap
  if (f.salary) election(f)
  return moneyResult(state, svc)
}

export function moneyInputs(f: Facts): MoneyInputs {
  return {
    takeHomeMonthly: f.takeHomeMonthly ?? 0, rentMonthly: f.pick ?? 0, debt: f.debt,
    match: f.match, matchUpToPct: f.matchUpToPct,
    electionMonthlyIn: f.electionMonthlyIn, electionCost: f.electionCost, contributionMonthly: f.contributionMonthly,
  }
}

/**
 * The win: the order, worked out in code; then, when a question led here ("is now a good time to buy a car?"), the
 * reader answers it again with these numbers (the money bundle); then the offer to keep it as their plan.
 */
async function moneyResult(state: ChatState, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const o = moneyOrder(moneyInputs(f))
  const share = o.monthlyForSteps > 0 ? [{ from: 'ribbit' as const, text: `These take ${fc(o.monthlyForSteps)} a month of the ${fc(o.leftAfterRent)} you have left after rent.` }] : []
  const back: ChatMessage[] = []
  if (f.moneyQuestion) {
    const res = await svc.ask({ flow: 'money', facts: f, message: f.moneyQuestion, step: '', history: state.history })
    if (res?.kind === 'question' && res.reply) {
      const done = moneyDoneBefore(o)
      back.push({ from: 'ribbit', text: done ? `Back to your question. If you've already got ${done}: ${res.reply} If not, start with the order above.` : `Back to your question: ${res.reply}`, turn: 'M6' })
    } else {
      // No answer came back: say so, rather than leave the question they came with unanswered without a word.
      back.push({ from: 'ribbit', text: MONEY_BACK_FAILED_TEXT, turn: 'M6' })
    }
    f.moneyQuestion = undefined
  }
  return say({ ...state, turn: 'M6' }, [
    { from: 'ribbit', text: "Here's where your next dollar goes, in order.", order: o.steps, turn: 'M6' },
    ...share,
    ...back,
    { from: 'ribbit', text: 'Want me to keep this as your plan?' },
  ], [{ label: 'Yes, keep it', value: 'keep' }, { label: 'Show me the math', value: '__math__' }], 'text', [win('M6'), { name: 'ribbit_money_order_shown', props: { steps: o.steps.map((s) => s.key).join(',') } }])
}

/**
 * The order's steps before raising retirement, as things a person may already have done ("your full 401(k) match and
 * about $7,700 set aside"). The flow never asks what they have saved, so the answer to their question is given for
 * that case and the order covers the other; the reader is told to answer as if these are done.
 */
function moneyDoneBefore(o: ReturnType<typeof moneyOrder>): string {
  const done = o.steps.flatMap((st) =>
    st.key === 'match' ? ['your full 401(k) match'] : st.key === 'debt' ? ['the high-interest debt paid off'] : st.key === 'emergency' ? [`about ${fc(o.emergencyGoal)} set aside`] : [])
  return done.length > 1 ? `${done.slice(0, -1).join(', ')} and ${done[done.length - 1]}` : done[0] ?? ''
}

function moneyCard(f: Facts): NonNullable<ChatMessage['planCard']> {
  const o = moneyOrder(moneyInputs(f))
  const d = f.debt
  const p = o.debtPlan
  return {
    known: [
      ...(f.takeHomeMonthly ? [{ label: 'Take-home', value: `${fc(f.takeHomeMonthly)}/mo` }] : []),
      ...(f.pick ? [{ label: 'Rent', value: `${fc(f.pick)}/mo` }] : []),
      ...(f.match === 'known' && f.electionMonthlyIn && f.matchUpToPct ? [{ label: `401(k) at ${f.matchUpToPct}%, with the match`, value: `${fc(f.electionMonthlyIn)}/mo in` }] : []),
      // Take-home typed, not a salary: no dollars for the match, but the match itself still belongs on the plan.
      ...(f.match === 'known' && !f.electionMonthlyIn && f.matchUpToPct ? [{ label: '401(k) match', value: `${f.matchRatePct ?? 100}% up to ${f.matchUpToPct}%` }] : []),
      ...(d && p ? [{ label: `${d.aprPct}% debt`, value: Number.isFinite(p.months) ? `${fc(p.payment)}/mo, gone in ${p.months} months` : `${fc(p.payment)}/mo` }] : []),
      { label: 'Emergency fund goal', value: `about ${fc(o.emergencyGoal)}` },
    ],
    locked: ['What you actually spend a month', d && p ? `Whether ${fc(p.payment)} to the debt fits` : 'Whether this plan fits your real spending', 'Your real emergency fund goal'],
  }
}

// ── Handoff, math, questions ────────────────────────────────────────────────────────────────────────────────

/**
 * The follow-up turn. The text door under it carries the approved consent wording and button; the line above it
 * says only what that consent covers (the breakdown, answers, a few follow-ups over three weeks). The spec's
 * "check on the 1st" wording waits for counsel.
 */
function handoff(state: ChatState, lead?: string): Step {
  const flow: Flow = state.flow ?? 'rent'
  const turn = flow === 'offer' ? 'O8' : 'R8'
  return say({ ...state, turn }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead }] : []),
    { from: 'ribbit', text: "Want this by text? I'll send your numbers, answer questions there, and check in a few times over the next three weeks. Stop any time.", turn, handoff: flow },
  ], [], 'text', [{ name: 'ribbit_handoff_offered', props: { turn } }])
}

/**
 * The ending (decided Oct 26, replacing "Watch it for me"): the plan as WeLeap would show it. Known rows are the
 * thread's own numbers; locked rows name what only the bank can show. The button saves the plan in the app (the
 * pre-filled plan and the landing page are the app's side); a text link opens the text sign-up instead.
 */
export const PLAN_PREVIEW_TEXT = "Want to keep this? Here's your plan as WeLeap would show it. The rest fills in when you connect your bank."
function planEnding(state: ChatState, lead: ChatMessage[], events: ChatEvent[] = []): Step {
  const flow: Flow = state.flow ?? 'rent'
  const turn = flow === 'offer' ? 'O8' : flow === 'money' ? 'M8' : 'R8'
  const card = flow === 'offer' ? offerCard(state.facts) : flow === 'money' ? moneyCard(state.facts) : rentCard(state.facts)
  return say({ ...state, turn, invited: true }, [...lead, {
    from: 'ribbit', text: PLAN_PREVIEW_TEXT, turn, planCard: card,
    // Text threads exist for rent and offers only, so the money flow has no "text me instead".
    appAsk: { label: 'Save my plan and unlock the rest', why: 'plan_preview', note: `No forms: the rows above come with you. Connecting your bank takes about 2 minutes.`, textInstead: flow !== 'money' },
  }], [], 'text', [...events, { name: 'ribbit_plan_preview_shown', props: { turn, known_rows: card.known.length } }])
}

function rentCard(f: Facts): NonNullable<ChatMessage['planCard']> {
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const known = [
    ...(f.takeHomeMonthly ? [{ label: 'Take-home', value: `${fc(f.takeHomeMonthly)}/mo` }] : []),
    ...(f.pick ? [{ label: 'Rent', value: `${fc(f.pick)}/mo` }] : []),
    ...(f.debtMonthly ? [{ label: 'Debt payments', value: `${fc(f.debtMonthly)}/mo` }] : []),
    ...(f.purpose === 'cushion' && f.perCheck && f.upfront ? [{ label: 'Rebuilding savings', value: `${fc(f.perCheck)} a paycheck to ${fc(f.upfront.high)}` }] : []),
    ...(f.purpose === 'card' && saving ? [{ label: 'Toward the card', value: `${fc(saving)}/mo` }] : []),
    ...(f.purpose === 'future' && saving ? [{ label: 'Saving for later', value: `${fc(saving)}/mo` }] : []),
    // After an offer turned into rent (O7), the 401(k) it worked out stays on the card.
    ...(f.electionMonthlyIn && f.matchUpToPct ? [{ label: `401(k) at ${f.matchUpToPct}%, with the match`, value: `${fc(f.electionMonthlyIn)}/mo in` }] : []),
  ]
  return {
    known,
    locked: ['What you actually spend a month', f.pick ? `Does ${fc(f.pick)} still fit after that?` : 'Whether the rent still fits after that', "Subscriptions you're paying for", 'Is this month on pace?'],
  }
}

function offerCard(f: Facts): NonNullable<ChatMessage['planCard']> {
  const cap = f.matchUpToPct
  const known = [
    ...(f.takeHomeMonthly ? [{ label: f.place ? `Take-home in ${f.place}` : 'Take-home', value: `${fc(f.takeHomeMonthly)}/mo` }] : []),
    ...(f.match === 'known' && f.value ? [{ label: 'Offer worth, with the match', value: `${fc(f.value.totalPackage)}/yr` }] : []),
    ...(f.electionMonthlyIn && cap ? [{ label: `401(k) at ${cap}%`, value: `${fc(f.electionMonthlyIn)}/mo in` }] : []),
    ...(f.electionCost && cap ? [{ label: `What the ${cap}% costs you`, value: `${fc(f.electionCost)}/mo` }] : []),
  ]
  return {
    known,
    locked: [
      'Your first paycheck, checked against this',
      ...(f.electionMonthlyIn && cap ? [`Did the ${cap}% actually come out?`] : []),
      'Rent that fits what you really spend',
      'Is this month on pace?',
    ],
  }
}

function showMath(state: ChatState): Step {
  const f = state.facts
  const rows: MathRow[] = []
  if (f.salary) rows.push({ label: 'Salary', value: fc(f.salary) })
  if (f.tax) {
    rows.push({ label: 'Federal income tax', value: `−${fc(f.tax.federalTaxAnnual)}` })
    if (f.tax.stateTaxAnnual > 0) rows.push({ label: 'State income tax', value: `−${fc(f.tax.stateTaxAnnual)}` })
    if (f.tax.localTaxAnnual > 0) rows.push({ label: 'City income tax', value: `−${fc(f.tax.localTaxAnnual)}` })
    rows.push({ label: 'FICA', value: `−${fc(f.tax.ficaTaxAnnual)}` })
  } else if (f.salary) {
    rows.push({ label: 'Federal income tax', value: `−${fc(federalTax(taxableIncome(f.salary, 0)))}` })
    rows.push({ label: 'FICA', value: `−${fc(ficaTax(f.salary))}` })
    rows.push({ label: 'State tax', value: 'once you pick a city' })
  }
  rows.push({ label: 'Take-home a month', value: fc(f.takeHomeMonthly ?? 0), strong: true })
  if (state.flow === 'money') {
    const o = moneyOrder(moneyInputs(f))
    rows.push({ label: 'Rent', value: `−${fc(f.pick ?? 0)}` }, { label: 'Left after rent', value: fc(o.leftAfterRent), strong: true })
    if (f.electionCost && f.matchUpToPct) rows.push({ label: `${f.matchUpToPct}% to the 401(k), after tax`, value: `−${fc(f.electionCost)}` })
    if (f.debt && o.debtPlan) {
      rows.push({ label: `${fc(f.debt.balance)} at ${f.debt.aprPct}%, ${fc(o.debtPlan.payment)} a month`, value: `${o.debtPlan.months} months, ${fc(o.debtPlan.interest)} interest` })
    }
    rows.push({ label: 'Emergency fund: 3 months of half your take-home', value: fc(o.emergencyGoal) })
  }
  if (state.flow === 'rent' && f.range) {
    if (f.debtMonthly) rows.push({ label: 'Debt payments a month', value: `−${fc(f.debtMonthly)}` })
    rows.push({ label: 'Rent that fits (28% to 35% of what is left)', value: f.range.formatted, strong: true })
  }
  // The open question stays open: same options, minus the math one just used.
  const chips = (state.ui?.chips ?? []).filter((c) => c.value !== '__math__')
  return { state, messages: [{ from: 'ribbit', text: 'Here is the math:', math: rows }], chips, input: state.ui?.input ?? 'text', events: [{ name: 'ribbit_math_opened', props: { turn: state.turn } }] }
}

/**
 * A typed message that is not an answer to the open question: Ribbit answers it from the person's figures (the
 * same assistant as the text thread). The open question is not asked again after the answer (the text thread's
 * rule too); it stays open, with its options, parked for the page to show folded.
 */
async function question(state: ChatState, text: string, svc: ChatServices, waitingFor: string): Promise<Step> {
  const chips = state.ui?.chips ?? []
  const input = state.ui?.input ?? 'text'
  if (!text) {
    return { state, messages: [{ from: 'ribbit', text: 'Tap an option or type your answer.' }], chips, input, events: [] }
  }
  const res = await svc.ask({ flow: state.flow ?? 'rent', facts: state.facts, message: text, step: waitingFor ? `waiting for ${waitingFor}` : '', history: state.history })
  if (res?.kind === 'step' && res.value && waitingFor) {
    // Ribbit read the words as the answer: apply it, once (a second miss does not go back to Ribbit).
    return route(state, { text: res.value }, { ...svc, ask: async () => null })
  }
  const events: ChatEvent[] = [{ name: 'ribbit_question_typed', props: { turn: state.turn } }]
  const messages: ChatMessage[] = []
  let invite = false
  let benefit = false
  if (res?.kind === 'account') {
    // Needs their own accounts: the hand-off the first time (it is the thread's invite), the app link after.
    invite = !state.invited
    messages.push({ from: 'ribbit', text: invite ? HANDOFF_TEXT : APP_LINK_TEXT, appAsk: { label: 'Click to get WeLeap', why: 'account' }, turn: state.turn })
    if (invite) events.push({ name: 'ribbit_app_invite_shown', props: { turn: state.turn, reason: 'account' } })
  } else {
    messages.push({ from: 'ribbit', text: res?.reply ?? "My answers are down for a moment, so I couldn't get to that one. Send it again in a few minutes." })
    // A planning question: the answer, then the thread's one invite (mid-flow too; the page offers finishing the
    // numbers next to it).
    invite = Boolean(res?.plan) && !state.invited && state.turn !== 'P0'
    // "Can I afford a car?" plans a purchase: the reader often reads it as a general question, so the page counts it.
    const planning = Boolean(res?.plan) || AFFORD_QUESTION.test(text)
    const f = state.facts
    if (planning && !state.invited && state.turn === 'P0' && !f.moneyOffered) {
      // No tool picked, so no numbers yet: offer to work it out with theirs ("Where should my money go?"); the
      // invite comes at that flow's end, with a card full of their numbers.
      const amount = /sav/i.test(text) ? parseMoney(text) : null
      if (amount) state.facts.mentionedSaving = amount
      state.facts.moneyOffered = true
      state.facts.moneyQuestion = text.slice(0, 300)
      messages.push({ from: 'ribbit', text: MONEY_OFFER_TEXT, turn: state.turn })
      events.push({ name: 'ribbit_money_offer_shown', props: { turn: state.turn } })
      const history = [...state.history, ...messages.map((m) => ({ from: 'out' as const, text: m.text }))].slice(-12)
      return { state: { ...state, history }, messages, chips: MONEY_OFFER_CHIPS, input, events }
    } else if (state.turn === 'P0' && f.moneyOffered && !f.moneyDeclined && !state.invited && f.moneyQuestion) {
      // The offer is still open and they kept going ("20K, 14% APR, 5 years"): the question now carries these words
      // too, so the order's "back to your question" answers it with their pay; the offer again, once, in words.
      if (!f.moneyQuestion.includes(text)) f.moneyQuestion = `${f.moneyQuestion} ${text}`.slice(0, 300)
      if (!f.moneyReoffered) {
        f.moneyReoffered = true
        messages.push({ from: 'ribbit', text: MONEY_REOFFER_TEXT, turn: state.turn })
        events.push({ name: 'ribbit_money_offer_shown', props: { turn: state.turn, again: true } })
      }
      const history = [...state.history, ...messages.map((m) => ({ from: 'out' as const, text: m.text }))].slice(-12)
      return { state: { ...state, history }, messages, chips: MONEY_OFFER_CHIPS, input, events }
    } else if (invite) {
      // Mid-flow: the line and the button, next to finishing the numbers; the flow's own ending shows the card.
      messages.push({ from: 'ribbit', text: INVITE_TEXT, appAsk: { label: 'Click to get WeLeap', why: 'plan_invite' }, turn: state.turn })
      events.push({ name: 'ribbit_app_invite_shown', props: { turn: state.turn, reason: 'plan' } })
    } else if (res?.plan && state.invited && res.benefit && (state.benefitsShown ?? 0) < MAX_BENEFIT_LINES) {
      // After the invite: what WeLeap would add for this question's topic, with a small link, never the invite again.
      benefit = true
      messages.push({ from: 'ribbit', text: res.benefit, appAsk: { label: 'Get my plan', why: 'benefit', quiet: true }, turn: state.turn })
      events.push({ name: 'ribbit_benefit_line_shown', props: { turn: state.turn, topic: res.topic ?? '', n: (state.benefitsShown ?? 0) + 1 } })
    }
  }
  // Before a tool is picked there is no plan to go back to: the two tools stay up, captioned as tasks.
  const atPicker = state.turn === 'P0'
  const parked = waitingFor && !atPicker ? state.ui?.ask ?? '' : undefined
  const history = [...state.history, ...messages.map((m) => ({ from: 'out' as const, text: m.text }))].slice(-12)
  return {
    state: { ...state, history, invited: state.invited || invite, benefitsShown: (state.benefitsShown ?? 0) + (benefit ? 1 : 0) },
    messages, chips, input, events, parked,
    ...(atPicker ? { chipsLabel: 'Or work out with Ribbit:' } : {}),
  }
}
