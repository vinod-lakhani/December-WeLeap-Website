import type { Metadata } from 'next'
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool'
import { PageShell, Section, Container } from '@/components/layout'
import { CAMPAIGN_ROBOTS, isCampaign } from '@/lib/campaign'
import { ToolPageView } from '@/components/ToolPageView'

/**
 * /offer_text — the offer calculator with the text door: the paid landing for the offer text pilot.
 *
 * Same reasoning as /rent_text: an isolated paid cohort, the canonical page untouched, the ad's final URL as
 * the kill switch. Title, heading, copy and instrumentation are the live page's (/what-is-my-job-offer-worth),
 * including campaign mode for `?campaign=1`. noindex (crawlable) and out of FREE_TOOLS, the sitemap and the
 * /tools grid; the explainer and cross-sell sections stay on the canonical page.
 */
export const metadata: Metadata = {
  title: 'What is my job offer really worth? Free calculator',
  description:
    'See what a job offer is worth beyond base salary — bonus, 401(k) match, benefits, equity and PTO — plus monthly take-home after tax and local rent.',
  robots: CAMPAIGN_ROBOTS,
  // Byte-identical to the rendered `title` (root `%s | WeLeap` template), as on the live page; checked by
  // scripts/checkMetadata.js. The share image is the live page's (opengraph-image.tsx).
  openGraph: {
    title: 'What is my job offer really worth? Free calculator | WeLeap',
    description:
      'See what a job offer is worth beyond base salary — bonus, 401(k) match, benefits, equity and PTO — plus monthly take-home after tax and local rent.',
    url: '/offer_text',
  },
}

export default function Page({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const campaign = isCampaign(searchParams)
  return (
    <PageShell className="bg-canvas" bare={campaign}>
      <ToolPageView
        tool="offer"
        page="/offer_text"
        legacyEvent="offer_analysis_page_view"
        legacyPage="/offer"
        toolVersion="offer_tool_v1"
        campaign={campaign}
      />
      {!campaign && (
        <Section variant="canvas" isHero className="text-center">
          <Container maxWidth="narrow">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-700" />
              Free · No account required
            </div>
            <h1 className="mb-4 text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What is your job offer <span className="text-brand-700">really worth?</span>
            </h1>
            <p className="mx-auto max-w-md text-lg leading-relaxed text-subtle">
              Your offer letter has seven numbers in it. Most people only read one.
            </p>
          </Container>
        </Section>
      )}
      <Section variant="canvas" className={campaign ? 'pb-10 pt-8' : 'pt-0'}>
        <Container maxWidth="narrow">
          <OfferAnalysisTool campaign={campaign} textPilot />
        </Container>
      </Section>
    </PageShell>
  )
}
