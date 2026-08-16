/**
 * JSON-LD builders.
 *
 * Everything here is derived from FREE_TOOLS or the site constants rather than
 * hand-written per page, so a new tool gets structured data the moment it is
 * registered — the same reason the sitemap reads from the registry.
 *
 * Scope is deliberately narrow. Organization and WebSite site-wide, and
 * WebApplication on the calculators. We do not emit FAQPage, HowTo or Review
 * markup: Google requires those to describe content actually visible on the
 * page, and inventing them is the kind of thing that earns a manual action.
 */

import { FREE_TOOLS, type FreeTool } from '@/lib/tools'

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
    description:
      'WeLeap is an AI financial sidekick. It looks at your full financial picture and gives you one clear next step — a Leap.',
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

/** Look a tool up by its route, for use inside that route's layout. */
export function toolByHref(href: string): FreeTool | undefined {
  return FREE_TOOLS.find((t) => t.href === href)
}
