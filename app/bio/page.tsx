import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import { BioLinks } from '@/components/BioLinks'
import { bioCards, resolveBioUtm } from '@/lib/bio'

/**
 * /bio — the link-in-bio page for Instagram and TikTok.
 *
 * Replaces a Linktree, which means it is judged on one thing: how quickly
 * somebody who tapped a link in a profile can find the thing the post was
 * about. No nav, no hero, no marketing copy above the cards.
 *
 * A SERVER COMPONENT, DELIBERATELY. The links carry attribution built from
 * this request's own query string, so the HTML ships with working hrefs and a
 * tap does not wait for hydration. An in-app browser on a phone connection is
 * exactly where that matters, and it is also what keeps the page free of
 * layout shift: nothing moves after load because nothing is decided after
 * load. The only client JavaScript is the PostHog call on tap, and losing it
 * costs an event rather than a visit.
 *
 * NOINDEX. It is a hub of links that all exist elsewhere, and /tools is the
 * page built to rank for them. Letting this compete would split the signal
 * between a thin page and the real one. `follow` so the links still pass.
 *
 * Reading searchParams makes the route dynamic, which is correct here — the
 * markup genuinely differs by visitor — and costs nothing on a page that is
 * noindex and never cached for search.
 */
export const metadata: Metadata = {
  title: 'WeLeap links',
  description: 'Free money tools from WeLeap — and the app.',
  robots: { index: false, follow: true },
}

export default function BioPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>
}) {
  const utm = resolveBioUtm(searchParams)
  const cards = bioCards(utm)

  return (
    /**
     * One page, two genuinely different readings.
     *
     * On a phone this is a bio link opened inside Instagram, where the only
     * thing that matters is how fast somebody reaches the tool the post was
     * about. On a laptop it is a page somebody arrived at from a profile and
     * is looking at properly, and a 460px column floating in 1440px of nothing
     * reads as a fragment rather than a destination.
     *
     * The mobile measurements are the constraint and they do not move: the
     * featured and app cards clear a 560px fold. Everything below is desktop-
     * only — larger mark, a slightly wider column for proportion, and a real
     * bottom edge — so the phone keeps exactly the page it had.
     */
    <main className="flex min-h-screen flex-col bg-canvas px-4 pb-10 pt-5 sm:pt-12">
      <div className="mx-auto w-full max-w-[460px] sm:max-w-[520px]">
        {/* Mark and wordmark, nothing else. Fixed intrinsic size so the column
            below cannot shift when the image decodes. Larger on desktop, where
            a 30px logo above a half-width column looks like a placeholder. */}
        <header className="mb-4 flex justify-center sm:mb-6">
          <Image
            src="/images/weleap-logo.png"
            alt="WeLeap"
            width={2972}
            height={845}
            sizes="(min-width: 640px) 148px, 106px"
            priority
            className="h-[30px] w-auto sm:h-[42px]"
          />
        </header>

        <BioLinks cards={cards} />

        {/* A bottom edge, which is most of what the desktop view was missing.
            The links are here rather than in the header for the same reason
            there is no nav: nothing competes with the cards above the fold.
            Past ten cards they cost a phone nothing, and a public page for a
            financial product with no route to its privacy policy or terms is a
            gap worth closing whatever it looks like. */}
        <footer className="mt-10 border-t border-hairline pt-6 text-center">
          <p className="text-[14.5px] font-semibold text-ink">Small decisions. Bigger futures.</p>

          <nav className="mt-3 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 text-[13px]">
            {[
              { href: '/tools', label: 'All tools' },
              { href: '/support', label: 'Support' },
              { href: '/privacy-policy', label: 'Privacy' },
              { href: '/terms-of-service', label: 'Terms' },
            ].map((link, i, all) => (
              <span key={link.href} className="inline-flex items-center">
                <Link
                  href={link.href}
                  className="-my-2 inline-flex min-h-11 items-center px-1.5 text-subtle underline-offset-[3px] hover:text-ink hover:underline"
                >
                  {link.label}
                </Link>
                {i < all.length - 1 && <span aria-hidden className="text-hairline">·</span>}
              </span>
            ))}
          </nav>

          <p className="mx-auto mt-4 max-w-[360px] text-[11.5px] leading-relaxed text-faint">
            WeLeap is not a registered investment adviser and does not provide personalized
            investment advice.
          </p>
        </footer>
      </div>
    </main>
  )
}
