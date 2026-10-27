import { describe, expect, it } from 'vitest'

import { localTaxAnnual } from '@/lib/localTax'
import { calculateMarketRentRange } from '@/lib/zoriClient'
import { calculateRentRange, calculateUpfrontCash } from '@/lib/rent'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import { computeOfferValue, MARKET_PTO_DAYS } from '@/lib/offer/calculate'
import { APP_LINK_TEXT, HANDOFF_TEXT, INVITE_TEXT, PLAN_PREVIEW_TEXT, monthsToClear, reply, start, type ChatServices, type ChatState, type Step } from './engine'
import { matchPresetCity, matchState, parseMatch, parseMoney, redactForLog, salaryOrTakeHome } from './parse'

/**
 * Parity, the spec's rule: the chat takes what the pages take and gives the figures the pages give. The services
 * stand in for the same /api/tax and /api/zori routes the pages call; every expected figure below is computed
 * by the shared libraries, not written by hand, so a drift between the chat and the pages fails here.
 */
const TAX = { netIncomeAnnual: 61_000, federalTaxAnnual: 7_700, stateTaxAnnual: 0, ficaTaxAnnual: 5_738, taxSource: 'test' }
const NY_TAX = { netIncomeAnnual: 57_000, federalTaxAnnual: 7_700, stateTaxAnnual: 4_000, ficaTaxAnnual: 5_738, taxSource: 'test' }
const svc = (over: Partial<ChatServices> = {}): ChatServices => ({
  tax: async (_s, st) => (st === 'NY' ? NY_TAX : TAX),
  metros: async (st) => (st === 'OH' ? [{ label: 'Columbus, OH', value: 'Columbus, OH' }, { label: 'Cleveland, OH', value: 'Cleveland, OH' }] : []),
  medianRent: async (_st, region) => (region === 'Austin, TX' ? 1_700 : region === 'New York, NY' ? 3_400 : region === 'Columbus, OH' ? 1_400 : null),
  ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}` }),
  ...over,
})

async function run(flow: 'rent' | 'offer' | null, replies: Array<{ chip?: string; text?: string }>, s: ChatServices = svc()): Promise<Step[]> {
  const steps: Step[] = [start(flow)]
  for (const r of replies) steps.push(await reply(steps[steps.length - 1].state, r, s))
  return steps
}
const said = (step: Step) => step.messages.map((m) => m.text).join(' ')
const facts = (step: Step): ChatState['facts'] => step.state.facts

describe('parse', () => {
  it('reads money the way people type it', () => {
    expect(parseMoney('$62,000')).toBe(62_000)
    expect(parseMoney('around 5k')).toBe(5_000)
    expect(parseMoney('62.5k a year')).toBe(62_500)
    expect(parseMoney('5,200/mo')).toBe(5_200)
    expect(parseMoney('none')).toBeNull()
    expect(parseMoney('about three hundred a month for my car')).toBe(300)
    expect(parseMoney('eighty grand')).toBe(80_000)
    expect(parseMoney('five thousand two hundred')).toBe(5_200)
    expect(parseMoney('85 grand')).toBe(85_000)
    expect(salaryOrTakeHome(62_000)).toBe('salary')
    expect(salaryOrTakeHome(5_200)).toBe('take_home')
  })

  it('matches the rent page cities and any state', () => {
    expect(matchPresetCity('austin')).toBe('Austin')
    expect(matchPresetCity('new york city')).toBe('NYC')
    expect(matchPresetCity('bay area')).toBe('SF Bay Area')
    expect(matchPresetCity('Columbus')).toBeNull()
    expect(matchState('ohio')?.code).toBe('OH')
    expect(matchState('TX')?.code).toBe('TX')
  })

  it('reads a match formula and flags a bare percentage', () => {
    expect(parseMatch('100% up to 4%')).toEqual({ rate: 100, cap: 4 })
    expect(parseMatch('dollar for dollar up to 5%')).toEqual({ rate: 100, cap: 5 })
    expect(parseMatch('4%')).toEqual({ cap: 4 })
  })

  it('keeps phone numbers and emails out of the question log', () => {
    expect(redactForLog('text me at 415 555 0199 or a@b.co')).toBe('text me at [number] or [email]')
  })
})

describe('rent flow', () => {
  it('the purpose question says where the money comes from, and typed answers land on the right option', async () => {
    const base = [{ text: '80000' }, { chip: 'Austin' }, { chip: 'no' }, { chip: 'none' }, { chip: 'low' }, { chip: 'next_month' }]
    const s = await run('rent', base)
    const f = facts(s[6])
    const saving = f.range!.high - f.pick!
    expect(said(s[6])).toContain(`Signing at $${f.pick!.toLocaleString('en-US')} instead of $${f.range!.high.toLocaleString('en-US')} leaves $${saving.toLocaleString('en-US')} a month. Where should that`)
    expect(s[6].chips.map((c) => c.label)).toEqual(['Rebuild my savings after the move', 'Paying down a card', 'Saving for later', 'How the upfront is worked out'])
    expect(facts((await run('rent', [...base, { text: 'saving for later' }]))[7]).purpose).toBe('future')
    expect(facts((await run('rent', [...base, { text: 'the move-in money' }]))[7]).purpose).toBe('cushion')
    const math = (await run('rent', [...base, { chip: 'upfront_math' }]))[7]
    expect(said(math)).toContain('Where should that')
  })

  it('a preset city: range, market rents and upfront from the shared libraries, debt included', async () => {
    const s = await run('rent', [
      { text: '80000' }, { chip: 'Austin' }, { chip: 'no' }, { chip: 'yes' }, { text: '300' }, { chip: 'low' }, { chip: 'next_month' }, { chip: 'cushion' },
    ])
    // After the city: take-home from /api/tax, less Austin's local tax (none), as the rent page computes it.
    const takeHome = (TAX.netIncomeAnnual - localTaxAnnual('Austin', 80_000 - STANDARD_DEDUCTION_2026_SINGLE)) / 12
    const market = calculateMarketRentRange(1_700)
    const range = calculateRentRange(takeHome, 300)
    expect(said(s[2])).toContain(`$${Math.round(market.marketLow).toLocaleString('en-US')}`)
    expect(facts(s[5]).range).toEqual(range)
    expect(facts(s[6]).pick).toBe(range.low)
    const up = calculateUpfrontCash(range, takeHome)
    expect(said(s[7])).toContain(`$${up.low.toLocaleString('en-US')} to $${up.high.toLocaleString('en-US')}`)
    // Cushion: half the freed amount after each of two paychecks, toward the top of the upfront range.
    expect(said(s[8])).toContain(`$${Math.round((range.high - range.low) / 2).toLocaleString('en-US')} the day after each paycheck`)
    expect(said(s[8])).toContain(`until you're back to $${up.high.toLocaleString('en-US')}, what the move takes out`)
  })

  it('labels each headline, and shows the market range against the range that fits', async () => {
    const s = await run('rent', [{ text: '80000' }, { chip: 'NYC' }])
    const fits = s[1].messages.find((m) => m.figure)!
    expect(fits.figureLabel).toBe('Rent that fits')
    const market = s[2].messages.find((m) => m.figure)!
    expect(market.figureLabel).toBe('New York rentals')
    expect(market.compare?.label).toBe('Rent that fits')
    expect(market.figure).toMatch(/^\$[\d,]+–\$[\d,]+\/mo$/)
    expect(market.compare?.value).toMatch(/^\$[\d,]+–\$[\d,]+\/mo$/)
  })

  it('NYC charges city tax, as the rent page does for its preset', async () => {
    const s = await run('rent', [{ text: '90000' }, { chip: 'NYC' }])
    const local = localTaxAnnual('NYC', 90_000 - STANDARD_DEDUCTION_2026_SINGLE)
    expect(local).toBeGreaterThan(0)
    expect(facts(s[2]).takeHomeMonthly).toBeCloseTo((NY_TAX.netIncomeAnnual - local) / 12, 6)
    expect(said(s[2])).toContain('city income tax')
  })

  it('any other state and metro, through the same lists; outside a metro has no market data', async () => {
    const metro = await run('rent', [{ text: '70000' }, { chip: '__elsewhere__' }, { text: 'ohio' }, { chip: 'Columbus, OH' }])
    expect(said(metro[3])).toContain('Which area of Ohio')
    expect(facts(metro[4]).market?.median).toBe(1_400)
    const outside = await run('rent', [{ text: '70000' }, { text: 'ohio' }, { chip: '__OTHER__' }])
    expect(facts(outside[3]).market).toBeNull()
    expect(said(outside[3])).toContain("I don't have rental prices outside a metro")
  })

  it('a typed take-home needs no tax call and is said back as take-home', async () => {
    let called = false
    const s = await run('rent', [{ text: '5,176' }], svc({ tax: async () => { called = true; return TAX } }))
    expect(said(s[1])).toContain('On $5,176 a month take-home')
    expect(facts(s[1]).range).toEqual(calculateRentRange(5_176, 0))
    expect(called).toBe(false)
  })

  it('a side question goes to Ribbit; the open question is parked, not asked again', async () => {
    const s = await run('rent', [{ text: '80000' }, { text: 'is that before or after tax?' }, { text: 'what is a roth IRA' }, { text: 'austin' }])
    expect(said(s[2])).toBe('answer to: is that before or after tax?')
    expect(said(s[3])).toBe('answer to: what is a roth IRA')
    expect(s[3].parked).toBe('Which city?')
    expect(s[3].chips.some((c) => c.value === 'Austin')).toBe(true)
    expect(s[2].events.some((e) => e.name === 'ribbit_question_typed')).toBe(true)
    // The answer still lands after two side questions, and the next turn is not parked.
    expect(said(s[4])).toContain('Rentals in Austin')
    expect(s[4].parked).toBeUndefined()
  })

  it('before a tool is picked, a question leaves the two choices up', async () => {
    const s = await run(null, [{ text: 'should I put money into a Roth IRA' }])
    expect(s[1].parked).toBeUndefined()
    expect(s[1].chips.map((c) => c.value)).toEqual(['rent', 'offer'])
  })

  it('parks the question the turn asked, even when the turn goes on after it', async () => {
    const s = await run('rent', [{ text: '80000' }, { chip: 'Austin' }, { chip: 'no' }, { text: 'do student loans count?' }])
    expect(s[4].parked).toBe('Any monthly debt payments, like a car, student loans or card minimums?')
  })

  it('the first question names the period for each option, and so do the follow-ups', async () => {
    const s0 = start('rent')
    expect(said(s0)).toContain('yearly salary, or your monthly take-home')
    expect(s0.chips.map((c) => c.label)).toEqual(['Yearly salary', 'Monthly take-home'])
    expect(said(await reply(s0.state, { chip: 'salary' }, svc()))).toBe("What's the yearly salary?")
    expect(said(await reply(s0.state, { chip: 'take_home' }, svc()))).toBe('How much take-home lands each month?')
  })

  it('the first win comes after one answer', async () => {
    const s = await run('rent', [{ text: '80000' }])
    expect(s[1].events.some((e) => e.name === 'ribbit_win_shown' && e.props.turn === 'R2')).toBe(true)
  })
})

describe('offer flow', () => {
  it('match known: the package from computeOfferValue on entered terms only', async () => {
    const s = await run('offer', [
      { text: '75000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'put_in' },
    ])
    const value = computeOfferValue({
      salary: 75_000, bonusPct: 0, matchRatePct: 100, matchUpToPct: 4, hsaMonthly: 0, healthcarePremium: 0, rsuAnnual: 0,
      signingBonus: 0, showEspp: false, esppContrib: 0, esppDiscount: 0, ptoDays: MARKET_PTO_DAYS, rentMonthly: 0, savingsPct: 20,
    }, TAX)!
    expect(said(s[5])).toContain(`worth $${Math.round(value.totalPackage).toLocaleString('en-US')} a year`)
    expect(said(s[6])).toContain('Put in 4%')
    expect(said(s[6])).toContain('adds $500 a month')
  })

  it('a bare percentage is confirmed, not assumed', async () => {
    const s = await run('offer', [{ text: '75000' }, { chip: 'Austin' }, { chip: 'none' }, { text: '4%' }])
    expect(said(s[4])).toContain('dollar for dollar up to 4%')
  })

  it('match unknown: no match math, ask HR', async () => {
    const s = await run('offer', [{ text: '75000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'unknown' }])
    expect(said(s[4])).toContain('Ask HR')
    expect(facts(s[4]).matchRatePct).toBeUndefined()
  })

  it('offer to rent carries take-home and city, and asks nothing twice', async () => {
    const s = await run('offer', [{ text: '75000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'none' }, { chip: 'yes' }])
    expect(s[5].state.flow).toBe('rent')
    expect(said(s[5])).toContain('Rentals in Austin')
    expect(said(s[5])).not.toContain('Which city?')
  })
})

describe('typed answers Ribbit reads', () => {
  it('applies the value Ribbit found in the words', async () => {
    const s = await run('rent', [{ text: 'about eighty grand' }], svc({ ask: async () => ({ kind: 'step' as const, value: '80000' }) }))
    expect(facts(s[1]).salary).toBe(80_000)
    expect(said(s[1])).toContain('Which city?')
  })
})

describe('prompts to use WeLeap (the text thread\'s rules)', () => {
  const planAsk = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: /what should i do|card or invest/i.test(message) }) })

  it('a planning question before a tool gets the answer and a card built from the question, once per thread', async () => {
    const s = await run(null, [{ text: 'I am saving $1000 a month, what should I do with it' }, { text: 'should I pay off my card or invest' }], planAsk)
    expect(s[1].messages.map((m) => m.text)).toEqual(['answer to: I am saving $1000 a month, what should I do with it', INVITE_TEXT])
    const card = s[1].messages[1]
    expect(card.planCard?.known).toEqual([{ label: 'Saving each month', value: '$1,000' }])
    expect(card.planCard?.locked).toContain('Where your $1,000 should go first')
    expect(card.appAsk).toEqual(expect.objectContaining({ label: 'Get my plan and unlock the rest', why: 'plan_invite' }))
    expect(card.appAsk?.textInstead).toBeFalsy()
    expect(facts(s[1]).mentionedSaving).toBe(1000)
    expect(s[2].messages.map((m) => m.text)).toEqual(['answer to: should I pay off my card or invest'])
  })

  it('mid-flow: the line and the button with the question parked; the card waits for the ending', async () => {
    const s = await run('rent', [{ text: '80000' }, { text: 'what should I do with my savings' }], planAsk)
    const invite = s[2].messages.find((m) => m.appAsk)!
    expect(invite.appAsk?.why).toBe('plan_invite')
    expect(invite.planCard).toBeUndefined()
    expect(s[2].parked).toBe('Which city?')
  })

  it('an account question gets the hand-off first (the one invite), then the app link', async () => {
    const acct = svc({ ask: async ({ message }) => (/savings rate|401k/.test(message) ? { kind: 'account' as const } : { kind: 'question' as const, reply: 'ok', plan: true }) })
    const s = await run(null, [{ text: 'what is my savings rate' }, { text: 'and my 401k' }, { text: 'what should I do with it' }], acct)
    expect(s[1].messages).toEqual([expect.objectContaining({ text: HANDOFF_TEXT, appAsk: expect.objectContaining({ why: 'account' }) })])
    expect(s[2].messages).toEqual([expect.objectContaining({ text: APP_LINK_TEXT, appAsk: expect.objectContaining({ why: 'account' }) })])
    expect(s[3].messages.some((m) => m.appAsk)).toBe(false)
  })

  it('rent: the spending check after the pick, once, and a typed start date still lands', async () => {
    const s = await run('rent', [{ text: '80000' }, { chip: 'Austin' }, { chip: 'no' }, { chip: 'none' }, { chip: 'low' }, { text: 'next month' }])
    const check = s[5].messages.find((m) => m.appAsk)!
    expect(check.appAsk).toEqual(expect.objectContaining({ label: 'Check it against my real spending', why: 'spending_check' }))
    expect(check.text).toContain(`Before you sign at $${facts(s[5]).pick!.toLocaleString('en-US')}`)
    expect(s[5].chips.map((c) => c.value)).toEqual(['keep'])
    expect(s[5].events.some((e) => e.name === 'ribbit_spending_check_shown')).toBe(true)
    expect(facts(s[6]).start).toBe('next_month')
  })

  it('rent: the ending is the plan card, with the text sign-up one tap away', async () => {
    const s = await run('rent', [
      { text: '80000' }, { chip: 'Austin' }, { chip: 'no' }, { chip: 'yes' }, { text: '200' }, { chip: 'low' }, { chip: 'keep' }, { chip: 'next_month' }, { chip: 'cushion' }, { chip: 'text' },
    ])
    const end = s[9]
    const card = end.messages.find((m) => m.planCard)!
    const f = facts(end)
    expect(card.text).toBe(PLAN_PREVIEW_TEXT)
    expect(card.planCard!.known.map((r) => r.label)).toEqual(['Take-home', 'Rent', 'Debt payments', 'Rebuilding savings'])
    expect(card.planCard!.known[3].value).toBe(`$${f.perCheck!.toLocaleString('en-US')} a paycheck to $${f.upfront!.high.toLocaleString('en-US')}`)
    expect(card.planCard!.locked[1]).toBe(`Does $${f.pick!.toLocaleString('en-US')} still fit after that?`)
    expect(card.appAsk).toEqual(expect.objectContaining({ label: 'Save my plan and unlock the rest', why: 'plan_preview', textInstead: true }))
    expect(end.events.some((e) => e.name === 'ribbit_plan_preview_shown')).toBe(true)
    expect(end.messages.some((m) => /watch/i.test(m.text))).toBe(false)
    expect(s[10].messages.some((m) => m.handoff === 'rent')).toBe(true)
  })

  it('offer: the spending check after the 401k, then rent, and Later ends on the offer card', async () => {
    const s = await run('offer', [
      { text: '85000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'put_in' }, { chip: 'keep' }, { chip: 'later' },
    ])
    const check = s[6].messages.find((m) => m.appAsk)!
    expect(check.appAsk?.why).toBe('spending_check')
    expect(check.text).toContain('Want to check before you tell HR?')
    expect(said(s[7])).toContain('Want to work that out properly?')
    const card = s[8].messages.find((m) => m.planCard)!
    expect(card.planCard!.known.map((r) => r.label)).toEqual(['Take-home in Austin', 'Offer worth, with the match', '401(k) at 4%', 'What the 4% costs you'])
    expect(card.planCard!.locked).toContain('Did the 4% actually come out?')
    expect(s[8].state.turn).toBe('O8')
  })

  it('at the picker the two tools stay up, captioned as tasks', async () => {
    const s = await run(null, [{ text: 'what is a roth ira' }])
    expect(s[1].chipsLabel).toBe('Or work out with Ribbit:')
    expect(s[1].chips.map((c) => c.label)).toEqual(['Rent I can afford', 'What an offer is worth'])
  })
})

describe('card payoff', () => {
  it('clears or says it never will', () => {
    expect(monthsToClear(3_000, 24, 350)).toBe(10)
    expect(monthsToClear(30_000, 24, 350)).toBe(Infinity)
  })
})
