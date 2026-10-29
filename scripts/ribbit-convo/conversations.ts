/**
 * Whole conversations the chat must handle: every real thread that went wrong, the main things people come for,
 * and the awkward paths (typing instead of tapping, numbers given early, a bare "yes"). Add one for every new bad
 * thread. A persona answers whatever the chat asks; `says` is what the person types or taps on top, in order (at a
 * turn, or as soon as possible), with what must follow it.
 */
import type { Expect } from './checks'

export interface Persona {
  salary: number
  takeHome?: number
  city: string
  state: string
  rent: number
  roommate?: boolean
  debt?: { kind: string; balance: number; aprPct: number; payment: number }
  /** 'none', 'unknown', or the formula as typed ("50% up to 6%"). */
  match: string
  /** Taps the options when there are some (default), or types everything. */
  style?: 'taps' | 'types'
}

export interface Conversation {
  id: string
  /** The tool the page opened on; absent = the picker ("What are we working out?"). */
  flow?: 'rent' | 'offer' | 'money'
  persona: Persona
  says: Array<{ text?: string; chip?: string; at?: string; expect?: Expect }>
  /** The flow must reach its end (the order, the rent plan, the offer). */
  mustFinish?: boolean
  /** Checked on the last turn. */
  end?: Expect
  /** Each must match something Ribbit said at some point in the conversation. */
  ever?: RegExp[]
  note?: string
}

const MAYA: Persona = { salary: 85000, city: 'Austin', state: 'TX', rent: 1600, match: 'unknown' }
const SF: Persona = { salary: 265000, city: 'San Francisco', state: 'CA', rent: 7500, match: 'unknown' }
const CHI_TYPES: Persona = { salary: 80000, city: 'Chicago', state: 'IL', rent: 1500, match: '50% up to 6%', style: 'types', debt: { kind: 'credit card', balance: 4000, aprPct: 24, payment: 150 } }
const BOSTON_GRAD: Persona = { salary: 63000, city: 'Boston', state: 'MA', rent: 1350, roommate: true, match: 'none' }
const SEATTLE: Persona = { salary: 120000, city: 'Seattle', state: 'WA', rent: 2400, match: '100% up to 4%' }

// The money offer itself ("Yes, work it out | Not now"): the picker's "Where should my money go?" is also 'money'.
const OFFER = ['money', 'not_now']
const LOAN_465 = /\$?46[56]\b/
const BACK = /Back to your question/
// The rent answer's invite (decided Oct 29): every rent conversation must show it.
const RENT_INVITE = /Save this range as your plan in WeLeap/

export const CONVERSATIONS: Conversation[] = [
  // ── Real threads ──────────────────────────────────────────────────────────────────────────────────────────
  {
    id: 'oct28-car-afford-then-numbers', persona: MAYA, mustFinish: true,
    note: 'Oct 28: a correct $465 answer, then the picker and nothing to check it against their pay.',
    says: [
      { text: 'I want to see if I can afford to buy a car', expect: { chips: OFFER } },
      { text: '20K, 14% APR, 5 years', expect: { says: [LOAN_465], chips: OFFER } },
      { chip: 'money' },
    ],
    end: { says: [BACK, LOAN_465] },
  },
  {
    id: 'oct28-car-payment-loop', persona: MAYA,
    note: 'Oct 28: "20K" never ran the loan tool; "say YES", "using words only", "I ran the loan calc".',
    says: [
      { text: 'I want to see if I can afford to buy a car' },
      { text: 'actually I want to know how much payment I can afford' },
      { text: '20K, 14% APR, 5 years', expect: { says: [LOAN_465] } },
      // With "Yes, work it out" on screen, a typed yes takes it (sent to the reader, it failed 2 runs in 3).
      { text: 'yes', expect: { turn: 'M1' } },
    ],
  },
  {
    id: 'offer-typed-no', persona: MAYA,
    says: [{ text: 'can I afford a car?', expect: { chips: OFFER } }, { text: 'no thanks' }, { text: '20K, 14% APR, 5 years', expect: { says: [LOAN_465] } }],
  },
  {
    id: 'oct27-car-good-time', persona: SF, mustFinish: true,
    note: 'Oct 27: the money flow never came back to the car; then "Not yet" for someone who may have savings.',
    says: [{ text: 'I want to buy a car, is now a good time?', expect: { chips: OFFER } }, { chip: 'money' }],
    end: { says: [/Back to your question\. If you've already got/] },
  },
  // ── Planning questions at the picker: answered, then offered the order with their numbers ──────────────────
  {
    id: 'wedding-typed-all-the-way', persona: CHI_TYPES, mustFinish: true,
    says: [{ text: 'Can I afford a $30k wedding next year?', expect: { chips: OFFER } }, { chip: 'money' }],
    end: { says: [BACK] },
  },
  { id: 'house-down-payment', persona: MAYA, says: [{ text: 'Should I start saving for a house down payment?', expect: { chips: OFFER } }] },
  { id: 'saving-1000', persona: MAYA, says: [{ text: 'I am saving $1000 a month, what should I do with it', expect: { chips: OFFER } }] },
  { id: 'card-or-invest', persona: MAYA, says: [{ text: 'Should I pay off my credit card or invest?', expect: { chips: OFFER } }] },
  { id: 'car-payment-afford', persona: MAYA, says: [{ text: 'how much car payment can I afford?', expect: { chips: OFFER } }] },
  // ── Calculations at the picker ────────────────────────────────────────────────────────────────────────────
  { id: 'card-payoff', persona: MAYA, says: [{ text: 'I owe 8000 on a credit card at 24% and pay 300 a month. How long until it is paid off?', expect: { says: [/3[89] months|3\.2 years/] } }] },
  { id: 'car-loan-payment', persona: MAYA, says: [{ text: 'what would my payment be on a 25000 car loan at 7% for 5 years?', expect: { says: [/\$?495/] } }] },
  // ── General and account questions, and a bare "yes" ───────────────────────────────────────────────────────
  { id: 'roth-general', persona: MAYA, says: [{ text: 'what is a Roth IRA?' }] },
  { id: 'account-savings', persona: MAYA, says: [{ text: 'how much do I have in savings?' }] },
  { id: 'bare-yes', persona: MAYA, says: [{ text: 'yes' }] },
  // ── The three flows, start to finish ──────────────────────────────────────────────────────────────────────
  { id: 'rent-taps', flow: 'rent', persona: BOSTON_GRAD, mustFinish: true, says: [], ever: [RENT_INVITE] },
  { id: 'rent-types-with-side-question', flow: 'rent', persona: { ...BOSTON_GRAD, style: 'types' }, mustFinish: true, says: [{ at: 'R4', text: 'is 1500 too much for Boston?' }], ever: [RENT_INVITE] },
  { id: 'rent-austin-in-reach', flow: 'rent', persona: { ...MAYA, salary: 120000 }, mustFinish: true, says: [], ever: [RENT_INVITE], note: 'rentals inside the range: the invite rides on the debt question' },
  { id: 'rent-planning-question-after-invite', flow: 'rent', persona: BOSTON_GRAD, mustFinish: true, ever: [RENT_INVITE],
    says: [{ at: 'R3_debt', text: 'should I pay off my card or invest?', expect: { never: [/Click to get WeLeap|Get WeLeap/i] } }] },
  { id: 'offer-taps', flow: 'offer', persona: SEATTLE, mustFinish: true, says: [] },
  { id: 'money-with-card-debt', flow: 'money', persona: CHI_TYPES, mustFinish: true, says: [], end: { says: [/24%|card/i] } },
  { id: 'money-side-question', flow: 'money', persona: MAYA, mustFinish: true, says: [{ at: 'M3', text: 'what counts as rent if I live with my parents?' }] },
  // ── Typed cities (Oct 29: only the six presets and state names were read; 7 of 14 paid rent chats stuck) ──
  { id: 'rent-typed-dallas', flow: 'rent', persona: { ...MAYA, city: 'Dallas', state: 'TX', style: 'types' }, mustFinish: true, says: [], ever: [/Texas has no state income tax, so your range stays the same/, /Rentals in Dallas run/, RENT_INVITE] },
  { id: 'rent-typed-city-state', flow: 'rent', persona: { ...MAYA, city: 'Denver, CO', state: 'CO' }, mustFinish: true, says: [], ever: [/In Denver, take-home/] },
  { id: 'offer-typed-charlotte-nc', flow: 'offer', persona: { ...SEATTLE, city: 'Charlotte NC', state: 'NC' }, mustFinish: true, says: [], ever: [/Charlotte/] },
  { id: 'rent-portland-which-one', flow: 'rent', persona: { ...MAYA, city: 'Portland', state: 'OR' }, mustFinish: true, says: [], ever: [/Which one\?/, /In Portland, take-home/] },
  { id: 'money-typed-phoenix', flow: 'money', persona: { ...MAYA, city: 'Phoenix', state: 'AZ', style: 'types' }, mustFinish: true, says: [] },
  // ── Towns the rent data has no metro for (Oct 29: a paid visitor from Ashburn, VA typed at "Which area?" 8 times) ──
  { id: 'rent-town-ashburn', flow: 'rent', persona: { ...MAYA, city: 'Ashburn', state: 'VA', style: 'types' }, mustFinish: true, says: [],
    ever: [/Which state is Ashburn in\?/, /I don't have rent prices for Ashburn/, RENT_INVITE] },
  { id: 'rent-town-two-misses', flow: 'rent', persona: { ...MAYA, city: 'La Vernia', state: 'TX', style: 'types' }, mustFinish: true,
    says: [{ at: 'R2_metro', text: 'Floresville' }, { at: 'R2_metro', text: 'Poth' }],
    ever: [/Pick or type the closest area/, /I don't have rental prices for Poth, so your range stands on its own/] },
  { id: 'rent-town-range-on-its-own', flow: 'rent', persona: { ...MAYA, city: 'Willmar MN', state: 'MN' }, mustFinish: true,
    says: [{ at: 'R2_metro', chip: '__OTHER__' }], ever: [/I don't have rental prices for Willmar/] },
  // ── Typed picks ───────────────────────────────────────────────────────────────────────────────────────────
  { id: 'typed-where-money', persona: MAYA, mustFinish: true, says: [{ text: 'where should my money go?' }] },
  { id: 'typed-rent', persona: BOSTON_GRAD, mustFinish: true, says: [{ text: 'how much rent can I afford' }], ever: [RENT_INVITE] },
]
