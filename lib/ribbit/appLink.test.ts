import { afterEach, describe, expect, it, vi } from 'vitest'

import { SPLIT_CAMPAIGN, SPLIT_TEXT_INSTEAD, STORE_ASK, appDestination, askRoute, assignArm, markPlanSaved, phoneAsk, plainAsk, planSaved, ribbitPlanParams, ribbitStoreLink, type AppReason } from './appLink'

describe('the chat-to-app link contract', () => {
  it('carries the rent plan as the app reads it, and leaves out what was not given', () => {
    const p = ribbitPlanParams({
      salary: 71_500, takeHomeFrom: 'salary', takeHomeMonthly: 4_928.4, stateCode: 'WA', place: 'Seattle', pick: 1_400,
      debtMonthly: 200, start: 'next_month', upfront: { low: 4_200, high: 4_900 }, perCheck: 163, purpose: 'cushion',
    }, 'rent', 'plan_preview', 'thread-1')
    expect(p).toEqual({
      src: 'ribbit_chat', why: 'plan_preview', rt: 'thread-1', flow: 'rent', salary: '71500', takehome: '4928',
      state: 'WA', city: 'Seattle', rent: '1400', debt: '200', start: 'next_month', upfront: '4900', percheck: '163', purpose: 'cushion',
    })
  })

  it('a typed take-home sends no salary, a start date goes as the date, and the offer terms only when entered', () => {
    expect(ribbitPlanParams({ takeHomeFrom: 'typed', salary: 5_000, takeHomeMonthly: 5_000, start: 'date', startDate: '2026-12-01' }, 'rent', 'spending_check', '')).toEqual({
      src: 'ribbit_chat', why: 'spending_check', flow: 'rent', takehome: '5000', start: '2026-12-01',
    })
    const offer = ribbitPlanParams({
      salary: 85_000, takeHomeFrom: 'salary', takeHomeMonthly: 5_719, match: 'known', matchRatePct: 100, matchUpToPct: 4,
      electionMonthlyIn: 566.7, electionCost: 221.2,
    }, 'offer', 'plan_preview', 't')
    expect(offer).toEqual(expect.objectContaining({ match_rate: '100', match_cap: '4', k401_monthly: '567', k401_cost: '221', flow: 'offer' }))
    expect(ribbitPlanParams({ match: 'unknown', matchUpToPct: 4 }, 'offer', 'plan_preview', 't').match_cap).toBeUndefined()
  })

  it('the rent range goes with a rent link, so a plan saved before any pick still has it', () => {
    const p = ribbitPlanParams({ takeHomeFrom: 'salary', salary: 63_000, takeHomeMonthly: 4_205, stateCode: 'MA', place: 'Boston', range: { low: 1_175, high: 1_475, formatted: '$1,175–$1,475' } }, 'rent', 'rent_answer', 't')
    expect(p).toEqual(expect.objectContaining({ why: 'rent_answer', rent_low: '1175', rent_high: '1475' }))
    expect(p.rent).toBeUndefined()
    expect(ribbitPlanParams({ range: { low: 1_175, high: 1_475, formatted: '' } }, 'offer', 'plan_preview', 't').rent_low).toBeUndefined()
  })

  it('a general question carries only the amount mentioned', () => {
    expect(ribbitPlanParams({ mentionedSaving: 1_000 }, null, 'plan_invite', 't')).toEqual({
      src: 'ribbit_chat', why: 'plan_invite', rt: 't', flow: 'general', saving: '1000',
    })
  })
})

describe('remembering a tapped Save my plan, for "Open my plan"', () => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
  afterEach(() => { store.clear(); vi.useRealTimers() })

  it('is unset until a Save tap, then holds the flow', () => {
    expect(planSaved()).toBeNull()
    markPlanSaved('rent')
    expect(planSaved()?.flow).toBe('rent')
  })

  it('lapses after 90 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-26T12:00:00Z'))
    markPlanSaved(null)
    expect(planSaved()?.flow).toBe('general')
    vi.setSystemTime(new Date('2027-01-25T12:00:00Z'))
    expect(planSaved()).toBeNull()
  })

  it('a broken or missing store offers nothing rather than throwing', () => {
    store.set('weleap.ribbitChat.planSaved.v1', '{not json')
    expect(planSaved()).toBeNull()
  })

  it('the money flow carries its debt plan and emergency fund goal', () => {
    const p = ribbitPlanParams({
      salary: 85_000, takeHomeFrom: 'salary', takeHomeMonthly: 5_719, stateCode: 'TX', pick: 1_600,
      debt: { balance: 4_000, aprPct: 22, payment: 150, kind: 'card' }, match: 'known', matchRatePct: 100, matchUpToPct: 4,
      electionMonthlyIn: 566, electionCost: 221, contributionMonthly: 283,
    }, 'money', 'plan_preview', 't')
    expect(p).toEqual(expect.objectContaining({
      flow: 'money', rent: '1600', takehome: '5719', state: 'TX', match_cap: '4', k401_monthly: '566',
      debt_balance: '4000', debt_rate: '22', debt_pay: '375', debt_months: '12', ef_goal: '8600', debt_kind: 'card', debt_now: '150',
    }))
    expect(ribbitPlanParams({ takeHomeMonthly: 5_000 }, 'rent', 'plan_preview', 't').ef_goal).toBeUndefined()
  })
})

describe('phones go to the store (Nov 4)', () => {
  it('sends iPhone to the App Store, Android to Play, everything else to the web app', () => {
    expect(appDestination('ios')).toBe('app_store')
    expect(appDestination('android')).toBe('google_play')
    expect(appDestination(null)).toBe('web')
  })

  it('App Store: campaign token is the flow alone, with the Meta paycheck product page', () => {
    const u = new URL(ribbitStoreLink('rent', 'app_store'))
    expect(u.hostname).toBe('apps.apple.com')
    expect(u.searchParams.get('ct')).toBe('ribbit_rent')
    expect(u.searchParams.get('pt')).toBeTruthy()
    expect(u.searchParams.get('ppid')).toBe('df7f34a1-7955-431b-9354-eac1b36ec89b')
    expect(new URL(ribbitStoreLink('offer', 'app_store')).searchParams.get('ct')).toBe('ribbit_offer')
    expect(new URL(ribbitStoreLink(null, 'app_store')).searchParams.get('ct')).toBe('ribbit_general')
  })

  it('Google Play: the tags ride on the listing URL and in the Install Referrer', () => {
    const u = new URL(ribbitStoreLink('offer', 'google_play'))
    expect(u.searchParams.get('id')).toBe('ai.weleap.app')
    expect(u.searchParams.get('utm_source')).toBe('ribbit_chat')
    expect(u.searchParams.get('utm_campaign')).toBe('ribbit_offer')
    const referrer = new URLSearchParams(u.searchParams.get('referrer') ?? '')
    expect(referrer.get('utm_source')).toBe('ribbit_chat')
    expect(referrer.get('utm_campaign')).toBe('ribbit_offer')
  })

  it('says the app in the note, never the plan, in plain words', () => {
    for (const note of Object.values(STORE_ASK.note)) {
      expect(note).not.toMatch(/\u2014|Leap|Ribbit|plan/i)
      expect(note).toMatch(/^Free (iPhone|Android) app\./)
    }
  })

  // The asks as engine.ts makes them (web labels), with what a phone shows instead.
  const ASKS: { ask: { label: string; why: AppReason; note?: string; quiet?: boolean; textInstead?: boolean }; phone: string }[] = [
    { ask: { label: 'Check it against my real spending', why: 'spending_check', note: 'web note' }, phone: 'Check it against my real spending' },
    { ask: { label: 'Build my savings plan', why: 'shares_savings', note: 'web note' }, phone: 'Build my savings plan' },
    { ask: { label: 'Save my plan and unlock the rest', why: 'plan_preview', note: 'No forms: the rows above come with you.', textInstead: true }, phone: 'Build my full plan' },
    { ask: { label: 'Click to get WeLeap', why: 'account' }, phone: 'Click to get WeLeap' },
    { ask: { label: 'Click to get WeLeap', why: 'plan_invite' }, phone: 'Click to get WeLeap' },
    { ask: { label: 'Get my plan', why: 'benefit', quiet: true }, phone: 'Get my plan' },
    { ask: { label: 'A future ask', why: 'rent_answer' }, phone: 'A future ask' },
  ]
  for (const destination of ['app_store', 'google_play'] as const) {
    for (const { ask, phone } of ASKS) {
      it(`${destination}: ${ask.why} reads "${phone}" with the store's note`, () => {
        const shown = phoneAsk(ask, destination)
        expect(shown.label).toBe(phone)
        expect(shown.note).toBe(STORE_ASK.note[destination])
        expect([shown.why, shown.quiet, shown.textInstead]).toEqual([ask.why, ask.quiet, ask.textInstead])
      })
    }
  }

  it('no phone label promises a saved plan or names the app (that is the note and the icon)', () => {
    for (const label of [...ASKS.map((a) => phoneAsk(a.ask, 'app_store').label), ...Object.values(STORE_ASK.labels)]) {
      expect(label).not.toMatch(/\u2014|\bLeap\b|Ribbit|save my plan|free app|in the app/i)
    }
    expect(STORE_ASK.textInstead).toBe('Not ready for the app? Text me each step instead')
    // The plan preview's line: no "keep this" on a phone, where the plan does not carry into the install.
    expect(STORE_ASK.texts.plan_preview).not.toMatch(/\u2014|keep|save|free app/i)
    expect(Object.keys(STORE_ASK.texts)).toEqual(['plan_preview'])
    expect(STORE_ASK.textInstead).not.toMatch(/\u2014|connect/i)
  })
})

describe('the rent destination split and offer on the web (Nov 9)', () => {
  it('rent on a phone follows the arm with the plain button; desktop is never in it', () => {
    expect(askRoute('rent', 'app_store', 'web')).toEqual({ view: 'plain', to: 'web', arm: 'web' })
    expect(askRoute('rent', 'app_store', 'store')).toEqual({ view: 'plain', to: 'app_store', arm: 'store' })
    expect(askRoute('rent', 'google_play', 'store')).toEqual({ view: 'plain', to: 'google_play', arm: 'store' })
    expect(askRoute('rent', 'web', 'store')).toEqual({ view: 'web', to: 'web' })
  })

  it('offer and the startup offer go to the web app on phones, as on desktop; other flows keep the store', () => {
    for (const flow of ['offer', 'startup'] as const) {
      expect(askRoute(flow, 'app_store', 'store')).toEqual({ view: 'web', to: 'web' })
      expect(askRoute(flow, 'google_play', undefined)).toEqual({ view: 'web', to: 'web' })
    }
    expect(askRoute('money', 'app_store', 'web')).toEqual({ view: 'store', to: 'app_store' })
    expect(askRoute(null, 'google_play', 'web')).toEqual({ view: 'store', to: 'google_play' })
  })

  it('assigns the arms half and half', () => {
    expect(assignArm(() => 0.49)).toBe('web')
    expect(assignArm(() => 0.5)).toBe('store')
    let web = 0
    for (let i = 0; i < 2000; i++) if (assignArm() === 'web') web++
    expect(web).toBeGreaterThan(850)
    expect(web).toBeLessThan(1150)
  })

  it('the plain button is the same in both arms: the phone label, no note, one text-instead line', () => {
    expect(plainAsk({ label: 'Save my plan and unlock the rest', why: 'plan_preview', note: 'No forms: the rows above come with you.', textInstead: true }))
      .toEqual({ label: 'Build my full plan', why: 'plan_preview', note: undefined, textInstead: true })
    expect(plainAsk({ label: 'Plan my savings for the move', why: 'score_gap', note: 'No forms: your numbers come with you.' }))
      .toEqual({ label: 'Plan my savings for the move', why: 'score_gap', note: undefined })
    expect(SPLIT_TEXT_INSTEAD).toBe('Not ready? Text me each step instead')
    expect(SPLIT_TEXT_INSTEAD).not.toMatch(/\u2014|app|connect/i)
  })

  it('the store arm counts under its own campaign on both stores', () => {
    expect(SPLIT_CAMPAIGN).toBe('ribbit_rent_split')
    expect(new URL(ribbitStoreLink('rent', 'app_store', SPLIT_CAMPAIGN)).searchParams.get('ct')).toBe('ribbit_rent_split')
    const play = new URL(ribbitStoreLink('rent', 'google_play', SPLIT_CAMPAIGN))
    expect(play.searchParams.get('utm_campaign')).toBe('ribbit_rent_split')
    expect(new URLSearchParams(play.searchParams.get('referrer') ?? '').get('utm_campaign')).toBe('ribbit_rent_split')
    expect(new URL(ribbitStoreLink('rent', 'app_store')).searchParams.get('ct')).toBe('ribbit_rent')
  })
})
