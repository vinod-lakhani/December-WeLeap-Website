/**
 * The link-in-bio page's catalogue and its UTM rules.
 *
 * Replaces a Linktree for Instagram and TikTok. Everything it lists comes from
 * FREE_TOOLS, so a tool added or renamed there appears here without anybody
 * remembering to update a second list — which is the failure a hand-maintained
 * bio page always eventually has, and the reason the brief asked for the
 * catalogue rather than ten hard-coded cards.
 */

import { FREE_TOOLS, type FreeTool } from '@/lib/tools'

/**
 * THE ONE LINE THAT CHANGES WEEKLY.
 *
 * Set it to match Tuesday's carousel. The value is the tool's ROUTE without
 * the leading slash — "first-paycheck-setup", not the analytics slug
 * "first_paycheck" — because that is what also travels as utm_content, and one
 * identifier in one place is easier to get right on a Tuesday morning than two.
 *
 * An empty string hides the featured card. So does a slug that matches no
 * tool: a typo should cost the card, not the page.
 */
export const BIO_FEATURED_TOOL = 'first-paycheck-setup'

/** Campaign every link on this page reports under. */
export const BIO_CAMPAIGN = 'organic_bio'

/**
 * Where a visitor is assumed to have come from when they bring nothing.
 *
 * Instagram is the default because the bio link lives there and its in-app
 * browser frequently strips query strings on the way through. TikTok traffic
 * arrives with ?utm_source=tiktok on the link itself and keeps it.
 */
export const BIO_DEFAULT_SOURCE = 'instagram'
export const BIO_DEFAULT_MEDIUM = 'bio'

/** A tool's route slug: the href without its leading slash. */
export function routeSlug(tool: Pick<FreeTool, 'href'>): string {
  return tool.href.replace(/^\//, '')
}

/** The tool a route slug names, or null for an unknown one. */
export function toolByRouteSlug(slug: string): FreeTool | null {
  if (!slug) return null
  return FREE_TOOLS.find((t) => routeSlug(t) === slug) ?? null
}

/** The featured tool, or null when the config is empty or does not match. */
export function featuredTool(slug: string = BIO_FEATURED_TOOL): FreeTool | null {
  return toolByRouteSlug(slug)
}

export interface BioUtm {
  source: string
  medium: string
  campaign: string
}

type ParamValue = string | string[] | undefined

const first = (v: ParamValue): string => (Array.isArray(v) ? (v[0] ?? '') : (v ?? '')).trim()

/**
 * The source and medium every link on the page will carry.
 *
 * A visitor who arrives already tagged keeps their own source AND medium —
 * TikTok and YouTube links are built with their own, and overwriting them with
 * "instagram" would quietly file that traffic under the wrong channel. The
 * trigger is utm_source specifically, because that is the one a hand-built
 * link always has; a source with no medium falls back to "bio" rather than
 * emitting an empty parameter, since the medium of a bio link is a bio link
 * whoever sent it.
 */
export function resolveBioUtm(searchParams?: Record<string, ParamValue>): BioUtm {
  const source = first(searchParams?.utm_source)
  if (source) {
    return {
      source,
      medium: first(searchParams?.utm_medium) || BIO_DEFAULT_MEDIUM,
      campaign: BIO_CAMPAIGN,
    }
  }
  return { source: BIO_DEFAULT_SOURCE, medium: BIO_DEFAULT_MEDIUM, campaign: BIO_CAMPAIGN }
}

/**
 * A destination with this page's attribution attached.
 *
 * Built on the server from the request's own query string, so the markup ships
 * with working links and a tap does not depend on hydration having finished.
 * An in-app browser on a slow connection is exactly where that matters.
 */
export function bioHref(path: string, content: string, utm: BioUtm): string {
  const qs = new URLSearchParams({
    utm_source: utm.source,
    utm_medium: utm.medium,
    utm_content: content,
    utm_campaign: utm.campaign,
  })
  return `${path}?${qs.toString()}`
}

export interface BioCard {
  /** Where it goes. */
  href: string
  title: string
  subtitle: string
  /** Which kind of row this is, as reported to PostHog. */
  slot: 'featured' | 'app' | 'tool'
  /** FREE_TOOLS analytics slug, so the event joins the rest of the funnel. */
  tool: string | null
  /** What travels as utm_content. */
  content: string
  /**
   * The resolved source and medium, carried on the card rather than re-derived
   * in the click handler. The handler runs in the browser, where the only
   * source of truth would be the live URL — and the whole point of resolving
   * on the server is that the URL may have arrived with nothing.
   */
  utmSource: string
  utmMedium: string
}

/**
 * Every card, in order, with its link already built.
 *
 * One function so the page renders a list and the tests assert the same list
 * the page renders — the ordering requirement in the brief is otherwise the
 * kind of thing that holds for a month and then quietly does not.
 */
export function bioCards(utm: BioUtm, featuredSlug: string = BIO_FEATURED_TOOL): BioCard[] {
  const cards: BioCard[] = []

  const featured = featuredTool(featuredSlug)
  if (featured) {
    const content = `featured_${routeSlug(featured)}`
    cards.push({
      href: bioHref(featured.href, content, utm),
      title: featured.name,
      subtitle: featured.blurb,
      slot: 'featured',
      tool: featured.slug,
      content,
      utmSource: utm.source,
      utmMedium: utm.medium,
    })
  }

  cards.push({
    href: bioHref('/get', 'app', utm),
    title: 'Get WeLeap',
    subtitle: 'Free to start. iOS and Android.',
    slot: 'app',
    tool: null,
    content: 'app',
    utmSource: utm.source,
    utmMedium: utm.medium,
  })

  for (const tool of FREE_TOOLS) {
    const content = routeSlug(tool)
    cards.push({
      href: bioHref(tool.href, content, utm),
      title: tool.name,
      subtitle: tool.blurb,
      slot: 'tool',
      tool: tool.slug,
      content,
      utmSource: utm.source,
      utmMedium: utm.medium,
    })
  }

  return cards
}
