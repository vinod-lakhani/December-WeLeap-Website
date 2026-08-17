import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The behaviour worth pinning here is the queue, not the SDK.
 *
 * Deferring `posthog-js` out of the initial bundle means there is now a window
 * between first render and the SDK arriving. Events fired in that window — most
 * importantly the mount-time `$pageview` and `tool_viewed`, which are the
 * denominator of the whole tool funnel — must survive it. A deferral that
 * silently drops them would under-report exactly the slow-connection users it
 * was supposed to help, and would look like a traffic drop rather than a bug.
 *
 * Runs in the `node` environment, so `window` is stubbed rather than pulling in
 * jsdom for one file.
 */

const capture = vi.fn()
const identify = vi.fn()
const init = vi.fn()

vi.mock('posthog-js', () => ({
  default: { init, capture, identify, get_distinct_id: () => 'real-did' },
}))

/** Fresh module state per test — the queue and instance are module-level. */
async function freshModule() {
  vi.resetModules()
  return import('./posthog-lazy')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('window', {})
  vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', 'phc_test_key')
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('getPostHog before the SDK loads', () => {
  it('returns a usable object rather than undefined', async () => {
    const { getPostHog } = await freshModule()
    const ph = getPostHog()

    // Slim's provider reads `client.config` with no null guard, so a missing
    // client crashes the app on first paint.
    expect(ph).toBeDefined()
    expect(() => ph.capture('anything')).not.toThrow()
  })

  it('reports no distinct_id, so app-link degrades instead of throwing', async () => {
    const { getPostHog } = await freshModule()
    expect(getPostHog().get_distinct_id()).toBeUndefined()
  })
})

describe('queue replay', () => {
  it('replays events fired before load, in order, once the SDK arrives', async () => {
    const { getPostHog, loadPostHog } = await freshModule()

    getPostHog().capture('$pageview', { $current_url: '/' })
    getPostHog().capture('tool_viewed', { tool: 'offer' })

    // Nothing reaches the SDK yet — it does not exist.
    expect(capture).not.toHaveBeenCalled()

    await loadPostHog()

    expect(capture).toHaveBeenCalledTimes(2)
    expect(capture.mock.calls[0][0]).toBe('$pageview')
    expect(capture.mock.calls[1][0]).toBe('tool_viewed')
    expect(capture.mock.calls[1][1]).toEqual({ tool: 'offer' })
  })

  it('replays identify as well as capture', async () => {
    const { getPostHog, loadPostHog } = await freshModule()

    getPostHog().identify('user-123')
    await loadPostHog()

    expect(identify).toHaveBeenCalledWith('user-123')
  })

  it('routes straight through once loaded, without re-queuing', async () => {
    const { getPostHog, loadPostHog } = await freshModule()
    await loadPostHog()

    getPostHog().capture('tool_completed', { tool: 'offer' })

    expect(capture).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledWith('tool_completed', { tool: 'offer' })
    // The real instance is handed out now, not the stub.
    expect(getPostHog().get_distinct_id()).toBe('real-did')
  })

  it('does not replay twice when load is called more than once', async () => {
    const { getPostHog, loadPostHog } = await freshModule()

    getPostHog().capture('$pageview')
    await Promise.all([loadPostHog(), loadPostHog()])
    await loadPostHog()

    expect(init).toHaveBeenCalledTimes(1)
    expect(capture).toHaveBeenCalledTimes(1)
  })

  it('caps the queue so a never-loading SDK cannot grow it without bound', async () => {
    const { getPostHog, loadPostHog } = await freshModule()

    for (let i = 0; i < 250; i++) getPostHog().capture(`event_${i}`)
    await loadPostHog()

    expect(capture).toHaveBeenCalledTimes(100)
  })
})

describe('when PostHog is not configured', () => {
  it('no-ops instead of initialising against an undefined key', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    const { loadPostHog } = await freshModule()

    await expect(loadPostHog()).resolves.toBeNull()
    expect(init).not.toHaveBeenCalled()
  })

  it('still accepts capture calls without throwing', async () => {
    vi.stubEnv('NEXT_PUBLIC_POSTHOG_KEY', '')
    const { getPostHog } = await freshModule()

    expect(() => getPostHog().capture('tool_viewed')).not.toThrow()
  })
})
