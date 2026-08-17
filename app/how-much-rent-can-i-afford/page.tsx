import type { Metadata } from 'next'
import { OfferTool } from '@/components/OfferTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { ScrollBeacon } from '@/components/ScrollBeacon'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'

/**
 * /how-much-rent-can-i-afford — the rent affordability calculator.
 *
 * The slug is the query verbatim, and this is the highest-volume query in the
 * tool set. It was also the thinnest page in it: 713 served words against
 * 930–2,368 for its six peers, with no MethodSteps, no Caveat, no
 * BreadcrumbList and no internal links out.
 *
 * A server component now. It used to be a client component wrapping a single
 * IntersectionObserver, which meant `metadata` had to live in a sibling
 * layout.tsx and the entire shell shipped as JavaScript. The observer is now
 * `ScrollBeacon`, the page-view effect is `ToolPageView`, and the only client
 * leaf left is the calculator itself.
 *
 * `OfferTool` is that calculator despite the name — it predates the split
 * between this route and /what-is-my-job-offer-worth, and every analytics
 * identifier inside it (`rent_form_start`, `tool: 'rent'`, `rent_tool_v1`) is
 * joined to history under those names. Do not rename it.
 *
 * The load-bearing passage on this page is step three below: the 30% rule is
 * conventionally quoted on gross income, and this calculator applies its band
 * to take-home instead. That distinction is the one thing here worth citing,
 * so it is stated as arithmetic rather than as a slogan.
 */

export const metadata: Metadata = {
  title: 'How much rent can I afford? Free calculator',
  description:
    'Turn a salary into a monthly rent range based on take-home pay, not gross — plus the cash you need upfront before you get keys. Free, no signup.',
  alternates: { canonical: '/how-much-rent-can-i-afford' },
  openGraph: {
    // Byte-identical to what `title` renders through the root layout's
    // `%s | WeLeap` template. `openGraph.title` does not inherit that template,
    // so a hand-written brand suffix silently drifts from the <title>. This
    // page had drifted: it was branched before the sweep that fixed the same
    // bug elsewhere, so it reintroduced it on the highest-volume route.
    title: 'How much rent can I afford? Free calculator | WeLeap',
    description:
      'Turn a salary into a monthly rent range based on take-home pay, not gross — plus the cash you need upfront before you get keys.',
    url: '/how-much-rent-can-i-afford',
  },
}

/**
 * What the calculator actually does, in the order it does it — read out of
 * lib/rent.ts, app/api/tax/route.ts and components/ResultsCards.tsx rather
 * than paraphrased from the marketing copy.
 *
 * Step three is the reason this page exists. Steps four and five are the two
 * things people get wrong after they have the monthly number.
 */
const STEPS: readonly MethodStep[] = [
  {
    t: 'Your salary becomes take-home pay first',
    d: 'You enter an annual salary and where you will be living. The calculator estimates federal income tax, that state’s income tax and FICA — Social Security at 6.2% of wages and Medicare at 1.45% — then divides what is left by twelve. The state moves that monthly figure more than almost anything else in the decision: nine states levy no tax on wage income at all, and the highest-tax states sit at the other end of the range.',
  },
  {
    t: 'Debt minimums come out before the percentage is applied',
    d: 'Switch on the debt toggle and your total monthly minimum payments — student loans, a car payment, credit card minimums — are subtracted from take-home before anything else happens. Because the rent band is a share of what is left rather than of the whole paycheck, every $100 of minimum payments takes $28 to $35 off the top of your rent range.',
  },
  {
    t: 'Then the band is applied to net income, not gross',
    d: 'This is where the answer here differs from most rent calculators. The 30% rule is conventionally quoted on gross salary, and that is the version listing sites and landlords use. But rent is paid out of what lands in your account, so this tool applies a 28–35% band to take-home instead — 28% at the low end, 35% at the high end, rounded to the nearest $25. For someone losing roughly a quarter of their salary to tax, that band works out to about 21% to 26% of gross. On a $70,000 salary the gross-based rule allows about $1,750 a month; the same arithmetic on take-home lands nearer $1,225 to $1,530. That gap is not a rounding error, and it is the difference between a lease that works and one that quietly does not.',
  },
  {
    t: 'It prices the cash you need before you get keys',
    d: 'The monthly number is the one people can afford. The upfront number is the one that catches them out. The calculator adds a security deposit of one month’s rent, first month’s rent, about $600 of moving and setup costs, and living costs across the roughly two-week gap between your start date and your first paycheck — then shows the total as a range across the low and high end of your rent band. In practice that is a little over two months’ rent before you have bought a single piece of furniture.',
  },
  {
    t: 'Bonus and variable income are left out on purpose',
    d: 'There is no field for a bonus, commission or equity, and that is a decision rather than an omission. A lease is a fixed monthly obligation for twelve months; a bonus is discretionary for your employer and arrives once, after tax, if it arrives. Sizing rent against base salary alone and treating anything variable as a separate decision once it lands is the convention here for that reason.',
  },
]

/**
 * Where someone goes once they have a rent number.
 *
 * Each `why` is written for a reader who has just run this calculation — the
 * reason to open the payoff tool from here is the debt toggle they just used,
 * not the generic pitch on the /tools card.
 */
const RELATED: readonly RelatedTool[] = [
  {
    href: '/what-is-my-job-offer-worth',
    why: 'The rent range above is a percentage of one salary figure. If that salary is still an offer you are weighing, this prices the whole package — bonus target, employer 401(k) match, benefits, equity and PTO — and returns the monthly take-home that this band is a percentage of.',
  },
  {
    href: '/credit-card-payoff',
    why: 'Debt minimums come off your take-home before the rent band is applied, so every $100 of minimum payments costs you $28 to $35 of monthly rent budget. This shows what clearing a balance would actually take, and what the payment turns into once the card is gone.',
  },
  {
    href: '/how-much-emergency-fund-do-i-need',
    why: 'The cash you need to get keys and the cash you need for an emergency are two different pots, and move-in costs empty the first one on day one. This sizes the second against your essential expenses rather than against a blanket three-to-six-month rule.',
  },
]

export default function HowMuchRentCanIAffordPage() {
  return (
    <PageShell className="bg-canvas">
      {/* WebApplication + FAQPage for this route. BreadcrumbList is emitted by
          ToolBreadcrumb alongside the trail it describes. */}
      <ToolJsonLd href="/how-much-rent-can-i-afford" />
      {/* `tool` is the FREE_TOOLS slug, and the legacy event keeps its own name
          and params so saved GA4 reports don't drop to zero. */}
      <ToolPageView
        tool="rent"
        page="/how-much-rent-can-i-afford"
        legacyEvent="rent_tool_page_view"
        toolVersion="rent_tool_v1"
        pixelContentName="rent_tool"
      />

      {/* Hero + tool. The form used to sit third on the page, behind a
          four-step explainer — visitors arrive from social already knowing
          what they want, so the input comes first now. */}
      <Section variant="canvas" className="pt-28 md:pt-32 pb-10" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/how-much-rent-can-i-afford" />

            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              How much rent can I afford?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Don&apos;t let rent break your first paycheck. Turn a salary into a rent range you can actually live
              with — and see what life looks like before you sign a lease.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-subtle md:text-[17px]">
              This free calculator estimates federal, state and FICA tax for the state you will be working in,
              subtracts any monthly debt minimums, and applies a 28&ndash;35% band to what is left &mdash; take-home
              pay, not gross salary. The familiar 30% rule is quoted on gross income, which is why the number here is
              usually lower than the one a listing site gives you. It then shows the cash you need before you get
              keys, which is normally a little over two months&apos; rent once the deposit, moving costs and the gap
              before your first paycheck are counted.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-10 max-w-3xl scroll-mt-24">
            <OfferTool />
          </div>

          {/* YMYL disclosure — kept verbatim, directly under the widget that
              produces the numbers it qualifies. */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account needed · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How this rent affordability calculator works"
        intro="Five rules, and the third one is why this returns a smaller number than most rent calculators do."
        steps={STEPS}
      />

      {/* Reading the output. The calculator returns a range rather than a
          number, and a range with no guidance on which end to aim at is a
          number people round up. */}
      <Section variant="white" className="pt-0">
        <Container>
          <div className="mx-auto max-w-3xl">
            {/* Legacy funnel step. Fires once when this section scrolls into
                view — the event name and params predate the shared funnel and
                are referenced by saved GA4 reports, so both are unchanged. */}
            <ScrollBeacon
              event="scrolled_past_how_it_works"
              params={{ page: '/how-much-rent-can-i-afford', tool_version: 'rent_tool_v1' }}
            />

            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              How do you read the rent range?
            </h2>
            <p className="mb-6 text-base leading-relaxed text-subtle md:text-lg">
              The output is a band, not a single figure, because the honest answer to &ldquo;how much rent can I
              afford&rdquo; is a span with a comfortable end and a ceiling. Which end you land on decides what the
              rest of the month feels like.
            </p>

            <dl className="space-y-6">
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">The low end is the comfortable one</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  At 28% of take-home, rent leaves room for utilities, groceries, transport, minimum debt payments and
                  something going into savings without any of it requiring effort. Nothing about your budget has to
                  work perfectly for the month to work.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">The high end is a ceiling, not a target</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  At 35%, the rent is payable but the slack is gone. A car repair, a dental bill or two months between
                  jobs has nowhere to come from except a credit card, which is how a manageable lease becomes an
                  expensive one. Above 35% of take-home, the calculator is no longer describing a range you can carry.
                </dd>
              </div>
              <div>
                <dt className="mb-1.5 text-lg font-semibold text-ink">What a good result looks like</dt>
                <dd className="text-base leading-relaxed text-subtle md:text-lg">
                  Rent at or below the middle of your band, and the upfront figure already sitting in an account rather
                  than going on credit. The gap between the two ends of the band is real money every month, so the
                  calculator also shows what that difference would compound to over thirty years at a 7% annual real
                  return — a planning assumption, not a prediction, and the reason the choice between two apartments
                  is worth more than it looks.
                </dd>
              </div>
            </dl>
          </div>
        </Container>
      </Section>

      <Caveat label="What this can’t see:">
        what the apartment actually includes. Utilities, internet, renters insurance, parking, pet rent and the cost of
        the commute are all housing costs that sit outside the rent line, and a cheaper place with none of them
        included can cost more to live in than a pricier one where heat and water are covered. It also cannot see the
        landlord&apos;s own rule — most screen on gross income, commonly asking that you earn about three times the
        monthly rent, or forty times it annually in some markets — so a range built on take-home pay will usually be
        stricter than what you would be approved for.
      </Caveat>

      <ToolFaq href="/how-much-rent-can-i-afford" />

      <RelatedTools
        from="rent"
        items={RELATED}
        heading="What to work out next"
        intro="A rent number is one line in a monthly budget. These three decide whether it holds — and each one starts from a figure this page has already produced."
      />

      {/* The specific simplifications behind the numbers above. "Estimates
          only" on a page that prints a tax figure to the dollar is a label,
          not a disclosure. */}
      <Section variant="canvas" className="pt-0">
        <Container>
          <div className="mx-auto max-w-3xl border-t border-hairline pt-8">
            <h2 className="mb-3 text-lg font-bold tracking-[-0.015em] text-ink">
              What this calculator does not account for
            </h2>
            <p className="text-[15px] leading-relaxed text-subtle">
              Every figure here is an estimate for planning, not personalised financial advice. Tax is estimated for a
              single filer from federal brackets, your state&apos;s income tax and FICA; it does not model filing
              jointly, dependants, pre-tax deductions such as your own 401(k) or HSA contributions, itemised
              deductions, or the local and city income taxes that apply in places like New York City. Rent figures are
              market estimates for a metro area, not quotes for a specific apartment, and the 28&ndash;35% band is a
              convention rather than a lender or landlord requirement. WeLeap is not a registered investment adviser —
              for guidance on your own situation, speak to a licensed professional.
            </p>
          </div>
        </Container>
      </Section>

      <SiteFooter />
    </PageShell>
  )
}
