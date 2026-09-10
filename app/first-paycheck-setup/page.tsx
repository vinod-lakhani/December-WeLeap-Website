import type { Metadata } from 'next'
import { FirstPaycheckTool } from '@/components/FirstPaycheckTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'
import { TAX_YEAR_FIRST_PAYCHECK } from '@/lib/firstPaycheck/constants'

/**
 * /first-paycheck-setup — what to type into the benefits forms.
 *
 * The one tool here with a real deadline attached. A new-hire enrolment window
 * is usually about thirty days, it does not reopen until the autumn, and an
 * employer match never backfills the months somebody missed — so the urgency
 * is a property of the situation rather than something the page manufactures,
 * which is unusual for a calculator and worth not squandering.
 *
 * The route is the tool's name rather than the card's question. Every other
 * tool route here is the question a person types, and this one is the
 * exception on purpose: nobody searches "what do I type into my benefits
 * forms". They search for the situation — first paycheck, new job benefits,
 * how much to contribute at a new job — and the name is what that traffic is
 * shaped like. The question still leads the card and the h1.
 */

const DESCRIPTION =
  'Starting a new job? Upload your offer letter and benefits guide and get the exact numbers for the 401(k), HSA and W-4 boxes — per paycheck, before your enrolment window closes. Free, no account.'

export const metadata: Metadata = {
  title: 'What do I type into my benefits forms? First paycheck setup',
  description: DESCRIPTION,
  alternates: { canonical: '/first-paycheck-setup' },
  openGraph: {
    title: 'What do I type into my benefits forms? | WeLeap',
    description: DESCRIPTION,
    url: '/first-paycheck-setup',
  },
}

/**
 * The method, in the order lib/firstPaycheck/calculation.ts runs it.
 *
 * Step three is the one that earns the page. Everything else here is
 * arithmetic anybody could do; knowing that a 401(k) dollar pays FICA and an
 * HSA dollar does not is the part that is genuinely not obvious and changes
 * which box to fill first.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'The 401(k) number is your match cap, and nothing above it',
    d: 'The percentage this tool tells you to type is exactly the point where your employer stops matching. That is the one number in your first week with an unambiguous answer: below it you are declining money that is offered to you, and the match is not paid retroactively for months you skipped. What to contribute ABOVE the match is a genuinely different question that depends on high-interest debt, whether you have a cash buffer, and what else is on your plate — and inventing an answer to it from four form fields would be worse than not answering it. That is what the money plan is for.',
  },
  {
    t: 'Roth or traditional is decided by the bracket you land in after contributing',
    d: `We take your salary, subtract the ${TAX_YEAR_FIRST_PAYCHECK} standard deduction and your pre-tax contributions, and read the marginal bracket that remains — the rate your next dollar is taxed at, not your average rate. Below 22%, Roth is usually stronger, because you are likely paying the lowest rate you will ever pay and qualified withdrawals later are untaxed. At 22% and above, the deduction today usually wins. The order matters: your own contributions can push you across that line, so reading the bracket before them would give the opposite answer for anybody sitting just above it.`,
  },
  {
    t: 'An HSA dollar costs less than a 401(k) dollar, and this is why',
    d: 'A 401(k) contribution escapes income tax but not FICA — Social Security and Medicare still come out of it. An HSA contribution made through payroll escapes both. That is a difference of 7.65 cents on every dollar, permanently, in the HSA’s favour, and it holds regardless of your bracket. Most explanations treat the two as equivalent pre-tax buckets, which understates the HSA every time. The figures on this page price each one separately for exactly that reason.',
  },
  {
    t: 'Everything is converted to your actual pay period',
    d: 'A payroll portal asks for a percentage or a dollar figure per paycheck, not a yearly plan, so that is what this returns. The conversion is not cosmetic: twice a month is 24 periods and every two weeks is 26, they are different numbers, and dividing an annual HSA target by the wrong one leaves you short or over the limit by the end of the year. The tool asks which you are on because there is no way to guess it.',
  },
  {
    t: 'The enrolment date is a prompt to check, not an answer',
    d: 'Thirty days from your start date is the common default, so that is what we show. It is not a rule — plans set their own windows and some are two weeks. The date on this page exists to make you go and find the real one in your benefits email, and it is labelled as a guess everywhere it appears, because being confidently wrong about this costs somebody a year of coverage.',
  },
]

const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'This page tells you the one number your first week demands: enough to capture the match. What to do with everything above it — buffer, debt, retirement, and in what order — is the question this one answers.',
  },
  {
    href: '/what-is-my-job-offer-worth',
    why: 'Still deciding between offers, or want to know what the package is actually worth before you sign? This prices the whole thing — base, bonus, match, equity, HSA and PTO — as one annual figure.',
  },
  {
    href: '/how-much-rent-can-i-afford',
    why: 'The other decision a new job forces, usually in the same fortnight. This works a rent line off take-home rather than gross, which is the number your landlord’s calculator ignores.',
  },
]

export default function FirstPaycheckSetupPage() {
  return (
    <PageShell className="bg-canvas">
      <ToolJsonLd href="/first-paycheck-setup" />
      <ToolPageView tool="first_paycheck" page="/first-paycheck-setup" toolVersion="first_paycheck_v1" />

      <Section variant="canvas" className="pb-10 pt-28 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/first-paycheck-setup" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What do I type into my benefits forms?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              New job? Drop in your offer letter and benefits guide. We read the match formula, the HSA and
              the premium, then give you the exact numbers for each box — before your enrolment window
              closes.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <FirstPaycheckTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account · We never store your documents · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How these numbers are worked out"
        intro="Five rules, all published, and one of them is the reason this page exists rather than a blog post."
        summary={
          <>
            Your first week at a job asks you to fill in forms that lock for a year, using numbers that live in
            a benefits guide nobody reads. This tool reads it for you: the 401(k) percentage that captures your
            full match, whether Roth or traditional is stronger at your bracket, what to put in the HSA box per
            paycheck, and what your first full check should be. It is built for the thirty days after a start
            date, and it is worth nothing outside them &mdash; which is why everything it returns is shaped like
            the form rather than like a plan.
          </>
        }
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Caveat label="Where this stops">
              These are estimates for planning, not personalised financial, tax or legal advice, and WeLeap is
              not a registered investment adviser. The federal figures are {TAX_YEAR_FIRST_PAYCHECK}{' '}
              single-filer brackets and the standard deduction; if you are married, have dependants, a second
              job or a working spouse, the W-4 answer here is the wrong one and the IRS withholding estimator
              is the right tool. State tax is an approximate flat rate rather than a bracket calculation, so
              treat the take-home figure as close rather than exact. Your employer&rsquo;s portal is always the
              authority on what it will accept, and your benefits email is the authority on your real deadline.
            </Caveat>
          </div>
        </Container>
      </Section>

      <ToolFaq href="/first-paycheck-setup" />

      <RelatedTools
        from="first_paycheck"
        items={RELATED}
        heading="Once the forms are in"
        intro="This page covers the first week. These cover the rest."
      />

      <SiteFooter />
    </PageShell>
  )
}
