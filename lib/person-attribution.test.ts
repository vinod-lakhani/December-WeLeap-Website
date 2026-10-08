import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { appStoreCampaignToken, playStoreUrl } from './stores'

/**
 * Carrying the person — utm_term — all the way to an install.
 *
 * The chain is bio link → tool page → /get → store, across two domains and a
 * redirect. Every hop that drops the field makes the whole thing worthless,
 * and the hops are in four different files, so the invariant is asserted here
 * rather than in any one of them.
 */
describe('the App Store campaign token', () => {
  const utm = {
    utm_source: 'instagram',
    utm_medium: 'bio',
    utm_campaign: 'organic_bio',
    utm_content: 'app',
    utm_term: 'joshua',
  }

  it('is campaign_source_content_term, because Apple gives us one string', () => {
    /**
     * App Store Connect reports installs by `ct` and nothing else — there is
     * no second field for the person. So it rides in the token: which
     * campaign, which card, whose audience, in the one place Apple will show.
     */
    expect(appStoreCampaignToken(utm)).toBe('organic_bio_instagram_app_joshua')
  })

  it('omits the person when nobody is named', () => {
    expect(appStoreCampaignToken({ ...utm, utm_term: undefined })).toBe('organic_bio_instagram_app')
    // The house default reads the same as absent — see the note on HOUSE_TERM.
    expect(appStoreCampaignToken({ ...utm, utm_term: 'weleap' })).toBe('organic_bio_instagram_app')
  })

  it('falls back to source_term when there is no campaign', () => {
    expect(appStoreCampaignToken({ utm_source: 'tiktok', utm_term: 'joshua' })).toBe(
      'tiktok_joshua',
    )
  })

  it('never returns an empty token', () => {
    expect(appStoreCampaignToken({})).toBe('launch')
  })
})

describe('the Play link', () => {
  it('carries the person in the tags and in the install referrer', () => {
    // The referrer string is what reaches the app's Install Referrer API, so
    // the person has to be in both halves or the install is anonymous.
    const url = playStoreUrl({
      utm_source: 'instagram',
      utm_medium: 'bio',
      utm_campaign: 'organic_bio',
      utm_content: 'app',
      utm_term: 'joshua',
    })
    expect(url).toContain('utm_term=joshua')
    const referrer = decodeURIComponent(new URL(url).searchParams.get('referrer') ?? '')
    expect(referrer).toContain('utm_term=joshua')
  })
})

describe('the hops that have to keep the field', () => {
  const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

  it('stores utm_term alongside the other four', () => {
    expect(read('lib/utm-storage.ts')).toMatch(/UTM_KEYS = \[[^\]]*"utm_term"/)
  })

  it('reports the person on store_link_clicked, named to match its neighbours', () => {
    // source/medium/campaign/content already drop the utm_ prefix on this event.
    expect(read('components/GetRedirect.tsx')).toMatch(/term: utm\.utm_term \?\? ''/)
  })

  it('attaches the campaign to the funnel events as EVENT properties', () => {
    /**
     * PostHog holds UTMs as PERSON properties, which answers "where did this
     * person come from" rather than "where did this completion come from".
     * They diverge the moment somebody returns from a different creator's
     * link: person properties are last-write-wins, so the earlier completion
     * is retroactively re-attributed.
     */
    const analytics = read('lib/analytics.ts')
    expect(analytics).toMatch(/CAMPAIGN_TAGGED_EVENTS = new Set\(\['tool_viewed', 'tool_completed'\]\)/)
    // Merged under the caller's params, so nothing existing can be overwritten.
    expect(analytics).toMatch(/\{ \.\.\.getUtmEventProps\(\), \.\.\.\(params \?\? \{\}\) \}/)
  })

  it('never sends anybody to the app domain for /get, which does not exist there', () => {
    expect(read('lib/bio.ts')).not.toContain('weleap.app')
    expect(read('components/BioLinks.tsx')).not.toContain('weleap.app')
  })
})
