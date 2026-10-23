import type { Metadata } from 'next'
import { RentTool } from '@/components/RentTool'
import { PageShell, Section, Container } from '@/components/layout'
import { CAMPAIGN_ROBOTS, isCampaign } from '@/lib/campaign'
import { ToolPageView } from '@/components/ToolPageView'

/**
 * /rent_text — the rent calculator with the text door: the paid landing for the rent text pilot.
 *
 * A separate route so the paid cohort is isolated (every visitor came from the ad), the canonical SEO page
 * stays untouched while the capture is new, and the kill switch is the ad's final URL rather than a deploy.
 * Google scores the landing page against the ad, so the title, heading and copy are the live page's
 * (/how-much-rent-can-i-afford), and so is the instrumentation: the same tool_viewed slug and legacy event,
 * campaign mode for `?campaign=1`, and RentTool's own tool_completed / tool_cta_clicked and app link.
 * noindex (crawlable, so search engines can see it) and out of FREE_TOOLS, the sitemap and the /tools grid.
 * The explainer and cross-sell sections stay on the canonical page: here they would only be exits.
 */
export const metadata: Metadata = {
  title: 'How much rent can I afford? Free calculator',
  description:
    'Turn a salary into a monthly rent range based on take-home pay, not gross — plus the cash you need upfront before you get keys. Free, no signup.',
  robots: CAMPAIGN_ROBOTS,
}

export default function Page({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const campaign = isCampaign(searchParams)
  return (
    <PageShell className="bg-canvas" bare={campaign}>
      <ToolPageView
        tool="rent"
        page="/rent_text"
        legacyEvent="rent_tool_page_view"
        toolVersion="rent_tool_v1"
        campaign={campaign}
      />
      <Section variant="canvas" className={campaign ? 'pt-8 pb-10' : 'pt-28 md:pt-32 pb-10'} isHero>
        <Container>
          {!campaign && (
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
                How much rent can I afford?
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
                Don&apos;t let rent break your first paycheck. Turn a salary into a rent range you can actually live
                with — and see what life looks like before you sign a lease.
              </p>
            </div>
          )}
          <div
            id="calculator"
            className={campaign ? 'mx-auto max-w-3xl scroll-mt-24' : 'mx-auto mt-10 max-w-3xl scroll-mt-24'}
          >
            <RentTool campaign={campaign} textPilot />
          </div>
          {!campaign && (
            <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
              Free · No account needed · Estimates only
            </p>
          )}
        </Container>
      </Section>
    </PageShell>
  )
}
