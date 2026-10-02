import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Pins the ordering fix: /get's effect runs before <MetaPixel> mounts, so the
 * first fbq() call must create the stub and queue `init` ahead of the event.
 * Node environment — window/document are stubbed rather than pulling in jsdom.
 */
let win: Record<string, unknown>
let scripts: { src?: string; async?: boolean }[]

beforeEach(() => {
  win = {}
  scripts = []
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {
    createElement: () => ({}),
    head: { appendChild: (s: { src?: string }) => scripts.push(s) },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

async function fresh() {
  vi.resetModules()
  return import('./meta-pixel')
}

describe('meta-pixel', () => {
  it('is inert without a pixel id', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '')
    const { fbq, loadMetaPixel } = await fresh()
    expect(loadMetaPixel()).toBe(false)
    expect(() => fbq('track', 'PageView')).not.toThrow()
    expect(win.fbq).toBeUndefined()
    expect(scripts).toHaveLength(0)
  })

  it('first caller creates the stub, queues init before the event, loads the script once', async () => {
    vi.stubEnv('NEXT_PUBLIC_META_PIXEL_ID', '4524887364421399')
    const { fbq } = await fresh()
    fbq('trackCustom', 'GetPageReached', { platform: 'desktop' }, { eventID: 'e1' })
    fbq('track', 'PageView')
    const q = (win.fbq as { queue: unknown[][] }).queue
    expect(q[0]).toEqual(['init', '4524887364421399'])
    expect(q[1].slice(0, 2)).toEqual(['trackCustom', 'GetPageReached'])
    expect(q[2]).toEqual(['track', 'PageView'])
    expect(scripts).toHaveLength(1)
    expect(scripts[0].src).toContain('fbevents.js')
  })
})
