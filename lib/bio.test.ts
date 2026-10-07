import { describe, expect, it } from 'vitest'

import { FREE_TOOLS } from '@/lib/tools'
import {
  BIO_CAMPAIGN,
  BIO_FEATURED_TOOL,
  bioCards,
  bioHref,
  featuredTool,
  resolveBioUtm,
  routeSlug,
} from './bio'

const DEFAULTS = resolveBioUtm(undefined)

describe('who the visitor is attributed to', () => {
  it('assumes Instagram when they bring nothing', () => {
    expect(DEFAULTS).toEqual({ source: 'instagram', medium: 'bio', campaign: BIO_CAMPAIGN })
  })

  it('keeps their own source and medium when they bring one', () => {
    // TikTok and YouTube links are built with their own; overwriting them with
    // "instagram" would file that traffic under the wrong channel.
    expect(resolveBioUtm({ utm_source: 'tiktok', utm_medium: 'bio' })).toEqual({
      source: 'tiktok',
      medium: 'bio',
      campaign: BIO_CAMPAIGN,
    })
    expect(resolveBioUtm({ utm_source: 'youtube', utm_medium: 'description' }).medium).toBe(
      'description',
    )
  })

  it('falls back to a bio medium when only the source arrives', () => {
    // Hand-built links lose the medium more often than the source, and the
    // medium of a bio link is a bio link whoever sent it. Better than emitting
    // an empty parameter.
    expect(resolveBioUtm({ utm_source: 'tiktok' }).medium).toBe('bio')
  })

  it('ignores a blank or whitespace source rather than treating it as set', () => {
    expect(resolveBioUtm({ utm_source: '' }).source).toBe('instagram')
    expect(resolveBioUtm({ utm_source: '   ' }).source).toBe('instagram')
  })

  it('takes the first value when a param repeats', () => {
    expect(resolveBioUtm({ utm_source: ['tiktok', 'instagram'] }).source).toBe('tiktok')
  })

  it('always reports the same campaign', () => {
    for (const p of [undefined, { utm_source: 'tiktok' }, { utm_campaign: 'something_else' }]) {
      expect(resolveBioUtm(p).campaign).toBe('organic_bio')
    }
  })
})

describe('the featured card', () => {
  it('is whatever the one weekly constant names', () => {
    const tool = featuredTool(BIO_FEATURED_TOOL)
    expect(tool, `BIO_FEATURED_TOOL "${BIO_FEATURED_TOOL}" matches no tool`).not.toBeNull()
  })

  it('swaps with no other edit', () => {
    const a = bioCards(DEFAULTS, 'how-much-rent-can-i-afford')[0]!
    const b = bioCards(DEFAULTS, 'credit-card-payoff')[0]!
    expect(a.slot).toBe('featured')
    expect(b.slot).toBe('featured')
    expect(a.title).not.toBe(b.title)
    // Everything after the featured card is identical either way.
    expect(bioCards(DEFAULTS, 'how-much-rent-can-i-afford').slice(1).map((c) => c.href)).toEqual(
      bioCards(DEFAULTS, 'credit-card-payoff').slice(1).map((c) => c.href),
    )
  })

  it('disappears for an unknown or empty slug rather than breaking the page', () => {
    // A typo on a Tuesday morning should cost the card, not the page.
    for (const slug of ['', 'not-a-tool', 'first_paycheck' /* the analytics slug, not the route */]) {
      const cards = bioCards(DEFAULTS, slug)
      expect(cards.some((c) => c.slot === 'featured'), `slug "${slug}"`).toBe(false)
      expect(cards[0]!.slot).toBe('app')
      expect(cards).toHaveLength(FREE_TOOLS.length + 1)
    }
  })

  it('is distinguishable from the same tool lower down the list', () => {
    const cards = bioCards(DEFAULTS, 'first-paycheck-setup')
    const featuredCard = cards.find((c) => c.slot === 'featured')!
    const listCard = cards.find((c) => c.slot === 'tool' && c.tool === featuredCard.tool)!
    expect(featuredCard.content).toBe('featured_first-paycheck-setup')
    expect(listCard.content).toBe('first-paycheck-setup')
  })
})

describe('the column', () => {
  const cards = bioCards(DEFAULTS)

  it('is featured, then the app, then every tool in catalogue order', () => {
    expect(cards[0]!.slot).toBe('featured')
    expect(cards[1]!.slot).toBe('app')
    expect(cards.slice(2).map((c) => c.tool)).toEqual(FREE_TOOLS.map((t) => t.slug))
  })

  it('lists all ten tools, from the catalogue rather than a second copy', () => {
    expect(FREE_TOOLS).toHaveLength(10)
    expect(cards.filter((c) => c.slot === 'tool')).toHaveLength(10)
    // Names and blurbs are the catalogue's, so a rename there lands here.
    for (const tool of FREE_TOOLS) {
      const card = cards.find((c) => c.slot === 'tool' && c.tool === tool.slug)!
      expect(card.title).toBe(tool.name)
      expect(card.subtitle).toBe(tool.blurb)
    }
  })

  it('sends the app card to /get with no store badges to decide anything', () => {
    const app = cards.find((c) => c.slot === 'app')!
    expect(app.href.startsWith('/get?')).toBe(true)
    expect(app.title).toBe('Get WeLeap')
    expect(app.subtitle).toBe('Free to start. iOS and Android.')
  })

  it('stays on weleap.ai — never the app domain, which 404s', () => {
    for (const card of cards) {
      expect(card.href.startsWith('/'), card.href).toBe(true)
      expect(card.href).not.toContain('weleap.app')
    }
  })
})

describe('the links a tap actually follows', () => {
  it('carries the acceptance criterion for a TikTok visitor', () => {
    const utm = resolveBioUtm({ utm_source: 'tiktok', utm_medium: 'bio' })
    const card = bioCards(utm).find((c) => c.slot === 'tool' && c.tool === 'first_paycheck')!
    const url = new URL(card.href, 'https://www.weleap.ai')
    expect(url.pathname).toBe('/first-paycheck-setup')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'tiktok',
      utm_medium: 'bio',
      utm_content: 'first-paycheck-setup',
      utm_campaign: 'organic_bio',
    })
  })

  it('carries the acceptance criterion for an untagged visitor tapping the app', () => {
    const card = bioCards(DEFAULTS).find((c) => c.slot === 'app')!
    const url = new URL(card.href, 'https://www.weleap.ai')
    expect(url.pathname).toBe('/get')
    expect(Object.fromEntries(url.searchParams)).toEqual({
      utm_source: 'instagram',
      utm_medium: 'bio',
      utm_content: 'app',
      utm_campaign: 'organic_bio',
    })
  })

  it('escapes anything odd in a source rather than building a broken URL', () => {
    const href = bioHref('/get', 'app', resolveBioUtm({ utm_source: 'a b&c=d' }))
    const url = new URL(href, 'https://www.weleap.ai')
    expect(url.searchParams.get('utm_source')).toBe('a b&c=d')
    expect(url.searchParams.get('utm_content')).toBe('app')
  })

  it('uses the route as utm_content and the analytics slug as the tool', () => {
    /**
     * Two identifiers on purpose. utm_content is the route because that is
     * what the brief's links and the weekly config use and what reads back
     * legibly in a UTM report. `tool` is FREE_TOOLS' own slug because every
     * other event on the site — tool_viewed, tool_completed — joins on that
     * one, and a bio tap is only interesting next to what happened after it.
     */
    const card = bioCards(DEFAULTS).find((c) => c.slot === 'tool' && c.tool === 'allocator')!
    expect(card.content).toBe('how-should-i-split-my-paycheck')
    expect(card.tool).toBe('allocator')
    expect(routeSlug({ href: '/how-should-i-split-my-paycheck' })).toBe(
      'how-should-i-split-my-paycheck',
    )
  })
})
