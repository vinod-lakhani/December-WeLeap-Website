import type { Metadata } from 'next'
import { EmergencyFundTool } from '@/components/EmergencyFundTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /how-much-emergency-fund-do-i-need — the emergency fund sizing calculator.
 *
 * A server component. It used to be a client component wrapping nothing that
 * needed the client — the only effect was already extracted into
 * `ToolPageView` — but the `'use client'` directive meant `metadata` had to
 * live in a sibling layout.tsx, and metadata one file away from the copy it
 * describes drifts. The directive is gone, layout.tsx is deleted, and its
 * `ToolJsonLd` moved into the page beside the content it describes. The only
 * client leaves are the calculator and the page-view beacon.
 *
 * Target query is "how much emergency fund do I need", with "how many months of
 * expenses should I save", "is 3 months enough emergency fund" and "emergency
 * fund calculator" as the surrounding cluster. That cluster is one page because
 * it is one computation: lib/emergencyFund/calculation.ts returns a number of
 * months and the dollar figure that follows from it, and every query above is a
 * different way of asking for that same number.
 *
 * The route was /emergency-fund-target, which was half product language —
 * nobody types "emergency fund target" — and it is now the h1's own question.
 * 308 in next.config.mjs; the fifth and last rename of this kind, after /offer,
 * /allocator, /smart-purchase-check and /net-worth-impact. Nothing about the
 * page changed with it. As on those four, every analytics identifier stayed
 * where it was: `slug` is still "emergency_fund", and `emergency_fund_page_view`
 * still sends `page: "/emergency-fund-target"` via `legacyPage` below.
 *
 * Everything in STEPS below was read out of lib/emergencyFund/calculation.ts,
 * not paraphrased from the marketing copy. The adjustments are
 * INCOME_VOLATILITY_ADJUSTMENT and the four `targetMonths +=` branches, the
 * bounds are MIN_MONTHS and MAX_MONTHS, the milestones are `getMilestones`, and
 * the suggested contribution is `suggestMonthlySavings`.
 */

export const metadata: Metadata = {
  // Query first, brand last: the root layout appends " | WeLeap" via
  // title.template, so this string plus nine characters is what renders.
  // Was 'Emergency fund calculator — how much do I actually need?', which led
  // with the tool category rather than with the question people type.
  title: 'How much emergency fund do I need? Free calculator',
  description:
    'Not everyone needs six months. Size your emergency fund against your essential expenses, income stability and dependants. Free, no account needed.',
  alternates: { canonical: '/how-much-emergency-fund-do-i-need' },
  openGraph: {
    // Spelled out with the brand because openGraph.title does not inherit
    // title.template. Left bare it renders an og:title nine characters short of
    // the <title>, so the share card and the tab disagree. Byte-identical to
    // what `title` above renders; these two must stay in step.
    title: 'How much emergency fund do I need? Free calculator | WeLeap',
    description:
      'Not everyone needs six months. Size your emergency fund against your essential expenses, income stability and dependants. Free, no account needed.',
    url: '/how-much-emergency-fund-do-i-need',
  },
}

/**
 * The actual algorithm, in the order `calculateEmergencyFundTarget` runs it.
 *
 * Publishing the adjustments rather than describing them vaguely is the whole
 * differentiator here: "three to six months" is available everywhere and
 * answers nothing, whereas "start at three, add two if you freelance, cap at
 * six" is a method someone can check, disagree with, or apply on paper.
 *
 * Step four is the load-bearing one. Nothing in the model subtracts, so the
 * two-month floor never binds on a recommendation and the six-month cap binds
 * often — both facts are invisible from the output and neither is guessable.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Everyone starts at three months of essential expenses',
    d: 'Essentials means rent, utilities, groceries, insurance, transport and minimum debt payments — not your whole income and not your whole spending. Sizing the fund against income means saving for discretionary spending you would cut on day one of an actual emergency, which inflates the target by a third or more for most people and makes it feel unreachable. Every adjustment below is expressed in months of that essentials figure, so the accuracy of the whole answer rests on the second field in the form.',
  },
  {
    t: 'How predictable your income is moves the number most',
    d: 'A very stable salary adds nothing. Mostly stable pay adds half a month, somewhat variable income adds one, and freelance or contract income adds two. This is the largest single adjustment in the model because it is the closest proxy for the thing you are insuring against: not the size of the shock, but how long the gap it opens takes to close. A salaried employee replaces a paycheck on a schedule; someone invoicing clients replaces it when the next client signs.',
  },
  {
    t: 'Then three smaller factors are added on top of that',
    d: 'If your essential expenses come to more than 65% of your income the target gains a month, and above 80% it gains a month and a half — there is less slack in the budget to absorb a shock, so more of it has to be pre-funded. Dependants add a month, because you cannot cut back the way you can when the only person affected is you. Carrying a credit card balance month to month adds half a month, and carrying one occasionally adds a quarter: an emergency met with no buffer goes straight onto the card and makes the balance you already have worse. All four factors are additive, and none of them cancel each other out.',
  },
  {
    t: 'The total is rounded to the nearest half month, then capped at six',
    d: 'The base and the adjustments are summed, rounded to the nearest half month, and held between two and six. Two of those bounds behave very differently. Because nothing in the model subtracts, the recommendation never comes out below three — the two-month floor exists only so the scenario slider has somewhere to go if you decide the recommendation is more than you want to hold in cash. The cap at the other end binds regularly: freelance income, essentials above 80% of income, dependants and a carried card balance sum to eight months, and the calculator returns six.',
  },
  {
    t: 'Months become dollars, and dollars become three milestones',
    d: 'The target in months is multiplied by your monthly essentials to give the figure you are actually saving toward, and your current savings are shown against it as a percentage. The same arithmetic then produces the stages: one month of expenses as a basic cushion, three months as a solid buffer where the target is above three, and the full target last. Most of the protection arrives at the first stage — one month of essentials is what stops a car repair becoming a credit card balance — which is the reason the number is broken up rather than presented as one intimidating figure.',
  },
  {
    t: 'The timeline comes from what you can actually put aside',
    d: 'Enter a monthly amount and the remaining gap is divided by it, rounded up to the next whole month. Leave it blank and the calculator suggests 10% of whatever is left after your essentials, rounded to the nearest $25, never below $25 and never above $500 — a deliberately conservative figure, because a plan that assumes every spare dollar goes to the fund is one that breaks the first month something else happens. Both the full target date and the first milestone date are reported, and they are usually far apart. Only one of them is close enough to change what you do this month.',
  },
]

/**
 * Where someone goes once they have a target.
 *
 * Each `why` is tied to an input this calculator just used, rather than to the
 * generic pitch on the /tools card: the expense-ratio adjustment is almost
 * always rent, the card-balance adjustment is the payoff tool, and the monthly
 * contribution has to come out of a paycheck that has other claims on it.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'This page gives you a target and a monthly contribution. This one decides where that contribution sits against everything else your paycheck owes — the employer match, high-interest debt, retirement — and whether funding the buffer faster is worth what it displaces.',
  },
  {
    href: '/credit-card-payoff',
    why: 'A carried card balance is one of the four things that pushed your target up, and clearing it is the one adjustment you can remove rather than save your way past. This turns the balance into a payoff date and shows what the freed-up payment could do for the fund.',
  },
  {
    href: '/how-much-rent-can-i-afford',
    why: 'If your essentials came to more than 65% of your income, rent is almost certainly why — and that single ratio added a month or more to your target. This works out what a rent line sized to take-home pay rather than gross would actually be.',
  },
]

export default function EmergencyFundTargetPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. This was in
          layout.tsx, which existed only because this page could not export
          metadata; it can now, so the file is gone. */}
      <ToolJsonLd href="/how-much-emergency-fund-do-i-need" />
      {/* Step one of the funnel. `tool` stays "emergency_fund" — it is the id
          the whole funnel joins on and it did not move with the URL. `page`
          reports the new route, because a new shared event should say where the
          visitor actually is. `legacyPage` holds the old path for
          `emergency_fund_page_view`, whose history is recorded under it; same
          arrangement as /offer, /smart-purchase-check and /net-worth-impact. */}
      <ToolPageView
        tool="emergency_fund"
        page="/how-much-emergency-fund-do-i-need"
        legacyEvent="emergency_fund_page_view"
        legacyPage="/emergency-fund-target"
        toolVersion="emergency_fund_v1"
      />

      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/how-much-emergency-fund-do-i-need" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              How much emergency fund do I need?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Not everyone needs six months. Find the buffer that fits your income, your expenses and
              how stable your work actually is — and the first milestone on the way to it.
            </p>
            {/* Self-contained on purpose — an answer engine lifts this
                paragraph with no page around it, so it has to say what is
                computed and from what, without an antecedent. */}
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <EmergencyFundTool />
          </div>

          {/* YMYL disclosure — kept directly under the widget that produces the
              numbers it qualifies. */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How this emergency fund calculator works"
        intro="Six rules, all published. You can run them on paper if you would rather not type your numbers in — the arithmetic is small enough to do in your head."
        summary={
          <>
            &ldquo;Three to six months&rdquo; is a range wide enough to mean nothing. This free calculator
            starts at three months of your essential expenses and adjusts from there for how stable your
            income is, what share of it your essentials consume, whether anyone depends on you, and whether
            you carry a credit card balance &mdash; then caps the answer at six months, converts it into a
            dollar figure, and breaks it into milestones with a date on each. Built for people early enough
            in their career that the fund is still being built rather than maintained, and whose real
            question is how many months is enough rather than whether to have one at all.
          </>
        }
        steps={STEPS}
      />

      {/* The secondary query, answered as prose rather than only as a widget
          output. Someone asking "how many months should I save" wants to know
          which profile is theirs before they enter anything. */}
      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              How many months of expenses should you save?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-subtle md:text-lg">
              Between three and six, and where you land inside that is decided by how long a gap in your
              income would take to close &mdash; not by how much you earn. Three profiles cover most of it.
            </p>

            <dl className="space-y-6">
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  Three months, when your income is genuinely predictable
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  A salaried job with stable pay, nobody depending on your income, essential expenses
                  comfortably under two-thirds of it, and no card balance carried month to month. That profile
                  triggers none of the adjustments, so the calculator returns the base three. Three months
                  covers the shocks that actually happen to most people at this stage &mdash; a car repair, an
                  insurance excess, a dental bill, a few weeks between jobs &mdash; which is why it is the
                  floor of the range rather than a compromise at the bottom of it.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  Four to five months, when one or two things are tight
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Income that varies month to month, or essentials above 65% of what you earn, or someone
                  depending on you, or a balance that rolls over on a card. Each of those adds between a
                  quarter of a month and a month and a half, and it usually takes two of them together to land
                  here. What they have in common is that they all lengthen the same thing: the time between a
                  shock arriving and your budget absorbing it.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  Six months, when several risks stack at once
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Freelance or contract income adds two months on its own, so it takes only one more factor
                  alongside it to reach the top. Six months is where this calculator stops, and it stops there
                  because cash held beyond that point is competing with a credit card balance charging 20% or
                  more and with retirement contributions that are matched or tax-advantaged &mdash; and against
                  either of those, an extra month of buffer is the weaker use of the money.
                </dd>
              </div>
            </dl>

            <h3 className="mb-2.5 mt-8 text-[17.5px] font-bold tracking-[-0.015em] text-ink md:text-lg">
              So is three months enough?
            </h3>
            <p className="text-base leading-relaxed text-subtle md:text-lg">
              If the first profile is yours, yes &mdash; and this calculator will not push you past it, because
              nothing in the model adds unless one of the four risk factors applies to you. If any of them do,
              three months is where your answer starts rather than where it lands, and the distance between
              three and your actual target is exactly the part a rule of thumb leaves you to guess. The
              question worth asking is not whether three months is enough in general, but how long your own
              income could stop before something broke.
            </p>
          </div>
        </Container>
      </Section>

      {/* One disclosure block rather than two. The subject-matter blind spots
          and the modelling simplifications are the same admission here — unlike
          on /how-much-rent-can-i-afford, where the Caveat is about the apartment
          and the tail section is about tax estimation — so splitting them across
          the FAQ would have been structure for its own sake. */}
      <Caveat label="What this can’t see:">
        whether your job is genuinely at risk, whether a partner&apos;s income would cover the gap, what you
        already hold in accounts you did not enter, and whether you would qualify for unemployment insurance
        or severance if the income stopped. Those move the number more than any of the six rules above, and
        they need your actual situation rather than a handful of dropdowns. It assumes your essential expenses
        stay flat during the emergency, which is optimistic in the one case &mdash; losing employer-sponsored
        health coverage &mdash; where they usually rise at exactly the wrong moment. And the timeline ignores
        any interest the balance earns, so it understates progress in a high-yield savings account and
        overstates it the moment contributions stop. Every figure here is an estimate for planning: the
        months-of-expenses convention is a heuristic rather than a rule from any regulator or lender, and the
        adjustments applied to it are this tool&apos;s own. WeLeap is not a registered investment adviser and
        nothing on this page is personalised financial advice.
      </Caveat>

      <ToolFaq href="/how-much-emergency-fund-do-i-need" />

      <RelatedTools
        from="emergency_fund"
        items={RELATED}
        heading="Once you have a target"
        intro="A target is a number until something funds it. Two of these decide where the monthly contribution comes from, and the third addresses the input that pushed your target up in the first place."
      />

      <SiteFooter />
    </PageShell>
  )
}
