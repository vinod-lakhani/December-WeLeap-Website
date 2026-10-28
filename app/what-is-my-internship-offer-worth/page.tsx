import type { Metadata } from 'next'
import { InternshipOfferTool } from '@/components/InternshipOfferTool'
import { PageShell, Section, Container, SiteFooter } from '@/components/layout'
import { MethodSteps, Caveat, ToolFaq, type MethodStep } from '@/components/ToolExplainer'
import { ToolBreadcrumb } from '@/components/ToolBreadcrumb'
import { ToolJsonLd } from '@/components/ToolJsonLd'
import { ToolPageView } from '@/components/ToolPageView'
import { RelatedTools, type RelatedTool } from '@/components/RelatedTools'
import { RelatedReading, type RelatedArticle } from '@/components/RelatedReading'
import { TAX_YEAR_FIRST_PAYCHECK } from '@/lib/firstPaycheck/constants'
import { SUPPLEMENTAL_FEDERAL_RATE } from '@/lib/internship/calculation'

/**
 * /what-is-my-internship-offer-worth — what an internship pays, for the term.
 *
 * The same question as the full-time offer tool, one to two years earlier,
 * for a person who does not recognise themself in "job offer". The package
 * has none of the parts that tool prices and the question is different: not
 * what the package is worth a year, but what the term clears and whether the
 * summer is affordable in that city. So the headline is what is left after
 * housing.
 *
 * Built after a 19 Oct 2026 call with a university career center that gets
 * asked "how do I compare these offers" and had nothing better than Google
 * to point at. No campaign mode, on purpose: every prefilled hero on this
 * site has needed its completion gate repaired, and there is no paid campaign
 * behind this page.
 */

const DESCRIPTION =
  'Hourly, stipend or lump sum — see what an internship offer clears for the term, what payroll withholds and gives back, what housing takes, and what you keep. Free, no account.'

export const metadata: Metadata = {
  title: 'What is my internship offer worth? Free calculator',
  description: DESCRIPTION,
  alternates: { canonical: '/what-is-my-internship-offer-worth' },
  openGraph: {
    // Byte-identical to what `title` renders through the root layout's
    // `%s | WeLeap` template. scripts/checkMetadata.js fails the build on a
    // mismatch.
    title: 'What is my internship offer worth? Free calculator | WeLeap',
    description: DESCRIPTION,
    url: '/what-is-my-internship-offer-worth',
  },
}

const STEPS: readonly MethodStep[] = [
  {
    t: 'Pay is put on one footing first',
    d: 'An hourly rate, a monthly stipend and a single payment for the term are three shapes of the same thing. Hourly is rate × hours × weeks, with any overtime at time and a half; a stipend is the monthly figure × the months in the term; a lump sum is taken as given. The term is in weeks because that is how offers are written, and rent is monthly because that is how leases are written, so weeks are converted at 52 ÷ 12.',
  },
  {
    t: 'What payroll takes is worked out the way payroll works it out',
    d: `Withholding tables assume each paycheck's rate continues all year. So $25 an hour for 40 hours is withheld as though it were $52,000 of income, and the federal and state tax on that is charged for the share of the year you actually work. Social Security and Medicare are 7.65% on every dollar from the first. A one-off relocation or travel allowance is withheld at the flat ${Math.round(SUPPLEMENTAL_FEDERAL_RATE * 100)}% federal rate for supplemental pay rather than annualised, which is what payroll does with it. Brackets and the standard deduction are ${TAX_YEAR_FIRST_PAYCHECK} single-filer figures, the same table every other calculator on this site reads.`,
  },
  {
    t: 'What is actually owed is a different, smaller number — and it is shown',
    d: 'The term’s income, taken as the whole year’s, is taxed far less than the annualised figure: $12,000 on its own is under the standard deduction and owes no federal tax at all. The gap between what was withheld and what is owed comes back as a refund when you file, and this page shows that figure under the take-home rather than leaving it to a footnote. The one assumption is that this is the year’s only income, which for a student it usually is. Social Security and Medicare are never refunded.',
  },
  {
    t: 'A cash stipend is wages, and so is an allowance',
    d: 'A housing stipend paid in cash is taxable income and goes through the same tax as pay here. A relocation or travel allowance has been taxable since 2018 and is treated the same way. Housing the employer provides directly is counted as costing you nothing for the term; it is often a taxable benefit as well, which this page does not model and says so below.',
  },
  {
    t: 'Rent is a year-lease market rate, labelled as such',
    d: 'Once a city is chosen, the rent field is filled with the median rent in that metro from Zillow’s observed rent index. That is the price of a twelve-month lease. There is no reliable data source for summer sublets, which can be cheaper or dearer, so the figure is labelled rather than adjusted by a made-up factor, and the field takes whatever you actually know. The cash you need before the first paycheck — a deposit and the first month, usually due two to three weeks before any pay lands — is shown as a rule of thumb.',
  },
  {
    t: 'A 401(k), if there is one, is counted where the money goes',
    d: 'Most internships have no retirement plan, so the page asks rather than assumes. Where there is one, what you put in comes out of your pay before income tax — so it lowers federal and state withholding, though not Social Security and Medicare — and it leaves your take-home for the plan. The employer match is added on top, but only on what you contribute up to the cap, which is why the contribution is set to the cap unless you change it. One summer of both is compounded at 7% a year for forty years as a planning figure. The page also says what it cannot see: whether interns can join from the first paycheck, and whether the match vests before you leave.',
  },
  {
    t: 'The headline is what is left, not what is earned',
    d: 'Pay, minus what payroll takes, minus rent for the term. That is the figure that decides how the summer feels, and it is the one on which two offers most often swap places: a higher hourly rate in a more expensive city can leave less. The annualised equivalent is shown last and small, as a comparison aid against a full-time offer — it is the number recruiters use to make $45 an hour sound like $93,000, and it is not what you will earn.',
  },
]

const RELATED: readonly RelatedTool[] = [
  {
    href: '/what-is-my-job-offer-worth',
    why: 'When the full-time offer arrives it has parts an internship never does — a 401(k) match, equity, a bonus target. This prices those, so the hourly figure above and a salary can be held on the same scale.',
  },
  {
    href: '/how-much-rent-can-i-afford',
    why: 'This page takes a rent figure and tells you what is left. That one works the other way: from a salary to the rent range that fits it, plus the cash you need before you get keys.',
  },
  {
    href: '/how-should-i-split-my-paycheck',
    why: 'What the term leaves is the first money most people have had that is not already spoken for. This puts a buffer, any debt and a first savings habit in order for it.',
  },
]

const RELATED_READING: readonly RelatedArticle[] = [
  {
    href: '/resources/featured-article',
    why: 'Why a clear answer to "what do I do next" is so rarely available at the moment you actually need it.',
  },
]

export default function InternshipOfferWorthPage() {
  return (
    <PageShell className="bg-canvas">
      <ToolJsonLd href="/what-is-my-internship-offer-worth" />
      <ToolPageView tool="internship" page="/what-is-my-internship-offer-worth" toolVersion="internship_v1" />

      <Section variant="canvas" className="pb-10 pt-20 md:pt-32" isHero>
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <ToolBreadcrumb href="/what-is-my-internship-offer-worth" />
            <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
              What is my internship offer actually worth?
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-subtle">
              Hourly, stipend or one payment for the term. See what you clear, what payroll holds back and gives
              back, what housing takes, and what the summer actually leaves you.
            </p>
          </div>

          <div id="calculator" className="mx-auto mt-6 max-w-3xl scroll-mt-24">
            <InternshipOfferTool />
          </div>

          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-faint md:text-sm">
            Free · No account · No bank connection · Estimates only
          </p>
        </Container>
      </Section>

      <MethodSteps
        heading="How these numbers are worked out"
        intro="Seven rules, all published. Two of them are the reason this is its own page rather than a mode of the job-offer tool."
        summary={
          <>
            An internship has none of the parts a full-time package is priced on — no match, no equity, no bonus
            — and the question is different: not what it is worth a year, but what the term clears and whether
            you can afford to live there. This puts the pay on one footing, takes off what payroll actually
            withholds, shows what comes back at filing, takes off rent for the term, and leads with what is left.
          </>
        }
        steps={STEPS}
      />

      <Section variant="canvas">
        <Container>
          <div className="mx-auto max-w-3xl">
            <Caveat label="Where this stops">
              These are estimates for planning, not personalised financial, tax or legal advice, and WeLeap is not
              a registered investment adviser. Federal figures are {TAX_YEAR_FIRST_PAYCHECK} single-filer brackets
              and the standard deduction; the refund estimate assumes this is your only income for the year, so a
              part-time job during the semester changes it. State tax is an approximate flat rate for a single
              filer rather than a bracket calculation, and does not include city or county tax or the credit your
              home state may give for tax paid where you work. Employer-provided housing is often a taxable
              benefit; this page does not model that. Rent figures are year-lease market medians, not summer
              sublet prices. International internships and cities are outside what this works out.
            </Caveat>
          </div>
        </Container>
      </Section>

      <ToolFaq href="/what-is-my-internship-offer-worth" />

      <RelatedTools
        from="internship"
        items={RELATED}
        heading="Once the term is priced"
        intro="This page covers one internship and one summer. These cover what sits either side of it."
      />

      <RelatedReading from="internship" items={RELATED_READING} />

      <SiteFooter />
    </PageShell>
  )
}
