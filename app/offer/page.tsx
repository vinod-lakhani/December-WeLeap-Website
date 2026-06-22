'use client';

import { useEffect } from 'react';
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool';
import { PageShell, Section, Container } from '@/components/layout';
import { track } from '@/lib/analytics';

export default function OfferAnalysisPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track('offer_analysis_page_view', { page: '/offer', tool_version: 'offer_tool_v1' }, true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell>
      {/* Hero */}
      <Section variant="brand" isHero className="text-center">
        <Container maxWidth="narrow">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm font-semibold text-[#A7C957] mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A7C957] inline-block" />
            Free · No account required
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
            Your offer letter has{' '}
            <span className="text-[#A7C957]">7 numbers.</span>
            <br />Most people only read one.
          </h1>
          <p className="text-lg text-white/60 max-w-md mx-auto">
            Enter your offer details below. We&apos;ll show you what the full package is actually worth
            — and what you&apos;ll keep each month.
          </p>
        </Container>
      </Section>

      {/* How it works */}
      <Section variant="muted" className="pt-0">
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

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        <a href="/privacy-policy" className="hover:underline">Privacy</a>
        {' · '}
        <a href="/terms-of-service" className="hover:underline">Terms</a>
        {' · '}
        <span>© {new Date().getFullYear()} WeLeap</span>
      </footer>
    </PageShell>
  );
}
