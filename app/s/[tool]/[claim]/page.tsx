import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { resolveShareClaim } from '@/lib/share/claims'
import { ShareLandingBeacon } from '@/components/ShareLandingBeacon'
import { ShareLandingCta } from '@/components/ShareLandingCta'

/**
 * Where a shared claim lands.
 *
 * The point of the whole mechanic. A shared PNG is a dead end — nobody can
 * click an image — so the recipient of a share previously had no route back to
 * the tool. This page is that route: it shows the claim they saw in the feed,
 * then sends them into the calculator to get their own.
 *
 * Tool-agnostic. Everything specific to rent or offer lives in
 * lib/share/claims.ts, so a third tool is a registry entry rather than another
 * branch in three files.
 *
 * Deliberately `noindex`. The claim space is unbounded and none of it should
 * compete with the tool page that actually ranks. `robots.ts` disallows /s/ as
 * well; this is the belt to that braces, because a link shared into a
 * crawlable surface reaches the page without anything having read robots.txt.
 */

interface Props {
  params: Promise<{ tool: string; claim: string }>
}

async function resolve(params: Props['params']) {
  const { tool, claim } = await params
  return resolveShareClaim(tool, claim)
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const claim = await resolve(params)
  if (!claim) return { title: 'Not found', robots: { index: false, follow: false } }

  return {
    title: claim.headline,
    description: claim.supporting,
    robots: { index: false, follow: true },
    // Points at the tool, not at itself: the share page is a doorway, and the
    // calculator is the thing that should hold the ranking.
    alternates: { canonical: claim.toolHref },
    openGraph: {
      title: claim.headline,
      description: 'Free · no account, no email wall',
      url: claim.toolHref,
    },
  }
}

export default async function SharedClaimPage({ params }: Props) {
  const claim = await resolve(params)
  if (!claim) notFound()

  return (
    <PageShell className="bg-canvas">
      <ShareLandingBeacon
        tool={claim.toolSlug}
        claimKind={claim.claimKind}
        metro={claim.metro ?? null}
      />

      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Someone shared this with you
          </p>

          {/* A measure, so `text-balance` has something to balance against.
              Without one the claim set as full-width centred lines the eye had
              to track back across; at 26ch it lands in two or three even ones.
              The state code is joined to the city with a non-breaking space in
              rentClaimHeadline, so it never starts a line alone. */}
          <h1 className="mx-auto max-w-[26ch] text-balance text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-ink">
            {claim.headline}
          </h1>

          <p className="mx-auto mt-5 max-w-md text-[16.5px] leading-relaxed text-subtle">
            {claim.supporting}
          </p>

          <div className="mt-8">
            {/* `?src=share` is read on arrival by UtmCapture and registered as
                a first-touch super property, so every event the visitor goes
                on to fire in the tool carries it. That is what makes "did a
                share produce a completion" answerable at all. */}
            <ShareLandingCta
              href={`${claim.toolHref}?src=share`}
              label={claim.ctaLabel}
              tool={claim.toolSlug}
              claimKind={claim.claimKind}
            />
          </div>

          <p className="mt-4 text-[13.5px] text-faint">
            Free · About 60 seconds · No account, no email wall
          </p>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
