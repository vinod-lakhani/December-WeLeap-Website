'use client';

import { useEffect } from 'react';
import { EmergencyFundTool } from '@/components/EmergencyFundTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { track } from '@/lib/analytics';

export default function EmergencyFundTargetPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track('emergency_fund_page_view', {
        page: '/emergency-fund-target',
        tool_version: 'emergency_fund_v1',
      }, true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            Emergency Fund Target
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto')}>
            Find your safety buffer — and your next step to build it.
          </p>
          <p className={cn('text-sm md:text-base text-faint mt-4 max-w-xl mx-auto')}>
            Not everyone needs 6 months. Find your number.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="flex-1">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <EmergencyFundTool />
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  );
}
