/**
 * The bug these exist to prevent recurring:
 *
 *   arrive with utm_content=a, cross to the app  -> app receives a  (correct)
 *   come back with b, then c, cross again        -> app receives a  (wrong)
 *
 * sessionStorage is per tab and survives navigation, so a write-once capture
 * meant the first tagged visit in a tab won for the life of that tab. On
 * Instagram, whose in-app browser reuses one webview across taps, that credits
 * every later post's conversions to whichever post was tapped first.
 *
 * A FRESH PROFILE PASSES EVEN WITH THE BUG PRESENT, which is how it shipped —
 * so the sequence tests below all cross twice, and the second crossing is the
 * assertion that matters.
 *
 * No DOM here: vitest runs in node, so the module's pure core is tested
 * directly and the browser wrappers get a ten-line sessionStorage stub rather
 * than a jsdom dependency for one file.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  parseUtm,
  serializeUtm,
  mergeUtm,
  hasUtm,
  captureUtmIfPresent,
  getUtmParams,
  getFirstTouchUtmParams,
} from './utm-storage'

/* ---------------- pure core ---------------- */

describe('parseUtm', () => {
  it('keeps only UTM keys, and only ones that are set', () => {
    expect(parseUtm('?utm_source=instagram&utm_content=ig_d03&fbclid=xyz&q=1')).toEqual({
      utm_source: 'instagram',
      utm_content: 'ig_d03',
    })
  })

  it('treats an empty value as absent, so it cannot blank a stored key', () => {
    expect(parseUtm('?utm_source=&utm_content=ig_d03')).toEqual({ utm_content: 'ig_d03' })
  })

  it('returns nothing for an untagged URL', () => {
    expect(hasUtm(parseUtm('?src=share&page=2'))).toBe(false)
  })
})

describe('mergeUtm', () => {
  it('the newer value wins per key', () => {
    expect(mergeUtm({ utm_content: 'a' }, { utm_content: 'c' })).toEqual({ utm_content: 'c' })
  })

  it('a partial incoming set does not erase the channel it arrived on', () => {
    // The hazard in "overwrite the whole blob whenever any UTM is present": a
    // hand-edited link or a redirect that drops params would take utm_source
    // and utm_campaign with it.
    expect(
      mergeUtm(
        { utm_source: 'instagram', utm_campaign: 'block_1', utm_content: 'ig_d03' },
        { utm_content: 'ig_d11' }
      )
    ).toEqual({ utm_source: 'instagram', utm_campaign: 'block_1', utm_content: 'ig_d11' })
  })

  it('serializes in a stable key order, so two sets can be compared', () => {
    const a = serializeUtm({ utm_content: 'x', utm_source: 'instagram' })
    const b = serializeUtm({ utm_source: 'instagram', utm_content: 'x' })
    expect(a).toBe(b)
  })
})

/* ---------------- browser wrappers ---------------- */

let store: Record<string, string> = {}

function visit(search: string) {
  ;(globalThis as Record<string, unknown>).window = { location: { search } }
  captureUtmIfPresent()
}

beforeEach(() => {
  store = {}
  ;(globalThis as Record<string, unknown>).sessionStorage = {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => {
      store[k] = v
    },
  }
})

afterEach(() => {
  delete (globalThis as Record<string, unknown>).window
  delete (globalThis as Record<string, unknown>).sessionStorage
})

describe('the reported reproduction', () => {
  it('forwards the CURRENT campaign on the second crossing, not the first', () => {
    visit('?utm_source=instagram&utm_medium=social&utm_campaign=t&utm_content=a')
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('a')

    visit('?utm_source=instagram&utm_medium=social&utm_campaign=t&utm_content=b')
    visit('?utm_source=instagram&utm_medium=social&utm_campaign=t&utm_content=c')

    // Under the old write-once capture this was 'a'.
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('c')
  })

  it('staleness is fixed for every key, not just the one that was observed', () => {
    // The report only varied utm_content and said so. All five share one blob,
    // so campaign is checked here too rather than left as inference.
    visit('?utm_source=instagram&utm_campaign=block_1&utm_content=ig_d03')
    visit('?utm_source=tiktok&utm_campaign=block_2&utm_content=ig_d11')
    const out = new URLSearchParams(getUtmParams())
    expect(out.get('utm_campaign')).toBe('block_2')
    expect(out.get('utm_source')).toBe('tiktok')
  })
})

describe('what must not change', () => {
  it('an untagged page view does not wipe attribution', () => {
    visit('?utm_source=instagram&utm_content=ig_d03')
    visit('?src=share')
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('ig_d03')
  })

  it('a partial tagged URL keeps the source it arrived on', () => {
    visit('?utm_source=instagram&utm_campaign=block_1&utm_content=ig_d03')
    visit('?utm_content=ig_d11')
    const out = new URLSearchParams(getUtmParams())
    expect(out.get('utm_content')).toBe('ig_d11')
    expect(out.get('utm_source')).toBe('instagram')
  })

  it('first touch survives, under its own key', () => {
    visit('?utm_source=instagram&utm_content=ig_d03')
    visit('?utm_source=instagram&utm_content=ig_d11')
    expect(new URLSearchParams(getFirstTouchUtmParams()).get('utm_content')).toBe('ig_d03')
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('ig_d11')
  })
})

describe('the click-before-capture window', () => {
  it('the live URL wins over storage even if capture has not run', () => {
    visit('?utm_source=instagram&utm_content=ig_d03')
    // A click landing before the capture effect fires on the new page.
    ;(globalThis as Record<string, unknown>).window = {
      location: { search: '?utm_source=instagram&utm_content=ig_d11' },
    }
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('ig_d11')
  })
})

describe('storage that throws', () => {
  it('falls back to the URL rather than dropping attribution entirely', () => {
    // Private mode and some in-app browsers throw on access. Before, a throw
    // meant the user landed on a bare weleap.app with nothing attached.
    ;(globalThis as Record<string, unknown>).sessionStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('SecurityError')
      },
    }
    ;(globalThis as Record<string, unknown>).window = {
      location: { search: '?utm_source=instagram&utm_content=ig_d07' },
    }
    expect(() => captureUtmIfPresent()).not.toThrow()
    expect(new URLSearchParams(getUtmParams()).get('utm_content')).toBe('ig_d07')
  })
})

describe('server rendering', () => {
  it('returns nothing rather than touching window', () => {
    delete (globalThis as Record<string, unknown>).window
    expect(getUtmParams()).toBe('')
    expect(getFirstTouchUtmParams()).toBe('')
    expect(() => captureUtmIfPresent()).not.toThrow()
  })
})
