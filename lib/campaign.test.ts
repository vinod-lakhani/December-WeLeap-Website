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
