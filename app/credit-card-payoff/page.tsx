'use client';

import { CreditCardPayoffTool } from '@/components/CreditCardPayoffTool';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { TYPOGRAPHY } from '@/lib/layout-constants';
import { cn } from '@/lib/utils';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb';
import { ToolPageView } from '@/components/ToolPageView';

/**
 * What the calculator does, stated once and in the order it does it. The
 * minimum-payment formula is the load-bearing part: nobody disputes that
 * credit card debt is expensive, but almost nobody knows that a minimum
 * payment is deliberately structured to be mostly interest.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Enter each card’s balance and APR',
    d: 'You can add every card you carry. Interest is charged monthly at your APR divided by twelve, so a $5,000 balance at 22% accrues about $92 in the first month before you have paid anything.',
  },
  {
    t: 'We assume you keep paying the minimum on every card',
    d: 'The minimum is modelled the way most US issuers set it: 1% of the balance plus that month’s interest, with a $25 floor. That is roughly $142 on a $5,000 balance at 22% — of which only about $50 actually reduces what you owe.',
  },
  {
    t: 'Then you add whatever you can pay on top',
    d: 'Every dollar above the minimum goes entirely to principal, which is why the slider moves the payoff date so violently. This calculator applies your extra payment to your highest-APR card first — the avalanche method — and shows the new debt-free date and the interest you avoid.',
  },
  {
    t: 'And we show what the payment becomes once the card clears',
    d: 'The month a card is paid off, the payment you were making does not disappear — it becomes surplus. That is the largest single jump in monthly cash flow most people get, and the easiest moment to redirect money, because it is already gone from your budget.',
  },
];

export default function CreditCardPayoffPage() {
  return (
    <PageShell className="bg-canvas">
      {/* Step one of the funnel. `credit_card_payoff_page_view` keeps its own
          name, page and tool_version so its history stays joinable. */}
      <ToolPageView
        tool="credit_card_payoff"
        page="/credit-card-payoff"
        legacyEvent="credit_card_payoff_page_view"
        toolVersion="credit_card_payoff_v1"
      />
      <Section variant="canvas" className="text-center pt-28 md:pt-36 pb-14 md:pb-18" isHero>
        <Container>
          <ToolBreadcrumb href="/credit-card-payoff" />
          <h1 className={cn("text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink", "mb-6 md:mb-8")}>
            Credit Card Payoff
          </h1>
          <p className={cn(TYPOGRAPHY.body, 'text-subtle leading-relaxed max-w-2xl mx-auto')}>
            See when you&apos;ll be debt-free — and how much extra payments save you.
          </p>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
            Enter your balances and APRs and this free calculator works out your payoff date, the total interest you
            will pay, and how much sooner an extra payment each month gets you there. On minimum payments alone,
            $5,000 at 22% APR takes about 19 years and costs roughly $8,100 in interest. Adding $100 a month cuts that
            to about three years and four months.
          </p>
          <p className={cn('text-sm md:text-base text-faint mt-4 max-w-xl mx-auto')}>
            Free · No account needed · Estimates only
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="flex-1">
        <Container>
          <div id="calculator" className="max-w-3xl mx-auto scroll-mt-8">
            <CreditCardPayoffTool />
          </div>
        </Container>
      </Section>

      <MethodSteps
        heading="How this payoff calculator works"
        intro="Nothing here is a black box — the whole model is four rules, and the second one is the reason credit card debt lasts so long."
        steps={STEPS}
      />

      <Caveat label="What this can’t see:">
        your other balances, your emergency fund, and what else that extra payment was going to do this month. A card
        at 22% usually beats almost anything else you could do with the money — but not always, and not if clearing it
        leaves you with nothing to absorb the next unexpected bill.
      </Caveat>

      <ToolFaq href="/credit-card-payoff" />

      <SiteFooter />
    </PageShell>
  );
}
