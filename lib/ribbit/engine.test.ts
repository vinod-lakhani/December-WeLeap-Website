import { describe, expect, it } from 'vitest'

import { localTaxAnnual } from '@/lib/localTax'
import { calculateMarketRentRange } from '@/lib/zoriClient'
import { calculateRentRange, calculateUpfrontCash } from '@/lib/rent'
import { STANDARD_DEDUCTION_2026_SINGLE } from '@/lib/firstPaycheck/constants'
import { computeOfferValue, MARKET_PTO_DAYS } from '@/lib/offer/calculate'
import { APP_LINK_TEXT, HANDOFF_TEXT, INVITE_TEXT, RANGE_SPENDING_CHECK_NOTE, RANGE_SPENDING_CHECK_TEXT, TAKEHOME_SPENDING_CHECK_NOTE, TAKEHOME_SPENDING_CHECK_TEXT, MONEY_BACK_FAILED_TEXT, MONEY_OFFER_TEXT, MONEY_REOFFER_TEXT, PLAN_PREVIEW_TEXT, monthsToClear, reply, start, type ChatServices, type ChatState, type Reply, type Step } from './engine'
import { startupPlanData } from './payload'
import { matchPresetCity, matchState, parseDecimal, parseGrant, parseMatch, parseMoney, readPay, redactForLog, salaryOrTakeHome, splitCityState } from './parse'

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

async function run(flow: 'rent' | 'offer' | 'money' | 'startup' | null, replies: Array<Reply>, s: ChatServices = svc()): Promise<Step[]> {
  const steps: Step[] = [start(flow)]
  for (const r of replies) steps.push(await reply(steps[steps.length - 1].state, r, s))
  return steps
}
const said = (step: Step) => step.messages.map((m) => m.text).join(' ')
const facts = (step: Step): ChatState['facts'] => step.state.facts

describe('parse', () => {
  it('splits a typed place into city and state', () => {
    expect(splitCityState('Dallas, TX')).toEqual({ city: 'Dallas', stateCode: 'TX' })
    expect(splitCityState('charlotte nc')).toEqual({ city: 'charlotte', stateCode: 'NC' })
    expect(splitCityState('Houston Texas')).toEqual({ city: 'Houston', stateCode: 'TX' })
    expect(splitCityState('Dallas')).toEqual({ city: 'Dallas' })
    expect(splitCityState('Texas')).toEqual({ city: '' })
    expect(splitCityState('TX')).toEqual({ city: '' })
    expect(splitCityState('New Mexico')).toEqual({ city: '' })
  })

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

  it('reads base pay, yearly or hourly, and asks when a bare number could be either', () => {
    expect(readPay('19.50')).toEqual({ kind: 'hourly', rate: 19.5, hours: 40, annual: 40_560 })
    expect(readPay('$22/hr')).toMatchObject({ kind: 'hourly', rate: 22, annual: 45_760 })
    expect(readPay('22hr')).toMatchObject({ kind: 'hourly', rate: 22 })
    expect(readPay('18 an hour, 30 hours a week')).toEqual({ kind: 'hourly', rate: 18, hours: 30, annual: 28_080 })
    expect(readPay('30 hrs/wk at $18.25')).toMatchObject({ kind: 'hourly', rate: 18.25, hours: 30 })
    expect(readPay('twenty an hour')).toMatchObject({ kind: 'hourly', rate: 20 })
    expect(readPay('$85,000')).toEqual({ kind: 'salary', annual: 85_000 })
    expect(readPay('120k')).toEqual({ kind: 'salary', annual: 120_000 })
    expect(readPay('95')).toEqual({ kind: 'unsure', n: 95 })
    expect(readPay('95', 'salary')).toEqual({ kind: 'unsure', n: 95 })
    expect(readPay('95', 'hourly')).toMatchObject({ kind: 'hourly', rate: 95 })
    expect(readPay('60000', 'hourly')).toEqual({ kind: 'salary', annual: 60_000 })
    expect(readPay('5')).toBeNull()
    expect(readPay('not sure yet')).toBeNull()
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
  it('an hourly rate at "salary or take-home" is pay, not a $20 take-home; a bare small number is asked about', async () => {
    let asked = 0
    const s = await run('rent', [{ text: '19.50' }], svc({ ask: async () => { asked++; return null } }))
    expect(asked).toBe(0)
    expect(facts(s[1])).toMatchObject({ payBasis: 'hourly', hourlyRate: 19.5, hoursPerWeek: 40, salary: 40_560, takeHomeFrom: 'salary' })
    expect(said(s[1])).toMatch(/^At \$19\.50 an hour, 40 hours a week, that's about \$40,560 a year, and take-home before state tax is about \$[\d,]+ a month\. Rent that fits is/)
    const tapped = await run('rent', [{ chip: 'take_home' }, { text: '$22/hr' }])
    expect(facts(tapped[2])).toMatchObject({ payBasis: 'hourly', hourlyRate: 22, salary: 45_760 })
    const bare = await run('rent', [{ text: '25' }])
    expect(said(bare[1])).toBe('Is that $25 an hour, or $25,000 a year?')
    const hour = await reply(bare[1].state, { chip: 'hourly' }, svc())
    expect(facts(hour)).toMatchObject({ payBasis: 'hourly', salary: 52_000 })
    expect(hour.state.turn).toBe('R2')
    const typedAgain = await reply(bare[1].state, { text: '$62,000' }, svc())
    expect(facts(typedAgain)).toMatchObject({ salary: 62_000, takeHomeFrom: 'salary' })
    // Unchanged: a take-home by size, a salary by size, and a take-home after Monthly take-home.
    expect(facts((await run('rent', [{ text: '4,200' }]))[1])).toMatchObject({ takeHomeMonthly: 4_200, takeHomeFrom: 'typed' })
    expect(facts((await run('rent', [{ text: '62k' }]))[1]).payBasis).toBeUndefined()
    expect(facts((await run('rent', [{ chip: 'take_home' }, { text: '150' }]))[2])).toMatchObject({ takeHomeMonthly: 150, takeHomeFrom: 'typed' })
  })

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

  it('a typed city anywhere in the rent data is read as the place; a name in two states gets "Which one?"', async () => {
    const metros = { 'Dallas|': [{ label: 'Dallas, TX', value: 'Dallas, TX', stateCode: 'TX' }], 'Dallas|TX': [{ label: 'Dallas, TX', value: 'Dallas, TX', stateCode: 'TX' }],
      'Portland|': [{ label: 'Portland, ME', value: 'Portland, ME', stateCode: 'ME' }, { label: 'Portland, OR', value: 'Portland, OR', stateCode: 'OR' }] } as Record<string, { label: string; value: string; stateCode: string }[]>
    const s2 = svc({ findMetros: async (city, st) => metros[`${city}|${st ?? ''}`] ?? [] })
    for (const typed of ['Dallas', 'Dallas, TX']) {
      const s = await run('rent', [{ text: '80000' }, { text: typed }], s2)
      expect(facts(s[2]).region).toEqual({ stateName: 'TX', regionName: 'Dallas, TX' })
      expect(facts(s[2]).stateCode).toBe('TX')
      expect(s[2].state.turn).not.toBe('R2')
    }
    const p = await run('rent', [{ text: '80000' }, { text: 'Portland' }, { chip: 'Portland, OR' }], s2)
    expect(p[2].chips.map((c) => c.value)).toEqual(['Portland, ME', 'Portland, OR', 'somewhere_else'].map((v) => (v === 'somewhere_else' ? p[2].chips[2].value : v)))
    expect(facts(p[3]).region).toEqual({ stateName: 'OR', regionName: 'Portland, OR' })
  })

  it('a town the rent data has no metro for: its state, then the closest area or the range on its own; a second miss carries on', async () => {
    const town = svc({
      metros: async (st) => (st === 'TX' ? [{ label: 'Kerrville, TX', value: 'Kerrville, TX' }, { label: 'San Antonio, TX', value: 'San Antonio, TX' }] : []),
      findMetros: async (city, st) => (city.toLowerCase() === 'san antonio' && (!st || st === 'TX') ? [{ label: 'San Antonio, TX', value: 'San Antonio, TX', stateCode: 'TX' }] : []),
    })
    const s = await run('rent', [{ text: '80000' }, { text: 'la vernia' }, { text: 'TX' }], town)
    expect(s[2].messages.map((m) => m.text)).toEqual(['Which state is La Vernia in?'])
    expect(s[3].messages[0].text).toMatch(/^I don't have rent prices for La Vernia\./)
    // The biggest metros first, then the way out.
    expect(s[3].chips.map((c) => c.label)).toEqual(['San Antonio, TX', 'Kerrville, TX', 'Use my range on its own'])
    // Typing the nearest city picks it.
    const typed = await run('rent', [{ text: '80000' }, { text: 'la vernia' }, { text: 'TX' }, { text: 'San Antonio' }], town)
    expect(facts(typed[4]).region).toEqual({ stateName: 'TX', regionName: 'San Antonio, TX' })
    // Two misses: on with the range, named after the town.
    const two = await run('rent', [{ text: '80000' }, { text: 'la vernia' }, { text: 'TX' }, { text: 'Floresville' }, { text: 'Poth' }], town)
    expect(two[4].messages.map((m) => m.text)).toEqual([expect.stringMatching(/^I don't have rent prices for Floresville\. Pick or type the closest area/)])
    expect(facts(two[5]).outsideMetro).toBe(true)
    expect(facts(two[5]).place).toBe('Poth')
    expect(two[5].messages.map((m) => m.text).join(' ')).toMatch(/I don't have rental prices for Poth, so your range stands on its own/)
  })

  it('a town with its state goes straight to that state\'s areas; remarks and questions at "Which city?" still go to Ribbit', async () => {
    const town = svc({ metros: async (st) => (st === 'VA' ? [{ label: 'Washington, DC', value: 'Washington, DC' }] : []), findMetros: async () => [] })
    const s = await run('rent', [{ text: '80000' }, { text: 'Ashburn VA' }], town)
    expect(s[2].state.turn).toBe('R2_metro')
    expect(s[2].messages[0].text).toMatch(/^I don't have rent prices for Ashburn\./)
    for (const said of ['card or invest', 'not sure', 'how much is utilities']) {
      const r = await run('rent', [{ text: '80000' }, { text: said }], town)
      expect(r[2].messages[0].text).toBe(`answer to: ${said}`)
    }
  })

  it('the first rent range carries the spending check, then "Which city?" with its chips; the city answer has no invite', async () => {
    const s = await run('rent', [{ text: '80000' }, { chip: 'NYC' }])
    const msgs = s[1].messages
    expect(msgs.map((m) => m.text)).toEqual([expect.stringMatching(/Rent that fits is/), RANGE_SPENDING_CHECK_TEXT, 'Which city?'])
    expect(msgs[1].appAsk).toEqual({ label: 'Check it against my real spending', why: 'spending_check', note: RANGE_SPENDING_CHECK_NOTE })
    expect(msgs[1].appAsk?.note).not.toMatch(/bank/i)
    // Narrowing it down is still one tap.
    expect(s[1].chips.length).toBeGreaterThan(0)
    expect(s[1].events).toContainEqual({ name: 'ribbit_spending_check_shown', props: { turn: 'R2' } })
    expect(s[1].state.invited).toBe(true)
    // The city answer: the range for that city and the next question, no app ask.
    expect(s[2].messages.some((m) => m.appAsk)).toBe(false)
    expect(s[2].events.some((e) => e.name === 'ribbit_app_invite_shown')).toBe(false)
  })

  it('the city answer has the headline card in every version, and says the range stays when no tax changes it', async () => {
    for (const city of ['Austin', 'NYC']) {
      const s = await run('rent', [{ text: '80000' }, { chip: city }])
      const card = s[2].messages.find((m) => m.figure)!
      expect(card.figureLabel).toMatch(/rentals$/)
      expect(card.compare?.label).toBe('Rent that fits')
    }
    // Texas: no state or city tax, so no second "take-home is about…" and no repeated range sentence.
    const tx = await run('rent', [{ text: '80000' }, { chip: 'Austin' }])
    const said = tx[2].messages.map((m) => m.text).join(' ')
    expect(said).toMatch(/^Texas has no state income tax, so your range stays the same\./)
    expect(said).not.toMatch(/take-home is about/)
    // New York: city tax changes it, so the full line stays.
    const ny = await run('rent', [{ text: '80000' }, { chip: 'NYC' }])
    expect(ny[2].messages.map((m) => m.text).join(' ')).toMatch(/take-home is about/)
  })

  it('once offered on the first range, a planning question later gets no second invite', async () => {
    const ask = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: true }) })
    const s = await run('rent', [{ text: '80000' }, { chip: 'NYC' }, { text: 'should I invest or pay off my card first?' }], ask)
    expect(s[3].messages.map((m) => m.text)).not.toContain(INVITE_TEXT)
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

  it('before a tool is picked, a question leaves the four choices up', async () => {
    const s = await run(null, [{ text: 'should I put money into a Roth IRA' }])
    expect(s[1].parked).toBeUndefined()
    expect(s[1].chips.map((c) => c.value)).toEqual(['rent', 'offer', 'money', 'startup'])
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

  describe('benefits guide at O4', () => {
    const field = (value: number) => ({ value, confidence: 0.9, quote: 'q' })
    const toO4 = [{ text: '75000' }, { chip: 'Austin' }, { chip: 'none' }] as Reply[]

    it('a read match goes straight to the package, with the HSA and premium in it as on the tool page', async () => {
      const s = await run('offer', [...toO4, { benefits: { parsed: { matchRatePct: field(100), matchUpToPct: field(4), employerHsaAnnual: field(600), healthcarePremiumMonthly: field(80) } } }])
      expect(s[3].chips[0]).toEqual({ label: 'Upload my benefits guide', value: '__upload_benefits__' })
      const back = s[4].messages[0]
      expect(back.math).toEqual([
        { label: '401k match', value: '100% up to 4% of salary' },
        { label: 'Employer HSA', value: '$600/yr' },
        { label: 'Your health premium', value: '$80/mo' },
      ])
      expect(s[4].state.turn).toBe('O5')
      const value = computeOfferValue({
        salary: 75_000, bonusPct: 0, matchRatePct: 100, matchUpToPct: 4, hsaMonthly: 50, healthcarePremium: 80, rsuAnnual: 0,
        signingBonus: 0, showEspp: false, esppContrib: 0, esppDiscount: 0, ptoDays: MARKET_PTO_DAYS, rentMonthly: 0, savingsPct: 20,
      }, TAX)!
      expect(said(s[4])).toContain(`worth $${Math.round(value.totalPackage).toLocaleString('en-US')} a year`)
      expect(s[4].events.map((e) => e.name)).toEqual(expect.arrayContaining(['ribbit_benefits_read', 'ribbit_win_shown']))
    })

    it('no match in the guide: says so and keeps the question, without the upload chip', async () => {
      const s = await run('offer', [...toO4, { benefits: { parsed: { employerHsaAnnual: field(600) } } }])
      expect(said(s[4])).toContain("couldn't find the 401k match")
      expect(s[4].state.turn).toBe('O4')
      expect(s[4].chips.map((c) => c.value)).not.toContain('__upload_benefits__')
      expect(facts(s[4]).hsaMonthly).toBe(50)
    })

    it('a 0% match is no match', async () => {
      const s = await run('offer', [...toO4, { benefits: { parsed: { matchRatePct: field(0), matchUpToPct: field(0) } } }])
      expect(said(s[4])).toContain('No match, so nothing to collect there.')
      expect(facts(s[4]).match).toBe('none')
    })

    it('a failed read keeps the question and its chips', async () => {
      const s = await run('offer', [...toO4, { benefits: { failed: 'no_fields' } }])
      expect(said(s[4])).toBe("I couldn't find the match in that one. It may be a scan I can't read. The answers below work just as well.")
      expect(s[4].state.turn).toBe('O4')
      expect(s[4].chips).toEqual(s[3].chips)
    })
  })

  it('the first question offers Yearly and Hourly, as the rent question offers its two', async () => {
    const s = await run('offer', [{ chip: 'hourly' }, { text: '$19.50, 30 hours' }])
    expect(said(s[0])).toBe("Congrats on the offer. What's the base pay? A yearly salary or an hourly rate both work.")
    expect(s[0].chips).toEqual([{ label: 'Yearly salary', value: 'salary', opensKeyboard: true }, { label: 'Hourly', value: 'hourly', opensKeyboard: true }])
    expect(said(s[1])).toBe("What's the hourly rate? I'll count 40 hours a week.")
    expect(s[1].chips).toEqual([{ label: "It's a yearly salary", value: 'salary', opensKeyboard: true }])
    expect(said(s[1])).not.toMatch(/[,$]/)
    expect(facts(s[2])).toMatchObject({ payBasis: 'hourly', hourlyRate: 19.5, hoursPerWeek: 30, salary: 30_420 })
    expect(said(s[2])).toContain("At $19.50 an hour, 30 hours a week, that's about $30,420 a year.")
    expect(s[2].state.turn).toBe('O2')
  })

  it('a number already in the box when Yearly or Hourly is tapped is the answer, not cleared and asked again', async () => {
    const yearly = await run('offer', [{ chip: 'salary', typed: '85000' }])
    expect(yearly[1].state.turn).toBe('O2')
    expect(facts(yearly[1])).toMatchObject({ payBasis: 'salary', salary: 85_000 })
    const hourly = await run('offer', [{ chip: 'hourly', typed: '19.50' }])
    expect(facts(hourly[1])).toMatchObject({ payBasis: 'hourly', hourlyRate: 19.5, hoursPerWeek: 40, salary: 40_560 })
    // "85" after Yearly could still be $85 an hour: asked, as when it's typed after the tap.
    const unsure = await run('offer', [{ chip: 'salary', typed: '85' }])
    expect(said(unsure[1])).toBe('Is that $85 an hour, or $85,000 a year?')
    // Words in the box aren't pay: the tap asks for the amount as before.
    const words = await run('offer', [{ chip: 'salary', typed: 'not sure yet' }])
    expect(words[1].state.turn).toBe('O1_amount')
  })

  it('under the amount question, the other pay type switches without starting over', async () => {
    const s = await run('offer', [{ chip: 'salary' }, { chip: 'hourly' }, { text: '22' }])
    expect(said(s[1])).toBe("What's the yearly base salary?")
    expect(s[1].chips.map((c) => c.label)).toEqual(["It's hourly"])
    expect(said(s[2])).toBe("What's the hourly rate? I'll count 40 hours a week.")
    expect(facts(s[3])).toMatchObject({ payBasis: 'hourly', hourlyRate: 22, salary: 45_760 })
  })

  it('after Hourly, the rate alone (all a phone number pad can type) is read at 40 hours a week', async () => {
    const s = await run('offer', [{ chip: 'hourly' }, { text: '19.50' }])
    expect(facts(s[2])).toMatchObject({ payBasis: 'hourly', hourlyRate: 19.5, hoursPerWeek: 40, salary: 40_560 })
    expect(said(s[2])).toContain("At $19.50 an hour, 40 hours a week, that's about $40,560 a year.")
    expect(s[2].state.turn).toBe('O2')
  })

  it('a typed "19.50" is an hourly rate, not $20 a year sent to Ribbit', async () => {
    let asked = 0
    const s = await run('offer', [{ text: '19.50' }, { chip: 'Austin' }], svc({ ask: async () => { asked++; return null } }))
    expect(asked).toBe(0)
    expect(facts(s[1])).toMatchObject({ payBasis: 'hourly', hourlyRate: 19.5, hoursPerWeek: 40, salary: 40_560 })
    expect(said(s[2])).toContain('Anything on top of the pay?'.toLowerCase())
    expect(s[2].chips.map((c) => c.label)).toContain('Just the pay')
    const math = await reply(s[2].state, { chip: '__math__' }, svc())
    expect(math.messages[0].math?.[0]).toEqual({ label: '$19.50 an hour, 40 hours a week, 52 weeks', value: '$40,560' })
  })

  it('a bare "95" is asked, an hour or a year, rather than guessed', async () => {
    const s = await run('offer', [{ text: '95' }])
    expect(said(s[1])).toBe('Is that $95 an hour, or $95,000 a year?')
    expect(s[1].chips.map((c) => c.value)).toEqual(['hourly', 'salary'])
    const year = await reply(s[1].state, { chip: 'salary' }, svc())
    expect(facts(year)).toMatchObject({ payBasis: 'salary', salary: 95_000 })
    const hour = await reply(s[1].state, { text: 'an hour' }, svc())
    expect(facts(hour)).toMatchObject({ payBasis: 'hourly', hourlyRate: 95, salary: 197_600 })
    const typed = await reply(s[1].state, { text: '$95,000' }, svc())
    expect(facts(typed).salary).toBe(95_000)
  })

  it('compare another offer: priced in the same place, the difference a month and a year, then back to this offer', async () => {
    const tax = async (salary: number) => ({ ...TAX, netIncomeAnnual: salary * 0.8 })
    const s = await run('offer', [{ text: '85000' }, { chip: 'Austin' }, { chip: 'compare' }, { text: '95k' }, { chip: 'none' }, { chip: 'none' }, { chip: 'later' }], svc({ tax }))
    expect(said(s[3])).toBe("What's the other offer's base pay, yearly or hourly? I'll price it in Austin too.")
    const thisOne = (85_000 * 0.8) / 12
    const other = (95_000 * 0.8) / 12
    expect(said(s[4])).toContain(`At $95,000, the other offer takes home about $${Math.round(other).toLocaleString('en-US')} a month in Austin`)
    expect(said(s[4])).toContain(`$${Math.round(other - thisOne).toLocaleString('en-US')} a month more than this one`)
    expect(said(s[4])).toContain('Back to this offer. Anything on top of the salary?')
    expect(s[4].chips.map((c) => c.value)).not.toContain('compare')
    expect(s[4].events).toContainEqual({ name: 'ribbit_offer_compared', props: { turn: 'O3', other_more: true } })
    expect(facts(s[4]).takeHomeMonthly).toBeCloseTo(thisOne)
    const card = s[7].messages.find((m) => m.planCard)!
    expect(card.planCard!.known.map((r) => r.label)).toEqual(['Take-home in Austin', 'The other offer, take-home'])
  })

  it('a typed "I have another offer" at the extras question opens the compare, and takes a pay typed with it', async () => {
    const tax = async (salary: number) => ({ ...TAX, netIncomeAnnual: salary * 0.8 })
    const s = await run('offer', [{ text: '85000' }, { chip: 'Austin' }, { text: 'I have another offer' }, { text: '$22/hr' }], svc({ tax }))
    expect(s[3].state.turn).toBe('O3_compare')
    expect(said(s[4])).toContain('At $22 an hour, 40 hours a week, the other offer takes home')
    expect(said(s[4])).toContain('a month less than this one')
    const once = await run('offer', [{ text: '85000' }, { chip: 'Austin' }, { text: 'I have another offer for $22/hr' }])
    expect(facts(once[3]).compareSalary).toBe(45_760)
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

  it('a planning question before a tool gets the answer, then the offer to work it out with their numbers, once', async () => {
    const s = await run(null, [{ text: 'I am saving $1000 a month, what should I do with it' }, { chip: 'not_now' }, { text: 'should I pay off my card or invest' }], planAsk)
    expect(s[1].messages.map((m) => m.text)).toEqual(['answer to: I am saving $1000 a month, what should I do with it', MONEY_OFFER_TEXT])
    expect(s[1].chips.map((c) => c.value)).toEqual(['money', 'not_now'])
    expect(s[1].messages.some((m) => m.appAsk || m.planCard)).toBe(false)
    expect(facts(s[1]).mentionedSaving).toBe(1000)
    // Not now: back to the three choices; a later planning question is just answered.
    expect(s[2].chips.map((c) => c.value)).toEqual(['rent', 'offer', 'money', 'startup'])
    expect(s[3].messages.map((m) => m.text)).toEqual(['answer to: should I pay off my card or invest'])
  })

  it('after the invite, a planning question ends with its benefit line and a small link, at most twice', async () => {
    const line = 'Connected, WeLeap ranks your actual debts by interest rate and shows where extra payments save the most.'
    const benefitAsk = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: true, benefit: line, topic: 'debt' }) })
    // Mid-flow in the money chat (no offer on its first answer), so the first planning question gets the thread's invite.
    const s = await run('money', [{ text: '80000' }, { text: 'what should I do with my savings' }, { text: 'card or invest' }, { text: 'which debt first' }, { text: 'and the loan' }], benefitAsk)
    // The first planning question: the invite, never a benefit line.
    expect(s[2].messages.some((m) => m.text === line)).toBe(false)
    expect(s[2].messages.some((m) => m.text === INVITE_TEXT)).toBe(true)
    // The next two: the answer, then the line with a quiet link; no invite again.
    for (const step of [s[3], s[4]]) {
      expect(step.messages.map((m) => m.text)).toEqual([expect.stringMatching(/^answer to:/), line])
      expect(step.messages[1].appAsk).toEqual(expect.objectContaining({ why: 'benefit', quiet: true, label: 'Get my plan' }))
      expect(step.messages.some((m) => m.text === INVITE_TEXT)).toBe(false)
      expect(step.events.some((e) => e.name === 'ribbit_benefit_line_shown')).toBe(true)
    }
    // A third: the answer alone.
    expect(s[5].messages.map((m) => m.text)).toEqual(['answer to: and the loan'])
  })

  it('mid-flow: the line and the button with the question parked; the card waits for the ending', async () => {
    const s = await run('money', [{ text: '80000' }, { text: 'what should I do with my savings' }], planAsk)
    const invite = s[2].messages.find((m) => m.appAsk)!
    expect(invite.appAsk?.why).toBe('plan_invite')
    expect(invite.planCard).toBeUndefined()
    expect(s[2].parked).toBeTruthy()
  })

  it('rent: after the offer on the range, a planning question at "Which city?" is answered, with no second invite', async () => {
    const s = await run('rent', [{ text: '80000' }, { text: 'what should I do with my savings' }], planAsk)
    expect(s[2].messages.some((m) => m.appAsk?.why === 'plan_invite')).toBe(false)
    expect(s[2].messages.some((m) => m.text === INVITE_TEXT)).toBe(false)
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
    expect(check.appAsk?.note).toBe(`Free in WeLeap. See last month's spending next to $${facts(s[5]).pick!.toLocaleString('en-US')} rent, and what's left.`)
    expect(check.appAsk?.note).not.toMatch(/bank/i)
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

  it('offer: the first take-home, before state tax and the city, carries no app ask', async () => {
    const s = await run('offer', [{ text: '85000' }])
    expect(s[1].messages.map((m) => m.text)).toEqual([expect.stringMatching(/take-home before state tax/), 'Which city is the job in?'])
    expect(s[1].messages.some((m) => m.appAsk)).toBe(false)
    expect(s[1].events.map((e) => e.name)).not.toContain('ribbit_spending_check_shown')
    expect(s[1].state.invited).toBeFalsy()
  })

  it("offer: the take-home in the job's city carries the first-paycheck ask, then comparing another offer and the extras question", async () => {
    const s = await run('offer', [{ text: '85000' }, { chip: 'Austin' }])
    const msgs = s[2].messages
    expect(msgs.map((m) => m.text)).toEqual([
      expect.stringMatching(/take-home/), TAKEHOME_SPENDING_CHECK_TEXT,
      'Weighing another offer? I can put the two side by side. Otherwise, anything on top of the salary?',
    ])
    expect(msgs[1].appAsk).toEqual({ label: 'Plan my first paycheck', why: 'spending_check', note: TAKEHOME_SPENDING_CHECK_NOTE })
    expect(msgs[1].appAsk?.note).not.toMatch(/bank/i)
    expect(TAKEHOME_SPENDING_CHECK_TEXT).not.toMatch(/—/)
    expect(s[2].chips.map((c) => c.value)).toEqual(['compare', 'signing', 'bonus', 'equity', 'none', '__math__'])
    expect(s[2].events).toContainEqual({ name: 'ribbit_spending_check_shown', props: { turn: 'O3' } })
    expect(s[2].state).toMatchObject({ turn: 'O3', invited: true })
  })

  it('offer: the hourly path gets the same ask, once, and comparing another offer brings no second', async () => {
    const s = await run('offer', [{ chip: 'hourly' }, { text: '$19.50, 30 hours' }, { chip: 'Austin' }, { chip: 'compare' }, { text: '24' }])
    expect(s.flatMap((x) => x.messages).filter((m) => m.appAsk?.why === 'spending_check')).toHaveLength(1)
    expect(s[3].messages.filter((m) => m.appAsk?.why === 'spending_check')).toHaveLength(1)
    expect(facts(s[3]).rangeSpendingCheckShown).toBe(true)
  })

  it('offer: a planning question at "Which city is the job in?" brings the invite there, and the city take-home no second', async () => {
    const s = await run('offer', [{ text: '80000' }, { text: 'what should I do with my savings' }, { chip: 'Austin' }], planAsk)
    expect(s[2].messages.filter((m) => m.appAsk)).toHaveLength(1)
    expect(s[3].messages.some((m) => m.appAsk)).toBe(false)
    expect(s[3].events.map((e) => e.name)).not.toContain('ribbit_spending_check_shown')
  })

  it('offer: No match or Skip goes on to rent with no second spending check; the ending carries the plan ask', async () => {
    for (const steps of [
      [{ text: '85000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'none' }],
      [{ text: '85000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'skip' }],
    ]) {
      const s = await run('offer', steps)
      expect(s.flatMap((x) => x.messages).filter((m) => m.appAsk).map((m) => m.appAsk?.why)).toEqual(['spending_check'])
      expect(s[2].messages.some((m) => m.appAsk?.why === 'spending_check')).toBe(true)
      expect(said(s[s.length - 1])).toContain('Want to work that out properly?')
      const end = await reply(s[s.length - 1].state, { chip: 'later' }, svc())
      expect(end.messages.filter((m) => m.appAsk).map((m) => m.appAsk?.why)).toEqual(['plan_preview'])
    }
  })

  it('offer: the spending check after the 401k, then rent, and Later ends on the offer card', async () => {
    const s = await run('offer', [
      { text: '85000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'put_in' }, { chip: 'keep' }, { chip: 'later' },
    ])
    const check = s[6].messages.find((m) => m.appAsk)!
    expect(check.appAsk?.why).toBe('spending_check')
    expect(check.text).toContain('Want to check before you tell HR?')
    expect(check.appAsk?.note).toMatch(/^Free in WeLeap\. See last month's spending next to \$[\d,]+ take-home, before and after the 4%\.$/)
    expect(said(s[7])).toContain('Want to work that out properly?')
    const card = s[8].messages.find((m) => m.planCard)!
    expect(card.planCard!.known.map((r) => r.label)).toEqual(['Take-home in Austin', 'Offer worth, with the match', '401(k) at 4%', 'What the 4% costs you'])
    expect(card.planCard!.locked).toContain('Did the 4% actually come out?')
    expect(s[8].state.turn).toBe('O8')
  })

  it('at the picker the four choices stay up, captioned as tasks', async () => {
    const s = await run(null, [{ text: 'what is a roth ira' }])
    expect(s[1].chipsLabel).toBe('Or work out with Ribbit:')
    expect(s[1].chips.map((c) => c.label)).toEqual(['Rent I can afford', 'What an offer is worth', 'Where should my money go?', 'What my startup offer is worth'])
  })
})

describe('card payoff', () => {
  it('clears or says it never will', () => {
    expect(monthsToClear(3_000, 24, 350)).toBe(10)
    expect(monthsToClear(30_000, 24, 350)).toBe(Infinity)
  })
})

describe('Where should my money go?', () => {
  it('an hourly rate at the first question is pay, said back as the year it comes to', async () => {
    const s = await run('money', [{ text: '$18 an hour, 30 hours a week' }])
    expect(facts(s[1])).toMatchObject({ payBasis: 'hourly', hourlyRate: 18, hoursPerWeek: 30, salary: 28_080 })
    expect(said(s[1])).toMatch(/^At \$18 an hour, 30 hours a week, that's about \$28,080 a year, and take-home before state tax is about \$[\d,]+ a month\. Where do you live\?$/)
    const bare = await run('money', [{ chip: 'salary' }, { text: '95' }])
    expect(said(bare[2])).toBe('Is that $95 an hour, or $95,000 a year?')
    const year = await reply(bare[2].state, { text: 'a year' }, svc())
    expect(facts(year)).toMatchObject({ payBasis: 'salary', salary: 95_000 })
    expect(year.state.turn).toBe('M2')
  })

  it('"can I afford a car?" gets the offer; loan numbers typed instead fold into the question and get it once more', async () => {
    const asks: Array<{ flow: string; message: string }> = []
    const ask = svc({ ask: async ({ flow, message }) => {
      asks.push({ flow, message })
      return { kind: 'question' as const, reply: `answer to: ${message}`, plan: false }
    } })
    const s = await run(null, [
      { text: 'I want to see if I can afford to buy a car' }, { text: '20K, 14% APR, 5 years' }, { text: 'is that a lot?' },
      { chip: 'money' }, { text: '85000' }, { text: 'Texas' }, { text: '1600' }, { chip: 'none' }, { chip: 'unknown' },
    ], ask)
    // The reader called it a general question; the page still offers to work it out with their numbers.
    expect(s[1].messages.map((m) => m.text)).toEqual(['answer to: I want to see if I can afford to buy a car', MONEY_OFFER_TEXT])
    expect(s[2].messages.map((m) => m.text)).toEqual(['answer to: 20K, 14% APR, 5 years', MONEY_REOFFER_TEXT])
    expect(s[2].chips.map((c) => c.value)).toEqual(['money', 'not_now'])
    // Once in words; the chips stay.
    expect(s[3].messages.map((m) => m.text)).toEqual(['answer to: is that a lot?'])
    expect(s[3].chips.map((c) => c.value)).toEqual(['money', 'not_now'])
    expect(asks.at(-1)).toEqual({ flow: 'money', message: 'I want to see if I can afford to buy a car 20K, 14% APR, 5 years is that a lot?' })
  })

  it('with the offer on screen, a typed "yes" starts the money flow and a typed "no" is "Not now"', async () => {
    const asks: string[] = []
    const ask = svc({ ask: async ({ message }) => { asks.push(message); return { kind: 'question' as const, reply: `answer to: ${message}`, plan: false } } })
    const y = await run(null, [{ text: 'can I afford a car?' }, { text: 'yes' }], ask)
    expect(y[2].state.turn).toBe('M1')
    expect(asks).toEqual(['can I afford a car?'])
    const n = await run(null, [{ text: 'can I afford a car?' }, { text: 'no thanks' }, { text: '20K, 14% APR, 5 years' }], ask)
    expect(n[2].state.facts.moneyDeclined).toBe(true)
    expect(n[3].messages.map((m) => m.text)).toEqual(['answer to: 20K, 14% APR, 5 years'])
    // Without an offer on screen, "yes" is still a question for Ribbit.
    const bare = await run(null, [{ text: 'yes' }], ask)
    expect(bare[1].state.turn).toBe('P0')
  })

  it('the question that led to the order gets a line even when no answer comes back', async () => {
    const ask = svc({ ask: async ({ flow, message }) => (flow === 'money' ? null : { kind: 'question' as const, reply: `answer to: ${message}`, plan: true }) })
    const s = await run(null, [{ text: 'is now a good time to buy a car?' }, { chip: 'money' }, { text: '85000' }, { text: 'Texas' }, { text: '1600' }, { chip: 'none' }, { chip: 'unknown' }], ask)
    const texts = s[s.length - 1].messages.map((m) => m.text)
    expect(texts).toContain(MONEY_BACK_FAILED_TEXT)
  })

  it('"is now a good time?" and "I want to buy" questions get the offer even when Ribbit calls them general', async () => {
    const ask = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: false }) })
    for (const q of ['I want to buy a car, is now a good time?', 'thinking about buying a house', 'can I afford a $30k wedding?', 'Should I start saving for a house down payment?']) {
      const s = await run(null, [{ text: q }], ask)
      expect(s[1].chips.map((c) => c.value)).toEqual(['money', 'not_now'])
    }
  })

  it('"Not now" ends the money offer for the thread', async () => {
    const ask = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: false }) })
    const s = await run(null, [{ text: 'can I afford a car?' }, { chip: 'not_now' }, { text: '20K, 14% APR, 5 years' }], ask)
    expect(s[3].messages.map((m) => m.text)).toEqual(['answer to: 20K, 14% APR, 5 years'])
    expect(s[3].chipsLabel).toBe('Or work out with Ribbit:')
  })

  it('a question that led here (buying a car) is answered at the order, with the money numbers', async () => {
    const asks: Array<{ flow: string; message: string; money: boolean }> = []
    const carAsk = svc({ ask: async ({ flow, message, facts: f }) => {
      asks.push({ flow, message, money: Boolean(f.takeHomeMonthly) })
      return { kind: 'question' as const, reply: `answer to: ${message}`, plan: /car/i.test(message) }
    } })
    const s = await run(null, [
      { text: 'I want to buy a car, is now a good time?' }, { chip: 'money' },
      { text: '85000' }, { text: 'Texas' }, { text: '1600' }, { chip: 'none' }, { chip: 'unknown' },
    ], carAsk)
    expect(s[1].messages.map((m) => m.text)).toEqual(['answer to: I want to buy a car, is now a good time?', MONEY_OFFER_TEXT])
    const result = s[s.length - 1]
    const texts = result.messages.map((m) => m.text)
    // After the order, the car question again, answered by the reader with the four answers in hand.
    const order = texts.indexOf("Here's where your next dollar goes, in order.")
    // For someone who has already done the steps before retirement (the flow never asks what they have saved); the
    // order covers everyone else.
    const back = texts.findIndex((t) => /^Back to your question\. If you've already got your full 401\(k\) match and about \$[\d,]+ set aside: answer to: I want to buy a car, is now a good time\? If not, start with the order above\.$/.test(t ?? ''))
    expect(order).toBeGreaterThanOrEqual(0)
    expect(back).toBeGreaterThan(order)
    expect(back).toBeLessThan(texts.indexOf('Want me to keep this as your plan?'))
    expect(asks.at(-1)).toEqual({ flow: 'money', message: 'I want to buy a car, is now a good time?', money: true })
    // Once: a later step does not answer it again.
    expect(facts(result).moneyQuestion).toBeUndefined()
  })

  it('four questions, then the order worked out in code, then the plan card full of their numbers', async () => {
    const s = await run('money', [
      { text: '85000' }, { text: 'Texas' }, { text: '1600' }, { text: 'Card, 4000 at 22%, I pay 150' },
      { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'keep' },
    ])
    expect(said(s[0])).toContain("yearly salary, or your monthly take-home")
    expect(said(s[2])).toContain("What's your rent each month?")
    expect(facts(s[2]).takeHomeMonthly).toBeCloseTo(61_000 / 12, 0)
    expect(said(s[3])).toContain('Any card or loan balances?')
    expect(facts(s[4]).debt).toEqual({ balance: 4000, aprPct: 22, payment: 150, kind: 'card' })
    const order = s[6].messages.find((m) => m.order)!.order!
    expect(order.map((o) => o.key)).toEqual(['match', 'debt', 'emergency', 'retirement'])
    expect(order[0].detail).toMatch(/^Put in 4% of pay, \$283 a month, and your employer adds \$283\./)
    expect(s[6].chips.map((c) => c.value)).toEqual(['keep', '__math__'])
    const card = s[7].messages.find((m) => m.planCard)!
    expect(card.planCard!.known.map((r) => r.label)).toEqual(['Take-home', 'Rent', '401(k) at 4%, with the match', '22% debt', 'Emergency fund goal'])
    expect(card.appAsk).toEqual(expect.objectContaining({ why: 'plan_preview', textInstead: false }))
    expect(s[7].state.turn).toBe('M8')
  })

  it('a debt given in pieces is asked for what is missing, one thing at a time', async () => {
    const s = await run('money', [{ text: '5000' }, { text: '1500' }, { text: 'about 3000 on a card' }, { text: '24' }, { text: '120' }, { chip: 'none' }])
    expect(said(s[3])).toBe("What's the interest rate on the card?")
    expect(said(s[4])).toBe('What do you pay on the card a month?')
    expect(facts(s[5]).debt).toEqual({ balance: 3000, aprPct: 24, payment: 120, kind: 'card' })
    expect(s[6].messages.find((m) => m.order)!.order!.map((o) => o.key)).toEqual(['debt', 'emergency', 'retirement'])
  })

  it('from the picker, a planning question leads into the flow', async () => {
    const planAsk = svc({ ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}`, plan: true }) })
    const s = await run(null, [{ text: 'should I pay off my card or invest?' }, { chip: 'money' }], planAsk)
    expect(s[2].state.flow).toBe('money')
    expect(s[2].state.turn).toBe('M1')
  })

  it('after an offer turns into rent, the plan card keeps the 401(k) it worked out', async () => {
    const s = await run('offer', [{ text: '85000' }, { chip: 'Austin' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 4%' }, { chip: 'put_in' }, { chip: 'rent' }, { chip: 'yes' }])
    const f = facts(s[s.length - 1])
    expect(f.electionMonthlyIn).toBeGreaterThan(0)
    expect(s[s.length - 1].state.flow).toBe('rent')
  })

  it('"card", the Credit card button, or "yes" with no numbers is an answer: Ribbit asks for the balance, then the rest', async () => {
    for (const first of [{ text: 'card' }, { chip: 'card' }, { text: 'card balance' }]) {
      const s = await run('money', [{ chip: 'take_home' }, { text: '8561' }, { text: '2000' }, first, { text: '4200' }, { text: '24%' }, { text: '150' }])
      expect(said(s[4])).toBe("What's the balance on the card?")
      expect(said(s[5])).toBe("What's the interest rate on the card?")
      expect(said(s[6])).toBe('What do you pay on the card a month?')
      expect(facts(s[7]).debt).toEqual({ kind: 'card', balance: 4200, aprPct: 24, payment: 150 })
    }
    const y = await run('money', [{ text: '5000' }, { text: '1500' }, { text: 'yes' }])
    expect(said(y[3])).toBe("What's the balance on it?")
    expect(y[3].chips).toEqual([])
  })

  it('with take-home typed (no salary), the card still shows the match as a formula', async () => {
    const s = await run('money', [{ chip: 'take_home' }, { text: '8561' }, { text: '2000' }, { chip: 'none' }, { chip: 'known' }, { text: '100% up to 5%' }, { chip: 'keep' }])
    const card = s[7].messages.find((m) => m.planCard)!.planCard!
    expect(card.known).toContainEqual({ label: '401(k) match', value: '100% up to 5%' })
  })
})

describe('startup flow', () => {
  const field = (value: number) => ({ value, confidence: 0.9, quote: 'q' })
  const letter = {
    parsed: {
      baseSalaryAnnual: field(130_000), equityGrantShares: field(20_000), equityStrikePrice: field(1.1),
      equityVestYears: field(4), equityCliffMonths: field(12), equityType: { value: 'iso' as const, confidence: 0.9, quote: 'q' },
    },
  }

  it('reads grants and prices the way people type them', () => {
    expect(parseGrant('20,000 at $1.10')).toEqual({ shares: 20_000, strike: 1.1, rsu: false })
    expect(parseGrant('20k options, strike 1.10')).toEqual({ shares: 20_000, strike: 1.1, rsu: false })
    expect(parseGrant('20000 options vesting over 4 years at $1.10')).toEqual({ shares: 20_000, strike: 1.1, rsu: false })
    expect(parseGrant('20000 at 2')).toEqual({ shares: 20_000, strike: 2, rsu: false })
    expect(parseGrant('5,000 RSUs')).toEqual({ shares: 5_000, strike: undefined, rsu: true })
    expect(parseGrant('15000 options')).toEqual({ shares: 15_000, strike: undefined, rsu: false })
    expect(parseDecimal('$4.40 a share')).toBeCloseTo(4.4)
    expect(parseDecimal('20 million')).toBe(20_000_000)
    expect(parseDecimal('20m')).toBe(20_000_000)
    expect(parseDecimal('$88,000')).toBe(88_000)
  })

  it('typed: base pay, the grant, the payoff by S3, ownership, the break-even and the ending, with the spec\'s numbers', async () => {
    const s = await run('startup', [{ text: '130000' }, { text: '20,000 at $1.10' }, { text: '$4.40' }, { text: '20 million' }, { chip: 'yes' }, { text: '150000' }, { chip: 'none' }])
    expect(s[0].chips.map((c) => c.value)).toContain('__upload__')
    expect(said(s[1])).toContain('How many options or shares')
    const payoff = s[3].messages.find((m) => m.turn === 'S3')!
    expect(payoff.figure).toBe('About $0')
    expect(payoff.text).toContain('look like $88,000')
    expect(payoff.math).toContainEqual({ label: 'To buy all 20,000 shares', value: '$22,000' })
    expect(s[3].events.map((e) => e.name)).toContain('ribbit_win_shown')
    // The app ask right after the payoff, aimed at the cost to buy; S4 still follows.
    const check = s[3].messages.find((m) => m.appAsk)!
    expect(check.appAsk).toEqual({ label: 'Build my savings plan', why: 'shares_savings', note: 'Free in WeLeap. Built on your real paychecks and spending.' })
    expect(check.text).toBe("Buying them all costs $22,000, about $5,500 for each year that vests. Want a savings plan that makes room for it, built on what you actually earn and spend?")
    expect(s[3].state.turn).toBe('S4')
    expect(s[3].events).toContainEqual({ name: 'ribbit_spending_check_shown', props: { turn: 'S3' } })
    expect(s.slice(4).flatMap((x) => x.messages).filter((m) => m.appAsk?.why === 'shares_savings')).toHaveLength(0)
    expect(s[4].messages[0].figure).toBe('0.10%')
    expect(said(s[4])).toContain('about 0.06%')
    const be = s[6].messages.find((m) => m.turn === 'S5')!
    expect(be.figure).toBe('About $159M')
    expect(be.text).toContain('1.8 times its last valuation')
    // Benefits before the ending: the offer chat's 401k question, with its benefits-guide upload.
    expect(s[6].state.turn).toBe('O4')
    expect(s[6].chips.map((c) => c.value)).toContain('__upload_benefits__')
    expect(s[7].state.turn).toBe('S8')
    expect(said(s[7])).toContain('No match, so nothing to collect there.')
    // Everything was known, so the only question for the recruiter is the exercise window.
    expect(s[7].messages.find((m) => m.questions)!.questions!.map((q) => q.key)).toEqual(['window'])
    const card = s[7].messages.find((m) => m.planCard)!
    expect(card.appAsk?.textInstead).toBe(true)
    expect(card.planCard!.known).toContainEqual({ label: 'Share of the company', value: '0.10%' })
    // "Text me each step instead" opens the text door as a startup offer, on the offer thread (payload below).
    const door = await reply(s[7].state, { chip: 'text' }, svc())
    expect(door.state.turn).toBe('S8')
    expect(door.messages.some((m) => m.handoff === 'startup')).toBe(true)
    // Every startup figure rides on the offer payload, for the text thread and typed questions.
    const plan = startupPlanData(facts(s[7]))!
    expect(plan.salary).toBe(130_000)
    expect((plan.figures as Record<string, unknown>).startup).toMatchObject({
      grantShares: 20_000, strike: 1.1, pricePerShare: 4.4, valueAtLastRound: 88_000, costToBuyAllShares: 22_000,
      sharesOutstanding: 20_000_000, lastValuation: 88_000_000, otherOfferSalary: 150_000, futureRoundsAssumed: 2, dilutionPerRoundPct: 20,
    })
    expect((plan.figures as Record<string, Record<string, number>>).startup).toMatchObject({ breakEvenSalePrice: 159_375_000, ownershipPct: 0.1, ownershipAfterFutureRoundsPct: 0.064 })
  })

  it('an uploaded letter is read back, skips the typed grant and goes straight to the price', async () => {
    const s = await run('startup', [{ letter }, { text: '$4.40 a share' }])
    const back = s[1].messages[0]
    expect(back.math).toContainEqual({ label: 'Grant', value: '20,000 ISOs' })
    expect(back.math).toContainEqual({ label: 'Strike price', value: '$1.10' })
    expect(back.math).toContainEqual({ label: 'Vesting', value: '4 years, 1-year cliff' })
    expect(s[1].state.turn).toBe('S3')
    expect(s[1].chips.map((c) => c.value)).toContain('fix')
    expect(s[1].events.map((e) => e.name)).toContain('ribbit_letter_read')
    expect(facts(s[1]).salary).toBe(130_000)
    expect(s[2].messages.find((m) => m.turn === 'S3')!.figure).toBe('About $0')
  })

  it("a letter that can't be read keeps the question open, with a reason and no guess", async () => {
    const s = await run('startup', [{ letter: { failed: 'too_large' } }])
    expect(said(s[1])).toContain('over 4MB')
    expect(s[1].state.turn).toBe('S1')
    expect(s[1].chips.map((c) => c.value)).toContain('__upload__')
  })

  it("the recruiter's dollar figure becomes a price per share; not knowing the shares goes to the 401k, then the certain costs", async () => {
    const s = await run('startup', [{ text: '130k' }, { text: '20000 at 1.10' }, { chip: 'dollar' }, { text: '$88,000' }, { chip: 'unknown' }, { text: '100% up to 4%' }])
    expect(facts(s[4]).pricePerShare).toBeCloseTo(4.4)
    expect(said(s[5])).toContain("I've put it on your list of questions for the recruiter.")
    expect(s[5].state.turn).toBe('O4')
    const certain = s[6].messages.find((m) => m.turn === 'S6')!
    expect(certain.math).toContainEqual({ label: 'Nothing vests until', value: 'month 12' })
    expect(certain.math).toContainEqual({ label: 'If you leave', value: 'usually 90 days to buy' })
    expect(s[6].state.turn).toBe('S8')
    // A known match: what the pay and match come to, on the card too; no offer-only "What should I put in".
    expect(s[6].messages[0].text).toContain('With that match, the offer is worth')
    expect(s[6].chips).toEqual([])
    expect(s[6].messages.find((m) => m.planCard)!.planCard!.known.map((r) => r.label)).toContain('Pay and match')
    expect(s[6].messages.find((m) => m.questions)!.questions!.map((q) => q.key)).toEqual(['shares', 'window'])
  })

  it("every \"I don't know\" goes on the recruiter list, said when it comes up, listed and copyable at the end (Vinod's run)", async () => {
    const noStrike = { parsed: { baseSalaryAnnual: field(200_000), equityGrantShares: field(2_132), equityVestYears: field(4), equityCliffMonths: field(12) } }
    const s = await run('startup', [{ letter: noStrike }, { chip: 'unknown' }, { chip: 'dollar' }, { text: '80000' }, { chip: 'unknown' }, { chip: 'unknown' }])
    expect(s[1].state.turn).toBe('S2_strike')
    expect(s[2].messages[0].text).toBe("No problem. I've put it on your list of questions for the recruiter.")
    expect(said(s[5])).toContain("I've put it on your list")
    expect(s[5].state.turn).toBe('O4')
    expect(said(s[6])).toContain("I've put it on your list")
    const list = s[6].messages.find((m) => m.questions)!
    expect(list.turn).toBe('S7')
    expect(list.questions!.map((q) => q.title)).toEqual([
      "What's the strike price on my options?",
      'How many fully diluted shares are outstanding?',
      'If I leave, how long do I have to buy my vested options?',
      'Is there a 401k match, and when does it vest?',
    ])
    expect(s[6].events).toContainEqual({ name: 'ribbit_recruiter_questions_shown', props: { turn: 'S7', count: 4, keys: 'strike,shares,window,match' } })
    // The list goes to the text thread with the rest of the figures.
    expect(((startupPlanData(facts(s[6]))!.figures as Record<string, Record<string, unknown>>).startup.recruiterQuestions as string[])).toHaveLength(4)
    // Not knowing the last round's price goes on the list too.
    const p = await run('startup', [{ text: '130000' }, { text: '20,000 at $1.10' }, { chip: 'unknown' }])
    expect(said(p[3])).toContain("I've put it on your list")
    expect(facts(p[3]).recruiterAsks).toEqual(['price'])
  })

  it('a benefits guide uploaded in a startup thread goes to the ending', async () => {
    const s = await run('startup', [{ text: '130000' }, { text: '20,000 at $1.10' }, { text: '$4.40' }, { chip: 'unknown' }, { benefits: { parsed: { matchRatePct: field(50), matchUpToPct: field(6) } } }])
    expect(s[4].state.turn).toBe('O4')
    expect(s[5].messages[0].math).toContainEqual({ label: '401k match', value: '50% up to 6% of salary' })
    expect(s[5].state.turn).toBe('S8')
  })

  it('no other offer: payouts at the last valuation and above', async () => {
    const s = await run('startup', [{ text: '130000' }, { text: '20,000 at $1.10' }, { text: '4.40' }, { text: '20000000' }, { chip: 'no' }])
    const sc = s[5].messages.find((m) => m.turn === 'S5')!
    expect(sc.math).toEqual([
      { label: 'If it sells for $88M', value: 'about $34,000' },
      { label: 'If it sells for $264M', value: 'about $147,000' },
      { label: 'If it sells for $880M', value: 'about $541,000' },
    ])
  })

  it('a strike missing from the grant is asked; RSUs have no strike and no cost to buy', async () => {
    const a = await run('startup', [{ text: '130000' }, { text: '20000 options' }, { chip: 'unknown' }, { text: '4.40' }])
    expect(said(a[2])).toContain("What's the strike price?")
    expect(a[4].messages.find((m) => m.turn === 'S3')!.text).toContain('The strike is on your list for the recruiter.')
    const r = await run('startup', [{ text: '130000' }, { text: '5000 RSUs' }, { text: '$10' }])
    expect(r[3].messages.find((m) => m.turn === 'S3')!.text).toContain('RSUs come to $50,000')
    // No cost to name, so no app ask after the payoff: not for RSUs, not for an unknown strike.
    expect(r[3].messages.some((m) => m.appAsk)).toBe(false)
    expect(a[4].messages.some((m) => m.appAsk)).toBe(false)
  })

  it('the offer flow\'s Equity chip asks public or startup; startup moves to the grant with the pay kept', async () => {
    const s = await run('offer', [{ text: '130000' }, { chip: 'Austin' }, { chip: 'equity' }, { chip: 'startup' }])
    expect(said(s[3])).toBe('Public company stock or startup options?')
    expect(s[4].state.flow).toBe('startup')
    expect(s[4].state.turn).toBe('S2')
    expect(facts(s[4]).salary).toBe(130_000)
    expect(s[4].events.map((e) => e.name)).toContain('ribbit_startup_branch')
    const pub = await run('offer', [{ text: '130000' }, { chip: 'Austin' }, { chip: 'equity' }, { chip: 'public' }, { text: '20000' }])
    expect(facts(pub[5]).rsuAnnual).toBe(20_000)
  })

  it('the picker offers it, tapped or typed', async () => {
    expect(start(null).chips.map((c) => c.value)).toContain('startup')
    const s = await run(null, [{ text: 'my startup offer' }])
    expect(s[1].state.flow).toBe('startup')
    expect(s[1].state.turn).toBe('S1')
  })
})
