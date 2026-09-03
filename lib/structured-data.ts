/**
 * JSON-LD builders.
 *
 * Everything here is derived from FREE_TOOLS or the site constants rather than
 * hand-written per page, so a new tool gets structured data the moment it is
 * registered — the same reason the sitemap reads from the registry.
 *
 * Scope is deliberately narrow. Organization and WebSite site-wide,
 * WebApplication and BreadcrumbList on the calculators, BlogPosting on the
 * articles, and FAQPage only where real question-and-answer content is
 * rendered.
 *
 * FAQPage used to be declined outright here, on the grounds that Google
 * requires it to describe content actually visible on the page. That rule has
 * not changed and is not being bent: `faqSchema` is fed from TOOL_FAQS, the
 * same array the page renders visibly and without JavaScript, so the markup
 * cannot describe questions a visitor could not read. HowTo and Review are
 * still not emitted — there is nothing on the site they would honestly
 * describe.
 */

import { FREE_TOOLS, TOOL_COUNT_WORD, type FreeTool } from '@/lib/tools'
import type { Article } from '@/lib/articles'
import type { FaqItem } from '@/lib/tool-faqs'

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: 'WeLeap',
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: `${SITE_URL}/images/Icon.png`,
    },
    // How an answer engine ties this site to the same entity described
    // elsewhere. Only profiles WeLeap actually controls belong here — a wrong
    // or aspirational URL asserts an identity that isn't ours, which is worse
    // than omitting the field. Add others as they go live.
    sameAs: ['https://www.linkedin.com/company/weleap'],
    description:
      `WeLeap is a consumer personal-finance company. Its product is Ribbit, an AI financial sidekick for people in their twenties and early thirties: it reads a connected financial picture — cash, debt, 401(k) and goals — and names the single highest-value next move, called a Leap. WeLeap also publishes ${TOOL_COUNT_WORD} free calculators that need no account. It is not a budgeting app, not a robo-adviser, and not a registered investment adviser.`,
    // Named explicitly because a model cannot infer from prose alone that
    // "Ribbit" and "WeLeap" are the assistant and the company rather than two
    // unrelated products. The site says both names constantly and had defined
    // neither in machine-readable form.
    brand: {
      '@type': 'Brand',
      name: 'Ribbit',
      description:
        'Ribbit is WeLeap’s AI financial sidekick. It answers money questions in plain English using the user’s own connected accounts and proposes one move at a time, which the user approves before anything happens.',
    },
    // Deliberately no `sameAs`, `address` or `foundingDate`: nothing on this
    // site states them, and structured data asserting facts the pages do not
    // is exactly the drift this file exists to avoid.
  }
}

export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': SITE_ID,
    url: SITE_URL,
    name: 'WeLeap',
    publisher: { '@id': ORG_ID },
  }
}

/**
 * A calculator. WebApplication rather than SoftwareApplication: these run in
 * the browser with nothing to install, and WebApplication is the more precise
 * subtype. `offers` at price 0 is what marks them free — the tools genuinely
 * require no account, so this is accurate rather than aspirational.
 */
export function toolSchema(tool: FreeTool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: tool.name,
    url: `${SITE_URL}${tool.href}`,
    description: tool.blurb,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    publisher: { '@id': ORG_ID },
  }
}

/**
 * BreadcrumbList for a calculator route.
 *
 * The tools sit at top-level URLs — /how-should-i-split-my-paycheck, not
 * /tools/allocator — because the slug is the query and URL depth is a weak
 * signal. The cost of that flatness is
 * that nothing in the URL says these pages belong together, so this is
 * the only machine-readable statement of the hierarchy.
 *
 * Emitted by `ToolBreadcrumb`, which renders the same three items as a visible
 * trail in the same component. Do not emit it without that trail: the markup
 * and the page have to describe the same path for the same reason FAQPage and
 * TOOL_FAQS read from one object.
 */
export function breadcrumbSchema(tool: FreeTool) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${SITE_URL}${tool.href}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Free money tools', item: `${SITE_URL}/tools` },
      { '@type': 'ListItem', position: 3, name: tool.name, item: `${SITE_URL}${tool.href}` },
    ],
  }
}

/**
 * FAQPage for a route.
 *
 * Callers pass the same array the page renders, so the markup and the visible
 * text cannot diverge. Do not call this with questions that are not on screen.
 */
export function faqSchema(items: readonly FaqItem[], path: string) {
  // The homepage is passed as '/', which would otherwise emit a trailing slash
  // while its canonical and sitemap entry both use the bare origin — three
  // signals describing two nominally different URLs. Normalised here rather
  // than at the call site so it cannot be reintroduced by the next caller.
  const url = path === '/' ? SITE_URL : `${SITE_URL}${path}`

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

/**
 * BlogPosting for a /resources article.
 *
 * `publisher` chains onto the Organization node emitted in the root layout
 * rather than repeating it, which is the point of giving that node an @id.
 *
 * `datePublished` is omitted when the article carries no byline date, instead
 * of being back-filled from a git timestamp or a guess. An article with a
 * wrong publication date is worse than one with none.
 */
export function articleSchema(article: Article) {
  const url = `${SITE_URL}${article.href}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: article.title,
    description: article.description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: `${SITE_URL}${article.image}`,
    author: { '@type': 'Person', name: article.author },
    publisher: { '@id': ORG_ID },
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en-US',
    ...(article.datePublished ? { datePublished: article.datePublished } : {}),
  }
}

/** Look a tool up by its route, for use inside that route's layout. */
export function toolByHref(href: string): FreeTool | undefined {
  return FREE_TOOLS.find((t) => t.href === href)
}
