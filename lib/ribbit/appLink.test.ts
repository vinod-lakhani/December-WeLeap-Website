import { describe, expect, it } from 'vitest'

import { ribbitPlanParams } from './appLink'

describe('the chat-to-app link contract', () => {
  it('carries the rent plan as the app reads it, and leaves out what was not given', () => {
    const p = ribbitPlanParams({
      salary: 71_500, takeHomeFrom: 'salary', takeHomeMonthly: 4_928.4, stateCode: 'WA', place: 'Seattle', pick: 1_400,
      debtMonthly: 200, start: 'next_month', upfront: { low: 4_200, high: 4_900 }, perCheck: 163, purpose: 'cushion',
    }, 'rent', 'plan_preview', 'thread-1')
    expect(p).toEqual({
      src: 'ribbit_chat', open: 'connect-bank', why: 'plan_preview', rt: 'thread-1', flow: 'rent', salary: '71500', takehome: '4928',
      state: 'WA', city: 'Seattle', rent: '1400', debt: '200', start: 'next_month', upfront: '4900', percheck: '163', purpose: 'cushion',
    })
  })

  it('a typed take-home sends no salary, a start date goes as the date, and the offer terms only when entered', () => {
    expect(ribbitPlanParams({ takeHomeFrom: 'typed', salary: 5_000, takeHomeMonthly: 5_000, start: 'date', startDate: '2026-12-01' }, 'rent', 'spending_check', '')).toEqual({
      src: 'ribbit_chat', open: 'connect-bank', why: 'spending_check', flow: 'rent', takehome: '5000', start: '2026-12-01',
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
      src: 'ribbit_chat', open: 'connect-bank', why: 'plan_invite', rt: 't', flow: 'general', saving: '1000',
    })
  })
})
