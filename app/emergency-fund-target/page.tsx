'use client';

import { EmergencyFundTool } from '@/components/EmergencyFundTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb';
import { ToolPageView } from '@/components/ToolPageView';

/**
 * The actual algorithm from lib/emergencyFund/calculation.ts, written out.
 *
 * Publishing the adjustments rather than describing them vaguely is the whole
 * differentiator here: "3 to 6 months" is available everywhere and answers
 * nothing, whereas "start at 3, add 2 if you freelance, cap at 6" is a method
 * someone can check, disagree with, or apply without the calculator.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Everyone starts at three months of essential expenses',
    d: 'Essentials means rent, utilities, groceries, insurance, transport and minimum debt payments — not your whole income. Sizing the fund against income means saving for discretionary spending you would cut on day one of an actual emergency.',
  },
  {
    t: 'Unpredictable income pushes the target up',
    d: 'Mostly stable pay adds half a month, somewhat variable income adds one, and freelance or contract income adds two. The more your income can gap, the longer the runway has to be, because the gap is the thing you are insuring against.',
  },
  {
    t: 'So do tight expenses, dependants and card debt',
    d: 'If essentials eat more than 65% of your income we add a month, and more than 80% adds a month and a half — there is less slack to absorb a shock. Dependants add a month. Carrying a credit card balance adds up to half a month, because an emergency with no buffer goes straight onto the card.',
  },
  {
    t: 'Then the answer is capped between two and six months',
    d: 'The total is rounded to the nearest half month, clamped between two and six, and multiplied by your monthly essentials to give a dollar figure. Above six months the money is usually better used elsewhere; below two it does not cover the shocks that actually happen.',
  },
  {
    t: 'And you get milestones rather than one intimidating number',
    d: 'One month first as a basic cushion, then three months as a solid buffer, then your full target. Most of the protection arrives early: the first month is what stops a car repair becoming credit card debt.',
  },
];

export default function EmergencyFundTargetPage() {
  return (
    <PageShell className="bg-canvas">
      {/* Step one of the funnel. `emergency_fund_page_view` keeps its own name,
          page and tool_version so its history stays joinable. */}
      <ToolPageView
        tool="emergency_fund"
        page="/emergency-fund-target"
        legacyEvent="emergency_fund_page_view"
        toolVersion="emergency_fund_v1"
      />
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <ToolBreadcrumb href="/emergency-fund-target" />
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            Emergency Fund Target
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto')}>
            Find your safety buffer — and your next step to build it.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
            &ldquo;Three to six months&rdquo; is a range wide enough to mean nothing. This free calculator starts at
            three months of your essential expenses and adjusts from there for how stable your income is, how much of
            it your essentials consume, whether anyone depends on you, and whether you carry a card balance — then
            caps the answer at six months and shows you the milestones on the way.
          </p>
          <p className={cn('text-sm md:text-base text-faint mt-4 max-w-xl mx-auto')}>
            Free · No account needed · Estimates only
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

      <MethodSteps
        heading="How your emergency fund target is calculated"
        intro="Five rules, all published. You can run them on paper if you would rather not type your numbers in."
        steps={STEPS}
      />

      <Caveat label="What this can’t see:">
        what you already have saved elsewhere, whether your job is genuinely at risk, and whether a partner&apos;s
        income would cover the gap. Those move the number more than any of the rules above, and they need your actual
        situation rather than five dropdowns.
      </Caveat>

      <ToolFaq href="/emergency-fund-target" />

      <SiteFooter />
    </PageShell>
  );
}
