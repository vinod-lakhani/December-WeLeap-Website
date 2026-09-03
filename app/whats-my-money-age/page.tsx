import type { Metadata } from 'next'
import { MoneyAgeTool } from '@/components/MoneyAgeTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /whats-my-money-age — the campaign front door.
 *
 * Every other tool here asks for something the visitor has to look up. This one
 * asks for an age, three taps, and a slider, and returns a number after the
 * third. That is the entire reason it exists: it is the top of the funnel for
 * an audience that will not fill in five fields to find out about an employer
 * match, and the retirement machinery is behind the slider rather than in front
 * of it.
 *
 * The method is published below the fold in full, including both parameters and
 * their sources. That is not a compliance footnote — a number this shareable
 * gets reverse-engineered, and the method surviving that is the whole play.
 *
 * See docs/specs/money-age-v2.md. Both parameters that decide the answer are
 * sourced: the reference savings rate to Vanguard's How America Saves, and the
 * pay-growth schedule to a BLS earnings series. Neither is a number anyone here
 * picked, which is the property that has to survive the method being read.
 */

export const metadata: Metadata = {
  title: "What's my money age? Free calculator",
  description:
    'Your money might be older than you are. Four taps and a slider turn your age, income and savings into one number — and show what moves it. Free, no account needed.',
  alternates: { canonical: '/whats-my-money-age' },
  openGraph: {
    title: "What's my money age? Free calculator | WeLeap",
    description:
      'Your money might be older than you are. Four taps and a slider turn your age, income and savings into one number — and show what moves it. Free, no account needed.',
    url: '/whats-my-money-age',
  },
}

/**
 * The method, in the order lib/moneyAge/calculation.ts runs it.
 *
 * Read out of the code, not paraphrased from the pitch. Step five is the one
 * that matters most for trust: it states the property that makes the number
 * mean anything, and step six states the limitation that will otherwise look
 * like a bug the first time someone gets a raise.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'We build one imaginary saver, and compare you to them',
    d: 'Not to a survey, not to your friends, and not to a national average of balances. Your money age is the age at which a single reference saver would have held what you hold. Everything below describes that one person, because once you know who they are the number is fully determined — there is no adjustment, no curve anyone drew, and nothing to tune after the fact.',
  },
  {
    t: 'That saver has a career, so their pay rises the way real pay does',
    d: 'They start work at 22 earning less than you do now, and their salary grows until it reaches your current income at your current age. This is pay growth, not investment growth — the two are separate and the next step covers the other one. How fast their pay rises comes from the Bureau of Labor Statistics: real earnings grow about 6.2% a year through the early twenties, 4.1% from 25 to 29, 3.3% from 30 to 34, 3.1% from 35 to 39, and only 0.7% after 40. We use that schedule rather than one averaged rate, because a single number is something we would have picked and this is something somebody published. The shortcut worth avoiding is assuming they earned your current salary every year since 22 — that makes them impossible, since nobody earns their age-35 salary at 22, and it raises the bar the longer your career has run.',
  },
  {
    t: 'They save 12.1% of their pay, every year, counting their employer',
    d: 'This is the number that sets the bar, so it is sourced rather than chosen: 12.1% is the average total participant contribution rate — employee plus employer — from Vanguard’s How America Saves 2026, covering roughly five million retirement plan participants in the 2025 plan year. Employee-only contributions average 7.6%. We use the total because the savings rate you enter also counts your employer’s money, and the bar has to count the same things the input does or the comparison is meaningless. Worth being plain about whose average this is: it describes people who already have a workplace retirement plan and are contributing to it, not the whole working population. That makes it a deliberately demanding bar. Measured against everyone, including people with no plan at all, almost anyone saving anything would look ahead — which would be a more flattering number and a far less useful one.',
  },
  {
    t: 'Their balance grows 5% a year above inflation — this is the investment return, not their pay',
    d: 'Two different rates are at work and it is easy to run them together: the step above is how fast their salary rises, and this one is what their invested balance earns. Their contributions compound at 5% real, which produces a rising balance for every age. Your money age is the point on that curve where their balance equals yours — your retirement accounts, investments, savings and cash, minus any credit card balance. Because there is no closed-form way to invert a growing annuity, the answer is found by bisection: the same arithmetic run about sixty times, narrowing on the age.',
  },
  {
    t: 'Then years are added or subtracted for what you are putting away now',
    d: 'Saving more than 12.1% adds years, saving less subtracts them, capped at ten in either direction so that one estimated input cannot swamp the balance you actually hold. This term is why a contribution change moves your money age the moment you make it, rather than years later once it has compounded — and it is why the slider does anything at all. It also produces the property that makes the whole number interpretable: save exactly the reference rate, hold exactly what the reference saver holds, and your money age is your own age.',
  },
  {
    t: 'One thing this does that will look like a bug: a raise lowers your money age',
    d: 'The bar is a share of what you earn, not a fixed dollar figure. Earn more and the reference saver is putting away more every year, so they reach any given balance sooner — which means your savings represent fewer of their years. That is deliberate, because the alternative is comparing a $45,000 earner and a $145,000 earner against the same dollar target. But it does mean a pay rise on its own moves the number the wrong way, and it is better to say so here than to let you discover it and assume the calculator is broken.',
  },
]

const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'The slider on this page shows what saving more does to your money age. This one answers the question that immediately follows — which account the extra should go into, in what order, and how much of it your employer will match.',
  },
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'Cash savings count toward the balance this page measures, but not all of it should be invested. This sizes the part that needs to stay liquid against your actual expenses and how stable your income is.',
  },
  {
    href: '/credit-card-payoff',
    why: 'A card balance is subtracted from what you hold before your money age is calculated, so clearing it moves the number directly. This turns the balance into a payoff date.',
  },
]

export default function MoneyAgePage() {
  return (
    <PageShell className="bg-canvas">
      <ToolJsonLd href="/whats-my-money-age" />
      <ToolPageView tool="money_age" page="/whats-my-money-age" toolVersion="money_age_v1" />

      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/whats-my-money-age" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What&apos;s my money age?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Your money might be older than you are — or a lot younger. Four questions and a slider
              turn what you earn and what you&apos;ve saved into a single number, and show you the one
              move that changes it most.
            </p>
          </div>

          {/* The form goes directly under the h1 with nothing between. The
              first question has to be visible without scrolling on a phone;
              anything explanatory belongs below the fold, not above the
              input. */}
          <div id="calculator" className="mx-auto mt-10 max-w-2xl scroll-mt-24">
            <MoneyAgeTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account · No bank connection · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How your money age is calculated"
        intro="Six rules and two parameters, all published. Both parameters come from a named public source rather than from us, so you can check the bar rather than take it on trust."
        summary={
          <>
            Your money age is the age at which one reference saver would have held what you hold. That
            saver starts at 22 on a lower salary than you earn now, grows into your income by your age,
            puts away 12.1% of their pay every year &mdash; the average total contribution rate, employee
            plus employer, from Vanguard&rsquo;s <em>How America Saves 2026</em> &mdash; and earns 5% a year
            above inflation. Where your savings sit on their balance curve gives most of the number, and
            saving more or less than they do adds or subtracts the rest. Nothing here needs an account, a
            bank connection or a document.
          </>
        }
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Caveat label="What this number is not">
              It is not a comparison against other people your age. A real peer comparison needs a
              distribution of savings by age and income, and the most recent public source for that
              &mdash; the Federal Reserve&rsquo;s Survey of Consumer Finances &mdash; is from 2022,
              reports households rather than individuals, and publishes its youngest bracket as
              &ldquo;under 35&rdquo;, which is too coarse to separate a 24-year-old from a
              34-year-old. Rather than invent a peer line, this tool compares you to a reference
              saver whose savings rate and pay growth are both published figures, so you can check
              the bar yourself. Both carry the same caveat: the savings rate describes people who
              already have a workplace plan, and the pay-growth schedule follows one cohort tracked
              from 1979. They are the best public sources for each, and they are not this
              decade&rsquo;s twenty-somethings.
            </Caveat>
          </div>
        </Container>
      </Section>

      <ToolFaq href="/whats-my-money-age" />

      <RelatedTools
        from="money_age"
        items={RELATED}
        heading="Once you have a number"
        intro="Your money age says where you stand. These three change it."
      />

      <SiteFooter />
    </PageShell>
  )
}
