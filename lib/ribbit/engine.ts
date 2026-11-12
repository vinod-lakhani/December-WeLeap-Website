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
import { DEFAULT_CLIFF_MONTHS, DEFAULT_VEST_YEARS, FUTURE_ROUNDS, afterDilution, atLastRound, breakEvenExit, companyValue, costToBuy, hasStrike, ownership, payoutAt, pct, type EquityType, type Grant } from '@/lib/offer/startupEquity'
import type { ParsedOffer } from '@/lib/offer-parse/fields'
import { US_STATES_NAMED } from '@/lib/states'
import defaultMetroMappingData from '@/data/default_metro_mapping.json'
import { DEFAULT_HOURS, splitCityState, matchPresetCity, matchState, parseDebt, parseDecimal, parseGrant, parseMatch, parseMoney, parseTwoNumbers, readPay, salaryOrTakeHome, type Pay } from './parse'
import { moneyOrder, payoff, type MoneyDebt, type MoneyInputs, type MoneyStep } from './moneyOrder'
import type { AppReason } from './appLink'

const metroMapping = defaultMetroMappingData as Record<string, { regionName: string; stateName: string }>

export type Flow = 'rent' | 'offer' | 'money' | 'startup'
/** `opensKeyboard`: the next turn asks for a typed answer, so the tap focuses the reply box while it's still a tap (a
 * phone opens its keypad only then, not after the reply comes back). */
export interface Chip { label: string; value: string; opensKeyboard?: boolean }
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
  /** quiet: a small text link instead of the lime button (the benefit line after the one invite). gap: the move-in
   * score's gap the button is labelled by, sent with the tap. */
  appAsk?: { label: string; why: AppReason; note?: string; textInstead?: boolean; quiet?: boolean; gap?: ScoreGap }
  /** Small print under the text, in the bubble ("A WeLeap check from your answers, not a credit score."). */
  fine?: string
  /**
   * The plan as WeLeap would show it: rows the chat knows, and rows only the bank can fill (shown locked). With
   * `steps` (the move-in score) the locked rows give way to a checklist, done and still open, under `title`.
   */
  planCard?: {
    known: { label: string; value: string }[]; locked: string[]; title?: string; steps?: { label: string; done: boolean }[]
    /** Over the locked rows when they unlock with something other than the bank (C: a free account). */
    lockedTitle?: string
    /** In place of "From this chat" in the corner (B's place card: its rent). */
    badge?: string
  }
  /** Rent arm B: two or three places side by side (rent, move-in cash, left monthly, score). */
  places?: Place[]
  /** "Show me the math": the breakdown, rendered as rows under the text. */
  math?: MathRow[]
  /** The turn that produced it, for analytics and the handoff. */
  turn?: string
  /** Render the text door (the approved consent and button) under this message. */
  handoff?: Flow
  /** "Where should my money go?": the next-dollar order, as numbered steps (lib/ribbit/moneyOrder.ts). */
  order?: MoneyStep[]
  /** The startup ending's questions to take back to the recruiter, numbered like the order, with a copy button. */
  questions?: RecruiterQuestion[]
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
  /** The spending check offered on the first answer: the rent range (R2). The later moment (the rent pick at R4,
   * the 401k at O6) still offers it once. */
  rangeSpendingCheckShown?: boolean
  range?: RentRange
  market?: { low: number; high: number; median: number; tier: string; source: 'zori' | 'hud' } | null
  pick?: number
  start?: 'working' | 'this_month' | 'next_month' | 'date'
  startDate?: string
  upfront?: { low: number; high: number }
  /** The move-in score, once taken (R3_saved): what was set aside and the three parts. */
  score?: MoveInScore & { savedBand: string }
  purpose?: 'cushion' | 'card' | 'future'
  roommate?: 'yes' | 'no' | 'not_sure'
  /** The first answer's pay as given, in any flow: a yearly salary, or an hourly rate at hoursPerWeek (salary is then
   * rate × hours × 52). */
  payBasis?: 'salary' | 'hourly'
  hourlyRate?: number
  hoursPerWeek?: number
  /** A bare number at the first question that could be an hourly rate or a yearly salary ($95 or $95,000): asked. */
  pendingPay?: number
  // offer
  // startup (lib/offer/startupEquity.ts): the grant, what it's priced at, and the company's size
  /** Options or shares granted, the strike (0 for RSUs), and the vesting, from the letter or typed. */
  grantShares?: number
  strike?: number
  /** "I don't know the strike": the cost to buy is then said in words, not dollars. */
  strikeUnknown?: boolean
  equityType?: EquityType
  vestYears?: number
  cliffMonths?: number
  /** The last round's price per share (the investors' price), typed or worked out from the recruiter's dollar figure. */
  pricePerShare?: number
  sharesOutstanding?: number
  /** The offer letter was read in this thread. */
  letterRead?: boolean
  /** What the person didn't know, in the order it came up: the ending lists them as questions for the recruiter. */
  recruiterAsks?: RecruiterAsk[]
  /** The other offer being weighed (O3_compare): its base pay a year and its take-home a month in the same place. */
  compareSalary?: number
  compareTakeHome?: number
  bonusPct?: number
  signingBonus?: number
  rsuAnnual?: number
  extrasAsked?: string[]
  pendingExtra?: 'signing' | 'bonus' | 'equity'
  match?: 'known' | 'unknown' | 'none'
  matchRatePct?: number
  matchUpToPct?: number
  pendingMatchCap?: number
  /** From an uploaded benefits guide (O4), as the offer tool page reads them: the employer HSA a month and the
   * employee-only premium a month on the HSA-eligible plan. */
  hsaMonthly?: number
  healthcarePremium?: number
  /** A benefits guide was read in this thread. */
  benefitsRead?: boolean
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
  // rent arm B: the places checked against the range, in order, and the savings band asked once to score them
  places?: Place[]
  placeSaved?: string
  /** A place's rent given before the savings band was: checked once the band is in. */
  pendingPlace?: { rent: number; name: string; short: string }
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
  /** The rent test's arm (RentArm), set by the page when the thread starts and kept through Start over. */
  rentArm?: RentArm
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
  { label: 'Where should my money go?', value: 'money' }, { label: 'What my startup offer is worth', value: 'startup' },
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
export const NOT_CAUGHT_TEXT = "I didn't catch that one. Tap an option or type it another way."
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
  const state: ChatState = { flow, turn: flow === 'rent' ? 'R1' : flow === 'offer' ? 'O1' : flow === 'money' ? 'M1' : flow === 'startup' ? 'S1' : 'P0', facts: {}, history: [] }
  if (!flow) {
    return say(state, [{ from: 'ribbit', text: 'What are we working out?', turn: 'P0' }],
      PICKER_CHIPS, 'text')
  }
  return flow === 'rent' ? askSalary(state) : flow === 'offer' ? askOfferSalary(state) : flow === 'startup' ? askStartup(state) : askMoneySalary(state)
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

/**
 * `letter`: an uploaded offer letter, read by /api/parse-offer on the page (the same route as the tool pages): what
 * it found, or why it couldn't (the route's error code). The file itself never reaches the engine or the thread.
 */
export type DocRead = { parsed: ParsedOffer } | { failed: string }
/** `typed`: what was in the reply box when a chip was tapped. Only the offer's Yearly and Hourly read it. */
export interface Reply { chip?: string; text?: string; typed?: string; letter?: DocRead; benefits?: DocRead }

/**
 * One reply. `chip` is a tapped option's value; `text` is typed. The person's own words are added to the thread
 * by the caller (it already shows them); this returns what Ribbit says next.
 */
export async function reply(prev: ChatState, r: Reply, svc: ChatServices): Promise<Step> {
  const state: ChatState = {
    ...prev,
    facts: { ...prev.facts },
    history: [...prev.history, { from: 'in' as const, text: r.text ?? r.chip ?? (r.letter ? 'My offer letter' : r.benefits ? 'My benefits guide' : '') }].slice(-12),
  }
  const turnEvent: ChatEvent = { name: 'ribbit_turn', props: { turn: prev.turn, reply_kind: r.letter ? 'letter' : r.benefits ? 'benefits' : r.chip ? 'chip' : 'typed' } }
  const step = await route(state, r, svc)
  // Each app button as it is shown, once: the denominator of the button's tap rate (ribbit_win_shown is not it).
  const asks: ChatEvent[] = step.messages.filter((m) => m.appAsk).map((m) => ({
    name: 'ribbit_app_ask_shown', props: { turn: m.turn ?? step.state.turn, why: m.appAsk!.why, ...(m.appAsk!.gap ? { gap: m.appAsk!.gap } : {}) },
  }))
  return { ...step, events: [turnEvent, ...step.events, ...asks] }
}

async function route(state: ChatState, r: Reply, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const text = (r.text ?? '').trim()
  const chip = r.chip

  if (chip === '__math__') return showMath(state)
  // "Text me each step instead" under an ask: the move-in score's sits mid-flow, so it can be tapped at a later turn.
  if (chip === 'text') return handoff(state)
  if (r.letter) return readLetter(state, r.letter)
  if (r.benefits) return readBenefits(state, r.benefits)

  switch (state.turn) {
    case 'P0': {
      // With the money offer on screen, a typed "yes" is "Yes, work it out" and a typed "no" is "Not now"; sent to
      // Ribbit as a question, a bare "yes" got a stray answer or, twice in three tries, none at all.
      const offerOpen = Boolean(f.moneyOffered && !f.moneyDeclined && state.ui?.chips?.some((c) => c.value === 'money'))
      const typedPick = offerOpen && YES.test(text) ? 'money' : offerOpen && NO.test(text) ? 'not_now' : ''
      const pick = chip ?? (typedPick || (/where should my money go/i.test(text) ? 'money' : /startup|stock options?|equity/i.test(text) ? 'startup' : /offer|job/i.test(text) ? 'offer' : /rent/i.test(text) ? 'rent' : ''))
      if (pick === 'rent') return askSalary({ ...state, flow: 'rent', turn: 'R1' })
      if (pick === 'offer') return askOfferSalary({ ...state, flow: 'offer', turn: 'O1' })
      if (pick === 'money') return askMoneySalary({ ...state, flow: 'money', turn: 'M1' })
      if (pick === 'startup') return askStartup({ ...state, flow: 'startup', turn: 'S1' })
      if (pick === 'not_now') return say({ ...state, facts: { ...f, moneyDeclined: true } }, [{ from: 'ribbit', text: 'Sure. Ask me anything, or pick one to work out.' }], PICKER_CHIPS, 'text')
      return question(state, text, svc, 'which tool to use: rent or a job offer')
    }

    // ── Rent ──────────────────────────────────────────────────────────────────────────────────────────────
    case 'R1':
    case 'R1_amount':
    case 'R1_basis': {
      if (state.turn !== 'R1_basis' && (chip === 'salary' || chip === 'take_home')) {
        return say({ ...state, turn: 'R1_amount', facts: { ...f, takeHomeFrom: chip === 'salary' ? 'salary' : 'typed' } },
          [{ from: 'ribbit', text: chip === 'salary' ? "What's the yearly salary?" : 'How much take-home lands each month?' }], [], 'money')
      }
      const pay = hourlyAtIncome(state, chip, text)
      if (pay?.kind === 'unsure') return askHourOrYear(state, pay.n, 'R1_basis')
      if (pay) takePay(f, pay)
      else {
        const n = parseMoney(text)
        if (!n) return question(state, text, svc, 'their salary or monthly take-home')
        takeIncome(f, n, state.turn === 'R1_amount' ? (f.takeHomeFrom === 'typed' ? 'take_home' : 'salary') : salaryOrTakeHome(n))
      }
      const takeHome = f.takeHomeMonthly ?? 0
      f.range = calculateRentRange(takeHome, 0)
      const basis = f.takeHomeFrom === 'salary'
        ? `${incomeLead(f)} take-home before state tax is about ${fc(takeHome)} a month.`
        : `On ${fc(takeHome)} a month take-home,`
      const line = f.takeHomeFrom === 'salary' ? `${basis} Rent that fits is ${f.range.formatted}.` : `${basis} rent that fits is ${f.range.formatted}.`
      const fits: ChatMessage = { from: 'ribbit', text: line, figure: span(f.range.low, f.range.high), figureLabel: 'Rent that fits', turn: 'R2' }
      // The rent test's arms part here, after the same range (RentArm below).
      if (state.rentArm === 'b') return askPlace(state, [fits], [win('R2')])
      if (state.rentArm === 'c') return movePlan(state, fits)
      f.rangeSpendingCheckShown = true
      // The thread's first app offer, as the city-answer invite was: later turns don't invite again.
      return say({ ...state, turn: 'R2', invited: true }, [
        fits,
        spendingCheck(RANGE_SPENDING_CHECK_TEXT, RANGE_SPENDING_CHECK_NOTE),
        { from: 'ribbit', text: 'Which city?' },
      ], [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [win('R2'), { name: 'ribbit_spending_check_shown', props: { turn: 'R2' } }])
    }
    case 'R2':
    case 'O2':
      return chooseLocation(state, chip, text, svc)
    case 'R2b':
    case 'R2b_more':
    case 'R2b_done':
      return placeTurn(state, chip, text, svc)
    case 'R2b_saved': {
      const band = chip && SAVED_MIDDLE[chip] !== undefined ? chip : savedBand(parseMoney(text))
      if (!band) return question(state, text, svc, 'how much they have set aside for the move')
      const place = f.pendingPlace!
      f.placeSaved = band
      f.pendingPlace = undefined
      return placeChecked(state, place)
    }
    case 'R2c':
      if (chip === 'range_only' || (!chip && /^(no|nah|nope|just the range|range only)\b/i.test(text))) {
        return say({ ...state, turn: 'R2c_done' }, [{ from: 'ribbit', text: MOVE_PLAN_DECLINED(f.range!.formatted) }], [], 'text', [{ name: 'ribbit_move_plan_declined', props: { turn: 'R2' } }])
      }
      return question(state, text, svc, '')
    case 'R2c_done':
      return question(state, text, svc, '')
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
      if (chip === 'none' || /^(none|no|nope|zero|0)\b/i.test(text)) { f.debtMonthly = 0; return offerScore(state, 'No debt to take off.') }
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
    case 'R3_score':
    case 'R3_scored': {
      // The score offer, then after the score: "Pick my rent" goes on, a typed number is the rent pick.
      if (state.turn === 'R3_score' && (chip === 'score' || (!chip && /score/i.test(text)))) return askSaved(state)
      if (chip === 'pick' || (!chip && /^(pick|rent|skip)\b/i.test(text))) return askPick(state, '')
      if (!chip && parseMoney(text)) return route({ ...state, turn: 'R4' }, r, svc)
      return question(state, text, svc, state.turn === 'R3_score' ? 'whether they want their move-in score or to pick a rent' : 'the monthly rent they would sign at')
    }
    case 'R3_saved': {
      const band = chip && SAVED_MIDDLE[chip] !== undefined ? chip : savedBand(parseMoney(text))
      if (!band) return question(state, text, svc, 'how much they have set aside for the move')
      return scoreTurn(state, band)
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
          `Free in WeLeap. See last month's spending next to ${fc(pick)} rent, and what's left.`,
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
    case 'M1_amount':
    case 'M1_basis': {
      if (state.turn !== 'M1_basis' && (chip === 'salary' || chip === 'take_home')) {
        return say({ ...state, turn: 'M1_amount', facts: { ...f, takeHomeFrom: chip === 'salary' ? 'salary' : 'typed' } },
          [{ from: 'ribbit', text: chip === 'salary' ? "What's the yearly salary?" : 'How much take-home lands each month?' }], [], 'money')
      }
      const pay = hourlyAtIncome(state, chip, text)
      if (pay?.kind === 'unsure') return askHourOrYear(state, pay.n, 'M1_basis')
      if (pay) takePay(f, pay)
      else {
        const n = parseMoney(text)
        if (!n) return question(state, text, svc, 'their salary or monthly take-home')
        takeIncome(f, n, state.turn === 'M1_amount' ? (f.takeHomeFrom === 'typed' ? 'take_home' : 'salary') : salaryOrTakeHome(n))
      }
      // A salary needs the state for its take-home; a typed take-home already is one.
      if (f.takeHomeFrom === 'salary') {
        return say({ ...state, turn: 'M2' }, [
          { from: 'ribbit', text: `${incomeLead(f)} take-home before state tax is about ${fc(f.takeHomeMonthly ?? 0)} a month. Where do you live?` },
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
    case 'O1':
    case 'O1_amount':
    case 'O1_basis':
      return offerPay(state, chip, text, svc, (r.typed ?? '').trim())
    case 'O3':
    case 'O3_amount':
    case 'O3_equity':
      return offerExtras(state, chip, text, svc)

    // ── Startup offer ─────────────────────────────────────────────────────────────────────────────────────
    case 'S1':
    case 'S2':
    case 'S2_strike':
    case 'S3':
    case 'S3_dollar':
    case 'S4':
    case 'S5':
    case 'S5_this':
    case 'S5_other':
      return startupTurn(state, chip, text, svc)
    case 'O3_compare':
      return offerCompare(state, text, svc)
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
    case 'S8':
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
/** A base pay as the take-home is worked from: a salary, or an hourly rate as the year it comes to. */
function takePay(f: Facts, pay: Exclude<Pay, { kind: 'unsure' }>): void {
  f.pendingPay = undefined
  f.payBasis = pay.kind
  f.hourlyRate = pay.kind === 'hourly' ? pay.rate : undefined
  f.hoursPerWeek = pay.kind === 'hourly' ? pay.hours : undefined
  takeIncome(f, pay.annual, 'salary')
}

/** "$95 an hour, or $95,000 a year?": a bare number that could be either is asked about, not guessed. */
function askHourOrYear(state: ChatState, n: number, turn: string): Step {
  state.facts.pendingPay = n
  return say({ ...state, turn }, [{ from: 'ribbit', text: `Is that ${fc(n)} an hour, or ${fc(n * 1_000)} a year?` }],
    [{ label: `${fc(n)} an hour`, value: 'hourly' }, { label: `${fc(n * 1_000)} a year`, value: 'salary' }], 'money')
}

/** The answer to askHourOrYear, tapped or typed. Null when it is neither: the text is then read as a new answer. */
function hourOrYear(f: Facts, chip: string | undefined, text: string): Exclude<Pay, { kind: 'unsure' }> | null {
  const n = f.pendingPay
  if (!n) return null
  const pick = chip ?? (/hour|hr\b/i.test(text) ? 'hourly' : /year|annual|salary|\bk\b|thousand|grand/i.test(text) ? 'salary' : '')
  const hourly = pick === 'hourly' ? readPay(String(n), 'hourly') : null
  return hourly?.kind === 'hourly' ? hourly : pick === 'salary' ? { kind: 'salary', annual: n * 1_000 } : null
}

/**
 * Rent's and money's first question, a yearly salary or a monthly take-home: an hourly rate typed there ("19.50",
 * "$22/hr") is pay, the year it comes to, where "19.50" read as $20 a month of take-home. A bare 10 to 199 with no
 * option tapped (or 10 to 999 after Yearly salary) is asked about, an hour or a year. Null: the number is read as
 * before, by size or by the tapped option.
 */
function hourlyAtIncome(state: ChatState, chip: string | undefined, text: string): Pay | null {
  const f = state.facts
  const answered = state.turn.endsWith('_basis') ? hourOrYear(f, chip, text) : null
  if (answered) return answered
  const tapped = state.turn.endsWith('_amount') ? f.takeHomeFrom : undefined
  const pay = readPay(text, tapped === 'salary' ? 'salary' : undefined)
  if (pay?.kind === 'hourly') return pay
  if (pay?.kind === 'unsure' && tapped !== 'typed' && (tapped === 'salary' || pay.n < 200)) return pay
  return null
}

/** The first answer said back: "At $19.50 an hour, 40 hours a week, that's about $40,560 a year, and" or "On $85,000 a year,". */
const incomeLead = (f: Facts) =>
  f.payBasis === 'hourly' && f.hourlyRate ? `At ${payLine(f)}, that's about ${fc(f.salary ?? 0)} a year, and` : `On ${fc(f.salary ?? 0)} a year,`

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

// The startup flow never asks where: its figures are before tax.
const LOCATION_TURN: Partial<Record<Flow, string>> = { rent: 'R2', offer: 'O2', money: 'M2' }

async function chooseLocation(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pfx = LOCATION_TURN[state.flow ?? 'rent'] ?? 'R2'
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
  const pfx = LOCATION_TURN[state.flow ?? 'rent'] ?? 'R2'
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
  // D.C. is all city: its one area is the answer, not a question with one option.
  if (st.code === 'DC' && f.metroOptions.length === 1) return metroChosen(state, f.metroOptions[0].value, 'DC', svc)
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
    // A preset city or another state ("DC" at Washington's areas, Nov 12) is a different answer to where: start the
    // location over with it.
    const other = matchState(text)
    if (matchPresetCity(text) || (other && other.code !== f.stateCode)) {
      return chooseLocation({ ...state, turn: LOCATION_TURN[state.flow ?? 'rent'] ?? 'R2' }, undefined, text, svc)
    }
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
  return offerScore(state, debt > 0 ? `With ${fc(debt)} a month in debt payments, rent that fits is ${f.range.formatted}.` : '')
}

// ── Move-in score (spec: "Rent Chat: Move-In Score and Unfinished-Plan Spec", Nov 6) ─────────────────────────────

/**
 * Offered after the debt answer, before the pick: the debt answer sets the final range, and the move-in cash comes
 * from its top. Two chips in one reply, so it's one choice and never forced.
 */
export const SCORE_OFFER_TEXT = "Want your move-in score first? One question about what you've saved, then the rent pick."
const SCORE_OFFER_CHIPS: Chip[] = [{ label: 'Get my move-in score', value: 'score' }, { label: 'Pick my rent', value: 'pick' }]

function offerScore(state: ChatState, lead: string): Step {
  const r = state.facts.range!
  return say({ ...state, turn: 'R3_score' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, figure: state.facts.debtMonthly ? span(r.low, r.high) : undefined, figureLabel: 'Rent that fits, after debt' }] : []),
    { from: 'ribbit', text: SCORE_OFFER_TEXT },
  ], SCORE_OFFER_CHIPS, 'money', [{ name: 'ribbit_score_offered', props: { turn: 'R3' } }])
}

/** One tap, no typing; a typed amount lands in its band. The score uses the band's middle, and the math says so. */
const SAVED_CHIPS: Chip[] = [
  { label: 'Under $1,000', value: 'saved_under_1k' }, { label: '$1,000 to $3,000', value: 'saved_1k_3k' },
  { label: '$3,000 to $6,000', value: 'saved_3k_6k' }, { label: 'More than $6,000', value: 'saved_over_6k' },
]
const SAVED_MIDDLE: Record<string, number> = { saved_under_1k: 500, saved_1k_3k: 2000, saved_3k_6k: 4500, saved_over_6k: 7000 }

function savedBand(n: number | null): string | null {
  if (n === null) return null
  return n < 1000 ? 'saved_under_1k' : n <= 3000 ? 'saved_1k_3k' : n <= 6000 ? 'saved_3k_6k' : 'saved_over_6k'
}

function askSaved(state: ChatState): Step {
  return say({ ...state, turn: 'R3_saved' }, [{ from: 'ribbit', text: 'How much do you have set aside for the move?' }],
    SAVED_CHIPS, 'money', [{ name: 'ribbit_score_started', props: { turn: 'R3' } }])
}

export type ScoreGap = 'move_in_cash' | 'debt' | 'cushion'
export interface MoveInScore {
  saved: number
  /** The top of the move-in estimate (calculateUpfrontCash on the top of the range). */
  moveInHigh: number
  /** Debt payments as a share of take-home (0.03 = 3%), and the cushion left after the move in months of take-home. */
  debtShare: number
  cushionMonths: number
  moveIn: number
  debt: number
  cushion: number
  total: number
  gap: ScoreGap
}

/**
 * Three parts, 100 points, by WeLeap's own rule of thumb (the math view shows the thresholds). Rent fit is not a
 * part: the range is built to fit take-home, so it would always score full. The gap is move-in cash whenever it is
 * short, because it has a deadline; otherwise the part furthest below its maximum (debt on a tie, the cushion when
 * both are full).
 */
export function moveInScore(saved: number, moveInHigh: number, debtMonthly: number, takeHome: number): MoveInScore {
  const moveIn = moveInHigh > 0 ? Math.round(Math.min(1, saved / moveInHigh) * 40) : 40
  const debtShare = takeHome > 0 ? debtMonthly / takeHome : debtMonthly > 0 ? 1 : 0
  const debt = debtShare <= 0.05 ? 30 : debtShare <= 0.15 ? 20 : debtShare <= 0.25 ? 10 : 0
  const cushionMonths = takeHome > 0 ? (saved - moveInHigh) / takeHome : 0
  const cushion = cushionMonths <= 0 ? 0 : cushionMonths < 1 ? 10 : cushionMonths <= 3 ? 20 : 30
  const gap: ScoreGap = moveIn < 40 ? 'move_in_cash' : debt === 30 && cushion === 30 ? 'cushion' : debt <= cushion ? 'debt' : 'cushion'
  return { saved, moveInHigh, debtShare, cushionMonths, moveIn, debt, cushion, total: moveIn + debt + cushion, gap }
}

/** One button, labelled by the gap: the person's goal on the label, the store mark on it on phones (#187). */
export const GAP_BUTTON: Record<ScoreGap, string> = {
  move_in_cash: 'Plan my savings for the move', debt: 'Plan my debt payoff', cushion: 'Build my cushion',
}
const GAP_STEP: Record<ScoreGap, string> = {
  move_in_cash: 'A plan for your move-in cash', debt: 'A plan for your debt payments', cushion: 'A plan for your cushion',
}
export const SCORE_FINE = 'A WeLeap check from your answers, not a credit score.'
export const SCORE_CARD_TEXT = 'Your move plan so far. The two open steps are what WeLeap does next.'

/** Names the one gap and nothing worse: no grades, no "bad", "behind" or "can't afford". */
function scoreText(s: MoveInScore, debtMonthly: number): string {
  if (s.gap === 'move_in_cash') {
    return `Rent fits your take-home. Move-in cash is the gap: about ${fc(s.moveInHigh)} before the keys, and you have about ${fc(s.saved)}.`
  }
  const covered = 'Rent fits your take-home and your move-in cash is covered.'
  if (s.gap === 'debt') {
    return `${covered} Debt payments are the gap: ${fc(debtMonthly)} a month is ${Math.round(s.debtShare * 100)}% of your take-home.`
  }
  if (s.cushion === 30) return `${covered} Debt payments are light, and you'd keep more than 3 months of take-home after the move.`
  const left = Math.max(0, s.saved - s.moveInHigh)
  return left > 0
    ? `${covered} The cushion after the move is the gap: about ${fc(left)} left, ${s.cushionMonths < 1 ? 'under a month' : 'one to three months'} of take-home.`
    : `${covered} The cushion after the move is the gap: the move would use about all of what you've set aside.`
}

function scoreTurn(state: ChatState, band: string): Step {
  const f = state.facts
  const up = calculateUpfrontCash(f.range!, f.takeHomeMonthly ?? 0)
  f.upfront = { low: up.low, high: up.high }
  const s = moveInScore(SAVED_MIDDLE[band], up.high, f.debtMonthly ?? 0, f.takeHomeMonthly ?? 0)
  f.score = { ...s, savedBand: band }
  // The plan preview card moves up with the score (it showed only at the end, which almost no phone chat reaches), and
  // its button becomes the gap button: one card and one main button in the turn.
  const card = scoreCard(f, s.gap)
  return say({ ...state, turn: 'R3_scored', invited: true }, [
    { from: 'ribbit', text: scoreText(s, f.debtMonthly ?? 0), figure: `${s.total} / 100`, figureLabel: 'Move-in score', fine: SCORE_FINE, turn: 'R3_score' },
    {
      from: 'ribbit', text: SCORE_CARD_TEXT, turn: 'R3_score', planCard: card,
      appAsk: { label: GAP_BUTTON[s.gap], why: 'score_gap', gap: s.gap, note: 'No forms: your numbers come with you.', textInstead: true },
    },
  ], [{ label: 'Pick my rent', value: 'pick' }, { label: 'Show me the math', value: '__math__' }], 'money', [
    { name: 'ribbit_score_shown', props: { turn: 'R3', score: s.total, gap: s.gap, move_in_cash: s.moveIn, debt: s.debt, cushion: s.cushion, saved_band: band } },
    { name: 'ribbit_plan_card_shown', props: { turn: 'R3', gap: s.gap, known_rows: card.known.length } },
  ])
}

function scoreCard(f: Facts, gap: ScoreGap): NonNullable<ChatMessage['planCard']> {
  const known = [
    ...(f.takeHomeMonthly ? [{ label: 'Take-home', value: `${fc(f.takeHomeMonthly)}/mo` }] : []),
    ...(f.range ? [{ label: 'Rent that fits', value: span(f.range.low, f.range.high) }] : []),
    ...(f.debtMonthly ? [{ label: 'Debt payments', value: `${fc(f.debtMonthly)}/mo` }] : []),
    ...(f.upfront ? [{ label: 'Move-in cash, up to', value: fc(f.upfront.high) }] : []),
  ]
  return {
    title: 'Your move plan',
    known,
    locked: [],
    steps: [
      { label: 'Rent range', done: true }, { label: 'Take-home after tax', done: true }, { label: 'Move-in score', done: true },
      { label: GAP_STEP[gap], done: false }, { label: 'Checked against your real spending', done: false },
    ],
  }
}

/** "Show me the math" on the score: the three parts with their points, and the thresholds behind them. */
function scoreMath(f: Facts): MathRow[] {
  const s = f.score!
  const band = SAVED_CHIPS.find((c) => c.value === s.savedBand)?.label ?? ''
  const months = s.cushionMonths <= 0 ? 'none left' : s.cushionMonths < 1 ? 'under a month' : s.cushionMonths <= 3 ? '1 to 3 months' : 'more than 3 months'
  return [
    { label: `Set aside (the middle of ${band})`, value: fc(s.saved) },
    { label: 'Move-in cash, estimated from the top of your range', value: fc(s.moveInHigh) },
    { label: `Move-in cash: ${fc(s.saved)} of ${fc(s.moveInHigh)}, × 40, at most 40`, value: `${s.moveIn} of 40` },
    { label: `Debt payments, ${Math.round(s.debtShare * 100)}% of take-home (up to 5% = 30, 15% = 20, 25% = 10, more = 0)`, value: `${s.debt} of 30` },
    { label: `Cushion after the move, ${months} of take-home (none = 0, under a month = 10, 1 to 3 = 20, more = 30)`, value: `${s.cushion} of 30` },
    { label: 'Move-in score', value: `${s.total} / 100`, strong: true },
  ]
}

// ── The rent test's arms (decided Nov 12 2026) ────────────────────────────────────────────────────────────────

/**
 * Rent chats get one of three arms, a third each, at random per thread (the page assigns it and keeps it through a
 * reload or Start over). All three show the same range first; they part right after it:
 *   - control: the chat as it was (the spending check, then "Which city?").
 *   - b: "Got a place in mind?" A place's rent gets its move-in cash, what's left each month and a move-in score;
 *     a second or third goes side by side. The ask saves the plan at the place they pick.
 *   - c: the rest of the move plan, shown locked behind a free account; no free middle.
 * Each ask promises only what the app shows after sign-up (plan.weleap.app, client/webui ribbitPlan.ts): take-home,
 * the rent or the range, and the month split into needs, wants and savings. C's "Cash to have before you move" row
 * needs the app to show `upfront` on a rent plan.
 */
export type RentArm = 'control' | 'b' | 'c'
export const RENT_ARMS: RentArm[] = ['control', 'b', 'c']

export function assignRentArm(random: () => number = Math.random): RentArm {
  return RENT_ARMS[Math.min(RENT_ARMS.length - 1, Math.floor(random() * RENT_ARMS.length))]
}

/** A place checked in arm B: `short` heads its column side by side ("Mueller" out of "2-bed in Mueller"). */
export interface Place { name: string; short: string; rent: number; moveIn: number; left: number; share: number; score: number }

export const PLACE_PROMPT_TEXT = "Got a place in mind? Tell me its rent and I'll check it against your budget: the cash you need to move in, and what's left each month."
export const PLACE_ANOTHER_TEXT = "Looking at another place? Give me its rent and I'll put them side by side."
export const PLACE_ASK_NOTE = 'Free account. No bank needed.'
const PLACE_FINE = 'A WeLeap check from your answers, not a credit score. Debt payments are not in it yet.'
const MAX_PLACES = 3
const ANOTHER_PLACE: Chip = { label: 'Add another place', value: 'another', opensKeyboard: true }

function askPlace(state: ChatState, before: ChatMessage[], events: ChatEvent[]): Step {
  return say({ ...state, turn: 'R2b' }, [...before, { from: 'ribbit', text: PLACE_PROMPT_TEXT }], [
    { label: 'Type a rent', value: 'type_rent', opensKeyboard: true }, { label: 'Still looking', value: 'looking' },
    { label: 'Show me the math', value: '__math__' },
  ], 'money', [...events, { name: 'ribbit_place_prompt_shown', props: { turn: 'R2' } }])
}

/** What they called the place, from the words around its rent ("$1,450, a 1-bed in East Austin"), else Place 2. */
export function placeName(text: string, n: number): { name: string; short: string } {
  const words = text
    .replace(/\$?\d[\d,]*(\.\d+)?\s*k?\b(\s*(\/\s*mo(nth)?|a month|per month|monthly))?/i, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/^(it'?s|is|for|at|about|around|a|an)\s+/i, '')
    .replace(/\s+(is|at|for|about|around)$/i, '')
    .trim()
  if (words.length < 3 || words.length > 40 || !/[a-z]{3}/i.test(words)) return { name: `Place ${n}`, short: `Place ${n}` }
  const name = words[0].toUpperCase() + words.slice(1)
  const area = name.match(/\b(?:in|on|near|at)\s+([A-Z][\w'.-]*(?:\s+[A-Z][\w'.-]*){0,2})\s*$/)?.[1]
  return { name, short: area ?? (name.length <= 16 ? name : `Place ${n}`) }
}

async function placeTurn(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const places = f.places ?? []
  if (chip === 'looking') {
    return say({ ...state, turn: 'R2' }, [{ from: 'ribbit', text: 'No problem. Which city?' }],
      [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [{ name: 'ribbit_place_skipped', props: { turn: 'R2' } }])
  }
  if (chip === 'type_rent' || chip === 'another') {
    return say(state, [{ from: 'ribbit', text: places.length ? "What's the next place's rent?" : "What's the monthly rent?" }], [], 'money')
  }
  if (chip === 'the_one' && places.length) return choosePlace(state, places[places.length - 1], [])
  const picked = chip?.startsWith('pick_') ? places[Number(chip.slice(5))] : undefined
  if (picked) return choosePlace(state, picked, [])
  // A city instead of a rent ("Austin"): the control's next question, answered.
  if (!chip && state.turn === 'R2b' && !places.length && (matchPresetCity(text) || matchState(text))) return chooseLocation({ ...state, turn: 'R2' }, undefined, text, svc)
  const rent = chip ? null : parseMoney(text)
  if (!rent || rent < 200 || rent > 20_000) return question(state, text, svc, 'the monthly rent of a place they are looking at')
  if (places.length >= MAX_PLACES) {
    return say(state, [{ from: 'ribbit', text: `I can line up ${MAX_PLACES} places at a time. Start over to check a new set.` }], state.ui?.chips ?? [], 'money')
  }
  const place = { rent, ...placeName(text, places.length + 1) }
  if (!f.placeSaved) {
    return say({ ...state, turn: 'R2b_saved', facts: { ...f, pendingPlace: place } },
      [{ from: 'ribbit', text: `Got it, ${fc(rent)}. One question so I can score it: how much do you have set aside for the move?` }], SAVED_CHIPS, 'money')
  }
  return placeChecked(state, place)
}

function placeChecked(state: ChatState, given: { rent: number; name: string; short: string }): Step {
  const f = state.facts
  const takeHome = f.takeHomeMonthly ?? 0
  const range = f.range!
  const moveIn = calculateUpfrontCash({ ...range, low: given.rent, high: given.rent }, takeHome).high
  const s = moveInScore(SAVED_MIDDLE[f.placeSaved!], moveIn, f.debtMonthly ?? 0, takeHome)
  const place: Place = { ...given, moveIn, left: Math.max(0, takeHome - given.rent), share: takeHome ? given.rent / takeHome : 0, score: s.total }
  const places = [...(f.places ?? []), place]
  f.places = places
  const events: ChatEvent[] = [{ name: 'ribbit_place_checked', props: {
    turn: 'R2b', n: places.length, rent: place.rent, score: s.total, gap: s.gap,
    fit: place.rent > range.high ? 'above' : place.rent < range.low ? 'below' : 'in_range', saved_band: f.placeSaved,
  } }]
  if (places.length === 1) {
    // A quiet save under the first card (most check one place at most): the plan at this rent.
    f.pick = place.rent
    f.upfront = { low: place.moveIn, high: place.moveIn }
    const fit = place.rent > range.high
      ? `${fc(place.rent)} is above your range of ${range.formatted}, so it leaves less for everything else.`
      : place.rent < range.low
        ? `${fc(place.rent)} is under your range, so it leaves room to save.`
        : `${fc(place.rent)} fits, ${place.rent >= (range.low + range.high) / 2 ? 'near the top' : 'in the lower half'} of your range.`
    const tight = s.gap === 'move_in_cash' ? ' The tight part is the cash before the keys.' : ''
    return say({ ...state, turn: 'R2b_more', invited: true }, [
      {
        from: 'ribbit', text: fit + tight, figure: `${s.total} / 100`, figureLabel: 'Move-in score', fine: PLACE_FINE, turn: 'R2b',
        planCard: {
          title: place.name, badge: `${fc(place.rent)}/mo`, locked: [],
          known: [
            { label: 'Cash before you move', value: fc(place.moveIn) },
            { label: 'Left each month after rent', value: fc(place.left) },
            { label: 'Rent as a share of take-home', value: `${Math.round(place.share * 100)}%` },
          ],
        },
        appAsk: { label: 'Save this place', why: 'place_check', quiet: true },
      },
      { from: 'ribbit', text: PLACE_ANOTHER_TEXT },
    ], [ANOTHER_PLACE, { label: "That's the one", value: 'the_one' }], 'money', events)
  }
  // Side by side: the best score first, the lower rent on a tie (with the same savings that is the cheapest).
  const best = [...places].sort((a, b) => b.score - a.score || a.rent - b.rent)[0]
  const next = [...places].filter((p) => p !== best).sort((a, b) => a.rent - b.rent)[0]
  const more = best.left - next.left
  const less = next.moveIn - best.moveIn
  const line = more > 0
    ? `${best.short} leaves you ${fc(more)} more a month${less > 0 ? ` and needs ${fc(less)} less to move in` : ''}.`
    : `They come out the same on the numbers.`
  return choosePlace(state, best, [{ from: 'ribbit', text: line, places, turn: 'R2b' }], events)
}

/** The ask, at the place they chose (or the best side by side): the app opens with that rent in the plan. */
function choosePlace(state: ChatState, place: Place, before: ChatMessage[], events: ChatEvent[] = []): Step {
  const f = state.facts
  const places = f.places ?? []
  f.pick = place.rent
  f.upfront = { low: place.moveIn, high: place.moveIn }
  const others = places.map((p, i) => ({ p, i })).filter(({ p }) => p !== place)
  return say({ ...state, turn: 'R2b_done', invited: true }, [...before, {
    from: 'ribbit', text: `Save ${places.length > 1 ? place.short : 'it'} and I'll build your month around ${fc(place.rent)}: needs, wants and savings.`, turn: 'R2b',
    appAsk: { label: `Save my plan at ${fc(place.rent)}`, why: 'place_check', note: PLACE_ASK_NOTE },
  }], [
    ...others.map(({ p, i }) => ({ label: `Save ${p.short} instead`, value: `pick_${i}` })),
    ...(places.length < MAX_PLACES ? [ANOTHER_PLACE] : []),
  ], 'money', [...events, { name: 'ribbit_place_chosen', props: { turn: 'R2b', n: places.length, rent: place.rent } }])
}

export const MOVE_PLAN_TEXT = "That's your range. I've also worked out the rest of your move."
export const MOVE_PLAN_NOTE = 'Free. No bank needed.'
export const MOVE_PLAN_LOCKED = ['Cash to have before you move', 'Your month after rent: needs, wants, savings']
const MOVE_PLAN_DECLINED = (range: string) => `Sure. ${range} is yours either way. The button is there if you want the rest.`

/** C: the move plan's rows the app shows after sign-up, locked; the chat stops at the range. */
function movePlan(state: ChatState, fits: ChatMessage): Step {
  const f = state.facts
  const up = calculateUpfrontCash(f.range!, f.takeHomeMonthly ?? 0)
  f.upfront = { low: up.low, high: up.high }
  const card: NonNullable<ChatMessage['planCard']> = {
    title: 'Your move plan',
    known: [{ label: 'Take-home', value: `${fc(f.takeHomeMonthly ?? 0)}/mo` }, { label: 'Rent that fits', value: span(f.range!.low, f.range!.high) }],
    locked: MOVE_PLAN_LOCKED,
    lockedTitle: 'Unlocks with a free account',
  }
  return say({ ...state, turn: 'R2c', invited: true }, [fits, {
    from: 'ribbit', text: MOVE_PLAN_TEXT, turn: 'R2', planCard: card,
    appAsk: { label: 'Create a free account to see it', why: 'move_plan', note: MOVE_PLAN_NOTE },
  }], [{ label: 'Just the range, thanks', value: 'range_only' }, { label: 'Show me the math', value: '__math__' }], 'text', [
    win('R2'), { name: 'ribbit_plan_card_shown', props: { turn: 'R2', known_rows: card.known.length } },
  ])
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
function spendingCheck(text: string, note: string, label = 'Check it against my real spending'): ChatMessage {
  return { from: 'ribbit', text, appAsk: { label, why: 'spending_check', note } }
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

// Hourly as well as yearly, as the rent question offers its two (Nov 3): a paid visitor typed "19.50", which read
// as $20 a year and went to Ribbit as a question.
const PAY_CHIPS: Chip[] = [{ label: 'Yearly salary', value: 'salary', opensKeyboard: true }, { label: 'Hourly', value: 'hourly', opensKeyboard: true }]
/** Under the amount question, the other one (Nov 8): a paid visitor who tapped Yearly but is paid by the hour could
 * only switch with Start over. */
const OTHER_PAY_CHIP: Record<'salary' | 'hourly', Chip> = {
  salary: { label: "It's hourly", value: 'hourly', opensKeyboard: true },
  hourly: { label: "It's a yearly salary", value: 'salary', opensKeyboard: true },
}

function askOfferSalary(state: ChatState): Step {
  return say({ ...state, turn: 'O1' }, [
    { from: 'ribbit', text: "Congrats on the offer. What's the base pay? A yearly salary or an hourly rate both work.", turn: 'O1' },
  ], PAY_CHIPS, 'money')
}

/** "$19.50" with its cents, "$22" without. */
const fcc = (n: number) => (Number.isInteger(n) ? fc(n) : `$${n.toFixed(2)}`)
/** The pay as the chat says it back: "$19.50 an hour, 40 hours a week" or "$85,000". */
const payLine = (f: Facts) => (f.payBasis === 'hourly' && f.hourlyRate ? `${fcc(f.hourlyRate)} an hour, ${f.hoursPerWeek} hours a week` : fc(f.salary ?? 0))

async function offerPay(state: ChatState, chip: string | undefined, text: string, svc: ChatServices, typed = ''): Promise<Step> {
  const f = state.facts
  if (state.turn !== 'O1_basis' && (chip === 'salary' || chip === 'hourly')) {
    f.payBasis = chip
    // A number already in the box is the answer (Nov 8): a paid visitor typed theirs, then tapped Yearly salary, the
    // tap cleared it and the question came back, and they left.
    if (readPay(typed, chip)) return offerPay({ ...state, turn: 'O1_amount' }, undefined, typed, svc)
    return say({ ...state, turn: 'O1_amount' }, [{
      from: 'ribbit',
      // The rate alone (Nov 5): the phone's number pad has no comma, letters or "$", so "$19.50, 30 hours" can't be
      // typed there, and 4 of 6 paid visitors who tapped Hourly left without sending. Typed hours still read.
      text: chip === 'salary' ? "What's the yearly base salary?" : `What's the hourly rate? I'll count ${DEFAULT_HOURS} hours a week.`,
    }], [OTHER_PAY_CHIP[chip]], 'money')
  }
  const pay = (state.turn === 'O1_basis' ? hourOrYear(f, chip, text) : null) ?? readPay(text, state.turn === 'O1_amount' ? f.payBasis : undefined)
  if (!pay || (pay.kind === 'salary' && pay.annual < 1_000)) return question(state, text, svc, 'the base pay in the offer, yearly or hourly')
  if (pay.kind === 'unsure') return askHourOrYear(state, pay.n, 'O1_basis')
  takePay(f, pay)
  const takeHome = f.takeHomeMonthly ?? 0
  const lead = pay.kind === 'hourly'
    ? `At ${payLine(f)}, that's about ${fc(pay.annual)} a year. Take-home before state tax and any 401k is about ${fc(takeHome)} a month.`
    : `On ${fc(pay.annual)}, take-home before state tax and any 401k is about ${fc(takeHome)} a month.`
  return say({ ...state, turn: 'O2' }, [
    { from: 'ribbit', text: lead, figure: `${fc(takeHome)}/mo`, figureLabel: 'Take-home before state tax', turn: 'O2' },
    { from: 'ribbit', text: 'Which city is the job in?' },
  ], [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [win('O2')])
}

/**
 * The app offer sits on the take-home in the job's city (O3), the offer's real answer, as rent's sits on its range
 * (R2). Nov 5 to 8 it sat on the first take-home (O2), before state tax and the city, in rent's words: 0 of 25 paid
 * visitors tapped it, against 15 of 85 on rent. The thread's one invite; O6 stays the second chance.
 */
export const TAKEHOME_SPENDING_CHECK_TEXT =
  "That's the paycheck. What it covers depends on what you spend, the one part I can't see. WeLeap can split your first one before it lands: rent, savings, the 401k."
export const TAKEHOME_SPENDING_CHECK_LABEL = 'Plan my first paycheck'
export const TAKEHOME_SPENDING_CHECK_NOTE = "Free in WeLeap. See last month's spending next to this take-home."

const EXTRA_CHIPS: Chip[] = [
  { label: 'Signing bonus', value: 'signing' }, { label: 'Annual bonus', value: 'bonus' }, { label: 'Equity', value: 'equity' },
]

/**
 * The take-home in the job's city, then the offer's next question. Comparing a second offer leads (Nov 3): the one
 * paid visitor who reached this turn skipped the spending check offered here and compared a second offer by hand.
 * The spending check waits for the 401k decision (O6) and the plan's ending.
 */
const COMPARE_CHIP: Chip = { label: 'Compare another offer', value: 'compare' }
const COMPARE = /\b(compare|another offer|other offer|second offer|two offers|both offers|competing offer)\b/i
const extrasQuestion = (f: Facts) => `Anything on top of the ${f.payBasis === 'hourly' ? 'pay' : 'salary'}?`
const extrasChips = (f: Facts): Chip[] => [
  ...(f.compareSalary ? [] : [COMPARE_CHIP]), ...EXTRA_CHIPS,
  { label: f.payBasis === 'hourly' ? 'Just the pay' : 'Just salary', value: 'none' }, { label: 'Show me the math', value: '__math__' },
]

function offerAfterLocation(state: ChatState): Step {
  const f = state.facts
  const line = placeTaxLine(f) || `In ${f.place}, take-home before any 401k is about ${fc(f.takeHomeMonthly ?? 0)} a month.`
  // Once a thread, and not after an invite a question at "Which city?" already brought.
  const first = !f.rangeSpendingCheckShown && !state.invited
  f.rangeSpendingCheckShown = true
  return say({ ...state, turn: 'O3', invited: state.invited || first }, [
    { from: 'ribbit', text: f.tax ? `${line} That's before any 401k.` : line, figure: `${fc(f.takeHomeMonthly ?? 0)}/mo`, figureLabel: 'Take-home', turn: 'O3' },
    ...(first ? [spendingCheck(TAKEHOME_SPENDING_CHECK_TEXT, TAKEHOME_SPENDING_CHECK_NOTE, TAKEHOME_SPENDING_CHECK_LABEL)] : []),
    { from: 'ribbit', text: `Weighing another offer? I can put the two side by side. Otherwise, ${extrasQuestion(f).toLowerCase()}` },
  ], extrasChips(f), 'text', [win('O3'), ...(first ? [{ name: 'ribbit_spending_check_shown', props: { turn: 'O3' } }] : [])])
}

/** The other offer's base pay, priced in the same place with the same taxes, next to this one's take-home. */
async function offerCompare(state: ChatState, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pay = readPay(text, f.payBasis)
  if (!pay || pay.kind === 'unsure' || pay.annual < 1_000) return question(state, text, svc, "the other offer's base pay, yearly or hourly")
  const other = pay.annual
  const tax = f.stateCode ? await svc.tax(other, f.stateCode) : null
  const local = tax && f.region ? localTaxAnnual(f.region.regionName, Math.max(0, other - STANDARD_DEDUCTION_2026_SINGLE)) : 0
  const takeHome = tax ? Math.max(0, tax.netIncomeAnnual - local) / 12 : beforeStateTakeHome(other)
  f.compareSalary = other
  f.compareTakeHome = takeHome
  const diff = takeHome - (f.takeHomeMonthly ?? 0)
  const said = pay.kind === 'hourly' ? `${fcc(pay.rate)} an hour, ${pay.hours} hours a week` : fc(other)
  const where = f.place ? ` in ${f.place}` : ''
  // The year is twelve of the month as shown, so the two figures multiply out.
  const gap = Math.round(Math.abs(diff))
  const verdict = gap < 10 ? 'about the same as this one.' : `${fc(gap)} a month ${diff > 0 ? 'more' : 'less'} than this one, ${fc(gap * 12)} a year.`
  return say({ ...state, turn: 'O3' }, [
    {
      from: 'ribbit',
      text: `At ${said}, the other offer takes home about ${fc(takeHome)} a month${where}: ${verdict} That's base pay only. A bonus, equity or a 401k match can change which one comes out ahead.`,
      figure: `${fc(takeHome)}/mo`, figureLabel: 'The other offer, take-home', turn: 'O3_compare',
    },
    { from: 'ribbit', text: `Back to this offer. ${extrasQuestion(f)}` },
  ], extrasChips(f), 'text', [win('O3_compare'), { name: 'ribbit_offer_compared', props: { turn: 'O3', other_more: diff > 0 } }])
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
  if (!f.compareSalary && (chip === 'compare' || (!chip && COMPARE.test(text)))) {
    // "I have another offer for $22/hr": the pay is already there.
    const typed = chip ? null : readPay(text, f.payBasis)
    if (typed && typed.kind !== 'unsure' && typed.annual >= 1_000) return offerCompare({ ...state, turn: 'O3_compare' }, text, svc)
    return say({ ...state, turn: 'O3_compare' }, [{
      from: 'ribbit', text: `What's the other offer's base pay, yearly or hourly?${f.place ? ` I'll price it in ${f.place} too.` : ''}`,
    }], [], 'money')
  }
  if (state.turn === 'O3_equity') {
    // Startup equity is never a dollar a year in the package: it moves to the startup turns, with the pay kept.
    const kind = chip ?? (/startup|private|options?\b|pre-?ipo/i.test(text) ? 'startup' : /public|rsu|listed|stock/i.test(text) ? 'public' : '')
    if (kind === 'startup') {
      return askGrant({ ...state, flow: 'startup', facts: { ...f, switchedFrom: 'offer' } }, '', [{ name: 'ribbit_startup_branch', props: { turn: 'O3' } }])
    }
    if (kind === 'public') {
      f.pendingExtra = 'equity'
      return say({ ...state, turn: 'O3_amount' }, [{ from: 'ribbit', text: 'About how much stock vests a year, in dollars?' }], [], 'money')
    }
    return question(state, text, svc, 'whether the equity is public company stock or startup options')
  }
  const pick = chip ?? (/sign/i.test(text) ? 'signing' : /bonus/i.test(text) ? 'bonus' : /equity|rsu|stock|options?\b/i.test(text) ? 'equity' : /just|no|none|that'?s all/i.test(text) ? 'none' : '')
  if (pick === 'none') return askMatch(state)
  if (pick === 'equity') {
    return say({ ...state, turn: 'O3_equity' }, [{ from: 'ribbit', text: 'Public company stock or startup options?' }],
      [{ label: 'Public company stock', value: 'public' }, { label: 'Startup options or shares', value: 'startup' }], 'text')
  }
  if (pick === 'signing' || pick === 'bonus') {
    f.pendingExtra = pick
    const q = pick === 'signing' ? 'How much is the signing bonus?' : 'What is the annual bonus target? A percent of salary or a dollar amount.'
    return say({ ...state, turn: 'O3_amount' }, [{ from: 'ribbit', text: q }], [], 'money')
  }
  return question(state, text, svc, 'anything on top of the base pay: signing bonus, annual bonus or equity, or another offer to compare')
}

export const BENEFITS_CHIP: Chip = { label: 'Upload my benefits guide', value: '__upload_benefits__' }

function askMatch(state: ChatState, before: ChatMessage[] = []): Step {
  const read = state.facts.benefitsRead
  return say({ ...state, turn: 'O4' }, [...before, {
    from: 'ribbit', turn: 'O4',
    text: read ? 'Does the company match 401k?' : "Does the company match 401k? It's usually in the benefits guide. Upload it and I'll read the match.",
  }], [
    ...(read ? [] : [BENEFITS_CHIP]),
    { label: 'Yes, I know the %', value: 'known' }, { label: 'Yes, not sure how much', value: 'unknown' },
    { label: 'No', value: 'none' }, { label: 'Not sure', value: 'unknown' },
  ], 'text')
}

/**
 * A benefits guide, read on the page at O4 (the same route and fields as the offer tool's "Upload benefits guide"):
 * the match, the employer HSA and the premium on the HSA-eligible plan. A match read goes straight to what the offer
 * is worth with it; without one the question stays open. The HSA and premium go into the package as on the tool page.
 */
function readBenefits(state: ChatState, doc: DocRead): Step {
  const f = state.facts
  if ('failed' in doc) {
    const ui = state.ui
    return { state, messages: [{ from: 'ribbit', text: (LETTER_FAILED[doc.failed] ?? LETTER_FAILED.default).replace(/Typing (the numbers|them) works/, 'The answers below work').replace('the numbers', 'the match') }], chips: ui?.chips ?? [], input: ui?.input ?? 'text', events: [] }
  }
  const p = doc.parsed
  f.benefitsRead = true
  if (p.employerHsaAnnual) f.hsaMonthly = Math.round(p.employerHsaAnnual.value / 12)
  if (p.healthcarePremiumMonthly) f.healthcarePremium = Math.round(p.healthcarePremiumMonthly.value)
  const rate = p.matchRatePct?.value
  const cap = p.matchUpToPct?.value
  const rows: MathRow[] = [
    ...(rate !== undefined && cap !== undefined ? [{ label: '401k match', value: rate === 0 ? 'None' : `${rate}% up to ${cap}% of salary` }] : []),
    ...(p.employerHsaAnnual ? [{ label: 'Employer HSA', value: `${fc(p.employerHsaAnnual.value)}/yr` }] : []),
    ...(p.healthcarePremiumMonthly ? [{ label: 'Your health premium', value: `${fc(p.healthcarePremiumMonthly.value)}/mo` }] : []),
  ]
  const events: ChatEvent[] = [{ name: 'ribbit_benefits_read', props: { turn: state.turn, fields_found: rows.length, has_match: rate !== undefined && cap !== undefined } }]
  const plan = p.healthcarePremiumMonthly || p.employerHsaAnnual ? ' The HSA and premium are for one person on the HSA plan.' : ''
  if (rate !== undefined && cap !== undefined) {
    const readBack: ChatMessage = { from: 'ribbit', text: `Here's what I read.${plan}`, math: rows, turn: 'O4' }
    if (rate === 0 || cap === 0) {
      f.match = 'none'
      const none: ChatMessage = { from: 'ribbit', text: 'No match, so nothing to collect there.' }
      return withEvents(state.flow === 'startup' ? startupEnding(state, [readBack, none]) : offerRent(state, none.text, [readBack]), events)
    }
    const next = applyMatch(state, rate, cap)
    return { ...next, messages: [readBack, ...next.messages], events: [...events, ...next.events] }
  }
  const readBack: ChatMessage = rows.length
    ? { from: 'ribbit', text: `Here's what I read.${plan} I couldn't find the 401k match in it, though.`, math: rows }
    : { from: 'ribbit', text: "I couldn't find the 401k match in that one." }
  return withEvents(askMatch(state, [readBack]), events)
}

const withEvents = (step: Step, events: ChatEvent[]): Step => ({ ...step, events: [...events, ...step.events] })

async function offerMatch(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  if (state.turn === 'O4') {
    const v = chip ?? (/^no\b/i.test(text) ? 'none' : /not sure|don'?t know/i.test(text) ? 'unknown' : parseMatch(text) ? 'known' : '')
    if (v === 'none') { f.match = 'none'; return state.flow === 'startup' ? startupEnding(state, [{ from: 'ribbit', text: 'No match, so nothing to collect there.' }]) : offerRent(state, 'No match, so nothing to collect there.') }
    if (v === 'unknown' && state.flow === 'startup') {
      f.match = 'unknown'
      addRecruiterAsk(f, 'match')
      return startupEnding(state, [{ from: 'ribbit', text: ON_THE_LIST }])
    }
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
    hsaMonthly: f.hsaMonthly ?? 0, healthcarePremium: f.healthcarePremium ?? 0, rsuAnnual: f.rsuAnnual ?? 0, signingBonus: f.signingBonus ?? 0,
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
  if (state.flow === 'startup') return startupEnding(state, [{ from: 'ribbit', text, figure: `${fc(f.value?.totalPackage ?? salary)}/yr`, figureLabel: 'Pay and match a year', turn: 'O5' }])
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
    `Free in WeLeap. See last month's spending next to ${fc(f.takeHomeMonthly ?? 0)} take-home, before and after the ${cap}%.`,
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

// ── Startup offer turns ─────────────────────────────────────────────────────────────────────────────────────

/**
 * The startup offer (spec: "Startup Offer Analyzer: Ribbit Chat Spec"), from its own entry or from the offer flow's
 * Equity chip. The payoff comes by S3: the recruiter's number next to what the grant is worth today. Each turn after
 * adds one figure and can be skipped. The arithmetic is lib/offer/startupEquity.ts; nothing is added to a package.
 */
export const UPLOAD_CHIP: Chip = { label: 'Upload my offer letter', value: '__upload__' }
const NOT_SURE: Chip = { label: 'Not sure', value: 'unknown' }

function askStartup(state: ChatState): Step {
  return say({ ...state, turn: 'S1' }, [
    { from: 'ribbit', text: "Got a startup offer? Upload the letter and I'll read it, or tell me the base pay.", turn: 'S1' },
  ], [UPLOAD_CHIP], 'money')
}

const grantNoun = (f: Facts) => (f.equityType === 'rsu' ? 'RSUs' : f.equityType === 'restricted_stock' ? 'shares' : 'options')
const grantLine = (f: Facts) => `${(f.grantShares ?? 0).toLocaleString('en-US')} ${f.equityType === 'iso' ? 'ISOs' : f.equityType === 'nso' ? 'NSOs' : grantNoun(f)}`
const share$ = (n: number) => `$${n < 1 ? n.toFixed(n < 0.1 ? 3 : 2) : n.toFixed(2)}`
const vestLine = (f: Facts) => `${f.vestYears ?? DEFAULT_VEST_YEARS} years${(f.cliffMonths ?? DEFAULT_CLIFF_MONTHS) > 0 ? `, ${(f.cliffMonths ?? DEFAULT_CLIFF_MONTHS) === 12 ? '1-year' : `${f.cliffMonths}-month`} cliff` : ', no cliff'}`
const grantOf = (f: Facts): Grant => ({ shares: f.grantShares ?? 0, strike: f.equityType === 'rsu' ? 0 : f.strike, type: f.equityType, vestYears: f.vestYears })

function askGrant(state: ChatState, lead: string, events: ChatEvent[] = []): Step {
  const f = state.facts
  return say({ ...state, turn: 'S2' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead }] : []),
    { from: 'ribbit', text: 'How many options or shares, and at what strike price? Like 20,000 at $1.10.', turn: 'S2' },
  ], f.letterRead ? [] : [UPLOAD_CHIP], 'text', events)
}

function askStrike(state: ChatState, lead = ''): Step {
  return say({ ...state, turn: 'S2_strike' }, [{ from: 'ribbit', text: `${lead}What's the strike price? It's the price you'd pay for each share.`.trim() }],
    [{ label: "I don't know it", value: 'unknown' }, { label: "They're RSUs, no strike", value: 'rsu' }], 'money')
}

function askPrice(state: ChatState, before: ChatMessage[] = []): Step {
  const f = state.facts
  return say({ ...state, turn: 'S3' }, [...before, {
    from: 'ribbit', text: "Do you know the last round's price per share? The recruiter's dollar figure for the grant works too.", turn: 'S3',
  }], [{ label: 'The recruiter gave me a dollar value', value: 'dollar' }, NOT_SURE, ...(f.letterRead ? [{ label: "Something's off", value: 'fix' }] : [])], 'money')
}

/** The next question for what the chat still lacks: the grant, its strike, then the price. */
function nextStartupQuestion(state: ChatState, before: ChatMessage[] = []): Step {
  const f = state.facts
  if (!f.grantShares) return askGrant(state, before.map((m) => m.text).join(' '))
  if (hasStrike(grantOf(f)) && f.strike === undefined && !f.strikeUnknown) return askStrike(state, before.length ? `${before.map((m) => m.text).join(' ')} ` : '')
  if (f.pricePerShare) return priceTurn(state, before)
  return askPrice(state, before)
}

const LETTER_FAILED: Record<string, string> = {
  too_large: "That file is over 4MB, so I couldn't read it. A PDF export is usually much smaller than a photo. Typing the numbers works just as well.",
  no_fields: "I couldn't find the numbers in that one. It may be a scan I can't read. Typing them works just as well.",
  rate_limited: "That's a few documents in a short time, so I can't read another one yet. Typing the numbers works just as well.",
  timeout: 'That one took too long to read. Typing the numbers works just as well.',
  default: "I couldn't read that one. Typing the numbers works just as well.",
}

/** An offer letter, read on the page: what it says back, then the next missing piece. A failed read keeps the question open. */
function readLetter(state: ChatState, letter: NonNullable<Reply['letter']>): Step {
  const f = state.facts
  if ('failed' in letter) {
    const ui = state.ui
    return { state, messages: [{ from: 'ribbit', text: LETTER_FAILED[letter.failed] ?? LETTER_FAILED.default }], chips: ui?.chips ?? [], input: ui?.input ?? 'text', events: [] }
  }
  const p = letter.parsed
  const flow: Flow = state.flow === 'startup' ? 'startup' : state.flow ?? 'startup'
  if (p.baseSalaryAnnual && !f.salary) takePay(f, { kind: 'salary', annual: p.baseSalaryAnnual.value })
  if (p.workStateCode && !f.stateCode) f.stateCode = p.workStateCode.value
  if (p.equityType) f.equityType = p.equityType.value
  if (p.equityGrantShares) f.grantShares = p.equityGrantShares.value
  if (p.equityStrikePrice) f.strike = p.equityStrikePrice.value
  if (f.equityType === 'rsu') f.strike = 0
  if (p.equityVestYears) f.vestYears = p.equityVestYears.value
  if (p.equityCliffMonths !== undefined) f.cliffMonths = p.equityCliffMonths.value
  if (p.equityPricePerShare) f.pricePerShare = p.equityPricePerShare.value
  f.letterRead = true
  const rows: MathRow[] = [
    ...(p.baseSalaryAnnual ? [{ label: 'Base pay', value: fc(p.baseSalaryAnnual.value) }] : []),
    ...(f.grantShares ? [{ label: f.equityType === 'rsu' ? 'RSUs' : 'Grant', value: grantLine(f) }] : []),
    ...(f.grantShares && f.strike !== undefined && f.equityType !== 'rsu' ? [{ label: 'Strike price', value: share$(f.strike) }] : []),
    ...(f.grantShares && (p.equityVestYears || p.equityCliffMonths) ? [{ label: 'Vesting', value: vestLine(f) }] : []),
    ...(p.equityPricePerShare ? [{ label: 'Last round, per share', value: share$(p.equityPricePerShare.value) }] : []),
  ]
  const readBack: ChatMessage = rows.length
    ? { from: 'ribbit', text: f.grantShares ? "Here's what I read:" : "Here's what I read. I couldn't find the grant in it, though.", math: rows, turn: 'S1' }
    : { from: 'ribbit', text: "I couldn't find the grant in that one. Typing it works just as well.", turn: 'S1' }
  const next = nextStartupQuestion({ ...state, flow, facts: f })
  return { ...next, messages: [readBack, ...next.messages], events: [...next.events, { name: 'ribbit_letter_read', props: { turn: state.turn, fields_found: rows.length, has_grant: Boolean(f.grantShares) } }] }
}

async function startupTurn(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  switch (state.turn) {
    case 'S1': {
      const pay = readPay(text, 'salary')
      if (!pay || pay.kind === 'unsure' || pay.annual < 1_000) return question(state, text, svc, 'the base pay in the offer')
      takePay(f, pay)
      return askGrant(state, `Got it, ${fc(pay.annual)} base.`)
    }
    case 'S2': {
      const g = parseGrant(text)
      if (!g.shares) return question(state, text, svc, 'how many options or shares, and the strike price')
      f.grantShares = g.shares
      if (g.rsu) { f.equityType = 'rsu'; f.strike = 0 }
      if (g.strike !== undefined) f.strike = g.strike
      return nextStartupQuestion(state)
    }
    case 'S2_strike': {
      if (chip === 'rsu' || /\brsus?\b/i.test(text)) { f.equityType = 'rsu'; f.strike = 0; return nextStartupQuestion(state) }
      if (chip === 'unknown' || /don'?t know|not sure|no idea/i.test(text)) {
        f.strikeUnknown = true
        addRecruiterAsk(f, 'strike')
        return nextStartupQuestion(state, [{ from: 'ribbit', text: ON_THE_LIST }])
      }
      const n = parseDecimal(text)
      if (n === null || n >= 10_000) return question(state, text, svc, 'the strike price per share')
      f.strike = n
      return nextStartupQuestion(state)
    }
    case 'S3': {
      if (chip === 'fix') return askGrant({ ...state, facts: { ...f, grantShares: undefined, strike: undefined, strikeUnknown: undefined } }, 'Type it the way it reads.')
      if (chip === 'dollar') return say({ ...state, turn: 'S3_dollar' }, [{ from: 'ribbit', text: 'What dollar value did they give for the whole grant?' }], [], 'money')
      if (chip === 'unknown' || /don'?t know|not sure|no idea|^no\b/i.test(text)) {
        addRecruiterAsk(f, 'price')
        return askShares(state, [{ from: 'ribbit', text: ON_THE_LIST }])
      }
      const n = parseDecimal(text)
      if (n === null) return question(state, text, svc, "the last round's price per share")
      // "$4.40 a share" or a small number is a price per share; "$88,000" is the recruiter's figure for the grant.
      if (/share|each|\/\s*sh|per\b/i.test(text) || n < 1_000) f.pricePerShare = n
      else f.pricePerShare = grantValueToPrice(f, n, text)
      return priceTurn(state)
    }
    case 'S3_dollar': {
      const n = parseDecimal(text)
      if (n === null) return question(state, text, svc, 'the dollar value the recruiter gave for the grant')
      f.pricePerShare = grantValueToPrice(f, n, text)
      return priceTurn(state)
    }
    case 'S4': {
      if (chip === 'unknown' || /don'?t know|not sure|no idea|^no\b/i.test(text)) {
        addRecruiterAsk(f, 'shares')
        return startupMatch(state, [{ from: 'ribbit', text: ON_THE_LIST }])
      }
      let n = parseDecimal(text)
      // "20" after "shares outstanding" means 20 million: no company has fewer shares than one person's grant.
      if (n !== null && f.grantShares && n <= f.grantShares && n * 1e6 > f.grantShares && !/\d{4}/.test(text.replace(/,/g, ''))) n *= 1e6
      if (n === null || !f.grantShares || n <= f.grantShares) return question(state, text, svc, 'the total shares outstanding')
      f.sharesOutstanding = Math.round(n)
      const own = ownership(grantOf(f), f.sharesOutstanding)
      return say({ ...state, turn: 'S5' }, [
        {
          from: 'ribbit', figure: pct(own), figureLabel: 'Your share of the company', turn: 'S4',
          text: `Startups usually raise money again, and each round shrinks everyone's slice. After ${FUTURE_ROUNDS === 2 ? 'two' : FUTURE_ROUNDS} more rounds, plan on about ${pct(afterDilution(own))}.`,
        },
        { from: 'ribbit', text: 'Do you have another offer to compare it to?', turn: 'S5' },
      ], [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }], 'text', [win('S4')])
    }
    case 'S5': {
      if (chip === 'yes' || /^(y|yes|yeah|yep)\b/i.test(text)) {
        if (!f.salary) return say({ ...state, turn: 'S5_this' }, [{ from: 'ribbit', text: "What's the base pay on this offer?" }], [], 'money')
        return say({ ...state, turn: 'S5_other' }, [{ from: 'ribbit', text: "What's the other offer's base pay?" }], [], 'money')
      }
      if (chip === 'no' || /^(n|no|nope|nah)\b/i.test(text)) return exitScenarios(state)
      // "Yes, $150,000 at a public company": the pay is already there.
      const typed = readPay(text, 'salary')
      if (f.salary && typed && typed.kind !== 'unsure' && typed.annual >= 1_000) return breakEven(state, typed.annual)
      return question(state, text, svc, 'whether they have another offer to compare')
    }
    case 'S5_this': {
      const pay = readPay(text, 'salary')
      if (!pay || pay.kind === 'unsure' || pay.annual < 1_000) return question(state, text, svc, 'the base pay on this offer')
      takePay(f, pay)
      return say({ ...state, turn: 'S5_other' }, [{ from: 'ribbit', text: "And the other offer's base pay?" }], [], 'money')
    }
    case 'S5_other': {
      const pay = readPay(text, 'salary')
      if (!pay || pay.kind === 'unsure' || pay.annual < 1_000) return question(state, text, svc, "the other offer's base pay")
      return breakEven(state, pay.annual)
    }
  }
  return question(state, text, svc, '')
}

/** The recruiter's dollar figure as a price per share: for the whole grant, or a year of it ("$22k a year"). */
function grantValueToPrice(f: Facts, value: number, text: string): number {
  const whole = /year|yr|annual/i.test(text) ? value * (f.vestYears ?? DEFAULT_VEST_YEARS) : value
  return whole / (f.grantShares ?? 1)
}

/** S3's payoff: the recruiter's number next to what the grant gains if sold today, then the shares question. */
function priceTurn(state: ChatState, before: ChatMessage[] = []): Step {
  const f = state.facts
  const g = grantOf(f)
  const price = f.pricePerShare ?? 0
  const total = atLastRound(g, price)
  const noun = grantNoun(f)
  const count = (f.grantShares ?? 0).toLocaleString('en-US')
  let payoff: ChatMessage
  if (f.equityType === 'rsu') {
    payoff = {
      from: 'ribbit', figure: fc(total), figureLabel: "At the last round's price", turn: 'S3',
      text: `At the last round's ${share$(price)}, your ${count} RSUs come to ${fc(total)}. That's the investors' price. Startup RSUs usually pay out only when the company sells or goes public, so it's what they're worth if the company grows into that price and gets there.`,
    }
  } else if (f.strike === undefined) {
    payoff = {
      from: 'ribbit', figure: fc(total), figureLabel: "At the last round's price", turn: 'S3',
      text: `At the last round's ${share$(price)}, your ${count} ${noun} look like ${fc(total)}. That's the investors' price. A new grant's strike is usually today's value of the common stock, so selling today would gain you about nothing. The strike is on your list for the recruiter.`,
    }
  } else if (f.strike >= price) {
    payoff = {
      from: 'ribbit', figure: '$0', figureLabel: "Your gain at the last round's price", turn: 'S3',
      text: `Your ${share$(f.strike)} strike is at or above the last round's ${share$(price)}, so at that price your ${noun} gain you nothing yet. They're worth something only if the company grows past ${share$(f.strike)} a share.`,
    }
  } else {
    payoff = {
      from: 'ribbit', figure: 'About $0', figureLabel: `Your ${noun} if sold today`, turn: 'S3',
      text: `At the last round's ${share$(price)}, your ${count} ${noun} look like ${fc(total)}. That's the investors' price. Your ${share$(f.strike)} strike is today's value of the common stock, so selling today would gain you about nothing. The ${fc(total)} is what it's worth if the company grows into it.`,
      math: [
        { label: "At the last round's price", value: fc(total) },
        { label: 'Your strike price', value: share$(f.strike) },
        { label: `To buy all ${count} shares`, value: fc(costToBuy(g) ?? 0) },
      ],
    }
  }
  const check = sharesCheck(f)
  return askShares({ ...state, invited: state.invited || Boolean(check) }, [...before, payoff, ...(check ? [check] : [])],
    [win('S3'), ...(check ? [{ name: 'ribbit_spending_check_shown', props: { turn: 'S3' } }] : [])])
}

/**
 * The startup chat's app offer, right after the S3 payoff (Nov 7): before it, the only ask was the ending, which
 * anyone leaving at S4 or S5 never saw. The cost to buy is the stake the chat can name; the ask is a savings plan,
 * which is what the app builds (it has nothing for shares yet, so "afford my shares" would promise more). Only when
 * the cost is known (not RSUs, not an unknown strike), once per thread; the S4 question still follows.
 */
export const SHARES_SAVINGS_NOTE = 'Free in WeLeap. Built on your real paychecks and spending.'
function sharesCheck(f: Facts): ChatMessage | null {
  const cost = costToBuy(grantOf(f))
  if (!cost || f.spendingCheckShown) return null
  f.spendingCheckShown = true
  const perYear = cost / (f.vestYears ?? DEFAULT_VEST_YEARS)
  return {
    from: 'ribbit', turn: 'S3',
    text: `Buying them all costs ${fc(cost)}, about ${fc(perYear)} for each year that vests. Want a savings plan that makes room for it, built on what you actually earn and spend?`,
    appAsk: { label: 'Build my savings plan', why: 'shares_savings', note: SHARES_SAVINGS_NOTE },
  }
}

function askShares(state: ChatState, before: ChatMessage[], events: ChatEvent[] = []): Step {
  return say({ ...state, turn: 'S4' }, [...before, {
    from: 'ribbit', text: 'Do you know the total shares outstanding? It turns your grant into a share of the company.', turn: 'S4',
  }], [{ label: 'No', value: 'unknown' }], 'money', events)
}

/** S5 with another offer: what the company has to sell for before the grant makes up the lower pay. */
function breakEven(state: ChatState, otherSalary: number): Step {
  const f = state.facts
  f.compareSalary = otherSalary
  const g = grantOf(f)
  const gap = otherSalary - (f.salary ?? 0)
  const exit = breakEvenExit(g, f.sharesOutstanding ?? 0, gap)
  if (exit === null) {
    return startupMatch(state, [{
      from: 'ribbit', turn: 'S5',
      text: `This offer pays as much as the other one or more, so your ${grantNoun(f)} are on top, not making up for anything.`,
    }], [win('S5')])
  }
  const years = f.vestYears ?? DEFAULT_VEST_YEARS
  const cost = costToBuy(g)
  const last = f.pricePerShare && f.sharesOutstanding ? f.pricePerShare * f.sharesOutstanding : undefined
  const times = last ? ` about ${(Math.round((exit / last) * 10) / 10).toString()} times its last valuation,` : ''
  return startupMatch(state, [{
    from: 'ribbit', figure: `About ${companyValue(exit)}`, figureLabel: 'What the company has to sell for', turn: 'S5',
    text: `The other offer pays ${fc(gap)} a year more, ${fc(gap * years)} over ${years} years.${cost ? ` Buying your shares costs ${fc(cost)} more.` : ''} The company has to sell for about ${companyValue(exit)},${times} before your ${grantNoun(f)} make that up. That's before tax, and after ${FUTURE_ROUNDS === 2 ? 'two' : FUTURE_ROUNDS} more rounds of raising money.`,
    math: [
      { label: `Less pay over ${years} years`, value: fc(gap * years) },
      ...(cost ? [{ label: 'Cost to buy your shares', value: fc(cost) }] : []),
      ...(last ? [{ label: 'Last valuation', value: companyValue(last) }] : []),
    ],
  }], [win('S5')])
}

/** S5 without another offer: what the grant could pay at a few sale prices, after dilution and the cost to buy. */
function exitScenarios(state: ChatState): Step {
  const f = state.facts
  const g = grantOf(f)
  const last = f.pricePerShare && f.sharesOutstanding ? f.pricePerShare * f.sharesOutstanding : undefined
  const exits = last ? [last, last * 3, last * 10] : [100e6, 500e6, 1e9]
  return startupMatch(state, [{
    from: 'ribbit', turn: 'S5',
    text: `What your ${grantNoun(f)} could pay if the company sells${last ? ' at its last valuation and above' : ''}, after ${FUTURE_ROUNDS === 2 ? 'two' : FUTURE_ROUNDS} more rounds${hasStrike(g) && costToBuy(g) ? ' and the cost to buy them' : ''}, before tax. If it sells for less than investors put in, they can pay nothing.`,
    math: exits.map((v) => ({ label: `If it sells for ${companyValue(v)}`, value: `about ${fc(Math.round(payoutAt(g, f.sharesOutstanding ?? 0, v) / 1_000) * 1_000)}` })),
  }], [win('S5')])
}

/** S6 and the ending: what is certain about the grant whatever the sale price, then the plan card. */
function startupEnding(state: ChatState, lead: ChatMessage[], events: ChatEvent[] = []): Step {
  const f = state.facts
  const g = grantOf(f)
  const cliff = f.cliffMonths ?? DEFAULT_CLIFF_MONTHS
  const cost = costToBuy(g)
  const count = (f.grantShares ?? 0).toLocaleString('en-US')
  const rows: MathRow[] = [
    { label: 'Nothing vests until', value: cliff > 0 ? `month ${cliff}` : 'it starts vesting' },
    ...(f.equityType === 'rsu'
      ? [{ label: 'Tax', value: 'when they vest or pay out' }]
      : [
          { label: `To buy all ${count} shares`, value: cost !== undefined ? fc(cost) : `${count} × your strike` },
          { label: 'If you leave', value: 'usually 90 days to buy' },
        ]),
  ]
  const certain: ChatMessage = { from: 'ribbit', text: "The sale price is a guess. These aren't:", math: rows, turn: 'S6' }
  const questions = recruiterQuestions(f)
  const ask: ChatMessage[] = questions.length
    ? [{ from: 'ribbit', text: 'Questions to take back to the recruiter. Asking them is normal, and the answers fill in the gaps above.', questions, turn: 'S7' }]
    : []
  return planEnding(state, [...lead, certain, ...ask], [...events, ...(questions.length ? [{ name: 'ribbit_recruiter_questions_shown', props: { turn: 'S7', count: questions.length, keys: questions.map((q) => q.key).join(',') } }] : [])])
}

/**
 * Benefits, before the ending: the offer chat's 401k question (O4, with its benefits-guide upload and the same turn
 * names), whose answers come back to startupEnding in a startup thread. Skipped when the thread already has it.
 */
function startupMatch(state: ChatState, lead: ChatMessage[], events: ChatEvent[] = []): Step {
  if (state.facts.match) return startupEnding(state, lead, events)
  return withEvents(askMatch(state, lead), events)
}

/**
 * The questions to take back to the recruiter (Nov 7, from Vinod's own run: "I don't know it" just moved on).
 * Each unknown is put on the list when it comes up, and the ending lists them, with the exercise window always
 * for options, since "usually 90 days" is a guess too. Wording is the person's own, ready to send.
 */
export type RecruiterAsk = 'strike' | 'price' | 'shares' | 'window' | 'match'
export interface RecruiterQuestion { key: RecruiterAsk; title: string; detail: string }
const ON_THE_LIST = "No problem. I've put it on your list of questions for the recruiter."
const RECRUITER_QUESTIONS: Record<RecruiterAsk, Omit<RecruiterQuestion, 'key'>> = {
  strike: { title: "What's the strike price on my options?", detail: "It's what you pay for each share, and it sets what buying them all costs." },
  price: { title: 'What did investors pay per share in the last round?', detail: "It's what the recruiter's dollar figure is built on." },
  shares: { title: 'How many fully diluted shares are outstanding?', detail: 'It turns your grant into a share of the company.' },
  window: { title: 'If I leave, how long do I have to buy my vested options?', detail: 'Usually 90 days. Some companies give years.' },
  match: { title: 'Is there a 401k match, and when does it vest?', detail: 'A match is pay on top of the salary.' },
}
const RECRUITER_ORDER: RecruiterAsk[] = ['strike', 'price', 'shares', 'window', 'match']

function addRecruiterAsk(f: Facts, key: RecruiterAsk): void {
  if (!f.recruiterAsks?.includes(key)) f.recruiterAsks = [...(f.recruiterAsks ?? []), key]
}

export function recruiterQuestions(f: Facts): RecruiterQuestion[] {
  const keys = new Set(f.recruiterAsks ?? [])
  if (f.grantShares && f.equityType !== 'rsu') keys.add('window')
  return RECRUITER_ORDER.filter((k) => keys.has(k)).map((key) => ({ key, ...RECRUITER_QUESTIONS[key] }))
}

function startupCard(f: Facts): NonNullable<ChatMessage['planCard']> {
  const g = grantOf(f)
  const cost = costToBuy(g)
  const exit = f.sharesOutstanding && f.compareSalary ? breakEvenExit(g, f.sharesOutstanding, f.compareSalary - (f.salary ?? 0)) : null
  return {
    known: [
      ...(f.salary ? [{ label: 'Base pay', value: `${fc(f.salary)}/yr` }] : []),
      ...(f.match === 'known' && f.value ? [{ label: 'Pay and match', value: `${fc(f.value.totalPackage)}/yr` }] : []),
      ...(f.grantShares ? [{ label: 'Grant', value: `${grantLine(f)}${f.strike ? ` at ${share$(f.strike)}` : ''}` }] : []),
      ...(f.grantShares && f.sharesOutstanding ? [{ label: 'Share of the company', value: pct(ownership(g, f.sharesOutstanding)) }] : []),
      ...(cost ? [{ label: 'To buy all the shares', value: fc(cost) }] : []),
      ...(exit ? [{ label: 'Sale price to break even', value: companyValue(exit) }] : []),
    ],
    locked: ['Your first paycheck, checked against this', 'Saving toward buying your shares', 'Is this month on pace?'],
  }
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
  const turn = flow === 'offer' ? 'O8' : flow === 'startup' ? 'S8' : 'R8'
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
  const turn = flow === 'offer' ? 'O8' : flow === 'money' ? 'M8' : flow === 'startup' ? 'S8' : 'R8'
  const card = flow === 'offer' ? offerCard(state.facts) : flow === 'money' ? moneyCard(state.facts) : flow === 'startup' ? startupCard(state.facts) : rentCard(state.facts)
  return say({ ...state, turn, invited: true }, [...lead, {
    from: 'ribbit', text: PLAN_PREVIEW_TEXT, turn, planCard: card,
    // Text threads exist for rent and offers; a startup offer goes as an offer thread carrying its equity figures
    // (lib/ribbit/payload.ts), so it needs the pay. Money has no "text me instead".
    appAsk: { label: 'Save my plan and unlock the rest', why: 'plan_preview', note: `No forms: the rows above come with you. Connecting your bank takes about 2 minutes.`, textInstead: flow === 'rent' || flow === 'offer' || (flow === 'startup' && Boolean(state.facts.salary && state.facts.takeHomeMonthly)) },
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
    ...(f.compareTakeHome ? [{ label: 'The other offer, take-home', value: `${fc(f.compareTakeHome)}/mo` }] : []),
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
  if (state.turn === 'R3_scored' && f.score) {
    const chips = (state.ui?.chips ?? []).filter((c) => c.value !== '__math__')
    return { state, messages: [{ from: 'ribbit', text: "How the score is worked out, by WeLeap's own rule of thumb:", math: scoreMath(f) }], chips, input: state.ui?.input ?? 'money', events: [{ name: 'ribbit_math_opened', props: { turn: state.turn } }] }
  }
  const rows: MathRow[] = []
  if (f.salary) rows.push({ label: f.payBasis === 'hourly' && f.hourlyRate ? `${payLine(f)}, 52 weeks` : 'Salary', value: fc(f.salary) })
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
    // Ribbit read the words as the answer: apply it, once (a second miss does not go back to Ribbit). A second miss
    // says it didn't catch them: it used to say Ribbit was down (Nov 10-12: "4600" at the city question and "DC" at
    // Washington's areas, read as answers that still did not fit).
    return route(state, { text: res.value }, { ...svc, ask: async () => ({ kind: 'question', reply: NOT_CAUGHT_TEXT }) })
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
