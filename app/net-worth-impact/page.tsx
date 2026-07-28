'use client';

import { useEffect } from 'react';
import { ImpactTool } from '@/components/netWorthImpact/ImpactTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { track } from '@/lib/analytics';

export default function NetWorthImpactPage() {
  useEffect(() => {
    const timer = setTimeout(() => {
      track(
        'net_worth_impact_page_view',
        { page: '/net-worth-impact', tool_version: 'net_worth_impact_v1' },
        true
      );
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PageShell className="bg-canvas">
      {/* Hero */}
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            What is $150/month worth?
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto mb-5 md:mb-6')}>
            Small moves compound. Here’s the future version.
          </p>
          <p className={cn('text-xs md:text-sm text-faint mt-4 max-w-2xl mx-auto')}>
            One monthly change → net worth impact at 1, 10, and 30 years. Investing, cash, or debt payoff.
          </p>
          <p className={cn('text-xs md:text-sm text-faint mt-6 md:mt-8 max-w-2xl mx-auto')}>
            Estimates only. Not financial advice.
          </p>
        </Container>
      </Section>

      {/* Calculator */}
      <Section variant="canvas">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <ImpactTool />
          </div>
        </Container>
      </Section>

      {/* FAQ accordion */}
      <Section variant="white" className="bg-white">
        <Container>
          <div className="max-w-3xl mx-auto">
            <h2 className={cn(TYPOGRAPHY.h2, 'text-[#111827] mb-6 md:mb-8 text-center')}>
              FAQ
            </h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="why-5" className="border-[#D1D5DB]">
                <AccordionTrigger className="text-[#111827] hover:no-underline">
                  Why 7%?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#111827]/80">
                  We use 7% real (inflation-adjusted) as a long-term estimate for growth. It’s in the ballpark of what many assume for a diversified portfolio over decades, but we don’t lock you into any specific product or index.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="market-ups-downs" className="border-[#D1D5DB]">
                <AccordionTrigger className="text-[#111827] hover:no-underline">
                  What about market ups and downs?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#111827]/80">
                  This tool smooths growth into a single rate. Real markets go up and down. Think of the numbers as a long-horizon, directional guide — not a guarantee any given year.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="financial-advice" className="border-[#D1D5DB]">
                <AccordionTrigger className="text-[#111827] hover:no-underline">
                  Is this financial advice?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[#111827]/80">
                  No. This is an educational calculator to help you see how one monthly change could play out over time. Your situation is unique; for advice tailored to you, consider a licensed financial professional.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </Container>
      </Section>

      {/* Footer */}
      <SiteFooter />
    </PageShell>
  );
}
