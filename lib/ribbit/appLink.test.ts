import { afterEach, describe, expect, it, vi } from 'vitest'

import { markPlanSaved, planSaved, ribbitPlanParams } from './appLink'

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
