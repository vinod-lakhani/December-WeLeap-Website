import type { Metadata } from "next"
import Link from "next/link"
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import { FREE_TOOLS, TOOL_COUNT_WORD, TOOL_COUNT_WORD_CAP as COUNT_CAP } from "@/lib/tools"
import { CategoryComparison } from "@/components/CategoryComparison"
import { ToolCard } from "@/components/ToolCard"
import { JsonLd } from "@/components/JsonLd"
import { RelatedReading, type RelatedArticle } from "@/components/RelatedReading"
import { toolsBreadcrumbSchema, toolsItemListSchema } from "@/lib/structured-data"

// COUNT_CAP is the word form of TOOL_COUNT, capitalised for the start of a
// sentence. It deliberately does not name the current number: the last comment
// here spelled it out, and went stale the next time a tool shipped — which is
// the exact failure the derived count was added to end. It moved into
// lib/tools.ts when the social card needed the same string, because a second
// inline copy is how the first one went stale.

export const metadata: Metadata = {
  title: "Free money tools",
  alternates: { canonical: "/tools" },
  // Derived, like the two body-copy uses below. This string and the openGraph
  // one under it were the last hardcoded counts on the site, and they went
  // stale the moment an eighth tool shipped — on the page whose whole job is to
  // list them.
  description: `${COUNT_CAP} free calculators that answer a real money question in under a minute. Money age, rent affordability, offer letters, pay-in-4 decisions, credit card payoff and more. No account, no email wall.`,
  openGraph: {
    title: "Free money tools | WeLeap",
    description: `${COUNT_CAP} free calculators that answer a real money question in under a minute. No account, no email wall.`,
    url: "/tools",
    // No `images`. This segment has its own `opengraph-image.tsx` now, and a
    // same-segment file wins over the sitewide default — naming DEFAULT_OG_IMAGE
    // here would override it and put the generic card back, which is the defect
    // that file was added to fix. See lib/og-image.ts for why most routes DO
    // have to name it.
  },
}

/**
 * Home / Free money tools — the visible trail, and the BreadcrumbList that
 * describes it, from one place.
 *
 * Local to this file rather than a shared component because there is exactly
 * one hub. `ToolBreadcrumb` is the three-level version the ten leaves render,
 * and it takes a tool; this is the two-level version where the leaf IS /tools.
 */
function HubBreadcrumb() {
  return (
    <>
      <JsonLd data={toolsBreadcrumbSchema()} />
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[13.5px] text-faint">
          <li>
            <Link href="/" className="hover:text-brand-700 hover:underline underline-offset-2">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <span aria-current="page" className="text-subtle">
              Free money tools
            </span>
          </li>
        </ol>
      </nav>
    </>
  )
}

/**
 * Articles worth reading for somebody browsing the index rather than using one
 * calculator.
 *
 * The ten leaf pages each link the one or two articles that bear on their own
 * question. This page is read by someone who has not picked a tool yet, so the
 * pairings here are the ones about how to run money at all — which is the
 * actual reason a person is scanning a grid of calculators instead of opening
 * one. Nothing tool-specific, because that is what the cards above already are.
 *
 * It also gives /resources its first real inbound path from a page Google
 * fetches often — see components/RelatedReading.tsx. That is a side effect and
 * not the selection criterion; an article nobody would read from here would
 * still not belong here.
 */
const RELATED_READING: readonly RelatedArticle[] = [
  {
    href: '/resources/traditional-tools-fail',
    why: 'Why every tool above answers one question and stops, instead of being a budget. This is the argument the whole set is built on.',
  },
  {
    href: '/resources/awareness-to-action',
    why: 'A calculator hands you a number. This is about the harder part — what has to change once you have it.',
  },
  {
    href: '/resources/income-allocation',
    why: 'If you are not sure which tool you need, start here: where a paycheck should go, and in what order.',
  },
]


export default function ToolsPage() {
  return (
    <PageShell className="bg-canvas">
      {/* ItemList rather than WebApplication: this page is the list, not one of
          the things in it. See lib/structured-data.ts — both blocks are derived
          from FREE_TOOLS, so they describe exactly the cards rendered below. */}
      <JsonLd data={toolsItemListSchema()} />

      {/* pb trimmed from the shared hero's pb-16 md:pb-20 to roughly pay for
          the ordering line below, so adding it does not push the second row of
          cards under the fold. There was ~160px between the hero copy and the
          grid; it can spare this. The breadcrumb and subhead added since are
          paid for out of the same budget — hence pb-8, and the chip's margin
          coming in a step. */}
      <Section variant="canvas" isHero className="pb-8 text-center md:pb-10">
        <Container maxWidth="narrow">
          <HubBreadcrumb />
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Free · No account · No email wall
          </div>
          {/* The h1 says what the page is; the tagline is the subhead under it.
              It was the other way round, which left the single most important
              heading on the second-highest-priority URL in the sitemap sharing
              not one word with its own <title> — on a hub whose entire job is
              to rank for people looking for free money calculators. The tagline
              is the better sentence and it is still here, one line lower. */}
          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            {COUNT_CAP} free money calculators
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-balance text-[clamp(1.15rem,2vw,1.5rem)] font-bold leading-snug tracking-[-0.02em] text-ink">
            Answer one money question in under a minute.
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-subtle">
            Built for decisions you're actually facing. Nothing to sign up for — use them, get your number, leave.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="pt-0">
        <Container maxWidth="wide">
          {/* FREE_TOOLS is ordered as a life sequence — offer letter, then the
              benefits forms, then the plan, then rent, then the buffer. On a
              3x3 grid with no labels that reads as an unordered list, so a
              visitor who is not job-hunting meets two cards they cannot use
              and has no reason to think the third row is any different.

              One line is the cheap version of section headers: it makes the
              sequence legible for ~24px, where three headers would cost ~180px
              and split the grid into rows of 3, 4 and 2. */}
          <p className="mx-auto mb-6 max-w-3xl text-center text-[14.5px] leading-relaxed text-subtle">
            Listed roughly in the order you&rsquo;ll need them &mdash; offer letter, first paycheck, then everything after.
          </p>

          {/* Centred wrap rather than a grid: an odd count in three columns
              left an orphan hanging off the left of the last row. This centres
              the trailing row and survives the count changing again. */}
          <div className="flex flex-wrap justify-center gap-5">
            {FREE_TOOLS.map((t) => (
              <div
                key={t.href}
                className="flex basis-full sm:basis-[calc(50%-10px)] lg:basis-[calc(33.333%-13.34px)]"
              >
                <ToolCard tool={t} surface="tools_page" background="white" headingLevel="h2" />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-16 max-w-3xl rounded-card border border-brand-100 bg-brand-50 p-8 text-center md:p-10">
            <h2 className="text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              These answer one question. WeLeap answers what to do next.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[16.5px] leading-relaxed text-subtle">
              Connect your accounts and Ribbit looks at the whole picture — cash, debt, 401(k), goals — then shows you
              the single move that does the most.
            </p>
            <div className="mt-7">
              <EarlyAccessDialog signupType="tools" placement="tools_cta">
                <Button className="rounded-full bg-brand-700 px-9 py-[17px] text-[17px] font-bold text-white shadow-pill transition hover:-translate-y-px hover:bg-brand-800">
                  Get your first Leap →
                </Button>
              </EarlyAccessDialog>
            </div>
            <p className="mt-4 text-[13.5px] text-faint">Free to start · No card · You approve every move</p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <h2 className="mb-4 text-balance text-[clamp(1.6rem,2.6vw,2.1rem)] font-extrabold leading-tight tracking-[-0.025em] text-ink">
              What is WeLeap?
            </h2>
            <p className="mb-4 max-w-3xl text-[16.5px] leading-relaxed text-subtle">
              WeLeap is a personal finance app built around <strong className="font-semibold text-ink">Ribbit</strong>,
              an AI financial sidekick for people in their twenties and early thirties. You connect your accounts
              through Plaid with read-only access, and Ribbit reads the whole picture — cash, debt, 401(k), goals —
              then names the single highest-value move to make next. That move is called a Leap. You approve it before
              anything happens; nothing is automatic and no money moves on its own.
            </p>
            <p className="mb-8 max-w-3xl text-[16.5px] leading-relaxed text-subtle">
              WeLeap is free during early access and needs no card. The {TOOL_COUNT_WORD} calculators above are free
              permanently and need no account at all. WeLeap is not a registered investment adviser, does not provide
              personalized investment advice, and does not sell your data.
            </p>

            <h3 className="mb-4 text-lg font-bold tracking-[-0.015em] text-ink">
              How WeLeap differs from budgeting apps and robo-advisers
            </h3>
            <CategoryComparison />
          </div>

          <p className="mt-10 text-center text-[13px] leading-relaxed text-faint">
            These tools give estimates to help you think, not financial advice. WeLeap is not a registered investment
            adviser.
          </p>
        </Container>
      </Section>

      <RelatedReading from="tools_page" items={RELATED_READING} />

      <SiteFooter />
    </PageShell>
  )
}
