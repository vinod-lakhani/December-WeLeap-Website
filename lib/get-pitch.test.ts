import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { ALL_PITCHES, DEFAULT_PITCH, MAX_HEADLINE, pitchFor } from './get-pitch'

/**
 * The failure worth catching here is silent: a headline that grows by one line
 * pushes the store button under the fold of an in-app browser, which costs taps
 * without ever looking like a bug. And a slug that stops matching serves the
 * default promise forever.
 */

const DEBT = 'Your debt has a faster exit.'
const SAVINGS = 'Know when your fund is full.'
const MATCH = 'The free money you’re missing.'
const PAYCHECK = 'See where every paycheck goes.'

describe('matching the pitch to the ad', () => {
  it('falls back to the default for traffic it does not recognise', () => {
    // The live lookalike ads: no keyword in either slug, by design.
    expect(pitchFor({ utm_content: 'l3', utm_campaign: 'lal1' })).toBe(DEFAULT_PITCH)
    expect(pitchFor({ utm_content: 'app', utm_campaign: 'organic_bio' })).toBe(DEFAULT_PITCH)
  })

  it('gives the paycheck ad its own pitch', () => {
    // The live C5 tags, exactly as Meta sends them.
    expect(pitchFor({ utm_content: 'L3', utm_campaign: 'get_l3' }).headline).toBe(PAYCHECK)
    expect(pitchFor({ utm_content: 'paycheck_split_v2' }).headline).toBe(PAYCHECK)
    // A debt creative in a paycheck-named campaign is still a debt promise.
    expect(pitchFor({ utm_content: 'debt_payoff', utm_campaign: 'get_l3' }).headline).toBe(DEBT)
    // Not a substring match on some other campaign that happens to contain it.
    expect(pitchFor({ utm_campaign: 'budget_l3x' })).toBe(DEFAULT_PITCH)
  })

  it('falls back for a visit with no tags at all', () => {
    expect(pitchFor({})).toBe(DEFAULT_PITCH)
    expect(pitchFor(undefined)).toBe(DEFAULT_PITCH)
    expect(pitchFor({ utm_content: '   ' })).toBe(DEFAULT_PITCH)
  })

  it('reads the creative slug', () => {
    expect(pitchFor({ utm_content: 'debt_payoff_v2' }).headline).toBe(DEBT)
    expect(pitchFor({ utm_content: 'emergency_fund_01' }).headline).toBe(SAVINGS)
    expect(pitchFor({ utm_content: '401k_match_hook' }).headline).toBe(MATCH)
  })

  it('reads the campaign slug too, since naming differs per campaign', () => {
    expect(pitchFor({ utm_campaign: 'cc_payoff_oct' }).headline).toBe(DEBT)
  })

  it('ignores case', () => {
    expect(pitchFor({ utm_content: 'DEBT_Payoff' }).headline).toBe(DEBT)
  })

  it('prefers the more specific promise when a slug names two themes', () => {
    // A debt ad that also says "saving" is still a debt ad.
    expect(pitchFor({ utm_content: 'debt_saving_combo' }).headline).toBe(DEBT)
  })
})

describe('every pitch is shippable', () => {
  it('keeps the headline short enough to leave the button above the fold', () => {
    for (const pitch of ALL_PITCHES) {
      expect(pitch.headline.length, `too long: ${pitch.headline}`).toBeLessThanOrEqual(MAX_HEADLINE)
    }
  })
})

describe('the page actually uses it', () => {
  it('renders the pitch and names the store on the button', () => {
    const src = readFileSync(join(process.cwd(), 'components/GetRedirect.tsx'), 'utf8')
    // Strip comments: the prose here explains the change and would otherwise
    // satisfy a test of the code it describes.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(code).toContain('pitchFor(utm)')
    expect(code).toContain('{pitch.headline}')
    expect(code).toContain('{pitch.sub}')
    // The evidence under the button is the product tour now, for every pitch.
    expect(code).toContain('<ProductTourVideo')
    expect(code).toMatch(/Download on the App Store/)
    // The anchor must stay a real href — the in-app-browser handoff depends on
    // it, and no amount of copy work is worth breaking that.
    expect(code).toMatch(/<a\s+href=\{storeHref\}/)
  })
})
