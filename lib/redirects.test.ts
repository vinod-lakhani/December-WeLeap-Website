import { beforeAll, describe, expect, it } from 'vitest'

import config from '../next.config.mjs'
import { FREE_TOOLS } from './tools'

/**
 * Short aliases, checked against the routes they point at.
 *
 * These exist to be PRINTED — on a Reel end card, in a TikTok, read off a
 * screenshot and retyped. That makes them different from an ordinary
 * redirect: the link is in a video that stays up, so the alias has to keep
 * working long after anybody remembers adding it.
 *
 * The failure is quiet. Rename a tool's route — which this site has done
 * twice, /offer to /what-is-my-job-offer-worth and /allocator to
 * /how-should-i-split-my-paycheck — and the alias still returns a tidy 308 to
 * a page that is now a 404. Nothing fails, nothing logs, and the only person
 * who finds out is someone who typed a URL off a screen.
 */
/** The one-word aliases we print. Not the longer legacy ones. */
const SHORT_ALIASES = ['/offer', '/rent', '/paycheck', '/loan', '/plan', '/age', '/card'] as const

interface Redirect {
  source: string
  destination: string
  permanent?: boolean
}

/**
 * Loaded in beforeAll rather than at module scope: next.config.mjs exposes
 * redirects() as an async function, and a top-level await here is not allowed
 * under this project's tsconfig module setting.
 */
let bySource = new Map<string, Redirect>()

beforeAll(async () => {
  const list = (await config.redirects?.()) ?? []
  bySource = new Map((list as Redirect[]).map((r) => [r.source, r]))
})

describe('short tool aliases', () => {
  it.each(SHORT_ALIASES)('%s exists', (source) => {
    expect(bySource.get(source), `no redirect for ${source}`).toBeDefined()
  })

  it.each(SHORT_ALIASES)('%s lands on a real tool', (source) => {
    // The whole point: the destination must still be a route FREE_TOOLS
    // serves, not a path that used to be one.
    const dest = bySource.get(source)?.destination
    expect(FREE_TOOLS.map((t) => t.href), `${source} -> ${dest}`).toContain(dest)
  })

  it.each(SHORT_ALIASES)('%s is permanent, because it is published in video', (source) => {
    expect(bySource.get(source)?.permanent).toBe(true)
  })

  it('does not point two aliases at the same tool by accident', () => {
    /**
     * /plan and /allocator both reach the money plan, which is deliberate —
     * one is guessable and one keeps old links alive. This checks the SHORT
     * set only, where a duplicate would mean a tool printed under two names
     * and another printed under none.
     */
    const dests = SHORT_ALIASES.map((s) => bySource.get(s)?.destination)
    expect(new Set(dests).size).toBe(SHORT_ALIASES.length)
  })

  it('names which tools still have no short alias', () => {
    /**
     * Not a failure — an alias nothing links to is a route to keep working
     * forever for no reader. This is here so the gap is visible the day
     * somebody puts one of these on an end card.
     */
    const covered = new Set(SHORT_ALIASES.map((s) => bySource.get(s)?.destination))
    const without = FREE_TOOLS.filter((t) => !covered.has(t.href)).map((t) => t.href)
    expect(without).toEqual([
      '/how-much-emergency-fund-do-i-need',
      '/should-i-use-buy-now-pay-later',
      '/what-is-saving-monthly-worth',
    ])
  })
})
