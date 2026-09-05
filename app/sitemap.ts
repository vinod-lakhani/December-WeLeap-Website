import type { MetadataRoute } from 'next'
import { FREE_TOOLS } from '@/lib/tools'
import { ARTICLES } from '@/lib/articles'

/**
 * The site had no sitemap at all, so every page — including the free
 * tools that are the top of the funnel — relied on being crawled by luck.
 *
 * Tools are pulled from FREE_TOOLS so a new one is listed the moment it is
 * registered, rather than depending on someone remembering this file. That is
 * also how the money plan tool gets listed — it is a registered tool now, not
 * a special case, and its URL moved once already without this file changing.
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
  // Higher than the legal pages: this is the App Store support URL and the
  // page people reach by searching "weleap support", so it has to be findable.
  { path: '/support', priority: 0.6, freq: 'monthly' },
  { path: '/privacy-policy', priority: 0.3, freq: 'yearly' },
  { path: '/terms-of-service', priority: 0.3, freq: 'yearly' },
]

/**
 * Articles come from lib/articles.ts rather than a list maintained here.
 *
 * This file used to carry its own copy of the twelve routes, which is the same
 * duplication that had already let the /resources cards drift out of step with
 * the articles' own bylines. One registry, one place to add an article.
 */

/**
 * `lastModified` is set only where a real date exists.
 *
 * Every URL previously carried `new Date()` at build time, so all 26 shared one
 * timestamp that changed on every deploy whether or not the page had. That is
 * the pattern Google discounts lastmod for, and it cost the articles — the one
 * place here with genuine publication dates — the freshness signal they should
 * have had. Google's guidance is to omit the field rather than supply a value
 * that isn't accurate, so the core pages and tools now omit it.
 *
 * If tools ever need a real one, it should come from a date stored alongside
 * the tool in FREE_TOOLS, not from the clock.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...CORE.map((c) => ({
      // The homepage canonical resolves to the bare origin with no trailing
      // slash, so the sitemap has to say the same thing — otherwise the two
      // nominally describe different URLs.
      url: c.path === '/' ? SITE : `${SITE}${c.path}`,
      changeFrequency: c.freq,
      priority: c.priority,
    })),
    // The tools are the acquisition surface, so they rank just under the
    // homepage and above everything else.
    ...FREE_TOOLS.map((t) => ({
      url: `${SITE}${t.href}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    ...ARTICLES.map((a) => ({
      url: `${SITE}${a.href}`,
      ...(a.datePublished ? { lastModified: a.datePublished } : {}),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
  ]
}
