import type { Metadata } from 'next'
import { ImpactTool } from '@/components/netWorthImpact/ImpactTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'
import { computeInvestingImpact } from '@/lib/networthImpact/math'

/**
 * /what-is-saving-monthly-worth — what one monthly amount becomes.
 *
 * A server component. It was a client component wrapping nothing that needed
 * the client — the only effect on the page was already extracted into
 * `ToolPageView` — and the `'use client'` directive forced `metadata` into a
 * sibling layout.tsx, one file away from the copy it describes. The directive
 * is gone, the layout is deleted, and the only client leaf is the calculator.
 *
 * Renamed from /net-worth-impact, which is the internal name for the projection
 * and matches nothing anyone types. Target query is "what is saving monthly
 * worth", with "how much will saving $150 a month be worth", "is saving a small
 * amount worth it" and "what will my monthly savings grow to" around it.
 *
 * Deliberately no figure in the slug. The default is $150/month today; a URL
 * saying so would have to be redirected again the first time that default
 * changes, and the whole point of moving off /net-worth-impact was to stop
 * paying for renames.
 *
 * `slug: "net_worth_impact"` in FREE_TOOLS, the `tool` on every funnel event
 * and the `net_worth_impact_*` legacy event names all stayed put. They are
 * analytics identifiers, not URLs, and none of them moved.
 *
 * Everything in STEPS below was read out of lib/networthImpact/math.ts. The
 * three models are genuinely different formulas — a monthly-compounded annuity,
 * a plain sum, and a triangular approximation of interest avoided — and the
 * differences between them are the point of the page.
 */

export const metadata: Metadata = {
  // Query first, brand last: the root layout appends " | WeLeap" via
  // title.template, so this string plus nine characters is what renders.
  title: 'What is saving monthly worth? Free calculator',
  description:
    'See what any monthly amount is worth after 1, 10 and 30 years — invested at an assumed 7% return, held as cash, or put against debt. Free, no account.',
  alternates: { canonical: '/what-is-saving-monthly-worth' },
  openGraph: {
    // Spelled out with the brand because openGraph.title does not inherit
    // title.template. Left bare it renders an og:title nine characters short of
    // the <title>, so the share card and the tab disagree. Byte-identical to
    // what `title` above renders; these two must stay in step.
    title: 'What is saving monthly worth? Free calculator | WeLeap',
    description:
      'See what any monthly amount is worth after 1, 10 and 30 years — invested at an assumed 7% return, held as cash, or put against debt. Free, no account.',
    url: '/what-is-saving-monthly-worth',
  },
}

/** The rate the calculator uses for the investing model. Fixed in this build. */
const ASSUMED_RETURN = 0.07

const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`

/**
 * The worked table below is computed here by the same module the calculator
 * calls — `computeInvestingImpact` from lib/networthImpact/math.ts — rather
 * than typed in from a spreadsheet. Nothing on this page is a number someone
 * remembered: change the formula and the table changes with it, or it stops
 * agreeing with the widget directly above it and the mismatch is visible.
 *
 * It exists because the query cluster this page targets is mostly people naming
 * an amount ("$50 a month", "$150 a month"), and a row they can read without
 * touching a slider answers that in the served HTML.
 */
const AMOUNTS = [25, 50, 100, 150, 300, 500] as const

const TABLE = AMOUNTS.map((monthly) => {
  const thirty = computeInvestingImpact(monthly, ASSUMED_RETURN, 30)
  const paidIn = monthly * 12 * 30
  return {
    monthly: usd(monthly),
    y1: usd(computeInvestingImpact(monthly, ASSUMED_RETURN, 1)),
    y10: usd(computeInvestingImpact(monthly, ASSUMED_RETURN, 10)),
    y30: usd(thirty),
    growth: usd(thirty - paidIn),
  }
})

/**
 * What the calculator actually does, model by model.
 *
 * The previous version of this list described the investing model as "7% real"
 * and left it there. Two things were missing and both matter on a page that
 * projects compound growth: that the rate is fixed in this build rather than
 * something the reader can dial, and that the debt model is a rough
 * approximation rather than an amortisation schedule.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Investing: monthly contributions, compounded at an assumed 7%',
    d: 'The investing model is the standard future-value-of-an-annuity formula: each monthly contribution is compounded at one twelfth of 7% for every month left in the horizon, and the results are added up. At $150 a month that comes to about $1,859 after a year, about $25,963 after ten years and about $182,996 after thirty — of which $54,000 is money you paid in and roughly $129,000 is growth. 7% is an assumption this calculator applies, not a rate anyone is offering you, and the arithmetic would be exactly as confident at 4% or at 10%.',
  },
  {
    t: 'The 7% is a long-run real rate, so the output is in today’s dollars',
    d: 'The figure used here is a real — inflation-adjusted — return, the convention most retirement projections follow for a diversified stock portfolio. That means the numbers are meant to be read in today’s purchasing power rather than as the dollar figure that would appear on a statement in thirty years, which inflation would make larger and worth no more. It also means you should not subtract inflation from these results a second time. The rate is fixed at 7% in this version of the tool: the amount, the use of funds and the debt APR are yours to change, the investing rate is not yet.',
  },
  {
    t: 'Cash: the deposits, and nothing else',
    d: 'Money held as cash is shown as the sum of what you put in — $150 a month for ten years is $18,000, full stop. That is deliberately unflattering and it is the honest comparison against a real return: cash keeps its number and loses purchasing power at the rate of inflation, which is the price of being able to reach it tomorrow. It is the right home for an emergency fund and the wrong home for money with a thirty-year job.',
  },
  {
    t: 'Debt: interest avoided, estimated rather than amortised',
    d: 'Paying extra against a balance is modelled as interest you stop paying rather than a return you earn, because that is what it is — and at a 22% APR, interest avoided is a guaranteed 22%, higher than any expected market return, which is why debt usually wins this comparison outright. The estimate is deliberately simple: the extra principal you paid, multiplied by the APR, halved to reflect that the average dollar sits for roughly half the period. It is a sense of scale over one to a few years, not a payoff schedule, and it overstates the long horizons badly — a real balance gets cleared, at which point there is no more interest to avoid. For an actual payoff date, use the credit card calculator linked below.',
  },
  {
    t: 'One, ten and thirty years — and negative numbers too',
    d: 'The three horizons are shown together because the argument for starting early is nearly invisible at one year and overwhelming at thirty: with $150 a month invested at 7%, the third decade adds more than the first two combined. The monthly amount also runs negative, down to -$1,000, which reads the calculation backwards — what a subscription you keep, or a saving you stop, costs the same future.',
  },
]

/**
 * Where someone goes after seeing what a monthly amount compounds to.
 *
 * Written for a reader who has just watched a slider turn into a thirty-year
 * number. The obvious next question is where the monthly amount comes from,
 * and the second is whether it should be going somewhere else first — which is
 * the comparison the debt and cash models on this page only gesture at.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'This page starts from a monthly amount you type in. That one derives it: take-home pay for your salary and state, minus essentials, then the order the surplus should go in — match, buffer, debt, retirement, the rest.',
  },
  {
    href: '/credit-card-payoff',
    why: 'The debt setting here is a rough estimate of interest avoided, not a payoff schedule. If you have a balance, that one runs the real amortisation: a payoff date, the total interest, and how much sooner an extra monthly payment clears it.',
  },
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'The cash setting shows no growth at all, which is the correct answer for money you might need next month and the wrong one for money you will not. That works out how much of your saving genuinely belongs in reach, so the rest can be invested.',
  },
]

export default function NetWorthImpactPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. Both were in
          layout.tsx, which existed only because this page could not export
          metadata; it can now, so the file is gone. */}
      <ToolJsonLd href="/what-is-saving-monthly-worth" />
      {/* Step one of the funnel. `tool` stays "net_worth_impact" — it is the id
          the whole funnel joins on and it did not move with the URL. `page`
          reports the new route, because a new shared event should say where the
          visitor actually is. `legacyPage` holds the old path for
          `net_worth_impact_page_view`, whose history is recorded under it; same
          arrangement as /offer and /smart-purchase-check. */}
      <ToolPageView
        tool="net_worth_impact"
        page="/what-is-saving-monthly-worth"
        legacyEvent="net_worth_impact_page_view"
        legacyPage="/net-worth-impact"
        toolVersion="net_worth_impact_v1"
      />

      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/what-is-saving-monthly-worth" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What is saving monthly worth?
            </h1>
            {/* Self-contained on purpose — an answer engine lifts this
                paragraph with no page around it, so it has to say what is
                computed, from what, and under which assumption, with no
                antecedent. */}
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Enough that the boring answer is worth checking. Small monthly amounts compound into
              numbers most people guess low by an order of magnitude.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              This free calculator takes one monthly amount and shows what it becomes after one, ten and thirty years,
              three different ways: invested and compounding at an assumed 7% return, held as cash with no growth at
              all, or put against a debt where the payoff is the interest you stop paying. Saving $150 a month and
              investing it comes to about $1,859 after a year, about $25,963 after ten years and about $182,996 after
              thirty — of which $54,000 is what you paid in. Built for anyone deciding whether a small, repeatable
              amount is worth the trouble, and the 7% is an assumption the model applies, not a return anyone can
              promise.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <ImpactTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Nothing leaves your browser
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How is this calculated?"
        intro="Three models, one monthly amount, three horizons. The formulas are written out here so you can see what the projection assumes before you trust the size of it."
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-4 text-balance text-center text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              What will my monthly savings grow to?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-center text-base leading-relaxed text-subtle">
              Common monthly amounts, invested and compounded at the same assumed 7% the calculator uses. The last
              column is the part that is growth rather than money you paid in — which is small at ten years and larger
              than the contributions themselves at thirty.
            </p>

            {/* Its own scroll container — the page body must never scroll
                sideways on a phone just because a table is wide. */}
            <div className="overflow-x-auto rounded-card border border-hairline bg-white">
              <table className="w-full min-w-[640px] border-collapse text-left text-[15px]">
                <caption className="sr-only">
                  Future value of monthly contributions invested at an assumed 7% return, after 1, 10 and 30 years,
                  with the growth portion of the 30-year figure.
                </caption>
                <thead>
                  <tr className="border-b border-hairline bg-canvas">
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Saved each month</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">After 1 year</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">After 10 years</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">After 30 years</th>
                    <th scope="col" className="px-5 py-3.5 font-bold text-ink">Growth in that 30</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE.map((row) => (
                    <tr key={row.monthly} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="px-5 py-4 align-top font-semibold text-ink">{row.monthly}</th>
                      <td className="px-5 py-4 align-top tabular-nums text-subtle">{row.y1}</td>
                      <td className="px-5 py-4 align-top tabular-nums text-subtle">{row.y10}</td>
                      <td className="px-5 py-4 align-top tabular-nums text-subtle">{row.y30}</td>
                      <td className="px-5 py-4 align-top tabular-nums text-subtle">{row.growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-center text-[13.5px] leading-relaxed text-faint">
              Illustrations of one assumption, not projections of your account. They assume the contribution never
              misses a month and the return arrives smoothly, and no real thirty years works that way.
            </p>
          </div>
        </Container>
      </Section>

      <Caveat label="What this can’t see:">
        that you will not actually contribute the same amount for thirty years, that markets deliver nothing like a
        smooth 7% — some years are large losses — and that the order the returns arrive in changes the ending balance
        enormously over a working life. A 7% real return is a planning convention, not a forecast and not a product
        anyone is selling you; a different assumption gives a different answer, and no assumption makes the outcome
        certain. Read the output as a sense of scale rather than a balance on a date. Everything here is an estimate for
        planning. WeLeap is not a registered investment adviser and nothing on this page is personalised financial
        advice.
      </Caveat>

      {/* Was a Radix accordion. Radix unmounts closed panels, so four of the
          five answers were never in the served HTML — invisible to a crawler
          and to anything summarising the page. Rendered flat now, which is also
          what makes the FAQPage markup honest. */}
      <ToolFaq href="/what-is-saving-monthly-worth" />

      <RelatedTools
        from="net_worth_impact"
        items={RELATED}
        heading="Where the monthly amount comes from"
        intro="This page assumes you already know the number and are deciding whether it is worth it. These work out what the number should be, and whether it has somewhere more urgent to be first."
      />

      <SiteFooter />
    </PageShell>
  )
}
