import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { FREE_TOOLS } from '@/lib/tools'
import {
  BIO_CAMPAIGN,
  BIO_FEATURED_TOOL,
  BIO_TOOL_ORDER,
  bioCards,
  bioHref,
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
  it('is off, because keeping it honest was a weekly chore', () => {
    /**
     * It decayed silently: nobody notices a stale "from this week's post" for
     * a fortnight. The captions already name the tool, and finding that name
     * in a list of ten is a one-second scan. Switching it back on is setting
     * this constant to a route slug — the machinery below is still tested.
     */
    expect(BIO_FEATURED_TOOL).toBe('')
    expect(bioCards(DEFAULTS).some((c) => c.slot === 'featured')).toBe(false)
  })

  it('still works when switched back on', () => {
    const cards = bioCards(DEFAULTS, 'how-much-rent-can-i-afford')
    expect(cards[0]!.slot).toBe('featured')
    expect(cards[0]!.title).toBe('Rent Affordability')
    // And the app card holds its place rather than being pushed down.
    expect(cards[1]!.slot).toBe('app')
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
    // A typo should cost the card, not the page.
    for (const slug of ['', 'not-a-tool', 'first_paycheck' /* the analytics slug, not the route */]) {
      const cards = bioCards(DEFAULTS, slug)
      expect(cards.some((c) => c.slot === 'featured'), `slug "${slug}"`).toBe(false)
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

  it('leads with the tool most people came for, then the app', () => {
    /**
     * The app card is second whatever is above it — the featured card when
     * that is on, the first tool when it is not. Not first, because the top
     * slot belongs to whatever somebody most likely came for. Not lower,
     * because it is the one card relevant to every visitor.
     */
    expect(cards[0]!.slot).toBe('tool')
    expect(cards[0]!.content).toBe(BIO_TOOL_ORDER[0])
    expect(cards[1]!.slot).toBe('app')
  })

  it('orders the tools by traffic, not by the catalogue', () => {
    /**
     * /tools is a life sequence — offer letter, first paycheck, then the rest
     * — which is right for browsing and wrong for a caption tap, where the
     * reader already knows what they want.
     */
    const order = cards.filter((c) => c.slot === 'tool').map((c) => c.content)
    expect(order).toEqual([...BIO_TOOL_ORDER])
    expect(order).not.toEqual(FREE_TOOLS.map((t) => routeSlug(t)))
  })

  it('names every tool in the order list, so none is left to the fallback', () => {
    // The fallback appends an unlisted tool rather than dropping it, but
    // landing there means somebody shipped a tool and forgot this file.
    const missing = FREE_TOOLS.map((t) => routeSlug(t)).filter((s) => !BIO_TOOL_ORDER.includes(s))
    expect(missing, `not in BIO_TOOL_ORDER: ${missing.join(', ')}`).toEqual([])
    const unknown = BIO_TOOL_ORDER.filter((s) => !FREE_TOOLS.some((t) => routeSlug(t) === s))
    expect(unknown, `in BIO_TOOL_ORDER but not a tool: ${unknown.join(', ')}`).toEqual([])
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

describe('the one card that has to be impossible to miss', () => {
  const links = readFileSync(join(process.cwd(), 'components/BioLinks.tsx'), 'utf8')

  it('fills the app card, and only the app card', () => {
    /**
     * Everything else is outlined white, so the single green block is the only
     * thing on the page the eye cannot skip. That is the right card to spend
     * it on: the ten tools are chosen by somebody who already knows which one
     * they came for, and the app is the one row relevant whatever brought them.
     *
     * Measured on the rendered card at 390px: white on #386641 is 6.68:1 and
     * the subtitle at 85% is 5.36:1, both clear of WCAG AA.
     */
    expect(links).toMatch(/card\.slot === 'app'\s*\?\s*'block rounded-2xl bg-\[#386641\]/)
  })

  it('does not give the featured card a second filled treatment', () => {
    /**
     * Two emphasised cards is none. When the featured card comes back it earns
     * its prominence from its eyebrow and its position, not from competing
     * with the only filled block on the page.
     */
    expect(links).not.toMatch(/card\.slot === 'featured'\s*\?\s*'block rounded-2xl bg-\[#386641\]/)
    expect(links).not.toMatch(/featured'[^)]*bg-\[#386641\]\s/)
  })
})
