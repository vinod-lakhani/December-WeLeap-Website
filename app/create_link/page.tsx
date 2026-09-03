import type { Metadata } from 'next'
import { LinkBuilder } from '@/components/LinkBuilder'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'

/**
 * /create_link — internal campaign link builder.
 *
 * Not a free tool. Deliberately absent from FREE_TOOLS, which is what keeps it
 * out of the sitemap, the /tools grid, the footer and the funnel
 * instrumentation guard — all four of which are derived from that one list.
 *
 * noindex and disallowed in robots.txt. It is a URL people paste to each
 * other, not a page anyone should reach from a search result, and an indexed
 * internal utility is the kind of thing that turns up in a competitor's
 * screenshot.
 *
 * The underscore in the route is deliberate and matches what was asked for.
 * Every public route here is hyphenated, which is the right convention for
 * pages that need to rank; this one does not, and the shape of the URL is a
 * small signal that it is a back-office page.
 */

export const metadata: Metadata = {
  title: 'Campaign link builder',
  description: 'Internal tool for generating consistent campaign links.',
  robots: { index: false, follow: false },
}

export default function CreateLinkPage() {
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-[clamp(2rem,3.4vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
              Campaign link builder
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-subtle md:text-lg">
              Build a link that will actually be countable later. Pick a destination and who is
              sending it; everything else is filled in or checked for you.
            </p>

            <div className="mt-8">
              <LinkBuilder />
            </div>

            {/* The convention, stated once, for anyone who wants to know why
                the fields are what they are rather than just filling them. */}
            <div className="mt-10 rounded-xl border border-hairline bg-white p-5">
              <h2 className="text-base font-bold text-ink">Why the fields are what they are</h2>
              <dl className="mt-3 space-y-2.5 text-sm leading-relaxed text-subtle">
                <div>
                  <dt className="inline font-semibold text-ink">Source</dt>
                  <dd className="inline"> — who is sending. A person or a programme, never a platform.</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Medium</dt>
                  <dd className="inline"> — the mechanism. Referral, campus, social, dm.</dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Campaign</dt>
                  <dd className="inline">
                    {' '}
                    — the effort plus the month, so the same push in two different months can be
                    compared instead of merged.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold text-ink">Content</dt>
                  <dd className="inline">
                    {' '}
                    — the individual person or channel. Keeping the programme in Source and the
                    person in Content is what lets every ambassador stay separately countable while
                    the programme still totals under one number, and it means adding the twelfth
                    ambassador is a new value rather than a new scheme.
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-relaxed text-subtle">
                Links are only worth anything if they are used every time. A signup that arrives
                without one cannot be credited to anybody after the fact.
              </p>
            </div>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
