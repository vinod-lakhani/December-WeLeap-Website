'use client';

import { useEffect, useRef } from 'react';
import { OfferTool } from '@/components/OfferTool';
import { PageShell, Section, Container } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { track } from '@/lib/analytics';

export default function HowMuchRentCanIAffordPage() {
  // Track page view on mount
  useEffect(() => {
    track('rent_tool_page_view', {
      page: '/how-much-rent-can-i-afford',
      tool_version: 'rent_tool_v1',
    });
  }, []);

  // Track scroll past "How it works" section
  const howItWorksSentinelRef = useRef<HTMLDivElement>(null);
  const scrollTrackedRef = useRef(false);

  useEffect(() => {
    if (!howItWorksSentinelRef.current || scrollTrackedRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !scrollTrackedRef.current) {
            scrollTrackedRef.current = true;
            track('scrolled_past_how_it_works', {
              page: '/how-much-rent-can-i-afford',
              tool_version: 'rent_tool_v1',
            });
            observer.disconnect();
          }
        });
      },
      {
        // Trigger when element enters viewport
        threshold: 0.1,
      }
    );

    observer.observe(howItWorksSentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);


  return (
    <PageShell>
      {/* Hero Section */}
      <Section variant="brand" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-6 md:mb-8")}>
            Don't let rent break your first paycheck.
          </h1>
          <p className={cn(TYPOGRAPHY.body, "text-white/85 leading-relaxed max-w-2xl mx-auto mb-5 md:mb-6")}>
            Turn your job offer into a safe rent range — and see what life actually looks like before you sign a lease.
          </p>
          <p className={cn("text-xs md:text-sm text-white/60 mt-4 max-w-2xl mx-auto")}>
            Most people overcommit on rent before they understand their real cash flow.
          </p>
          <p className={cn("text-sm text-white/70 mt-6 md:mt-8")}>
            Built for early-career decisions. Estimates only.
          </p>
        </Container>
      </Section>

      {/* How it works Section */}
      <Section variant="white" className="bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className={cn(TYPOGRAPHY.h2, "text-[#111827] mb-8 md:mb-10 text-center")}>
              How it works (30 seconds)
            </h2>
            
            <div className="space-y-8 md:space-y-10">
              {/* Step 1 */}
              <div className="flex gap-4 md:gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm md:text-base font-semibold text-gray-600">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                    Start with your job offer
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Enter your salary, city, and start date. We estimate your real take-home pay after taxes — the number that actually matters.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 md:gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm md:text-base font-semibold text-gray-600">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                    See what rent really does
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    We translate that take-home pay into a safe rent range, upfront cash needs, and where things may get tight once bills hit.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 md:gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm md:text-base font-semibold text-gray-600">3</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                    Get your Day 1 Playbook
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    We generate a simple, one-page plan you can save — and we email it to you so it's there when life starts moving fast.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4 md:gap-5">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center">
                    <span className="text-sm md:text-base font-semibold text-gray-600">4</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg md:text-xl font-semibold text-[#111827] mb-2">
                    Decide with confidence
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    Use the playbook to sanity-check apartments and avoid overcommitting before you sign a lease.
                  </p>
                </div>
              </div>
            </div>

            {/* Differentiation Line */}
            <div className="mt-12 md:mt-16 pt-8 md:pt-10 border-t border-gray-200 pl-6 md:pl-8 border-l-2 border-l-[#3F6B42]/20">
              <p className="text-sm md:text-base text-gray-800 leading-relaxed">
                <span className="font-bold text-[#111827]">Why this is different:</span> Most rent calculators stop at a number. This shows you what life actually looks like after you sign.
              </p>
            </div>
            
            {/* Sentinel element for scroll tracking */}
            <div ref={howItWorksSentinelRef} className="absolute bottom-0 w-full h-1" />
          </div>
        </Container>
      </Section>

      {/* Calculator Section */}
      <Section variant="muted" className="bg-[#F9FAFB]">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <p className="text-center text-base md:text-lg text-gray-700 mb-6 md:mb-8 font-medium">
              Enter your details to generate your Day 1 Playbook
            </p>
            <OfferTool />
          </div>
        </Container>
      </Section>

      {/* Footer */}
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
