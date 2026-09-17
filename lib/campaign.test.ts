import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { CAMPAIGN_PARAM, CAMPAIGN_ROBOTS, isCampaign } from './campaign'

/**
 * Campaign mode takes the site off a page: no navigation, no breadcrumb, no
 * hero. Getting it wrong in either direction is expensive — a stripped page for
 * organic traffic loses every route out of it, and a full page for paid traffic
 * is what this exists to fix — so the trigger is narrow and explicit.
 */
describe('isCampaign', () => {
  it('is off by default', () => {
    expect(isCampaign(undefined)).toBe(false)
    expect(isCampaign({})).toBe(false)
  })

  it('is on for the explicit flag', () => {
    expect(isCampaign({ [CAMPAIGN_PARAM]: '1' })).toBe(true)
    expect(isCampaign({ [CAMPAIGN_PARAM]: 'true' })).toBe(true)
  })

  it('is NOT triggered by a UTM alone', () => {
    /**
     * Organic traffic carries UTMs too: newsletters, shared links, partners.
     * Stripping the site off a page for somebody who arrived from an email
     * would be a worse experience than the one campaign mode fixes, so it has
     * to be a deliberate flag on a deliberate destination.
     */
    expect(isCampaign({ utm_source: 'yikyak', utm_medium: 'social' })).toBe(false)
    expect(isCampaign({ utm_source: 'newsletter' })).toBe(false)
  })

  it('ignores anything that is not the values it defines', () => {
    expect(isCampaign({ [CAMPAIGN_PARAM]: '0' })).toBe(false)
    expect(isCampaign({ [CAMPAIGN_PARAM]: 'yes' })).toBe(false)
    expect(isCampaign({ [CAMPAIGN_PARAM]: '' })).toBe(false)
  })

  it('reads the first value when the param repeats', () => {
    // ?campaign=1&campaign=0 arrives as an array.
    expect(isCampaign({ [CAMPAIGN_PARAM]: ['1', '0'] })).toBe(true)
    expect(isCampaign({ [CAMPAIGN_PARAM]: ['0', '1'] })).toBe(false)
  })

  it('keeps campaign landings out of the index but follows their links', () => {
    expect(CAMPAIGN_ROBOTS.index).toBe(false)
    expect(CAMPAIGN_ROBOTS.follow).toBe(true)
  })
})

/**
 * The share control sits inside the campaign hero, next to the number, because
 * that is the only free-reach loop a paid page has and it used to sit 2.7
 * screens below the result in 13px grey text.
 *
 * Read from source rather than rendered: this repo has no component-test
 * setup, and the property worth protecting is a single condition that is easy
 * to lose in a refactor and expensive to lose quietly.
 */
describe('the campaign hero share slot', () => {
  const src = readFileSync(
    join(process.cwd(), 'components/OfferCampaignHero.tsx'),
    'utf8',
  )

  it('is withheld while the figures on screen are the ad’s example', () => {
    /**
     * Until the visitor types, the number is somebody else’s offer. Sharing it
     * would be posting a claim about a stranger’s salary under your own name.
     * It also gives typing a payoff: the thing worth posting only exists once
     * you have made the result yours.
     */
    expect(src).toMatch(/\{!isExample && shareSlot &&/)
  })

  it('renders the slot inside the result card, above the example note', () => {
    const slotAt = src.indexOf('shareSlot}</div>')
    const noteAt = src.indexOf('{isExample && (')
    expect(slotAt).toBeGreaterThan(-1)
    expect(noteAt).toBeGreaterThan(slotAt)
  })
})
