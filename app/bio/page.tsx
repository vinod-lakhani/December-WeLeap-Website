import type { Metadata } from 'next'
import Image from 'next/image'

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
    <main className="min-h-screen bg-canvas px-4 pb-10 pt-5">
      <div className="mx-auto w-full max-w-[460px]">
        {/* Mark and wordmark, nothing else. Fixed intrinsic size so the column
            below it cannot shift when the image decodes. */}
        <header className="mb-4 flex justify-center">
          <Image
            src="/images/weleap-logo.png"
            alt="WeLeap"
            width={2972}
            height={845}
            sizes="106px"
            priority
            className="h-[30px] w-auto"
          />
        </header>

        <BioLinks cards={cards} />

        <footer className="mt-8 text-center">
          <p className="text-[14px] font-semibold text-ink">Small decisions. Bigger futures.</p>
          <p className="mx-auto mt-2 max-w-[340px] text-[11.5px] leading-relaxed text-faint">
            WeLeap is not a registered investment adviser and does not provide personalized
            investment advice.
          </p>
        </footer>
      </div>
    </main>
  )
}
