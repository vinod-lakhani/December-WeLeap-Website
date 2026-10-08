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
import { HOUSE_TERM } from '@/lib/stores'

/**
 * The featured card, OFF.
 *
 * It was a good idea that cost more than it returned. Keeping it honest meant
 * editing this line every Tuesday to match the carousel, and a weekly chore
 * that silently decays — nobody notices a stale "from this week's post" for a
 * fortnight — is worse than not having the card. The captions already do the
 * routing ("First Paycheck Setup tool, link in bio") and someone who tapped
 * because of a payslip post finds that name in a list of ten in about a
 * second. That is a scan, not a conversion problem.
 *
 * The card still works. Set this to a tool's route slug — "first-paycheck-setup",
 * not the analytics slug "first_paycheck" — and it comes back with the list
 * unchanged beneath it. Empty, or a slug matching nothing, hides it.
 */
export const BIO_FEATURED_TOOL = ''

/**
 * THE LIST, ORDERED BY TRAFFIC RATHER THAN BY CATALOGUE.
 *
 * /tools is ordered as a life sequence — offer letter, first paycheck, then
 * everything after — which is right for somebody browsing and wrong here.
 * This page is tapped from a caption by somebody who already knows what they
 * came for, so the order that matters is how likely each tool is to be it.
 *
 * REVIEW ONCE A QUARTER, when the moment changes rather than when the post
 * does: loan payments climb in November as grace periods end, bonus and
 * contribution questions in January. One list edit, not a weekly one — which
 * is the whole reason the featured card went.
 *
 * Current order is October traffic. A tool missing from this list still
 * renders, appended after the ones named here, because a tool that vanishes
 * from the bio page because somebody forgot to add it is the one failure this
 * must not have. bio.test.ts fails if that happens, so it is loud rather than
 * silent.
 */
export const BIO_TOOL_ORDER: readonly string[] = [
  'first-paycheck-setup',
  'what-is-my-job-offer-worth',
  'how-should-i-split-my-paycheck',
  'whats-my-money-age',
  'first-student-loan-payment',
  'how-much-rent-can-i-afford',
  'how-much-emergency-fund-do-i-need',
  'credit-card-payoff',
  'should-i-use-buy-now-pay-later',
  'what-is-saving-monthly-worth',
]

/**
 * The app card sits second, always.
 *
 * Not first: the top slot belongs to whatever somebody most likely came for,
 * and on a page reached from a caption that is a tool. Not lower: it is the
 * one card that is relevant to every visitor whatever brought them, so it
 * should not be below nine things that are not.
 *
 * Stated as a rule rather than an array position because the thing above it
 * changes — the featured card when that is on, the first tool when it is not.
 */
const APP_CARD_INDEX = 1

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

/**
 * utm_term is the PERSON whose account the tap came from.
 *
 * Creators each get their own bio link — ?utm_term=joshua — so a tool
 * completion or an install can be traced to whose audience produced it. That
 * is the whole point of the parameter here; it is not a keyword, which is what
 * utm_term means everywhere else, and anyone reading the reports needs to know
 * that.
 *
 * "weleap" rather than empty when nobody is named, so the field is never
 * missing. An absent value and a house-account value look identical in a
 * funnel otherwise, and the difference is exactly the question being asked.
 */
export const BIO_DEFAULT_TERM = HOUSE_TERM

/**
 * The sources a `src` shorthand may name.
 *
 * /bio?src=tiktok exists because a bio link gets retyped, dictated and pasted
 * into four different apps' profile fields, and "utm_source=tiktok" does not
 * survive that as reliably as "src=tiktok" does.
 *
 * An allow-list rather than a pass-through, because this value ends up in the
 * App Store campaign token and in every report built on utm_source. One typo
 * in a profile field would otherwise create a channel that exists only in the
 * data — "tikok" sitting beside "tiktok" forever, with no way to tell later
 * which rows belonged where. Anything unrecognised falls back to Instagram,
 * which is where this link mostly lives and what the page did before `src`
 * existed.
 */
export const BIO_SOURCES = ['instagram', 'tiktok', 'linkedin', 'youtube'] as const

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
  /** Who sent them. See BIO_DEFAULT_TERM. */
  term: string
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
  /**
   * The person is read independently of the channel.
   *
   * source and medium move together — a link built for TikTok carries both, so
   * taking one without the other produces a mismatched pair. The person is
   * orthogonal: the same creator posts to more than one network, and a link
   * carrying only utm_term is a perfectly ordinary thing for somebody to build
   * by hand. Gating it on utm_source would silently file that person's traffic
   * under the house account.
   */
  const term = first(searchParams?.utm_term) || BIO_DEFAULT_TERM

  /**
   * utm_source wins over src when both are present.
   *
   * src is a shorthand for building bio links by hand; utm_source is the
   * canonical parameter and is what every other link on the site and every ad
   * platform emits. A URL carrying both is almost certainly a bio link that
   * has picked up a campaign tag downstream, and in that case the campaign's
   * own answer is the right one.
   */
  const src = first(searchParams?.src).toLowerCase()
  const fromSrc = (BIO_SOURCES as readonly string[]).includes(src) ? src : ''

  const source = first(searchParams?.utm_source) || fromSrc
  if (source) {
    return {
      source,
      medium: first(searchParams?.utm_medium) || BIO_DEFAULT_MEDIUM,
      campaign: BIO_CAMPAIGN,
      term,
    }
  }
  return {
    source: BIO_DEFAULT_SOURCE,
    medium: BIO_DEFAULT_MEDIUM,
    campaign: BIO_CAMPAIGN,
    term,
  }
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
    utm_term: utm.term,
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
  /** The person, reported to PostHog as referrer_person. */
  utmTerm: string
}

/**
 * Every card, in order, with its link already built.
 *
 * One function so the page renders a list and the tests assert the same list
 * the page renders — the ordering requirement in the brief is otherwise the
 * kind of thing that holds for a month and then quietly does not.
 */
export function bioCards(utm: BioUtm, featuredSlug: string = BIO_FEATURED_TOOL): BioCard[] {
  const appCard: BioCard = {
    href: bioHref('/get', 'app', utm),
    title: 'Get WeLeap',
    subtitle: 'Free to start. iOS and Android.',
    slot: 'app',
    tool: null,
    content: 'app',
    utmSource: utm.source,
    utmMedium: utm.medium,
    utmTerm: utm.term,
  }

  const toolCard = (tool: FreeTool): BioCard => {
    const content = routeSlug(tool)
    return {
      href: bioHref(tool.href, content, utm),
      title: tool.name,
      subtitle: tool.blurb,
      slot: 'tool',
      tool: tool.slug,
      content,
      utmSource: utm.source,
      utmMedium: utm.medium,
      utmTerm: utm.term,
    }
  }

  /**
   * Ordered by BIO_TOOL_ORDER, with anything it does not name appended.
   *
   * Appending rather than dropping is deliberate: a tool added to FREE_TOOLS
   * and forgotten here still appears, just at the bottom. The alternative is a
   * tool silently missing from the page the Instagram bio points at, which
   * nobody would notice for weeks.
   */
  const named = BIO_TOOL_ORDER.map((slug) => toolByRouteSlug(slug)).filter(
    (t): t is FreeTool => t !== null,
  )
  const namedHrefs = new Set(named.map((t) => t.href))
  const rest = FREE_TOOLS.filter((t) => !namedHrefs.has(t.href))
  const tools = [...named, ...rest]

  const featured = featuredTool(featuredSlug)
  const cards: BioCard[] = featured
    ? [
        {
          href: bioHref(featured.href, `featured_${routeSlug(featured)}`, utm),
          title: featured.name,
          subtitle: featured.blurb,
          slot: 'featured',
          tool: featured.slug,
          content: `featured_${routeSlug(featured)}`,
          utmSource: utm.source,
          utmMedium: utm.medium,
          utmTerm: utm.term,
        },
        ...tools.map(toolCard),
      ]
    : tools.map(toolCard)

  cards.splice(APP_CARD_INDEX, 0, appCard)
  return cards
}
