import type { Metadata } from 'next'
import { RentTool } from '@/components/RentTool'
import { PageShell, Section, Container } from '@/components/layout'

/**
 * /rent_text — internal test page: the rent calculator with the text door.
 *
 * Same pattern as /create_link: absent from FREE_TOOLS (so out of the sitemap, the /tools grid and the
 * funnel guard), noindex, and disallowed in robots.txt.
 */
export const metadata: Metadata = {
  title: 'Rent text pilot (internal)',
  robots: { index: false, follow: false },
}

export default function Page() {
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl">
            <h1 className="text-balance text-[clamp(2rem,3.4vw,2.8rem)] font-extrabold leading-[1.08] tracking-[-0.03em] text-ink">
              Rent text pilot
            </h1>
            <p className="mt-4 text-base leading-relaxed text-subtle">Internal test page. Not linked from the site.</p>
            <div className="mt-8">
              <RentTool textPilot />
            </div>
          </div>
        </Container>
      </Section>
    </PageShell>
  )
}
