import { beforeEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { __resetToolCompletions, claimToolCompletion } from './tool-funnel'

const read = (f: string) => readFileSync(join(process.cwd(), f), 'utf8')

/**
 * Campaign C3 divides spend by completions, so a completion counted twice
 * halves the reported cost per account. That is the whole reason this is
 * session-scoped rather than per mount.
 */
describe('one completion per tool per session', () => {
  beforeEach(() => __resetToolCompletions())

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
    const real = globalThis.sessionStorage
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: {
        getItem() { throw new Error('denied') },
        setItem() { throw new Error('denied') },
        removeItem() { throw new Error('denied') },
      },
      configurable: true,
    })
    expect(claimToolCompletion('offer')).toBe(true)
    expect(claimToolCompletion('offer')).toBe(true)
    Object.defineProperty(globalThis, 'sessionStorage', { value: real, configurable: true })
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
