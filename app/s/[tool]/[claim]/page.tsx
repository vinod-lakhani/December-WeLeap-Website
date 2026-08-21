import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { decodeRentClaim, rentClaimHeadline } from '@/lib/share/rentClaim'
import { getRegionNameBySlug } from '@/lib/zori'
import { ShareLandingBeacon } from '@/components/ShareLandingBeacon'

/**
 * Where a shared rent result lands.
 *
 * The point of the whole share mechanic. A shared PNG is a dead end — nobody
 * can click an image — so the recipient of a share previously had no route
 * back to the tool at all. This page is that route: it shows the claim they
 * saw in the feed, then sends them into the calculator to get their own.
 *
 * Only `rent` is wired up. The URL carries `[tool]` so the shape is right from
 * the start, but the other six get a share affordance only once rent's share
 * rate justifies building one — seven share routes on the strength of three
 * recorded share events would be building ahead of the evidence.
 *
 * Deliberately `noindex`. The claim space is unbounded (686 metros × a
 * percentage × two directions), and none of it should compete with the tool
 * page that actually ranks. `robots.ts` disallows /s/ as well; this is the
 * belt to that braces, because a link shared into a crawlable surface reaches
 * the page without ever reading robots.txt.
 */

const TOOL_HREF = '/how-much-rent-can-i-afford'

interface Props {
  params: Promise<{ tool: string; claim: string }>
}

/** Resolve once, so generateMetadata and the page agree on what they render. */
async function resolve(params: Props['params']) {
  const { tool, claim: claimSlug } = await params
  if (tool !== 'rent') return null

  const claim = decodeRentClaim(claimSlug)
  if (!claim) return null

  const metro = claim.kind === 'market_gap' ? await getRegionNameBySlug(claim.metroSlug) : null
  // A market_gap claim whose metro no longer exists in the data falls back to
  // the method headline rather than 404ing — an old share should keep working
  // after a data refresh drops a region.
  return { claim, metro, headline: rentClaimHeadline(claim, metro) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolved = await resolve(params)
  if (!resolved) return { title: 'Not found', robots: { index: false, follow: false } }

  return {
    title: resolved.headline,
    description:
      'Work out the rent you can actually afford on your take-home pay, not your gross salary. Free, no signup.',
    robots: { index: false, follow: true },
    // Points at the tool, not at itself: the share page is a doorway, and the
    // calculator is the thing that should hold the ranking.
    alternates: { canonical: TOOL_HREF },
    openGraph: {
      title: resolved.headline,
      description: 'Free rent calculator · no account, no email wall',
      url: TOOL_HREF,
    },
  }
}

export default async function SharedClaimPage({ params }: Props) {
  const resolved = await resolve(params)
  if (!resolved) notFound()

  const { claim, metro, headline } = resolved

  return (
    <PageShell className="bg-canvas">
      <ShareLandingBeacon tool="rent" claimKind={claim.kind} metro={metro} />

      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Someone shared this with you
          </p>

          <h1 className="text-balance text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
            {headline}
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-subtle">
            {claim.kind === 'market_gap' && metro
              ? `That gap is the whole decision. Work out yours for ${metro} — the calculator applies the band to take-home pay, not the gross figure the 30% rule is usually quoted on.`
              : 'The 30% rule is usually quoted on gross salary. Applied to take-home, the number moves — often by hundreds a month.'}
          </p>

          <div className="mt-9">
            <Link
              href={`${TOOL_HREF}?src=share`}
              className="inline-flex rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800"
            >
              Work out my rent range →
            </Link>
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
