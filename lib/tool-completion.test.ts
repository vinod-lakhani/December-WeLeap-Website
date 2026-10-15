import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { __resetToolCompletions, claimToolCompletion } from './tool-funnel'

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

/**
 * An in-memory Storage, installed per test.
 *
 * These tests used to rely on the runtime happening to provide a global
 * `sessionStorage`. Node 26 does; Node 22 does not. So they passed on the
 * machine they were written on and, on CI, silently exercised the opposite
 * branch — `claimToolCompletion` returning false because storage was absent —
 * while asserting it returned true. Three of them failed the first time this
 * repo ran its own tests on a different Node version, which is the whole
 * argument for running them somewhere other than a laptop.
 *
 * Stubbing makes the dependency explicit and the result the same everywhere.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => (data.has(k) ? data.get(k)! : null),
    setItem: (k, v) => void data.set(k, String(v)),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: (i) => [...data.keys()][i] ?? null,
    get length() {
      return data.size
    },
  } as Storage
}

const ORIGINAL_STORAGE = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')

function setSessionStorage(value: unknown): void {
  Object.defineProperty(globalThis, 'sessionStorage', { value, configurable: true, writable: true })
}

function restoreSessionStorage(): void {
  if (ORIGINAL_STORAGE) Object.defineProperty(globalThis, 'sessionStorage', ORIGINAL_STORAGE)
  else delete (globalThis as Record<string, unknown>).sessionStorage
}

/**
 * Campaign C3 divides spend by completions, so a completion counted twice
 * halves the reported cost per account. That is the whole reason this is
 * session-scoped rather than per mount.
 */
describe('one completion per tool per session', () => {
  beforeEach(() => {
    setSessionStorage(memoryStorage())
    __resetToolCompletions()
  })

  afterEach(restoreSessionStorage)

  it('is claimed once and refused after', () => {
    expect(claimToolCompletion('offer')).toBe(true)
    expect(claimToolCompletion('offer')).toBe(false)
    expect(claimToolCompletion('offer')).toBe(false)
  })

  it('survives a reload, which a ref did not', () => {
    /**
     * The guard used to be a useRef, which is per MOUNT. Somebody who worked
     * out their rent, refreshed and changed a field again produced two
     * completions. run_index records that a second run happened; it was never
     * meant to suppress the event.
     */
    expect(claimToolCompletion('rent')).toBe(true)
    // A reload creates new refs but the same sessionStorage.
    expect(claimToolCompletion('rent')).toBe(false)
  })

  it('counts each tool separately', () => {
    expect(claimToolCompletion('offer')).toBe(true)
    expect(claimToolCompletion('rent')).toBe(true)
    expect(claimToolCompletion('offer')).toBe(false)
  })

  it('fails open when storage is unavailable', () => {
    /**
     * Safari private mode, blocked site data. Missing a duplicate is better
     * than missing every completion on a browser that will not let us
     * remember — the failure mode of the alternative is a tool that silently
     * reports nothing.
     */
    setSessionStorage({
      getItem() { throw new Error('denied') },
      setItem() { throw new Error('denied') },
      removeItem() { throw new Error('denied') },
    })
    expect(claimToolCompletion('offer')).toBe(true)
    expect(claimToolCompletion('offer')).toBe(true)
  })

  it('does not fire on the server, where there is no storage at all', () => {
    /**
     * The other half of the distinction the implementation draws: no storage
     * and no visitor means no event, as against a visitor whose browser
     * refuses storage. Untested until CI ran on a Node without a global
     * sessionStorage and the suite started exercising this branch by accident.
     */
    setSessionStorage(undefined)
    expect(claimToolCompletion('offer')).toBe(false)
  })
})

describe('what tool_completed carries', () => {
  it('names what produced it, and how much was changed', () => {
    const offer = read('components/OfferAnalysisTool.tsx')
    expect(offer).toMatch(/trigger: firstTrigger \?\? 'field_change'/)
    expect(offer).toMatch(/fields_changed: fieldChangeCount/)

    const rent = read('components/RentTool.tsx')
    // Rent takes no documents, so its trigger is constant — stated rather than
    // omitted, so a query grouping by trigger needs no special case.
    expect(rent).toMatch(/trigger: 'field_change'/)
    expect(rent).toMatch(/fields_changed: engagementCount/)
  })

  it('reads the trigger from the FIRST engagement, not the last', () => {
    // The question is which route into the tool works. Somebody who uploads
    // and then tweaks a number was brought here by the upload.
    const offer = read('components/OfferAnalysisTool.tsx')
    expect(offer).toMatch(/if \(!engagedRef\.current\) \{[\s\S]{0,200}setFirstTrigger/)
  })

  it('gates both tools on the session claim', () => {
    expect(read('components/OfferAnalysisTool.tsx')).toMatch(/claimToolCompletion\('offer'\)/)
    expect(read('components/RentTool.tsx')).toMatch(/claimToolCompletion\('rent'\)/)
  })
})

describe('the pixel', () => {
  const analytics = read('lib/analytics.ts')

  it('sends ToolCompleted with the same id as the PostHog event', () => {
    expect(analytics).toMatch(/tool_completed: 'ToolCompleted'/)
    expect(analytics).toMatch(/fbq\('trackCustom', metaEvent, \{ tool: params\.tool \}, \{ eventID: params\.event_id \}\)/)
  })

  it('keeps Lead on the /get store button and nowhere else', () => {
    /**
     * Firing Lead on a tool completion would teach Meta to buy people who use
     * a calculator and leave. The store tap is the action worth paying for.
     */
    expect(analytics).not.toMatch(/'Lead'/)
    const leadSites = ['components/GetRedirect.tsx', 'components/ToolPageView.tsx', 'components/AppCta.tsx']
      .filter((f) => /'Lead'/.test(read(f)))
    expect(leadSites).toEqual(['components/GetRedirect.tsx'])
  })

  it('fires ViewContent on tool load, named by the same slug the funnel uses', () => {
    expect(read('components/ToolPageView.tsx')).toMatch(/fbq\('track', 'ViewContent', \{ content_name: tool \}\)/)
  })
})

describe('tool_cta_clicked', () => {
  const analytics = read('lib/analytics.ts')

  it('gains an event_id and the UTMs, and keeps placement', () => {
    expect(analytics).toMatch(/EVENT_ID_EVENTS = new Set\(\['tool_completed', 'tool_cta_clicked'\]\)/)
    expect(analytics).toMatch(/'tool_viewed', 'tool_completed', 'tool_cta_clicked'/)
    // placement is the existing name; renaming it to cta_location would orphan
    // every saved insight for no gain.
    expect(read('components/AppCta.tsx')).toMatch(/track\('tool_cta_clicked', \{ tool, placement \}\)/)
  })

  it('does not overwrite an id a caller already made', () => {
    // /get builds one before it fires the pixel and must not be given a second.
    expect(analytics).toMatch(/!params\?\.event_id/)
  })
})
