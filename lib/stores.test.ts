import { describe, expect, it } from 'vitest'

import {
  HOUSE_TERM,
  appStoreCampaignToken,
  appStoreUrl,
  cleanUtm,
  playStoreUrl,
  sanitizeToken,
} from './stores'

const ad = { utm_source: 'meta', utm_medium: 'paid', utm_campaign: 'lal1', utm_content: 'L1' }

describe('sanitizeToken', () => {
  it('lowercases, strips, caps at 40', () => {
    expect(sanitizeToken('Net Work/Oct 26!')).toBe('networkoct26')
    expect(sanitizeToken('a'.repeat(50))).toHaveLength(40)
  })
})

describe('cleanUtm', () => {
  it('drops empty values and never invents placeholders', () => {
    expect(cleanUtm({ utm_source: '', utm_campaign: 'x' })).toEqual({ utm_campaign: 'x' })
    expect(cleanUtm({})).toEqual({})
  })
})

describe('appStoreCampaignToken', () => {
  /**
   * campaign_source_content_term. Apple gives us one string and no other
   * field, so the channel, the placement and the person all fold into it.
   */
  it('is campaign_source_content for ads', () =>
    expect(appStoreCampaignToken(ad)).toBe('lal1_meta_l1'))

  it('drops the parts that are absent rather than leaving gaps', () =>
    expect(appStoreCampaignToken({ utm_source: 'vinod', utm_campaign: 'network_oct26' })).toBe(
      'network_oct26_vinod',
    ))

  it('appends a named creator, and omits the house account', () => {
    /**
     * utm_term defaults to "weleap" on the bio page so the field is never
     * missing from an event. Repeating it in every token would add a word to
     * every row saying only "nobody in particular", and it is what would
     * otherwise make a plain bio tap read organic_bio_instagram_app_weleap.
     */
    const bio = { utm_campaign: 'organic_bio', utm_source: 'tiktok', utm_content: 'app' }
    expect(appStoreCampaignToken({ ...bio, utm_term: 'joshua' })).toBe(
      'organic_bio_tiktok_app_joshua',
    )
    expect(appStoreCampaignToken({ ...bio, utm_term: HOUSE_TERM })).toBe('organic_bio_tiktok_app')
  })

  it('falls back to launch', () => expect(appStoreCampaignToken({})).toBe('launch'))

  it('keeps the person inside the 40-character cap at realistic lengths', () => {
    // sanitizeToken truncates, and the tail is the person. Worth knowing the
    // margin rather than discovering it when a campaign name grows.
    const longest = appStoreCampaignToken({
      utm_campaign: 'organic_bio',
      utm_source: 'instagram',
      utm_content: 'app',
      utm_term: 'joshua',
    })
    expect(longest).toBe('organic_bio_instagram_app_joshua')
    expect(longest.length).toBeLessThanOrEqual(40)
  })
})

describe('appStoreUrl', () => {
  it('carries pt, ct and mt', () => {
    const u = new URL(appStoreUrl(ad, 'PT123'))
    expect(u.searchParams.get('pt')).toBe('PT123')
    expect(u.searchParams.get('ct')).toBe('lal1_meta_l1')
    expect(u.searchParams.get('mt')).toBe('8')
  })
  it('defaults to the App Store Connect provider token and campaign path', () => {
    const u = new URL(appStoreUrl(ad))
    expect(u.searchParams.get('pt')).toBe('129313076')
    expect(u.pathname).toBe('/app/apple-store/id6801673529')
  })
})

describe('playStoreUrl', () => {
  it('puts all four tags on the URL and mirrors them in the referrer', () => {
    const u = new URL(playStoreUrl(ad))
    expect(u.searchParams.get('id')).toBe('ai.weleap.app')
    expect(u.searchParams.get('utm_source')).toBe('meta')
    expect(u.searchParams.get('utm_medium')).toBe('paid')
    expect(u.searchParams.get('utm_campaign')).toBe('lal1')
    expect(u.searchParams.get('utm_content')).toBe('l1')
    expect(new URLSearchParams(u.searchParams.get('referrer')!).get('utm_campaign')).toBe('lal1')
  })
  it('defaults medium to smartlink only when none given', () => {
    expect(new URL(playStoreUrl({ utm_source: 'vinod' })).searchParams.get('utm_medium')).toBe('smartlink')
    expect(new URL(playStoreUrl({})).searchParams.get('utm_medium')).toBe('smartlink')
  })
})
