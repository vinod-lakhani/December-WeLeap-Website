import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE } from '@/lib/og-image'
import { PageShell, Section, Container, SiteFooter } from "@/components/layout"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { Button } from "@/components/ui/button"
import { FREE_TOOLS, TOOL_COUNT_WORD } from "@/lib/tools"
import { CategoryComparison } from "@/components/CategoryComparison"
import { ToolCard } from "@/components/ToolCard"

// The word form of TOOL_COUNT, capitalised for the start of a sentence. It
// deliberately does not name the current number: the last comment here spelled
// it out, and went stale the next time a tool shipped — which is the exact
// failure the derived count was added to end.
const COUNT_CAP = TOOL_COUNT_WORD.charAt(0).toUpperCase() + TOOL_COUNT_WORD.slice(1)

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
    images: [DEFAULT_OG_IMAGE],
  },
}


export default function ToolsPage() {
  return (
    <PageShell className="bg-canvas">
      <Section variant="canvas" isHero className="text-center">
        <Container maxWidth="narrow">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-2 text-[13.5px] font-semibold text-brand-700">
            Free · No account · No email wall
          </div>
          <h1 className="text-balance text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.035em] text-ink">
            Answer one money question in under a minute.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-subtle">
            {COUNT_CAP} calculators, built for decisions you're actually facing. Nothing to sign up for — use them, get your
            number, leave.
          </p>
        </Container>
      </Section>

      <Section variant="canvas" className="pt-0">
        <Container maxWidth="wide">
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

      <SiteFooter />
    </PageShell>
  )
}
