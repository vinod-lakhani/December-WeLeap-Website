'use client';

import { useEffect } from 'react';
import { LeapImpactTool } from '@/components/LeapImpactTool';
import { PageShell, Section, Container } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { track } from '@/lib/analytics';

export default function LeapImpactSimulatorPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track('leap_impact_viewed', { page: '/leap-impact-simulator' }, true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell>
      <Section variant="brand" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn(TYPOGRAPHY.h1, 'text-white mb-6 md:mb-8')}>
            Set your wealth trajectory correctly (in under 60 seconds).
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-white/85 leading-relaxed max-w-2xl mx-auto mb-5 md:mb-6')}>
            Small allocation choices now can change your lifetime net worth by six figures.
          </p>
          <p className={cn('text-xs md:text-sm text-white/60 mt-4 max-w-2xl mx-auto')}>
            One Leap. One chart. Your numbers.
          </p>
        </Container>
      </Section>

      <Section variant="muted" className="bg-[#F9FAFB]">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <p className="text-center text-base md:text-lg text-gray-700 mb-6 md:mb-8 font-medium">
              Enter your details to see your trajectory
            </p>
            <LeapImpactTool />
          </div>
        </Container>
      </Section>

      <footer className="bg-white border-t border-gray-200 py-8 px-6">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/weleap-logo.png" alt="WeLeap" className="h-7 w-auto" />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-gray-500 text-sm">
              <p>© 2024 WeLeap.</p>
              <Link href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Privacy Policy
              </Link>
              <Link href="/terms-of-service" className="hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </Container>
      </footer>
    </PageShell>
  );
}
