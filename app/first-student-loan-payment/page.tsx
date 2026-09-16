import type { Metadata } from 'next'
import { FirstLoanPaymentTool } from '@/components/FirstLoanPaymentTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'
import { RelatedReading, type RelatedArticle } from '@/components/RelatedReading'
import { TAX_YEAR_FIRST_PAYCHECK } from '@/lib/firstPaycheck/constants'
import { STANDARD_TERM_MONTHS } from '@/lib/studentLoan/calculation'

/**
 * /first-student-loan-payment — what the first payment does to a paycheck.
 *
 * The second moment. The offer tool catches somebody the week an offer lands;
 * this one catches them six months later, the week their paycheck shrinks for
 * the first time. For a May graduate that is November, and unlike most
 * urgency on a calculator page the date is real: the grace period ends on a
 * schedule nobody sets and the payment is due whether or not the reminder
 * arrived.
 *
 * The route is the situation rather than the question, the same exception
 * /first-paycheck-setup makes. Nobody searches "what does my student loan do
 * to my paycheck"; they search for the moment — first student loan payment,
 * grace period ending, repayment starts.
 */

const DESCRIPTION =
  'Grace period ending? See your first student loan payment and what actually lands in your account after it. Free, no account, no login.'

export const metadata: Metadata = {
  title: 'First student loan payment: what it does to your paycheck',
  description: DESCRIPTION,
  alternates: { canonical: '/first-student-loan-payment' },
  openGraph: {
    // Byte-identical to what `title` renders through the root layout's
    // `%s | WeLeap` template. scripts/checkMetadata.js fails the build on a
    // mismatch, which it has caught three times.
    title: 'First student loan payment: what it does to your paycheck | WeLeap',
    description: DESCRIPTION,
    url: '/first-student-loan-payment',
  },
}

/**
 * The method, in the order lib/studentLoan/calculation.ts runs it.
 *
 * Step two is the one that earns the page. The payment is arithmetic anybody
 * can look up; what it does to the number that lands in an account is not, and
 * it is the only figure here somebody will feel every month.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'The payment assumes you do nothing, because most people will',
    d: `Federal borrowers are placed on the standard ${STANDARD_TERM_MONTHS / 12}-year plan unless they actively choose something else, so that is what this prices: the balance cleared over ${STANDARD_TERM_MONTHS} months at your rate, using the same amortization the app uses for any other loan. It is not a recommendation, it is what happens by default, which is the situation most people are in during the weeks before a first payment. Income-driven plans changed under 2025 legislation, so this tool does not quote one rather than quoting one you may not be able to enrol in.`,
  },
  {
    t: 'The payment comes out of take-home, not out of salary',
    d: `This is the part that surprises people and the reason the page exists. A $60,000 salary is $5,000 a month gross and roughly $4,000 after federal tax, FICA and state tax, so a $341 payment is about 9% of what actually arrives rather than the 7% it looks like against the headline number. Every figure here starts from take-home for that reason. Federal tax uses ${TAX_YEAR_FIRST_PAYCHECK} single-filer brackets and the standard deduction, the same table every other calculator on this site reads, so two WeLeap tools cannot quote you different take-home for the same salary.`,
  },
  {
    t: 'State tax is your state, once you pick it',
    d: 'Pick a state and the estimate uses a rate for that state rather than a national average, which matters more than people expect: the same salary and the same loan leave noticeably different amounts in Texas, Colorado and Oregon. Leave it unset and the page says so and falls back to about 4%, roughly the national middle. These are approximate effective rates for a single filer on a graduate salary rather than top marginal rates, and they do not include city or county tax.',
  },
  {
    t: 'The match comes before extra payments, below about 10%',
    d: 'A dollar-for-dollar employer match is an immediate 100% return, which no ordinary student loan rate competes with, and it is only paid in the months you actually contribute. So the order is: capture the full match, hold a small cash cushion, then send extra at the loan. Above 10% the loan moves ahead of anything optional. This is the same threshold the app applies to any debt, so the free tool and the app never disagree about the same loan.',
  },
  {
    t: 'The paycheck is shown twice, because the advice changes it',
    d: 'One figure is your paycheck with the loan payment and no retirement contribution. The other is the same paycheck once you are contributing enough to capture a typical match, which is what this page recommends you do. Showing only the first would mean the number on screen and the number you get after following the advice are different, and the gap between them is exactly what keeping the match costs. It is smaller than the contribution, because the contribution reduces the tax you pay.',
  },
]

const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'This page shows what one loan does to one paycheck. This one takes the whole paycheck and puts the loan, the buffer, the match and everything else in order.',
  },
  {
    href: '/first-paycheck-setup',
    why: 'If the job is also new, the 401(k) and HSA boxes are sitting in a portal waiting on numbers. This gives you the exact ones, before the enrolment window closes.',
  },
  {
    href: '/credit-card-payoff',
    why: 'A student loan at 6% and a card at 24% are not the same debt. If you carry a balance, that is the one the order should start with.',
  },
]

const RELATED_READING: readonly RelatedArticle[] = [
  {
    href: '/resources/featured-article',
    why: 'Why a clear answer to "what do I do next" is so rarely available at the moment you actually need it.',
  },
]

export default function FirstStudentLoanPaymentPage() {
  return (
    <PageShell className="bg-canvas">
      <ToolJsonLd href="/first-student-loan-payment" />
      <ToolPageView
        tool="first_loan_payment"
        page="/first-student-loan-payment"
        toolVersion="first_loan_payment_v1"
      />

      <Section variant="canvas" className="pb-10 pt-20 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/first-student-loan-payment" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What does my student loan do to my paycheck?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Your grace period ends six months after you leave school. Here is what the first payment does to
              the money that actually lands.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-6 max-w-3xl scroll-mt-24">
            <FirstLoanPaymentTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account · No bank connection · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How these numbers are worked out"
        intro="Five rules, all published, and one of them is the reason this is a page rather than a sentence."
        summary={
          <>
            You already know what you owe. What the first payment does to the money that actually reaches your
            account is a different number, and it is the one you will feel every month. This prices the standard
            plan, takes it out of take-home rather than salary, uses your state once you pick it, and puts the
            employer match ahead of extra payments below about 10% because that is the order that leaves you with
            more.
          </>
        }
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Caveat label="Where this stops">
              These are estimates for planning, not personalised financial, tax or legal advice, and WeLeap is not
              a registered investment adviser. The payment assumes the standard{' '}
              {STANDARD_TERM_MONTHS / 12}-year plan; if you are on an income-driven plan your payment is set by a
              formula this page does not model, and federal repayment plans changed under 2025 legislation, so
              studentaid.gov and your servicer are the authorities on what you can enrol in and what you owe.
              Federal figures are {TAX_YEAR_FIRST_PAYCHECK} single-filer brackets and the standard deduction; if
              you are married, have dependants or a second job, the take-home here is the wrong shape. State tax
              is an approximate flat rate rather than a bracket calculation. Private loans, variable rates,
              consolidation and forgiveness programmes are all outside what this works out.
            </Caveat>
          </div>
        </Container>
      </Section>

      <ToolFaq href="/first-student-loan-payment" />

      <RelatedTools
        from="first_loan_payment"
        items={RELATED}
        heading="Once the payment is set"
        intro="This page covers one loan and one paycheck. These cover what sits around it."
      />

      <RelatedReading from="first_loan_payment" items={RELATED_READING} />

      <SiteFooter />
    </PageShell>
  )
}
