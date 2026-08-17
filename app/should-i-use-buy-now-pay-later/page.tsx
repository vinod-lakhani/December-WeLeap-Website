import type { Metadata } from 'next'
import { SmartPurchaseTool } from '@/components/SmartPurchaseTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /should-i-use-buy-now-pay-later — the purchase funding decision.
 *
 * A server component. It used to be a client component wrapping nothing that
 * needed the client — the only effect on the page was already extracted into
 * `ToolPageView` — but the `'use client'` directive meant `metadata` had to
 * live in a sibling layout.tsx, and metadata one file away from the copy it
 * describes drifts. The directive is gone, the layout is deleted, and the only
 * client leaves are the calculator and the two analytics beacons.
 *
 * Renamed from /smart-purchase-check, which was the internal name for the
 * decision engine. Target query is "should I use buy now pay later", with
 * "pay now or pay in 4", "is 0% financing worth it" and "should I buy this now
 * or wait" as the surrounding cluster.
 *
 * That is one page rather than four because it is one computation seen from
 * four angles: lib/purchase/decision.ts prices cash, pay-in-4, a monthly plan
 * and waiting against the same three numbers and returns whichever wins. The
 * "is 0% worth it" question in particular is not a separate calculation — it
 * falls out of step 4 of `recommend`, which will only take a free plan when
 * paying cash would be a real dent.
 *
 * Everything in MethodSteps below was read out of lib/purchase/decision.ts, not
 * paraphrased from the marketing copy. The 15% / 35% thresholds are
 * `dentThreshold`, the fortnightly load is `FORTNIGHTS_PER_MONTH`, and the
 * "too small to matter" figure is `trivialInterest`.
 */

export const metadata: Metadata = {
  // Query first, brand last: the root layout appends " | WeLeap" via
  // title.template, so this string plus nine characters is what renders.
  title: 'Should I use buy now, pay later? Free calculator',
  description:
    'Compare cash, pay in 4, monthly financing and waiting against your savings and monthly surplus. See which one leaves you better off. Free, no account.',
  alternates: { canonical: '/should-i-use-buy-now-pay-later' },
  openGraph: {
    // Spelled out with the brand because openGraph.title does not inherit
    // title.template. Left bare it renders an og:title nine characters short of
    // the <title>, so the share card and the tab disagree. Byte-identical to
    // what `title` above renders; these two must stay in step.
    title: 'Should I use buy now, pay later? Free calculator | WeLeap',
    description:
      'Compare cash, pay in 4, monthly financing and waiting against your savings and monthly surplus. See which one leaves you better off. Free, no account.',
    url: '/should-i-use-buy-now-pay-later',
  },
}

/**
 * What the calculator actually does, in the order `recommend` does it.
 *
 * This page was one of only two tools with no MethodSteps at all: it had three
 * paragraphs of principle ("simple wins when the options are close") and not a
 * single statement of the arithmetic underneath them. A reader could not tell
 * what "close" meant, and neither could an answer engine.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Each way of paying is priced as a total, not as a monthly figure',
    d: 'Paying cash costs the sticker price and takes all of it out today. An interest-free split costs the sticker price too — the total is identical, only the timing moves. A monthly plan is priced with the standard amortised payment formula, so at any APR above zero the total comes out above the sticker price and the difference is shown as its own number. Comparing the four on total cost rather than on the monthly payment is the whole point: the monthly figure is the one that makes the most expensive option look like the cheapest.',
  },
  {
    t: 'Pay in 4 is measured fortnightly, because that is how you pay it',
    d: 'The four instalments fall two weeks apart, so the plan is finished in eight weeks and a month carries about 2.14 of them rather than one. On a $900 purchase that is $225 due today and $225 every two weeks — quoting the same commitment as a monthly run rate would give $482 a month, which is arithmetically correct and completely unrecognisable to the person paying it. The calculator checks that fortnightly load against your monthly surplus and rules the option out when it does not fit.',
  },
  {
    t: 'What decides it is the share of your cash, not the price',
    d: 'The calculator works out what fraction of the cash you could actually reach today this purchase would consume, and compares it against a threshold set by what your money is currently doing. If you are building an emergency fund, paying down high-interest debt, or saving for something specific, the threshold is 15%. If your emergency fund is already set or you are investing, it is 35%. Below the line, paying cash is a rounding error and the answer is pay cash. Above it, paying cash is a real dent, and an interest-free option is worth the four dates in your calendar.',
  },
  {
    t: 'Interest below $15, or below 2% of the price, is treated as noise',
    d: 'Where a paid financing plan is the only route open, the calculator compares its interest against whichever is larger of $15 or 2% of the purchase price. Under that, the cost is too small to change the decision and financing is called fine. Over it, the interest is named in dollars and the recommendation goes the other way. The same rule runs in reverse when you can pay cash comfortably: the tool will not tell you to finance something so the money can earn a few dollars of savings interest, because an answer that is technically optimal and practically pointless is a worse answer.',
  },
  {
    t: '“Wait” is one of the four outputs, not a polite decline',
    d: 'Three situations produce it. There is no route that fits — the cash is not there and no repayment schedule sits inside your monthly surplus. Or you are clearing high-interest debt and cannot cover the purchase outright, in which case a second commitment slows down the first. Or financing is the only option open and its interest is above the threshold above, in which case the calculator divides the price by your monthly surplus and tells you how many months saving for it outright would take. A calculator that can never return "wait" is a financing brochure.',
  },
]

/**
 * Where someone goes after a funding decision.
 *
 * Each `why` is written for a reader who has just run this calculation. The
 * first two are the two context options that tighten the threshold to 15% —
 * having just been told their emergency fund or their debt is what makes this
 * purchase a dent, the useful next page is the one that sizes that thing.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'If you told this calculator you are still building an emergency fund, that is what dropped the threshold to 15% of your cash and made an interest-free split worth taking. This works out how many months your own situation actually calls for, rather than assuming the blanket three-to-six.',
  },
  {
    href: '/credit-card-payoff',
    why: 'Paying down a high-interest balance is the one context here that produces "wait" even when you could technically cover the purchase. This turns that balance into a payoff date, and shows how much sooner it clears when the money you did not spend goes at it instead.',
  },
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'The monthly surplus this page asks you to estimate is the number every funding decision is checked against, and most people guess it. This one derives it from your salary, state and essential expenses, then puts the rest of it in order.',
  },
]

/**
 * A real table, because this is a real comparison and a comparison rendered as
 * three prose paragraphs is one an answer engine has to reconstruct. Four
 * options, four dimensions, no marketing in any cell.
 *
 * Deliberately no provider names anywhere in it: the mechanism is what differs
 * between these rows, and the terms attached to any particular brand change
 * often enough that naming one would date the page.
 */
const OPTIONS = [
  {
    option: 'Pay cash',
    cost: 'Sticker price, nothing more',
    cashflow: 'All of it leaves today',
    risk: 'Nothing to miss, nothing to track',
    when: 'You can cover it and the money has no other job',
  },
  {
    option: 'Pay in 4',
    cost: 'Sticker price if the plan is genuinely 0%',
    cashflow: 'A quarter today, then three payments a fortnight apart',
    risk: 'Late fees; some providers report missed payments',
    when: 'The cash it preserves is needed for something specific soon',
  },
  {
    option: 'Monthly financing',
    cost: 'Sticker price plus interest, unless the APR is 0%',
    cashflow: 'A fixed payment for the length of the term',
    risk: 'Longest commitment; often a hard credit check',
    when: 'The term is short, the APR is low, and the payment fits your surplus',
  },
  {
    option: 'Wait',
    cost: 'Nothing, plus whatever the price does',
    cashflow: 'Untouched',
    risk: 'You might not want it as much later — which is information',
    when: 'Buying it now would set back something that matters more',
  },
] as const

export default function SmartPurchaseCheckPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. Both were in
          layout.tsx, which existed only because this page could not export
          metadata; it can now, so the file is gone. */}
      <ToolJsonLd href="/should-i-use-buy-now-pay-later" />
      {/* Step one of the funnel. `tool` stays "smart_purchase" — it is the
          analytics id the whole funnel joins on and it did not move with the
          URL. `page` reports the new route, because a new shared event should
          say where the visitor actually is. `legacyPage` holds the old path for
          `purchase_tool_page_view`, whose history is recorded under it; same
          arrangement as /offer on the offer tool. The Meta ViewContent pixel
          keeps its own content name for the same reason. */}
      <ToolPageView
        tool="smart_purchase"
        page="/should-i-use-buy-now-pay-later"
        legacyEvent="purchase_tool_page_view"
        legacyPage="/smart-purchase-check"
        toolVersion="purchase_v1"
        pixelContentName="smart_purchase_tool"
      />
      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/should-i-use-buy-now-pay-later" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              Should I use buy now, pay later?
            </h1>
            {/* Self-contained on purpose — an answer engine lifts this
                paragraph with no page around it, so it has to say what is
                computed and from what, without an antecedent. */}
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Sometimes yes, and the deciding factor is not the price tag. This works out whether
              splitting the payment, paying cash, taking a monthly plan or waiting leaves you
              better off.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              A genuine interest-free plan costs nothing extra, so the real question is what the cash it frees up is
              doing instead. This free calculator compares four ways to fund a purchase — paying cash, splitting it into
              four instalments, a monthly payment plan, or waiting — against the price, the savings you could actually
              reach today, and what you normally have spare in a month. It returns one recommendation with the
              arithmetic behind it, and it will say &ldquo;wait&rdquo; when none of the funding routes fits. Built for
              people whose pay covers the month with something left over, and whose question is which way of paying
              costs them least, not whether they can survive the purchase.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <SmartPurchaseTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Nothing leaves your browser
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How does this calculator decide?"
        intro="Five rules, applied in order. The tool runs them against the three numbers you enter; the logic itself is written out here so you can apply it to a purchase without entering anything."
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-balance text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              Cash vs pay in 4 vs financing vs waiting
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-subtle">
              What each option actually costs you, and the situation each one is right for.
            </p>

            {/* Its own scroll container — the page body must never scroll
                sideways on a phone just because a table is wide. */}
            <div className="overflow-x-auto rounded-card border border-hairline bg-white">
              <table className="w-full min-w-[720px] border-collapse text-left text-[15px]">
                <caption className="sr-only">
                  Comparison of four ways to pay for a purchase: total cost, effect on cash flow, risk, and when each
                  option makes sense.
                </caption>
                <thead>
                  <tr className="border-b border-hairline bg-canvas">
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Option</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">What it costs</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Cash flow</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Risk</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Right when</th>
                  </tr>
                </thead>
                <tbody>
                  {OPTIONS.map((o) => (
                    <tr key={o.option} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top font-semibold text-ink">{o.option}</th>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.cost}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.cashflow}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.risk}</td>
                      <td className="px-5 py-4 align-top leading-relaxed text-subtle">{o.when}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </Section>

      <Caveat label="What this can’t see:">
        your real emergency fund, your retirement contributions, the goals you are part-way through, and the pay-later
        plans you already have running. Those change the answer, and they need your actual accounts rather than three
        estimates. Everything here is an estimate for planning. WeLeap is not a registered investment adviser and
        nothing on this page is personalised financial advice.
      </Caveat>

      <ToolFaq href="/should-i-use-buy-now-pay-later" />

      <RelatedTools
        from="smart_purchase"
        items={RELATED}
        heading="Before the next purchase decision"
        intro="Two of the three numbers this calculator asks for are guesses for most people, and the context you picked is what set the threshold it judged you against. These work out the real versions."
      />

      <SiteFooter />
    </PageShell>
  )
}
