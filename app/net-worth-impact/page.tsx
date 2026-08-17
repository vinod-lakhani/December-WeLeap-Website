'use client';

import { useEffect } from 'react';
import { ImpactTool } from '@/components/netWorthImpact/ImpactTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';

/**
 * The three models in lib/networthImpact/math.ts, described rather than
 * implied. They are genuinely different formulas and the difference is the
 * point of the tool — the same $150 is worth wildly different amounts
 * depending on which of the three it goes to.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Investing: compounded monthly at 7% real',
    d: 'We take the future value of your monthly amount compounding at a 7% real (inflation-adjusted) return — the convention most retirement projections use. $150 a month comes to about $25,963 after ten years and about $182,996 after thirty, of which roughly $129,000 is growth rather than money you paid in.',
  },
  {
    t: 'Cash: no growth at all',
    d: 'Money held as cash is shown as the sum of the deposits and nothing else. That is deliberately unflattering, and it is the honest comparison: cash keeps its number and loses its purchasing power, which is the trade you are making for being able to reach it tomorrow.',
  },
  {
    t: 'Debt: the interest you stop paying',
    d: 'Paying extra against a balance is modelled as interest avoided rather than a return earned, because that is what it is. At a 22% APR that avoided interest is a guaranteed 22% — higher than any expected market return, which is why debt usually wins the comparison outright.',
  },
  {
    t: 'All three, at one, ten and thirty years',
    d: 'The three horizons are there because the argument for starting early is invisible at ten years and overwhelming at thirty. With $150 a month invested, the third decade adds more than the first two combined.',
  },
];

export default function NetWorthImpactPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track(
        'net_worth_impact_page_view',
        { page: '/net-worth-impact', tool_version: 'net_worth_impact_v1' },
        true
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell className="bg-canvas">
      {/* Hero */}
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            What is $150/month worth?
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto mb-5 md:mb-6')}>
            Small moves compound. Here’s the future version.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
            Invested at a 7% real return, $150 a month is worth about $1,859 after a year, about $25,963 after ten
            years and about $182,996 after thirty. This free calculator runs any monthly amount through three
            different models — investing, holding cash, or paying down debt — and shows the net worth impact at one,
            ten and thirty years.
          </p>
          <p className={cn('text-xs md:text-sm text-faint mt-6 md:mt-8 max-w-2xl mx-auto')}>
            Estimates only. Not financial advice.
          </p>
        </Container>
      </Section>

      {/* Calculator */}
      <Section variant="canvas">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <ImpactTool />
          </div>
        </Container>
      </Section>

      <MethodSteps heading="How the projection is calculated" steps={STEPS} />

      <Caveat label="What this can’t see:">
        that you will not actually contribute the same amount for thirty years, that markets do not deliver a smooth
        7%, and that the order returns arrive in matters enormously over a working life. Read the output as scale, not
        as a balance on a date.
      </Caveat>

      {/* Was a Radix accordion. Radix unmounts closed panels, so two of the
          three answers were never in the served HTML — invisible to a crawler
          and to anything summarising the page. Rendered flat now, which is also
          what makes the FAQPage markup in layout.tsx honest. */}
      <ToolFaq href="/net-worth-impact" />

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  );
}
