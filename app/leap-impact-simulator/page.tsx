'use client';

import { Suspense, useEffect } from 'react';
import { LeapImpactTool } from '@/components/LeapImpactTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
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
    <PageShell className="bg-canvas">
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            Is your paycheck working as hard as you are?
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto')}>
            A small change now can make a big difference later.
            Let&apos;s check in 10 seconds.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="flex-1">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <Suspense fallback={<div className="min-h-[400px] flex items-center justify-center text-gray-500">Loading...</div>}>
              <LeapImpactTool />
            </Suspense>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  );
}
