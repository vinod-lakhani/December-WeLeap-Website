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
