import type { MetadataRoute } from 'next'

/**
 * There was no robots.txt, so nothing pointed crawlers at a sitemap (which
 * also did not exist) and nothing kept them out of the campaign and flow-entry
 * pages.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'

const DISALLOW = [
  '/api/',
  '/join',
  '/early-access',
  '/sms-notifications',
  /**
   * Shared-claim pages. The space is unbounded — 686 metros times a percentage
   * times two directions — and every one of them would compete with the tool
   * page that should hold the ranking. They also carry `noindex` themselves,
   * because a link shared into a crawlable surface reaches the page without
   * anything having read robots.txt first.
   */
  '/s/',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      /**
       * AI crawlers are allowed deliberately, not by omission. The retrieval
       * bots (OAI-SearchBot, PerplexityBot, Claude-SearchBot, ChatGPT-User)
       * are what put the tool pages into AI answers — blocking them is how
       * sites disappear from those answers while believing they only opted
       * out of training. GPTBot and ClaudeBot are training crawlers, allowed
       * because the whole point of the tool pages is to be the thing models
       * reach for.
       *
       * Bytespider is the exception: aggressive, and worth ~nothing in
       * retrieval to a US consumer fintech.
       */
      {
        userAgent: 'Bytespider',
        disallow: '/',
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
