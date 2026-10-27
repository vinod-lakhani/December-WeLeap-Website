/**
 * The Ribbit reader's test set: what the chat (/ribbit_chat) and the text threads send it, and what a good reading
 * is. One reader serves both doors (backend users /internal/rentpilot/ask -> ai /internal/rentpilot/turn), so one
 * set covers both. Run before every change to the reader's rules: scripts/ribbit-eval/run.ts.
 *
 * Each case says the kind it must come back as and, for a reply, what it must and must not say. Every reply is
 * also held to the rules in run.ts (no "install", no em dash, the length limit, never a canned fallback).
 */

export type Kind = 'question' | 'account' | 'step'

export interface Case {
  id: string
  /** What the case covers; the report groups by it. */
  area: 'general' | 'calculation' | 'account' | 'figures' | 'step' | 'offer' | 'off-topic' | 'grad'
  tool?: 'rent' | 'offer'
  /** The person's figures: a rent result or an offer, as the chat sends them. Absent = before any tool. */
  figures?: 'rent' | 'offer'
  step?: string
  history?: { role: 'user' | 'assistant'; text: string }[]
  message: string
  expect: {
    kind: Kind | Kind[]
    value?: string
    plan?: boolean
    /** Every pattern must match the reply. */
    says?: RegExp[]
    /** No pattern may match the reply. */
    never?: RegExp[]
  }
  /** Why the case exists, when it is not obvious (a past miss). */
  note?: string
}

/** A Massachusetts rent result on $63,000: the plan from the Oct 26 tests. */
export const RENT_RESULT = {
  id: 'eval-rent',
  rentLow: 1175,
  rentHigh: 1475,
  takeHomeMonthly: 4205,
  upfrontLow: 4100,
  upfrontHigh: 4900,
  marketLow: 2100,
  marketHigh: 2450,
  grossAnnual: 63000,
  federalTaxAnnual: 5380,
  stateTaxAnnual: 2345,
  ficaTaxAnnual: 4820,
  totalTaxAnnual: 12545,
  takeHomeAnnual: 50460,
  location: 'Boston',
  budgetNeeds: 2102,
  budgetWants: 1262,
  budgetSavings: 841,
  figures: { source: 'ribbit_chat', stateName: 'Massachusetts', presetCity: 'Boston', pickedRent: 1350, roommateShare: 1225 },
}

export const OFFER_RESULT = {
  id: 'eval-offer',
  location: 'Seattle, WA',
  salary: 85000,
  matchRatePct: 100,
  matchUpToPct: 4,
  takeHomeMonthly: 5719,
  effectiveTaxRate: 0.19,
  annual401kMatch: 3400,
  totalPackage: 88400,
  firstYearTotal: 88400,
  federalTaxAnnual: 9900,
  ficaTaxAnnual: 6500,
  netIncomeAnnual: 68600,
}

const NOT_PUNTED = [/needs your (own )?account/i, /in the app/i, /only see what you've told me/i]
/** Every reply: "e.g." is one word, never split into "e. g." (Oct 27 live). */
export const SPLIT_ABBREVIATION = /\b(e|i)\. (g|e)\./i
const ASKS = /\?|\btell me\b|\bsend me\b|\bgive me\b/i

export const CASES: Case[] = [
  // ── General money questions: a rule of thumb and what it depends on, never "it's in the app" ──
  { id: 'g-retire-howmuch', area: 'general', message: 'how much should I put into my retirement',
    expect: { kind: 'question', plan: true, says: [/match/i], never: NOT_PUNTED }, note: 'Oct 27 prod: punted to account' },
  { id: 'g-card-or-invest', area: 'general', message: 'should I pay off my credit card or invest?', expect: { kind: 'question', plan: true, never: NOT_PUNTED } },
  { id: 'g-roth-what', area: 'general', message: "what's a Roth IRA?", expect: { kind: 'question', plan: false } },
  { id: 'g-emergency-size', area: 'general', message: 'how big should my emergency fund be?', expect: { kind: 'question', says: [/(3|three)/i, /(6|six)/i, /month/i], never: NOT_PUNTED } },
  { id: 'g-save-rate', area: 'general', message: 'how much of my paycheck should I be saving?', expect: { kind: 'question', says: [/20%|twenty percent|15%/i], never: NOT_PUNTED } },
  { id: 'g-match-worth', area: 'general', message: 'is it worth putting money in my 401k if my employer matches?', expect: { kind: 'question', says: [/match/i], never: NOT_PUNTED } },
  { id: 'g-apr', area: 'general', message: 'what is APR?', expect: { kind: 'question', plan: false } },
  { id: 'g-saving-1000', area: 'general', message: "I'm saving $1000 a month, what should I do with it?", expect: { kind: 'question', plan: true, never: NOT_PUNTED } },
  { id: 'g-debt-order', area: 'general', message: 'which debt should I pay off first?', expect: { kind: 'question', plan: true, says: [/interest/i], never: NOT_PUNTED } },
  { id: 'g-house-income', area: 'general', message: 'how much house can I afford on 90k?', expect: { kind: 'question', never: NOT_PUNTED } },

  // ── Calculations from numbers the person gives: the app's loan tool, never the model's own math ──
  { id: 'c-car-asks-payment', area: 'calculation', message: 'I have a car loan at 18% interest with a balance of 30000. When will I be able to pay it off',
    expect: { kind: 'question', says: [/payment|pay each month|a month/i, ASKS], never: NOT_PUNTED }, note: 'Oct 27 prod: "That one needs your account"' },
  { id: 'c-car-with-payment', area: 'calculation',
    history: [
      { role: 'user', text: 'I have a car loan at 18% interest with a balance of 30000. When will I be able to pay it off' },
      { role: 'assistant', text: "At 18%, it depends on what you pay each month. What's your monthly payment?" },
    ],
    message: '650 a month', expect: { kind: 'question', says: [/79 months|6\.6 years/i, /21,4\d\d|21,5\d\d/] } },
  { id: 'c-car-payment-below-interest', area: 'calculation',
    history: [
      { role: 'user', text: 'I have a car loan at 18% interest with a balance of 30000. When will I be able to pay it off' },
      { role: 'assistant', text: "I need the monthly payment you'll make to work out the payoff time. What's your monthly payment?" },
    ],
    message: '400', expect: { kind: 'question', says: [/interest/i, /\$?450/], never: [/\d+ months/i, /e\. g\./] },
    note: 'Oct 27 live: right answer, but it did not say what the payment has to beat ($450 of interest a month)' },
  { id: 'c-card-payoff', area: 'calculation', message: 'I owe 8000 on a credit card at 24% and pay 300 a month. How long until it is paid off?',
    expect: { kind: 'question', says: [/(38|39) months|3\.2 years/i] } },
  { id: 'c-car-payment', area: 'calculation', message: 'what would my payment be on a 25000 car loan at 7% for 5 years?', expect: { kind: 'question', says: [/\$?495/] } },
  { id: 'c-never-pays-off', area: 'calculation', message: 'I pay 100 a month on a 10000 card at 24%. When will it be paid off?',
    expect: { kind: 'question', says: [/interest|never|cover/i], never: [/\d+ months/i] } },

  // ── True account questions: their own numbers we do not have ──
  { id: 'a-savings-rate', area: 'account', message: "what's my savings rate?", expect: { kind: 'account' } },
  { id: 'a-savings-balance', area: 'account', message: 'how much do I have in savings?', expect: { kind: 'account' } },
  { id: 'a-groceries', area: 'account', message: 'how much did I spend on groceries last month?', expect: { kind: 'account' } },
  { id: 'a-on-track', area: 'account', message: 'am I on track for retirement?', expect: { kind: ['account', 'question'], never: [/you('re| are) on track(?! if)/i] } },

  // ── Questions about the figures the chat already has ──
  { id: 'f-takehome-why', area: 'figures', figures: 'rent', message: 'why is my take-home 4,205?', expect: { kind: 'question', plan: false, says: [/tax|federal|FICA/i] } },
  { id: 'f-range-how', area: 'figures', figures: 'rent', message: 'how did you get my rent range?', expect: { kind: 'question', never: NOT_PUNTED } },
  { id: 'f-after-tax', area: 'figures', figures: 'rent', message: 'is that after tax?', expect: { kind: 'question', says: [/tax|federal|FICA/i] } },
  { id: 'f-too-high', area: 'figures', figures: 'rent', message: 'is 1600 too much rent for me?', expect: { kind: 'question', never: NOT_PUNTED } },
  { id: 'f-left-after', area: 'figures', figures: 'rent', message: 'how much is left after rent?', expect: { kind: 'question', says: [/\$\d/], never: NOT_PUNTED } },

  // ── Step answers in the rent thread ──
  { id: 's-date', area: 'step', figures: 'rent', step: 'a move-in date, or LOOKING if they have not found a place', message: 'Dec 1', expect: { kind: 'step', value: 'Dec 1' } },
  { id: 's-looking', area: 'step', figures: 'rent', step: 'a move-in date, or LOOKING if they have not found a place', message: "I'm still looking", expect: { kind: 'step', value: 'LOOKING' } },
  { id: 's-balance', area: 'step', figures: 'rent', step: 'their checking balance as a dollar amount', message: 'about 1200 in checking', expect: { kind: 'step', value: '1200' } },
  { id: 's-question-not-step', area: 'step', figures: 'rent', step: 'a move-in date, or LOOKING if they have not found a place', message: 'how much is a security deposit usually?', expect: { kind: 'question' } },

  // ── Offers ──
  { id: 'o-good-offer', area: 'offer', tool: 'offer', figures: 'offer', message: 'is this a good offer?', expect: { kind: 'question', never: NOT_PUNTED } },
  { id: 'o-takehome', area: 'offer', tool: 'offer', figures: 'offer', message: "what's my take-home?", expect: { kind: 'question', says: [/5,?719/] } },
  { id: 'o-max-401k', area: 'offer', tool: 'offer', figures: 'offer', message: 'should I max out my 401k?', expect: { kind: 'question', plan: true, never: NOT_PUNTED } },

  // ── Off topic and advice limits ──
  { id: 'x-weather', area: 'off-topic', message: "what's the weather in Boston?", expect: { kind: 'question', says: [/money|financ/i] } },
  { id: 'x-stock-pick', area: 'off-topic', message: 'should I buy Tesla stock?', expect: { kind: 'question', never: [/\byes\b|you should buy/i] } },
]
