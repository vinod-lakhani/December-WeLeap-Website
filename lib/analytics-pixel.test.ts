import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Campaign C3's Meta side rests on two things: the custom event exists with a
 * history by the time a campaign wants to optimise against it, and its event ID
 * matches the PostHog event so the two systems describe one completion rather
 * than two. A silently missing eventID looks identical to a working one until
 * the day you try to deduplicate, which is too late.
 */

const fbq = vi.fn()
vi.mock('./meta-pixel', () => ({ fbq: (...a: unknown[]) => fbq(...a) }))
vi.mock('@/lib/meta-pixel', () => ({ fbq: (...a: unknown[]) => fbq(...a) }))
vi.mock('@/lib/posthog-lazy', () => ({ getPostHog: () => undefined }))
vi.mock('@vercel/analytics', () => ({ track: () => {} }))
vi.mock('@/lib/utm-storage', () => ({
  getUtmEventProps: () => ({ utm_campaign: 'offer_f26', utm_content: 'O1' }),
  getUtmParams: () => '',
  getFirstTouchUtmParams: () => '',
}))

async function freshTrack() {
  vi.resetModules()
  return (await import('./analytics')).track
}

beforeEach(() => {
  fbq.mockClear()
  vi.stubGlobal('window', {})
})

afterEach(() => vi.unstubAllGlobals())

describe('Meta pixel on tool completion', () => {
  it('fires ToolCompleted with the same id as the PostHog event', async () => {
    const track = await freshTrack()
    await track('tool_completed', { tool: 'offer', trigger: 'field_change', fields_changed: 1 })

    const call = fbq.mock.calls.find((c) => c[1] === 'ToolCompleted')
    expect(call).toBeDefined()
    expect(call![0]).toBe('trackCustom')
    expect(call![2]).toEqual({ tool: 'offer' })

    const eventID = (call![3] as { eventID?: string }).eventID
    expect(eventID).toMatch(/^[0-9a-f-]{8,}$/i)
  })

  it('never fires Lead from a tool event', async () => {
    const track = await freshTrack()
    await track('tool_completed', { tool: 'rent' })
    await track('tool_cta_clicked', { tool: 'rent', placement: 'button' })
    await track('tool_viewed', { tool: 'rent' })

    expect(fbq.mock.calls.some((c) => c[1] === 'Lead')).toBe(false)
  })

  it('leaves Lead on the /get store button, where the spend is justified', () => {
    const src = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')
    // Strip comments first: the prose around these calls names the events it
    // is explaining, and a test that matches the explanation rather than the
    // code passes while the code does the opposite.
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(strip(src('components/GetRedirect.tsx'))).toMatch(/fbq\(\s*'track',\s*'Lead'/)
    expect(strip(src('lib/analytics.ts'))).not.toContain("'Lead'")
    expect(strip(src('components/ToolPageView.tsx'))).toMatch(/fbq\(\s*'track',\s*'ViewContent'/)
  })
})

/**
 * Google Ads sees the same funnel through the same one chokepoint.
 *
 * `tool_completed` is emitted by ten separate components. Wiring the
 * conversion at each of them would make a missing one look exactly like a tool
 * that does not convert, which is the mistake this codebase has already made
 * once with `rent_form_start`. So the conversion rides inside `track()`, and
 * what is worth testing is that it rides there and nowhere else.
 */
describe('Google Ads conversions through track()', () => {
  const gtag = vi.fn()

  beforeEach(() => {
    gtag.mockClear()
    vi.stubGlobal('window', { location: { hostname: 'www.weleap.ai' }, gtag })
  })

  it('reports a completion and a CTA click, each with its own label', async () => {
    const track = await freshTrack()
    const { ADS_CONVERSIONS } = await import('./google-ads')

    await track('tool_completed', { tool: 'rent' })
    await track('tool_cta_clicked', { tool: 'rent', placement: 'button' })

    const sent = gtag.mock.calls
      .filter((c) => c[0] === 'event' && c[1] === 'conversion')
      .map((c) => (c[2] as { send_to: string }).send_to)

    expect(sent).toEqual([ADS_CONVERSIONS.tool_completed, ADS_CONVERSIONS.tool_cta_clicked])
  })

  it('does not report the top of the funnel as a conversion', async () => {
    const track = await freshTrack()
    await track('tool_viewed', { tool: 'rent' })
    await track('tool_engaged', { tool: 'rent', first_field: 'salary' })
    await track('cta_click_signup', { source: 'hero' })

    expect(gtag.mock.calls.some((c) => c[1] === 'conversion')).toBe(false)
  })
})
