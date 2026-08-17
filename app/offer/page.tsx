'use client';

import { useEffect } from 'react';
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { track } from '@/lib/analytics';
import { fbqTrack } from '@/lib/meta-pixel';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';

/**
 * The seven-number grid below already existed, but a grid of labels tells a
 * reader (or a model) that seven numbers exist without saying what any of them
 * are worth or how they combine. These steps are the missing half.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'It starts from take-home, not base salary',
    d: 'We estimate federal income tax, your state’s income tax and FICA, then show what actually lands each month. For most salaries between $60,000 and $150,000 that is somewhere between roughly 65% and 78% of gross, and the state you work in moves it more than almost anything else in the offer.',
  },
  {
    t: 'Then it prices the six things that aren’t salary',
    d: 'Bonus target, employer 401(k) match, health and HSA contributions, equity, and paid time off. A dollar-for-dollar match up to 5% of an $80,000 salary is $4,000 a year you only receive if you contribute — that is a bigger swing than most negotiated salary increases.',
  },
  {
    t: 'It puts housing next to the offer',
    d: 'A market rent estimate for the city goes beside your take-home, because the same salary buys very different lives in different places. Comparing two offers on base salary alone is comparing the one number that varies least.',
  },
  {
    t: 'And it shows the total against the number in the letter',
    d: 'Base salary is typically 70% to 90% of what an offer is worth. The gap between the two figures is what you would be giving up by taking the higher base — or what you would be gaining by taking the lower one.',
  },
];

export default function OfferAnalysisPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track('offer_analysis_page_view', { page: '/offer', tool_version: 'offer_tool_v1' }, true);
    }, 500);
    // Meta Pixel: ViewContent on tool page (Phase 0).
    fbqTrack('ViewContent', { content_name: 'offer_tool' });
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell className="bg-canvas">
      {/* Hero */}
      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          {/* lime on the old dark hero; on the warm canvas it needs brand green to stay legible */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-700" />
            Free · No account required
          </div>
          <h1 className="mb-4 text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            Your offer letter has{' '}
            <span className="text-brand-700">7 numbers.</span>
            <br />Most people only read one.
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-subtle">
            Enter your offer details below. We&apos;ll show you what the full package is actually worth
            — and what you&apos;ll keep each month.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-subtle">
            This free offer letter calculator turns base salary, bonus, 401(k) match, benefits, equity, time off and
            local housing costs into one annual figure and one monthly take-home figure. Base salary is usually only
            70% to 90% of what an offer is worth, which is why two offers that look a few thousand apart often
            aren&apos;t.
          </p>
        </Container>
      </Section>

      {/* Tool sits directly under the hero — same reasoning as the rent tool:
          people arrive knowing what they want, so the input comes first and
          the explainer becomes reinforcement below. */}
      <Section variant="canvas" className="pt-0">
        <Container maxWidth="narrow">
          <OfferAnalysisTool />
        </Container>
      </Section>

      {/* How it works */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">The 7 numbers in your offer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {[
              { n: '1', label: 'Base salary' },
              { n: '2', label: 'Bonus target' },
              { n: '3', label: '401k match' },
              { n: '4', label: 'HSA & benefits' },
              { n: '5', label: 'Equity' },
              { n: '6', label: 'Time off' },
              { n: '7', label: 'Housing cost' },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-[#386641] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {item.n}
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <MethodSteps heading="How we value an offer" steps={STEPS} />

      <Caveat label="What this can’t see:">
        your existing savings, what you already contribute, and whether the equity is worth anything. Public-company
        RSUs have a price; private-company options have a scenario. We show equity as its own line rather than folding
        it into a total, so it never quietly inflates the number you plan your rent against.
      </Caveat>

      <ToolFaq href="/offer" />

      <SiteFooter />
    </PageShell>
  );
}
