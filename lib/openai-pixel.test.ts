import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OPENAI_CONVERSIONS, OPENAI_PIXEL_ID, fireOpenAIConversion, loadOpenAIPixel, oaiq } from './openai-pixel'

/**
 * The ChatGPT Ads pixel sits beside the Meta and Google ones and is tested
 * the same way: the expensive failure is a conversion that fires when it
 * should not, or an event that a tool completion quietly stops reaching.
 */

const appended: { src?: string; async?: boolean }[] = []

function stubWindow(hostname: string, withOaiq?: ReturnType<typeof vi.fn>) {
  appended.length = 0
  vi.stubGlobal('window', {
    location: { hostname },
    ...(withOaiq ? { oaiq: withOaiq } : {}),
  })
  vi.stubGlobal('document', {
    createElement: () => {
      const el: { src?: string; async?: boolean } = {}
      return el
    },
    head: { appendChild: (el: { src?: string; async?: boolean }) => appended.push(el) },
  })
}

beforeEach(() => (appended.length = 0))
afterEach(() => vi.unstubAllGlobals())

describe('the conversion table', () => {
  it('counts the same moments Google does, plus the chat app link', () => {
    expect(Object.keys(OPENAI_CONVERSIONS).sort()).toEqual([
      'ribbit_app_link_clicked',
      'store_link_clicked',
      'text_optin_submitted',
      'tool_completed',
      'tool_cta_clicked',
    ])
  })

  it('maps a result view to contents_viewed and every tap to lead_created', () => {
    expect(OPENAI_CONVERSIONS.tool_completed).toBe('contents_viewed')
    for (const e of ['tool_cta_clicked', 'store_link_clicked', 'ribbit_app_link_clicked', 'text_optin_submitted']) {
      expect(OPENAI_CONVERSIONS[e]).toBe('lead_created')
    }
  })

  it('never wires a started sign-up as a conversion', () => {
    expect(OPENAI_CONVERSIONS.cta_click_signup).toBeUndefined()
    expect(OPENAI_CONVERSIONS.web_signup).toBeUndefined()
  })
})

describe('loadOpenAIPixel', () => {
  it('installs the stub, appends the SDK once, and queues init with the pixel id', () => {
    stubWindow('www.weleap.ai')
    expect(loadOpenAIPixel()).toBe(true)
    expect(loadOpenAIPixel()).toBe(true)
    expect(appended).toHaveLength(1)
    expect(appended[0].src).toBe('https://bzrcdn.openai.com/sdk/oaiq.min.js')
    expect(appended[0].async).toBe(true)
    const w = window as unknown as { oaiq: { q: unknown[][] } }
    expect(w.oaiq.q).toEqual([['init', { pixelId: OPENAI_PIXEL_ID }]])
  })

  it('stays inert off the production host', () => {
    for (const host of ['localhost', '127.0.0.1', 'weleap-website-git-main.vercel.app', 'weleap.app']) {
      stubWindow(host)
      expect(loadOpenAIPixel()).toBe(false)
      expect(appended).toHaveLength(0)
      vi.unstubAllGlobals()
    }
  })

  it('is a no-op on the server', () => {
    vi.stubGlobal('window', undefined)
    expect(loadOpenAIPixel()).toBe(false)
    expect(() => oaiq('measure', 'lead_created', { type: 'customer_action' })).not.toThrow()
  })
})

describe('fireOpenAIConversion', () => {
  it('sends contents_viewed carrying the tool name for a completion', () => {
    const fn = vi.fn()
    stubWindow('www.weleap.ai', fn)
    fireOpenAIConversion('tool_completed', { tool: 'rent', event_id: 'e1' })
    expect(fn).toHaveBeenCalledWith(
      'measure',
      'contents_viewed',
      { type: 'contents', contents: [{ id: 'rent', name: 'rent', content_type: 'tool' }] },
      { event_id: 'e1' },
    )
  })

  it('sends lead_created for the /get store tap', () => {
    const fn = vi.fn()
    stubWindow('weleap.ai', fn)
    fireOpenAIConversion('store_link_clicked', { event_id: 'e2' })
    expect(fn).toHaveBeenCalledWith('measure', 'lead_created', { type: 'customer_action' }, { event_id: 'e2' })
  })

  it('omits options when there is no event id', () => {
    const fn = vi.fn()
    stubWindow('weleap.ai', fn)
    fireOpenAIConversion('text_optin_submitted', { method: 'number' })
    expect(fn).toHaveBeenCalledWith('measure', 'lead_created', { type: 'customer_action' }, undefined)
  })

  it('ignores events that are not conversions', () => {
    const fn = vi.fn()
    stubWindow('www.weleap.ai', fn)
    for (const e of ['tool_viewed', 'tool_engaged', 'cta_click_signup', 'ribbit_handoff_accepted']) {
      fireOpenAIConversion(e)
    }
    expect(fn).not.toHaveBeenCalled()
  })

  it('stays silent off the production host', () => {
    const fn = vi.fn()
    for (const host of ['localhost', 'weleap.app']) {
      stubWindow(host, fn)
      fireOpenAIConversion('tool_completed', { tool: 'offer' })
      vi.unstubAllGlobals()
    }
    expect(fn).not.toHaveBeenCalled()
  })

  it('does not throw when the SDK does', () => {
    const fn = vi.fn(() => {
      throw new Error('blocked by an extension')
    })
    stubWindow('www.weleap.ai', fn)
    expect(() => fireOpenAIConversion('tool_completed', { tool: 'offer' })).not.toThrow()
  })
})
