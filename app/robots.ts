import type { MetadataRoute } from 'next'

/**
 * There was no robots.txt, so nothing pointed crawlers at a sitemap (which
 * also did not exist) and nothing kept them out of the campaign and flow-entry
 * pages.
 *
 * /allocator is disallowed for now because it cannot compute anything without
 * salary and state as prefill — a crawler landing there would index a page
 * with no capital figure and no allocation split. Remove the entry once it can
 * start from nothing.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/allocator',
          '/join',
          '/early-access',
          '/mvp-access',
          '/sms-notifications',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
