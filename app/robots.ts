import type { MetadataRoute } from 'next'

/**
 * There was no robots.txt, so nothing pointed crawlers at a sitemap (which
 * also did not exist) and nothing kept them out of the campaign and flow-entry
 * pages.
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
          '/join',
          '/early-access',
          '/sms-notifications',
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  }
}
