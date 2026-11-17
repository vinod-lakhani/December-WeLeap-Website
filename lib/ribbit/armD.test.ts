import { describe, expect, it, vi } from 'vitest'

import { D_CARD_QUESTION, D_MATCH_QUESTION, D_SIGNUP_EARLY_TEXT, D_SIGNUP_TEXT, cardMinimum, dAccountPlan, monthsToClear, reply, start, type ChatServices, type NetWorthPreviewInput, type Reply, type Step } from './engine'
import { ribbitPlanParams } from './appLink'
import { previewRequest, previewValues } from './preview'
import { cleanAnswers, signInAndSave } from './accountSave'

/** Rent arm D: the chat as onboarding (Nov 16 2026 mock-up "Rent chat arm d"). */
const TX = { netIncomeAnnual: 57_360, federalTaxAnnual: 8_670, stateTaxAnnual: 0, ficaTaxAnnual: 5_470, taxSource: 'test' }
const series = (end: number) => Array.from({ length: 41 }, (_, i) => Math.round((end * i * i) / 1600))

function services(over: Partial<ChatServices> = {}) {
  const previews: NetWorthPreviewInput[] = []
  const s: ChatServices = {
    tax: async () => TX,
    metros: async () => [],
    medianRent: async () => 1_700,
    ask: async ({ message }) => ({ kind: 'question' as const, reply: `answer to: ${message}` }),
    preview: async (input) => {
      previews.push(input)
      return series(input.k401 ? 3_000_000 : input.emergencyFund ? 1_600_000 : 1_650_000)
    },
    ...over,
  }
  return { s, previews }
}

async function runD(replies: Reply[], s: ChatServices): Promise<Step[]> {
  const first = start('rent')
  const steps: Step[] = [{ ...first, state: { ...first.state, rentArm: 'd' } }]
  for (const r of replies) steps.push(await reply(steps[steps.length - 1].state, r, s))
  return steps
}
const named = (step: Step, name: string) => step.events.filter((e) => e.name === name)
const sumRows = (rows: { value: string }[]) => rows.reduce((t, r) => t + Number(r.value.replace(/[^0-9.]/g, '')), 0)

const HAPPY: Reply[] = [{ text: '71500' }, { chip: 'Austin' }, { chip: 'grow' }, { chip: 'saved_1k_3k' }, { chip: 'yes' }, { chip: '5' }, { chip: 'card_2k_5k' }, { chip: 'plan' }, { chip: '__signed_in__', signedIn: { emailed: true } }]

describe('rent arm D', () => {
  it('asks nothing of the app before the plan: the range, then the city', async () => {
    const { s } = services()
    const [, r1] = await runD([{ text: '71500' }], s)
    expect(r1.messages.some((m) => m.appAsk)).toBe(false)
    expect(r1.state.invited).toBeFalsy()
    expect(r1.messages.at(-1)?.text).toBe('Which city?')
  })

  it('runs from the 50/30/20 month to the sign-up card, every input a tap', async () => {
    const { s, previews } = services()
    const st = await runD(HAPPY, s)
    const [, , city, grow, saved, , cap, card, plan, signed] = st

    // The city: the month at the range's middle, needs + wants + savings = take-home.
    const take = Math.round(city.state.facts.takeHomeMonthly!)
    const split = city.messages.find((m) => m.planCard)!.planCard!
    expect(sumRows(split.known)).toBe(take)
    expect(named(city, 'ribbit_plan_split_shown')).toHaveLength(1)
    const savings = Number(split.known[2].value.replace(/[^0-9]/g, ''))

    // The reveal: the backend's figure on the default split with nothing saved yet.
    expect(previews[0]).toMatchObject({ savings, emergencyFund: 0, efMonths: 3 })
    expect(Object.values(previews[0].savingsBreakdown).reduce((a, b) => a + b, 0)).toBe(savings)
    expect(grow.messages.find((m) => m.growth)?.growth?.values).toHaveLength(41)
    expect(named(grow, 'ribbit_networth_shown')).toHaveLength(1)

    // Leap 1, the safety net: 40% of savings until three months of needs.
    const ef1 = saved.messages.find((m) => m.key === 'leap_ef')!
    expect(ef1.planCard?.badge).toBe('Leap 1 · Safety net')
    expect(ef1.planCard?.known.find((r) => r.label === 'Each month')?.value).toBe(`$${Math.round(savings * 0.4).toLocaleString('en-US')}`)
    expect(saved.messages.at(-1)?.text).toBe(D_MATCH_QUESTION)

    // Leap 2, the match: Leap 1 comes back with the same key and a smaller monthly amount (the match goes first).
    const ef2 = cap.messages.find((m) => m.key === 'leap_ef')!
    const each = (m: typeof ef2) => Number(m.planCard!.known.find((r) => r.label === 'Each month')!.value.replace(/[^0-9]/g, ''))
    expect(each(ef2)).toBeLessThan(each(ef1))
    expect(cap.messages.find((m) => m.planCard?.badge === 'Leap 2 · Free money')?.planCard?.title).toBe('Put 5% into your 401(k)')
    expect(cap.messages.at(-1)?.text).toBe(D_CARD_QUESTION)

    // Leap 3, the card: faster than the minimum.
    const c = card.messages.find((m) => m.planCard?.badge === 'Leap 3 · Debt')!
    expect(c.planCard!.title).toMatch(/^Clear the card at \$\d+ a month$/)
    const pay = Number(c.planCard!.title!.replace(/[^0-9]/g, ''))
    expect(pay).toBeGreaterThanOrEqual(cardMinimum(3_500, 17))
    expect(monthsToClear(3_500, 17, pay)).toBeLessThan(monthsToClear(3_500, 17, cardMinimum(3_500, 17)))

    // The plan: with and without, both from the backend; the rows spend exactly the month's savings.
    expect(previews.slice(1).map((p) => Boolean(p.k401))).toEqual([true, false])
    const withLeaps = previews[1]
    expect(withLeaps.card?.balance).toBe(3_500)
    expect(Object.values(withLeaps.savingsBreakdown).reduce((a, b) => a + b, 0)).toBe(savings)
    const shown = plan.messages.find((m) => m.figure)!
    expect(shown.figureLabel).toMatch(/^With your 3 leaps, by \d{4}$/)
    expect(sumRows(shown.planCard!.known)).toBe(savings)
    expect(plan.messages.at(-1)).toMatchObject({ text: D_SIGNUP_TEXT, signup: true })
    expect(named(plan, 'ribbit_inline_signup_shown').map((e) => e.props)).toEqual([{ turn: 'R4', position: 'end', leaps: 3 }])

    // Signed in: the first move, and three things to ask next.
    expect(signed.messages[0].text).toBe("You're in. Your plan and your 3 leaps are saved in WeLeap, and I emailed you a copy.")
    expect(signed.messages[1].text).toMatch(/^Your first move is Leap 1: set aside \$\d+ a month for your safety net\. Leap 2 is a 5-minute change/)
    expect(signed.chips.map((x) => x.value)).toEqual(['pw_wants', 'pw_offer', 'pw_years'])
    for (const step of st) for (const m of step.messages) expect(m.text).not.toMatch(/—/)
  })

  it('saves the plan the app sets itself up from, and the email link carries it', async () => {
    const { s } = services()
    const st = await runD(HAPPY.slice(0, 8), s)
    const f = st.at(-1)!.state.facts
    const { answers, rows } = dAccountPlan(f)
    const split = answers.savingsBreakdown as Record<string, number>
    expect(Object.keys(split).sort()).toEqual(['debtPaydown', 'emergencyFund', 'employeeTraditional401k', 'investing', 'traditionalIRA'])
    expect(Object.values(split).reduce((a, b) => a + b, 0)).toBe(Math.round(f.takeHomeMonthly!) - Math.round(f.takeHomeMonthly! * 0.5) - Math.round(f.takeHomeMonthly! * 0.3))
    expect(answers).toMatchObject({ salary: 71_500, state: 'TX', matchRatePct: 100, matchUpToPct: 5, debtBalance: 3_500, debtRatePct: 17, debtKind: 'card', savingsToday: 2_000, efTargetMonths: 3, rentArm: 'd' })
    expect(rows.find((r) => r.label.startsWith('Net worth by'))).toBeTruthy()
    // What the server route passes on is the same.
    expect(cleanAnswers(answers)).toEqual(answers)
    const p = ribbitPlanParams(f, 'rent', 'inline_signup', 't1', 'd')
    expect(p).toMatchObject({ arm: 'd', why: 'inline_signup', ef_months: '3', saved: '2000', debt_balance: '3500', debt_rate: '17', debt_kind: 'card', match_rate: '100', match_cap: '5' })
    expect(p.split!.split(',').map((kv) => kv.split(':')[0]).sort()).toEqual(Object.keys(split).sort())
  })

  it('without the backend: no figures made up, the leaps and the sign-up still come', async () => {
    const { s } = services({ preview: async () => null })
    const st = await runD(HAPPY.slice(0, 8), s)
    expect(st[3].messages.some((m) => m.growth)).toBe(false)
    expect(named(st[3], 'ribbit_networth_failed')).toHaveLength(1)
    const plan = st.at(-1)!
    expect(plan.messages.some((m) => m.figure)).toBe(false)
    expect(plan.messages.at(-1)?.signup).toBe(true)
    expect(dAccountPlan(plan.state.facts).rows.some((r) => r.label.startsWith('Net worth'))).toBe(false)
  })

  it('a typed take-home skips the match (it is priced from a salary); a full safety net is no leap', async () => {
    const { s } = services()
    const st = await runD([{ chip: 'take_home' }, { text: '4800' }, { chip: 'Austin' }, { chip: 'grow' }, { chip: 'saved_10k_plus' }], s)
    const last = st.at(-1)!
    expect(last.messages.at(-1)?.text).toBe(D_CARD_QUESTION)
    expect(last.messages.find((m) => m.key === 'leap_ef')?.text).toMatch(/already covered/)
    const end = await reply(last.state, { chip: 'card_none' }, s)
    const plan = await reply(end.state, { chip: 'plan' }, s)
    expect(plan.messages.find((m) => m.figure)?.figureLabel).toMatch(/^Your plan, by/)
  })

  it('leaps that do not come out ahead are not shown as a loss (a safety net alone, Nov 16 test)', async () => {
    let calls = 0
    // Call 1 is the reveal; then the plan's "with" and "without", in that order.
    const { s } = services({ preview: async () => series([1_900_000, 1_940_523, 1_962_128][Math.min(calls++, 2)]) })
    const st = await runD([{ text: '71500' }, { chip: 'Austin' }, { chip: 'grow' }, { chip: 'saved_under_1k' }, { chip: 'no' }, { chip: 'card_none' }, { chip: 'plan' }], s)
    const plan = st.at(-1)!
    const shown = plan.messages.find((m) => m.figure)!
    expect(shown.figureLabel).toMatch(/^With your 1 leap, by/)
    expect(shown.text).not.toMatch(/Without them/)
    expect(named(plan, 'ribbit_plan_networth_shown')[0].props).toMatchObject({ leaps: 1, with_leaps: 1_940_523, without_leaps: 1_962_128, compared: false })
    const happy = (await runD(HAPPY.slice(0, 8), services().s)).at(-1)!
    expect(happy.messages.find((m) => m.figure)!.text).toMatch(/^Without them/)
    expect(named(happy, 'ribbit_plan_networth_shown')[0].props).toMatchObject({ compared: true })
  })

  it('reads typed answers, and sends anything else to Ribbit', async () => {
    const { s } = services()
    const st = await runD([{ text: '71500' }, { chip: 'Austin' }, { chip: 'grow' }, { text: 'about 2k' }, { text: 'not sure' }, { text: 'nope' }], s)
    expect(st[4].state.facts.savedToday).toBe(2_000)
    expect(st[5].state.facts.dMatch).toBe('unsure')
    expect(st[5].messages[0].text).toMatch(/^Worth asking HR/)
    expect(st[6].state.facts.card).toBeNull()
    const asked = await reply(st[3].state, { text: 'what is an emergency fund' }, s)
    expect(asked.messages[0].text).toBe('answer to: what is an emergency fund')
    expect(asked.state.turn).toBe('R2d_saved')
  })

  it('offers the sign-up on the 50/30/20 month, right after the answer, without gating what comes next', async () => {
    const { s } = services()
    const [, , city] = await runD(HAPPY.slice(0, 2), s)
    expect(city.messages.at(-1)).toMatchObject({ text: D_SIGNUP_EARLY_TEXT, signup: true })
    expect(named(city, 'ribbit_inline_signup_shown').map((e) => e.props)).toEqual([{ turn: 'R3', position: 'early', leaps: 0 }])
    expect(city.chips.map((c) => c.value)).toEqual(['grow', '__math__'])
    expect(city.state).toMatchObject({ turn: 'R2d', invited: true })

    // Skipped: the leaps and the end card come as before.
    const skipped = await runD(HAPPY.slice(0, 8), s)
    expect(skipped.at(-1)!.messages.at(-1)).toMatchObject({ text: D_SIGNUP_TEXT, signup: true })

    // Typed instead: Ribbit answers and the card stays open.
    const asked = await reply(city.state, { text: 'is 20% enough' }, s)
    expect(asked.state.turn).toBe('R2d')
  })

  it('signed up early: saved, then on to the net worth and leaps, and the end opens the app instead of asking again', async () => {
    const { s } = services()
    const st = await runD([...HAPPY.slice(0, 2), { chip: '__signed_in__', signedIn: { emailed: false } }, ...HAPPY.slice(2, 8)], s)
    const early = st[3]
    expect(early.state.facts.signedUp).toBe(true)
    expect(early.messages[0].text).toBe("You're in. Your plan is saved in WeLeap.")
    expect(early.chips.map((c) => c.value)).toEqual(['grow', '__math__'])
    expect(named(st[4], 'ribbit_networth_shown')).toHaveLength(1)
    const end = st.at(-1)!
    expect(end.messages.some((m) => m.signup)).toBe(false)
    expect(named(end, 'ribbit_inline_signup_shown')).toHaveLength(0)
    expect(end.messages.at(-1)?.appAsk).toMatchObject({ why: 'saved_plan' })
    expect(named(end, 'ribbit_app_ask_shown')).toHaveLength(1)
    expect(end.state.turn).toBe('R2d_in')
    expect(end.chips.map((c) => c.value)).toEqual(['pw_wants', 'pw_offer', 'pw_years'])
    for (const step of st) for (const m of step.messages) expect(m.text).not.toMatch(/—/)
  })

  it('after sign-up: the wants and years chips point at the saved plan; the offer chip opens the offer chat', async () => {
    const { s } = services()
    const st = await runD(HAPPY, s)
    const wants = await reply(st.at(-1)!.state, { chip: 'pw_wants' }, s)
    expect(wants.messages[0].appAsk).toMatchObject({ why: 'saved_plan' })
    expect(wants.chips.map((c) => c.value)).toEqual(['pw_offer', 'pw_years'])
    expect(named(wants, 'ribbit_postsignup_question_asked')[0].props).toMatchObject({ chip_kind: 'wants' })
    const offer = await reply(wants.state, { chip: 'pw_offer' }, s)
    expect(offer.state).toMatchObject({ flow: 'offer', turn: 'O1' })
  })
})

describe('arm D server side', () => {
  it('builds the backend preview request and reads its points', () => {
    const req = previewRequest({ needs: 2_390, wants: 1_434, savings: 956, savingsBreakdown: { emergencyFund: 295, debtPaydown: 177, junk: 5 }, efMonths: 3, emergencyFund: 2_000, annualGross: 71_500, k401: { pct: 5, matchRatePct: 100, matchUpToPct: 5 }, card: { balance: 3_500, aprPct: 17, minimum: 85 } })!
    expect(req).toMatchObject({
      incomeAllocation: { needs: 2_390, wants: 1_434, savings: 956 },
      savings: { efTargetMonths: 'EF_TARGET_MONTHS_3', employeeContributes401k: true, employeeContributionPercent: 5, employerMatchLimit: 100, employerMatchUpToPayPercent: 5 },
      liabilities: [{ liabilityType: 'credit_card', currentBalance: 3_500, interestRate: 17, minimumPayment: 85 }],
      annualGross: 71_500, emergencyFundBalance: 2_000,
    })
    expect(JSON.parse((req.incomeAllocation as { savingsBreakdown: string }).savingsBreakdown)).toEqual({ emergencyFund: 295, debtPaydown: 177 })
    expect(previewRequest({ needs: -1, wants: 1, savings: 1, savingsBreakdown: {} })).toBeNull()
    expect(previewRequest('nope')).toBeNull()
    expect(previewValues({ netWorthProjections: [{ year: 1, value: 20 }, { value: 10 }, { year: 2, value: 30 }] })).toEqual([10, 20, 30])
    expect(previewValues({})).toBeNull()
  })

  it('logs in, or signs up when there is no account, then saves the plan with the session', async () => {
    const calls: string[] = []
    const call = vi.fn(async (rpc: string, body: Record<string, unknown>, token?: string) => {
      calls.push(`${rpc}${token ? `:${token}` : ''}`)
      if (rpc === 'Login') return { status: 404, json: { code: 'not_found' } }
      if (rpc === 'Signup') return { status: 200, json: { token: 'jwt' } }
      expect(body).toMatchObject({ flow: 'rent', threadId: 't1', answers: { rentArm: 'd' } })
      return { status: 200, json: { sent: true } }
    })
    expect(await signInAndSave(call, { idToken: 'id', thread: 't1', answers: { rentArm: 'd' }, rows: [] })).toEqual({ ok: true, isNew: true, emailed: true })
    expect(calls).toEqual(['Login', 'Signup', 'SaveRibbitPlan:jwt'])

    const existing = vi.fn(async (rpc: string) => (rpc === 'Login' ? { status: 200, json: { token: 'jwt2' } } : { status: 200, json: {} }))
    expect(await signInAndSave(existing, { idToken: 'id', thread: '', answers: {}, rows: [] })).toEqual({ ok: true, isNew: false, emailed: false })

    const down = vi.fn(async () => ({ status: 503, json: { code: 'unavailable' } }))
    expect(await signInAndSave(down, { idToken: 'id', thread: '', answers: {}, rows: [] })).toMatchObject({ ok: false, stage: 'login' })
    const saveFails = vi.fn(async (rpc: string) => (rpc === 'Login' ? { status: 200, json: { token: 'j' } } : { status: 500, json: { code: 'internal' } }))
    expect(await signInAndSave(saveFails, { idToken: 'id', thread: '', answers: {}, rows: [] })).toMatchObject({ ok: false, stage: 'save' })
  })
})
