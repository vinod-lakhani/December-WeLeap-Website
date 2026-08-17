import type { Metadata } from 'next'
import { OfferAnalysisTool } from '@/components/OfferAnalysisTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /what-is-my-job-offer-worth — the total-compensation calculator.
 *
 * A server component. It used to be a client component wrapping one analytics
 * effect, which meant `metadata` had to live in a sibling layout.tsx and the
 * whole page shell shipped as JavaScript. The effect is now `ToolPageView` and
 * the only client leaf left is the calculator itself.
 *
 * Target query is "what is my job offer really worth" and the
 * total-compensation cluster around it, not "is this job offer good". The tool
 * decomposes one offer into seven priced components and converts it to monthly
 * take-home against local rent; it holds no salary benchmark data, so it cannot
 * answer whether a number is competitive and the page says so out loud rather
 * than implying otherwise. See "What counts as a good job offer?" below.
 */

export const metadata: Metadata = {
  title: 'What is my job offer really worth? Free calculator',
  description:
    'See what a job offer is worth beyond base salary — bonus, 401(k) match, benefits, equity and PTO — plus monthly take-home after tax and local rent.',
  alternates: { canonical: '/what-is-my-job-offer-worth' },
  openGraph: {
    // Brand spelled out, and kept byte-identical to `title` above. `openGraph`
    // does not inherit the root layout's `%s | WeLeap` template, so a title
    // written here that omits the suffix renders shorter than the <title> and
    // the share card says something different from the tab. That divergence
    // was a real audit finding on this page.
    title: 'What is my job offer really worth? Free calculator | WeLeap',
    description:
      'See what a job offer is worth beyond base salary — bonus, 401(k) match, benefits, equity and PTO — plus monthly take-home after tax and local rent.',
    url: '/what-is-my-job-offer-worth',
  },
}

/**
 * The seven-number grid below already existed, but a grid of labels tells a
 * reader (or a model) that seven numbers exist without saying what any of them
 * are worth or how they combine. These steps are the missing half.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'It starts from take-home, not base salary',
    d: 'We estimate federal income tax, your state’s income tax and FICA, then show what actually lands each month. For most salaries between $60,000 and $150,000 that is somewhere between roughly 65% and 78% of gross, and the state you work in moves it more than almost anything else in the offer.',
  },
  {
    t: 'Then it prices the six things that aren’t salary',
    d: 'Bonus target, employer 401(k) match, health and HSA contributions, equity, and paid time off. A dollar-for-dollar match up to 5% of an $80,000 salary is $4,000 a year you only receive if you contribute — that is a bigger swing than most negotiated salary increases.',
  },
  {
    t: 'It puts housing next to the offer',
    d: 'A market rent estimate for the city goes beside your take-home, because the same salary buys very different lives in different places. Comparing two offers on base salary alone is comparing the one number that varies least.',
  },
  {
    t: 'And it shows the total against the number in the letter',
    d: 'Base salary is typically 70% to 90% of what an offer is worth. The gap between the two figures is what you would be giving up by taking the higher base — or what you would be gaining by taking the lower one.',
  },
]

/**
 * Where someone goes after they have a number.
 *
 * Each `why` is written for a reader who has just finished an offer analysis,
 * not lifted from the tool's own blurb — the reason to open the rent
 * calculator from here is the housing line they just filled in.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/how-much-rent-can-i-afford',
    why: 'You entered a city and a rent figure above. This works the other way round: it takes the salary and returns the rent range that fits it, plus the cash you need upfront before you get keys.',
  },
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'The match this page priced is the first move, not the whole plan. This puts the match, a safety buffer, high-interest debt and retirement in order for the salary you just entered.',
  },
  {
    href: '/what-is-saving-monthly-worth',
    why: 'An offer’s 401(k) match is a monthly amount. This compounds any monthly amount out to one, ten and thirty years, which is the honest way to see what capturing a match is worth over a career.',
  },
]

export default function OfferAnalysisPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. */}
      <ToolJsonLd href="/what-is-my-job-offer-worth" />
      {/* `tool`, the legacy event name and its `page` value are analytics
          identifiers, not URLs. The route moved from /offer; these did not, so
          the funnel and every saved report keep joining to their own history. */}
      <ToolPageView
        tool="offer"
        page="/what-is-my-job-offer-worth"
        legacyEvent="offer_analysis_page_view"
        legacyPage="/offer"
        toolVersion="offer_tool_v1"
        pixelContentName="offer_tool"
      />

      {/* Hero */}
      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <ToolBreadcrumb href="/what-is-my-job-offer-worth" />

          {/* lime on the old dark hero; on the warm canvas it needs brand green to stay legible */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-700">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-700" />
            Free · No account required
          </div>
          <h1 className="mb-4 text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            What is your job offer{' '}
            <span className="text-brand-700">really worth?</span>
          </h1>
          <p className="mx-auto max-w-md text-lg leading-relaxed text-subtle">
            Your offer letter has seven numbers in it. Most people only read one.
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-subtle">
            This free total compensation calculator turns base salary, bonus target, employer 401(k) match, health and
            HSA contributions, equity, paid time off and local rent into one annual figure and one monthly take-home
            figure. Base salary is usually only 70% to 90% of what an offer is worth, which is why two offers that look
            a few thousand apart often aren&apos;t. Enter one offer to see what it is really worth, or run it twice to
            compare two.
          </p>
        </Container>
      </Section>

      {/* Tool sits directly under the hero — same reasoning as the rent tool:
          people arrive knowing what they want, so the input comes first and
          the explainer becomes reinforcement below. */}
      <Section variant="canvas" className="pt-0">
        <Container maxWidth="narrow">
          <OfferAnalysisTool />
        </Container>
      </Section>

      {/* How it works */}
      <Section variant="white">
        <Container maxWidth="narrow">
          <h2 className="text-lg font-bold text-gray-900 text-center mb-6">The 7 numbers in your offer</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
            {[
              { n: '1', label: 'Base salary' },
              { n: '2', label: 'Bonus target' },
              { n: '3', label: '401k match' },
              { n: '4', label: 'HSA & benefits' },
              { n: '5', label: 'Equity' },
              { n: '6', label: 'Time off' },
              { n: '7', label: 'Housing cost' },
            ].map(item => (
              <div key={item.n} className="flex items-center gap-2 bg-white rounded-xl border border-gray-200 px-3 py-2.5">
                <div className="w-6 h-6 rounded-full bg-[#386641] text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {item.n}
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <MethodSteps heading="How we value an offer" steps={STEPS} />

      {/* Reading the output. The calculator returns three numbers and they mean
          different things; without this the page shows a total and leaves the
          reader to guess which one to plan against. */}
      <Section variant="white" className="pt-0">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              How do you read the result?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-subtle md:text-lg">
              Three figures come out, and they answer different questions. Mixing them up is the most common way an
              offer gets misjudged in either direction.
            </p>

            <dl className="space-y-6">
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">Total package</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Everything the employer gives you in a year, before tax: base, bonus at target, the match you would
                  capture, employer HSA money and equity vesting, less what you pay for health cover. This is the
                  number to quote in a negotiation and the number to compare against another offer — but it is not
                  money you can spend, because most of it is either taxed, locked in a retirement account or dependent
                  on a share price.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">Monthly take-home</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Base salary after estimated federal tax, state tax and FICA, divided by twelve. This is the number to
                  plan a life against — rent, bills, everything. If rent is more than about 30% of it the calculator
                  flags it, and over 35% it hands you the rent tool rather than just warning you.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">Monthly wealth building</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  What the offer leaves you to build with each month: the savings share of your take-home, plus
                  employer contributions, plus after-tax bonus and equity. It moves when you drag the needs and wants
                  sliders, which is the point — the offer sets the ceiling, and how you live sets where inside it you
                  land.
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </Section>

      {/* The honest answer to the query that brings most people here. */}
      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              What counts as a good job offer?
            </h2>
            <p className="mb-4 text-base leading-relaxed text-subtle md:text-lg">
              &ldquo;Good&rdquo; is three questions wearing one coat. Is the offer competitive for that role, level and
              location? Is the package worth more or less than the headline suggests? And does what it leaves you each
              month support the life you want where the job actually is?
            </p>
            <p className="mb-4 text-base leading-relaxed text-subtle md:text-lg">
              This calculator answers the second and third precisely. It does not answer the first, and it is worth
              being blunt about that: nothing here holds salary benchmark data, so it cannot tell you whether $115,000
              is the market rate for your role in your city. For that you need a site that collects reported salaries
              by company and level. Bring that number here afterwards — knowing the market rate tells you whether to
              push on base, and this tells you whether pushing on base is even where the money is.
            </p>
            <p className="mb-4 text-base leading-relaxed text-subtle md:text-lg">
              On the parts it can see, three things separate a strong package from a large base salary. A 401(k) match
              is the only line in an offer that is an immediate, guaranteed return on your own money — and it is
              forfeited quietly if you never raise your contribution rate. Equity is compensation but not income: RSUs
              in a listed company have a price and a vesting schedule, options in a private company have a scenario.
              And the state and the city do more to your monthly number than most negotiable amounts do, which is why
              the same offer is genuinely worth different amounts in different places.
            </p>
            <p className="text-base leading-relaxed text-subtle md:text-lg">
              There is no threshold at which an offer becomes objectively good. What you can do is stop comparing the
              one number in an offer that varies least, and start comparing what is left at the end of the month.
            </p>
          </div>
        </Container>
      </Section>

      {/* Secondary query, answered as an actual procedure. */}
      <Section variant="white">
        <Container>
          <div className="mx-auto max-w-3xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              How do you compare two job offers?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-subtle md:text-lg">
              The calculator takes one offer at a time. Run it twice — once per offer, with each one&apos;s own state
              and city — and write down four numbers each time.
            </p>
            <ol className="space-y-5">
              {[
                {
                  t: 'Total package, not base salary',
                  d: 'Enter both offers in full, including the bonus target, the match terms and the annual vesting value of any equity. Offers quoted a few thousand apart routinely land closer together once the match and bonus are priced, and they routinely swap places.',
                },
                {
                  t: 'Monthly take-home in each offer’s own state',
                  d: 'Set the work state for each. Nine states levy no income tax on wages and the highest-tax states sit at the other end of the range, so two identical salaries do not produce identical paycheques.',
                },
                {
                  t: 'What is left after rent in each city',
                  d: 'Take monthly take-home and subtract a realistic rent for where you would actually live. This is the figure that decides how the two offers feel to live on, and it is the one a base-salary comparison never shows.',
                },
                {
                  t: 'Then weigh what has no dollar value',
                  d: 'Vesting cliffs, whether the private-company equity is worth anything, how much of the PTO you would really take, the commute, and how much you want the job. The calculator deliberately leaves equity as its own line rather than folding it into the total, so the comparison stays honest when one offer is mostly paper.',
                },
              ].map((step, i) => (
                <li key={step.t} className="flex gap-4 md:gap-5">
                  <div className="flex-shrink-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-hairline bg-canvas md:h-10 md:w-10">
                      <span className="text-sm font-semibold text-subtle md:text-base">{i + 1}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-lg font-semibold text-ink md:text-xl">{step.t}</h3>
                    <p className="text-base leading-relaxed text-subtle md:text-lg">{step.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </Container>
      </Section>

      <Caveat label="What this can’t see:">
        your existing savings, what you already contribute, and whether the equity is worth anything. Public-company
        RSUs have a price; private-company options have a scenario. We show equity as its own line rather than folding
        it into a total, so it never quietly inflates the number you plan your rent against.
      </Caveat>

      <ToolFaq href="/what-is-my-job-offer-worth" />

      <RelatedTools
        from="offer"
        items={RELATED}
        heading="What to work out next"
        intro="An offer sets the ceiling. These three decide where inside it you land — and each one starts from a number this page already produced."
      />

      {/* YMYL disclosure. Sits after the content it qualifies and names the
          specific simplifications, because "estimates only" on a page that
          prints a tax figure to the dollar is not a disclosure. */}
      <Section variant="canvas" className="pt-0">
        <Container>
          <div className="mx-auto max-w-3xl border-t border-hairline pt-8">
            <h2 className="mb-3 text-lg font-bold tracking-[-0.015em] text-ink">
              What this calculator does not account for
            </h2>
            <p className="mb-3 text-[15px] leading-relaxed text-subtle">
              Every figure here is an estimate for planning, not personalised financial advice, and not a
              representation of what you will actually be paid or what any investment will return. Tax is estimated
              for a single filer using federal brackets, your state&apos;s income tax and FICA. It does not model
              filing jointly, dependants, pre-tax deductions such as your own 401(k) or HSA contributions, itemised
              deductions, or the local and city income taxes that apply in places like New York City — all of which
              move the real number. Bonus and equity are taxed at your estimated effective rate rather than at
              supplemental withholding rates.
            </p>
            <p className="text-[15px] leading-relaxed text-subtle">
              Rent figures are market estimates for a metro area, not quotes for a specific apartment. Equity is shown
              at the value you enter, which for a private company is a scenario rather than a price. WeLeap is not a
              registered investment adviser and does not provide personalised investment or tax advice — for your own
              situation, speak to a licensed professional.
            </p>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
