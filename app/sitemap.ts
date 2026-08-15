import type { MetadataRoute } from 'next'
import { FREE_TOOLS } from '@/lib/tools'

/**
 * The site had no sitemap at all, so every page — including the seven free
 * tools that are the top of the funnel — relied on being crawled by luck.
 *
 * Tools are pulled from FREE_TOOLS so a new one is listed the moment it is
 * registered, rather than depending on someone remembering this file. That is
 * also how /allocator gets listed — it is a registered tool now, not a special
 * case.
 *
 * Deliberately excluded:
 *  - /join, /early-access, /sms-notifications — campaign and flow-entry
 *    pages, not destinations we want ranked.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.weleap.ai'

const CORE: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, freq: 'weekly' },
  { path: '/tools', priority: 0.9, freq: 'weekly' },
  { path: '/pricing', priority: 0.7, freq: 'monthly' },
  { path: '/about', priority: 0.5, freq: 'monthly' },
  { path: '/resources', priority: 0.6, freq: 'weekly' },
  { path: '/privacy-policy', priority: 0.3, freq: 'yearly' },
  { path: '/terms-of-service', priority: 0.3, freq: 'yearly' },
]

/** Long-form articles under /resources. */
const ARTICLES = [
  '/resources/adaptable-money-system',
  '/resources/awareness-to-action',
  '/resources/credit-score-myths',
  '/resources/emergency-fund',
  '/resources/emergency-fund-guess',
  '/resources/featured-article',
  '/resources/financial-autopilot',
  '/resources/income-allocation',
  '/resources/pricing-philosophy',
  '/resources/psychology-of-spending',
  '/resources/the-rent-check-panic',
  '/resources/traditional-tools-fail',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return [
    ...CORE.map((c) => ({
      url: `${SITE}${c.path}`,
      lastModified: now,
      changeFrequency: c.freq,
      priority: c.priority,
    })),
    // The tools are the acquisition surface, so they rank just under the
    // homepage and above everything else.
    ...FREE_TOOLS.map((t) => ({
      url: `${SITE}${t.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE}${a}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ]
}
