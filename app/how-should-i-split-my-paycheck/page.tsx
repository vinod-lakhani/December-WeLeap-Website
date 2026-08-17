import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { PageShell, Section, Container, SiteFooter } from '@/components/layout';
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer';
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb';
import { ToolJsonLd } from '@/components/ToolJsonLd';
import { ToolPageView } from '@/components/ToolPageView';
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools';
import { AllocatorTool, AllocatorToolFallback } from '@/components/allocator/AllocatorTool';
import {
  K401_EMPLOYEE_CAP,
  HSA_LIMIT_SINGLE,
  HSA_LIMIT_FAMILY,
  TAX_YEAR,
} from '@/lib/allocator/constants';

/**
 * /how-should-i-split-my-paycheck — the money plan tool.
 *
 * A server component. It was a client component wrapping the calculator, which
 * had two consequences: `metadata` had to live in a sibling layout.tsx, and the
 * calculator's `useSearchParams` put the whole document behind a Suspense
 * boundary. The fallback is a skeleton, so the served HTML started at an <h2>
 * and the page shipped no <h1> at all. The h1, the intro, the breadcrumb and
 * every block of copy are now rendered here, above the boundary; only the
 * calculator is a client leaf.
 *
 * Primary query is "how should I split my paycheck", and the route was renamed
 * from /allocator to say it. The ordering question — "what order should I save
 * money in" — is the secondary, and it is answered by the H2 and the first FAQ
 * rather than by the title: a list-shaped question is already owned by
 * list-shaped results, whereas splitting a specific paycheck needs the
 * calculator, which is the part nothing else on that SERP has. "Should I pay
 * off debt or invest first" has its own H2 for the same reason.
 *
 * The tool sequences match, buffer, debt, HSA and retirement by rate of return
 * and routes a real monthly surplus through them, so all three questions are
 * one computation seen from different angles — one page, not three.
 */

export const metadata: Metadata = {
  // Query first, brand last: the root layout appends " | WeLeap" via
  // title.template, so this string plus nine characters is what renders.
  title: 'How should I split my paycheck? Free calculator',
  description:
    'Turn your paycheck into a plan: employer match, safety buffer, high-interest debt, then retirement. See what share each one gets, and what to do first.',
  alternates: { canonical: '/how-should-i-split-my-paycheck' },
  openGraph: {
    // Spelled out with the brand because openGraph.title does not inherit
    // title.template. Left bare it would render an og:title nine characters
    // short of the <title>, which is exactly the drift found on
    // /what-is-my-job-offer-worth. These two must stay in step.
    title: 'How should I split my paycheck? Free calculator | WeLeap',
    description:
      'Turn your paycheck into a plan: employer match, safety buffer, high-interest debt, then retirement. See what share each one gets, and what to do first.',
    url: '/how-should-i-split-my-paycheck',
  },
};

/**
 * The ordering the tool applies, written out.
 *
 * "What order should my money go in" is one of the most-asked personal finance
 * questions there is, and this page — the tool that answers it — carried no
 * text answering it at all.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Employer match first, because nothing else pays 100%',
    d: 'A dollar-for-dollar 401(k) match up to 5% of salary is an immediate 100% return on the money you contribute. Contributing below the match cap is the only situation in a normal financial life where money is unambiguously being left behind, so it goes to the front of the queue regardless of everything else.',
  },
  {
    t: 'Then a safety buffer, funded by 40% of what’s left',
    d: 'Forty per cent of your monthly surplus goes to a three-month buffer until it is funded. Not because three months is magic, but because with no buffer at all, the next unexpected expense becomes credit card debt and undoes the step after this one.',
  },
  {
    t: 'Then high-interest debt, funded by 40% of the remainder',
    d: 'Clearing a balance at 22% APR is a guaranteed 22% return, which beats any expected market return. Forty per cent of what is left after the buffer goes here while any high-APR balance exists, and this step switches itself off once it is clear.',
  },
  {
    t: 'Then tax-advantaged accounts — HSA, then retirement',
    d: `An HSA is untaxed going in, untaxed as it grows and untaxed coming out for medical costs, which no other US account does. The ${TAX_YEAR} limits this tool uses are $${HSA_LIMIT_SINGLE.toLocaleString('en-US')} for self-only cover and $${HSA_LIMIT_FAMILY.toLocaleString('en-US')} for family, with the 401(k) employee deferral capped at $${K401_EMPLOYEE_CAP.toLocaleString('en-US')}.`,
  },
  {
    t: 'Then whatever is left, split between retirement and investing',
    d: 'Only at this point does the answer become "invest the rest", and by then the four higher-return moves above have already been made. The split is shown as percentages of your actual surplus, not of gross salary — two people on the same salary in different states with different rents have very different amounts to allocate.',
  },
];

/**
 * Where someone goes after they have a plan.
 *
 * Each `why` is written for a reader who has just finished an allocation, not
 * lifted from the tool's blurb: these three are the three steps of the ordering
 * above that have a calculator of their own, so the link is "go and size the
 * step you just agreed to" rather than a generic cross-sell.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'Step two of the plan above is a safety buffer, and this page assumes three months of essentials. This one works out how many months your own situation actually calls for — a stable salary and a cheap lease is not the same problem as variable income.',
  },
  {
    href: '/credit-card-payoff',
    why: 'Step three sends 40% of what is left at a high-interest balance. This turns that monthly amount into a payoff date, and shows how much sooner the balance clears when you send more.',
  },
  {
    href: '/what-is-saving-monthly-worth',
    why: 'The split above is a monthly number. This compounds any monthly amount out to one, ten and thirty years, which is the honest way to see what the last step of the order is doing while the first four get the attention.',
  },
];

export default function AllocatorPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. Both were previously
          in layout.tsx, which existed only because this page could not export
          metadata; it can now, so the file is gone. */}
      <ToolJsonLd href="/how-should-i-split-my-paycheck" />
      {/* Step one of the funnel. This tool had no page-view event of any kind —
          `allocator_prefill_loaded` and `leap_stack_started` only fire for
          visitors arriving with URL prefill, so anyone landing from search or
          /tools was invisible until they finished the stack. No `legacyEvent`
          for the same reason: there is no prior per-tool page view to keep.

          `tool` stays "allocator" — it is the analytics id the whole funnel
          joins on, and it did not move with the URL. `page` reports the new
          route, because a new event should report where the visitor actually
          is; the events that predate the rename keep their own `page` values
          where they are sent, for the same reason /offer's did. */}
      <ToolPageView tool="allocator" page="/how-should-i-split-my-paycheck" />

      {/* Hero. Server-rendered, and deliberately outside the Suspense boundary
          below: the h1 and this paragraph are the only things on the page that
          say what it is, and behind the boundary they were in no served HTML.
          The copy is static for the same reason — the prefill variant depends
          on useSearchParams, so it stays in the client leaf as a paragraph. */}
      {/* `md:pb-6` as well as `pb-6`: Section's own `md:pb-20` survives the
          merge otherwise and reopens the gap at desktop. */}
      <Section variant="canvas" isHero className="pb-6 md:pb-6">
        <Container maxWidth="narrow">
          <ToolBreadcrumb href="/how-should-i-split-my-paycheck" />

          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-700" />
            Free · No account required
          </div>
          {/* The H1 restates the query the route was renamed to target. It used
              to read "Here's how your money should flow", which is the better
              line but contains none of "split" or "paycheck" — so the rename
              moved the URL to the query and left the strongest on-page signal
              pointing somewhere else. The original line is kept immediately
              below rather than dropped. */}
          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink mb-4">
            How should I split my paycheck?
          </h1>
          <p className="mb-4 text-balance text-lg font-semibold text-ink md:text-xl">
            Here&apos;s how your money should flow.
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-subtle md:text-lg">
            This free money plan calculator puts your dollars in order: employer 401(k) match first, then a safety
            buffer, then high-interest debt, then tax-advantaged accounts, then whatever is left. It takes your salary,
            your state, what you currently contribute and your essential expenses, and returns the monthly surplus you
            actually have to direct, the share of it each step should get, and the single move worth making first. It
            is built for people whose pay covers the month with something left over, and whose real question is not
            &ldquo;how much should I save&rdquo; but &ldquo;which account does the next dollar go into.&rdquo;
          </p>
        </Container>
      </Section>

      {/* The calculator reads useSearchParams for prefill from the Leap Impact
          hand-off, so its subtree is client-rendered and this fallback is what
          a crawler gets on first paint. Nothing explanatory is inside it. */}
      <Suspense fallback={<AllocatorToolFallback />}>
        <AllocatorTool />
      </Suspense>

      <MethodSteps
        heading="What order should your money go in?"
        intro="Five steps, applied in order of what each one returns. The tool runs them against your salary, state and current contributions; the logic itself is below so you can apply it without entering anything."
        steps={STEPS}
      />

      {/* The one question in this cluster the ordering above answers implicitly
          and nobody reads out of a numbered list. It is asked as a binary and
          it is not one, which is the whole point. */}
      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              Should you pay off debt or invest first?
            </h2>
            <p className="mb-4 text-base leading-relaxed text-subtle md:text-lg">
              Both, in a specific order, and the order is decided by interest rates rather than by preference. Debt at
              a high APR and an investment are the same kind of thing pointing in opposite directions: paying down a
              balance charging 22% avoids 22% with certainty, while an investment has an expected return and no
              guarantee attached to any particular year. When the guaranteed number is the larger one, the debt wins.
            </p>
            <p className="mb-4 text-base leading-relaxed text-subtle md:text-lg">
              That is why the ordering above is not simply &ldquo;debt, then investing&rdquo;. An employer match sits
              above both, because capturing it is an immediate return on the money you contribute and it is forfeited
              for every pay period you contribute below the cap — a match you skip this year is not recoverable next
              year. A small safety buffer sits above the debt for a different reason: without one, the next car repair
              goes back onto the card you were clearing, so skipping straight to debt tends to be slower than funding a
              buffer first. And low-rate debt does not behave like credit card debt at all; a balance costing less than
              you would reasonably expect to earn is not the thing to rush.
            </p>
            <p className="text-base leading-relaxed text-subtle md:text-lg">
              The tool applies this rather than describing it: while a high-APR balance exists it routes 40% of what is
              left after the buffer toward it, and switches that step off once the balance is clear. To see what the
              debt half costs in months rather than percentages, run the same balance through the{' '}
              <Link
                href="/credit-card-payoff"
                className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                credit card payoff calculator
              </Link>
              . To size the buffer that comes before it, use the{' '}
              <Link
                href="/how-much-emergency-fund-do-i-need"
                className="font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-800"
              >
                emergency fund target calculator
              </Link>
              . None of this is a judgement about your situation — it is the arithmetic of which rate is larger.
            </p>
          </div>
        </Container>
      </Section>

      <Caveat label="What this can’t see:">
        the balances you actually hold, what you already contribute, and the goals you are part-way through. Those
        change the order, and they need your real accounts rather than five answers. WeLeap is not a registered
        investment adviser and nothing here is personalised advice.
      </Caveat>

      <ToolFaq href="/how-should-i-split-my-paycheck" />

      <RelatedTools
        from="allocator"
        items={RELATED}
        heading="Sizing the steps in your plan"
        intro="The order comes out of this page. Three of the five steps have a calculator of their own, and each one starts from a number you have just produced."
      />

      <SiteFooter />
    </PageShell>
  );
}
