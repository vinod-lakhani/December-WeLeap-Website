import type { Metadata } from 'next'
import { CreditCardPayoffTool } from '@/components/CreditCardPayoffTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /credit-card-payoff — the credit card payoff calculator.
 *
 * A server component. It was the last tool route still marked `'use client'`,
 * which forced `metadata` and `ToolJsonLd` into a sibling layout.tsx one file
 * away from the copy they describe. The directive is gone, layout.tsx is
 * deleted, and the only client leaves are the calculator and the page-view
 * beacon.
 *
 * Target query is "how long will it take to pay off my credit card", with
 * "credit card payoff calculator", "how much extra should I pay on my credit
 * card" and "minimum payment vs extra payment" as the surrounding cluster. That
 * cluster is one page because it is one computation: lib/creditCardPayoff/
 * calculation.ts runs a balance forward month by month under a minimum payment
 * and under minimum-plus-extra, and every query above is a different way of
 * reading the two curves it returns.
 *
 * The slug is unchanged deliberately. Unlike the four routes renamed in
 * lib/tools.ts, "credit card payoff calculator" is a real search term rather
 * than an internal product label, so /credit-card-payoff already says the
 * thing people type.
 *
 * Every figure below was produced by running lib/creditCardPayoff/
 * calculation.ts on the stated inputs, not estimated. The $5,000-at-22% book
 * used throughout is an illustrative balance, not a claim about an average.
 *
 * DO NOT "correct" the avalanche description in step four. The extra payment
 * genuinely goes to the highest APR; the module used to sort by highest
 * balance while its docstring said avalanche, and that was the bug, not the
 * docstring. calculation.test.ts pins the corrected totals exactly.
 */

export const metadata: Metadata = {
  // Query first, brand last. The root layout appends " | WeLeap" via
  // title.template, so this string plus nine characters is what renders — 57
  // characters in total. Was 'Credit card payoff calculator — when will I be
  // debt free?', which led with the tool category rather than with the question
  // people type.
  title: 'How long will it take to pay off my credit card?',
  description:
    'See your debt-free date, the total interest, and how much sooner an extra payment gets you there. Free credit card payoff calculator, no signup.',
  alternates: { canonical: '/credit-card-payoff' },
  openGraph: {
    // Spelled out with the brand because openGraph.title does not inherit
    // title.template. Left bare it renders an og:title nine characters short of
    // the <title>, so the share card and the tab disagree. Byte-identical to
    // what `title` above renders; these two must stay in step.
    title: 'How long will it take to pay off my credit card? | WeLeap',
    description:
      'See your debt-free date, the total interest, and how much sooner an extra payment gets you there. Free credit card payoff calculator, no signup.',
    url: '/credit-card-payoff',
  },
}

/**
 * The model, in the order `runPayoffScenario` runs it.
 *
 * Step two is load-bearing. Nobody disputes that credit card debt is
 * expensive; almost nobody knows that a minimum payment is structured as
 * interest plus roughly 1% of the balance, which is what makes it a rate of
 * decay rather than a repayment plan.
 *
 * Step four is the one to leave alone — see the file docstring.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'You enter a balance and an APR, and the APR does more of the work',
    d: 'The form takes one card: what you owe on it today and the annual rate you are charged. Interest accrues monthly at that APR divided by twelve, so a $5,000 balance at 22% picks up $91.67 in the first month before you have paid anything. Getting the rate right matters at least as much as getting the balance right, because the balance is what you owe once and the rate is what you owe every month. It is on your statement, usually as the purchase APR.',
  },
  {
    t: 'The minimum payment is modelled the way most US issuers set it',
    d: 'One percent of the balance plus that month’s interest, with a $25 floor, and never more than the balance plus its interest. On $5,000 at 22% that is $141.67 — of which $91.67 is interest and $50 comes off what you owe. The structure is the problem rather than the size: because the minimum is a percentage of the balance, it shrinks as the balance shrinks, so the plan decelerates exactly as it should be speeding up. Run that forward twelve months and you have paid $1,609.55 while the balance has fallen $568.08. This is a common US convention rather than a rule every issuer follows, so check your own statement.',
  },
  {
    t: 'Anything above the minimum goes entirely to principal',
    d: 'The extra payment has no interest to cover, because the minimum already covered it, so every dollar of it reduces the balance — and it reduces next month’s interest too, which is why the effect compounds instead of adding up. That is what makes the slider so violent at the low end. On $5,000 at 22%, minimum payments alone take 230 months and cost about $8,100 in interest; $10 a month on top brings that to 150 months and about $5,747; $50 brings it to 67 months and about $2,830; $100 brings it to 40 months and about $1,767. The balance is run to zero twice — once on the minimum alone, once with your extra — and the chart draws both, so the gap between where the two lines land is the time you buy.',
  },
  {
    t: 'With more than one card, the cheapest order is highest APR first',
    d: 'The form above runs one card at a time, but the engine underneath it takes a set of them, and where the extra payment lands is a real decision. Sending it to the highest APR — the avalanche method — costs the least total interest and is the ordering used here; sending it to the smallest balance is the snowball, which clears individual cards sooner. What neither name tells you is that the two objectives can point in opposite directions. On a book of $6,000 at 11.99% and $1,800 at 28.99% with $100 extra, avalanche takes 56 months against 55 for paying the biggest balance down first — one month longer, because retiring the small card early would have removed its minimum payment — while paying $733.65 less in interest. Speed and cost are not the same target, and this calculator optimises cost.',
  },
  {
    t: 'And the last figure is what the payment becomes once the card clears',
    d: 'The month a card is paid off, the money you were sending it does not reappear in your budget — it was already gone, which makes that month the easiest time there is to redirect it. The calculator shows the freed-up amount, your minimum plus your extra, and what that same monthly figure would come to over thirty years at an assumed 7% annual real return. That rate is the convention long-run projections use, not a prediction and not a product on offer.',
  },
]

/**
 * Where someone goes once they have a payoff date.
 *
 * Each `why` starts from something this page has just produced — the freed-up
 * payment, the extra payment, the buffer that the extra payment competes with
 * — rather than from the generic pitch on the /tools card.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'The extra payment and a cash buffer compete for the same dollars, and clearing a card with nothing behind it usually means the next unexpected bill goes straight back onto it. This sizes the buffer against your essential expenses rather than a blanket three-to-six-month rule, so you can see what has to exist alongside the payoff plan.',
  },
  {
    href: '/what-is-saving-monthly-worth',
    why: 'The last figure this calculator shows is what the freed-up payment would be worth invested over thirty years. That one is fixed at your payment and thirty years; this lets you move both, and puts investing, holding cash and paying down debt side by side on the same monthly amount.',
  },
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'The extra payment has to come from somewhere, and the honest question is what it displaces — an employer match, a retirement contribution, the buffer. This takes a real paycheck and works out the order, so the extra payment you entered above has a place in the rest of the month rather than sitting outside it.',
  },
]

export default function CreditCardPayoffPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. This was in
          layout.tsx, which existed only because this page could not export
          metadata; it can now, so the file is gone. */}
      <ToolJsonLd href="/credit-card-payoff" />
      {/* Step one of the funnel. `credit_card_payoff_page_view` keeps its own
          name, page and tool_version so its history stays joinable. */}
      <ToolPageView
        tool="credit_card_payoff"
        page="/credit-card-payoff"
        legacyEvent="credit_card_payoff_page_view"
        toolVersion="credit_card_payoff_v1"
      />

      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/credit-card-payoff" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              How long will it take to pay off my credit card?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              See when you&apos;ll be debt-free, what the balance costs you between now and then, and
              how much sooner an extra payment gets you there.
            </p>
            {/* Self-contained on purpose — an answer engine lifts this
                paragraph with no page around it, so it has to say what is
                computed and from what, without an antecedent. */}
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              On minimum payments alone the answer is usually years longer than people expect: a $5,000
              balance at 22% APR takes about 230 months &mdash; a little over 19 years &mdash; and costs
              roughly $8,100 in interest. Adding $100 a month on top brings that to 40 months and about
              $1,767. This free credit card payoff calculator takes your balance and your rate, models the
              minimum payment the way most US issuers set it &mdash; 1% of the balance plus that
              month&rsquo;s interest, with a $25 floor &mdash; and returns your debt-free date, the total
              interest, and how both move with any extra payment you add. It is built for people already
              carrying a balance whose real question is whether the amount they can spare each month
              changes the answer by enough to matter.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <CreditCardPayoffTool />
          </div>

          {/* YMYL disclosure — kept directly under the widget that produces the
              numbers it qualifies. */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How this credit card payoff calculator works"
        intro="Five rules, all published. The second one is why a credit card balance lasts as long as it does, and the third is why a small extra payment does so much to it."
        steps={STEPS}
      />

      {/* The secondary queries, answered as prose rather than only as a widget
          output. Someone asking "how much extra should I pay" wants a figure
          before they enter anything, and the minimum-versus-extra comparison is
          the mechanism behind every number on this page. */}
      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              How much extra should I pay on my credit card?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-subtle md:text-lg">
              There is no single right figure, but there are three things worth knowing before you pick
              one. All the numbers below come from running a $5,000 balance at 22% APR through this
              calculator.
            </p>

            <dl className="space-y-6">
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  Work backwards from a date rather than forwards from a number
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  &ldquo;A bit more than the minimum&rdquo; is not a plan, and a date is easier to hold on
                  to than a percentage. Clearing that balance inside three years takes about $113 a month on
                  top of the minimum. Two years takes about $182. One year takes about $389. Those three
                  figures are usually more useful than the slider, because they tell you which timelines are
                  actually available to you before you decide which one you want.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  The first dollars do far more than the last ones
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Going from nothing extra to $10 a month cuts the term from about 230 months to 150 and
                  removes roughly $2,350 of interest. Going from $100 to $150 cuts it from 40 months to 29
                  and removes about $473. That is five times the money for a fifth of the effect, and it is
                  the strongest argument against waiting until you can afford a serious payment: the small
                  one you can start this month is doing the part of the work that the large one later
                  cannot.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">
                  Enter what you can repeat, not what you can manage once
                </dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  The projection assumes the extra payment arrives every single month until the balance is
                  gone, which is the one assumption most likely to be wrong. An amount that survives a month
                  with a car repair in it produces a date you will actually hit; an amount that only works
                  in a good month produces a date the calculator believes and you do not.
                </dd>
              </div>
            </dl>

            <h3 className="mb-2.5 mt-8 text-[17.5px] font-bold tracking-[-0.015em] text-ink md:text-lg">
              Minimum payment vs extra payment: where each dollar actually goes
            </h3>
            <p className="text-base leading-relaxed text-subtle md:text-lg">
              A minimum payment is not a slow version of paying the card off. It is the smallest amount that
              keeps the account current, and it is built as that month&rsquo;s interest plus about 1% of the
              balance &mdash; so on $5,000 at 22%, $91.67 of the $141.67 is rent on the debt and $50 is
              repayment. Thirty-five cents in the dollar reaches the balance. An extra payment is the
              opposite: the interest is already covered, so all of it reaches the balance, and it lowers next
              month&rsquo;s interest as well. That difference in composition, not the difference in size, is
              why $100 added to a $142 minimum does not make the debt 70% faster. It takes the term from
              about 230 months to 40.
            </p>
          </div>
        </Container>
      </Section>

      {/* One disclosure block rather than two. The blind spots and the
          modelling simplifications are the same admission here — the model's
          biggest assumption, that nothing new is charged to the card, is also
          the most common reason a real payoff runs long — so splitting them
          would have been structure for its own sake. */}
      <Caveat label="What this can’t see:">
        your card. It projects a fixed balance at a fixed rate and assumes you never use the card again,
        which is the assumption most likely to break: any new spending restarts part of the timeline, and
        annual or late fees are added to the balance without appearing here. It does not model a promotional
        0% rate ending and reverting to a standard APR, a variable APR moving, a balance transfer, or a
        consolidation loan. Nor can it see what else the extra payment was going to do this month &mdash; an
        employer 401(k) match you would forfeit, or an emergency fund at zero, are both cases where the
        highest-interest balance is not automatically the right destination. Every figure here is an estimate
        for planning: the minimum-payment formula used is a common US convention rather than your
        issuer&rsquo;s contract, so your statement is the authority on both your minimum and your rate.
        WeLeap is not a registered investment adviser and nothing on this page is personalised financial
        advice.
      </Caveat>

      <ToolFaq href="/credit-card-payoff" />

      <RelatedTools
        from="credit_card_payoff"
        items={RELATED}
        heading="What to work out next"
        intro="A payoff date holds only if the extra payment survives contact with the rest of the month. Each of these starts from a figure this page has already produced."
      />

      <SiteFooter />
    </PageShell>
  )
}
