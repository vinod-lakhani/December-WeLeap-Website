import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * These tests exist because of one shipped bug: the offer tool deep-links to
 * `/react/#analyze`, and appLink used to append `?utm_...` AFTER that fragment.
 * The UTMs reached weleap.app and were invisible there — `location.search` was
 * empty, so posthog-js attached nothing and `user_signed_up` carried no
 * campaign. Campaign C3 divides spend by signups per campaign, so the number it
 * exists to produce would have been zero for every offer-tool conversion.
 *
 * The assertion that matters is therefore not "the string contains utm_campaign"
 * but "a URL parser finds it in the query" — the consumer's view, not ours.
 */

const did = { value: 'did-1' as string | null }
vi.mock('./posthog-lazy', () => ({ getPostHog: () => ({ get_distinct_id: () => did.value }) }))

const utm = { current: '', first: '', clickIds: '' }
vi.mock('./utm-storage', () => ({
  getUtmParams: () => utm.current,
  getFirstTouchUtmParams: () => utm.first,
  getClickIdParams: () => utm.clickIds,
}))

const C3 = 'utm_source=meta&utm_medium=paid_social&utm_campaign=offer_f26&utm_content=O1'

async function freshModule() {
  vi.resetModules()
  return import('./app-link')
}

beforeEach(() => {
  vi.stubGlobal('window', {})
  utm.current = C3
  utm.first = ''
  utm.clickIds = ''
  did.value = 'did-1'
})

afterEach(() => vi.unstubAllGlobals())

describe('appLink puts attribution where the app can read it', () => {
  it('keeps the query ahead of a fragment in the path', async () => {
    const { appLink } = await freshModule()
    const url = new URL(appLink('/react/#analyze', { src: 'offer_tool' }))

    expect(url.hash).toBe('#analyze')
    expect(url.pathname).toBe('/react/')
    expect(url.searchParams.get('utm_campaign')).toBe('offer_f26')
    expect(url.searchParams.get('utm_content')).toBe('O1')
    expect(url.searchParams.get('utm_source')).toBe('meta')
    expect(url.searchParams.get('utm_medium')).toBe('paid_social')
    expect(url.searchParams.get('src')).toBe('offer_tool')
    expect(url.searchParams.get('ph_did')).toBe('did-1')
  })

  it('does not swallow params into the fragment', async () => {
    const { appLink } = await freshModule()
    // The regression, stated directly: nothing may sit between # and the end.
    expect(appLink('/react/#analyze')).not.toContain('#analyze?')
  })

  it('still works for a path with no fragment', async () => {
    const { appLink } = await freshModule()
    const url = new URL(appLink('', { src: 'rent' }))

    expect(url.hash).toBe('')
    expect(url.searchParams.get('utm_campaign')).toBe('offer_f26')
    expect(url.searchParams.get('src')).toBe('rent')
  })

  it('returns the path untouched when there is nothing to carry', async () => {
    utm.current = ''
    did.value = null
    const { appLink, APP_BASE_URL } = await freshModule()

    expect(appLink('/react/#analyze')).toBe(`${APP_BASE_URL}/react/#analyze`)
  })
})

describe('ad click IDs reach the app', () => {
  it('forwards gclid, gbraid and wbraid into the query', async () => {
    /**
     * `user_signed_up` fires on weleap.app, so a Google Ads conversion there
     * can only be matched to the click that paid for it if the click ID gets
     * across the domain boundary. It did not: UTM_KEYS is exactly the five
     * utm_* params, and a spec assumed these already travelled.
     */
    utm.clickIds = 'gclid=abc123&gbraid=g-1&wbraid=w-1'
    const { appLink } = await freshModule()
    const url = new URL(appLink('/react/#analyze'))

    expect(url.searchParams.get('gclid')).toBe('abc123')
    expect(url.searchParams.get('gbraid')).toBe('g-1')
    expect(url.searchParams.get('wbraid')).toBe('w-1')
    // Still ahead of the fragment, where the app can read them.
    expect(url.hash).toBe('#analyze')
  })

  it('adds nothing when there was no ad click', async () => {
    const { appLink } = await freshModule()
    const url = new URL(appLink(''))
    expect(url.searchParams.get('gclid')).toBeNull()
  })
})
