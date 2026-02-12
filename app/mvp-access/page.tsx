'use client';

import { useEffect } from 'react';
import { PageShell, Section, Container } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function MvpAccessContent() {
  const searchParams = useSearchParams();
  const confirmed = searchParams?.get('confirmed') === '1';

  useEffect(() => {
    track('mvp_access_page_viewed', {});
  }, []);

  return (
    <PageShell>
      <Section variant="white" className="pt-28 md:pt-36 pb-16">
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, 'text-[#111827] mb-4')}>
            MVP execution access
          </h1>
          {confirmed ? (
            <div className="space-y-4">
              <p className={cn(TYPOGRAPHY.body, 'text-gray-600')}>
                You’re already on the early access list. We’ll email you when execution goes live.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className={cn(TYPOGRAPHY.body, 'text-gray-600')}>
                We’re launching execution in ~2 weeks. You’ll get an email the moment it’s live so you can apply your plan in the MVP.
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-[#111827] mb-2">What to expect</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>Timeline: ~2 weeks to launch</li>
                  <li>We’ll email you at the address you signed up with</li>
                  <li>No plan storage yet — you’ll run your numbers in the tool when you’re ready</li>
                </ul>
              </div>
              <p className="text-sm text-gray-600">
                Want to rerun your numbers?{' '}
                <Link href="/leap-impact-simulator" className="text-[#3F6B42] font-medium hover:underline" onClick={() => track('leap_tool_rerun_clicked', { source: 'mvp_access' })}>
                  Open the Leap Impact tool
                </Link>
              </p>
            </div>
          )}
        </Container>
      </Section>
    </PageShell>
  );
}

export default function MvpAccessPage() {
  return (
    <Suspense fallback={
      <PageShell>
        <Section variant="white" className="pt-28 md:pt-36 pb-16">
          <Container maxWidth="narrow">
            <div className="h-10 bg-gray-200 rounded w-2/3 animate-pulse mb-4" />
            <div className="h-4 bg-gray-100 rounded w-full animate-pulse" />
          </Container>
        </Section>
      </PageShell>
    }>
      <MvpAccessContent />
    </Suspense>
  );
}
