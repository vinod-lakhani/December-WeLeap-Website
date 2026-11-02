import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A tap that opens Messages or a store parks the page before PostHog's next
 * batch goes out. Those taps must go by beacon, straight away; everything else
 * keeps the normal batching.
 */

const capture = vi.fn()
vi.mock('@/lib/posthog-lazy', () => ({ getPostHog: () => ({ capture }) }))
vi.mock('./meta-pixel', () => ({ fbq: () => {} }))
vi.mock('@/lib/meta-pixel', () => ({ fbq: () => {} }))
vi.mock('@vercel/analytics', () => ({ track: () => {} }))
vi.mock('@/lib/utm-storage', () => ({
  getUtmEventProps: () => ({}),
  getUtmParams: () => '',
  getFirstTouchUtmParams: () => '',
}))

async function freshTrack() {
  vi.resetModules()
  return (await import('./analytics')).track
}

beforeEach(() => {
  capture.mockClear()
  vi.stubGlobal('window', {})
})

afterEach(() => vi.unstubAllGlobals())

describe('taps that leave the page', () => {
  it.each(['text_optin_submitted', 'store_link_clicked', 'ribbit_app_link_clicked'])('%s goes by beacon, now', async (event) => {
    const track = await freshTrack()
    await track(event, { tool: 'rent' })
    expect(capture).toHaveBeenCalledWith(event, expect.objectContaining({ tool: 'rent' }), {
      send_instantly: true,
      transport: 'sendBeacon',
    })
  })

  it('leaves other events batched', async () => {
    const track = await freshTrack()
    await track('text_optin_shown', { tool: 'rent' })
    expect(capture).toHaveBeenCalledWith('text_optin_shown', expect.any(Object), undefined)
  })
})
