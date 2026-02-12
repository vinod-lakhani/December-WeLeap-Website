'use client';

import { Suspense, useEffect } from 'react';
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
            Is your paycheck set up correctly?
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-white/85 leading-relaxed max-w-2xl mx-auto')}>
            Enter your salary and benefit setup.
            We&apos;ll show you the single highest-impact move — and what it&apos;s worth over 30 years.
          </p>
          <ul className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-6 gap-y-1 mt-6 text-sm text-white/80">
            <li>Takes ~2 minutes</li>
            <li>No email required</li>
            <li>Based on your actual employer match + tax setup</li>
          </ul>
        </Container>
      </Section>

      <Section variant="muted" className="bg-[#F9FAFB]">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-gray-500">Loading...</div>}>
              <LeapImpactTool />
            </Suspense>
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
