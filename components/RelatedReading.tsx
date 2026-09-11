'use client'

import Link from 'next/link'
import { Section, Container } from '@/components/layout'
import { ARTICLES } from '@/lib/articles'
import { track } from '@/lib/analytics'

/**
 * Links from a calculator to the one or two articles that actually bear on it.
 *
 * This exists for a specific, measured reason. Search Console showed the twelve
 * /resources articles as "Discovered — currently not indexed" with Last crawled
 * N/A: Google had read them from the sitemap and never once fetched them. The
 * cause was structural. /resources is linked sitewide, but the articles are
 * linked only from /resources — and /resources is itself never-crawled, so the
 * whole subtree sat two hops behind a page Google would not visit. The tool
 * pages, by contrast, are crawled and indexed. Linking from them gives the
 * articles a path in from somewhere Google actually goes.
 *
 * What this is not: a link block for its own sake. Every pairing below is one
 * a reader of that calculator would plausibly want next, and each `why` says
 * what the article adds rather than restating its title. An article nobody
 * would read after that tool does not belong on that tool, even if it leaves
 * the article unlinked — a crawl path bought with an irrelevant link is the
 * kind of thing that works until it is noticed.
 *
 * Titles come from `lib/articles.ts` rather than being retyped, for the same
 * reason FAQ copy and schema read from one object: a link whose anchor text
 * has drifted from the page it points at is worse than no link.
 *
 * A client component solely so the click is measurable, matching RelatedTools.
 * The anchors are server-rendered — nothing here is hydration-gated, which
 * would defeat the entire point.
 */

export interface RelatedArticle {
  /** Route of the article — must exist in ARTICLES. */
  href: string
  /** What this article adds for someone who has just used this calculator. */
  why: string
}

export function RelatedReading({
  from,
  items,
  heading = 'Worth reading next',
}: {
  /** Analytics slug of the tool the link is leaving. */
  from: string
  items: readonly RelatedArticle[]
  heading?: string
}) {
  const resolved = items
    .map((item) => ({ ...item, article: ARTICLES.find((a) => a.href === item.href) }))
    .filter((item): item is RelatedArticle & { article: (typeof ARTICLES)[number] } => !!item.article)

  // Same silent-failure guard as RelatedTools: an unresolved href drops the
  // card rather than rendering a broken link, so a renamed article would
  // quietly remove the block. Worth grepping for after any /resources rename.
  if (resolved.length === 0) return null

  return (
    <Section variant="canvas">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
            {heading}
          </h2>

          <ul className="space-y-4">
            {resolved.map(({ article, why }) => (
              <li key={article.href}>
                <Link
                  href={article.href}
                  onClick={() =>
                    track('article_cross_link_clicked', {
                      from,
                      to: article.href,
                      surface: 'related_reading',
                    })
                  }
                  className="group flex flex-col gap-1 rounded-card border border-hairline bg-white p-5 transition hover:-translate-y-[2px] hover:border-lime hover:shadow-card"
                >
                  <span className="text-[16.5px] font-bold tracking-[-0.015em] text-brand-700 group-hover:underline">
                    {article.title}
                  </span>
                  <span className="text-[15px] leading-relaxed text-subtle">{why}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  )
}
