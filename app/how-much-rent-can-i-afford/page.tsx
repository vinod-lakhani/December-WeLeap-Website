'use client';

import { useEffect, useRef } from 'react';
import { OfferTool } from '@/components/OfferTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { track } from '@/lib/analytics';
import { ToolFaq } from '@/components/ToolExplainer';
import { ToolPageView } from '@/components/ToolPageView';

export default function HowMuchRentCanIAffordPage() {
  // The page-view effect (rent_tool_page_view + the Meta ViewContent pixel) now
  // lives in <ToolPageView> below, which also fires `tool_viewed` — step one of
  // the shared funnel. Without it this tool had no denominator: every later step
  // was counted against nothing.

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
    <PageShell className="bg-canvas">
      {/* `tool` is the FREE_TOOLS slug, and the legacy event keeps its own name
          and params so saved GA4 reports don't drop to zero. */}
      <ToolPageView
        tool="rent"
        page="/how-much-rent-can-i-afford"
        legacyEvent="rent_tool_page_view"
        toolVersion="rent_tool_v1"
        pixelContentName="rent_tool"
      />

      {/* Hero + tool. The form used to sit third on the page, behind a
          four-step explainer — visitors arrive from social already knowing
          what they want, so the input comes first now. */}
      <Section variant="canvas" className="pt-28 md:pt-32 pb-10" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              Don&apos;t let rent break your first paycheck.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Turn your job offer into a rent range you can actually afford — and see what life looks like
              before you sign a lease.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              The usual rule of thumb is to keep rent at or under 30% of income. This free calculator applies it to
              take-home pay rather than gross salary — rent comes out of what lands in your account, not out of the
              number in the offer letter — and then shows the cash you need upfront, which is typically two to three
              months&apos; rent before you have bought any furniture.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <OfferTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Estimates only
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
                    See what rent actually costs you
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    We turn that take-home into a rent range you can afford, what you need upfront, and where things might get tight once bills hit.
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
                    Get your Day 1 guide
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed">
                    We create a simple, one-page plan you can save — and we email it to you so it's there when life starts moving fast.
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
                    Use the guide to double-check apartments and avoid stretching too thin before you sign.
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

      <ToolFaq href="/how-much-rent-can-i-afford" />

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  );
}
