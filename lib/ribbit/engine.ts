/**
 * The Ribbit chat: the rent and offer tools as a conversation (spec: "Ribbit Chat Tool — Rent and Offer Flows").
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
import { matchPresetCity, matchState, parseMatch, parseMoney, parseTwoNumbers, salaryOrTakeHome } from './parse'

const metroMapping = defaultMetroMappingData as Record<string, { regionName: string; stateName: string }>

export type Flow = 'rent' | 'offer'
export interface Chip { label: string; value: string }
export interface MathRow { label: string; value: string; strong?: boolean }
export interface ChatMessage {
  from: 'ribbit' | 'you'
  text: string
  /** The win's key figure, set large in the bubble. */
  figure?: string
  /** "Show me the math": the breakdown, rendered as rows under the text. */
  math?: MathRow[]
  /** The turn that produced it, for analytics and the handoff. */
  turn?: string
  /** Render the text door (the approved consent and button) under this message. */
  handoff?: Flow
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
}

export interface ChatState {
  flow: Flow | null
  turn: string
  facts: Facts
  /** The recent thread, newest last, for the assistant's context. */
  history: { from: 'in' | 'out'; text: string }[]
  /** The open question and its options, so an answer to a side question can return to it unchanged. */
  ui?: { chips: Chip[]; input: Step['input']; ask?: string }
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
}

/** The tool pages' own routes, and Ribbit for typed questions. Injected so the engine is testable. */
export interface ChatServices {
  tax(salaryAnnual: number, stateCode: string): Promise<(TaxResult & { taxSource?: string }) | null>
  metros(stateCode: string): Promise<{ label: string; value: string }[]>
  medianRent(stateName: string, regionName: string): Promise<number | null>
  /**
   * Ribbit, for a typed message that is not an answer the chat could read: a reply to show, or the answer to the
   * open question it found in the words ("about five grand a month" → "5000"), which the chat then applies.
   */
  ask(input: { flow: Flow; facts: Facts; message: string; step: string; history: ChatState['history'] }): Promise<AskResult | null>
}

export interface AskResult { kind: 'question' | 'step' | 'account'; reply?: string; value?: string }

export const fc = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`
const mid50 = (a: number, b: number) => Math.round((a + b) / 2 / 50) * 50
const SOMEWHERE_ELSE = '__elsewhere__'
const OUTSIDE_METRO = '__OTHER__'
const STATE_NAME = (code?: string) => US_STATES_NAMED.find((s) => s.code === code)?.name ?? code ?? ''

function cityChips(): Chip[] {
  return [...getAvailableCities().map((c) => ({ label: c, value: c })), { label: 'Somewhere else', value: SOMEWHERE_ELSE }]
}

// ── Starting ──────────────────────────────────────────────────────────────────────────────────────────────

export function start(flow: Flow | null): Step {
  const state: ChatState = { flow, turn: flow === 'rent' ? 'R1' : flow === 'offer' ? 'O1' : 'P0', facts: {}, history: [] }
  if (!flow) {
    return say(state, [{ from: 'ribbit', text: 'What are we working out?', turn: 'P0' }],
      [{ label: 'Rent', value: 'rent' }, { label: 'A job offer', value: 'offer' }], 'text')
  }
  return flow === 'rent' ? askSalary(state) : askOfferSalary(state)
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
      const pick = chip ?? (/offer|job/i.test(text) ? 'offer' : /rent/i.test(text) ? 'rent' : '')
      if (pick === 'rent') return askSalary({ ...state, flow: 'rent', turn: 'R1' })
      if (pick === 'offer') return askOfferSalary({ ...state, flow: 'offer', turn: 'O1' })
      return question(state, text, svc, 'which tool to use: rent or a job offer')
    }

    // ── Rent ──────────────────────────────────────────────────────────────────────────────────────────────
    case 'R1':
    case 'R1_amount': {
      if (chip === 'salary' || chip === 'take_home') {
        return say({ ...state, turn: 'R1_amount', facts: { ...f, takeHomeFrom: chip === 'salary' ? 'salary' : 'typed' } },
          [{ from: 'ribbit', text: chip === 'salary' ? 'What does it pay a year?' : 'How much lands each month?' }], [], 'money')
      }
      const n = parseMoney(text)
      if (!n) return question(state, text, svc, 'their salary or monthly take-home')
      const kind = state.turn === 'R1_amount' ? (f.takeHomeFrom === 'typed' ? 'take_home' : 'salary') : salaryOrTakeHome(n)
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
      f.range = calculateRentRange(f.takeHomeMonthly, 0)
      const basis = f.takeHomeFrom === 'salary'
        ? `On ${fc(n)} a year, take-home before state tax is about ${fc(f.takeHomeMonthly)} a month.`
        : `On ${fc(n)} a month take-home,`
      const line = f.takeHomeFrom === 'salary' ? `${basis} Rent that fits is ${f.range.formatted}.` : `${basis} rent that fits is ${f.range.formatted}.`
      return say({ ...state, turn: 'R2' }, [
        { from: 'ribbit', text: line, figure: `${f.range.formatted}/mo`, turn: 'R2' },
        { from: 'ribbit', text: 'Which city?' },
      ], [...cityChips(), { label: 'Show me the math', value: '__math__' }], 'location', [win('R2')])
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
      return say({ ...state, turn: 'R5' }, [
        { from: 'ribbit', text: lead, figure: saving > 0 ? `${fc(saving)}/mo freed up` : undefined, turn: 'R5' },
        { from: 'ribbit', text: 'When does the job start?' },
      ], [
        { label: 'Already working', value: 'working' }, { label: 'This month', value: 'this_month' },
        { label: 'Next month', value: 'next_month' }, { label: 'Pick a date', value: 'date' },
      ], 'text', [win('R5')])
    }
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
      const v = chip ?? (/cushion|buffer|savings?/i.test(text) ? 'cushion' : /card|debt/i.test(text) ? 'card' : /future|invest|retire/i.test(text) ? 'future' : '')
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
    case 'R7':
    case 'O6': {
      const v = chip ?? (/each|text/i.test(text) ? 'text' : /watch/i.test(text) ? 'watch' : /grow/i.test(text) ? 'grow' : /rent/i.test(text) ? 'rent' : '')
      if (v === 'grow') { f.purpose = 'future'; return purposeTurn(state) }
      if (v === 'rent' && state.turn === 'O6') return offerRent(state)
      if (v === 'watch') {
        return handoff(state, "Watching it for you needs your bank connected, and that part isn't ready here yet. For now, I can do it by text.")
      }
      if (v === 'text') return handoff(state)
      return question(state, text, svc, 'how they want the follow-through: a text for each step, or watching it for them')
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
        { from: 'ribbit', text: `On ${fc(n)}, take-home before state tax and any 401k is about ${fc(f.takeHomeMonthly)} a month.`, figure: `${fc(f.takeHomeMonthly)}/mo`, turn: 'O2' },
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
      if (chip === 'later' || /later|no/i.test(text)) return handoff(state)
      return question(state, text, svc, 'whether to work out rent now')
    }
    case 'R8':
    case 'O8':
    case 'done':
      return question(state, text, svc, '')
  }
  return question(state, text, svc, '')
}

// ── Take-home ───────────────────────────────────────────────────────────────────────────────────────────────

/** Federal income tax and FICA only: the first answer, before anybody has said where. Labelled as such. */
function beforeStateTakeHome(salary: number): number {
  return Math.round((salary - federalTax(taxableIncome(salary, 0)) - ficaTax(salary)) / 12)
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

async function chooseLocation(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pfx = state.flow === 'offer' ? 'O2' : 'R2'
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
  const st = matchState(text)
  if (st) return chooseState({ ...state, turn: `${pfx}_state` }, undefined, st.code, svc)
  return question(state, text, svc, 'which city the job or the rent is in')
}

async function chooseState(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const pfx = state.flow === 'offer' ? 'O2' : 'R2'
  const st = matchState(chip ?? text)
  if (!st) return question(state, text, svc, 'which US state')
  f.stateCode = st.code
  f.presetCity = undefined
  const options = await svc.metros(st.code)
  f.metroOptions = options
  if (!options.length) {
    f.outsideMetro = true
    f.region = undefined
    f.place = st.name
    return afterLocation(state, svc)
  }
  return say({ ...state, turn: `${pfx}_metro` }, [{ from: 'ribbit', text: `Which area of ${st.name}?` }], [
    ...options.slice(0, 8).map((o) => ({ label: o.label, value: o.value })),
    { label: 'Outside a metro', value: OUTSIDE_METRO },
  ], 'location')
}

async function chooseMetro(state: ChatState, chip: string | undefined, text: string, svc: ChatServices): Promise<Step> {
  const f = state.facts
  const options = f.metroOptions ?? []
  if (chip === OUTSIDE_METRO || /outside|rural|none/i.test(text)) {
    f.outsideMetro = true
    f.region = undefined
    f.place = STATE_NAME(f.stateCode)
    return afterLocation(state, svc)
  }
  const t = (chip ?? text).toLowerCase()
  const hit = options.find((o) => o.value.toLowerCase() === t) ?? options.find((o) => o.label.toLowerCase().includes(t) && t.length >= 3)
  if (!hit) return question(state, text, svc, `which area of ${STATE_NAME(f.stateCode)}`)
  f.region = { stateName: f.stateCode ?? '', regionName: hit.value }
  f.outsideMetro = false
  f.place = hit.label.split(',')[0]
  return afterLocation(state, svc)
}

async function afterLocation(state: ChatState, svc: ChatServices): Promise<Step> {
  await locate(state, svc)
  if (state.flow === 'offer') return offerAfterLocation(state)
  state.facts.range = calculateRentRange(state.facts.takeHomeMonthly ?? 0, state.facts.debtMonthly ?? 0)
  return marketTurn(state, svc)
}

// ── Rent turns ──────────────────────────────────────────────────────────────────────────────────────────────

function askSalary(state: ChatState): Step {
  return say({ ...state, turn: 'R1' }, [
    { from: 'ribbit', text: "Let's work out what rent fits. What's the salary, or take-home per month? Either works.", turn: 'R1' },
  ], [{ label: 'Salary', value: 'salary' }, { label: 'Take-home', value: 'take_home' }], 'money')
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
  const taxLine = f.takeHomeFrom === 'salary' && f.tax ? `${placeTaxLine(f)} Rent that fits is ${range.formatted}.` : ''
  if (!market) {
    const none = f.outsideMetro ? `I don't have rental prices outside a metro, so your range stands on its own.` : `I don't have rental prices for ${f.place}, so your range stands on its own.`
    return askDebt(state, [taxLine, none].filter(Boolean).join(' '), taxLine ? 'R3' : undefined)
  }
  const verdict = marketRentVerdict(range.high, market.low, market.high)
  const band = `Rentals in ${f.place} run ${fc(market.low)} to ${fc(market.high)}`
  if (verdict === 'in_reach') {
    return askDebt(state, [taxLine, `${band}, inside your range.`].filter(Boolean).join(' '), 'R3')
  }
  const where = verdict === 'out_of_reach' ? 'above your range' : 'and only the low end fits your range'
  // Sallie Mae survey reported by Realtor.com (Jul 21, 2025): in the first two years after school, 8% rent solo
  // and 8% rent with roommates — about half of recent grads who rent.
  return say({ ...state, turn: 'R3_roommate' }, [
    { from: 'ribbit', text: [taxLine, `${band}, ${where}. Among recent grads who rent, about half share with roommates.`].filter(Boolean).join(' '), figure: `${fc(market.low)} to ${fc(market.high)}`, turn: 'R3' },
    { from: 'ribbit', text: 'Roommate?' },
  ], [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }, { label: 'Not sure yet', value: 'not_sure' }], 'text', [win('R3')])
}

function askDebt(state: ChatState, lead: string, winTurn?: string): Step {
  return say({ ...state, turn: 'R3_debt' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, turn: winTurn }] : []),
    { from: 'ribbit', text: 'Any monthly debt payments, like a car, student loans or card minimums? They come off the range.' },
  ], [{ label: 'None', value: 'none' }, { label: 'Yes', value: 'yes' }], 'money', winTurn ? [win(winTurn)] : [])
}

function applyDebt(state: ChatState, debt: number): Step {
  const f = state.facts
  f.debtMonthly = debt
  f.range = calculateRentRange(f.takeHomeMonthly ?? 0, debt)
  return askPick(state, debt > 0 ? `With ${fc(debt)} a month in debt payments, rent that fits is ${f.range.formatted}.` : '')
}

function askPick(state: ChatState, lead: string): Step {
  const r = state.facts.range!
  return say({ ...state, turn: 'R4' }, [
    ...(lead ? [{ from: 'ribbit' as const, text: lead, figure: state.facts.debtMonthly ? `${r.formatted}/mo` : undefined }] : []),
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
    { from: 'ribbit', text: lead, figure: `${fc(up.low)} to ${fc(up.high)}`, turn: 'R6' },
    { from: 'ribbit', text: `What's the ${fc(saving)} for?` },
  ], [
    { label: 'A cushion before the first paycheck', value: 'cushion' }, { label: 'The credit card', value: 'card' },
    { label: 'Future me', value: 'future' }, { label: 'Where does that upfront number come from', value: 'upfront_math' },
  ], 'text', [win('R6')])
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
  }], [
    { label: 'A cushion before the first paycheck', value: 'cushion' }, { label: 'The credit card', value: 'card' }, { label: 'Future me', value: 'future' },
  ], 'text')
}

function purposeTurn(state: ChatState): Step {
  const f = state.facts
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const perCheck = Math.round(saving / 2)
  const followThrough: Chip[] = [{ label: 'Text me each one', value: 'text' }, { label: 'Watch it for me', value: 'watch' }]
  if (f.purpose === 'card') {
    return say({ ...state, turn: 'R7_card' }, [{ from: 'ribbit', text: `Card first. Reply with the balance and the rate and I'll tell you how many months ${fc(saving)} a month takes to clear it.`, turn: 'R7' }], [], 'text')
  }
  if (f.purpose === 'future') {
    const value = Math.round(computeInvestingImpact(saving, REAL_RETURN_DEFAULT, 30))
    return say({ ...state, turn: 'R7' }, [{
      from: 'ribbit',
      text: `${fc(saving)} a month for 30 years at ${Math.round(REAL_RETURN_DEFAULT * 100)}% a year after inflation is about ${fc(value)}. Illustration only, not a guarantee. The first step is the same: auto-transfer ${fc(perCheck)} the day after each paycheck.`,
      figure: fc(value), turn: 'R7',
    }], followThrough, 'text', [win('R7')])
  }
  const target = f.upfront?.high ?? 0
  const takeHome = fc(f.takeHomeMonthly ?? 0)
  return say({ ...state, turn: 'R7' }, [{
    from: 'ribbit',
    text: `Cushion it is. Move ${fc(perCheck)} the day after each paycheck until you hit ${fc(target)}. That's if ${takeHome} actually lands; I can't see whether it does. So that's ${fc(perCheck)} after each paycheck and a check on the 1st. I can text you each one, or I can watch and only text you when something's off.`,
    figure: `${fc(perCheck)} each paycheck`, turn: 'R7',
  }], [...followThrough, { label: 'What would it grow to', value: 'grow' }], 'text', [win('R7')])
}

/** Months to clear a balance paying a fixed amount at a card's APR. Infinity when the payment never covers the interest. */
export function monthsToClear(balance: number, aprPct: number, payment: number): number {
  const r = aprPct / 100 / 12
  if (payment <= 0) return Infinity
  if (r === 0) return Math.ceil(balance / payment)
  if (payment <= balance * r) return Infinity
  return Math.ceil(-Math.log(1 - (r * balance) / payment) / Math.log(1 + r))
}

function cardPayoff(state: ChatState, balance: number, apr: number): Step {
  const f = state.facts
  const saving = Math.max(0, (f.range?.high ?? 0) - (f.pick ?? 0))
  const months = monthsToClear(balance, apr, saving)
  const text = Number.isFinite(months)
    ? `Putting ${fc(saving)} a month on ${fc(balance)} at ${apr}% clears it in about ${months} months. That's if the balance doesn't grow; the math is only as good as the balance you gave me.`
    : `At ${apr}%, ${fc(saving)} a month doesn't cover the interest on ${fc(balance)}, so the balance won't go down on that alone. The card's minimum has to stay on top of it.`
  return say({ ...state, turn: 'R7' }, [{ from: 'ribbit', text, figure: Number.isFinite(months) ? `${months} months` : undefined, turn: 'R7' }],
    [{ label: 'Text me each one', value: 'text' }, { label: 'Watch it for me', value: 'watch' }], 'text', [win('R7')])
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
    { from: 'ribbit', text: f.tax ? `${line} That's before any 401k.` : line, figure: `${fc(f.takeHomeMonthly ?? 0)}/mo`, turn: 'O3' },
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
  return say({ ...state, turn: 'O5' }, [{ from: 'ribbit', text, figure: `${fc(f.value?.totalPackage ?? salary)}/yr`, turn: 'O5' }],
    [{ label: 'What should I put in', value: 'put_in' }, { label: 'Skip', value: 'skip' }], 'text', [win('O5')])
}

function offerElection(state: ChatState): Step {
  const f = state.facts
  const salary = f.salary ?? 0
  const cap = f.matchUpToPct ?? 0
  const rate = f.matchRatePct ?? 0
  const contribution = (salary * cap) / 100 / 12
  const match = contribution * (rate / 100)
  // After-tax cost: the contribution escapes federal income tax at the person's own marginal rate and state tax at
  // their state's effective rate, as the first-paycheck tool prices it.
  const stateRate = f.tax && salary ? f.tax.stateTaxAnnual / salary : 0
  const cost = contribution * (1 - marginalFederalRate(taxableIncome(salary, (salary * cap) / 100)) - stateRate)
  return say({ ...state, turn: 'O6' }, [{
    from: 'ribbit',
    text: `Put in ${cap}%. It costs you about ${fc(cost)} a month of take-home and adds ${fc(contribution + match)} a month to your retirement account with the match. That's the ${cap}% form with HR on day one, then a look at the first stub to confirm it took. I can text you each one, or I can watch and only text you when something's off.`,
    figure: `${cap}%`, turn: 'O6',
  }], [{ label: 'Text me each one', value: 'text' }, { label: 'Watch it for me', value: 'watch' }, { label: "What's a good rent on this", value: 'rent' }], 'text', [win('O6')])
}

function offerRentMessages(f: Facts): ChatMessage[] {
  const r = calculateRentRange(f.takeHomeMonthly ?? 0, 0)
  return [{ from: 'ribbit', text: `Rent? You'd be looking at ${r.formatted} a month${f.place ? ` in ${f.place}` : ''}. Want to work that out properly?`, turn: 'O7' }]
}

function offerRent(state: ChatState, lead?: string): Step {
  return say({ ...state, turn: 'O7' }, [...(lead ? [{ from: 'ribbit' as const, text: lead }] : []), ...offerRentMessages(state.facts)],
    [{ label: 'Yes', value: 'yes' }, { label: 'Later', value: 'later' }], 'text')
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
  const msg = res?.reply ?? "I can't answer that right now."
  // Before a tool is picked there is no plan to go back to: the two choices stay up as they are.
  const parked = waitingFor && state.turn !== 'P0' ? state.ui?.ask ?? '' : undefined
  return { state: { ...state, history: [...state.history, { from: 'out' as const, text: msg }].slice(-12) }, messages: [{ from: 'ribbit', text: msg }], chips, input, events, parked }
}
