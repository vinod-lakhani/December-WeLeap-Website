'use client';

import { useEffect } from 'react';
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { track } from '@/lib/analytics';
import { fbqTrack } from '@/lib/meta-pixel';

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
        </Container>
      </Section>

      {/* How it works */}
      <Section variant="canvas" className="pt-0">
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

      {/* Tool */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <OfferAnalysisTool />
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  );
}
